"use client";

import { useChatMessages } from "@/hooks/use-chat-messages";
import { useUserId } from "@/hooks/use-user-id";
import { useChat, type UIMessage } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { usePathname, useRouter } from "next/navigation";
import {
	createContext,
	useCallback,
	useContext,
	useEffect,
	useMemo,
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
	const userId = useUserId();
	const router = useRouter();
	const pathname = usePathname();
	const pathnameRef = useRef(pathname);

	// Keep pathname ref in sync
	useEffect(() => {
		pathnameRef.current = pathname;
	}, [pathname]);

	// Use Convex real-time queries for messages
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

	// Cache messages by chatId for instant display when navigating back
	const messagesCacheRef = useRef<Map<string, UIMessage[]>>(new Map());

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
				// If chatId wasn't set (backend created it), update it and redirect
				const newChatId = response.headers.get("X-Chat-Id");
				if (newChatId && !chatIdRef.current) {
					setChatIdState(newChatId);
					chatIdRef.current = newChatId;
					loadedChatIdRef.current = newChatId;
					// Redirect to the appropriate chat page
					const currentProjectId = projectIdRef.current;
					if (currentProjectId) {
						// If we're in a project context, redirect to project chat URL
						router.push(`/project/${currentProjectId}/chat/${newChatId}`);
					} else if (pathnameRef.current === "/chat") {
						// Otherwise, redirect to standalone chat URL
						router.push(`/chat/${newChatId}`);
					}
				}
				return response;
			},
		}),
		onError: (error) => {
			console.error("Chat error:", error);
		},
		onFinish: () => {
			// Messages are now updated via Convex real-time queries, no need to invalidate
		},
	});

	// Wrap sendMessage to handle chat creation on /chat page
	const sendMessage = useCallback(
		async (params: { text: string }) => {
			// Send the message (this will trigger the API call)
			// The backend will create the chat if chatId is not provided
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
				// Cache the initial messages
				if (newChatId) {
					messagesCacheRef.current.set(newChatId, newInitialMessages);
				}
				loadedChatIdRef.current = newChatId;
			} else if (newChatId) {
				// Check cache first for instant display
				const cached = messagesCacheRef.current.get(newChatId);
				if (cached) {
					// Use cached messages immediately while Convex query loads
					setMessages(cached);
				} else {
					// Clear messages while loading - Convex real-time query will update them
					setMessages([]);
				}
				// Convex useQuery will handle fetching with real-time updates
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

	// Update loadedChatIdRef when chatId changes
	useEffect(() => {
		if (chatId) {
			loadedChatIdRef.current = chatId;
		}
	}, [chatId]);

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

	// Update cache when we receive new messages from Convex (source of truth)
	useEffect(() => {
		if (cachedMessages && chatId) {
			messagesCacheRef.current.set(chatId, cachedMessages);
		}
	}, [cachedMessages, chatId]);

	// Use Convex messages for UI, but keep useChat messages for streaming status
	// This prevents conflicts between stream updates and DB updates
	// Use cached messages if available while loading, otherwise use current messages
	const displayMessages = useMemo(() => {
		if (cachedMessages && chatId) {
			// We have fresh data from Convex, use it
			return cachedMessages;
		}

		// If loading and we have cached messages, show cached version
		if (isLoadingMessages && chatId) {
			const cached = messagesCacheRef.current.get(chatId);
			if (cached) {
				return cached;
			}
		}

		// Fall back to useChat messages (for streaming)
		return messages;
	}, [cachedMessages, chatId, isLoadingMessages, messages]);

	return (
		<ChatContext.Provider
			value={{
				messages: displayMessages,
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
