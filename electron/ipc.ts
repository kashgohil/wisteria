import { ipcMain } from "electron";
import { randomUUID } from "node:crypto";
import {
	appendMessage,
	createChat,
	createProject,
	deleteChat,
	deleteProject,
	listChats,
	listMessages,
	listProjects,
	readKey,
	saveKey,
	updateProject,
} from "./db";
import {
	ChatModelRequest,
	listLmStudioModels,
	listOllamaModels,
	sendToModel,
} from "./models/connectors";

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

	ipcMain.handle("chats:list", (_event, projectId: string) =>
		listChats(projectId),
	);

	ipcMain.handle("chats:create", (_event, projectId: string, name: string) =>
		createChat(projectId, name),
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
		const [ollama, lmstudio] = await Promise.all([
			listOllamaModels(),
			listLmStudioModels(),
		]);
		// Provide a small set of helpful OpenRouter defaults
		const openrouter = [
			{
				id: "openrouter/auto",
				label: "OpenRouter Auto",
				provider: "openrouter" as const,
			},
			{
				id: "anthropic/claude-3.5-sonnet",
				label: "Claude 3.5 Sonnet (OpenRouter)",
				provider: "openrouter" as const,
			},
		];
		return [...ollama, ...lmstudio, ...openrouter];
	});

	ipcMain.handle(
		"models:send",
		async (event, payload: ChatModelRequest & { stream?: boolean }) => {
			const apiKey =
				payload.provider === "openrouter"
					? readKey("openrouter_api_key")
					: null;
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

	ipcMain.handle("keys:get", (_event, key: string) => {
		return readKey(key);
	});
}
