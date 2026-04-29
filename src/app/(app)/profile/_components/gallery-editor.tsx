"use client";

import { useRef, useState } from "react";
import { Plus, Upload, X, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { createClient } from "@/lib/supabase/client";
import type { GalleryImage } from "@/lib/public-profile/types";

const MAX_BYTES = 5 * 1024 * 1024;
const ALLOWED = ["image/jpeg", "image/png", "image/webp", "image/jpg"];

export function GalleryEditor({
  orgId,
  value,
  onChange,
}: {
  orgId: string;
  value: GalleryImage[];
  onChange: (next: GalleryImage[]) => void;
}) {
  const [uploading, setUploading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleFiles(files: FileList) {
    setUploading(true);
    const supabase = createClient();
    const newImages: GalleryImage[] = [];

    for (const file of Array.from(files)) {
      if (!ALLOWED.includes(file.type)) {
        toast.error(`${file.name}: format nije podržan`);
        continue;
      }
      if (file.size > MAX_BYTES) {
        toast.error(`${file.name}: prevelika (max 5 MB)`);
        continue;
      }
      const ext = file.name.split(".").pop()?.toLowerCase() ?? "jpg";
      const path = `${orgId}/gallery-${Date.now()}-${Math.random()
        .toString(36)
        .slice(2, 7)}.${ext}`;
      const { error } = await supabase.storage
        .from("avatars")
        .upload(path, file, { contentType: file.type, upsert: false });
      if (error) {
        toast.error(`${file.name}: ${error.message}`);
        continue;
      }
      const {
        data: { publicUrl },
      } = supabase.storage.from("avatars").getPublicUrl(path);
      newImages.push({ url: publicUrl, caption: null });
    }

    if (newImages.length > 0) {
      onChange([...value, ...newImages]);
      toast.success(
        `${newImages.length} ${newImages.length === 1 ? "slika otpremljena" : "slika otpremljeno"}`,
      );
    }
    setUploading(false);
    if (inputRef.current) inputRef.current.value = "";
  }

  function updateCaption(idx: number, caption: string) {
    onChange(value.map((img, i) => (i === idx ? { ...img, caption } : img)));
  }
  function remove(idx: number) {
    onChange(value.filter((_, i) => i !== idx));
  }
  function move(idx: number, dir: -1 | 1) {
    const next = idx + dir;
    if (next < 0 || next >= value.length) return;
    const list = [...value];
    [list[idx], list[next]] = [list[next], list[idx]];
    onChange(list);
  }

  return (
    <div className="space-y-3">
      {value.length === 0 && (
        <p className="text-sm text-muted-foreground">
          Otpremi slike koje pokazuju atmosferu, materijale ili tebe dok
          predaješ.
        </p>
      )}

      {value.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {value.map((img, idx) => (
            <div
              key={idx}
              className="rounded-lg border border-border bg-card/50 p-2 space-y-2"
            >
              <div className="relative">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={img.url}
                  alt={img.caption ?? `Slika ${idx + 1}`}
                  className="w-full aspect-square object-cover rounded-md"
                />
                <button
                  type="button"
                  onClick={() => remove(idx)}
                  className="absolute top-1 right-1 size-6 rounded-full bg-foreground/80 text-background flex items-center justify-center hover:bg-destructive transition-colors"
                  aria-label="Ukloni"
                >
                  <X className="size-3.5" strokeWidth={2} />
                </button>
                <div className="absolute bottom-1 left-1 right-1 flex justify-between">
                  <button
                    type="button"
                    onClick={() => move(idx, -1)}
                    disabled={idx === 0}
                    className="size-6 rounded-full bg-foreground/70 text-background text-xs disabled:opacity-30"
                    aria-label="Levo"
                  >
                    ‹
                  </button>
                  <button
                    type="button"
                    onClick={() => move(idx, 1)}
                    disabled={idx === value.length - 1}
                    className="size-6 rounded-full bg-foreground/70 text-background text-xs disabled:opacity-30"
                    aria-label="Desno"
                  >
                    ›
                  </button>
                </div>
              </div>
              <Input
                value={img.caption ?? ""}
                onChange={(e) => updateCaption(idx, e.target.value)}
                placeholder="Opis (opciono)"
                className="h-8 text-xs"
              />
            </div>
          ))}
        </div>
      )}

      <input
        ref={inputRef}
        type="file"
        accept={ALLOWED.join(",")}
        multiple
        className="hidden"
        onChange={(e) => {
          if (e.target.files && e.target.files.length > 0) {
            handleFiles(e.target.files);
          }
        }}
      />
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => inputRef.current?.click()}
        disabled={uploading}
      >
        {uploading ? (
          <>
            <Loader2 className="size-3.5 animate-spin" strokeWidth={2} />
            Otpremanje...
          </>
        ) : (
          <>
            <Upload className="size-3.5" strokeWidth={2} />
            Otpremi slike
          </>
        )}
      </Button>

      <input
        type="hidden"
        name="gallery_images"
        value={JSON.stringify(value.filter((i) => i.url.trim()))}
      />
    </div>
  );
}
