import { ProjectList } from "@/components/project-list";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

type Project = Awaited<
	ReturnType<typeof window.wisteria.projects.list>
>[number];
type Chat = Awaited<ReturnType<typeof window.wisteria.chats.list>>[number];
type ModelOption = { id: string; label: string; provider: string };

interface AppSidebarProps {
	projects: Project[];
	chats: Chat[];
	selectedProjectId: string | null;
	selectedChatId: string | null;
	activeProject: Project | null;
	newChatName: string;
	setNewChatName: (value: string) => void;
	systemPrompt: string;
	setSystemPrompt: (value: string) => void;
	theme: "light" | "dark";
	setTheme: (
		value: "light" | "dark" | ((prev: "light" | "dark") => "light" | "dark"),
	) => void;
	formattedStatus: string;
	models: ModelOption[];
	uniqueProviders: string[];
	onSelectProject: (projectId: string) => Promise<void>;
	onDeleteProject: (projectId: string) => Promise<void>;
	onCreateProject: (data: {
		name: string;
		systemPrompt?: string;
		modelProvider?: string;
		modelId?: string;
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
	newChatName,
	setNewChatName,
	systemPrompt,
	setSystemPrompt,
	theme,
	setTheme,
	formattedStatus,
	models,
	uniqueProviders,
	onSelectProject,
	onDeleteProject,
	onCreateProject,
	onSelectChat,
	onDeleteChat,
	onCreateChat,
	onPersistSystemPrompt,
}: AppSidebarProps) {
	return (
		<aside className="shrink-0 overflow-y-auto">
			<div className="flex flex-col gap-5">
				<ProjectList
					projects={projects}
					chats={chats}
					selectedProjectId={selectedProjectId}
					models={models}
					uniqueProviders={uniqueProviders}
					onSelectProject={onSelectProject}
					onDeleteProject={onDeleteProject}
					onCreateProject={onCreateProject}
				/>

				<section className="rounded-lg border border-wisteria-border bg-wisteria-panel p-4">
					<div className="text-xs font-semibold text-wisteria-textSubtle uppercase tracking-wider mb-4">
						Chats
					</div>
					<div className="space-y-1.5">
						{chats
							.filter((c) => c.project_id === selectedProjectId)
							.map((c) => (
								<div
									key={c.id}
									className={`group flex cursor-pointer items-center justify-between rounded-md px-3 py-2 transition-all ${
										c.id === selectedChatId
											? "bg-wisteria-highlight"
											: "hover:bg-wisteria-panelStrong/50"
									}`}
									onClick={() => void onSelectChat(c.id)}
								>
									<div className="min-w-0 flex-1 truncate text-sm font-medium text-wisteria-text">
										{c.name}
									</div>
									<Button
										variant="ghost"
										size="sm"
										className="ml-2 shrink-0 h-7 text-xs text-wisteria-textMuted opacity-0 group-hover:opacity-100 hover:text-wisteria-danger transition-opacity"
										onClick={(e) => {
											e.stopPropagation();
											void onDeleteChat(c.id);
										}}
									>
										Delete
									</Button>
								</div>
							))}
						{selectedProjectId &&
							chats.filter((c) => c.project_id === selectedProjectId).length ===
								0 && (
								<div className="rounded-md border border-dashed border-wisteria-border bg-wisteria-panelStrong/30 px-3 py-2 text-xs text-wisteria-textMuted text-center">
									No chats for this project.
								</div>
							)}
					</div>
					<div className="mt-4 flex gap-2">
						<Input
							className="w-full border border-wisteria-border bg-wisteria-panel text-sm text-wisteria-text focus-visible:ring-1 focus-visible:ring-wisteria-accent focus-visible:border-wisteria-accent"
							value={newChatName}
							onChange={(e) => setNewChatName(e.target.value)}
							placeholder="New chat title"
							disabled={!selectedProjectId}
							onKeyDown={(e) => {
								if (e.key === "Enter" && selectedProjectId) {
									void onCreateChat();
								}
							}}
						/>
						<Button
							onClick={() => void onCreateChat()}
							disabled={!newChatName.trim() || !selectedProjectId}
							className="bg-wisteria-accent font-medium text-white hover:bg-wisteria-accentSoft transition-colors disabled:opacity-50"
						>
							Add
						</Button>
					</div>
				</section>

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
