import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";

type ProviderSelectorProps = {
	providers: string[];
	selectedProvider: string;
	onValueChange: (value: string) => void;
};

export function ProviderSelector({
	providers,
	selectedProvider,
	onValueChange,
}: ProviderSelectorProps) {
	return (
		<Select
			value={selectedProvider || undefined}
			onValueChange={onValueChange}
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
