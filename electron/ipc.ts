import { ipcMain } from "electron";
import { randomUUID } from "node:crypto";
import type { ChatModelRequest } from "../shared/models";
import { PROVIDER_KEY_MAP } from "../shared/providers";
import {
  appendMessage,
  createAttachment,
  createChat,
  createProject,
  deleteAttachment as deleteAttachmentDb,
  deleteChat,
  deleteKey,
  deleteProject,
  getAttachment,
  listAllAttachments,
  listAllChats,
  listAttachmentsByMessage,
  listChats,
  listKeys,
  listMessages,
  listProjects,
  readKey,
  saveKey,
  updateChat,
  updateProject,
} from "./db";
import {
  listAnthropicModels,
  listGeminiModels,
  listGrokModels,
  listGroqModels,
  listLlamaCppModels,
  listLmStudioModels,
  listOllamaModels,
  listOpenAIModels,
  listOpenRouterModels,
  sendToModel,
} from "./models/connectors";
import { deleteAttachment, getAttachmentPath, saveAttachment } from "./storage";

export function registerIpcHandlers() {
  ipcMain.handle("projects:list", () => listProjects());

  ipcMain.handle("projects:create", (_event, name: string) => {
    return createProject(name);
  });

  ipcMain.handle(
    "projects:update",
    (_event, projectId: string, data: Parameters<typeof updateProject>[1]) => {
      return updateProject(projectId, data);
    },
  );

  ipcMain.handle("projects:delete", (_event, projectId: string) => {
    deleteProject(projectId);
    return true;
  });

  ipcMain.handle("chats:list", (_event, projectId: string | null = null) =>
    listChats(projectId),
  );

  ipcMain.handle("chats:listAll", () => listAllChats());

  ipcMain.handle(
    "chats:create",
    (_event, projectId: string | null, name: string) =>
      createChat(projectId, name),
  );

  ipcMain.handle(
    "chats:update",
    (_event, chatId: string, data: Parameters<typeof updateChat>[1]) => {
      return updateChat(chatId, data);
    },
  );

  ipcMain.handle("chats:delete", (_event, chatId: string) => {
    deleteChat(chatId);
    return true;
  });

  ipcMain.handle("messages:list", (_event, chatId: string) =>
    listMessages(chatId),
  );

  ipcMain.handle(
    "messages:append",
    (
      _event,
      chatId: string,
      role: "user" | "assistant" | "system",
      content: string,
    ) => appendMessage(chatId, role, content),
  );

  ipcMain.handle("models:list", async () => {
    const [
      ollama,
      lmstudio,
      llamacpp,
      openai,
      anthropic,
      gemini,
      grok,
      groq,
      openrouter,
    ] = await Promise.all([
      listOllamaModels(),
      listLmStudioModels(),
      listLlamaCppModels(),
      listOpenAIModels(readKey("openai_api_key")),
      listAnthropicModels(readKey("anthropic_api_key")),
      listGeminiModels(readKey("gemini_api_key")),
      listGrokModels(readKey("grok_api_key")),
      listGroqModels(readKey("groq_api_key")),
      listOpenRouterModels(readKey("openrouter_api_key")),
    ]);
    return [
      ...ollama,
      ...lmstudio,
      ...llamacpp,
      ...openai,
      ...anthropic,
      ...gemini,
      ...grok,
      ...groq,
      ...openrouter,
    ];
  });

  ipcMain.handle(
    "models:send",
    async (event, payload: ChatModelRequest & { stream?: boolean }) => {
      const keyName = PROVIDER_KEY_MAP[payload.provider] ?? null;
      const apiKey = keyName ? readKey(keyName) : null;
      const requestId = payload.requestId ?? randomUUID();

      if (!payload.stream) {
        return sendToModel({ ...payload, apiKey, requestId });
      }

      let lastContent = "";
      try {
        const response = await sendToModel(
          { ...payload, apiKey, requestId, stream: true },
          {
            onDelta: (delta) => {
              lastContent += delta;
              event.sender.send("models:stream-chunk", {
                requestId,
                delta,
                content: lastContent,
              });
            },
          },
        );
        event.sender.send("models:stream-done", {
          requestId,
          content: response.content,
          images: response.images,
        });
        return response;
      } catch (err) {
        event.sender.send("models:stream-error", {
          requestId,
          error: String(err),
        });
        throw err;
      }
    },
  );

  ipcMain.handle("keys:set", (_event, key: string, value: string) => {
    saveKey(key, value);
    return true;
  });

  ipcMain.handle("keys:delete", (_event, key: string) => {
    deleteKey(key);
    return true;
  });

  ipcMain.handle("keys:get", (_event, key: string) => {
    return readKey(key);
  });

  ipcMain.handle("keys:list", () => {
    return listKeys();
  });

  // Attachment handlers
  ipcMain.handle(
    "attachments:upload",
    async (
      _event,
      chatId: string,
      messageId: string,
      fileBuffer: ArrayBuffer,
      fileName: string,
      mimeType: string,
    ) => {
      // Convert ArrayBuffer to Buffer
      const buffer = Buffer.from(fileBuffer);

      // Save file to disk
      const relativePath = await saveAttachment(
        chatId,
        buffer,
        fileName,
        mimeType,
      );

      // Create database record
      const attachment = createAttachment(
        messageId,
        fileName,
        mimeType,
        relativePath,
        buffer.length,
      );

      return attachment;
    },
  );

  ipcMain.handle(
    "attachments:list",
    (
      _event,
      filters?: {
        chatId?: string;
        type?: string;
      },
    ) => {
      return listAllAttachments(filters);
    },
  );

  ipcMain.handle("attachments:getByMessage", (_event, messageId: string) => {
    return listAttachmentsByMessage(messageId);
  });

  ipcMain.handle("attachments:getPath", (_event, attachmentId: string) => {
    const attachment = getAttachment(attachmentId);
    if (!attachment) {
      throw new Error(`Attachment not found: ${attachmentId}`);
    }
    return getAttachmentPath(attachment.file_path);
  });

  ipcMain.handle("attachments:delete", async (_event, attachmentId: string) => {
    const attachment = getAttachment(attachmentId);
    if (!attachment) {
      throw new Error(`Attachment not found: ${attachmentId}`);
    }

    // Delete file from disk
    await deleteAttachment(attachment.file_path);

    // Delete database record
    deleteAttachmentDb(attachmentId);

    return true;
  });
}
