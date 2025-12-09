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
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useState } from "react";

type ModelOption = { id: string; label: string; provider: string };

interface CreateProjectDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	models: ModelOption[];
	uniqueProviders: string[];
	onCreateProject: (data: {
		name: string;
		systemPrompt?: string;
		modelProvider?: string;
		modelId?: string;
	}) => Promise<void>;
}

export function CreateProjectDialog({
	open,
	onOpenChange,
	models,
	uniqueProviders,
	onCreateProject,
}: CreateProjectDialogProps) {
	const [projectName, setProjectName] = useState("");
	const [systemPrompt, setSystemPrompt] = useState("");
	const [provider, setProvider] = useState("");
	const [modelId, setModelId] = useState("");

	const handleCreate = async () => {
		const name = projectName.trim();
		if (!name) return;

		await onCreateProject({
			name,
			systemPrompt: systemPrompt.trim() || undefined,
			modelProvider: provider || undefined,
			modelId: modelId || undefined,
		});

		// Reset form
		setProjectName("");
		setSystemPrompt("");
		setProvider("");
		setModelId("");
		onOpenChange(false);
	};

	const handleCancel = () => {
		setProjectName("");
		setSystemPrompt("");
		setProvider("");
		setModelId("");
		onOpenChange(false);
	};

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="border-wisteria-border bg-wisteria-panel text-wisteria-text">
				<DialogHeader>
					<DialogTitle className="text-wisteria-text">
						Create New Project
					</DialogTitle>
					<DialogDescription className="text-wisteria-textSubtle">
						Create a new project with a name, system prompt, and model
						configuration.
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
					<div className="space-y-2">
						<label
							htmlFor="project-provider"
							className="text-sm font-medium text-wisteria-text"
						>
							Model Provider
						</label>
						<Select value={provider || undefined} onValueChange={setProvider}>
							<SelectTrigger
								id="project-provider"
								className="border-wisteria-border bg-wisteria-panel text-sm text-wisteria-text focus-visible:ring-1 focus-visible:ring-wisteria-accent focus-visible:border-wisteria-accent"
							>
								<SelectValue placeholder="Select provider (optional)" />
							</SelectTrigger>
							<SelectContent className="border-wisteria-border bg-wisteria-panel text-wisteria-text shadow-lg">
								{uniqueProviders.map((p) => (
									<SelectItem key={p} value={p}>
										{p}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
					</div>
					<div className="space-y-2">
						<label
							htmlFor="project-model"
							className="text-sm font-medium text-wisteria-text"
						>
							Model
						</label>
						<Select
							value={modelId || undefined}
							onValueChange={setModelId}
							disabled={!provider}
						>
							<SelectTrigger
								id="project-model"
								className="border-wisteria-border bg-wisteria-panel text-sm text-wisteria-text focus-visible:ring-1 focus-visible:ring-wisteria-accent focus-visible:border-wisteria-accent disabled:opacity-50"
							>
								<SelectValue placeholder="Select model (optional)" />
							</SelectTrigger>
							<SelectContent className="border-wisteria-border bg-wisteria-panel text-wisteria-text shadow-lg">
								{models
									.filter((m) => m.provider === provider)
									.map((m) => (
										<SelectItem key={m.id} value={m.id}>
											{m.label}
										</SelectItem>
									))}
							</SelectContent>
						</Select>
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

