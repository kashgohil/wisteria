import { contextBridge, ipcRenderer } from "electron";
import type { Chat, Message, Project } from "./db";
import type { ChatModelRequest, ChatModelResponse } from "./models/connectors";

export type ProjectUpdate = Partial<
	Pick<Project, "name" | "system_prompt" | "model_provider" | "model_id">
>;

const api = {
	projects: {
		list: () => ipcRenderer.invoke("projects:list") as Promise<Project[]>,
		create: (name: string) =>
			ipcRenderer.invoke("projects:create", name) as Promise<Project>,
		update: (projectId: string, data: ProjectUpdate) =>
			ipcRenderer.invoke(
				"projects:update",
				projectId,
				data,
			) as Promise<Project | null>,
		delete: (projectId: string) =>
			ipcRenderer.invoke("projects:delete", projectId) as Promise<boolean>,
	},
	chats: {
		list: (projectId: string) =>
			ipcRenderer.invoke("chats:list", projectId) as Promise<Chat[]>,
		create: (projectId: string, name: string) =>
			ipcRenderer.invoke("chats:create", projectId, name) as Promise<Chat>,
		delete: (chatId: string) =>
			ipcRenderer.invoke("chats:delete", chatId) as Promise<boolean>,
	},
	messages: {
		list: (chatId: string) =>
			ipcRenderer.invoke("messages:list", chatId) as Promise<Message[]>,
		append: (chatId: string, role: Message["role"], content: string) =>
			ipcRenderer.invoke(
				"messages:append",
				chatId,
				role,
				content,
			) as Promise<Message>,
	},
	models: {
		list: () =>
			ipcRenderer.invoke("models:list") as Promise<
				{ id: string; label: string; provider: string }[]
			>,
		send: (payload: ChatModelRequest) =>
			ipcRenderer.invoke("models:send", payload) as Promise<ChatModelResponse>,
	},
	keys: {
		set: (key: string, value: string) =>
			ipcRenderer.invoke("keys:set", key, value) as Promise<boolean>,
		get: (key: string) =>
			ipcRenderer.invoke("keys:get", key) as Promise<string | null>,
	},
};

contextBridge.exposeInMainWorld("wisteria", api);
