import { AppSidebar } from "@/components/app-sidebar";
import {
	SidebarInset,
	SidebarProvider,
	SidebarTrigger,
} from "@/components/ui/sidebar";
import React from "react";

export const metadata = {
	title: "Project - Wisteria",
	description: "Chat with AI like never before",
};

export default function ProjectLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	return (
		<SidebarProvider>
			<AppSidebar projects />
			<SidebarInset className="flex flex-col p-4">
				<SidebarTrigger className="-ml-1 absolute top-4 left-4" />
				{children}
			</SidebarInset>
		</SidebarProvider>
	);
}
