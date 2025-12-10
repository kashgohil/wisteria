import { Input } from "@/components/ui/input";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Search } from "lucide-react";
import { useMemo, useState } from "react";
import type { ModelInfo } from "../../shared/models";

type ModelSelectorProps = {
	models: ModelInfo[];
	selectedModelId: string;
	onValueChange: (value: string) => void;
	disabled?: boolean;
};

export function ModelSelector({
	models,
	selectedModelId,
	onValueChange,
	disabled = false,
}: ModelSelectorProps) {
	const [searchQuery, setSearchQuery] = useState("");

	const textModels = useMemo(
		() =>
			models.filter((m) => {
				if (!m.architecture) return true;
				return (
					m.architecture.input_modalities?.includes("text") &&
					m.architecture.output_modalities?.includes("text")
				);
			}),
		[models],
	);

	const filteredModels = useMemo(() => {
		if (!searchQuery.trim()) return textModels;
		const query = searchQuery.toLowerCase();
		return textModels.filter(
			(m) =>
				m.name.toLowerCase().includes(query) ||
				m.id.toLowerCase().includes(query) ||
				m.description?.toLowerCase().includes(query),
		);
	}, [textModels, searchQuery]);

	const showSearch = textModels.length > 10;

	return (
		<Select
			value={selectedModelId || undefined}
			onValueChange={onValueChange}
			disabled={disabled}
		>
			<SelectTrigger className="shrink-0 w-fit text-sm! px-2">
				<SelectValue placeholder="Model…">
					{selectedModelId
						? filteredModels.find((m) => m.id === selectedModelId)?.name
						: "Model…"}
				</SelectValue>
			</SelectTrigger>
			<SelectContent className="h-[500px] w-[500px] flex flex-col">
				{showSearch && (
					<div className="sticky top-0 left-0 right-0 bg-popover p-2 z-1">
						<div className="relative">
							<Search className="absolute left-2 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
							<Input
								placeholder="Search models…"
								value={searchQuery}
								onChange={(e) => setSearchQuery(e.target.value)}
								onClick={(e) => e.stopPropagation()}
								onKeyDown={(e) => e.stopPropagation()}
								className="pl-8 h-8 text-sm"
								variant="filled"
							/>
						</div>
					</div>
				)}
				<div className="flex-1 overflow-y-auto grid grid-cols-2 gap-2 p-2">
					{filteredModels.length === 0 ? (
						<div className="px-2 py-6 text-center text-sm text-muted-foreground">
							No models found
						</div>
					) : (
						filteredModels.map((m) => (
							<SelectItem
								key={m.id}
								value={m.id}
								className="text-sm! p-2 border rounded-lg items-start"
							>
								<div className="flex flex-col gap-1 items-start">
									<span className="font-semibold">{m.name}</span>
									{m.architecture?.input_modalities && (
										<span className="text-xs text-muted-foreground">
											Allowed Input:{" "}
											{m.architecture?.input_modalities?.join(", ")}
										</span>
									)}
									{m.architecture?.output_modalities && (
										<span className="text-xs text-muted-foreground">
											Allowed Output:{" "}
											{m.architecture?.output_modalities?.join(", ")}
										</span>
									)}
									{(m.pricing?.prompt || m.pricing?.input) && (
										<span className="text-xs text-muted-foreground">
											{m.pricing?.prompt ?? m.pricing?.input} $ per MToken input
										</span>
									)}
									{(m.pricing?.completion || m.pricing?.output) && (
										<span className="text-xs text-muted-foreground">
											{m.pricing?.completion ?? m.pricing?.output} $ per MToken
											output
										</span>
									)}
								</div>
							</SelectItem>
						))
					)}
				</div>
			</SelectContent>
		</Select>
	);
}
