"use client";

import { api } from "@/../convex/_generated/api";
import {
	SidebarGroup,
	SidebarGroupLabel,
	SidebarMenu,
} from "@/components/ui/sidebar";
import { useUserId } from "@/hooks/use-user-id";
import { useQuery } from "convex/react";
import { Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import { useMemo } from "react";
import { Button } from "./ui/button";
import { ChatList } from "./ui/chat-list";
import { Tooltip, TooltipContent, TooltipTrigger } from "./ui/tooltip";

function History() {
	const userId = useUserId();
	// Memoize query args to prevent unnecessary re-fetches
	const queryArgs = useMemo(
		() => ({
			userId: userId ?? undefined,
		}),
		[userId],
	);
	const userChats = useQuery(api.chats.list, queryArgs);

	if (userChats === undefined) {
		return (
			<div className="flex p-2 text-sm items-center justify-center h-full">
				Loading...
			</div>
		);
	}

	return (
		<SidebarMenu>
			<ChatList chats={userChats} />
		</SidebarMenu>
	);
}

export function NavHistory() {
	const router = useRouter();

	const handleNewChat = () => {
		router.push("/chat");
	};

	return (
		<SidebarGroup className="group-data-[collapsible=icon]:hidden">
			<SidebarGroupLabel className="text-wisteria-500 flex items-center gap-2 justify-between">
				<span>Open chats</span>
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
			<History />
		</SidebarGroup>
	);
}
