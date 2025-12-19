import { XIcon } from "lucide-react";
import { useEffect } from "react";

type ImageLightboxProps = {
	imageSrc: string;
	imageAlt: string;
	onClose: () => void;
};

export function ImageLightbox({
	imageSrc,
	imageAlt,
	onClose,
}: ImageLightboxProps) {
	useEffect(() => {
		// Handle ESC key to close
		const handleEscape = (e: KeyboardEvent) => {
			if (e.key === "Escape") {
				onClose();
			}
		};

		document.addEventListener("keydown", handleEscape);
		return () => document.removeEventListener("keydown", handleEscape);
	}, [onClose]);

	useEffect(() => {
		// Prevent body scroll when lightbox is open
		document.body.style.overflow = "hidden";
		return () => {
			document.body.style.overflow = "unset";
		};
	}, []);

	return (
		<div
			className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4 backdrop-blur-sm"
			onClick={onClose}
			onKeyDown={(e) => {
				if (e.key === "Enter" || e.key === " ") {
					onClose();
				}
			}}
			role="button"
			tabIndex={0}
			aria-label="Close image"
		>
			{/* Close button */}
			<button
				type="button"
				onClick={onClose}
				className="absolute right-4 top-4 rounded-full bg-black/50 p-2 text-white transition-colors hover:bg-black/70 focus:outline-none focus:ring-2 focus:ring-white/50"
				aria-label="Close"
			>
				<XIcon className="h-6 w-6" />
			</button>

			{/* Image */}
			<img
				src={imageSrc}
				alt={imageAlt}
				className="max-h-[90vh] max-w-[90vw] object-contain"
				onClick={(e) => e.stopPropagation()}
				onKeyDown={(e) => e.stopPropagation()}
				role="img"
			/>

			{/* ESC hint */}
			<div className="absolute bottom-4 left-1/2 -translate-x-1/2 rounded-full bg-black/50 px-4 py-2 text-sm text-white/80">
				Press ESC or click outside to close
			</div>
		</div>
	);
}
