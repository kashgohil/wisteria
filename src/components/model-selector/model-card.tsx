import { cn } from "@/lib/utils";
import { ImageIcon, Mic, Star, Video } from "lucide-react";
import type { ModelInfo } from "../../../shared/models";
import { LOCAL_PROVIDERS } from "../../../shared/providers";
import { isAggregator } from "./types";

type ModelCardProps = {
	model: ModelInfo;
	isSelected: boolean;
	isStarred: boolean;
	onSelect: () => void;
	onToggleStar: () => void;
};

function formatContextLength(length: number): string {
	if (length >= 1000000) {
		return `${(length / 1000000).toFixed(1)}M`;
	}
	if (length >= 1000) {
		return `${Math.round(length / 1000)}K`;
	}
	return String(length);
}

function formatPrice(price: string | null | undefined): string | null {
	if (!price) return null;
	const num = Number.parseFloat(price);
	if (Number.isNaN(num)) return null;
	if (num === 0) return "Free";
	if (num < 0.01) return `$${num.toFixed(4)}`;
	if (num < 1) return `$${num.toFixed(2)}`;
	return `$${num.toFixed(0)}`;
}

export function ModelCard({
	model,
	isSelected,
	isStarred,
	onSelect,
	onToggleStar,
}: ModelCardProps) {
	const isLocal = LOCAL_PROVIDERS.includes(model.provider);
	const showMaker = isAggregator(model.provider) && model.maker;

	// Get capability icons
	const hasVision =
		model.architecture?.input_modalities?.includes("image") ||
		model.capabilities?.vision;
	const hasAudio =
		model.architecture?.input_modalities?.includes("audio") ||
		model.capabilities?.audio;
	const hasVideo =
		model.architecture?.input_modalities?.includes("video") ||
		model.capabilities?.video;

	// Format pricing
	const inputPrice = formatPrice(model.pricing?.prompt ?? model.pricing?.input);
	const outputPrice = formatPrice(
		model.pricing?.completion ?? model.pricing?.output,
	);

	return (
		<div
			role="button"
			tabIndex={0}
			onClick={onSelect}
			onKeyDown={(e) => {
				if (e.key === "Enter" || e.key === " ") {
					e.preventDefault();
					onSelect();
				}
			}}
			className={cn(
				"relative p-3 rounded-lg border cursor-pointer transition-colors",
				"hover:border-primary/50 hover:bg-accent/30",
				isSelected && "border-primary bg-primary/5",
			)}
		>
			{/* Star button */}
			<button
				type="button"
				onClick={(e) => {
					e.stopPropagation();
					onToggleStar();
				}}
				className={cn(
					"absolute top-2 right-2 p-1 rounded-md transition-colors",
					"hover:bg-accent",
					isStarred
						? "text-yellow-500"
						: "text-muted-foreground/50 hover:text-muted-foreground",
				)}
				aria-label={isStarred ? "Remove from starred" : "Add to starred"}
			>
				<Star
					className={cn("size-3.5", isStarred && "fill-yellow-500")}
				/>
			</button>

			<div className="flex flex-col gap-1 pr-6">
				{/* Maker label - only for aggregators */}
				{showMaker && (
					<span className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider truncate">
						{model.maker}
					</span>
				)}

				{/* Model name */}
				<span
					className="font-medium text-sm truncate"
					title={model.name}
				>
					{model.name}
				</span>

				{/* Metadata row: capabilities, context, pricing */}
				<div className="flex items-center gap-1.5 mt-1 text-muted-foreground">
					{/* Capability icons */}
					{hasVision && <ImageIcon className="size-3" />}
					{hasAudio && <Mic className="size-3" />}
					{hasVideo && <Video className="size-3" />}

					{/* Context length */}
					{model.context_length && (
						<>
							{(hasVision || hasAudio || hasVideo) && (
								<span className="text-muted-foreground/50">·</span>
							)}
							<span className="text-[10px]">
								{formatContextLength(model.context_length)}
							</span>
						</>
					)}

					{/* Pricing - hide for local providers */}
					{!isLocal && inputPrice && (
						<>
							<span className="text-muted-foreground/50">·</span>
							<span className="text-[10px]">
								{inputPrice}
								{outputPrice && `/${outputPrice}`}
							</span>
						</>
					)}
				</div>
			</div>
		</div>
	);
}
