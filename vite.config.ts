import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vite";
import electron from "vite-plugin-electron/simple";

// __dirname is not available in ESM by default; recreate it for path helpers
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// https://vitejs.dev/config/
export default defineConfig({
	plugins: [
		react(),
		tailwindcss(),
		electron({
			main: {
				// Shortcut of `build.lib.entry`.
				entry: "electron/main.ts",
				// Keep native addon out of the bundle so better-sqlite3 can load
				vite: {
					build: {
						rollupOptions: {
							external: ["better-sqlite3"],
						},
					},
				},
			},
			preload: {
				// Shortcut of `build.rollupOptions.input`.
				// Preload scripts may contain Web assets, so use the `build.rollupOptions.input` instead `build.lib.entry`.
				input: path.join(__dirname, "electron/preload.ts"),
			},
			// Ployfill the Electron and Node.js API for Renderer process.
			// If you want use Node.js in Renderer process, the `nodeIntegration` needs to be enabled in the Main process.
			// See 👉 https://github.com/electron-vite/vite-plugin-electron-renderer
			renderer: process.env.NODE_ENV === "test" ? undefined : {},
		}),
	],
	resolve: {
		alias: {
			"@": path.resolve(__dirname, "./src"),
		},
	},
});
