import { ChatList } from "@/components/chat-list";
import { MediaList } from "@/components/media-list";
import { ProjectList } from "@/components/project-list";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Moon, Settings, Sun } from "lucide-react";

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
	onOpenSettings: () => void;
	onViewAllMedia: () => void;

	className?: string;
}

export function AppSidebar({
	projects,
	chats,
	selectedProjectId,
	selectedChatId,
	theme,
	setTheme,
	onSelectProject,
	onDeleteProject,
	onCreateProject,
	onSelectChat,
	onDeleteChat,
	onCreateChat,
	onOpenSettings,
	onViewAllMedia,
	className,
}: AppSidebarProps) {
	return (
		<aside
			className={cn(
				"shrink-0 overflow-y-auto w-full max-w-full sm:max-w-1/3 lg:max-w-1/4 xl:max-w-1/6 flex flex-col gap-5 justify-between p-5",
				className,
			)}
		>
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

				<MediaList
					selectedChatId={selectedChatId}
					onSelectChat={onSelectChat}
					onViewAll={onViewAllMedia}
				/>
			</div>
			<div className="flex gap-2">
				<Button
					type="button"
					variant="outline"
					size="lg"
					aria-pressed={theme === "dark"}
					onClick={() =>
						setTheme((prev) => (prev === "light" ? "dark" : "light"))
					}
					className="text-sm! p-0 flex-1"
				>
					{theme === "light" ? (
						<Moon className="h-4 w-4" />
					) : (
						<Sun className="h-4 w-4" />
					)}
					<span className="hidden lg:block">Theme</span>
				</Button>
				<Button
					type="button"
					variant="outline"
					size="lg"
					onClick={onOpenSettings}
					className="text-sm! p-0 flex-1"
				>
					<Settings className="h-4 w-4" />
					<span className="hidden lg:block">Settings</span>
				</Button>
			</div>
		</aside>
	);
}
