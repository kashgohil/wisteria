"use client";

import { api } from "@/../convex/_generated/api";
import { Id } from "@/../convex/_generated/dataModel";
import ChatPage from "@/app/chat/chatPage";
import { useQuery } from "convex/react";
import { notFound } from "next/navigation";

export function ProjectPageClient({ projectId }: { projectId: string }) {
	const userProject = useQuery(api.projects.get, {
		projectId: projectId as Id<"projects">,
	});
	const chats = useQuery(api.chats.listByProject, {
		projectId: projectId as Id<"projects">,
	});

	if (userProject === undefined || chats === undefined) {
		return (
			<div className="flex items-center justify-center h-full">Loading...</div>
		);
	}

	if (userProject === null) {
		return notFound();
	}

	return (
		<div className="flex flex-col gap-4 h-full w-full">
			<div className="flex items-center justify-center gap-2 ">
				<h1 className="text-4xl text-center text-accent">{userProject.name}</h1>
			</div>
			<div className="flex items-center justify-center w-full gap-2 flex-1 overflow-hidden relative">
				<ChatPage />
			</div>
		</div>
	);
}
