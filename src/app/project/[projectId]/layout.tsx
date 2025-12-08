import { AppSidebar } from "@/components/app-sidebar";
import { ChatProvider } from "@/components/providers/chat-provider";
import {
	SidebarInset,
	SidebarProvider,
	SidebarTrigger,
} from "@/components/ui/sidebar";
import React from "react";

export default function ProjectLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	return (
		<SidebarProvider>
			<ChatProvider>
				<AppSidebar projects />
				<SidebarInset className="flex flex-col p-4">
					<SidebarTrigger className="-ml-1 absolute top-4 left-4" />
					{children}
				</SidebarInset>
			</ChatProvider>
		</SidebarProvider>
	);
}
