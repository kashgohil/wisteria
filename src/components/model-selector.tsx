import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import {
	ChevronDown,
	Filter,
	ImageIcon,
	Mic,
	Search,
	Type,
	Video,
	X,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import type { ModelInfo } from "../../shared/models";
import { PROVIDER_NAMES, type ProviderId } from "../../shared/providers";

type ModelSelectorProps = {
	models: ModelInfo[];
	selectedModelId: string;
	onValueChange: (value: string) => void;
	disabled?: boolean;
};

const RECENT_MODELS_KEY = "wisteria-recent-models";
const MAX_RECENT_MODELS = 8;

export function ModelSelector({
	models,
	selectedModelId,
	onValueChange,
	disabled = false,
}: ModelSelectorProps) {
	const [searchQuery, setSearchQuery] = useState("");
	const [recentModelIds, setRecentModelIds] = useState<string[]>([]);
	const [activeModalityFilters, setActiveModalityFilters] = useState<string[]>(
		[],
	);
	const [activeProviderFilters, setActiveProviderFilters] = useState<
		ProviderId[]
	>([]);
	const [activeMakerFilters, setActiveMakerFilters] = useState<string[]>([]);
	const [showFilters, setShowFilters] = useState(false);

	// Load recents from local storage on mount
	useEffect(() => {
		try {
			const stored = localStorage.getItem(RECENT_MODELS_KEY);
			if (stored) {
				setRecentModelIds(JSON.parse(stored));
			}
		} catch (e) {
			console.error("Failed to load recent models", e);
		}
	}, []);

	const handleModelSelect = (value: string) => {
		onValueChange(value);
		// Update recents
		const newRecents = [
			value,
			...recentModelIds.filter((id) => id !== value),
		].slice(0, MAX_RECENT_MODELS);
		setRecentModelIds(newRecents);
		localStorage.setItem(RECENT_MODELS_KEY, JSON.stringify(newRecents));
	};

	const availableProviders = useMemo(() => {
		const providers = new Set(models.map((m) => m.provider));
		return Array.from(providers).sort((a, b) => a.localeCompare(b));
	}, [models]);

	const availableMakers = useMemo(() => {
		const makers = new Set(models.map((m) => m.maker || "Other"));
		return Array.from(makers).sort();
	}, [models]);

	const availableModalities = [
		{ id: "text", icon: Type, label: "Text" },
		{ id: "image", icon: ImageIcon, label: "Image" },
		{ id: "audio", icon: Mic, label: "Audio" },
		{ id: "video", icon: Video, label: "Video" },
	];

	const filteredModels = useMemo(() => {
		let filtered = models;

		// Search Filter
		if (searchQuery.trim()) {
			const query = searchQuery.toLowerCase();
			filtered = filtered.filter(
				(m) =>
					m.name.toLowerCase().includes(query) ||
					m.id.toLowerCase().includes(query) ||
					m.description?.toLowerCase().includes(query),
			);
		}

		// Provider Filter
		if (activeProviderFilters.length > 0) {
			filtered = filtered.filter((m) => activeProviderFilters.includes(m.provider));
		}

		// Modality Filter
		if (activeModalityFilters.length > 0) {
			filtered = filtered.filter((m) => {
				return activeModalityFilters.some(
					(mod) =>
						m.architecture?.input_modalities?.includes(mod) ||
						m.architecture?.output_modalities?.includes(mod),
				);
			});
		}

		// Maker Filter
		if (activeMakerFilters.length > 0) {
			filtered = filtered.filter((m) =>
				activeMakerFilters.includes(m.maker || "Other"),
			);
		}

		return filtered;
	}, [
		models,
		searchQuery,
		activeModalityFilters,
		activeMakerFilters,
		activeProviderFilters,
	]);

	const recentModels = useMemo(() => {
		return recentModelIds
			.map((id) => models.find((m) => m.id === id))
			.filter((m): m is ModelInfo => !!m);
	}, [recentModelIds, models]);

	const toggleModalityFilter = (modality: string) => {
		setActiveModalityFilters((prev) =>
			prev.includes(modality)
				? prev.filter((m) => m !== modality)
				: [...prev, modality],
		);
	};

	const toggleProviderFilter = (provider: ProviderId) => {
		setActiveProviderFilters((prev) =>
			prev.includes(provider)
				? prev.filter((p) => p !== provider)
				: [...prev, provider],
		);
	};

	const toggleMakerFilter = (maker: string) => {
		setActiveMakerFilters((prev) =>
			prev.includes(maker) ? prev.filter((p) => p !== maker) : [...prev, maker],
		);
	};

	const clearFilters = () => {
		setActiveModalityFilters([]);
		setActiveMakerFilters([]);
		setActiveProviderFilters([]);
		setSearchQuery("");
	};

	const getModalityIcons = (model: ModelInfo) => {
		const icons = [];
		if (
			model.architecture?.input_modalities?.includes("text") ||
			model.architecture?.output_modalities?.includes("text")
		) {
			icons.push(<Type key="text" className="size-3" />);
		}
		if (
			model.architecture?.input_modalities?.includes("image") ||
			model.capabilities?.vision
		) {
			icons.push(<ImageIcon key="image" className="size-3" />);
		}
		if (
			model.architecture?.input_modalities?.includes("audio") ||
			model.capabilities?.audio
		) {
			icons.push(<Mic key="audio" className="size-3" />);
		}
		if (
			model.architecture?.input_modalities?.includes("video") ||
			model.capabilities?.video
		) {
			icons.push(<Video key="video" className="size-3" />);
		}
		return icons;
	};

	const renderModelItem = (m: ModelInfo) => (
		<SelectItem
			key={m.id}
			value={m.id}
			className="flex flex-col items-start gap-1 p-3 pr-8 cursor-pointer rounded-md border border-transparent focus:bg-accent focus:text-accent-foreground data-[state=checked]:border-primary/50 data-[state=checked]:bg-primary/5"
		>
			<div className="w-full flex flex-col gap-0.5 overflow-hidden">
				<span className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider truncate">
					{m.maker || m.provider}
				</span>
				<div className="flex items-center justify-between w-full gap-2">
					<span className="font-medium truncate text-sm" title={m.name}>
						{m.name}
					</span>
				</div>
				<div className="flex flex-wrap gap-2 items-center mt-1.5 h-4">
					<div className="flex items-center gap-1 text-muted-foreground">
						{getModalityIcons(m)}
					</div>
					{(m.pricing?.prompt || m.pricing?.input) && (
						<>
							<Separator orientation="vertical" className="h-3" />
							<span className="text-[10px] text-muted-foreground truncate">
								${m.pricing?.prompt ?? m.pricing?.input}/1M
							</span>
						</>
					)}
				</div>
			</div>
		</SelectItem>
	);

	return (
		<Select
			value={selectedModelId || undefined}
			onValueChange={handleModelSelect}
			disabled={disabled}
		>
			<SelectTrigger className="shrink-0 w-fit text-sm! px-2 min-w-[150px] max-w-[250px]">
				<SelectValue placeholder="Select Model…">
					{selectedModelId
						? models.find((m) => m.id === selectedModelId)?.name
						: "Select Model…"}
				</SelectValue>
			</SelectTrigger>
			<SelectContent className="h-[600px] w-[600px] flex flex-col p-0 overflow-hidden">
				<div className="flex flex-col gap-2 p-3 border-b bg-muted/30 sticky top-0 z-10">
					<div className="relative">
						<Search className="absolute left-2 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
						<Input
							placeholder="Search models…"
							value={searchQuery}
							onChange={(e) => setSearchQuery(e.target.value)}
							onClick={(e) => e.stopPropagation()}
							onKeyDown={(e) => e.stopPropagation()}
							className="pl-8 h-9 text-sm bg-background"
						/>
					</div>

					<div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-thin">
						<Button
							variant="ghost"
							size="sm"
							className="h-7 px-2 text-xs"
							onClick={(e) => {
								e.preventDefault();
								e.stopPropagation();
								setShowFilters(!showFilters);
							}}
						>
							<Filter className="size-3 mr-1" />
							Filters
							<ChevronDown
								className={cn(
									"size-3 ml-1 transition-transform",
									showFilters && "rotate-180",
								)}
							/>
						</Button>

						{/* Quick Modality Toggles */}
						{availableModalities.map((modality) => (
							<Button
								key={modality.id}
								variant={
									activeModalityFilters.includes(modality.id)
										? "secondary"
										: "outline"
								}
								size="sm"
								className={cn(
									"h-7 px-2 text-xs capitalize",
									activeModalityFilters.includes(modality.id) &&
										"bg-primary/10 hover:bg-primary/20 border-primary/20",
								)}
								onClick={(e) => {
									e.preventDefault();
									e.stopPropagation();
									toggleModalityFilter(modality.id);
								}}
							>
								<modality.icon className="size-3 mr-1" />
								{modality.label}
							</Button>
						))}

						{(activeModalityFilters.length > 0 ||
							activeProviderFilters.length > 0 ||
							activeMakerFilters.length > 0) && (
							<Button
								variant="ghost"
								size="sm"
								className="h-7 px-2 text-xs text-muted-foreground hover:text-foreground ml-auto"
								onClick={(e) => {
									e.preventDefault();
									e.stopPropagation();
									clearFilters();
								}}
							>
								<X className="size-3 mr-1" />
								Clear
							</Button>
						)}
					</div>

					{showFilters && (
						<div className="grid grid-cols-3 gap-4 pt-2 border-t">
							<div className="col-span-3">
								<span className="text-xs font-medium text-muted-foreground mb-2 block">
									Service Providers
								</span>
								<div className="flex flex-wrap gap-1.5">
									{availableProviders.map((provider) => (
										<Button
											key={provider}
											variant={
												activeProviderFilters.includes(provider)
													? "secondary"
													: "outline"
											}
											size="sm"
											className={cn(
												"h-6 px-2 text-[10px]",
												activeProviderFilters.includes(provider) &&
													"bg-primary/10 hover:bg-primary/20 border-primary/20",
											)}
											onClick={(e) => {
												e.preventDefault();
												e.stopPropagation();
												toggleProviderFilter(provider);
											}}
										>
											{PROVIDER_NAMES[provider] || provider}
										</Button>
									))}
								</div>
							</div>

							<div className="col-span-3">
								<span className="text-xs font-medium text-muted-foreground mb-2 block">
									Model Creators
								</span>
								<div className="flex flex-wrap gap-1.5">
									{availableMakers.map((maker) => (
										<Button
											key={maker}
											variant={
												activeMakerFilters.includes(maker)
													? "secondary"
													: "outline"
											}
											size="sm"
											className={cn(
												"h-6 px-2 text-[10px]",
												activeMakerFilters.includes(maker) &&
													"bg-primary/10 hover:bg-primary/20 border-primary/20",
											)}
											onClick={(e) => {
												e.preventDefault();
												e.stopPropagation();
												toggleMakerFilter(maker);
											}}
										>
											{maker}
										</Button>
									))}
								</div>
							</div>
						</div>
					)}
				</div>

				<div className="flex-1 overflow-y-auto">
					{!searchQuery &&
						activeModalityFilters.length === 0 &&
						activeProviderFilters.length === 0 &&
						activeMakerFilters.length === 0 &&
						recentModels.length > 0 && (
							<div className="p-2">
								<div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">
									Recently Used
								</div>
								<div className="grid grid-cols-2 gap-1">
									{recentModels.map(renderModelItem)}
								</div>
								<Separator className="my-2" />
							</div>
						)}

					<div className="p-2">
						<div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">
							{searchQuery ||
							activeModalityFilters.length > 0 ||
							activeProviderFilters.length > 0 ||
							activeMakerFilters.length > 0
								? "Search Results"
								: "All Models"}
						</div>
						{filteredModels.length === 0 ? (
							<div className="px-2 py-8 text-center text-sm text-muted-foreground">
								No models found matching your criteria.
							</div>
						) : (
							<div className="grid grid-cols-2 gap-1">
								{filteredModels.map(renderModelItem)}
							</div>
						)}
					</div>
				</div>
			</SelectContent>
		</Select>
	);
}