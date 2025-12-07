"use client";

import { Button } from "@/components/ui/button";
import {
	Collapsible,
	CollapsibleContent,
	CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { cn } from "@/lib/utils";
import { Brain, ChevronDown, ChevronRight } from "lucide-react";
import { useState } from "react";

interface ThinkingBlockProps {
	reasoning: string;
	isStreaming?: boolean;
}

export function ThinkingBlock({
	reasoning,
	isStreaming = false,
}: ThinkingBlockProps) {
	const [isOpen, setIsOpen] = useState(false);

	if (!reasoning) return null;

	return (
		<Collapsible
			open={isOpen}
			onOpenChange={setIsOpen}
			className="mb-3"
		>
			<CollapsibleTrigger asChild>
				<Button
					variant="ghost"
					size="sm"
					className={cn(
						"gap-2 text-muted-foreground hover:text-foreground",
						"bg-wisteria-500/10 hover:bg-wisteria-500/20",
						"border border-wisteria-500/20",
					)}
				>
					<Brain
						className={cn(
							"h-4 w-4 text-wisteria-500",
							isStreaming && "animate-pulse",
						)}
					/>
					<span className="font-medium">
						{isStreaming ? "Thinking..." : "Thought process"}
					</span>
					{isOpen ? (
						<ChevronDown className="h-4 w-4" />
					) : (
						<ChevronRight className="h-4 w-4" />
					)}
				</Button>
			</CollapsibleTrigger>
			<CollapsibleContent className="mt-2 p-4 rounded-lg bg-muted/30 border border-border/50">
				<div className="text-sm text-muted-foreground whitespace-pre-wrap leading-relaxed">
					{reasoning}
				</div>
			</CollapsibleContent>
		</Collapsible>
	);
}
