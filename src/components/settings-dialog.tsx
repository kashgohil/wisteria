import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Save, Trash2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

type SettingsDialogProps = {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	providers: string[];
};

type ProviderKeyRow = {
	provider: string;
	value: string;
};

const LOCAL_PROVIDERS = ["ollama", "lmstudio"];

const normalizeKeyName = (provider: string) => {
	const trimmed = provider.trim();
	if (!trimmed) return "";
	return trimmed.endsWith("_api_key") ? trimmed : `${trimmed}_api_key`;
};

export function SettingsDialog({
	open,
	onOpenChange,
	providers,
}: SettingsDialogProps) {
	const [rows, setRows] = useState<ProviderKeyRow[]>([]);
	const [isBusy, setIsBusy] = useState(false);

	const knownProviders = useMemo(
		() =>
			Array.from(new Set(providers))
				.filter((p) => !LOCAL_PROVIDERS.includes(p))
				.sort(),
		[providers],
	);

	useEffect(() => {
		if (!open) return;

		const load = async () => {
			const stored = await window.wisteria.keys.list();
			const normalized = stored
				.map((entry) => ({
					provider: entry.key.replace(/_api_key$/, ""),
					value: entry.value,
				}))
				.filter((entry) => !LOCAL_PROVIDERS.includes(entry.provider));

			const mergedProviders = Array.from(
				new Set([...knownProviders, ...normalized.map((n) => n.provider)]),
			);

			setRows(
				mergedProviders.map((provider) => ({
					provider,
					value: normalized.find((n) => n.provider === provider)?.value ?? "",
				})),
			);
		};

		void load();
	}, [knownProviders, open]);

	const updateRowValue = (provider: string, value: string) => {
		setRows((prev) =>
			prev.map((row) => (row.provider === provider ? { ...row, value } : row)),
		);
	};

	const handleSave = async (provider: string, value: string) => {
		const storageKey = normalizeKeyName(provider);
		if (!storageKey) return;

		setIsBusy(true);
		if (value.trim()) {
			await window.wisteria.keys.set(storageKey, value.trim());
		} else {
			await window.wisteria.keys.delete(storageKey);
		}
		setIsBusy(false);
	};

	const handleRemove = async (provider: string) => {
		const storageKey = normalizeKeyName(provider);
		if (!storageKey) return;

		setIsBusy(true);
		await window.wisteria.keys.delete(storageKey);
		setRows((prev) =>
			prev.map((row) =>
				row.provider === provider ? { ...row, value: "" } : row,
			),
		);
		setIsBusy(false);
	};

	return (
		<Dialog
			open={open}
			onOpenChange={onOpenChange}
		>
			<DialogContent>
				<DialogHeader>
					<DialogTitle>Settings</DialogTitle>
					<DialogDescription>
						Add, update, or remove API keys for your providers.
					</DialogDescription>
				</DialogHeader>

				<div className="space-y-4 py-2">
					<div className="space-y-2">
						{rows.map((row) => (
							<div
								key={row.provider}
								className="flex flex-col gap-2"
							>
								<div className="w-28 text-sm font-medium capitalize">
									{row.provider}
								</div>
								<div className="flex items-center gap-2">
									<Input
										type="password"
										placeholder="API key"
										value={row.value}
										onChange={(e) =>
											updateRowValue(row.provider, e.target.value)
										}
										className="text-sm!"
									/>
									<div className="flex items-center gap-0.5">
										<Button
											variant="ghost"
											size="icon"
											disabled={isBusy}
											onClick={() => void handleSave(row.provider, row.value)}
										>
											<Save />
										</Button>
										<Button
											variant="ghost"
											size="icon"
											disabled={isBusy}
											onClick={() => void handleRemove(row.provider)}
										>
											<Trash2 className="h-4 w-4" />
										</Button>
									</div>
								</div>
							</div>
						))}
					</div>
				</div>

				<DialogFooter>
					<Button
						variant="outline"
						onClick={() => onOpenChange(false)}
					>
						Close
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
