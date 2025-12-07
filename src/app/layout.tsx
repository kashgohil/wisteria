import { ConvexClientProvider } from "@/components/providers/convex-provider";
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Toaster } from "sonner";
import "./globals.css";

const geistSans = Geist({
	variable: "--font-geist-sans",
	subsets: ["latin"],
});

const geistMono = Geist_Mono({
	variable: "--font-geist-mono",
	subsets: ["latin"],
});

export const metadata: Metadata = {
	title: "Wisteria - AI Chat",
	description: "Chat with AI like never before",
};

export default function RootLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	return (
		<html lang="en">
			<body
				className={`${geistSans.variable} ${geistMono.variable} antialiased bg-black-300 text-white-400`}
			>
				<ConvexClientProvider>{children}</ConvexClientProvider>
				<Toaster
					position="top-right"
					richColors
					visibleToasts={3}
				/>
			</body>
		</html>
	);
}
