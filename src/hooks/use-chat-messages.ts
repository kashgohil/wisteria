import { getAnonymousId } from "@/hooks/use-anonymous-id";
import { UIMessage } from "@ai-sdk/react";
import { useQuery } from "@tanstack/react-query";

async function fetchChatMessages(
	chatId: string,
	anonymousId: string,
): Promise<UIMessage[]> {
	const response = await fetch(
		`/api/chat/${chatId}?anonymousId=${encodeURIComponent(anonymousId)}`,
	);
	if (!response.ok) {
		throw new Error("Failed to fetch chat messages");
	}
	return response.json();
}

export function useChatMessages(chatId: string | undefined) {
	const anonymousId = getAnonymousId();

	return useQuery({
		queryKey: ["chat-messages", chatId, anonymousId],
		queryFn: () => fetchChatMessages(chatId!, anonymousId),
		enabled: !!chatId && !!anonymousId,
		staleTime: 5 * 60 * 1000, // 5 minutes
		gcTime: 10 * 60 * 1000, // 10 minutes
	});
}
