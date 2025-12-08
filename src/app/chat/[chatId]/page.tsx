import { api } from "@/../convex/_generated/api";
import { Id } from "@/../convex/_generated/dataModel";
import { fetchQuery } from "convex/nextjs";
import { Metadata } from "next";
import ChatPage from "../chatPage";

type Props = {
	params: Promise<{ chatId: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
	const { chatId } = await params;

	const chat = await fetchQuery(api.chats.get, {
		chatId: chatId as Id<"chats">,
	});

	return {
		title: chat?.name ? `${chat.name} - Wisteria` : "Chat - Wisteria",
	};
}

export default async function Home({ params }: Props) {
	const { chatId } = await params;

	return <ChatPage chatId={chatId} />;
}
