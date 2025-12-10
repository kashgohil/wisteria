import type { ProviderId } from "./providers";

export type ModelProvider = ProviderId;

export type ChatMessage = {
	role: "system" | "user" | "assistant";
	content: string;
};

export type ModelPricing = {
	input?: string | null;
	output?: string | null;
	prompt?: string | null;
	completion?: string | null;
	image?: string | null;
	web_search?: string | null;
};

export type ModelInfo = {
	id: string;
	name: string;
	provider: ModelProvider;
	pricing?: ModelPricing;
	architecture?: {
		modality?: string;
		input_modalities?: string[];
		output_modalities?: string[];
	};
	context_length?: number;
	default_parameters?: Record<string, unknown>;
	supported_parameters?: string[];
	description?: string;
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
