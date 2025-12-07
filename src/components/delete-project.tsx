"use client";

import { Id } from "@/../convex/_generated/dataModel";
import { Trash2 } from "lucide-react";
import { ConfirmationDialog } from "./confirmation-dialog";
import { Button } from "./ui/button";

export function DeleteProjectButton({
	projectId,
	onDelete,
}: {
	projectId: Id<"projects">;
	onDelete: (projectId: Id<"projects">) => void;
}) {
	return (
		<ConfirmationDialog
			title="Delete Project"
			description="Are you sure you want to delete this project?"
			action="Delete"
			cancel="Cancel"
			onAction={() => onDelete(projectId)}
		>
			<Button
				variant="ghost"
				size="icon"
				className="!p-1"
			>
				<Trash2
					size={8}
					className="text-wisteria-500 group-hover/menu-item:text-accent-foreground"
				/>
			</Button>
		</ConfirmationDialog>
	);
}
