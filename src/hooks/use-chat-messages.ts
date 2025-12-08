import { useUserId } from "@/hooks/use-user-id";
import { UIMessage } from "@ai-sdk/react";
import { useQuery } from "@tanstack/react-query";

async function fetchChatMessages(
	chatId: string,
	userId: string,
): Promise<UIMessage[]> {
	const response = await fetch(
		`/api/chat/${chatId}?userId=${encodeURIComponent(userId)}`,
	);
	if (!response.ok) {
		throw new Error("Failed to fetch chat messages");
	}
	return response.json();
}

export function useChatMessages(chatId: string | undefined) {
	const userId = useUserId();

	return useQuery({
		queryKey: ["chat-messages", chatId, userId],
		queryFn: () => fetchChatMessages(chatId!, userId!),
		enabled: !!chatId && !!userId,
		staleTime: 5 * 60 * 1000, // 5 minutes
		gcTime: 10 * 60 * 1000, // 10 minutes
	});
}
