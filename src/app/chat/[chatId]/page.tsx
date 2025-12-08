import { Metadata } from "next";
import ChatPage from "../chatPage";

type Props = {
	params: Promise<{ chatId: string }>;
};

// Remove blocking metadata generation - use static metadata instead
export const metadata: Metadata = {
	title: "Chat - Wisteria",
};

export default async function Home({ params }: Props) {
	const { chatId } = await params;

	return <ChatPage chatId={chatId} />;
}
