import { Button } from "@/components/ui/button";
import {
	ArrowLeft,
	ImageIcon,
	MusicIcon,
	Trash2,
	VideoIcon,
} from "lucide-react";
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

type MediaViewProps = {
	onClose: () => void;
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

function MediaCard({
	attachment,
	onDelete,
}: {
	attachment: Attachment;
	onDelete: (id: string) => void;
}) {
	const filePath = `media://${attachment.file_path}`;
	const mediaType = getMediaType(attachment.mime_type);

	const handleDownload = (e: React.MouseEvent) => {
		e.stopPropagation();
		const a = document.createElement("a");
		a.href = filePath;
		a.download = attachment.file_name;
		a.click();
	};

	const handleDelete = (e: React.MouseEvent) => {
		e.stopPropagation();
		if (window.confirm("Are you sure you want to delete this file?")) {
			onDelete(attachment.id);
		}
	};

	return (
		<div className="group relative overflow-hidden rounded-lg border border-wisteria-border bg-wisteria-background/50 transition-shadow hover:shadow-lg">
			{/* Media preview */}
			<div className="aspect-square w-full overflow-hidden bg-wisteria-accent/5">
				{mediaType === "image" && (
					<img
						src={filePath}
						alt={attachment.file_name}
						className="h-full w-full object-cover transition-transform group-hover:scale-105"
					/>
				)}
				{mediaType === "video" && (
					<div className="flex h-full w-full items-center justify-center bg-wisteria-accent/10">
						<VideoIcon className="h-16 w-16 text-wisteria-foreground/30" />
					</div>
				)}
				{mediaType === "audio" && (
					<div className="flex h-full w-full items-center justify-center bg-wisteria-accent/10">
						<MusicIcon className="h-16 w-16 text-wisteria-foreground/30" />
					</div>
				)}
				{mediaType === "unknown" && (
					<div className="flex h-full w-full items-center justify-center bg-wisteria-accent/10">
						<ImageIcon className="h-16 w-16 text-wisteria-foreground/30" />
					</div>
				)}

				{/* Overlay on hover */}
				<div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-black/0 opacity-0 transition-all group-hover:bg-black/40 group-hover:opacity-100">
					<button
						type="button"
						onClick={handleDownload}
						className="rounded-full bg-white/90 px-4 py-2 text-sm font-medium text-black transition-transform hover:scale-105"
					>
						Download
					</button>
					<button
						type="button"
						onClick={handleDelete}
						className="flex items-center gap-2 rounded-full bg-red-500/90 px-4 py-2 text-sm font-medium text-white transition-transform hover:scale-105 hover:bg-red-600"
					>
						<Trash2 className="h-4 w-4" />
						Delete
					</button>
				</div>
			</div>

			{/* Info */}
			<div className="p-3">
				<div className="truncate text-sm font-medium text-wisteria-foreground">
					{attachment.file_name}
				</div>
				<div className="mt-1 flex items-center gap-2 text-xs text-wisteria-foreground/60">
					<span>{formatFileSize(attachment.file_size)}</span>
					<span>•</span>
					<span>{formatDate(attachment.created_at)}</span>
				</div>
			</div>
		</div>
	);
}

export function MediaView({ onClose }: MediaViewProps) {
	const [attachments, setAttachments] = useState<Attachment[]>([]);
	const [filter, setFilter] = useState<MediaType>("all");
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

	const handleDelete = async (id: string) => {
		try {
			await window.wisteria.attachments.delete(id);
			setAttachments((prev) => prev.filter((a) => a.id !== id));
		} catch (err) {
			console.error("Failed to delete attachment:", err);
			alert("Failed to delete attachment. Please try again.");
		}
	};

	const filteredAttachments = attachments.filter((attachment) => {
		if (filter === "all") return true;
		const type = getMediaType(attachment.mime_type);
		return type === filter;
	});

	const stats = {
		all: attachments.length,
		image: attachments.filter((a) => getMediaType(a.mime_type) === "image")
			.length,
		video: attachments.filter((a) => getMediaType(a.mime_type) === "video")
			.length,
		audio: attachments.filter((a) => getMediaType(a.mime_type) === "audio")
			.length,
	};

	return (
		<div className="flex h-full flex-col">
			{/* Header */}
			<div className="flex items-center gap-4 border-b border-wisteria-border bg-wisteria-background/50 px-6 py-4">
				<Button
					variant="ghost"
					size="icon"
					onClick={onClose}
					className="shrink-0"
				>
					<ArrowLeft className="h-5 w-5" />
				</Button>
				<div className="flex-1">
					<h1 className="text-xl font-semibold text-wisteria-foreground">
						Media Library
					</h1>
					<p className="text-sm text-wisteria-foreground/60">
						{filteredAttachments.length} {filter !== "all" && `${filter} `}
						file{filteredAttachments.length !== 1 && "s"}
					</p>
				</div>
			</div>

			{/* Filters */}
			<div className="border-b border-wisteria-border bg-wisteria-background/30 px-6 py-4">
				<div className="flex flex-wrap gap-2">
					<button
						type="button"
						onClick={() => setFilter("all")}
						className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${
							filter === "all"
								? "bg-wisteria-accent text-white"
								: "bg-wisteria-accent/10 text-wisteria-foreground hover:bg-wisteria-accent/20"
						}`}
					>
						All ({stats.all})
					</button>
					<button
						type="button"
						onClick={() => setFilter("image")}
						className={`flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-colors ${
							filter === "image"
								? "bg-wisteria-accent text-white"
								: "bg-wisteria-accent/10 text-wisteria-foreground hover:bg-wisteria-accent/20"
						}`}
					>
						<ImageIcon className="h-4 w-4" />
						Images ({stats.image})
					</button>
					<button
						type="button"
						onClick={() => setFilter("video")}
						className={`flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-colors ${
							filter === "video"
								? "bg-wisteria-accent text-white"
								: "bg-wisteria-accent/10 text-wisteria-foreground hover:bg-wisteria-accent/20"
						}`}
					>
						<VideoIcon className="h-4 w-4" />
						Videos ({stats.video})
					</button>
					<button
						type="button"
						onClick={() => setFilter("audio")}
						className={`flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-colors ${
							filter === "audio"
								? "bg-wisteria-accent text-white"
								: "bg-wisteria-accent/10 text-wisteria-foreground hover:bg-wisteria-accent/20"
						}`}
					>
						<MusicIcon className="h-4 w-4" />
						Audio ({stats.audio})
					</button>
				</div>
			</div>

			{/* Media grid */}
			<div className="flex-1 overflow-y-auto p-6">
				{loading ? (
					<div className="flex h-64 items-center justify-center">
						<div className="text-center">
							<div className="text-sm text-wisteria-foreground/60">
								Loading media...
							</div>
						</div>
					</div>
				) : filteredAttachments.length === 0 ? (
					<div className="flex h-64 items-center justify-center">
						<div className="text-center">
							<ImageIcon className="mx-auto h-12 w-12 text-wisteria-foreground/20" />
							<div className="mt-4 text-sm font-medium text-wisteria-foreground/60">
								No {filter !== "all" && `${filter} `}media yet
							</div>
							<div className="mt-1 text-xs text-wisteria-foreground/40">
								Upload some files to get started
							</div>
						</div>
					</div>
				) : (
					<div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
						{filteredAttachments.map((attachment) => (
							<MediaCard
								key={attachment.id}
								attachment={attachment}
								onDelete={handleDelete}
							/>
						))}
					</div>
				)}
			</div>
		</div>
	);
}
