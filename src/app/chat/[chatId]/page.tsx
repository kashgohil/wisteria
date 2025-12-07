import ChatPage from "../chatPage";

export const metadata = {
	title: "Chat - Wisteria",
	description: "Chat with AI like never before",
};

export default async function Home({
	params,
}: {
	params: Promise<{ chatId: string }>;
}) {
	const { chatId } = await params;

	return <ChatPage chatId={chatId} />;
}
