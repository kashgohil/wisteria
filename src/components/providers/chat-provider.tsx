"use client";

import { useChatMessages } from "@/hooks/use-chat-messages";
import { useUserId } from "@/hooks/use-user-id";
import { useChat, type UIMessage } from "@ai-sdk/react";
import { useQueryClient } from "@tanstack/react-query";
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
	projectId: string | undefined;
	isLoadingMessages: boolean;
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
	projectId,
}: {
	children: ReactNode;
	initialChatId?: string;
	initialMessages?: UIMessage[];
	projectId?: string;
}) {
	const [model, setModel] = useState("google/gemini-2.5-flash-lite");
	const [input, setInput] = useState("");
	const [chatId, setChatIdState] = useState<string | undefined>(initialChatId);
	const [isInitialized, setIsInitialized] = useState(false);
	const queryClient = useQueryClient();
	const userId = useUserId();

	// Use React Query to fetch messages with caching
	const { data: cachedMessages, isLoading: isLoadingMessages } =
		useChatMessages(chatId);

	const modelRef = useRef(model);
	useEffect(() => {
		modelRef.current = model;
	}, [model]);

	const chatIdRef = useRef(chatId);
	useEffect(() => {
		chatIdRef.current = chatId;
	}, [chatId]);

	const projectIdRef = useRef(projectId);
	useEffect(() => {
		projectIdRef.current = projectId;
	}, [projectId]);

	// Track which chatId we've loaded messages for
	const loadedChatIdRef = useRef<string | undefined>(undefined);

	const {
		messages,
		sendMessage: originalSendMessage,
		setMessages,
		status,
		stop,
		error,
	} = useChat({
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
						projectId: projectIdRef.current,
						userId,
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
					const basePath = projectIdRef.current
						? `/project/${projectIdRef.current}/chat`
						: "/chat";
					window.history.replaceState(null, "", `${basePath}/${newChatId}`);
				}
				return response;
			},
		}),
		onError: (error) => {
			console.error("Chat error:", error);
		},
		onFinish: () => {
			// Invalidate the query to refetch messages after streaming completes
			if (chatIdRef.current && userId) {
				queryClient.invalidateQueries({
					queryKey: ["chat-messages", chatIdRef.current, userId],
				});
			}
		},
	});

	// Wrap sendMessage to convert from our format to AI SDK format
	const sendMessage = useCallback(
		(params: { text: string }) => {
			originalSendMessage({
				role: "user",
				parts: [{ type: "text", text: params.text }],
			});
		},
		[originalSendMessage],
	);

	// Initialize chat with a specific chatId and optionally load messages
	const initializeChat = useCallback(
		(newChatId: string | undefined, newInitialMessages?: UIMessage[]) => {
			// If we're already on this chat and messages are loaded, don't do anything
			if (
				newChatId === chatIdRef.current &&
				loadedChatIdRef.current === newChatId &&
				newChatId !== undefined
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
			} else if (newChatId) {
				// Always try to load messages for a chat, even if we think we've loaded it
				// React Query will handle fetching with caching
				// Check if we have cached data
				if (!userId) return;
				const cachedData = queryClient.getQueryData<UIMessage[]>([
					"chat-messages",
					newChatId,
					userId,
				]);

				if (cachedData) {
					// Use cached messages immediately
					setMessages(cachedData);
					loadedChatIdRef.current = newChatId;
				} else {
					// Clear messages while loading
					setMessages([]);
				}
				// React Query hook will handle the fetch if needed
			} else if (!newChatId) {
				// New chat - clear messages
				setMessages([]);
				loadedChatIdRef.current = undefined;
			}
			setIsInitialized(true);
		},
		[setMessages, queryClient],
	);

	// Set chatId without triggering message load (for URL updates)
	const setChatId = useCallback((newChatId: string | undefined) => {
		setChatIdState(newChatId);
		chatIdRef.current = newChatId;
	}, []);

	// Sync cached messages with chat state when they're loaded
	useEffect(() => {
		if (
			cachedMessages &&
			chatId &&
			loadedChatIdRef.current !== chatId &&
			!isLoadingMessages
		) {
			setMessages(cachedMessages);
			loadedChatIdRef.current = chatId;
		}
	}, [cachedMessages, chatId, isLoadingMessages, setMessages]);

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
				projectId,
				isLoadingMessages,
			}}
		>
			{children}
		</ChatContext.Provider>
	);
}
