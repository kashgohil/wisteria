"use client";

import { models } from "@/app/constants";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "./ui/select";

interface ModelSelectorProps {
	value: string;
	onValueChange: (value: string) => void;
}

export function ModelSelector({ value, onValueChange }: ModelSelectorProps) {
	return (
		<Select
			value={value}
			onValueChange={onValueChange}
		>
			<SelectTrigger className="bg-accent text-black-200 border-none">
				<SelectValue placeholder="Select a model" />
			</SelectTrigger>
			<SelectContent
				className="min-w-[300px]"
				align="center"
			>
				{models.map((model) => (
					<SelectItem
						key={model.id}
						value={model.id}
					>
						<div className="flex w-full items-center justify-between gap-4">
							<span>{model.name}</span>
							<span className="text-xs text-muted-foreground">
								{model.pricing}
							</span>
						</div>
					</SelectItem>
				))}
			</SelectContent>
		</Select>
	);
}
