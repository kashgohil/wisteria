import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Plus } from "lucide-react";
import { useState } from "react";

type Project = {
	id: string;
	name: string;
	system_prompt: string | null;
	created_at: number;
};

type Chat = {
	id: string;
	project_id: string | null;
	name: string;
	created_at: number;
};

interface ProjectListProps {
	projects: Project[];
	chats: Chat[];
	selectedProjectId: string | null;
	onSelectProject: (projectId: string | null) => Promise<void>;
	onDeleteProject: (projectId: string) => void;
	onCreateProject: (data: {
		name: string;
		systemPrompt?: string;
	}) => Promise<void>;
}

export function ProjectList({
	projects,
	chats,
	selectedProjectId,
	onSelectProject,
	onDeleteProject,
	onCreateProject,
}: ProjectListProps) {
	const [isDialogOpen, setIsDialogOpen] = useState(false);
	const [projectName, setProjectName] = useState("");
	const [systemPrompt, setSystemPrompt] = useState("");

	const handleCreate = async () => {
		const name = projectName.trim();
		if (!name) return;

		await onCreateProject({
			name,
			systemPrompt: systemPrompt.trim() || undefined,
		});

		// Reset form
		setProjectName("");
		setSystemPrompt("");
		setIsDialogOpen(false);
	};

	const handleCancel = () => {
		setProjectName("");
		setSystemPrompt("");
		setIsDialogOpen(false);
	};

	return (
		<>
			<section className="rounded-lg p-4">
				<div className="flex items-center justify-between mb-4">
					<div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
						Projects
					</div>
					<Button
						variant="ghost"
						size="icon"
						onClick={() => setIsDialogOpen(true)}
					>
						<Plus />
					</Button>
				</div>
				<div className="space-y-1.5">
					<div
						className={`group flex cursor-pointer items-center justify-between rounded-md px-3 py-2 transition-all ${
							selectedProjectId === null ? "bg-accent" : "hover:bg-muted/50"
						}`}
						onClick={() => void onSelectProject(null)}
					>
						<div className="min-w-0 flex-1">
							<div className="text-sm font-medium text-foreground truncate">
								Standalone Chats
							</div>
							<div className="text-xs text-muted-foreground mt-0.5">
								{chats.filter((c) => c.project_id === null).length} chat
								{chats.filter((c) => c.project_id === null).length !== 1
									? "s"
									: ""}
							</div>
						</div>
					</div>
					{projects.map((p) => (
						<div
							key={p.id}
							className={`group flex cursor-pointer items-center justify-between rounded-md px-3 py-2 transition-all ${
								p.id === selectedProjectId ? "bg-accent" : "hover:bg-muted/50"
							}`}
							onClick={() => void onSelectProject(p.id)}
						>
							<div className="min-w-0 flex-1">
								<div className="text-sm font-medium text-foreground truncate">
									{p.name}
								</div>
								<div className="text-xs text-muted-foreground mt-0.5">
									{chats.filter((c) => c.project_id === p.id).length} chat
									{chats.filter((c) => c.project_id === p.id).length !== 1
										? "s"
										: ""}
								</div>
							</div>
							<Button
								variant="ghost"
								size="sm"
								className="ml-2 shrink-0 h-7 text-xs text-muted-foreground opacity-0 group-hover:opacity-100 hover:text-destructive transition-opacity"
								onClick={(e) => {
									e.stopPropagation();
									void onDeleteProject(p.id);
								}}
							>
								Delete
							</Button>
						</div>
					))}
					{projects.length === 0 && (
						<div className="rounded-md border border-dashed bg-muted/30 px-3 py-2 text-xs text-muted-foreground text-center">
							No projects yet.
						</div>
					)}
				</div>
			</section>

			<Dialog
				open={isDialogOpen}
				onOpenChange={setIsDialogOpen}
			>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>Create New Project</DialogTitle>
						<DialogDescription>
							Create a new project with a name and system prompt.
						</DialogDescription>
					</DialogHeader>
					<div className="space-y-4 py-4">
						<div className="flex flex-col gap-2">
							<label
								htmlFor="project-name"
								className="text-sm font-medium"
							>
								Project Name
							</label>
							<Input
								id="project-name"
								value={projectName}
								onChange={(e) => setProjectName(e.target.value)}
								placeholder="Enter project name"
								onKeyDown={(e) => {
									if (e.key === "Enter" && !e.shiftKey) {
										e.preventDefault();
										void handleCreate();
									}
								}}
							/>
						</div>
						<div className="flex flex-col gap-2">
							<label
								htmlFor="project-system-prompt"
								className="text-sm font-medium"
							>
								System Prompt
							</label>
							<Textarea
								id="project-system-prompt"
								className="w-full"
								value={systemPrompt}
								onChange={(e) => setSystemPrompt(e.target.value)}
								placeholder="Optional system prompt for all chats in this project"
								rows={4}
							/>
						</div>
					</div>
					<DialogFooter>
						<Button
							variant="outline"
							onClick={handleCancel}
						>
							Cancel
						</Button>
						<Button
							onClick={() => void handleCreate()}
							disabled={!projectName.trim()}
						>
							Create
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</>
	);
}
