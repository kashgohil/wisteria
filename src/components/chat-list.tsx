import { Button } from "@/components/ui/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreVertical, Plus } from "lucide-react";

type Chat = Awaited<ReturnType<typeof window.wisteria.chats.list>>[number];

interface ChatListProps {
	chats: Chat[];
	selectedChatId: string | null;
	selectedProjectId: string | null;
	onSelectChat: (chatId: string) => Promise<void>;
	onDeleteChat: (chatId: string) => Promise<void>;
	onCreateChat: () => Promise<void>;
}

export function ChatList({
	chats,
	selectedChatId,
	selectedProjectId,
	onSelectChat,
	onDeleteChat,
	onCreateChat,
}: ChatListProps) {
	const filteredChats = chats.filter((c) =>
		selectedProjectId
			? c.project_id === selectedProjectId
			: c.project_id === null,
	);

	return (
		<section className="rounded-lg p-4">
			<div className="flex items-center justify-between mb-2">
				<div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
					Chats
				</div>
				<Button
					variant="ghost"
					size="icon"
					onClick={() => void onCreateChat()}
					title="New chat"
				>
					<Plus className="h-4 w-4" />
				</Button>
			</div>
			<div className="space-y-1.5">
				{filteredChats.map((c) => (
					<div
						key={c.id}
						className={`group flex cursor-pointer items-center justify-between rounded-md px-3 py-2 transition-all ${
							c.id === selectedChatId ? "bg-accent" : "hover:bg-muted/50"
						}`}
					>
						<div
							className="min-w-0 flex-1 truncate text-sm font-medium text-foreground"
							onClick={() => void onSelectChat(c.id)}
						>
							{c.name}
						</div>
						<div className="shrink-0">
							<DropdownMenu>
								<DropdownMenuTrigger asChild>
									<Button
										variant="ghost"
										size="icon"
										className="h-7 w-7 text-muted-foreground opacity-0 group-hover:opacity-100 data-[state=open]:opacity-100 transition-opacity"
										onPointerDown={(e) => e.stopPropagation()}
										onClick={(e) => e.stopPropagation()}
									>
										<MoreVertical className="h-4 w-4" />
									</Button>
								</DropdownMenuTrigger>
								<DropdownMenuContent
									align="end"
									sideOffset={4}
								>
									<DropdownMenuItem
										className="cursor-pointer"
										onClick={() => {
											void onDeleteChat(c.id);
										}}
									>
										Delete
									</DropdownMenuItem>
								</DropdownMenuContent>
							</DropdownMenu>
						</div>
					</div>
				))}
				{filteredChats.length === 0 && (
					<div className="rounded-md border border-dashed bg-muted/30 px-3 py-2 text-xs text-muted-foreground text-center">
						{selectedProjectId
							? "No chats for this project."
							: "No standalone chats."}
					</div>
				)}
			</div>
		</section>
	);
}
