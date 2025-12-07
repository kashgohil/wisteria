"use client";

import { ClerkProvider, useAuth } from "@clerk/nextjs";
import { ConvexReactClient } from "convex/react";
import { ConvexProviderWithClerk } from "convex/react-clerk";
import { ReactNode } from "react";

const convex = new ConvexReactClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

export function ConvexClientProvider({ children }: { children: ReactNode }) {
	return (
		<ClerkProvider
			appearance={{
				variables: {
					colorPrimary: "#a3a0f3",
					colorTextOnPrimaryBackground: "#000",
					colorInputText: "#ffffff",
				},
			}}
		>
			<ConvexProviderWithClerk
				client={convex}
				useAuth={useAuth}
			>
				{children}
			</ConvexProviderWithClerk>
		</ClerkProvider>
	);
}
