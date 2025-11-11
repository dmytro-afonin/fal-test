import { ImageIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface ImagePlaceholderProps {
  className?: string;
  label?: string;
}

export function ImagePlaceholder({
  className,
  label = "No image",
}: ImagePlaceholderProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center bg-muted text-muted-foreground",
        className,
      )}
    >
      <ImageIcon className="w-12 h-12 mb-2 opacity-50" />
      {label && <p className="text-sm opacity-75">{label}</p>}
    </div>
  );
}
