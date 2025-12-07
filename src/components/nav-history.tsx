"use client";

import { api } from "@/../convex/_generated/api";
import {
	SidebarGroup,
	SidebarGroupLabel,
	SidebarMenu,
} from "@/components/ui/sidebar";
import { useAnonymousId } from "@/hooks/use-anonymous-id";
import { useQuery } from "convex/react";
import { Plus } from "lucide-react";
import Link from "next/link";
import { Button } from "./ui/button";
import { ChatList } from "./ui/chat-list";
import { Tooltip, TooltipContent, TooltipTrigger } from "./ui/tooltip";

function History() {
	const anonymousId = useAnonymousId();
	const userChats = useQuery(api.chats.list, {
		anonymousId: anonymousId ?? undefined,
	});

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
	return (
		<SidebarGroup className="group-data-[collapsible=icon]:hidden">
			<SidebarGroupLabel className="text-wisteria-500 flex items-center gap-2 justify-between">
				<span>Open chats</span>
				<Link href="/chat">
					<Tooltip>
						<TooltipTrigger asChild>
							<Button
								size="icon"
								variant="ghost"
								className="!p-1"
							>
								<Plus />
							</Button>
						</TooltipTrigger>
						<TooltipContent>
							<span>New Chat</span>
							<span className="sr-only">New Chat</span>
						</TooltipContent>
					</Tooltip>
				</Link>
			</SidebarGroupLabel>
			<History />
		</SidebarGroup>
	);
}
