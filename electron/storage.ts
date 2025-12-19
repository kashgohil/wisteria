import { app } from "electron";
import { randomUUID } from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";

// Configuration constants
export const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
export const MAX_ATTACHMENTS = 5;

export const SUPPORTED_TYPES = {
	image: ["image/jpeg", "image/png", "image/gif", "image/webp"],
	video: ["video/mp4", "video/webm"],
	audio: ["audio/mpeg", "audio/wav", "audio/mp4", "audio/m4a"],
};

/**
 * Get the base attachments directory path
 */
export function getAttachmentsDir(): string {
	return path.join(app.getPath("userData"), "attachments");
}

/**
 * Get the directory path for a specific chat's attachments
 */
export function getChatAttachmentsDir(chatId: string): string {
	return path.join(getAttachmentsDir(), chatId);
}

/**
 * Ensure the attachments directory exists
 */
export async function ensureAttachmentsDir(chatId: string): Promise<void> {
	const dir = getChatAttachmentsDir(chatId);
	await fs.mkdir(dir, { recursive: true });
}

/**
 * Validate file type against supported MIME types
 */
export function validateFileType(mimeType: string): boolean {
	const allTypes = [
		...SUPPORTED_TYPES.image,
		...SUPPORTED_TYPES.video,
		...SUPPORTED_TYPES.audio,
	];
	return allTypes.includes(mimeType);
}

/**
 * Validate file size
 */
export function validateFileSize(size: number): boolean {
	return size > 0 && size <= MAX_FILE_SIZE;
}

/**
 * Get file extension from MIME type
 */
export function getExtensionFromMimeType(mimeType: string): string {
	const mimeToExt: Record<string, string> = {
		"image/jpeg": ".jpg",
		"image/png": ".png",
		"image/gif": ".gif",
		"image/webp": ".webp",
		"video/mp4": ".mp4",
		"video/webm": ".webm",
		"audio/mpeg": ".mp3",
		"audio/wav": ".wav",
		"audio/mp4": ".m4a",
		"audio/m4a": ".m4a",
	};
	return mimeToExt[mimeType] || "";
}

/**
 * Save an attachment to disk
 * @param chatId - The chat ID to organize files
 * @param fileBuffer - The file data as a Buffer
 * @param fileName - Original file name (for reference, not used in storage path)
 * @param mimeType - MIME type of the file
 * @returns Relative file path (from attachments directory)
 */
export async function saveAttachment(
	chatId: string,
	fileBuffer: Buffer,
	fileName: string,
	mimeType: string,
): Promise<string> {
	// Validate file
	if (!validateFileType(mimeType)) {
		throw new Error(`Unsupported file type: ${mimeType}`);
	}

	if (!validateFileSize(fileBuffer.length)) {
		throw new Error(
			`File size ${fileBuffer.length} exceeds maximum ${MAX_FILE_SIZE} bytes`,
		);
	}

	// Ensure directory exists
	await ensureAttachmentsDir(chatId);

	// Generate unique filename with proper extension
	const ext = getExtensionFromMimeType(mimeType);
	const uniqueFileName = `${randomUUID()}${ext}`;
	const relativePath = path.join(chatId, uniqueFileName);
	const absolutePath = path.join(getAttachmentsDir(), relativePath);

	// Write file to disk
	await fs.writeFile(absolutePath, fileBuffer);

	// Return relative path for database storage
	return relativePath;
}

/**
 * Get absolute path for an attachment
 * @param relativePath - Relative path from attachments directory
 * @returns Absolute file path
 */
export function getAttachmentPath(relativePath: string): string {
	return path.join(getAttachmentsDir(), relativePath);
}

/**
 * Delete an attachment file from disk
 * @param relativePath - Relative path from attachments directory
 */
export async function deleteAttachment(relativePath: string): Promise<void> {
	const absolutePath = getAttachmentPath(relativePath);
	try {
		await fs.unlink(absolutePath);
	} catch (error) {
		// File might already be deleted or not exist, log but don't throw
		console.error(`Failed to delete attachment at ${absolutePath}:`, error);
	}
}

/**
 * Read an attachment and convert to base64
 * Useful for sending images to vision APIs
 * @param relativePath - Relative path from attachments directory
 * @returns Base64 encoded file content
 */
export async function getAttachmentAsBase64(
	relativePath: string,
): Promise<string> {
	const absolutePath = getAttachmentPath(relativePath);
	const buffer = await fs.readFile(absolutePath);
	return buffer.toString("base64");
}

/**
 * Check if an attachment file exists
 * @param relativePath - Relative path from attachments directory
 * @returns true if file exists
 */
export async function attachmentExists(relativePath: string): Promise<boolean> {
	const absolutePath = getAttachmentPath(relativePath);
	try {
		await fs.access(absolutePath);
		return true;
	} catch {
		return false;
	}
}

/**
 * Format file size in human-readable format
 * @param bytes - File size in bytes
 * @returns Formatted string (e.g., "1.5 MB")
 */
export function formatFileSize(bytes: number): string {
	if (bytes === 0) return "0 B";
	const k = 1024;
	const sizes = ["B", "KB", "MB", "GB"];
	const i = Math.floor(Math.log(bytes) / Math.log(k));
	return `${Number.parseFloat((bytes / k ** i).toFixed(2))} ${sizes[i]}`;
}

/**
 * Get media type category from MIME type
 * @param mimeType - MIME type string
 * @returns "image" | "video" | "audio" | "unknown"
 */
export function getMediaType(
	mimeType: string,
): "image" | "video" | "audio" | "unknown" {
	if (SUPPORTED_TYPES.image.includes(mimeType)) return "image";
	if (SUPPORTED_TYPES.video.includes(mimeType)) return "video";
	if (SUPPORTED_TYPES.audio.includes(mimeType)) return "audio";
	return "unknown";
}
