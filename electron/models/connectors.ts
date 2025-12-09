export type ModelProvider = "ollama" | "lmstudio" | "openrouter";

export type ChatMessage = {
	role: "system" | "user" | "assistant";
	content: string;
};

export type ChatModelRequest = {
	provider: ModelProvider;
	model: string;
	messages: ChatMessage[];
	apiKey?: string | null;
	/**
	 * Enable provider streaming mode. When true, callers should pass an
	 * onDelta callback to receive partial tokens as they arrive.
	 */
	stream?: boolean;
	/**
	 * Optional identifier forwarded back to the renderer so it can correlate
	 * streaming updates to the originating request.
	 */
	requestId?: string;
};

export type ChatModelResponse = {
	content: string;
	raw?: unknown;
	requestId?: string;
};

const OLLAMA_URL = "http://localhost:11434";
const LMSTUDIO_URL = "http://localhost:1234";
const OPENROUTER_URL = "https://openrouter.ai/api/v1";
const REQUEST_TIMEOUT_MS = 2000;

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

export async function listOllamaModels(): Promise<
	{ id: string; label: string; provider: ModelProvider }[]
> {
	try {
		const res = await fetchWithTimeout(`${OLLAMA_URL}/api/tags`);
		if (!res.ok) throw new Error(`Ollama responded ${res.status}`);
		const data = (await res.json()) as { models?: { name: string }[] };
		return (data.models ?? []).map((m) => ({
			id: m.name,
			label: m.name,
			provider: "ollama",
		}));
	} catch (err) {
		logConnectionIssue("Ollama list", err);
		return [];
	}
}

export async function listLmStudioModels(): Promise<
	{ id: string; label: string; provider: ModelProvider }[]
> {
	try {
		const res = await fetchWithTimeout(`${LMSTUDIO_URL}/v1/models`);
		if (!res.ok) throw new Error(`LM Studio responded ${res.status}`);
		const data = (await res.json()) as { data?: { id: string }[] };
		return (data.data ?? []).map((m) => ({
			id: m.id,
			label: m.id,
			provider: "lmstudio",
		}));
	} catch (err) {
		logConnectionIssue("LM Studio list", err);
		return [];
	}
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
