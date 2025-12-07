"use client";

import { api } from "@/../convex/_generated/api";
import { Id } from "@/../convex/_generated/dataModel";
import ChatPage from "@/app/chat/chatPage";
import { useQuery } from "convex/react";
import { MessageSquare } from "lucide-react";
import { notFound, useParams } from "next/navigation";

export default function ProjectPage() {
	const params = useParams();
	const projectId = params.projectId as Id<"projects">;

	const userProject = useQuery(api.projects.get, { projectId });
	const chats = useQuery(api.chats.listByProject, { projectId });

	if (userProject === undefined || chats === undefined) {
		return (
			<div className="flex items-center justify-center h-full">Loading...</div>
		);
	}

	if (userProject === null) {
		return notFound();
	}

	return (
		<div className="flex flex-col gap-4 h-full">
			<div className="flex items-center justify-center gap-2 ">
				<h1 className="text-4xl text-center text-accent">{userProject.name}</h1>
			</div>
			<div className="flex items-center justify-center gap-2 flex-1 overflow-hidden">
				<div className="flex flex-col gap-2 w-3/4 relative h-full">
					<ChatPage />
				</div>
				<div className="flex flex-col gap-2 w-1/4">
					{chats.map((chat) => (
						<div
							key={chat._id}
							className="flex items-center justify-center gap-2 bg-accent/20 p-2 rounded-lg cursor-pointer"
						>
							<div className="flex items-center justify-center gap-2">
								<MessageSquare className="w-4 h-4 text-accent" />
								<span className="text-accent">{chat.name}</span>
							</div>
						</div>
					))}
				</div>
			</div>
		</div>
	);
}
