"use client";

import { useParams } from "next/navigation";
import ChatPage from "../chatPage";

export default function Home() {
	const { chatId } = useParams();

	return <ChatPage chatId={chatId as string} />;
}
