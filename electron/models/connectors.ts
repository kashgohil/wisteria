import type {
	ChatModelRequest,
	ChatModelResponse,
	ModelInfo,
	ModelPricing,
} from "../../shared/models";

const OLLAMA_URL = "http://localhost:11434";
const LMSTUDIO_URL = "http://localhost:1234";
const OPENROUTER_URL = "https://openrouter.ai/api/v1";
const OPENAI_URL = "https://api.openai.com/v1";
const ANTHROPIC_URL = "https://api.anthropic.com/v1";
const REQUEST_TIMEOUT_MS = 2000;

const OPENROUTER_FALLBACK_MODELS: ModelInfo[] = [
	{
		id: "openrouter/auto",
		name: "OpenRouter Auto",
		provider: "openrouter",
	},
	{
		id: "anthropic/claude-3.5-sonnet",
		name: "Claude 3.5 Sonnet (OpenRouter)",
		provider: "openrouter",
	},
];

const OPENAI_DEFAULT_MODELS: ModelInfo[] = [
	{
		id: "gpt-4o",
		name: "GPT-4o",
		provider: "openai",
	},
	{
		id: "gpt-4o-mini",
		name: "GPT-4o Mini",
		provider: "openai",
	},
];

const ANTHROPIC_DEFAULT_MODELS: ModelInfo[] = [
	{
		id: "claude-3-5-sonnet-20240620",
		name: "Claude 3.5 Sonnet",
		provider: "anthropic",
	},
	{
		id: "claude-3-haiku-20240307",
		name: "Claude 3 Haiku",
		provider: "anthropic",
	},
];

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

export async function listOllamaModels(): Promise<ModelInfo[]> {
	try {
		const res = await fetchWithTimeout(`${OLLAMA_URL}/api/tags`);
		if (!res.ok) throw new Error(`Ollama responded ${res.status}`);
		const data = (await res.json()) as { models?: { name: string }[] };
		return (data.models ?? []).map((m) => ({
			id: m.name,
			name: m.name,
			provider: "ollama",
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
		}));
	} catch (err) {
		logConnectionIssue("LM Studio list", err);
		return [];
	}
}

export function listOpenAIModels(): Promise<ModelInfo[]> {
	return Promise.resolve(OPENAI_DEFAULT_MODELS);
}

export function listAnthropicModels(): Promise<ModelInfo[]> {
	return Promise.resolve(ANTHROPIC_DEFAULT_MODELS);
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
	switch (request.provider) {
		case "ollama":
			return sendOllama(request, callbacks);
		case "lmstudio":
			return sendLmStudio(request, callbacks);
		case "openrouter":
			return sendOpenRouter(request, callbacks);
		case "openai":
			return sendOpenAI(request, callbacks);
		case "anthropic":
			return sendAnthropic(request, callbacks);
		default:
			throw new Error("Unsupported provider");
	}
}

async function sendOllama(
	req: ChatModelRequest,
	callbacks: StreamCallbacks,
): Promise<ChatModelResponse> {
	const res = await fetch(`${OLLAMA_URL}/api/chat`, {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify({
			model: req.model,
			messages: req.messages,
			stream: Boolean(req.stream),
		}),
	});
	if (!res.ok) {
		throw new Error(`Ollama error ${res.status}`);
	}

	if (req.stream) {
		const { content, raw } = await readNdjsonStream(res, callbacks.onDelta);
		return { content, raw, requestId: req.requestId };
	}

	const data = (await res.json()) as { message?: { content?: string } };
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
	const res = await fetch(`${LMSTUDIO_URL}/v1/chat/completions`, {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify({
			model: req.model,
			messages: req.messages,
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

async function sendOpenRouter(
	req: ChatModelRequest,
	callbacks: StreamCallbacks,
): Promise<ChatModelResponse> {
	if (!req.apiKey) {
		throw new Error("OpenRouter API key missing");
	}
	const res = await fetch(`${OPENROUTER_URL}/chat/completions`, {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
			Authorization: `Bearer ${req.apiKey}`,
		},
		body: JSON.stringify({
			model: req.model,
			messages: req.messages,
			stream: Boolean(req.stream),
		}),
	});
	if (!res.ok) {
		throw new Error(`OpenRouter error ${res.status}`);
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

async function sendOpenAI(
	req: ChatModelRequest,
	callbacks: StreamCallbacks,
): Promise<ChatModelResponse> {
	if (!req.apiKey) {
		throw new Error("OpenAI API key missing");
	}

	const res = await fetch(`${OPENAI_URL}/chat/completions`, {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
			Authorization: `Bearer ${req.apiKey}`,
		},
		body: JSON.stringify({
			model: req.model,
			messages: req.messages,
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
		.map((m) => m.content)
		.join("\n\n");
	const messages = req.messages
		.filter((m) => m.role !== "system")
		.map((m) => ({
			role: m.role === "assistant" ? "assistant" : ("user" as const),
			content: m.content,
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
				};
				raw.push(json);
				const delta = json.message?.content ?? "";
				if (delta) {
					full += delta;
					onDelta?.(delta);
				}
			} catch (err) {
				console.warn("Ollama stream parse issue", err);
			}
		}
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
					choices?: { delta?: { content?: string } }[];
				};
				raw.push(json);
				const delta = json.choices?.[0]?.delta?.content ?? "";
				if (delta) {
					full += delta;
					onDelta?.(delta);
				}
			} catch (err) {
				console.warn("SSE stream parse issue", err);
			}
		}
	}

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
				};
				raw.push(json);
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
				console.warn("Anthropic stream parse issue", err);
			}
		}
	}

	return { content: full, raw };
}
