"use client";

import { useUser } from "@clerk/nextjs";
import { useAnonymousId } from "./use-anonymous-id";

/**
 * Hook that returns the current user ID, prioritizing authenticated user over anonymous ID
 * @returns The user ID (authenticated user ID or anonymous ID)
 */
export function useUserId() {
	const { user, isLoaded } = useUser();
	const anonymousId = useAnonymousId();

	// Prioritize authenticated user ID
	if (isLoaded && user) {
		return user.id;
	}

	// Fall back to anonymous ID
	return anonymousId;
}
