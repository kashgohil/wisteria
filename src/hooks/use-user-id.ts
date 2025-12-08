"use client";

import { useUser } from "@clerk/nextjs";
import { getAnonymousId, useAnonymousId } from "./use-anonymous-id";

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

/**
 * Server-side function to get user ID, returns anonymous ID as fallback
 * Use this in API routes and server components
 * @returns The anonymous ID (server-side doesn't have access to Clerk user)
 */
export function getUserId(): string {
	// On server, we can only use anonymous ID
	// The actual user ID will be determined by Clerk auth in API routes
	return getAnonymousId();
}
