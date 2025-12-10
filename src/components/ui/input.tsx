import { cva, type VariantProps } from "class-variance-authority";
import * as React from "react";

import { cn } from "@/lib/utils";

const inputVariants = cva(
	"file:text-foreground placeholder:text-muted-foreground selection:bg-primary selection:text-primary-foreground w-full min-w-0 transition-[color,box-shadow] outline-none file:inline-flex file:border-0 file:bg-transparent file:font-medium disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40",
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
				default: "h-9 px-3 py-1 text-base md:text-sm file:h-7 file:text-sm",
				sm: "h-8 px-2.5 py-0.5 text-sm file:h-6 file:text-xs",
				lg: "h-11 px-4 py-2 text-base md:text-base file:h-8 file:text-sm",
			},
		},
		defaultVariants: {
			variant: "outlined",
			size: "default",
		},
	},
);

function Input({
	className,
	type,
	variant,
	size,
	...props
}: React.ComponentProps<"input"> & VariantProps<typeof inputVariants>) {
	return (
		<input
			type={type}
			data-slot="input"
			className={cn(inputVariants({ variant, size, className }))}
			{...props}
		/>
	);
}

export { Input, inputVariants };
