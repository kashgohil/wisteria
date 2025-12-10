import { ipcMain } from "electron";
import { randomUUID } from "node:crypto";
import {
	appendMessage,
	createChat,
	createProject,
	deleteChat,
	deleteProject,
	listAllChats,
	listChats,
	listMessages,
	listProjects,
	readKey,
	deleteKey,
	listKeys,
	saveKey,
	updateChat,
	updateProject,
} from "./db";
import {
	ChatModelRequest,
	listAnthropicModels,
	listLmStudioModels,
	listOllamaModels,
	listOpenAIModels,
	listOpenRouterDefaults,
	sendToModel,
} from "./models/connectors";
import { PROVIDER_KEY_MAP } from "../shared/providers";

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
		const [ollama, lmstudio, openai, anthropic, openrouter] = await Promise.all([
			listOllamaModels(),
			listLmStudioModels(),
			listOpenAIModels(),
			listAnthropicModels(),
			listOpenRouterDefaults(),
		]);
		return [...ollama, ...lmstudio, ...openai, ...anthropic, ...openrouter];
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
}
