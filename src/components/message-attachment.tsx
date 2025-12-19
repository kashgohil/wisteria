import { DownloadIcon, FileIcon } from "lucide-react";
import { useEffect, useState } from "react";

type Attachment = {
	id: string;
	message_id: string;
	file_name: string;
	mime_type: string;
	file_path: string;
	file_size: number;
	created_at: number;
};

type MessageAttachmentProps = {
	attachment: Attachment;
	onImageClick?: () => void;
};

function formatFileSize(bytes: number): string {
	if (bytes === 0) return "0 B";
	const k = 1024;
	const sizes = ["B", "KB", "MB", "GB"];
	const i = Math.floor(Math.log(bytes) / Math.log(k));
	return `${Number.parseFloat((bytes / k ** i).toFixed(2))} ${sizes[i]}`;
}

function getMediaType(
	mimeType: string,
): "image" | "video" | "audio" | "unknown" {
	if (mimeType.startsWith("image/")) return "image";
	if (mimeType.startsWith("video/")) return "video";
	if (mimeType.startsWith("audio/")) return "audio";
	return "unknown";
}

export function MessageAttachment({
	attachment,
	onImageClick,
}: MessageAttachmentProps) {
	const [filePath, setFilePath] = useState<string | null>(null);
	const mediaType = getMediaType(attachment.mime_type);

	useEffect(() => {
		// Get the file path from the main process
		window.wisteria.attachments
			.getPath(attachment.id)
			.then((path) => {
				// Convert to file:// URL for Electron
				setFilePath(`file://${path}`);
			})
			.catch((err) => {
				console.error("Failed to get attachment path:", err);
			});
	}, [attachment.id]);

	const handleDownload = () => {
		if (!filePath) return;

		// Create a temporary link to trigger download
		const a = document.createElement("a");
		a.href = filePath;
		a.download = attachment.file_name;
		a.click();
	};

	if (!filePath) {
		return (
			<div className="flex items-center gap-2 rounded-md border border-wisteria-border bg-wisteria-background/50 p-2">
				<FileIcon className="h-4 w-4 text-wisteria-foreground/60" />
				<div className="text-xs text-wisteria-foreground/60">Loading...</div>
			</div>
		);
	}

	return (
		<div className="inline-block max-w-full">
			{mediaType === "image" && (
				<div className="group relative">
					<img
						src={filePath}
						alt={attachment.file_name}
						className="max-h-96 max-w-full cursor-pointer rounded-lg object-contain transition-opacity hover:opacity-90"
						onClick={onImageClick}
					/>
					<div className="mt-1 flex items-center justify-between gap-2 text-xs text-wisteria-foreground/60">
						<span className="truncate">{attachment.file_name}</span>
						<button
							type="button"
							onClick={handleDownload}
							className="flex items-center gap-1 rounded px-2 py-1 hover:bg-wisteria-accent/20"
							aria-label="Download"
						>
							<DownloadIcon className="h-3 w-3" />
							<span>{formatFileSize(attachment.file_size)}</span>
						</button>
					</div>
				</div>
			)}

			{mediaType === "video" && (
				<div className="space-y-1">
					<video
						src={filePath}
						controls
						className="max-h-96 max-w-full rounded-lg"
					>
						<track kind="captions" />
						Your browser does not support video playback.
					</video>
					<div className="flex items-center justify-between gap-2 text-xs text-wisteria-foreground/60">
						<span className="truncate">{attachment.file_name}</span>
						<button
							type="button"
							onClick={handleDownload}
							className="flex items-center gap-1 rounded px-2 py-1 hover:bg-wisteria-accent/20"
							aria-label="Download"
						>
							<DownloadIcon className="h-3 w-3" />
							<span>{formatFileSize(attachment.file_size)}</span>
						</button>
					</div>
				</div>
			)}

			{mediaType === "audio" && (
				<div className="space-y-1 rounded-lg border border-wisteria-border bg-wisteria-background/50 p-3">
					<div className="mb-2 flex items-center justify-between gap-2">
						<span className="truncate text-sm text-wisteria-foreground">
							{attachment.file_name}
						</span>
						<button
							type="button"
							onClick={handleDownload}
							className="flex items-center gap-1 rounded px-2 py-1 text-xs text-wisteria-foreground/60 hover:bg-wisteria-accent/20"
							aria-label="Download"
						>
							<DownloadIcon className="h-3 w-3" />
							<span>{formatFileSize(attachment.file_size)}</span>
						</button>
					</div>
					<audio src={filePath} controls className="w-full">
						<track kind="captions" />
						Your browser does not support audio playback.
					</audio>
				</div>
			)}

			{mediaType === "unknown" && (
				<div className="flex items-center justify-between gap-3 rounded-lg border border-wisteria-border bg-wisteria-background/50 p-3">
					<div className="flex items-center gap-2 overflow-hidden">
						<FileIcon className="h-4 w-4 flex-shrink-0 text-wisteria-foreground/60" />
						<div className="overflow-hidden">
							<div className="truncate text-sm text-wisteria-foreground">
								{attachment.file_name}
							</div>
							<div className="text-xs text-wisteria-foreground/60">
								{formatFileSize(attachment.file_size)}
							</div>
						</div>
					</div>
					<button
						type="button"
						onClick={handleDownload}
						className="flex items-center gap-1 rounded px-3 py-1.5 text-xs text-wisteria-foreground/60 hover:bg-wisteria-accent/20"
						aria-label="Download"
					>
						<DownloadIcon className="h-3 w-3" />
						Download
					</button>
				</div>
			)}
		</div>
	);
}
