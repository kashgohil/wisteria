import { ChatList } from "@/components/chat-list";
import { ProjectList } from "@/components/project-list";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

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
	activeProject,
	systemPrompt,
	setSystemPrompt,
	theme,
	setTheme,
	formattedStatus,
	onSelectProject,
	onDeleteProject,
	onCreateProject,
	onSelectChat,
	onDeleteChat,
	onCreateChat,
	onPersistSystemPrompt,
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

				{activeProject && (
					<section className="rounded-lg border border-wisteria-border bg-wisteria-panel p-4">
						<div className="text-xs font-semibold text-wisteria-textSubtle uppercase tracking-wider mb-4">
							System prompt
						</div>
						<Textarea
							className="w-full border border-wisteria-border bg-wisteria-panel text-sm text-wisteria-text focus-visible:ring-1 focus-visible:ring-wisteria-accent focus-visible:border-wisteria-accent"
							value={systemPrompt}
							onChange={(e) => setSystemPrompt(e.target.value)}
							onBlur={() => void onPersistSystemPrompt()}
							placeholder="Shared system prompt for all chats in this project"
							rows={4}
						/>
						<Button
							variant="link"
							size="sm"
							className="mt-2 h-7 text-xs font-medium text-wisteria-accent hover:text-wisteria-accentStrong"
							onClick={() => void onPersistSystemPrompt()}
						>
							Save prompt
						</Button>
					</section>
				)}
				<div className="flex items-center gap-3">
					<Button
						type="button"
						variant="ghost"
						size="sm"
						aria-pressed={theme === "dark"}
						onClick={() =>
							setTheme((prev) => (prev === "light" ? "dark" : "light"))
						}
						className="h-8 w-8 p-0 text-wisteria-textSubtle hover:text-wisteria-text hover:bg-wisteria-highlight transition-colors"
					>
						{theme === "light" ? "🌙" : "☀️"}
					</Button>
					<div className="rounded-md border border-wisteria-border bg-wisteria-panel px-3 py-1.5 text-xs font-medium text-wisteria-textSubtle">
						{formattedStatus}
					</div>
				</div>
			</div>
		</aside>
	);
}
