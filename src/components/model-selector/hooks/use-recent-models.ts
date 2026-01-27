import { useCallback, useEffect, useState } from "react";
import { MAX_RECENT_MODELS, STORAGE_KEYS } from "../types";

export function useRecentModels() {
	const [recentModelIds, setRecentModelIds] = useState<string[]>([]);

	// Load from localStorage on mount
	useEffect(() => {
		try {
			const stored = localStorage.getItem(STORAGE_KEYS.RECENT_MODELS);
			if (stored) {
				setRecentModelIds(JSON.parse(stored));
			}
		} catch (e) {
			console.error("Failed to load recent models", e);
		}
	}, []);

	// Add a model to recent list
	const addToRecent = useCallback((modelId: string) => {
		setRecentModelIds((prev) => {
			// Move to front if already exists, or add to front
			const newRecents = [
				modelId,
				...prev.filter((id) => id !== modelId),
			].slice(0, MAX_RECENT_MODELS);

			// Save to localStorage
			try {
				localStorage.setItem(
					STORAGE_KEYS.RECENT_MODELS,
					JSON.stringify(newRecents),
				);
			} catch (e) {
				console.error("Failed to save recent models", e);
			}

			return newRecents;
		});
	}, []);

	return {
		recentModelIds,
		addToRecent,
	};
}
