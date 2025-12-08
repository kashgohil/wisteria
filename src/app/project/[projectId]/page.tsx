import { api } from "@/../convex/_generated/api";
import { Id } from "@/../convex/_generated/dataModel";
import { fetchQuery } from "convex/nextjs";
import { Metadata } from "next";
import { ProjectPageClient } from "./project-page-client";

type Props = {
	params: Promise<{ projectId: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
	const { projectId } = await params;

	const project = await fetchQuery(api.projects.get, {
		projectId: projectId as Id<"projects">,
	});

	return {
		title: project?.name ? `${project.name} - Wisteria` : "Project - Wisteria",
	};
}

export default async function ProjectPage({ params }: Props) {
	const { projectId } = await params;

	return <ProjectPageClient projectId={projectId} />;
}
