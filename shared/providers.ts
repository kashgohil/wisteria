export type ProviderId =
	| "ollama"
	| "lmstudio"
	| "openrouter"
	| "openai"
	| "anthropic";

export const PROVIDER_NAMES: Record<ProviderId, string> = {
	ollama: "Ollama",
	lmstudio: "LM Studio",
	openrouter: "OpenRouter",
	openai: "OpenAI",
	anthropic: "Anthropic",
};

export type ProviderKind = "local" | "online";

export type ProviderMeta = {
	id: ProviderId;
	label: string;
	kind: ProviderKind;
};

export const PROVIDERS: ProviderMeta[] = [
	{ id: "ollama", label: "Ollama", kind: "local" },
	{ id: "lmstudio", label: "LM Studio", kind: "local" },
	{ id: "openrouter", label: "OpenRouter", kind: "online" },
	{ id: "openai", label: "OpenAI", kind: "online" },
	{ id: "anthropic", label: "Anthropic", kind: "online" },
];

export const LOCAL_PROVIDERS = PROVIDERS.filter((p) => p.kind === "local").map(
	(p) => p.id,
);

export const ONLINE_PROVIDERS = PROVIDERS.filter(
	(p) => p.kind === "online",
).map((p) => p.id);

export const PROVIDER_KEY_MAP: Record<ProviderId, string | null> = {
	ollama: null,
	lmstudio: null,
	openrouter: "openrouter_api_key",
	openai: "openai_api_key",
	anthropic: "anthropic_api_key",
};
