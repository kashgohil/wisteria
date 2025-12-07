import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const list = query({
	args: {},
	handler: async (ctx) => {
		const identity = await ctx.auth.getUserIdentity();
		if (!identity) {
			return [];
		}
		const userId = identity.subject;

		return await ctx.db
			.query("projects")
			.withIndex("by_user", (q) => q.eq("userId", userId))
			.order("desc")
			.collect();
	},
});

export const get = query({
	args: { projectId: v.id("projects") },
	handler: async (ctx, args) => {
		const identity = await ctx.auth.getUserIdentity();
		if (!identity) {
			return null;
		}
		const userId = identity.subject;

		const project = await ctx.db.get(args.projectId);
		if (!project || project.userId !== userId) {
			return null;
		}
		return project;
	},
});

export const create = mutation({
	args: {
		name: v.string(),
		description: v.optional(v.string()),
		systemPrompt: v.optional(v.string()),
	},
	handler: async (ctx, args) => {
		const identity = await ctx.auth.getUserIdentity();
		if (!identity) {
			throw new Error("Unauthorized");
		}
		const userId = identity.subject;

		const projectId = await ctx.db.insert("projects", {
			userId,
			name: args.name,
			description: args.description,
			systemPrompt: args.systemPrompt,
			createdBy: userId,
		});

		return projectId;
	},
});

export const update = mutation({
	args: {
		projectId: v.id("projects"),
		name: v.string(),
		description: v.optional(v.string()),
		systemPrompt: v.optional(v.string()),
	},
	handler: async (ctx, args) => {
		const identity = await ctx.auth.getUserIdentity();
		if (!identity) {
			throw new Error("Unauthorized");
		}
		const userId = identity.subject;

		const project = await ctx.db.get(args.projectId);
		if (!project || project.userId !== userId) {
			throw new Error("Project not found");
		}

		await ctx.db.patch(args.projectId, {
			name: args.name,
			description: args.description,
			systemPrompt: args.systemPrompt,
		});

		return args.projectId;
	},
});

export const remove = mutation({
	args: { projectId: v.id("projects") },
	handler: async (ctx, args) => {
		const identity = await ctx.auth.getUserIdentity();
		if (!identity) {
			throw new Error("Unauthorized");
		}
		const userId = identity.subject;

		const project = await ctx.db.get(args.projectId);
		if (!project || project.userId !== userId) {
			throw new Error("Project not found");
		}

		// Delete all chats associated with this project
		const chats = await ctx.db
			.query("chats")
			.withIndex("by_project", (q) => q.eq("projectId", args.projectId))
			.collect();

		for (const chat of chats) {
			// Delete all messages in the chat
			const messages = await ctx.db
				.query("messages")
				.withIndex("by_chat", (q) => q.eq("chatId", chat._id))
				.collect();

			for (const message of messages) {
				await ctx.db.delete(message._id);
			}
			await ctx.db.delete(chat._id);
		}

		await ctx.db.delete(args.projectId);
		return args.projectId;
	},
});
