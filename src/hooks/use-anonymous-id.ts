"use client";

import { useEffect, useState } from "react";

const ANONYMOUS_ID_KEY = "wisteria_anonymous_id";

function generateAnonymousId(): string {
	return `anon_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
}

export function useAnonymousId() {
	const [anonymousId, setAnonymousId] = useState<string | null>(null);

	useEffect(() => {
		// Check if we already have an anonymous ID
		let id = localStorage.getItem(ANONYMOUS_ID_KEY);

		if (!id) {
			// Generate a new one
			id = generateAnonymousId();
			localStorage.setItem(ANONYMOUS_ID_KEY, id);
		}

		setAnonymousId(id);
	}, []);

	return anonymousId;
}
