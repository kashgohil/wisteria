import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { Clock, ImageIcon, Mic, Search, Star, Video, X } from "lucide-react";
import { useMemo, useState } from "react";
import type { ModelInfo } from "../../../shared/models";
import type { ProviderId } from "../../../shared/providers";
import { ModelCard } from "./model-card";
import { isAggregator, type ModelSortOption } from "./types";

type ModelBrowserProps = {
	models: ModelInfo[];
	selectedProvider: ProviderId | null;
	selectedModelId: string;
	starredModelIds: Set<string>;
	recentModelIds: string[];
	onSelectModel: (modelId: string) => void;
	onToggleStar: (modelId: string, provider: ProviderId) => void;
};

export function ModelBrowser({
	models,
	selectedProvider,
	selectedModelId,
	starredModelIds,
	recentModelIds,
	onSelectModel,
	onToggleStar,
}: ModelBrowserProps) {
	const [searchQuery, setSearchQuery] = useState("");
	const [sortOption, setSortOption] = useState<ModelSortOption>("name");
	const [capabilityFilters, setCapabilityFilters] = useState({
		vision: false,
		audio: false,
		video: false,
	});
	const [makerFilter, setMakerFilter] = useState<string[]>([]);

	// Filter models by selected provider
	const providerModels = useMemo(() => {
		if (!selectedProvider) return models;
		return models.filter((m) => m.provider === selectedProvider);
	}, [models, selectedProvider]);

	// Get available makers for current provider (only for aggregators)
	const availableMakers = useMemo(() => {
		if (!selectedProvider || !isAggregator(selectedProvider)) return [];
		const makers = new Set(providerModels.map((m) => m.maker || "Other"));
		return Array.from(makers).sort();
	}, [providerModels, selectedProvider]);

	// Apply filters and sorting
	const filteredModels = useMemo(() => {
		let filtered = providerModels;

		// Search filter
		if (searchQuery.trim()) {
			const query = searchQuery.toLowerCase();
			filtered = filtered.filter(
				(m) =>
					m.name.toLowerCase().includes(query) ||
					m.id.toLowerCase().includes(query) ||
					m.description?.toLowerCase().includes(query),
			);
		}

		// Capability filters
		if (capabilityFilters.vision) {
			filtered = filtered.filter(
				(m) =>
					m.architecture?.input_modalities?.includes("image") ||
					m.capabilities?.vision,
			);
		}
		if (capabilityFilters.audio) {
			filtered = filtered.filter(
				(m) =>
					m.architecture?.input_modalities?.includes("audio") ||
					m.capabilities?.audio,
			);
		}
		if (capabilityFilters.video) {
			filtered = filtered.filter(
				(m) =>
					m.architecture?.input_modalities?.includes("video") ||
					m.capabilities?.video,
			);
		}

		// Maker filter (for aggregators)
		if (makerFilter.length > 0) {
			filtered = filtered.filter((m) =>
				makerFilter.includes(m.maker || "Other"),
			);
		}

		// Sort
		filtered = [...filtered].sort((a, b) => {
			switch (sortOption) {
				case "name":
					return a.name.localeCompare(b.name);
				case "price-asc": {
					const priceA = Number.parseFloat(
						a.pricing?.prompt ?? a.pricing?.input ?? "999999",
					);
					const priceB = Number.parseFloat(
						b.pricing?.prompt ?? b.pricing?.input ?? "999999",
					);
					return priceA - priceB;
				}
				case "price-desc": {
					const priceA = Number.parseFloat(
						a.pricing?.prompt ?? a.pricing?.input ?? "0",
					);
					const priceB = Number.parseFloat(
						b.pricing?.prompt ?? b.pricing?.input ?? "0",
					);
					return priceB - priceA;
				}
				case "context": {
					const ctxA = a.context_length ?? 0;
					const ctxB = b.context_length ?? 0;
					return ctxB - ctxA;
				}
				default:
					return 0;
			}
		});

		return filtered;
	}, [providerModels, searchQuery, capabilityFilters, makerFilter, sortOption]);

	// Get starred models for current view
	const starredModels = useMemo(() => {
		return providerModels.filter((m) => starredModelIds.has(m.id));
	}, [providerModels, starredModelIds]);

	// Get recent models for current view
	const recentModels = useMemo(() => {
		return recentModelIds
			.map((id) => providerModels.find((m) => m.id === id))
			.filter((m): m is ModelInfo => !!m)
			.slice(0, 4);
	}, [recentModelIds, providerModels]);

	// Group models by maker for aggregators
	const groupedModels = useMemo(() => {
		if (!selectedProvider || !isAggregator(selectedProvider)) {
			return null;
		}

		const groups = new Map<string, ModelInfo[]>();
		for (const model of filteredModels) {
			const maker = model.maker || "Other";
			const existing = groups.get(maker) || [];
			groups.set(maker, [...existing, model]);
		}
		return groups;
	}, [filteredModels, selectedProvider]);

	const toggleCapability = (cap: keyof typeof capabilityFilters) => {
		setCapabilityFilters((prev) => ({ ...prev, [cap]: !prev[cap] }));
	};

	const toggleMakerFilter = (maker: string) => {
		setMakerFilter((prev) =>
			prev.includes(maker)
				? prev.filter((m) => m !== maker)
				: [...prev, maker],
		);
	};

	const clearFilters = () => {
		setSearchQuery("");
		setCapabilityFilters({ vision: false, audio: false, video: false });
		setMakerFilter([]);
	};

	const hasActiveFilters =
		searchQuery ||
		capabilityFilters.vision ||
		capabilityFilters.audio ||
		capabilityFilters.video ||
		makerFilter.length > 0;

	const showSections = !hasActiveFilters;

	const renderModelCard = (model: ModelInfo) => (
		<ModelCard
			key={model.id}
			model={model}
			isSelected={model.id === selectedModelId}
			isStarred={starredModelIds.has(model.id)}
			onSelect={() => onSelectModel(model.id)}
			onToggleStar={() => onToggleStar(model.id, model.provider)}
		/>
	);

	return (
		<div className="flex flex-col h-full">
			{/* Search and filters bar */}
			<div className="p-3 border-b bg-muted/20 space-y-2">
				<div className="flex items-center gap-2">
					{/* Search */}
					<div className="relative flex-1">
						<Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
						<Input
							placeholder="Search models..."
							value={searchQuery}
							onChange={(e) => setSearchQuery(e.target.value)}
							className="pl-9 h-9"
						/>
					</div>

					{/* Capability toggles */}
					<div className="flex items-center gap-1">
						<Button
							variant={capabilityFilters.vision ? "secondary" : "outline"}
							size="sm"
							className={cn(
								"h-9 px-2",
								capabilityFilters.vision &&
									"bg-primary/10 hover:bg-primary/20 border-primary/20",
							)}
							onClick={() => toggleCapability("vision")}
							title="Vision"
						>
							<ImageIcon className="size-4" />
						</Button>
						<Button
							variant={capabilityFilters.audio ? "secondary" : "outline"}
							size="sm"
							className={cn(
								"h-9 px-2",
								capabilityFilters.audio &&
									"bg-primary/10 hover:bg-primary/20 border-primary/20",
							)}
							onClick={() => toggleCapability("audio")}
							title="Audio"
						>
							<Mic className="size-4" />
						</Button>
						<Button
							variant={capabilityFilters.video ? "secondary" : "outline"}
							size="sm"
							className={cn(
								"h-9 px-2",
								capabilityFilters.video &&
									"bg-primary/10 hover:bg-primary/20 border-primary/20",
							)}
							onClick={() => toggleCapability("video")}
							title="Video"
						>
							<Video className="size-4" />
						</Button>
					</div>

					{/* Sort dropdown */}
					<Select
						value={sortOption}
						onValueChange={(v) => setSortOption(v as ModelSortOption)}
					>
						<SelectTrigger className="w-[130px] h-9">
							<SelectValue />
						</SelectTrigger>
						<SelectContent>
							<SelectItem value="name">Name</SelectItem>
							<SelectItem value="price-asc">Price: Low</SelectItem>
							<SelectItem value="price-desc">Price: High</SelectItem>
							<SelectItem value="context">Context</SelectItem>
						</SelectContent>
					</Select>
				</div>

				{/* Maker filter for aggregators */}
				{availableMakers.length > 0 && (
					<div className="flex items-center gap-1.5 flex-wrap">
						<span className="text-xs text-muted-foreground mr-1">
							Makers:
						</span>
						{availableMakers.slice(0, 8).map((maker) => (
							<Button
								key={maker}
								variant={
									makerFilter.includes(maker) ? "secondary" : "outline"
								}
								size="sm"
								className={cn(
									"h-6 px-2 text-[10px]",
									makerFilter.includes(maker) &&
										"bg-primary/10 hover:bg-primary/20 border-primary/20",
								)}
								onClick={() => toggleMakerFilter(maker)}
							>
								{maker}
							</Button>
						))}
						{availableMakers.length > 8 && (
							<span className="text-xs text-muted-foreground">
								+{availableMakers.length - 8} more
							</span>
						)}
					</div>
				)}

				{/* Clear filters button */}
				{hasActiveFilters && (
					<div className="flex items-center justify-between">
						<span className="text-xs text-muted-foreground">
							{filteredModels.length} models found
						</span>
						<Button
							variant="ghost"
							size="sm"
							className="h-6 px-2 text-xs"
							onClick={clearFilters}
						>
							<X className="size-3 mr-1" />
							Clear filters
						</Button>
					</div>
				)}
			</div>

			{/* Model list */}
			<div className="flex-1 overflow-y-auto p-3 space-y-4">
				{/* Starred section */}
				{showSections && starredModels.length > 0 && (
					<div>
						<div className="flex items-center gap-2 px-1 pb-2">
							<Star className="size-3.5 text-yellow-500 fill-yellow-500" />
							<span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
								Starred
							</span>
						</div>
						<div className="grid grid-cols-2 gap-2">
							{starredModels.map(renderModelCard)}
						</div>
					</div>
				)}

				{/* Recent section */}
				{showSections && recentModels.length > 0 && (
					<div>
						<div className="flex items-center gap-2 px-1 pb-2">
							<Clock className="size-3.5 text-muted-foreground" />
							<span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
								Recent
							</span>
						</div>
						<div className="grid grid-cols-2 gap-2">
							{recentModels.map(renderModelCard)}
						</div>
					</div>
				)}

				{/* All models / Search results */}
				<div>
					{(showSections ||
						(!showSections && filteredModels.length > 0)) && (
						<div className="flex items-center gap-2 px-1 pb-2">
							<span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
								{hasActiveFilters ? "Results" : "All Models"}
							</span>
						</div>
					)}

					{filteredModels.length === 0 ? (
						<div className="flex items-center justify-center py-12 text-sm text-muted-foreground">
							No models found matching your criteria.
						</div>
					) : groupedModels ? (
						// Grouped view for aggregators
						<div className="space-y-4">
							{Array.from(groupedModels.entries()).map(
								([maker, makerModels]) => (
									<div key={maker}>
										<div className="text-xs font-medium text-muted-foreground px-1 pb-1.5">
											{maker}
										</div>
										<div className="grid grid-cols-2 gap-2">
											{makerModels.map(renderModelCard)}
										</div>
									</div>
								),
							)}
						</div>
					) : (
						// Flat view for single-maker providers
						<div className="grid grid-cols-2 gap-2">
							{filteredModels.map(renderModelCard)}
						</div>
					)}
				</div>
			</div>
		</div>
	);
}
