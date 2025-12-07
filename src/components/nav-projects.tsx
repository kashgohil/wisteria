"use client";

import { api } from "@/../convex/_generated/api";
import {
	SidebarGroup,
	SidebarGroupLabel,
	SidebarMenu,
} from "@/components/ui/sidebar";
import { useQuery } from "convex/react";
import { AddProject } from "./add-project";
import { ProjectList } from "./project-list";

function ProjectsList() {
	const userProjects = useQuery(api.projects.list);

	if (userProjects === undefined) {
		return (
			<div className="flex p-2 text-sm items-center justify-center h-full">
				Loading...
			</div>
		);
	}

	if (!userProjects?.length) {
		return (
			<div className="flex p-2 text-sm items-center justify-center h-full">
				No projects yet.
			</div>
		);
	}

	return (
		<SidebarMenu>
			<ProjectList projects={userProjects} />
		</SidebarMenu>
	);
}

export function NavProjects() {
	return (
		<SidebarGroup className="group-data-[collapsible=icon]:hidden">
			<SidebarGroupLabel className="text-wisteria-500 flex items-center gap-2 justify-between">
				<span>Projects</span>
				<AddProject />
			</SidebarGroupLabel>
			<ProjectsList />
		</SidebarGroup>
	);
}
