"use client";

import ChatPage from "@/app/chat/chatPage";
import { useParams } from "next/navigation";

export default function ProjectChatPage() {
	const { chatId } = useParams();

	return <ChatPage chatId={chatId as string} />;
}
