import { api } from "@/../convex/_generated/api";
import { Id } from "@/../convex/_generated/dataModel";
import { useUserId } from "@/hooks/use-user-id";
import { UIMessage } from "@ai-sdk/react";
import { useQuery } from "convex/react";
import { useEffect, useMemo, useState } from "react";

// Module-level cache that persists across component remounts
const messagesCache = new Map<string, UIMessage[]>();

export function useChatMessages(chatId: string | undefined) {
	const userId = useUserId();

	// Get cache key
	const cacheKey = useMemo(
		() => (chatId && userId ? `${chatId}-${userId}` : null),
		[chatId, userId],
	);

	// Check cache synchronously - use lazy initializer for useState
	const [cachedData, setCachedData] = useState<UIMessage[] | null>(() => {
		if (cacheKey) {
			return messagesCache.get(cacheKey) || null;
		}
		return null;
	});

	// Update cached data when cache key changes
	useEffect(() => {
		if (cacheKey) {
			const cached = messagesCache.get(cacheKey);
			setCachedData(cached || null);
		} else {
			setCachedData(null);
		}
	}, [cacheKey]);

	// Memoize query args to prevent unnecessary re-fetches
	const queryArgs = useMemo(
		() =>
			chatId && userId
				? {
						chatId: chatId as Id<"chats">,
						userId: userId ?? undefined,
					}
				: "skip",
		[chatId, userId],
	);

	const messages = useQuery(api.messages.listByChat, queryArgs);

	// Memoize transformed messages to prevent unnecessary re-renders
	// MUST call useMemo before any early returns to follow Rules of Hooks
	const uiMessages: UIMessage[] = useMemo(() => {
		if (!messages) {
			return [];
		}
		return messages.map((msg) => ({
			id: msg.id,
			role: msg.role,
			parts: msg.parts,
			createdAt: new Date(msg.createdAt),
		}));
	}, [messages]);

	// Update cache when we receive transformed messages
	useEffect(() => {
		if (uiMessages.length > 0 && chatId && userId) {
			const cacheKey = `${chatId}-${userId}`;
			messagesCache.set(cacheKey, uiMessages);
		}
	}, [uiMessages, chatId, userId]);

	// Transform cached messages if we have them (they're already in UIMessage format)
	const cachedUiMessages: UIMessage[] = useMemo(() => {
		if (!cachedData) {
			return [];
		}
		// Cached data is already in UIMessage format, just ensure dates are Date objects
		return cachedData.map((msg) => {
			const msgWithDate = msg as UIMessage & { createdAt?: Date | number };
			return {
				...msg,
				createdAt:
					msgWithDate.createdAt instanceof Date
						? msgWithDate.createdAt
						: new Date(msgWithDate.createdAt ?? Date.now()),
			} as UIMessage & { createdAt: Date };
		});
	}, [cachedData]);

	// Transform Convex messages to UIMessage format
	// Convex queries return undefined while loading
	// If we have cached data, return it immediately (even if query is loading)
	if (messages === undefined) {
		if (cachedUiMessages.length > 0) {
			// Return cached data immediately while query loads
			return { data: cachedUiMessages, isLoading: true, error: null };
		}
		return { data: undefined, isLoading: true, error: null };
	}

	return {
		data: uiMessages,
		isLoading: false,
		error: null,
	};
}
