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
};

export type ChatModelResponse = {
	content: string;
	raw?: unknown;
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

function logConnectionIssue(label: string, err: unknown) {
	const code = (err as { code?: string })?.code;
	if (code === "ECONNREFUSED") {
		console.info(`${label} not reachable on localhost`);
		return;
	}
	// Reduce noise while still surfacing unexpected errors
	console.warn(`${label} request issue`, err);
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

export async function sendToModel(
	request: ChatModelRequest,
): Promise<ChatModelResponse> {
	switch (request.provider) {
		case "ollama":
			return sendOllama(request);
		case "lmstudio":
			return sendLmStudio(request);
		case "openrouter":
			return sendOpenRouter(request);
		default:
			throw new Error("Unsupported provider");
	}
}

async function sendOllama(req: ChatModelRequest): Promise<ChatModelResponse> {
	const res = await fetch(`${OLLAMA_URL}/api/chat`, {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify({
			model: req.model,
			messages: req.messages,
			stream: false,
		}),
	});
	if (!res.ok) {
		throw new Error(`Ollama error ${res.status}`);
	}
	const data = (await res.json()) as { message?: { content?: string } };
	return { content: data.message?.content ?? "", raw: data };
}

async function sendLmStudio(req: ChatModelRequest): Promise<ChatModelResponse> {
	const res = await fetch(`${LMSTUDIO_URL}/v1/chat/completions`, {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify({
			model: req.model,
			messages: req.messages,
			stream: false,
		}),
	});
	if (!res.ok) {
		throw new Error(`LM Studio error ${res.status}`);
	}
	const data = (await res.json()) as {
		choices?: { message?: { content?: string } }[];
	};
	const content = data.choices?.[0]?.message?.content ?? "";
	return { content, raw: data };
}

async function sendOpenRouter(
	req: ChatModelRequest,
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
		}),
	});
	if (!res.ok) {
		throw new Error(`OpenRouter error ${res.status}`);
	}
	const data = (await res.json()) as {
		choices?: { message?: { content?: string } }[];
	};
	const content = data.choices?.[0]?.message?.content ?? "";
	return { content, raw: data };
}
