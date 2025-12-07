"use client";

import { api } from "@/../convex/_generated/api";
import { useMutation } from "convex/react";
import { Plus } from "lucide-react";
import React, { useState } from "react";

import { Button } from "./ui/button";
import {
	Dialog,
	DialogClose,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "./ui/dialog";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { toast } from "./ui/sonner";
import { Textarea } from "./ui/textarea";
import { Tooltip, TooltipContent, TooltipTrigger } from "./ui/tooltip";

export function AddProject() {
	const createProject = useMutation(api.projects.create);
	const [isOpen, setIsOpen] = useState(false);
	const [isPending, setIsPending] = useState(false);

	const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
		e.preventDefault();
		const formData = new FormData(e.currentTarget);
		const name = formData.get("name") as string;
		const description = formData.get("description") as string;
		const systemPrompt = formData.get("system-prompt") as string;

		if (!name || !description || !systemPrompt) {
			toast({
				title: "Missing fields",
				description: "Please fill in all fields.",
				type: "error",
			});
			return;
		}

		setIsPending(true);
		try {
			await createProject({ name, description, systemPrompt });
			toast({
				title: "Project created successfully",
				description: "You can now start chatting with your project.",
				type: "success",
			});
			setIsOpen(false);
		} catch {
			toast({
				title: "Failed to create project",
				description: "Please try again.",
				type: "error",
			});
		} finally {
			setIsPending(false);
		}
	};

	return (
		<>
			<Dialog
				open={isOpen}
				onOpenChange={setIsOpen}
			>
				<Tooltip>
					<TooltipTrigger asChild>
						<Button
							size="icon"
							variant="ghost"
							className="!p-1"
							onClick={() => setIsOpen(true)}
						>
							<Plus />
						</Button>
					</TooltipTrigger>
					<TooltipContent>
						<span>Add Project</span>
						<span className="sr-only">Add Project</span>
					</TooltipContent>
				</Tooltip>

				<DialogContent>
					<form
						onSubmit={handleSubmit}
						className="flex flex-col gap-4"
					>
						<DialogHeader>
							<DialogTitle>Add Project</DialogTitle>
							<DialogDescription>
								Add a new project to your workspace
							</DialogDescription>
						</DialogHeader>
						<div className="grid gap-4">
							<div className="grid gap-3">
								<Label htmlFor="name-1">Name</Label>
								<Input
									id="name-1"
									name="name"
									placeholder="Project Name"
									required
								/>
							</div>
							<div className="grid gap-3">
								<Label htmlFor="description-1">Description</Label>
								<Input
									id="description-1"
									name="description"
									placeholder="This is a description of the project."
									required
								/>
							</div>
							<div className="grid gap-3">
								<Label htmlFor="system-prompt-1">System Prompt</Label>
								<Textarea
									id="system-prompt-1"
									name="system-prompt"
									placeholder="You are a helpful assistant."
									className="!min-h-[100px]"
									required
								/>
							</div>
						</div>
						<DialogFooter>
							<DialogClose asChild>
								<Button
									type="button"
									interactive
									variant="secondary"
								>
									Cancel
								</Button>
							</DialogClose>
							<Button
								interactive
								type="submit"
								variant="default"
								disabled={isPending}
								className="bg-wisteria-500 hover:bg-wisteria-600 text-accent-foreground"
							>
								Create Project
							</Button>
						</DialogFooter>
					</form>
				</DialogContent>
			</Dialog>
		</>
	);
}
