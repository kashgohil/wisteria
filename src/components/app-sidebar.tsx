import { Flower } from "lucide-react";
import * as React from "react";

import { NavHistory } from "@/components/nav-history";
import { NavProjectChats } from "@/components/nav-project-chats";
import { NavProjects } from "@/components/nav-projects";
import { NavSecondary } from "@/components/nav-secondary";
import { NavUser } from "@/components/nav-user";
import {
	Sidebar,
	SidebarContent,
	SidebarHeader,
	SidebarMenu,
	SidebarMenuItem,
} from "@/components/ui/sidebar";
import Link from "next/link";

export async function AppSidebar({
	projects,
	...props
}: React.ComponentProps<typeof Sidebar> & { projects?: boolean }) {
	return (
		<Sidebar
			variant="inset"
			className="border-none"
			{...props}
		>
			<SidebarHeader>
				<SidebarMenu>
					<SidebarMenuItem>
						<Link
							href="/chat"
							className="flex items-center gap-2 p-2 text-wisteria-500"
						>
							<Flower className="!h-6 !w-6" />
							<div className="grid flex-1 text-left text-sm leading-tight">
								<span className="truncate font-medium text-xl">Wisteria</span>
							</div>
						</Link>
					</SidebarMenuItem>
				</SidebarMenu>
			</SidebarHeader>
			<SidebarContent>
				<NavProjects />
				{projects ? <NavProjectChats /> : <NavHistory />}
				<NavSecondary className="mt-auto" />
				<NavUser />
			</SidebarContent>
		</Sidebar>
	);
}
