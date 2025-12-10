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
		<Select value={selectedProvider || undefined} onValueChange={onValueChange}>
			<SelectTrigger className="shrink-0 w-fit border border-wisteria-border bg-wisteria-panel text-sm text-wisteria-text focus-visible:ring-1 focus-visible:ring-wisteria-accent focus-visible:border-wisteria-accent">
				<SelectValue placeholder="Provider…" />
			</SelectTrigger>
			<SelectContent className="border border-wisteria-border bg-wisteria-panel text-wisteria-text shadow-lg">
				{providers.map((provider) => (
					<SelectItem key={provider} value={provider}>
						{provider}
					</SelectItem>
				))}
			</SelectContent>
		</Select>
	);
}

