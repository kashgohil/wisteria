"use client";

import { SignInButton, useUser } from "@clerk/nextjs";
import { LogIn } from "lucide-react";
import { Button } from "../ui/button";

export function ChatHeader() {
	const { user, isLoaded } = useUser();

	// Don't show anything if still loading or user is logged in
	if (!isLoaded || user) {
		return null;
	}

	return (
		<SignInButton mode="modal">
			<Button
				variant="outline"
				size="sm"
				className="gap-2 border-wisteria-500/30 hover:bg-wisteria-500/10 hover:text-wisteria-500"
			>
				<LogIn className="h-4 w-4" />
				Sign in
			</Button>
		</SignInButton>
	);
}
