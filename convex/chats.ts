import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const list = query({
	args: { anonymousId: v.optional(v.string()) },
	handler: async (ctx, args) => {
		const identity = await ctx.auth.getUserIdentity();
		const userId = identity?.subject ?? args.anonymousId;

		if (!userId) {
			return [];
		}

		// Get chats without a project (standalone chats)
		return await ctx.db
			.query("chats")
			.withIndex("by_user", (q) => q.eq("userId", userId))
			.order("desc")
			.filter((q) => q.eq(q.field("projectId"), undefined))
			.collect();
	},
});

export const listByProject = query({
	args: { projectId: v.id("projects") },
	handler: async (ctx, args) => {
		return await ctx.db
			.query("chats")
			.withIndex("by_project", (q) => q.eq("projectId", args.projectId))
			.order("desc")
			.collect();
	},
});

export const get = query({
	args: { chatId: v.id("chats") },
	handler: async (ctx, args) => {
		return await ctx.db.get(args.chatId);
	},
});

export const create = mutation({
	args: {
		name: v.string(),
		projectId: v.optional(v.id("projects")),
		anonymousId: v.optional(v.string()),
	},
	handler: async (ctx, args) => {
		const identity = await ctx.auth.getUserIdentity();
		const userId = identity?.subject ?? args.anonymousId ?? "anonymous";

		const chatId = await ctx.db.insert("chats", {
			userId,
			name: args.name,
			projectId: args.projectId,
		});

		return chatId;
	},
});

export const remove = mutation({
	args: { chatId: v.id("chats") },
	handler: async (ctx, args) => {
		const identity = await ctx.auth.getUserIdentity();
		if (!identity) {
			throw new Error("Unauthorized");
		}
		const userId = identity.subject;

		const chat = await ctx.db.get(args.chatId);
		if (!chat || chat.userId !== userId) {
			throw new Error("Chat not found");
		}

		// Delete all messages in the chat
		const messages = await ctx.db
			.query("messages")
			.withIndex("by_chat", (q) => q.eq("chatId", args.chatId))
			.collect();

		for (const message of messages) {
			await ctx.db.delete(message._id);
		}

		await ctx.db.delete(args.chatId);
		return args.chatId;
	},
});

export const move = mutation({
	args: {
		chatId: v.id("chats"),
		projectId: v.id("projects"),
	},
	handler: async (ctx, args) => {
		const identity = await ctx.auth.getUserIdentity();
		if (!identity) {
			throw new Error("Unauthorized");
		}
		const userId = identity.subject;

		const chat = await ctx.db.get(args.chatId);
		if (!chat || chat.userId !== userId) {
			throw new Error("Chat not found");
		}

		await ctx.db.patch(args.chatId, {
			projectId: args.projectId,
		});

		return args.chatId;
	},
});
