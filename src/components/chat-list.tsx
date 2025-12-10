import { Button } from "@/components/ui/button";
import { Plus, Trash2 } from "lucide-react";

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
						onClick={() => void onSelectChat(c.id)}
					>
						<div className="min-w-0 flex-1 truncate text-sm font-medium text-foreground">
							{c.name}
						</div>
						<Button
							size="sm"
							variant="ghost"
							className="ml-2 shrink-0 h-4 w-4 p-0 text-xs text-muted-foreground hidden group-hover:block hover:text-destructive transition-opacity"
							onClick={(e) => {
								e.stopPropagation();
								void onDeleteChat(c.id);
							}}
						>
							<Trash2 className="h-2 w-2" />
						</Button>
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
