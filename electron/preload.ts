import { contextBridge, ipcRenderer } from "electron";
import type {
	ChatModelRequest,
	ChatModelResponse,
	ModelInfo,
} from "../shared/models";
import type { Chat, Message, Project } from "./db";

export type ProjectUpdate = Partial<Pick<Project, "name" | "system_prompt">>;

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
		list: (projectId?: string | null) =>
			ipcRenderer.invoke("chats:list", projectId ?? null) as Promise<Chat[]>,
		listAll: () => ipcRenderer.invoke("chats:listAll") as Promise<Chat[]>,
		create: (projectId: string | null, name: string) =>
			ipcRenderer.invoke("chats:create", projectId, name) as Promise<Chat>,
		update: (
			chatId: string,
			data: Partial<Pick<Chat, "name" | "project_id">>,
		) =>
			ipcRenderer.invoke("chats:update", chatId, data) as Promise<Chat | null>,
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
		list: () => ipcRenderer.invoke("models:list") as Promise<ModelInfo[]>,
		send: (payload: ChatModelRequest) =>
			ipcRenderer.invoke("models:send", payload) as Promise<ChatModelResponse>,
		onStreamChunk: (
			handler: (payload: {
				requestId: string;
				delta: string;
				content: string;
			}) => void,
		) => {
			const listener = (
				_event: unknown,
				payload: { requestId: string; delta: string; content: string },
			) => handler(payload);
			ipcRenderer.on("models:stream-chunk", listener);
			return () => ipcRenderer.removeListener("models:stream-chunk", listener);
		},
		onStreamDone: (
			handler: (payload: { requestId: string; content: string }) => void,
		) => {
			const listener = (
				_event: unknown,
				payload: { requestId: string; content: string },
			) => handler(payload);
			ipcRenderer.on("models:stream-done", listener);
			return () => ipcRenderer.removeListener("models:stream-done", listener);
		},
		onStreamError: (
			handler: (payload: { requestId: string; error: string }) => void,
		) => {
			const listener = (
				_event: unknown,
				payload: { requestId: string; error: string },
			) => handler(payload);
			ipcRenderer.on("models:stream-error", listener);
			return () => ipcRenderer.removeListener("models:stream-error", listener);
		},
	},
	keys: {
		set: (key: string, value: string) =>
			ipcRenderer.invoke("keys:set", key, value) as Promise<boolean>,
		get: (key: string) =>
			ipcRenderer.invoke("keys:get", key) as Promise<string | null>,
		delete: (key: string) =>
			ipcRenderer.invoke("keys:delete", key) as Promise<boolean>,
		list: () =>
			ipcRenderer.invoke("keys:list") as Promise<
				{ key: string; value: string }[]
			>,
	},
};

contextBridge.exposeInMainWorld("wisteria", api);
