"use client";

import { api } from "@/../convex/_generated/api";
import { Id } from "@/../convex/_generated/dataModel";
import {
	SidebarGroup,
	SidebarGroupLabel,
	SidebarMenu,
} from "@/components/ui/sidebar";
import { useQuery } from "convex/react";
import { Plus } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { useMemo } from "react";
import { useChatContext } from "./providers/chat-provider";
import { Button } from "./ui/button";
import { ChatList } from "./ui/chat-list";
import { Tooltip, TooltipContent, TooltipTrigger } from "./ui/tooltip";

function ProjectChats() {
	const params = useParams();
	const projectId = params.projectId as Id<"projects">;
	// Memoize query args to prevent unnecessary re-fetches
	const queryArgs = useMemo(() => ({ projectId }), [projectId]);
	const chats = useQuery(api.chats.listByProject, queryArgs);

	if (chats === undefined) {
		return (
			<div className="flex p-2 text-sm items-center justify-center h-full">
				Loading...
			</div>
		);
	}

	return (
		<SidebarMenu>
			<ChatList chats={chats} />
		</SidebarMenu>
	);
}

export function NavProjectChats() {
	const router = useRouter();
	const params = useParams();
	const projectId = params.projectId as string;
	const { initializeChat } = useChatContext();

	const handleNewChat = () => {
		initializeChat(undefined);
		router.push(`/project/${projectId}`);
	};

	return (
		<SidebarGroup className="group-data-[collapsible=icon]:hidden">
			<SidebarGroupLabel className="text-wisteria-500 flex items-center gap-2 justify-between">
				<span>Project chats</span>
				<Tooltip>
					<TooltipTrigger asChild>
						<Button
							size="icon"
							variant="ghost"
							className="!p-1"
							onClick={handleNewChat}
						>
							<Plus />
						</Button>
					</TooltipTrigger>
					<TooltipContent>
						<span>New Chat</span>
						<span className="sr-only">New Chat</span>
					</TooltipContent>
				</Tooltip>
			</SidebarGroupLabel>
			<ProjectChats />
		</SidebarGroup>
	);
}
