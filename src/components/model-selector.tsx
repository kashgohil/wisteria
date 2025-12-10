import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";

type ModelOption = { id: string; label: string; provider: string };

type ModelSelectorProps = {
	models: ModelOption[];
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
	return (
		<Select
			value={selectedModelId || undefined}
			onValueChange={onValueChange}
			disabled={disabled}
		>
			<SelectTrigger className="shrink-0 w-fit border border-wisteria-border bg-wisteria-panel text-sm text-wisteria-text focus-visible:ring-1 focus-visible:ring-wisteria-accent focus-visible:border-wisteria-accent disabled:opacity-50">
				<SelectValue placeholder="Model…" />
			</SelectTrigger>
			<SelectContent className="border border-wisteria-border bg-wisteria-panel text-wisteria-text shadow-lg">
				{models.map((m) => (
					<SelectItem key={m.id} value={m.id}>
						{m.label}
					</SelectItem>
				))}
			</SelectContent>
		</Select>
	);
}

