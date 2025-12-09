import path from "node:path";
import { fileURLToPath } from "node:url";

// Expose CommonJS globals for dependencies that still rely on them
const filename = fileURLToPath(import.meta.url);
const dirname = path.dirname(filename);

(globalThis as unknown as { __filename: string; __dirname: string }).__filename =
	filename;
(globalThis as unknown as { __filename: string; __dirname: string }).__dirname =
	dirname;

