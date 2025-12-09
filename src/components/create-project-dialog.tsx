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
import { useState } from "react";

interface CreateProjectDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	onCreateProject: (data: {
		name: string;
		systemPrompt?: string;
	}) => Promise<void>;
}

export function CreateProjectDialog({
	open,
	onOpenChange,
	onCreateProject,
}: CreateProjectDialogProps) {
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
		onOpenChange(false);
	};

	const handleCancel = () => {
		setProjectName("");
		setSystemPrompt("");
		onOpenChange(false);
	};

	return (
		<Dialog
			open={open}
			onOpenChange={onOpenChange}
		>
			<DialogContent className="border-wisteria-border bg-wisteria-panel text-wisteria-text">
				<DialogHeader>
					<DialogTitle className="text-wisteria-text">
						Create New Project
					</DialogTitle>
					<DialogDescription className="text-wisteria-textSubtle">
						Create a new project with a name and system prompt.
					</DialogDescription>
				</DialogHeader>
				<div className="space-y-4 py-4">
					<div className="space-y-2">
						<label
							htmlFor="project-name"
							className="text-sm font-medium text-wisteria-text"
						>
							Project Name
						</label>
						<Input
							id="project-name"
							className="border-wisteria-border bg-wisteria-panel text-sm text-wisteria-text focus-visible:ring-1 focus-visible:ring-wisteria-accent focus-visible:border-wisteria-accent"
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
					<div className="space-y-2">
						<label
							htmlFor="project-system-prompt"
							className="text-sm font-medium text-wisteria-text"
						>
							System Prompt
						</label>
						<Textarea
							id="project-system-prompt"
							className="w-full border-wisteria-border bg-wisteria-panel text-sm text-wisteria-text focus-visible:ring-1 focus-visible:ring-wisteria-accent focus-visible:border-wisteria-accent"
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
						className="border-wisteria-border text-wisteria-text hover:bg-wisteria-highlight"
					>
						Cancel
					</Button>
					<Button
						onClick={() => void handleCreate()}
						disabled={!projectName.trim()}
						className="bg-wisteria-accent font-medium text-white hover:bg-wisteria-accentSoft transition-colors disabled:opacity-50"
					>
						Create
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
