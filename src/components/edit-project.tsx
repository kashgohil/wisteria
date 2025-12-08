"use client";

import { api } from "@/../convex/_generated/api";
import { Doc } from "@/../convex/_generated/dataModel";
import { useMutation } from "convex/react";
import React, { useEffect, useState } from "react";

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

interface EditProjectProps {
	project: Doc<"projects">;
	open: boolean;
	onOpenChange: (open: boolean) => void;
}

export function EditProject({ project, open, onOpenChange }: EditProjectProps) {
	const updateProject = useMutation(api.projects.update);
	const [isPending, setIsPending] = useState(false);
	const [name, setName] = useState(project.name);
	const [description, setDescription] = useState(project.description || "");
	const [systemPrompt, setSystemPrompt] = useState(project.systemPrompt || "");

	// Update form values when project changes
	useEffect(() => {
		setName(project.name);
		setDescription(project.description || "");
		setSystemPrompt(project.systemPrompt || "");
	}, [project]);

	const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
		e.preventDefault();

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
			await updateProject({
				projectId: project._id,
				name,
				description,
				systemPrompt,
			});
			toast({
				title: "Project updated successfully",
				description: "Your project has been updated.",
				type: "success",
			});
			onOpenChange(false);
		} catch {
			toast({
				title: "Failed to update project",
				description: "Please try again.",
				type: "error",
			});
		} finally {
			setIsPending(false);
		}
	};

	return (
		<Dialog
			open={open}
			onOpenChange={onOpenChange}
		>
			<DialogContent>
				<form
					onSubmit={handleSubmit}
					className="flex flex-col gap-4"
				>
					<DialogHeader>
						<DialogTitle>Edit Project</DialogTitle>
						<DialogDescription>Update your project details</DialogDescription>
					</DialogHeader>
					<div className="grid gap-4">
						<div className="grid gap-3">
							<Label htmlFor="name-edit">Name</Label>
							<Input
								id="name-edit"
								name="name"
								placeholder="Project Name"
								value={name}
								onChange={(e) => setName(e.target.value)}
								required
							/>
						</div>
						<div className="grid gap-3">
							<Label htmlFor="description-edit">Description</Label>
							<Input
								id="description-edit"
								name="description"
								placeholder="This is a description of the project."
								value={description}
								onChange={(e) => setDescription(e.target.value)}
								required
							/>
						</div>
						<div className="grid gap-3">
							<Label htmlFor="system-prompt-edit">System Prompt</Label>
							<Textarea
								id="system-prompt-edit"
								name="system-prompt"
								placeholder="You are a helpful assistant."
								className="!min-h-[100px]"
								value={systemPrompt}
								onChange={(e) => setSystemPrompt(e.target.value)}
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
							Update Project
						</Button>
					</DialogFooter>
				</form>
			</DialogContent>
		</Dialog>
	);
}
