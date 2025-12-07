import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
	projects: defineTable({
		userId: v.string(),
		name: v.string(),
		description: v.optional(v.string()),
		createdBy: v.string(),
		systemPrompt: v.optional(v.string()),
	}).index("by_user", ["userId"]),

	chats: defineTable({
		projectId: v.optional(v.id("projects")),
		userId: v.string(),
		name: v.string(),
	})
		.index("by_user", ["userId"])
		.index("by_project", ["projectId"]),

	messages: defineTable({
		chatId: v.id("chats"),
		userId: v.string(),
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
	}).index("by_chat", ["chatId"]),
});
