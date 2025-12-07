import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const listByChat = query({
	args: { chatId: v.id("chats"), anonymousId: v.optional(v.string()) },
	handler: async (ctx, args) => {
		const identity = await ctx.auth.getUserIdentity();
		const userId = identity?.subject ?? args.anonymousId;

		if (!userId) {
			return [];
		}

		const messages = await ctx.db
			.query("messages")
			.withIndex("by_chat", (q) => q.eq("chatId", args.chatId))
			.collect();

		// Filter by userId and transform to UI format
		return messages
			.filter((msg) => msg.userId === userId)
			.map((msg) => ({
				id: msg._id,
				role: msg.role,
				parts: [{ type: "text" as const, text: msg.content }],
				createdAt: new Date(msg._creationTime),
			}));
	},
});

export const create = mutation({
	args: {
		chatId: v.id("chats"),
		content: v.string(),
		model: v.string(),
		role: v.union(
			v.literal("user"),
			v.literal("assistant"),
			v.literal("system"),
		),
		response: v.optional(v.string()),
		responseTokens: v.optional(v.number()),
		responseTime: v.optional(v.number()),
		anonymousId: v.optional(v.string()),
	},
	handler: async (ctx, args) => {
		const identity = await ctx.auth.getUserIdentity();
		const userId = identity?.subject ?? args.anonymousId ?? "anonymous";

		const messageId = await ctx.db.insert("messages", {
			chatId: args.chatId,
			userId,
			content: args.content,
			model: args.model,
			role: args.role,
			response: args.response,
			responseTokens: args.responseTokens,
			responseTime: args.responseTime,
		});

		return messageId;
	},
});
