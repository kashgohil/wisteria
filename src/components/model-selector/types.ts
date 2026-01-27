import type { ModelInfo } from "../../../shared/models";
import type { ProviderId } from "../../../shared/providers";

// Provider connectivity status
export type ProviderStatus = "connected" | "no-api-key" | "unreachable";

// Sort options for model list
export type ModelSortOption = "name" | "price-asc" | "price-desc" | "context";

// Starred model entry
export type StarredModel = {
	modelId: string;
	provider: ProviderId;
	starredAt: number;
};

// Filter state for model browser
export type ModelFilters = {
	search: string;
	capabilities: {
		vision: boolean;
		audio: boolean;
		video: boolean;
	};
	makers: string[];
	sort: ModelSortOption;
};

// Props for main ModelSelector component
export type ModelSelectorProps = {
	models: ModelInfo[];
	selectedModelId: string;
	onValueChange: (value: string) => void;
	disabled?: boolean;
};

// Aggregator providers that host models from multiple makers
export const AGGREGATOR_PROVIDERS: ProviderId[] = ["openrouter", "groq"];

// Check if a provider is an aggregator
export function isAggregator(providerId: ProviderId): boolean {
	return AGGREGATOR_PROVIDERS.includes(providerId);
}

// localStorage keys
export const STORAGE_KEYS = {
	RECENT_MODELS: "wisteria-recent-models",
	STARRED_MODELS: "wisteria-starred-models",
	LAST_PROVIDER: "wisteria-last-provider",
} as const;

// Max items for recent models
export const MAX_RECENT_MODELS = 8;
