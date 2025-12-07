import { api } from "@/../convex/_generated/api";
import { Id } from "@/../convex/_generated/dataModel";
import { auth } from "@clerk/nextjs/server";
import { createOpenRouter } from "@openrouter/ai-sdk-provider";
import { convertToModelMessages, generateText, streamText } from "ai";
import { fetchMutation } from "convex/nextjs";

const openRouter = createOpenRouter({
	apiKey: process.env.OPENROUTER_API_KEY!,
});

const TITLE_GENERATION_MODEL = "google/gemini-2.5-flash-lite";

export async function POST(req: Request) {
	try {
		const {
			messages,
			model,
			chatId: chatIdParam,
			projectId,
		} = await req.json();

		if (!messages || !model) {
			return new Response(
				JSON.stringify({ error: "Messages and model are required" }),
				{ status: 400 },
			);
		}

		const { userId: authUserId } = await auth();
		const userId = authUserId ?? "anonymous";

		console.log("Processing chat request:", {
			model,
			messageCount: messages.length,
			userId,
		});

		let chatId: Id<"chats"> | string = chatIdParam;

		if (!chatId) {
			let title = "New Chat";
			try {
				const titleModel = openRouter(TITLE_GENERATION_MODEL);
				const result = await generateText({
					model: titleModel,
					prompt: `Generate a name for the chat based on the following message: ${messages[0].content}. The name should be a single word or phrase that captures the essence of the chat. Only return the name, no other text. provide proper spacing.`,
				});
				title = result.text;
			} catch (error) {
				console.error("Title generation failed:", error);
			}

			chatId = await fetchMutation(api.chats.create, {
				name: title,
				projectId: projectId as Id<"projects"> | undefined,
			});
			console.log("New chat created:", chatId);
		}

		// Save user message
		fetchMutation(api.messages.create, {
			chatId: chatId as Id<"chats">,
			content: messages[0].content,
			model,
			role: "user",
		}).catch((error) => {
			console.error("Failed to save user message:", error);
		});

		const chatModel = openRouter(model);

		const result = streamText({
			messages: convertToModelMessages(messages),
			model: chatModel,
			onFinish: async ({ text, usage, response }) => {
				await fetchMutation(api.messages.create, {
					chatId: chatId as Id<"chats">,
					content: text,
					model: model,
					role: "assistant",
					response: text,
					responseTokens: usage?.outputTokens,
					responseTime: response.timestamp
						? Date.now() - response.timestamp.getTime()
						: 0,
				});
			},
		});

		// Return the stream with proper headers
		return result.toUIMessageStreamResponse();
	} catch (error) {
		console.error("Chat API Error:", error);
		return new Response(
			JSON.stringify({
				error: "Internal Server Error",
				details: error instanceof Error ? error.message : "Unknown error",
			}),
			{
				status: 500,
				headers: {
					"Content-Type": "application/json",
				},
			},
		);
	}
}
