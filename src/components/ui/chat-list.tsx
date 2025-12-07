"use client";

import { api } from "@/../convex/_generated/api";
import { Doc, Id } from "@/../convex/_generated/dataModel";
import { cn } from "@/lib/utils";
import { useMutation } from "convex/react";
import { Edit, MoreVertical, Trash2 } from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Fragment, useCallback, useState } from "react";
import { ConfirmationDialog } from "../confirmation-dialog";
import { MoveChat } from "../move-chat";
import { Button } from "./button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "./dropdown-menu";
import { SidebarMenuButton, SidebarMenuItem } from "./sidebar";

export function ChatList(props: { chats: Doc<"chats">[] }) {
	const { chats } = props;
	const searchParams = useSearchParams();
	const chatId = searchParams.get("id");
	const deleteChatMutation = useMutation(api.chats.remove);

	const [isOpen, setIsOpen] = useState(false);

	const removeChat = useCallback(
		(chatId: Id<"chats">) => {
			deleteChatMutation({ chatId });
		},
		[deleteChatMutation],
	);

	if (!chats?.length) {
		return (
			<div className="flex p-2 text-sm items-center justify-center h-full">
				No open chats yet.
			</div>
		);
	}

	return (
		<>
			{chats.map((item) => (
				<Fragment key={item._id}>
					<SidebarMenuItem>
						<SidebarMenuButton
							asChild
							className={cn(
								"group/menu-item [&_svg]:text-accent hover:[&_svg]:text-accent-foreground",
								chatId === item._id && "bg-accent/20",
							)}
						>
							<div className="w-full flex items-center justify-between relative">
								<Link
									href={`/chat/${item._id}`}
									className="w-full"
								>
									<div className="flex items-center justify-between gap-2">
										<span className="truncate">{item.name}</span>
									</div>
								</Link>
								<DropdownMenu>
									<DropdownMenuTrigger asChild>
										<Button
											variant="ghost"
											size="icon"
											className="!p-1 group-hover/menu-item:visible invisible"
										>
											<MoreVertical
												size={8}
												className="text-wisteria-500 group-hover/menu-item:text-accent-foreground"
											/>
										</Button>
									</DropdownMenuTrigger>
									<DropdownMenuContent
										side="right"
										align="start"
										className="w-40"
									>
										<MoveChat chatId={item._id} />
										<DropdownMenuItem className="group/item">
											<Edit
												size={8}
												className="text-wisteria-600 group-hover/item:text-accent-foreground group-focus/item:text-accent-foreground"
											/>
											<span>Edit</span>
										</DropdownMenuItem>
										<DropdownMenuItem
											className="group/item"
											onClick={() => {
												setIsOpen(true);
											}}
										>
											<Trash2
												size={8}
												className="text-wisteria-600 group-hover/item:text-accent-foreground group-focus/item:text-accent-foreground"
											/>
											<span>Delete</span>
										</DropdownMenuItem>
									</DropdownMenuContent>
								</DropdownMenu>
							</div>
						</SidebarMenuButton>
					</SidebarMenuItem>

					<ConfirmationDialog
						open={isOpen}
						onOpenChange={setIsOpen}
						title="Delete chat"
						description="Are you sure you want to delete this chat?"
						action="Delete"
						cancel="Cancel"
						onAction={() => removeChat(item._id)}
					/>
				</Fragment>
			))}
		</>
	);
}
