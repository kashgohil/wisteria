import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import type { ProviderId } from "../../shared/providers";

type ProviderSelectorProps = {
	providers: ProviderId[];
	selectedProvider: ProviderId;
	onValueChange: (value: ProviderId) => void;
};

export function ProviderSelector({
	providers,
	selectedProvider,
	onValueChange,
}: ProviderSelectorProps) {
	return (
		<Select
			value={selectedProvider || undefined}
			onValueChange={(value) => onValueChange(value as ProviderId)}
		>
			<SelectTrigger className="text-sm! px-2">
				<SelectValue placeholder="Provider…" />
			</SelectTrigger>
			<SelectContent>
				{providers.map((provider) => (
					<SelectItem
						key={provider}
						value={provider}
						className="text-sm! p-2"
					>
						{provider}
					</SelectItem>
				))}
			</SelectContent>
		</Select>
	);
}
