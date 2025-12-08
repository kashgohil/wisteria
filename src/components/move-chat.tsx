"use client";

import { api } from "@/../convex/_generated/api";
import { Id } from "@/../convex/_generated/dataModel";
import { useMutation, useQuery } from "convex/react";
import { Folder, Loader2 } from "lucide-react";
import {
	DropdownMenuItem,
	DropdownMenuSub,
	DropdownMenuSubContent,
	DropdownMenuSubTrigger,
} from "./ui/dropdown-menu";

export function MoveChat({ chatId }: { chatId: Id<"chats"> }) {
	const projects = useQuery(api.projects.list);
	const moveChatMutation = useMutation(api.chats.move);

	if (!projects?.length) return null;

	return (
		<DropdownMenuSub>
			<DropdownMenuSubTrigger className="group/item">
				<div className="flex items-center gap-2 cursor-pointer hover:text-accent-foreground">
					<Folder
						size={16}
						className="text-wisteria-600 group-hover/item:text-accent-foreground group-focus/item:text-accent-foreground"
					/>
					<span>Move to</span>
				</div>
			</DropdownMenuSubTrigger>
			<DropdownMenuSubContent>
				{projects === undefined ? (
					<div className="flex items-center justify-center h-full">
						<Loader2 className="animate-spin" />
					</div>
				) : (
					projects?.map((project) => (
						<DropdownMenuItem
							key={project._id}
							onClick={() => {
								moveChatMutation({ chatId, projectId: project._id });
							}}
						>
							<span>{project.name}</span>
						</DropdownMenuItem>
					))
				)}
			</DropdownMenuSubContent>
		</DropdownMenuSub>
	);
}
