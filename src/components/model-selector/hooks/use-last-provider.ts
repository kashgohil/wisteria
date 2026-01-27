import { useCallback, useEffect, useState } from "react";
import type { ProviderId } from "../../../../shared/providers";
import { STORAGE_KEYS } from "../types";

export function useLastProvider() {
	const [lastProvider, setLastProviderState] = useState<ProviderId | null>(
		null,
	);

	// Load from localStorage on mount
	useEffect(() => {
		try {
			const stored = localStorage.getItem(STORAGE_KEYS.LAST_PROVIDER);
			if (stored) {
				setLastProviderState(stored as ProviderId);
			}
		} catch (e) {
			console.error("Failed to load last provider", e);
		}
	}, []);

	// Set the last provider and save to localStorage
	const setLastProvider = useCallback((provider: ProviderId | null) => {
		setLastProviderState(provider);
		try {
			if (provider) {
				localStorage.setItem(STORAGE_KEYS.LAST_PROVIDER, provider);
			} else {
				localStorage.removeItem(STORAGE_KEYS.LAST_PROVIDER);
			}
		} catch (e) {
			console.error("Failed to save last provider", e);
		}
	}, []);

	return {
		lastProvider,
		setLastProvider,
	};
}
