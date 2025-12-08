import { api } from "@/../convex/_generated/api";
import { Id } from "@/../convex/_generated/dataModel";
import { fetchQuery } from "convex/nextjs";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
	req: NextRequest,
	{ params }: { params: Promise<{ chatId: string }> },
) {
	const { chatId } = await params;
	const userId = req.nextUrl.searchParams.get("userId") ?? undefined;

	const messages = await fetchQuery(api.messages.listByChat, {
		chatId: chatId as Id<"chats">,
		userId,
	});

	// Convert createdAt timestamp to Date for useChat compatibility
	const formattedMessages = messages.map((msg) => ({
		...msg,
		createdAt: new Date(msg.createdAt),
	}));

	return NextResponse.json(formattedMessages);
}
