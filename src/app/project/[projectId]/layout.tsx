import { AppSidebar } from "@/components/app-sidebar";
import { ChatProvider } from "@/components/providers/chat-provider";
import {
	SidebarInset,
	SidebarProvider,
	SidebarTrigger,
} from "@/components/ui/sidebar";
import React from "react";

export default async function ProjectLayout({
	children,
	params,
}: Readonly<{
	children: React.ReactNode;
	params: Promise<{ projectId: string }>;
}>) {
	const { projectId } = await params;

	return (
		<SidebarProvider>
			<ChatProvider projectId={projectId}>
				<AppSidebar projects />
				<SidebarInset className="flex flex-col p-4">
					<SidebarTrigger className="-ml-1 absolute top-4 left-4" />
					{children}
				</SidebarInset>
			</ChatProvider>
		</SidebarProvider>
	);
}
