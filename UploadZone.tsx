import { useCallback, useRef, useState } from "react";
import { FileText, ImageIcon, UploadCloud } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Props {
  onFile: (file: File) => void;
  disabled?: boolean;
}

const ACCEPT = ".pdf,image/png,image/jpeg,image/webp,image/bmp,image/tiff";

export function UploadZone({ onFile, disabled }: Props) {
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragging(false);
      const file = e.dataTransfer.files?.[0];
      if (file) onFile(file);
    },
    [onFile],
  );

  return (
    <div
      onDragOver={(e) => {
        e.preventDefault();
        if (!disabled) setDragging(true);
      }}
      onDragLeave={() => setDragging(false)}
      onDrop={handleDrop}
      className={`panel flex flex-col items-center gap-4 px-6 py-12 text-center transition-all ${
        dragging ? "border-accent bg-accent/10 scale-[1.01]" : ""
      } ${disabled ? "opacity-60" : ""}`}
      aria-busy={disabled}
    >
      <div className="rounded-2xl border border-border bg-secondary p-4">
        <UploadCloud className="size-7 text-accent-foreground" aria-hidden />
      </div>
      <div>
        <h2 className="text-xl font-semibold">Drop a post, PDF or screenshot</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          PDFs are parsed with formatting preserved. Images run through in-browser OCR.
        </p>
      </div>
      <div className="flex flex-wrap items-center justify-center gap-3">
        <Button onClick={() => inputRef.current?.click()} disabled={disabled} size="lg">
          Choose file
        </Button>
        <span className="flex items-center gap-3 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <FileText className="size-3.5" aria-hidden /> PDF
          </span>
          <span className="flex items-center gap-1">
            <ImageIcon className="size-3.5" aria-hidden /> PNG · JPG · WEBP
          </span>
        </span>
      </div>
      <input
        ref={inputRef}
        type="file"
        accept={ACCEPT}
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) onFile(file);
          e.target.value = "";
        }}
      />
    </div>
  );
}
