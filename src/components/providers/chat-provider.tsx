"use client";

import { useChatMessages } from "@/hooks/use-chat-messages";
import { useUserId } from "@/hooks/use-user-id";
import type { UIMessage } from "@ai-sdk/react";
import { useRouter } from "next/navigation";
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

	initialMessages = [],
	projectId,
}: {
	children: ReactNode;

	initialMessages?: UIMessage[];
	projectId?: string;
}) {
	const [model, setModel] = useState("google/gemini-2.5-flash-lite");
	const [input, setInput] = useState("");
	const [chatId, setChatIdState] = useState<string | undefined>();
	const [isInitialized, setIsInitialized] = useState(false);

	const userId = useUserId();
	const router = useRouter();

	// Use Convex real-time queries for messages
	const { data: cachedMessages, isLoading: isLoadingMessages } =
		useChatMessages(chatId);

	// Track which chatId we've loaded messages for (to prevent unnecessary reloads)
	const loadedChatIdRef = useRef<string | undefined>(undefined);

	// Local messages state for setMessages (for initial messages before Convex loads)
	const [localMessages, setLocalMessages] = useState<UIMessage[]>([]);

	// Status and error management
	const [status, setStatus] = useState<
		"streaming" | "submitted" | "ready" | "error"
	>("ready");
	const [error, setError] = useState<Error | undefined>(undefined);
	const abortControllerRef = useRef<AbortController | null>(null);

	// Stop function to abort ongoing requests
	const stop = useCallback(() => {
		if (abortControllerRef.current) {
			abortControllerRef.current.abort();
			abortControllerRef.current = null;
			setStatus("ready");
		}
	}, []);

	// Send message function
	const sendMessage = useCallback(
		async (params: { text: string }) => {
			// Abort any ongoing request
			if (abortControllerRef.current) {
				abortControllerRef.current.abort();
			}

			// Create new abort controller for this request
			const abortController = new AbortController();
			abortControllerRef.current = abortController;

			setStatus("submitted");
			setError(undefined);

			try {
				// Get current messages from Convex or local state
				// useChatMessages already handles caching internally
				const currentMessages = cachedMessages || localMessages;

				// Prepare the request body
				const requestBody = {
					messages: currentMessages,
					model,
					chatId,
					projectId,
					userId,
				};

				// Add the new user message to the request
				const userMessage: UIMessage = {
					id: `temp-${Date.now()}`,
					role: "user",
					parts: [{ type: "text", text: params.text }],
				};

				requestBody.messages = [...currentMessages, userMessage];

				// Make the API call
				const response = await fetch("/api/chat", {
					method: "POST",
					headers: {
						"Content-Type": "application/json",
					},
					body: JSON.stringify(requestBody),
					signal: abortController.signal,
				});

				// Check if request was aborted
				if (abortController.signal.aborted) {
					return;
				}

				if (!response.ok) {
					const errorData = await response.json().catch(() => ({}));
					throw new Error(
						errorData.error || `HTTP error! status: ${response.status}`,
					);
				}

				// If chatId wasn't set (backend created it), update it and redirect
				const newChatId = response.headers.get("X-Chat-Id");
				if (newChatId && !chatId) {
					setChatIdState(newChatId);
					loadedChatIdRef.current = newChatId;
					// Redirect to the appropriate chat page
					if (projectId) {
						// If we're in a project context, redirect to project chat URL
						router.push(`/project/${projectId}/chat/${newChatId}`);
					} else {
						// Otherwise, redirect to standalone chat URL
						router.push(`/chat/${newChatId}`);
					}
				}

				// Start reading the stream (we don't use it, but need to consume it)
				// The backend saves to Convex, which we'll receive via real-time queries
				setStatus("streaming");
				const reader = response.body?.getReader();
				if (reader) {
					// Consume the stream without processing it
					// We rely on Convex real-time updates instead
					try {
						while (true) {
							const { done } = await reader.read();
							if (done || abortController.signal.aborted) {
								break;
							}
						}
					} catch (streamError) {
						// Ignore abort errors
						if (
							streamError instanceof Error &&
							streamError.name !== "AbortError"
						) {
							console.error("Error reading stream:", streamError);
						}
					}
				}

				// Update status - Convex will update messages via real-time query
				if (!abortController.signal.aborted) {
					setStatus("ready");
				}
			} catch (err) {
				// Ignore abort errors
				if (err instanceof Error && err.name === "AbortError") {
					return;
				}

				console.error("Chat error:", err);
				setError(err instanceof Error ? err : new Error("Unknown error"));
				setStatus("error");
			} finally {
				if (abortControllerRef.current === abortController) {
					abortControllerRef.current = null;
				}
			}
		},
		[cachedMessages, localMessages, userId, router, model, chatId, projectId],
	);

	// setMessages function for local state management
	const setMessages = useCallback((messages: UIMessage[]) => {
		setLocalMessages(messages);
	}, []);

	// Initialize chat with a specific chatId and optionally load messages
	const initializeChat = useCallback(
		(newChatId: string | undefined, newInitialMessages?: UIMessage[]) => {
			// If we're already on this chat and messages are loaded, don't do anything
			if (
				newChatId === chatId &&
				loadedChatIdRef.current === newChatId &&
				newChatId !== undefined
			) {
				setIsInitialized(true);
				return;
			}

			// If we're switching to a different chat
			if (newChatId !== chatId) {
				setChatIdState(newChatId);
			}

			if (newInitialMessages && newInitialMessages.length > 0) {
				setMessages(newInitialMessages);
				loadedChatIdRef.current = newChatId;
			} else if (newChatId) {
				// Clear local messages - useChatMessages will handle caching and loading
				// It already returns cached data immediately while loading
				setMessages([]);
			} else if (!newChatId) {
				// New chat - clear messages
				setMessages([]);
				loadedChatIdRef.current = undefined;
			}
			setIsInitialized(true);
		},
		[setMessages, chatId],
	);

	// Set chatId without triggering message load (for URL updates)
	const setChatId = useCallback((newChatId: string | undefined) => {
		setChatIdState(newChatId);
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
			setIsInitialized(true);
		}
	}, [initialMessages, isInitialized, setMessages]);

	// Cleanup abort controller on unmount
	useEffect(() => {
		return () => {
			if (abortControllerRef.current) {
				abortControllerRef.current.abort();
			}
		};
	}, []);

	// Use Convex messages for UI (source of truth)
	// useChatMessages already handles caching and returns cached data while loading
	const displayMessages = useMemo(() => {
		// useChatMessages returns cached data immediately when loading, so we can use it directly
		if (cachedMessages) {
			return cachedMessages;
		}

		// Fall back to local messages (for initial state before Convex loads)
		return localMessages;
	}, [cachedMessages, localMessages]);

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
