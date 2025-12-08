"use client";

import { useParams } from "next/navigation";
import ChatPage from "@/app/chat/chatPage";

export default function ProjectChatPage() {
	const { chatId } = useParams();

	return <ChatPage chatId={chatId as string} />;
}

