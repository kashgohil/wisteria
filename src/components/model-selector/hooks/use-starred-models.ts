import { useCallback, useEffect, useState } from "react";
import type { ProviderId } from "../../../../shared/providers";
import { STORAGE_KEYS, type StarredModel } from "../types";

export function useStarredModels() {
	const [starredModels, setStarredModels] = useState<StarredModel[]>([]);

	// Load from localStorage on mount
	useEffect(() => {
		try {
			const stored = localStorage.getItem(STORAGE_KEYS.STARRED_MODELS);
			if (stored) {
				setStarredModels(JSON.parse(stored));
			}
		} catch (e) {
			console.error("Failed to load starred models", e);
		}
	}, []);

	// Save to localStorage whenever starred models change
	const saveToStorage = useCallback((models: StarredModel[]) => {
		try {
			localStorage.setItem(STORAGE_KEYS.STARRED_MODELS, JSON.stringify(models));
		} catch (e) {
			console.error("Failed to save starred models", e);
		}
	}, []);

	// Check if a model is starred
	const isStarred = useCallback(
		(modelId: string, provider: ProviderId): boolean => {
			return starredModels.some(
				(m) => m.modelId === modelId && m.provider === provider,
			);
		},
		[starredModels],
	);

	// Toggle starred status for a model
	const toggleStar = useCallback(
		(modelId: string, provider: ProviderId) => {
			setStarredModels((prev) => {
				const exists = prev.some(
					(m) => m.modelId === modelId && m.provider === provider,
				);

				let newStarred: StarredModel[];
				if (exists) {
					// Remove from starred
					newStarred = prev.filter(
						(m) => !(m.modelId === modelId && m.provider === provider),
					);
				} else {
					// Add to starred
					newStarred = [
						...prev,
						{ modelId, provider, starredAt: Date.now() },
					];
				}

				saveToStorage(newStarred);
				return newStarred;
			});
		},
		[saveToStorage],
	);

	// Get starred model IDs for a specific provider (or all if no provider specified)
	const getStarredForProvider = useCallback(
		(provider?: ProviderId): StarredModel[] => {
			if (!provider) {
				return starredModels;
			}
			return starredModels.filter((m) => m.provider === provider);
		},
		[starredModels],
	);

	return {
		starredModels,
		isStarred,
		toggleStar,
		getStarredForProvider,
	};
}
