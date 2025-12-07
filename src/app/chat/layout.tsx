import { AppSidebar } from "@/components/app-sidebar";
import { ChatHeader } from "@/components/chat/chat-header";
import {
	SidebarInset,
	SidebarProvider,
	SidebarTrigger,
} from "@/components/ui/sidebar";
import React from "react";

export async function generateMetadata() {
	return {
		title: "Wisteria - AI Chat",
		description: "Chat with AI like never before",
	};
}

export default function ChatLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	return (
		<SidebarProvider className="h-screen">
			<AppSidebar />
			<SidebarInset className="relative">
				<div className="absolute top-4 left-4 right-4 z-20 flex items-center justify-between">
					<SidebarTrigger className="-ml-1" />
					<ChatHeader />
				</div>
				{children}
			</SidebarInset>
		</SidebarProvider>
	);
}
