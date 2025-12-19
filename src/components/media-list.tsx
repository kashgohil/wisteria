import { ImageIcon, MusicIcon, VideoIcon } from "lucide-react";
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

type MediaListProps = {
	selectedChatId: string | null;
	onSelectChat: (chatId: string) => void;
	onViewAll: () => void;
};

type MediaType = "all" | "image" | "video" | "audio";

function getMediaType(
	mimeType: string,
): "image" | "video" | "audio" | "unknown" {
	if (mimeType.startsWith("image/")) return "image";
	if (mimeType.startsWith("video/")) return "video";
	if (mimeType.startsWith("audio/")) return "audio";
	return "unknown";
}

function formatFileSize(bytes: number): string {
	if (bytes === 0) return "0 B";
	const k = 1024;
	const sizes = ["B", "KB", "MB"];
	const i = Math.floor(Math.log(bytes) / Math.log(k));
	return `${Number.parseFloat((bytes / k ** i).toFixed(1))} ${sizes[i]}`;
}

function formatDate(timestamp: number): string {
	const date = new Date(timestamp);
	const now = new Date();
	const diffMs = now.getTime() - date.getTime();
	const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

	if (diffDays === 0) return "Today";
	if (diffDays === 1) return "Yesterday";
	if (diffDays < 7) return `${diffDays} days ago`;

	return date.toLocaleDateString();
}

function MediaThumbnail({ attachment }: { attachment: Attachment }) {
	const mediaType = getMediaType(attachment.mime_type);
	const imagePath =
		mediaType === "image" ? `media://${attachment.file_path}` : null;

	if (mediaType === "image" && imagePath) {
		return (
			<img
				src={imagePath}
				alt={attachment.file_name}
				className="h-16 w-16 rounded object-cover"
			/>
		);
	}

	return (
		<div className="flex h-16 w-16 items-center justify-center rounded bg-wisteria-accent/10">
			{mediaType === "video" && (
				<VideoIcon className="h-8 w-8 text-wisteria-foreground/40" />
			)}
			{mediaType === "audio" && (
				<MusicIcon className="h-8 w-8 text-wisteria-foreground/40" />
			)}
			{mediaType === "unknown" && (
				<ImageIcon className="h-8 w-8 text-wisteria-foreground/40" />
			)}
		</div>
	);
}

export function MediaList({
	selectedChatId,
	onSelectChat,
	onViewAll,
}: MediaListProps) {
	const [attachments, setAttachments] = useState<Attachment[]>([]);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		void loadAttachments();
	}, []);

	const loadAttachments = async () => {
		try {
			setLoading(true);
			const allAttachments = await window.wisteria.attachments.list();
			setAttachments(allAttachments);
		} catch (err) {
			console.error("Failed to load attachments:", err);
		} finally {
			setLoading(false);
		}
	};

	// Show only 5 most recent items
	const recentAttachments = attachments.slice(0, 5);

	return (
		<div className="flex flex-col gap-2">
			<div className="flex items-center justify-between">
				<h3 className="text-sm font-medium text-wisteria-foreground">Media</h3>
				{attachments.length > 0 && (
					<button
						type="button"
						onClick={onViewAll}
						className="text-xs text-wisteria-accent hover:underline"
					>
						View all ({attachments.length})
					</button>
				)}
			</div>

			{/* Horizontal scrollable media list */}
			{loading ? (
				<div className="py-4 text-center text-xs text-wisteria-foreground/50">
					Loading...
				</div>
			) : recentAttachments.length === 0 ? (
				<div className="rounded-md border border-dashed border-wisteria-border bg-wisteria-accent/5 py-6 text-center text-xs text-wisteria-foreground/50">
					No media yet
				</div>
			) : (
				<div className="flex gap-2 overflow-x-auto pb-2">
					{recentAttachments.map((attachment) => (
						<button
							key={attachment.id}
							type="button"
							onClick={onViewAll}
							className="group flex-shrink-0 transition-transform hover:scale-105"
						>
							<div className="relative">
								<MediaThumbnail attachment={attachment} />
								<div className="absolute inset-0 rounded bg-black/0 transition-colors group-hover:bg-black/10" />
							</div>
							<div className="mt-1 w-16 truncate text-xs text-wisteria-foreground/60">
								{attachment.file_name.split(".")[0]}
							</div>
						</button>
					))}
				</div>
			)}
		</div>
	);
}
