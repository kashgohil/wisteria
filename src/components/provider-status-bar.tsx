import { cn } from "@/lib/utils";
import {
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from "@/components/ui/tooltip";
import { PROVIDERS, type ProviderId } from "../../shared/providers";
import type { ProviderStatus } from "./model-selector/types";

type ProviderStatusBarProps = {
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
				"absolute -bottom-0.5 -right-0.5 size-2.5 rounded-full border-2 border-background",
				status === "connected" && "bg-green-500",
				status === "no-api-key" && "bg-yellow-500",
				status === "unreachable" && "bg-red-500",
			)}
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
	const provider = PROVIDERS.find((p) => p.id === providerId);
	const icon = PROVIDER_ICONS[providerId];

	if (!provider || !icon) return null;

	const statusText =
		status === "connected"
			? "Connected"
			: status === "no-api-key"
				? "No API key"
				: "Unreachable";

	return (
		<Tooltip>
			<TooltipTrigger asChild>
				<div className="relative">
					<div
						className={cn(
							"size-7 rounded-md flex items-center justify-center text-white text-[10px] font-bold",
							icon.color,
							status !== "connected" && "opacity-50",
						)}
					>
						{icon.letter}
					</div>
					<StatusBadge status={status} />
				</div>
			</TooltipTrigger>
			<TooltipContent side="top" className="text-xs">
				<span className="font-medium">{provider.label}</span>
				<span className="text-muted-foreground"> - {statusText}</span>
			</TooltipContent>
		</Tooltip>
	);
}

export function ProviderStatusBar({ providerStatuses }: ProviderStatusBarProps) {
	const localProviders = PROVIDERS.filter((p) => p.kind === "local");
	const onlineProviders = PROVIDERS.filter((p) => p.kind === "online");

	return (
		<div className="flex flex-col gap-2">
			<div className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
				Providers
			</div>
			<div className="flex flex-col gap-2">
				<div className="flex flex-wrap gap-1.5">
					{localProviders.map((provider) => (
						<ProviderIcon
							key={provider.id}
							providerId={provider.id}
							status={providerStatuses.get(provider.id) || "unreachable"}
						/>
					))}
				</div>
				<div className="flex flex-wrap gap-1.5">
					{onlineProviders.map((provider) => (
						<ProviderIcon
							key={provider.id}
							providerId={provider.id}
							status={providerStatuses.get(provider.id) || "unreachable"}
						/>
					))}
				</div>
			</div>
		</div>
	);
}
