"use client";

import { getAnonymousId } from "@/hooks/use-anonymous-id";
import { useChat, type UIMessage } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import {
	createContext,
	useCallback,
	useContext,
	useEffect,
	useRef,
	useState,
	type ReactNode,
} from "react";

interface ChatContextType {
	messages: UIMessage[];
	sendMessage: (params: { text: string }) => void;
	setMessages: (messages: UIMessage[]) => void;
	status: "streaming" | "submitted" | "ready" | "error";
	stop: () => void;
	error: Error | undefined;
	input: string;
	setInput: (input: string) => void;
	model: string;
	setModel: (model: string) => void;
	chatId: string | undefined;
	setChatId: (chatId: string | undefined) => void;
	initializeChat: (
		chatId: string | undefined,
		initialMessages?: UIMessage[],
	) => void;
}

const ChatContext = createContext<ChatContextType | null>(null);

export function useChatContext() {
	const context = useContext(ChatContext);
	if (!context) {
		throw new Error("useChatContext must be used within a ChatProvider");
	}
	return context;
}

export function ChatProvider({
	children,
	initialChatId,
	initialMessages = [],
}: {
	children: ReactNode;
	initialChatId?: string;
	initialMessages?: UIMessage[];
}) {
	const [model, setModel] = useState("google/gemini-2.5-flash-lite");
	const [input, setInput] = useState("");
	const [chatId, setChatIdState] = useState<string | undefined>(initialChatId);
	const [isInitialized, setIsInitialized] = useState(false);

	const modelRef = useRef(model);
	useEffect(() => {
		modelRef.current = model;
	}, [model]);

	const chatIdRef = useRef(chatId);
	useEffect(() => {
		chatIdRef.current = chatId;
	}, [chatId]);

	// Track which chatId we've loaded messages for
	const loadedChatIdRef = useRef<string | undefined>(undefined);

	const { messages, sendMessage, setMessages, status, stop, error } = useChat({
		// Use a single stable id for the chat hook to prevent remounting
		id: "wisteria-chat",
		transport: new DefaultChatTransport({
			api: "/api/chat",
			prepareSendMessagesRequest: async ({ messages }) => {
				return {
					body: {
						messages,
						model: modelRef.current,
						chatId: chatIdRef.current,
						anonymousId: getAnonymousId(),
					},
				};
			},
			fetch: async (url, options) => {
				const response = await fetch(url, options);
				// When a new chat is created, update the chatId and URL
				const newChatId = response.headers.get("X-Chat-Id");
				if (newChatId && !chatIdRef.current) {
					setChatIdState(newChatId);
					chatIdRef.current = newChatId;
					loadedChatIdRef.current = newChatId;
					// Update URL without navigation/remount using history API
					window.history.replaceState(null, "", `/chat/${newChatId}`);
				}
				return response;
			},
		}),
		onError: (error) => {
			console.error("Chat error:", error);
		},
	});

	// Initialize chat with a specific chatId and optionally load messages
	const initializeChat = useCallback(
		(newChatId: string | undefined, newInitialMessages?: UIMessage[]) => {
			// If we're already on this chat, don't do anything (preserves streaming state)
			if (
				newChatId === chatIdRef.current &&
				loadedChatIdRef.current === newChatId
			) {
				setIsInitialized(true);
				return;
			}

			// If we're switching to a different chat
			if (newChatId !== chatIdRef.current) {
				setChatIdState(newChatId);
				chatIdRef.current = newChatId;
			}

			if (newInitialMessages && newInitialMessages.length > 0) {
				setMessages(newInitialMessages);
				loadedChatIdRef.current = newChatId;
			} else if (newChatId && loadedChatIdRef.current !== newChatId) {
				// Need to fetch messages for this chat
				const anonymousId = getAnonymousId();
				fetch(
					`/api/chat/${newChatId}?anonymousId=${encodeURIComponent(anonymousId)}`,
				)
					.then((res) => res.json())
					.then((data) => {
						setMessages(data);
						loadedChatIdRef.current = newChatId;
					})
					.catch((error) => console.error("Failed to load messages:", error));
			} else if (!newChatId) {
				// New chat - clear messages
				setMessages([]);
				loadedChatIdRef.current = undefined;
			}
			setIsInitialized(true);
		},
		[setMessages],
	);

	// Set chatId without triggering message load (for URL updates)
	const setChatId = useCallback((newChatId: string | undefined) => {
		setChatIdState(newChatId);
		chatIdRef.current = newChatId;
	}, []);

	// Initialize on mount with initial messages if provided
	useEffect(() => {
		if (!isInitialized) {
			if (initialMessages.length > 0) {
				setMessages(initialMessages);
				loadedChatIdRef.current = initialChatId;
			}
			setIsInitialized(true);
		}
	}, [initialChatId, initialMessages, isInitialized, setMessages]);

	return (
		<ChatContext.Provider
			value={{
				messages,
				sendMessage,
				setMessages,
				status,
				stop,
				error,
				input,
				setInput,
				model,
				setModel,
				chatId,
				setChatId,
				initializeChat,
			}}
		>
			{children}
		</ChatContext.Provider>
	);
}
