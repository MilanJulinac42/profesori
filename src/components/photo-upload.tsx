"use client";

import { useRef, useState } from "react";
import { Upload, X, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const MAX_BYTES = 5 * 1024 * 1024;
const ALLOWED = ["image/jpeg", "image/png", "image/webp", "image/jpg"];

export function PhotoUpload({
  orgId,
  value,
  onChange,
  fallbackName,
}: {
  orgId: string;
  value: string;
  onChange: (url: string) => void;
  fallbackName: string;
}) {
  const [uploading, setUploading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleFile(file: File) {
    if (!ALLOWED.includes(file.type)) {
      toast.error("Format nije podržan", {
        description: "Dozvoljeni: JPG, PNG, WebP.",
      });
      return;
    }
    if (file.size > MAX_BYTES) {
      toast.error("Slika je prevelika", {
        description: "Maksimalno 5 MB.",
      });
      return;
    }

    setUploading(true);
    try {
      const supabase = createClient();
      const ext = file.name.split(".").pop()?.toLowerCase() ?? "jpg";
      const path = `${orgId}/avatar-${Date.now()}.${ext}`;

      const { error } = await supabase.storage
        .from("avatars")
        .upload(path, file, { contentType: file.type, upsert: false });

      if (error) throw error;

      const {
        data: { publicUrl },
      } = supabase.storage.from("avatars").getPublicUrl(path);

      onChange(publicUrl);
      toast.success("Slika otpremljena");
    } catch (err) {
      toast.error("Greška pri otpremanju", {
        description: (err as Error).message,
      });
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  function clear() {
    onChange("");
  }

  const initials = fallbackName
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? "")
    .join("");

  return (
    <div className="flex items-center gap-4">
      {/* Preview */}
      <div className="relative shrink-0">
        {value ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={value}
            alt={fallbackName}
            className="size-16 rounded-full object-cover border border-border"
          />
        ) : (
          <span className="flex size-16 items-center justify-center rounded-full bg-secondary text-base font-medium text-muted-foreground border border-border">
            {initials || "?"}
          </span>
        )}
        {uploading && (
          <span className="absolute inset-0 flex items-center justify-center rounded-full bg-background/70 backdrop-blur-sm">
            <Loader2 className="size-5 animate-spin" strokeWidth={1.75} />
          </span>
        )}
      </div>

      {/* Buttons */}
      <div className="flex flex-col items-start gap-1.5">
        <input
          ref={inputRef}
          type="file"
          accept={ALLOWED.join(",")}
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) handleFile(file);
          }}
        />
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => inputRef.current?.click()}
            disabled={uploading}
          >
            <Upload className="size-3.5" strokeWidth={1.75} />
            {value ? "Promeni sliku" : "Otpremi sliku"}
          </Button>
          {value && !uploading && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={clear}
              className="text-muted-foreground"
            >
              <X className="size-3.5" strokeWidth={1.75} />
              Ukloni
            </Button>
          )}
        </div>
        <p className={cn("text-[11px] text-muted-foreground")}>
          JPG, PNG, WebP · do 5 MB
        </p>
      </div>
    </div>
  );
}
