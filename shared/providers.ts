export type ProviderId =
	| "ollama"
	| "lmstudio"
	| "llamacpp"
	| "openrouter"
	| "openai"
	| "anthropic"
	| "gemini"
	| "grok"
	| "groq";

export const PROVIDER_NAMES: Record<ProviderId, string> = {
	ollama: "Ollama",
	lmstudio: "LM Studio",
	llamacpp: "llama.cpp",
	openrouter: "OpenRouter",
	openai: "OpenAI",
	anthropic: "Anthropic",
	gemini: "Google Gemini",
	grok: "Grok (xAI)",
	groq: "Groq",
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
	{ id: "llamacpp", label: "llama.cpp", kind: "local" },
	{ id: "openrouter", label: "OpenRouter", kind: "online" },
	{ id: "openai", label: "OpenAI", kind: "online" },
	{ id: "anthropic", label: "Anthropic", kind: "online" },
	{ id: "gemini", label: "Google Gemini", kind: "online" },
	{ id: "grok", label: "Grok (xAI)", kind: "online" },
	{ id: "groq", label: "Groq", kind: "online" },
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
	llamacpp: null,
	openrouter: "openrouter_api_key",
	openai: "openai_api_key",
	anthropic: "anthropic_api_key",
	gemini: "gemini_api_key",
	grok: "grok_api_key",
	groq: "groq_api_key",
};
