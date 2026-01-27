import { cn } from "@/lib/utils";
import { useMemo } from "react";
import type { ModelInfo } from "../../../shared/models";
import { PROVIDERS, type ProviderId } from "../../../shared/providers";
import type { ProviderStatus } from "./types";

type ProviderSidebarProps = {
	models: ModelInfo[];
	selectedProvider: ProviderId | null;
	onSelectProvider: (provider: ProviderId | null) => void;
	providerStatuses: Map<ProviderId, ProviderStatus>;
};

const PROVIDER_ICONS: Record<ProviderId, { letter: string; color: string }> = {
	ollama: { letter: "O", color: "bg-blue-600" },
	lmstudio: { letter: "LM", color: "bg-purple-600" },
	llamacpp: { letter: "L", color: "bg-orange-600" },
	openrouter: { letter: "OR", color: "bg-pink-600" },
	openai: { letter: "AI", color: "bg-emerald-600" },
	anthropic: { letter: "A", color: "bg-amber-700" },
	gemini: { letter: "G", color: "bg-blue-500" },
	grok: { letter: "X", color: "bg-zinc-700" },
	groq: { letter: "GQ", color: "bg-orange-500" },
};

function StatusBadge({ status }: { status: ProviderStatus }) {
	return (
		<span
			className={cn(
				"absolute -bottom-0.5 -right-0.5 size-2 rounded-full border border-background",
				status === "connected" && "bg-green-500",
				status === "no-api-key" && "bg-yellow-500",
				status === "unreachable" && "bg-red-500",
			)}
			title={
				status === "connected"
					? "Connected"
					: status === "no-api-key"
						? "No API key configured"
						: "Unreachable"
			}
		/>
	);
}

function ProviderIcon({
	providerId,
	status,
}: {
	providerId: ProviderId;
	status: ProviderStatus;
}) {
	const icon = PROVIDER_ICONS[providerId];
	if (!icon) return null;

	return (
		<div className="relative flex-shrink-0">
			<div
				className={cn(
					"size-6 rounded flex items-center justify-center text-white text-[9px] font-bold",
					icon.color,
					status !== "connected" && "opacity-50",
				)}
			>
				{icon.letter}
			</div>
			<StatusBadge status={status} />
		</div>
	);
}

export function ProviderSidebar({
	models,
	selectedProvider,
	onSelectProvider,
	providerStatuses,
}: ProviderSidebarProps) {
	// Count models per provider
	const modelCounts = useMemo(() => {
		const counts = new Map<ProviderId, number>();
		for (const model of models) {
			counts.set(model.provider, (counts.get(model.provider) || 0) + 1);
		}
		return counts;
	}, [models]);

	// Group providers
	const localProviders = PROVIDERS.filter((p) => p.kind === "local");
	const onlineProviders = PROVIDERS.filter((p) => p.kind === "online");

	const renderProvider = (provider: (typeof PROVIDERS)[0]) => {
		const count = modelCounts.get(provider.id) || 0;
		const status = providerStatuses.get(provider.id) || "unreachable";
		const isSelected = selectedProvider === provider.id;

		return (
			<button
				key={provider.id}
				type="button"
				onClick={() => onSelectProvider(provider.id)}
				className={cn(
					"w-full flex items-center gap-2 px-3 py-2 rounded-md text-sm transition-colors",
					"hover:bg-accent/50",
					isSelected && "bg-accent",
				)}
			>
				<StatusIndicator status={status} />
				<span className="flex-1 text-left truncate">{provider.label}</span>
				{count > 0 && (
					<span className="text-xs text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
						{count}
					</span>
				)}
			</button>
		);
	};

	return (
		<div className="flex flex-col h-full">
			{/* All providers option */}
			<div className="px-2 pt-2 pb-1">
				<button
					type="button"
					onClick={() => onSelectProvider(null)}
					className={cn(
						"w-full flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors",
						"hover:bg-accent/50",
						selectedProvider === null && "bg-accent",
					)}
				>
					<span className="size-2" /> {/* Spacer for alignment */}
					<span className="flex-1 text-left">All Providers</span>
					<span className="text-xs text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
						{models.length}
					</span>
				</button>
			</div>

			<div className="flex-1 overflow-y-auto px-2 py-1">
				{/* Local providers */}
				<div className="mb-3">
					<div className="px-3 py-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
						Local
					</div>
					<div className="space-y-0.5">
						{localProviders.map(renderProvider)}
					</div>
				</div>

				{/* Online providers */}
				<div>
					<div className="px-3 py-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
						Online
					</div>
					<div className="space-y-0.5">
						{onlineProviders.map(renderProvider)}
					</div>
				</div>
			</div>
		</div>
	);
}
