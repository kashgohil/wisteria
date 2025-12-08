import { api } from "@/../convex/_generated/api";
import { Id } from "@/../convex/_generated/dataModel";
import { auth } from "@clerk/nextjs/server";
import { createOpenRouter } from "@openrouter/ai-sdk-provider";
import { convertToModelMessages, generateText, streamText } from "ai";
import { fetchMutation, fetchQuery } from "convex/nextjs";

async function getConvexToken() {
	const authResult = await auth();
	return (await authResult.getToken({ template: "convex" })) ?? undefined;
}

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
			userId,
		} = await req.json();

		if (!messages || !model) {
			return new Response(
				JSON.stringify({ error: "Messages and model are required" }),
				{ status: 400 },
			);
		}

		const token = await getConvexToken();

		// Ensure userId is never null - use "anonymous" as fallback
		const effectiveUserId = userId || "anonymous";

		console.log("Processing chat request:", {
			model,
			messageCount: messages.length,
			authenticated: !!token,
			userId: effectiveUserId,
		});

		let chatId: Id<"chats"> | string = chatIdParam;

		// Get the latest user message (last message in the array)
		const latestUserMessage = messages[messages.length - 1];
		// Extract text content from the message (handles both string and parts format)
		let userMessageContent = "";
		if (typeof latestUserMessage.content === "string") {
			userMessageContent = latestUserMessage.content;
		} else if (
			latestUserMessage.parts &&
			Array.isArray(latestUserMessage.parts)
		) {
			const textPart = latestUserMessage.parts.find(
				(p: { type: string; text?: string }) => p.type === "text",
			);
			userMessageContent = textPart?.text ?? "";
		} else if (latestUserMessage.content) {
			// Fallback: try to stringify if it's an object
			userMessageContent = JSON.stringify(latestUserMessage.content);
		}

		console.log("User message content:", userMessageContent);

		if (!chatId) {
			let title = "New Chat";
			try {
				const titleModel = openRouter(TITLE_GENERATION_MODEL);
				const result = await generateText({
					model: titleModel,
					prompt: `Generate a name for the chat based on the following message: ${userMessageContent}. The name should be a single phrase that captures the essence of the chat. Only return the name, no other text. provide proper spacing.`,
				});
				title = result.text;
			} catch (error) {
				console.error("Title generation failed:", error);
			}

			chatId = await fetchMutation(
				api.chats.create,
				{
					name: title,
					projectId: projectId as Id<"projects"> | undefined,
					userId: effectiveUserId,
				},
				{ token },
			);
			console.log("New chat created:", chatId);
		}

		// Save the user message (await to ensure it's saved before proceeding)
		if (!userMessageContent || userMessageContent.trim() === "") {
			console.error("User message content is empty, cannot save");
			return new Response(
				JSON.stringify({ error: "Message content is required" }),
				{ status: 400 },
			);
		}

		try {
			console.log("Saving user message:", {
				chatId,
				contentLength: userMessageContent.length,
				userId: effectiveUserId,
			});
			await fetchMutation(
				api.messages.create,
				{
					chatId: chatId as Id<"chats">,
					content: userMessageContent,
					model,
					role: "user",
					userId: effectiveUserId,
				},
				{ token },
			);
			console.log("User message saved successfully");
		} catch (error) {
			console.error("Failed to save user message:", error);
			// Don't fail the request, but log the error
		}

		const chatModel = openRouter(model);

		// Fetch project system prompt if projectId is provided
		let systemPrompt: string | undefined;
		if (projectId) {
			try {
				const prompt = await fetchQuery(
					api.projects.getSystemPrompt,
					{ projectId: projectId as Id<"projects"> },
					{ token },
				);
				if (prompt) {
					systemPrompt = prompt;
				}
			} catch (error) {
				console.error("Failed to fetch project system prompt:", error);
			}
		}

		const result = streamText({
			messages: convertToModelMessages(messages),
			model: chatModel,
			system: systemPrompt,
			onFinish: async ({ text, usage, response }) => {
				await fetchMutation(
					api.messages.create,
					{
						chatId: chatId as Id<"chats">,
						content: text,
						model: model,
						role: "assistant",
						response: text,
						responseTokens: usage?.outputTokens,
						responseTime: response.timestamp
							? Date.now() - response.timestamp.getTime()
							: 0,
						userId: effectiveUserId,
					},
					{ token },
				);
			},
		});

		// Return the stream with the chatId in headers for new chats
		const response = result.toUIMessageStreamResponse();

		// Add chatId header so frontend can update URL for new chats
		if (!chatIdParam && chatId) {
			response.headers.set("X-Chat-Id", chatId as string);
		}

		return response;
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
