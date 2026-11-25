"use client";

import { useRef, useState } from "react";
import { ImagePlus, Loader2, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const MAX_BYTES = { avatars: 2 * 1024 * 1024, "activity-covers": 5 * 1024 * 1024 } as const;
const TYPES = ["image/jpeg", "image/png", "image/webp"];

/**
 * Uploads an image to Supabase Storage under `<bucket>/<userId>/...` and
 * stores the resulting public URL in a hidden input named `name`.
 */
export function ImageUpload({
  bucket,
  userId,
  name,
  defaultUrl,
  variant = "cover",
  label,
}: {
  bucket: "avatars" | "activity-covers";
  userId: string;
  name: string;
  defaultUrl?: string | null;
  variant?: "avatar" | "cover";
  label: string;
}) {
  const [url, setUrl] = useState<string | null>(defaultUrl ?? null);
  const [uploading, setUploading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  async function onFile(file: File) {
    if (!TYPES.includes(file.type)) return toast.error("Please choose a JPG, PNG or WebP image.");
    if (file.size > MAX_BYTES[bucket]) return toast.error(`Image must be under ${MAX_BYTES[bucket] / 1024 / 1024} MB.`);
    setUploading(true);
    try {
      const supabase = createClient();
      const ext = file.type.split("/")[1].replace("jpeg", "jpg");
      const path = `${userId}/${crypto.randomUUID()}.${ext}`;
      const { error } = await supabase.storage.from(bucket).upload(path, file, { contentType: file.type, upsert: false });
      if (error) throw error;
      const { data } = supabase.storage.from(bucket).getPublicUrl(path);
      setUrl(data.publicUrl);
      toast.success("Photo uploaded");
    } catch {
      toast.error("Upload failed. Please try again.");
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  return (
    <div className={cn("flex items-center gap-4", variant === "cover" && "flex-col items-stretch")}>
      <input type="hidden" name={name} value={url ?? ""} />
      <input
        ref={inputRef}
        type="file"
        accept={TYPES.join(",")}
        className="sr-only"
        id={`${name}-file`}
        onChange={(e) => e.target.files?.[0] && onFile(e.target.files[0])}
      />
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={uploading}
        aria-label={label}
        className={cn(
          "relative flex shrink-0 items-center justify-center overflow-hidden border-2 border-dashed border-border bg-secondary text-muted-foreground transition-colors hover:border-primary hover:text-primary cursor-pointer",
          variant === "avatar" ? "size-20 rounded-full" : "h-40 w-full rounded-2xl",
        )}
      >
        {url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={url} alt="" className="absolute inset-0 size-full object-cover" />
        ) : uploading ? null : (
          <span className="flex flex-col items-center gap-1 text-xs font-semibold">
            <ImagePlus className="size-6" />
            {variant === "cover" && "Add a cover photo"}
          </span>
        )}
        {uploading && (
          <span className="absolute inset-0 flex items-center justify-center bg-card/70">
            <Loader2 className="size-6 animate-spin text-primary" />
          </span>
        )}
      </button>
      <div className="flex gap-2">
        <Button type="button" variant="outline" size="sm" onClick={() => inputRef.current?.click()} disabled={uploading}>
          {url ? "Change photo" : "Upload photo"}
        </Button>
        {url && (
          <Button type="button" variant="ghost" size="sm" onClick={() => setUrl(null)} disabled={uploading}>
            <Trash2 /> Remove
          </Button>
        )}
      </div>
    </div>
  );
}
