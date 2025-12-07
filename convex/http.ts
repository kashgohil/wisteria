import { httpRouter } from "convex/server";

const http = httpRouter();

// HTTP routes can be added here for streaming endpoints
// For now, we'll keep the chat streaming in Next.js API routes
// since it requires external API calls to OpenRouter

export default http;
