import { cva, type VariantProps } from "class-variance-authority";
import * as React from "react";

import { cn } from "@/lib/utils";

const textareaVariants = cva(
	"placeholder:text-muted-foreground flex field-sizing-content w-full transition-[color,box-shadow] outline-none disabled:cursor-not-allowed disabled:opacity-50 focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40",
	{
		variants: {
			variant: {
				outlined:
					"border-border dark:bg-input/30 rounded-md border bg-transparent shadow-xs focus-visible:border-ring aria-invalid:border-destructive",
				underlined:
					"border-border dark:bg-input/30 border-x-0 border-t-0 border-b-2 rounded-none bg-transparent focus-visible:border-ring focus-visible:ring-0 aria-invalid:border-destructive",
				filled:
					"border-border border-0 rounded-md bg-input/50 dark:bg-input/30 shadow-xs focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 aria-invalid:ring-destructive/20",
				ghost:
					"border-0 rounded-md bg-transparent shadow-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 hover:bg-accent/50 aria-invalid:ring-destructive/20",
			},
			size: {
				default: "min-h-16 px-3 py-2 text-base md:text-sm",
				sm: "min-h-12 px-2.5 py-1.5 text-sm",
				lg: "min-h-24 px-4 py-3 text-base md:text-base",
			},
		},
		defaultVariants: {
			variant: "outlined",
			size: "default",
		},
	},
);

function Textarea({
	className,
	variant,
	size,
	...props
}: React.ComponentProps<"textarea"> & VariantProps<typeof textareaVariants>) {
	return (
		<textarea
			data-slot="textarea"
			className={cn(textareaVariants({ variant, size, className }))}
			{...props}
		/>
	);
}

export { Textarea, textareaVariants };
