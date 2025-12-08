"use client";

import { api } from "@/../convex/_generated/api";
import { Doc, Id } from "@/../convex/_generated/dataModel";
import { cn } from "@/lib/utils";
import { useMutation } from "convex/react";
import { Edit, Folder } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useCallback, useState } from "react";
import { DeleteProjectButton } from "./delete-project";
import { EditProject } from "./edit-project";
import { Button } from "./ui/button";
import { SidebarMenuButton, SidebarMenuItem } from "./ui/sidebar";

export function ProjectList(props: { projects: Doc<"projects">[] }) {
	const { projects } = props;
	const params = useParams();
	const projectId = params.projectId as string;
	const deleteProjectMutation = useMutation(api.projects.remove);
	const [editingProject, setEditingProject] = useState<Doc<"projects"> | null>(
		null,
	);

	const removeProject = useCallback(
		(projectId: Id<"projects">) => {
			deleteProjectMutation({ projectId });
		},
		[deleteProjectMutation],
	);

	return (
		<>
			{projects.map((item) => (
				<SidebarMenuItem key={item._id}>
					<SidebarMenuButton
						asChild
						className={cn(
							"group/menu-item [&_svg]:text-accent hover:[&_svg]:text-accent-foreground",
							projectId === item._id && "bg-accent/20",
						)}
					>
						<div className="w-full flex items-center justify-between relative">
							<Link
								href={`/project/${item._id}`}
								className="w-full"
							>
								<div className="flex items-center justify-between gap-2">
									<Folder
										size={16}
										className="flex-shrink-0"
									/>
									<span className="flex-1 truncate">{item.name}</span>
								</div>
							</Link>
							<div className="items-center absolute z-10 -right-full group-hover/menu-item:right-0 bg-wisteria-200 p-1 shadow-2xl transition-all duration-300 rounded-lg group-hover/menu-item:flex">
								<Button
									variant="ghost"
									size="icon"
									className="!p-1"
									onClick={() => setEditingProject(item)}
								>
									<Edit
										size={8}
										className="text-wisteria-500 group-hover/menu-item:text-accent-foreground"
									/>
								</Button>

								<DeleteProjectButton
									projectId={item._id}
									onDelete={removeProject}
								/>
							</div>
						</div>
					</SidebarMenuButton>
				</SidebarMenuItem>
			))}
			{editingProject && (
				<EditProject
					project={editingProject}
					open={!!editingProject}
					onOpenChange={(open) => !open && setEditingProject(null)}
				/>
			)}
		</>
	);
}
