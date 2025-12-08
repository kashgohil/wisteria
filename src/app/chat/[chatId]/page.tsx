import { api } from "@/../convex/_generated/api";
import { Id } from "@/../convex/_generated/dataModel";
import { auth } from "@clerk/nextjs/server";
import { fetchQuery } from "convex/nextjs";
import { Metadata } from "next";
import ChatPage from "../chatPage";

type Props = {
	params: Promise<{ chatId: string }>;
};

async function getConvexToken() {
	const authResult = await auth();
	return (await authResult.getToken({ template: "convex" })) ?? undefined;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
	const { chatId } = await params;

	try {
		const token = await getConvexToken();
		const chat = await fetchQuery(
			api.chats.get,
			{ chatId: chatId as Id<"chats"> },
			{ token },
		);

		if (chat?.name) {
			return {
				title: `${chat.name} - Wisteria`,
			};
		}
	} catch (error) {
		console.error("Failed to fetch chat for metadata:", error);
	}

	return {
		title: "Chat - Wisteria",
	};
}

export default async function Home({ params }: Props) {
	const { chatId } = await params;

	return <ChatPage chatId={chatId} />;
}
