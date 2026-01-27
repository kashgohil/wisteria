import type {
	ChatModelRequest,
	ChatModelResponse,
	ImageContentPart,
	MessageContent,
	ModelInfo,
	ModelPricing,
	ResponseImage,
	TextContentPart,
} from "../../shared/models";

const OLLAMA_URL = "http://localhost:11434";
const LMSTUDIO_URL = "http://localhost:1234";
const LLAMACPP_URL = "http://localhost:8080";
const OPENROUTER_URL = "https://openrouter.ai/api/v1";
const OPENAI_URL = "https://api.openai.com/v1";
const ANTHROPIC_URL = "https://api.anthropic.com/v1";
const GEMINI_URL = "https://generativelanguage.googleapis.com/v1beta";
const GROK_URL = "https://api.x.ai/v1";
const GROQ_URL = "https://api.groq.com/openai/v1";
const REQUEST_TIMEOUT_MS = 2000;

const OPENROUTER_FALLBACK_MODELS: ModelInfo[] = [
	{
		id: "openrouter/auto",
		name: "OpenRouter Auto",
		provider: "openrouter",
		maker: "OpenRouter",
	},
	{
		id: "anthropic/claude-3.5-sonnet",
		name: "Claude 3.5 Sonnet (OpenRouter)",
		provider: "openrouter",
		maker: "Anthropic",
	},
];

const OPENAI_DEFAULT_MODELS: ModelInfo[] = [
	{
		id: "gpt-4o",
		name: "GPT-4o",
		provider: "openai",
		capabilities: { vision: true },
		maker: "OpenAI",
	},
	{
		id: "gpt-4o-mini",
		name: "GPT-4o Mini",
		provider: "openai",
		capabilities: { vision: true },
		maker: "OpenAI",
	},
];

const ANTHROPIC_DEFAULT_MODELS: ModelInfo[] = [
	{
		id: "claude-sonnet-4-5-20250514",
		name: "Claude Sonnet 4.5",
		provider: "anthropic",
		capabilities: { vision: true },
		maker: "Anthropic",
	},
	{
		id: "claude-opus-4-5-20251101",
		name: "Claude Opus 4.5",
		provider: "anthropic",
		capabilities: { vision: true },
		maker: "Anthropic",
	},
	{
		id: "claude-3-5-sonnet-20241022",
		name: "Claude 3.5 Sonnet",
		provider: "anthropic",
		capabilities: { vision: true },
		maker: "Anthropic",
	},
	{
		id: "claude-3-5-haiku-20241022",
		name: "Claude 3.5 Haiku",
		provider: "anthropic",
		capabilities: { vision: true },
		maker: "Anthropic",
	},
	{
		id: "claude-3-opus-20240229",
		name: "Claude 3 Opus",
		provider: "anthropic",
		capabilities: { vision: true },
		maker: "Anthropic",
	},
];

const GEMINI_DEFAULT_MODELS: ModelInfo[] = [
	{
		id: "gemini-2.0-flash-exp",
		name: "Gemini 2.0 Flash (Experimental)",
		provider: "gemini",
		capabilities: { vision: true },
		maker: "Google",
	},
	{
		id: "gemini-1.5-pro",
		name: "Gemini 1.5 Pro",
		provider: "gemini",
		capabilities: { vision: true },
		maker: "Google",
	},
	{
		id: "gemini-1.5-flash",
		name: "Gemini 1.5 Flash",
		provider: "gemini",
		capabilities: { vision: true },
		maker: "Google",
	},
];

const GROK_DEFAULT_MODELS: ModelInfo[] = [
	{
		id: "grok-beta",
		name: "Grok Beta",
		provider: "grok",
		maker: "xAI",
	},
	{
		id: "grok-vision-beta",
		name: "Grok Vision Beta",
		provider: "grok",
		capabilities: { vision: true },
		maker: "xAI",
	},
];

const GROQ_DEFAULT_MODELS: ModelInfo[] = [
	{
		id: "llama-3.3-70b-versatile",
		name: "Llama 3.3 70B Versatile",
		provider: "groq",
		maker: "Meta",
	},
	{
		id: "llama-3.1-8b-instant",
		name: "Llama 3.1 8B Instant",
		provider: "groq",
		maker: "Meta",
	},
	{
		id: "mixtral-8x7b-32768",
		name: "Mixtral 8x7B",
		provider: "groq",
		maker: "Mistral",
	},
	{
		id: "gemma2-9b-it",
		name: "Gemma 2 9B",
		provider: "groq",
		maker: "Google",
	},
];

function inferMaker(modelId: string, provider?: string): string {
	const lower = modelId.toLowerCase();

	// OpenRouter specific prefix handling
	if (provider === "openrouter" && modelId.includes("/")) {
		const prefix = modelId.split("/")[0].toLowerCase();
		const prefixMap: Record<string, string> = {
			anthropic: "Anthropic",
			google: "Google",
			openai: "OpenAI",
			meta: "Meta",
			"meta-llama": "Meta",
			mistral: "Mistral",
			cohere: "Cohere",
			microsoft: "Microsoft",
			gryphe: "Gryphe",
			"nous-research": "Nous Research",
			"neversleep": "NeverSleep",
			perplexity: "Perplexity",
			deepseek: "DeepSeek",
			qwen: "Alibaba",
			"01-ai": "01.AI",
			"cognitive-lab": "Cognitive Lab",
			"liquid": "Liquid",
			"nvidia": "Nvidia",
			"x-ai": "xAI",
		};
		if (prefixMap[prefix]) return prefixMap[prefix];
	}

	if (lower.includes("gpt") || lower.includes("o1-")) return "OpenAI";
	if (lower.includes("claude")) return "Anthropic";
	if (lower.includes("gemini") || lower.includes("gemma")) return "Google";
	if (lower.includes("llama")) return "Meta";
	if (lower.includes("mistral") || lower.includes("mixtral")) return "Mistral";
	if (lower.includes("qwen")) return "Alibaba";
	if (lower.includes("phi")) return "Microsoft";
	if (lower.includes("grok")) return "xAI";
	if (lower.includes("deepseek")) return "DeepSeek";
	if (lower.includes("command")) return "Cohere";
	if (lower.includes("jamba")) return "AI21";
	if (provider === "openai") return "OpenAI";
	if (provider === "anthropic") return "Anthropic";
	if (provider === "gemini") return "Google";
	if (provider === "grok") return "xAI";
	return "Other";
}

async function fetchWithTimeout(
	url: string,
	options: RequestInit = {},
): Promise<Response> {
	const controller = new AbortController();
	const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
	try {
		return await fetch(url, { ...options, signal: controller.signal });
	} finally {
		clearTimeout(timeout);
	}
}

function isConnectionRefused(err: unknown): boolean {
	const code = (err as { code?: string })?.code;
	if (code === "ECONNREFUSED")
		return (err as Error).message.includes("ECONNREFUSED");
	const cause = (err as { cause?: unknown })?.cause as
		| { code?: string; errors?: unknown[] }
		| undefined;
	if (cause?.code === "ECONNREFUSED") return true;
	if (Array.isArray(cause?.errors)) {
		return cause.errors.some(
			(e) => (e as { code?: string })?.code === "ECONNREFUSED",
		);
	}
	return false;
}

function logConnectionIssue(label: string, err: unknown) {
	if (isConnectionRefused(err)) {
		// LM Studio / Ollama not running; keep log minimal
		console.info(`${label} not reachable on localhost`);
		return;
	}
	if ((err as { name?: string })?.name === "AbortError") {
		console.info(`${label} request timed out`);
		return;
	}
	// Reduce noise while still surfacing unexpected errors
	console.warn(`${label} request issue`);
}

// --- Multi-modal helpers ---

function extractText(content: MessageContent): string {
	if (typeof content === "string") return content;
	return content
		.filter((part) => part.type === "text")
		.map((part) => (part as TextContentPart).text)
		.join("\n");
}

function extractImages(content: MessageContent): string[] {
	if (typeof content === "string") return [];
	return content
		.filter((part) => part.type === "image")
		.map((part) => (part as ImageContentPart).source.data);
}

function convertOpenAIContent(content: MessageContent): unknown {
	if (typeof content === "string") return content;
	return content.map((part) => {
		if (part.type === "text") {
			return { type: "text", text: part.text };
		}
		if (part.type === "image") {
			return {
				type: "image_url",
				image_url: {
					url: `data:${part.source.media_type};base64,${part.source.data}`,
				},
			};
		}
		return null;
	}).filter(Boolean);
}

function convertAnthropicContent(content: MessageContent): unknown[] {
	if (typeof content === "string") return [{ type: "text", text: content }];
	return content.map((part) => {
		if (part.type === "text") {
			return { type: "text", text: part.text };
		}
		if (part.type === "image") {
			return {
				type: "image",
				source: {
					type: "base64",
					media_type: part.source.media_type,
					data: part.source.data,
				},
			};
		}
		return null;
	}).filter(Boolean) as unknown[];
}

function convertGeminiContent(content: MessageContent): unknown[] {
	const parts: unknown[] = [];
	if (typeof content === "string") {
		parts.push({ text: content });
	} else {
		for (const part of content) {
			if (part.type === "text") {
				parts.push({ text: part.text });
			} else if (part.type === "image") {
				parts.push({
					inline_data: {
						mime_type: part.source.media_type,
						data: part.source.data,
					},
				});
			}
		}
	}
	return parts;
}

// --- End helpers ---

export async function listOllamaModels(): Promise<ModelInfo[]> {
	try {
		const res = await fetchWithTimeout(`${OLLAMA_URL}/api/tags`);
		if (!res.ok) throw new Error(`Ollama responded ${res.status}`);
		const data = (await res.json()) as { models?: { name: string }[] };
		return (data.models ?? []).map((m) => ({
			id: m.name,
			name: m.name,
			provider: "ollama",
			maker: inferMaker(m.name, "ollama"),
		}));
	} catch (err) {
		logConnectionIssue("Ollama list", err);
		return [];
	}
}

export async function listLmStudioModels(): Promise<ModelInfo[]> {
	try {
		const res = await fetchWithTimeout(`${LMSTUDIO_URL}/v1/models`);
		if (!res.ok) throw new Error(`LM Studio responded ${res.status}`);
		const data = (await res.json()) as { data?: { id: string }[] };
		return (data.data ?? []).map((m) => ({
			id: m.id,
			name: m.id,
			provider: "lmstudio",
			maker: inferMaker(m.id, "lmstudio"),
		}));
	} catch (err) {
		logConnectionIssue("LM Studio list", err);
		return [];
	}
}

export async function listLlamaCppModels(): Promise<ModelInfo[]> {
	try {
		const res = await fetchWithTimeout(`${LLAMACPP_URL}/v1/models`);
		if (!res.ok) throw new Error(`llama.cpp responded ${res.status}`);
		const data = (await res.json()) as { data?: { id: string }[] };
		return (data.data ?? []).map((m) => ({
			id: m.id,
			name: m.id,
			provider: "llamacpp",
			maker: inferMaker(m.id, "llamacpp"),
		}));
	} catch (err) {
		logConnectionIssue("llama.cpp list", err);
		return [];
	}
}

export async function listOpenAIModels(
	apiKey?: string | null,
): Promise<ModelInfo[]> {
	if (!apiKey) {
		return OPENAI_DEFAULT_MODELS;
	}

	try {
		const res = await fetchWithTimeout(`${OPENAI_URL}/models`, {
			headers: {
				Authorization: `Bearer ${apiKey}`,
				"Content-Type": "application/json",
			},
		});
		if (!res.ok) {
			console.warn(`OpenAI models API responded ${res.status}`);
			return OPENAI_DEFAULT_MODELS;
		}

		const data = (await res.json()) as {
			data?: {
				id?: string;
				created?: number;
				owned_by?: string;
			}[];
		};

		// Filter for chat models (gpt-* models)
		const models = data.data
			?.filter((m) => m.id?.startsWith("gpt-"))
			.map((m) => ({
				id: m.id as string,
				name: m.id as string,
				provider: "openai" as const,
				maker: "OpenAI",
			}));

		if (models && models.length > 0) {
			return models;
		}
	} catch (err) {
		console.warn("OpenAI list issue", err);
	}

	return OPENAI_DEFAULT_MODELS;
}

export async function listAnthropicModels(
	_apiKey?: string | null,
): Promise<ModelInfo[]> {
	// Anthropic doesn't have a public models listing API
	// We return default models regardless of API key
	return ANTHROPIC_DEFAULT_MODELS;
}

export async function listGeminiModels(
	apiKey?: string | null,
): Promise<ModelInfo[]> {
	if (!apiKey) {
		return GEMINI_DEFAULT_MODELS;
	}

	try {
		const res = await fetchWithTimeout(
			`${GEMINI_URL}/models?key=${apiKey}`,
			{
				headers: {
					"Content-Type": "application/json",
				},
			},
		);
		if (!res.ok) {
			console.warn(`Gemini models API responded ${res.status}`);
			return GEMINI_DEFAULT_MODELS;
		}

		const data = (await res.json()) as {
			models?: {
				name?: string;
				displayName?: string;
				description?: string;
			}[];
		};

		const models = data.models
			?.filter((m) => m.name?.includes("generateContent"))
			.map((m) => {
				const modelId = m.name?.replace("models/", "") ?? "";
				return {
					id: modelId,
					name: m.displayName ?? modelId,
					provider: "gemini" as const,
					description: m.description,
					maker: "Google",
				};
			});

		if (models && models.length > 0) {
			return models;
		}
	} catch (err) {
		console.warn("Gemini list issue", err);
	}

	return GEMINI_DEFAULT_MODELS;
}

export async function listGrokModels(
	apiKey?: string | null,
): Promise<ModelInfo[]> {
	if (!apiKey) {
		return GROK_DEFAULT_MODELS;
	}

	try {
		// Grok uses OpenAI-compatible API
		const res = await fetchWithTimeout(`${GROK_URL}/models`, {
			headers: {
				Authorization: `Bearer ${apiKey}`,
				"Content-Type": "application/json",
			},
		});
		if (!res.ok) {
			console.warn(`Grok models API responded ${res.status}`);
			return GROK_DEFAULT_MODELS;
		}

		const data = (await res.json()) as {
			data?: {
				id?: string;
				created?: number;
				owned_by?: string;
			}[];
		};

		const models = data.data?.map((m) => ({
			id: m.id as string,
			name: m.id as string,
			provider: "grok" as const,
			maker: "xAI",
		}));

		if (models && models.length > 0) {
			return models;
		}
	} catch (err) {
		console.warn("Grok list issue", err);
	}

	return GROK_DEFAULT_MODELS;
}

export async function listGroqModels(
	apiKey?: string | null,
): Promise<ModelInfo[]> {
	if (!apiKey) {
		return GROQ_DEFAULT_MODELS;
	}

	try {
		const res = await fetchWithTimeout(`${GROQ_URL}/models`, {
			headers: {
				Authorization: `Bearer ${apiKey}`,
				"Content-Type": "application/json",
			},
		});
		if (!res.ok) {
			console.warn(`Groq models API responded ${res.status}`);
			return GROQ_DEFAULT_MODELS;
		}

		const data = (await res.json()) as {
			data?: {
				id?: string;
				object?: string;
				created?: number;
				owned_by?: string;
			}[];
		};

		const models = data.data?.map((m) => ({
			id: m.id as string,
			name: m.id as string,
			provider: "groq" as const,
			maker: inferMaker(m.id as string, "groq"),
		}));

		if (models && models.length > 0) {
			return models;
		}
	} catch (err) {
		console.warn("Groq list issue", err);
	}

	return GROQ_DEFAULT_MODELS;
}

export async function listOpenRouterModels(
	apiKey?: string | null,
): Promise<ModelInfo[]> {
	try {
		const headers: Record<string, string> = {
			Accept: "application/json",
			"X-Title": "Wisteria",
		};
		if (apiKey) {
			headers.Authorization = `Bearer ${apiKey}`;
		}

		const res = await fetchWithTimeout(`${OPENROUTER_URL}/models`, {
			headers,
		});
		if (!res.ok) throw new Error(`OpenRouter responded ${res.status}`);
		const data = (await res.json()) as {
			data?: {
				id?: string;
				name?: string;
				description?: string;
				architecture?: {
					modality?: string;
					input_modalities?: string[];
					output_modalities?: string[];
				};
				context_length?: number;
				default_parameters?: Record<string, unknown>;
				supported_parameters?: string[];
				pricing?: {
					prompt?: string;
					completion?: string;
					input?: string;
					output?: string;
					image?: string;
					web_search?: string;
				};
			}[];
		};

		const models = data.data
			?.filter((m) => Boolean(m.id))
			.map((m) => {
				let pricing: ModelPricing = {};
				if (m.pricing) {
					pricing = {
						image:
							m.pricing?.image && Number(m.pricing.image) > 0
								? (Number(m.pricing.image) * 1e6).toFixed(2)
								: undefined,
						web_search: m.pricing?.web_search
							? (Number(m.pricing.web_search) * 1e6).toFixed(2)
							: undefined,
						input:
							m.pricing?.input && Number(m.pricing.input) > 0
								? (Number(m.pricing.input) * 1e6).toFixed(2)
								: undefined,
						output:
							m.pricing?.output && Number(m.pricing.output) > 0
								? (Number(m.pricing.output) * 1e6).toFixed(2)
								: undefined,
						prompt:
							m.pricing?.prompt && Number(m.pricing.prompt) > 0
								? (Number(m.pricing.prompt) * 1e6).toFixed(2)
								: undefined,
						completion:
							m.pricing?.completion && Number(m.pricing.completion) > 0
								? (Number(m.pricing.completion) * 1e6).toFixed(2)
								: undefined,
					};
				}

				return {
					id: m.id as string,
					name: m.name as string,
					pricing,
					description: m.description,
					architecture: m.architecture,
					context_length: m.context_length,
					default_parameters: m.default_parameters,
					supported_parameters: m.supported_parameters,
					provider: "openrouter" as const,
					maker: inferMaker(m.id as string, "openrouter"),
				};
			});
		if (models && models.length) return models;
	} catch (err) {
		console.warn("OpenRouter list issue", err);
	}
	return OPENROUTER_FALLBACK_MODELS;
}

type StreamCallbacks = {
	onDelta?: (text: string) => void;
};

export async function sendToModel(
	request: ChatModelRequest,
	callbacks: StreamCallbacks = {},
): Promise<ChatModelResponse> {
	console.log(`Sending to model: ${request.provider}/${request.model}`, {
		messageCount: request.messages.length,
		lastMessageContent: request.messages[request.messages.length - 1]?.content,
		stream: request.stream
	});

	try {
		switch (request.provider) {
			case "ollama":
				return await sendOllama(request, callbacks);
			case "lmstudio":
				return await sendLmStudio(request, callbacks);
			case "llamacpp":
				return await sendLlamaCpp(request, callbacks);
			case "openrouter":
				return await sendOpenRouter(request, callbacks);
			case "openai":
				return await sendOpenAI(request, callbacks);
			case "anthropic":
				return await sendAnthropic(request, callbacks);
			case "gemini":
				return await sendGemini(request, callbacks);
			case "grok":
				return await sendGrok(request, callbacks);
			case "groq":
				return await sendGroq(request, callbacks);
			default:
				throw new Error("Unsupported provider");
		}
	} catch (err) {
		console.error("Error in sendToModel:", err);
		throw err;
	}
}

async function sendOllama(
	req: ChatModelRequest,
	callbacks: StreamCallbacks,
): Promise<ChatModelResponse> {
	const messages = req.messages.map(m => ({
		role: m.role,
		content: extractText(m.content),
		images: extractImages(m.content).length > 0 ? extractImages(m.content) : undefined
	}));

	console.log("Ollama request messages:", JSON.stringify(messages, null, 2));

	const res = await fetch(`${OLLAMA_URL}/api/chat`, {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify({
			model: req.model,
			messages: messages,
			stream: Boolean(req.stream),
		}),
	});
	if (!res.ok) {
		const text = await res.text();
		console.error(`Ollama error ${res.status}:`, text);
		throw new Error(`Ollama error ${res.status}`);
	}

	if (req.stream) {
		const { content, raw } = await readNdjsonStream(res, callbacks.onDelta);
		return { content, raw, requestId: req.requestId };
	}

	const data = (await res.json()) as { message?: { content?: string } };
	console.log("Ollama response data:", data);
	return {
		content: data.message?.content ?? "",
		raw: data,
		requestId: req.requestId,
	};
}

async function sendLmStudio(
	req: ChatModelRequest,
	callbacks: StreamCallbacks,
): Promise<ChatModelResponse> {
	// LM Studio uses OpenAI-compatible API
	const messages = req.messages.map(m => ({
		role: m.role,
		content: convertOpenAIContent(m.content)
	}));

	const res = await fetch(`${LMSTUDIO_URL}/v1/chat/completions`, {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify({
			model: req.model,
			messages,
			stream: Boolean(req.stream),
		}),
	});
	if (!res.ok) {
		throw new Error(`LM Studio error ${res.status}`);
	}

	if (req.stream) {
		const { content, raw } = await readSseStream(res, callbacks.onDelta);
		return { content, raw, requestId: req.requestId };
	}

	const data = (await res.json()) as {
		choices?: { message?: { content?: string } }[];
	};
	const content = data.choices?.[0]?.message?.content ?? "";
	return { content, raw: data, requestId: req.requestId };
}

async function sendLlamaCpp(
	req: ChatModelRequest,
	callbacks: StreamCallbacks,
): Promise<ChatModelResponse> {
	// Llama.cpp uses OpenAI-compatible API
	const messages = req.messages.map(m => ({
		role: m.role,
		content: convertOpenAIContent(m.content)
	}));

	const res = await fetch(`${LLAMACPP_URL}/v1/chat/completions`, {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify({
			model: req.model,
			messages,
			stream: Boolean(req.stream),
		}),
	});
	if (!res.ok) {
		throw new Error(`llama.cpp error ${res.status}`);
	}

	if (req.stream) {
		const { content, raw } = await readSseStream(res, callbacks.onDelta);
		return { content, raw, requestId: req.requestId };
	}

	const data = (await res.json()) as {
		choices?: { message?: { content?: string } }[];
	};
	const content = data.choices?.[0]?.message?.content ?? "";
	return { content, raw: data, requestId: req.requestId };
}

async function sendOpenRouter(
	req: ChatModelRequest,
	callbacks: StreamCallbacks,
): Promise<ChatModelResponse> {
	if (!req.apiKey) {
		throw new Error("OpenRouter API key missing");
	}
	
	const messages = req.messages.map(m => ({
		role: m.role,
		content: convertOpenAIContent(m.content)
	}));

	console.log("OpenRouter request messages:", JSON.stringify(messages, null, 2));

	const res = await fetch(`${OPENROUTER_URL}/chat/completions`, {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
			Authorization: `Bearer ${req.apiKey}`,
		},
		body: JSON.stringify({
			model: req.model,
			messages,
			stream: Boolean(req.stream),
		}),
	});
	if (!res.ok) {
		const text = await res.text();
		console.error(`OpenRouter error ${res.status}:`, text);
		throw new Error(`OpenRouter error ${res.status}`);
	}

	if (req.stream) {
		const { content, raw } = await readSseStream(res, callbacks.onDelta);
		return { content, raw, requestId: req.requestId };
	}

	const data = (await res.json()) as {
		choices?: { message?: { content?: string } }[];
	};
	console.log("OpenRouter response data:", data);
	const content = data.choices?.[0]?.message?.content ?? "";
	return { content, raw: data, requestId: req.requestId };
}

async function sendOpenAI(
	req: ChatModelRequest,
	callbacks: StreamCallbacks,
): Promise<ChatModelResponse> {
	if (!req.apiKey) {
		throw new Error("OpenAI API key missing");
	}

	const messages = req.messages.map(m => ({
		role: m.role,
		content: convertOpenAIContent(m.content)
	}));

	const res = await fetch(`${OPENAI_URL}/chat/completions`, {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
			Authorization: `Bearer ${req.apiKey}`,
		},
		body: JSON.stringify({
			model: req.model,
			messages,
			stream: Boolean(req.stream),
		}),
	});

	if (!res.ok) {
		throw new Error(`OpenAI error ${res.status}`);
	}

	if (req.stream) {
		const { content, raw } = await readSseStream(res, callbacks.onDelta);
		return { content, raw, requestId: req.requestId };
	}

	const data = (await res.json()) as {
		choices?: { message?: { content?: string } }[];
	};
	const content = data.choices?.[0]?.message?.content ?? "";
	return { content, raw: data, requestId: req.requestId };
}

async function sendAnthropic(
	req: ChatModelRequest,
	callbacks: StreamCallbacks,
): Promise<ChatModelResponse> {
	if (!req.apiKey) {
		throw new Error("Anthropic API key missing");
	}

	const system = req.messages
		.filter((m) => m.role === "system")
		.map((m) => extractText(m.content))
		.join("\n\n");

	const messages = req.messages
		.filter((m) => m.role !== "system")
		.map((m) => ({
			role: m.role === "assistant" ? "assistant" : ("user" as const),
			content: convertAnthropicContent(m.content),
		}));

	const res = await fetch(`${ANTHROPIC_URL}/messages`, {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
			"X-API-Key": req.apiKey,
			"anthropic-version": "2023-06-01",
		},
		body: JSON.stringify({
			model: req.model,
			messages,
			stream: Boolean(req.stream),
			system: system || undefined,
			max_tokens: 1024,
		}),
	});

	if (!res.ok) {
		throw new Error(`Anthropic error ${res.status}`);
	}

	if (req.stream) {
		const { content, raw } = await readAnthropicStream(res, callbacks.onDelta);
		return { content, raw, requestId: req.requestId };
	}

	const data = (await res.json()) as {
		content?: { text?: string }[];
	};
	const content = data.content?.[0]?.text ?? "";
	return { content, raw: data, requestId: req.requestId };
}

async function readNdjsonStream(
	res: Response,
	onDelta?: (delta: string) => void,
): Promise<{ content: string; raw: unknown[] }> {
	const reader = res.body?.getReader();
	if (!reader) throw new Error("No streaming body available");

	const decoder = new TextDecoder();
	let buffer = "";
	let full = "";
	const raw: unknown[] = [];

	try {
		for (;;) {
			const { value, done } = await reader.read();
			if (done) break;
			buffer += decoder.decode(value, { stream: true });

			const lines = buffer.split("\n");
			buffer = lines.pop() ?? "";

			for (const line of lines) {
				const trimmed = line.trim();
				if (!trimmed) continue;
				try {
					const json = JSON.parse(trimmed) as {
						message?: { content?: string };
						error?: string;
					};
					raw.push(json);

					if (json.error) {
						throw new Error(`Ollama stream error: ${json.error}`);
					}

					const delta = json.message?.content ?? "";
					if (delta) {
						full += delta;
						onDelta?.(delta);
					}
				} catch (err) {
					if ((err as Error).message.includes("Ollama stream error")) throw err;
					console.warn("Ollama stream parse issue", err);
				}
			}
		}
	} finally {
		reader.releaseLock();
	}

	return { content: full, raw };
}

async function readSseStream(
	res: Response,
	onDelta?: (delta: string) => void,
): Promise<{ content: string; raw: unknown[] }> {
	const reader = res.body?.getReader();
	if (!reader) throw new Error("No streaming body available");

	const decoder = new TextDecoder();
	let buffer = "";
	let full = "";
	const raw: unknown[] = [];

	try {
		for (;;) {
			const { value, done } = await reader.read();
			if (done) break;
			const chunk = decoder.decode(value, { stream: true });
			buffer += chunk;

			const lines = buffer.split(/\r?\n/);
			buffer = lines.pop() ?? "";

			for (const line of lines) {
				const trimmed = line.trim();
				if (!trimmed.startsWith("data:")) continue;
				const payload = trimmed.slice(5).trim();
				if (!payload || payload === "[DONE]") continue;
				try {
					const json = JSON.parse(payload) as {
						choices?: { delta?: { content?: string } }[];
						error?: { message?: string };
					};
					raw.push(json);

					if (json.error) {
						throw new Error(json.error.message || "Unknown stream error");
					}

					const delta = json.choices?.[0]?.delta?.content ?? "";
					if (delta) {
						full += delta;
						onDelta?.(delta);
					}
				} catch (err) {
					// Re-throw if it's an API error we just detected
					if ((err as Error).message !== "Unexpected end of JSON input" && !(err instanceof SyntaxError)) {
						// Check if it looks like one of our errors
						const msg = (err as { message?: string }).message;
						if (msg && !msg.startsWith("JSON")) {
							throw err;
						}
					}
					console.warn("SSE stream parse issue", err, "Payload:", payload);
				}
			}
		}
	} finally {
		reader.releaseLock();
	}
	
	console.log("SSE Stream finished. Full content length:", full.length);
	return { content: full, raw };
}

async function readAnthropicStream(
	res: Response,
	onDelta?: (delta: string) => void,
): Promise<{ content: string; raw: unknown[] }> {
	const reader = res.body?.getReader();
	if (!reader) throw new Error("No streaming body available");

	const decoder = new TextDecoder();
	let buffer = "";
	let full = "";
	const raw: unknown[] = [];

	try {
		for (;;) {
			const { value, done } = await reader.read();
			if (done) break;
			buffer += decoder.decode(value, { stream: true });

			const lines = buffer.split(/\r?\n/);
			buffer = lines.pop() ?? "";

			for (const line of lines) {
				const trimmed = line.trim();
				if (!trimmed.startsWith("data:")) continue;
				const payload = trimmed.slice(5).trim();
				if (!payload || payload === "[DONE]") continue;
				try {
					const json = JSON.parse(payload) as {
						type?: string;
						delta?: { text?: string };
						content_block?: { text?: string };
						error?: { type: string; message: string };
					};
					raw.push(json);

					if (json.type === "error" && json.error) {
						throw new Error(json.error.message || "Anthropic stream error");
					}

					const delta =
						json.type === "content_block_delta"
							? json.delta?.text ?? ""
							: json.type === "content_block_start"
							? json.content_block?.text ?? ""
							: "";
					if (delta) {
						full += delta;
						onDelta?.(delta);
					}
				} catch (err) {
					const msg = (err as { message?: string }).message;
					if (msg && !msg.startsWith("JSON") && !(err instanceof SyntaxError)) {
						throw err;
					}
					console.warn("Anthropic stream parse issue", err);
				}
			}
		}
	} finally {
		reader.releaseLock();
	}

	return { content: full, raw };
}

async function sendGemini(
	req: ChatModelRequest,
	callbacks: StreamCallbacks,
): Promise<ChatModelResponse> {
	if (!req.apiKey) {
		throw new Error("Gemini API key missing");
	}

	// Convert messages to Gemini format
	const contents = req.messages
		.filter((m) => m.role !== "system")
		.map((m) => ({
			role: m.role === "assistant" ? "model" : "user",
			parts: convertGeminiContent(m.content),
		}));

	// Extract system instruction if present
	const systemInstruction = req.messages
		.filter((m) => m.role === "system")
		.map((m) => extractText(m.content))
		.join("\n\n");

	const endpoint = req.stream ? "streamGenerateContent" : "generateContent";
	const url = `${GEMINI_URL}/models/${req.model}:${endpoint}?key=${req.apiKey}`;

	const body: {
		contents: { role: string; parts: unknown[] }[];
		systemInstruction?: { parts: { text: string }[] };
	} = {
		contents,
	};

	if (systemInstruction) {
		body.systemInstruction = {
			parts: [{ text: systemInstruction }],
		};
	}

	const res = await fetch(url, {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
		},
		body: JSON.stringify(body),
	});

	if (!res.ok) {
		const errorText = await res.text();
		throw new Error(`Gemini error ${res.status}: ${errorText}`);
	}

	if (req.stream) {
		const { content, images, raw } = await readGeminiStream(res, callbacks.onDelta);
		return { content, images: images.length > 0 ? images : undefined, raw, requestId: req.requestId };
	}

	const data = (await res.json()) as {
		candidates?: {
			content?: {
				parts?: { text?: string; inlineData?: { mimeType?: string; data?: string } }[];
			};
		}[];
	};
	const parts = data.candidates?.[0]?.content?.parts ?? [];
	let content = "";
	const images: ResponseImage[] = [];
	for (const part of parts) {
		if (part.text) {
			content += part.text;
		}
		if (part.inlineData?.data && part.inlineData?.mimeType) {
			images.push({
				mime_type: part.inlineData.mimeType,
				data: part.inlineData.data,
			});
		}
	}
	return { content, images: images.length > 0 ? images : undefined, raw: data, requestId: req.requestId };
}

async function readGeminiStream(
	res: Response,
	onDelta?: (delta: string) => void,
): Promise<{ content: string; images: ResponseImage[]; raw: unknown[] }> {
	const reader = res.body?.getReader();
	if (!reader) throw new Error("No streaming body available");

	const decoder = new TextDecoder();
	let buffer = "";
	let full = "";
	const images: ResponseImage[] = [];
	const raw: unknown[] = [];

	try {
		for (;;) {
			const { value, done } = await reader.read();
			if (done) break;
			buffer += decoder.decode(value, { stream: true });

			// Gemini streams chunks as JSON objects separated by newlines
			const lines = buffer.split(/\r?\n/);
			buffer = lines.pop() ?? "";

			for (const line of lines) {
				const trimmed = line.trim();
				if (!trimmed || trimmed === "[" || trimmed === "]" || trimmed === ",")
					continue;

				try {
					const json = JSON.parse(trimmed) as {
						candidates?: {
							content?: {
								parts?: { text?: string; inlineData?: { mimeType?: string; data?: string } }[];
							};
						}[];
						error?: { message?: string };
					};
					raw.push(json);

					if (json.error) {
						throw new Error(json.error.message || "Gemini stream error");
					}

					// Process all parts for text and images
					const parts = json.candidates?.[0]?.content?.parts ?? [];
					for (const part of parts) {
						if (part.text) {
							full += part.text;
							onDelta?.(part.text);
						}
						if (part.inlineData?.data && part.inlineData?.mimeType) {
							images.push({
								mime_type: part.inlineData.mimeType,
								data: part.inlineData.data,
							});
						}
					}
				} catch (err) {
					const msg = (err as { message?: string }).message;
					if (msg && !msg.startsWith("JSON") && !(err instanceof SyntaxError)) {
						throw err;
					}
					console.warn("Gemini stream parse issue", err);
				}
			}
		}
	} finally {
		reader.releaseLock();
	}

	return { content: full, images, raw };
}

async function sendGrok(
	req: ChatModelRequest,
	callbacks: StreamCallbacks,
): Promise<ChatModelResponse> {
	if (!req.apiKey) {
		throw new Error("Grok API key missing");
	}

	const messages = req.messages.map(m => ({
		role: m.role,
		content: convertOpenAIContent(m.content)
	}));

	// Grok uses OpenAI-compatible API
	const res = await fetch(`${GROK_URL}/chat/completions`, {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
			Authorization: `Bearer ${req.apiKey}`,
		},
		body: JSON.stringify({
			model: req.model,
			messages,
			stream: Boolean(req.stream),
		}),
	});

	if (!res.ok) {
		const errorText = await res.text();
		throw new Error(`Grok error ${res.status}: ${errorText}`);
	}

	if (req.stream) {
		const { content, raw } = await readSseStream(res, callbacks.onDelta);
		return { content, raw, requestId: req.requestId };
	}

	const data = (await res.json()) as {
		choices?: { message?: { content?: string } }[];
	};
	const content = data.choices?.[0]?.message?.content ?? "";
	return { content, raw: data, requestId: req.requestId };
}

async function sendGroq(
	req: ChatModelRequest,
	callbacks: StreamCallbacks,
): Promise<ChatModelResponse> {
	if (!req.apiKey) {
		throw new Error("Groq API key missing");
	}

	const messages = req.messages.map(m => ({
		role: m.role,
		content: convertOpenAIContent(m.content)
	}));

	// Groq uses OpenAI-compatible API
	const res = await fetch(`${GROQ_URL}/chat/completions`, {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
			Authorization: `Bearer ${req.apiKey}`,
		},
		body: JSON.stringify({
			model: req.model,
			messages,
			stream: Boolean(req.stream),
		}),
	});

	if (!res.ok) {
		const errorText = await res.text();
		throw new Error(`Groq error ${res.status}: ${errorText}`);
	}

	if (req.stream) {
		const { content, raw } = await readSseStream(res, callbacks.onDelta);
		return { content, raw, requestId: req.requestId };
	}

	const data = (await res.json()) as {
		choices?: { message?: { content?: string } }[];
	};
	const content = data.choices?.[0]?.message?.content ?? "";
	return { content, raw: data, requestId: req.requestId };
}
