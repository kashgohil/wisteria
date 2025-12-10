import { ChatList } from "@/components/chat-list";
import { ProjectList } from "@/components/project-list";
import { Button } from "@/components/ui/button";
import { Moon, Sun } from "lucide-react";

type Project = Awaited<
	ReturnType<typeof window.wisteria.projects.list>
>[number];
type Chat = Awaited<ReturnType<typeof window.wisteria.chats.list>>[number];

interface AppSidebarProps {
	projects: Project[];
	chats: Chat[];
	selectedProjectId: string | null;
	selectedChatId: string | null;
	activeProject: Project | null;
	systemPrompt: string;
	setSystemPrompt: (value: string) => void;
	theme: "light" | "dark";
	setTheme: (
		value: "light" | "dark" | ((prev: "light" | "dark") => "light" | "dark"),
	) => void;
	formattedStatus: string;
	onSelectProject: (projectId: string | null) => Promise<void>;
	onDeleteProject: (projectId: string) => Promise<void>;
	onCreateProject: (data: {
		name: string;
		systemPrompt?: string;
	}) => Promise<void>;
	onSelectChat: (chatId: string) => Promise<void>;
	onDeleteChat: (chatId: string) => Promise<void>;
	onCreateChat: () => Promise<void>;
	onPersistSystemPrompt: () => Promise<void>;
}

export function AppSidebar({
	projects,
	chats,
	selectedProjectId,
	selectedChatId,
	theme,
	setTheme,
	formattedStatus,
	onSelectProject,
	onDeleteProject,
	onCreateProject,
	onSelectChat,
	onDeleteChat,
	onCreateChat,
}: AppSidebarProps) {
	return (
		<aside className="shrink-0 overflow-y-auto max-w-full md:max-w-1/6">
			<div className="flex flex-col gap-5">
				<ProjectList
					projects={projects}
					chats={chats}
					selectedProjectId={selectedProjectId}
					onSelectProject={onSelectProject}
					onDeleteProject={onDeleteProject}
					onCreateProject={onCreateProject}
				/>

				<ChatList
					chats={chats}
					selectedChatId={selectedChatId}
					selectedProjectId={selectedProjectId}
					onSelectChat={onSelectChat}
					onDeleteChat={onDeleteChat}
					onCreateChat={onCreateChat}
				/>

				<div className="flex items-center gap-3">
					<Button
						type="button"
						variant="ghost"
						size="sm"
						aria-pressed={theme === "dark"}
						onClick={() =>
							setTheme((prev) => (prev === "light" ? "dark" : "light"))
						}
						className="h-8 w-8 p-0"
					>
						{theme === "light" ? <Moon /> : <Sun />}
					</Button>
					<div className="rounded-md border bg-card px-3 py-1.5 text-xs font-medium text-muted-foreground">
						{formattedStatus}
					</div>
				</div>
			</div>
		</aside>
	);
}
