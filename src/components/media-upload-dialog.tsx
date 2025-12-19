import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  CheckIcon,
  ImageIcon,
  MusicIcon,
  Trash2Icon,
  VideoIcon,
  XIcon,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const MAX_FILES = 5;

const SUPPORTED_TYPES = {
  image: ["image/jpeg", "image/png", "image/gif", "image/webp"],
  video: ["video/mp4", "video/webm"],
  audio: ["audio/mpeg", "audio/wav", "audio/mp4", "audio/m4a"],
};

const ALL_SUPPORTED_TYPES = [
  ...SUPPORTED_TYPES.image,
  ...SUPPORTED_TYPES.video,
  ...SUPPORTED_TYPES.audio,
];

type Attachment = {
  id: string;
  message_id: string;
  file_name: string;
  mime_type: string;
  file_path: string;
  file_size: number;
  created_at: number;
};

type MediaUploadDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedFiles: File[];
  onFilesChange: (files: File[]) => void;
  existingAttachments: string[]; // IDs of existing attachments to reuse
  onExistingAttachmentsChange: (ids: string[]) => void;
};

function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${Number.parseFloat((bytes / k ** i).toFixed(2))} ${sizes[i]}`;
}

function getMediaType(
  mimeType: string,
): "image" | "video" | "audio" | "unknown" {
  if (SUPPORTED_TYPES.image.includes(mimeType)) return "image";
  if (SUPPORTED_TYPES.video.includes(mimeType)) return "video";
  if (SUPPORTED_TYPES.audio.includes(mimeType)) return "audio";
  return "unknown";
}

function NewFilePreview({
  file,
  onRemove,
}: {
  file: File;
  onRemove: () => void;
}) {
  const [preview, setPreview] = useState<string | null>(null);
  const mediaType = getMediaType(file.type);

  useEffect(() => {
    if (mediaType === "image") {
      const reader = new FileReader();
      reader.onload = (e) => setPreview(e.target?.result as string);
      reader.readAsDataURL(file);
    }
  }, [file, mediaType]);

  return (
    <div className="group relative overflow-hidden rounded-lg border border-wisteria-border bg-wisteria-background/50">
      <div className="aspect-square w-full overflow-hidden bg-wisteria-accent/5">
        {mediaType === "image" && preview ? (
          <img
            src={preview}
            alt={file.name}
            className="h-full w-full object-cover"
          />
        ) : mediaType === "video" ? (
          <div className="flex h-full w-full items-center justify-center">
            <VideoIcon className="h-12 w-12 text-wisteria-accent/80" />
          </div>
        ) : mediaType === "audio" ? (
          <div className="flex h-full w-full items-center justify-center">
            <MusicIcon className="h-12 w-12 text-wisteria-accent/80" />
          </div>
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <ImageIcon className="h-12 w-12 text-wisteria-accent/80" />
          </div>
        )}
      </div>
      <div className="p-2">
        <div className="truncate text-xs font-medium text-wisteria-foreground">
          {file.name}
        </div>
        <div className="text-xs text-wisteria-foreground/60">
          {formatFileSize(file.size)}
        </div>
      </div>
      <button
        type="button"
        onClick={onRemove}
        className="absolute right-2 top-2 rounded-full bg-red-500 p-1 text-white opacity-0 transition-opacity hover:bg-red-600 group-hover:opacity-100"
        aria-label="Remove file"
      >
        <Trash2Icon className="h-3 w-3" />
      </button>
    </div>
  );
}

function ExistingMediaItem({
  attachment,
  selected,
  onToggle,
}: {
  attachment: Attachment;
  selected: boolean;
  onToggle: () => void;
}) {
  const [filePath, setFilePath] = useState<string | null>(null);
  const mediaType = getMediaType(attachment.mime_type);

  useEffect(() => {
    if (mediaType === "image") {
      window.wisteria.attachments
        .getPath(attachment.id)
        .then((path) => setFilePath(`file://${path}`))
        .catch((err) => console.error("Failed to load image:", err));
    }
  }, [attachment.id, mediaType]);

  return (
    <button
      type="button"
      onClick={onToggle}
      className="group relative overflow-hidden rounded-lg border border-wisteria-border bg-wisteria-background/50 transition-all hover:border-wisteria-accent"
    >
      <div className="aspect-square w-full overflow-hidden bg-wisteria-accent/5">
        {mediaType === "image" && filePath ? (
          <img
            src={filePath}
            alt={attachment.file_name}
            className="h-full w-full object-cover"
          />
        ) : mediaType === "video" ? (
          <div className="flex h-full w-full items-center justify-center">
            <VideoIcon className="h-12 w-12 text-wisteria-foreground/30" />
          </div>
        ) : mediaType === "audio" ? (
          <div className="flex h-full w-full items-center justify-center">
            <MusicIcon className="h-12 w-12 text-wisteria-foreground/30" />
          </div>
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <ImageIcon className="h-12 w-12 text-wisteria-accent/80" />
          </div>
        )}
      </div>
      <div className="p-2">
        <div className="truncate text-xs font-medium text-wisteria-foreground">
          {attachment.file_name}
        </div>
        <div className="text-xs text-wisteria-foreground/60">
          {formatFileSize(attachment.file_size)}
        </div>
      </div>
      {selected && (
        <div className="absolute right-2 top-2 rounded-full bg-wisteria-accent p-1 text-white">
          <CheckIcon className="h-3 w-3" />
        </div>
      )}
    </button>
  );
}

export function MediaUploadDialog({
  open,
  onOpenChange,
  selectedFiles,
  onFilesChange,
  existingAttachments,
  onExistingAttachmentsChange,
}: MediaUploadDialogProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [allAttachments, setAllAttachments] = useState<Attachment[]>([]);
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      void loadAttachments();
    }
  }, [open]);

  const loadAttachments = async () => {
    try {
      setLoading(true);
      const attachments = await window.wisteria.attachments.list();
      setAllAttachments(attachments);
    } catch (err) {
      console.error("Failed to load attachments:", err);
    } finally {
      setLoading(false);
    }
  };

  const validateAndAddFiles = (newFiles: FileList | File[]) => {
    const fileArray = Array.from(newFiles);
    const errors: string[] = [];
    const totalFiles = selectedFiles.length + existingAttachments.length;

    // Check total file count
    if (totalFiles + fileArray.length > MAX_FILES) {
      setError(`Maximum ${MAX_FILES} files allowed`);
      return;
    }

    // Validate each file
    const validFiles = fileArray.filter((file) => {
      if (!ALL_SUPPORTED_TYPES.includes(file.type)) {
        errors.push(`${file.name}: Unsupported file type`);
        return false;
      }
      if (file.size > MAX_FILE_SIZE) {
        errors.push(
          `${file.name}: File too large (max ${formatFileSize(MAX_FILE_SIZE)})`,
        );
        return false;
      }
      if (
        selectedFiles.some((f) => f.name === file.name && f.size === file.size)
      ) {
        errors.push(`${file.name}: Already added`);
        return false;
      }
      return true;
    });

    if (errors.length > 0) {
      setError(errors[0]);
      setTimeout(() => setError(null), 5000);
    } else {
      setError(null);
    }

    if (validFiles.length > 0) {
      onFilesChange([...selectedFiles, ...validFiles]);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const droppedFiles = e.dataTransfer.files;
    if (droppedFiles.length > 0) {
      validateAndAddFiles(droppedFiles);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFilesInput = e.target.files;
    if (selectedFilesInput && selectedFilesInput.length > 0) {
      validateAndAddFiles(selectedFilesInput);
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleRemoveFile = (index: number) => {
    onFilesChange(selectedFiles.filter((_, i) => i !== index));
  };

  const handleToggleExisting = (id: string) => {
    if (existingAttachments.includes(id)) {
      onExistingAttachmentsChange(existingAttachments.filter((i) => i !== id));
    } else {
      const totalFiles = selectedFiles.length + existingAttachments.length;
      if (totalFiles >= MAX_FILES) {
        setError(`Maximum ${MAX_FILES} files allowed`);
        setTimeout(() => setError(null), 3000);
        return;
      }
      onExistingAttachmentsChange([...existingAttachments, id]);
    }
  };

  const totalSelected = selectedFiles.length + existingAttachments.length;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl w-[90vw] max-h-[90vh] h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Add Media</DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto space-y-6">
          {/* Upload new files */}
          <div>
            <h3 className="text-sm font-medium text-wisteria-foreground mb-3">
              Upload New Files
            </h3>
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              className={`relative rounded-lg border-2 border-dashed transition-colors ${
                isDragging
                  ? "border-wisteria-accent bg-wisteria-accent/10"
                  : "border-wisteria-border hover:border-wisteria-accent/50"
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept={ALL_SUPPORTED_TYPES.join(",")}
                onChange={handleFileSelect}
                className="absolute inset-0 cursor-pointer opacity-0"
                aria-label="Upload files"
              />
              <div className="flex flex-col items-center justify-center gap-3 p-8">
                <ImageIcon className="h-12 w-12 text-wisteria-accent/80" />
                <div className="text-center">
                  <p className="text-sm text-wisteria-foreground/80">
                    Drop files here or{" "}
                    <span className="font-medium text-wisteria-accent">
                      browse
                    </span>
                  </p>
                  <p className="text-xs text-wisteria-foreground/50 mt-1">
                    Images, videos, audio (max {formatFileSize(MAX_FILE_SIZE)}{" "}
                    each)
                  </p>
                </div>
              </div>
            </div>

            {/* Error message */}
            {error && (
              <div className="mt-3 flex items-center gap-2 rounded-md bg-red-500/10 px-3 py-2 text-sm text-red-600 dark:text-red-400">
                <XIcon className="h-4 w-4 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Selected new files */}
            {selectedFiles.length > 0 && (
              <div className="mt-4">
                <h4 className="text-xs font-medium text-wisteria-foreground/60 mb-2">
                  Selected ({selectedFiles.length})
                </h4>
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
                  {selectedFiles.map((file, index) => (
                    <NewFilePreview
                      key={`${file.name}-${index}`}
                      file={file}
                      onRemove={() => handleRemoveFile(index)}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Existing media */}
          <div>
            <h3 className="text-sm font-medium text-wisteria-foreground mb-3">
              Reuse Existing Media
            </h3>
            {loading ? (
              <div className="py-8 text-center text-sm text-wisteria-foreground/50">
                Loading...
              </div>
            ) : allAttachments.length === 0 ? (
              <div className="rounded-lg border border-dashed border-wisteria-border bg-wisteria-accent/5 py-8 text-center text-sm text-wisteria-foreground/50">
                No existing media found
              </div>
            ) : (
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3">
                {allAttachments.map((attachment) => (
                  <ExistingMediaItem
                    key={attachment.id}
                    attachment={attachment}
                    selected={existingAttachments.includes(attachment.id)}
                    onToggle={() => handleToggleExisting(attachment.id)}
                  />
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-wisteria-border pt-4">
          <div className="text-sm text-wisteria-foreground/60">
            {totalSelected} of {MAX_FILES} files selected
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => onOpenChange(false)}
              disabled={totalSelected === 0}
            >
              Done
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
