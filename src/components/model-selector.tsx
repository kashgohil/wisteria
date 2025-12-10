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
			<SelectTrigger className="shrink-0 w-fit text-sm">
				<SelectValue placeholder="Model…" />
			</SelectTrigger>
			<SelectContent>
				{models.map((m) => (
					<SelectItem key={m.id} value={m.id}>
						{m.label}
					</SelectItem>
				))}
			</SelectContent>
		</Select>
	);
}

