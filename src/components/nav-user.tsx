"use client";

import { SignInButton, useUser } from "@clerk/nextjs";
import {
	BadgeCheck,
	Bell,
	ChevronsUpDown,
	CreditCard,
	LogIn,
	LogOut,
	Sparkles,
} from "lucide-react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuGroup,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
	SidebarMenu,
	SidebarMenuButton,
	SidebarMenuItem,
} from "@/components/ui/sidebar";

export function NavUser() {
	const { user, isLoaded } = useUser();

	if (!isLoaded) {
		return null;
	}

	if (!user) {
		return (
			<SidebarMenu>
				<SidebarMenuItem>
					<SignInButton mode="modal">
						<Button
							variant="outline"
							className="w-full justify-start gap-2 border-wisteria-500/30 hover:bg-wisteria-500/10 hover:text-wisteria-500"
						>
							<LogIn className="h-4 w-4" />
							Sign in
						</Button>
					</SignInButton>
				</SidebarMenuItem>
			</SidebarMenu>
		);
	}

	return (
		<SidebarMenu>
			<SidebarMenuItem>
				<DropdownMenu>
					<DropdownMenuTrigger asChild>
						<SidebarMenuButton
							className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground !ring-0 cursor-pointer"
							size="lg"
						>
							<Avatar className="h-8 w-8 rounded-lg">
								<AvatarImage
									src={user.imageUrl}
									alt={user.fullName || ""}
								/>
								<AvatarFallback className="rounded-lg">
									{user.firstName?.[0]}
									{user.lastName?.[0]}
								</AvatarFallback>
							</Avatar>
							<div className="grid flex-1 text-left text-sm leading-tight">
								<span className="truncate font-medium">{user.fullName}</span>
							</div>
							<ChevronsUpDown className="ml-auto size-4" />
						</SidebarMenuButton>
					</DropdownMenuTrigger>
					<DropdownMenuContent
						className="w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg"
						side="bottom"
						align="end"
						sideOffset={4}
					>
						<DropdownMenuLabel className="p-0 font-normal">
							<div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
								<Avatar className="h-8 w-8 rounded-lg">
									<AvatarImage
										src={user.imageUrl}
										alt={user.fullName || ""}
									/>
									<AvatarFallback className="rounded-lg">
										{user.firstName?.[0]}
										{user.lastName?.[0]}
									</AvatarFallback>
								</Avatar>
								<div className="grid flex-1 text-left text-sm leading-tight">
									<span className="truncate font-medium">{user.fullName}</span>
									<span className="truncate text-xs">
										{user.primaryEmailAddress?.emailAddress}
									</span>
								</div>
							</div>
						</DropdownMenuLabel>
						<DropdownMenuSeparator />
						<DropdownMenuGroup>
							<DropdownMenuItem className="group/menu-item">
								<Sparkles className="text-wisteria-700 group-hover/menu-item:text-accent-foreground group-focus/menu-item:text-accent-foreground" />
								Upgrade to Pro
							</DropdownMenuItem>
						</DropdownMenuGroup>
						<DropdownMenuSeparator />
						<DropdownMenuGroup>
							<DropdownMenuItem className="group/menu-item">
								<BadgeCheck className="text-wisteria-700 group-hover/menu-item:text-accent-foreground group-focus/menu-item:text-accent-foreground" />
								Account
							</DropdownMenuItem>
							<DropdownMenuItem className="group/menu-item">
								<CreditCard className="text-wisteria-700 group-hover/menu-item:text-accent-foreground group-focus/menu-item:text-accent-foreground" />
								Billing
							</DropdownMenuItem>
							<DropdownMenuItem className="group/menu-item">
								<Bell className="text-wisteria-700 group-hover/menu-item:text-accent-foreground group-focus/menu-item:text-accent-foreground" />
								Notifications
							</DropdownMenuItem>
						</DropdownMenuGroup>
						<DropdownMenuSeparator />
						<DropdownMenuItem className="group/menu-item">
							<LogOut className="text-wisteria-700 group-hover/menu-item:text-accent-foreground group-focus/menu-item:text-accent-foreground" />
							Log out
						</DropdownMenuItem>
					</DropdownMenuContent>
				</DropdownMenu>
			</SidebarMenuItem>
		</SidebarMenu>
	);
}
