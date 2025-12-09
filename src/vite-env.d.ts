/// <reference types="vite/client" />

import type { Chat, Message, Project } from "../electron/db";
import type {
	ChatModelRequest,
	ChatModelResponse,
} from "../electron/models/connectors";
import type { ProjectUpdate } from "../electron/preload";

declare global {
	interface Window {
		wisteria: {
			projects: {
				list: () => Promise<Project[]>;
				create: (name: string) => Promise<Project>;
				update: (
					projectId: string,
					data: ProjectUpdate,
				) => Promise<Project | null>;
				delete: (projectId: string) => Promise<boolean>;
			};
			chats: {
				list: (projectId: string) => Promise<Chat[]>;
				create: (projectId: string, name: string) => Promise<Chat>;
				delete: (chatId: string) => Promise<boolean>;
			};
			messages: {
				list: (chatId: string) => Promise<Message[]>;
				append: (
					chatId: string,
					role: Message["role"],
					content: string,
				) => Promise<Message>;
			};
			models: {
				list: () => Promise<{ id: string; label: string; provider: string }[]>;
				send: (payload: ChatModelRequest) => Promise<ChatModelResponse>;
				onStreamChunk: (
					handler: (payload: {
						requestId: string;
						delta: string;
						content: string;
					}) => void,
				) => () => void;
				onStreamDone: (
					handler: (payload: { requestId: string; content: string }) => void,
				) => () => void;
				onStreamError: (
					handler: (payload: { requestId: string; error: string }) => void,
				) => () => void;
			};
			keys: {
				set: (key: string, value: string) => Promise<boolean>;
				get: (key: string) => Promise<string | null>;
			};
		};
	}
}
