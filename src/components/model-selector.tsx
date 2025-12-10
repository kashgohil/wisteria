import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import type { ModelInfo, ModelPricing } from "../../shared/models";

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
	const formatPricing = (pricing?: ModelPricing) => {
		if (!pricing) return "";
		const input = pricing.input ?? pricing.prompt;
		const output = pricing.output ?? pricing.completion;

		const inputPricing = input ? `${input}/MToken input` : "";
		const outputPricing = output ? `${output}/MToken output` : "";

		return [inputPricing, outputPricing].filter(Boolean).join(" | ");
	};

	return (
		<Select
			value={selectedModelId || undefined}
			onValueChange={onValueChange}
			disabled={disabled}
		>
			<SelectTrigger className="shrink-0 w-fit text-sm! px-2">
				<SelectValue placeholder="Model…" />
			</SelectTrigger>
			<SelectContent>
				{models
					.filter(
						(m) =>
							m.architecture?.input_modalities?.includes("text") &&
							m.architecture?.output_modalities?.includes("text"),
					)
					.map((m) => (
						<SelectItem
							key={m.id}
							value={m.id}
							className="text-sm! p-2"
						>
							<div className="flex flex-col gap-0.5">
								<span>{m.name}</span>
								{formatPricing(m.pricing) && (
									<span className="text-xs text-muted-foreground">
										{formatPricing(m.pricing)}
									</span>
								)}
							</div>
						</SelectItem>
					))}
			</SelectContent>
		</Select>
	);
}
