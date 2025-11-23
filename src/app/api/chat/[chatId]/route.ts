import { db } from "@/db";
import { messages as messagesTable } from "@/db/schema";
import { auth } from "@clerk/nextjs/server";
import { and, eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ chatId: string }> },
) {
  const { chatId } = await params;
  const { userId } = await auth();

  const messages = await db
    .select()
    .from(messagesTable)
    .where(
      and(eq(messagesTable.chatId, chatId), eq(messagesTable.userId, userId!)),
    );

  // Transform messages to AI SDK v5 UIMessage format
  const formattedMessages = messages.map((msg) => ({
    id: msg.id,
    role: msg.role as "user" | "assistant" | "system",
    parts: [{ type: "text" as const, text: msg.content }],
    createdAt: msg.createdAt ? new Date(msg.createdAt) : new Date(),
  }));

  return NextResponse.json(formattedMessages);
}
