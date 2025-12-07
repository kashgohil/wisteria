import { api } from "@/../convex/_generated/api";
import { Id } from "@/../convex/_generated/dataModel";
import { fetchQuery } from "convex/nextjs";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
	req: NextRequest,
	{ params }: { params: Promise<{ chatId: string }> },
) {
	const { chatId } = await params;

	const messages = await fetchQuery(api.messages.listByChat, {
		chatId: chatId as Id<"chats">,
	});

	return NextResponse.json(messages);
}
