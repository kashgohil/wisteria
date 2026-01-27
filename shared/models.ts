import type { ProviderId } from "./providers";

export type ModelProvider = ProviderId;

// Multi-modal content support
export type TextContentPart = {
	type: "text";
	text: string;
};

export type ImageContentPart = {
	type: "image";
	source: {
		type: "base64";
		media_type: string;
		data: string;
	};
};

export type AudioContentPart = {
	type: "audio";
	source: {
		type: "base64";
		media_type: string;
		data: string;
	};
};

export type VideoContentPart = {
	type: "video";
	source: {
		type: "base64";
		media_type: string;
		data: string;
	};
};

export type ContentPart =
	| TextContentPart
	| ImageContentPart
	| AudioContentPart
	| VideoContentPart;

export type MessageContent = string | ContentPart[];

export type ChatMessage = {
	role: "system" | "user" | "assistant";
	content: MessageContent;
};

export type ModelPricing = {
	input?: string | null;
	output?: string | null;
	prompt?: string | null;
	completion?: string | null;
	image?: string | null;
	web_search?: string | null;
};

export type ProviderCapabilities = {
	vision?: boolean;
	audio?: boolean;
	video?: boolean;
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
	capabilities?: ProviderCapabilities;
	context_length?: number;
	default_parameters?: Record<string, unknown>;
	supported_parameters?: string[];
	description?: string;
	maker?: string;
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

export type ResponseImage = {
	mime_type: string;
	data: string; // base64
};

export type ChatModelResponse = {
	content: string;
	images?: ResponseImage[];
	raw?: unknown;
	requestId?: string;
};
