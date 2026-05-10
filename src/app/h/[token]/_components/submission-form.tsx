"use client";

import { useState, useTransition, useRef } from "react";
import Image from "next/image";
import { Check, Loader2, Camera, X } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  submitHomeworkAction,
  uploadHomeworkImageAction,
} from "@/lib/homework/actions";

type UploadedImage = {
  localPreview: string; // blob URL za pre upload-a
  remoteUrl: string | null; // public URL nakon uploada
  uploading: boolean;
  error: string | null;
};

const MAX_IMAGES = 5;
const RESIZE_MAX_DIM = 1600;
const RESIZE_QUALITY = 0.85;

/**
 * Resizing slike u browseru pre uploada — ručno snimljene fotografije
 * sveske su često 5-12 MB; resize na 1600px dim. + JPEG 0.85 svodi
 * na ~400-800 KB bez vidljivog gubitka kvaliteta.
 */
async function resizeImage(file: File): Promise<File> {
  // HEIC ne radi u canvas-u svuda — pošalji original.
  if (file.type === "image/heic") return file;

  const img = await new Promise<HTMLImageElement>((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const i = new window.Image();
    i.onload = () => {
      URL.revokeObjectURL(url);
      resolve(i);
    };
    i.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Slika ne može da se učita."));
    };
    i.src = url;
  });

  const ratio = Math.min(1, RESIZE_MAX_DIM / Math.max(img.width, img.height));
  if (ratio === 1 && file.size < 1 * 1024 * 1024) return file;

  const canvas = document.createElement("canvas");
  canvas.width = Math.round(img.width * ratio);
  canvas.height = Math.round(img.height * ratio);
  const ctx = canvas.getContext("2d");
  if (!ctx) return file;
  ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

  const blob = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob(resolve, "image/jpeg", RESIZE_QUALITY),
  );
  if (!blob) return file;

  return new File([blob], file.name.replace(/\.[^.]+$/, "") + ".jpg", {
    type: "image/jpeg",
  });
}

export function SubmissionForm({ publicToken }: { publicToken: string }) {
  const [note, setNote] = useState("");
  const [images, setImages] = useState<UploadedImage[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const uploadingCount = images.filter((i) => i.uploading).length;

  async function handleFiles(files: FileList | null) {
    if (!files || files.length === 0) return;
    setError(null);

    const remaining = MAX_IMAGES - images.length;
    const toAdd = Array.from(files).slice(0, remaining);

    if (files.length > remaining) {
      setError(`Možeš dodati maksimalno ${MAX_IMAGES} slika.`);
    }

    for (const rawFile of toAdd) {
      const localPreview = URL.createObjectURL(rawFile);
      const idx = images.length + toAdd.indexOf(rawFile);
      setImages((prev) => [
        ...prev,
        { localPreview, remoteUrl: null, uploading: true, error: null },
      ]);

      try {
        const resized = await resizeImage(rawFile);
        const fd = new FormData();
        fd.set("token", publicToken);
        fd.set("file", resized);
        const res = await uploadHomeworkImageAction(fd);

        setImages((prev) =>
          prev.map((img, i) =>
            i === idx
              ? {
                  ...img,
                  uploading: false,
                  remoteUrl: res.ok ? res.url : null,
                  error: res.ok ? null : res.error,
                }
              : img,
          ),
        );
      } catch (err) {
        setImages((prev) =>
          prev.map((img, i) =>
            i === idx
              ? {
                  ...img,
                  uploading: false,
                  error: err instanceof Error ? err.message : "Greška",
                }
              : img,
          ),
        );
      }
    }

    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  function removeImage(index: number) {
    setImages((prev) => {
      const item = prev[index];
      if (item) URL.revokeObjectURL(item.localPreview);
      return prev.filter((_, i) => i !== index);
    });
  }

  function submit() {
    setError(null);
    const successfulUrls = images
      .map((i) => i.remoteUrl)
      .filter((u): u is string => !!u);

    startTransition(async () => {
      const res = await submitHomeworkAction({
        publicToken,
        submissionNote: note,
        imageUrls: successfulUrls,
      });
      if (!res.ok) {
        setError(res.error);
        return;
      }
    });
  }

  return (
    <div className="card-elevated card-glow rounded-2xl p-5 space-y-4">
      <div>
        <p className="text-sm font-semibold text-foreground">
          Kad uradiš domaći, klikni „Uradio sam".
        </p>
        <p className="text-xs text-muted-foreground mt-1">
          Možeš poslati slike sveske i ostaviti komentar.
        </p>
      </div>

      {/* Image upload */}
      <div className="space-y-2">
        <Label className="text-xs">Slike (opciono, do {MAX_IMAGES})</Label>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/heic"
          multiple
          capture="environment"
          onChange={(e) => handleFiles(e.target.files)}
          className="hidden"
          id="hw-files"
        />

        {images.length > 0 && (
          <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
            {images.map((img, i) => (
              <div
                key={i}
                className="relative aspect-square rounded-lg overflow-hidden border border-border bg-secondary"
              >
                <Image
                  src={img.localPreview}
                  alt={`slika ${i + 1}`}
                  fill
                  unoptimized
                  className="object-cover"
                />
                {img.uploading && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                    <Loader2
                      className="size-5 text-white animate-spin"
                      strokeWidth={2}
                    />
                  </div>
                )}
                {img.error && (
                  <div className="absolute inset-0 flex items-center justify-center bg-destructive/80 px-1 text-center">
                    <p className="text-[10px] text-white">{img.error}</p>
                  </div>
                )}
                {!img.uploading && img.remoteUrl && (
                  <div className="absolute top-1 right-1 bg-emerald-500 rounded-full p-0.5">
                    <Check className="size-2.5 text-white" strokeWidth={3} />
                  </div>
                )}
                <button
                  type="button"
                  onClick={() => removeImage(i)}
                  className="absolute top-1 left-1 bg-black/60 hover:bg-black/80 rounded-full p-1"
                  aria-label="Ukloni sliku"
                  disabled={pending}
                >
                  <X className="size-3 text-white" strokeWidth={2.5} />
                </button>
              </div>
            ))}
          </div>
        )}

        {images.length < MAX_IMAGES && (
          <label
            htmlFor="hw-files"
            className="inline-flex items-center gap-2 cursor-pointer rounded-lg border border-dashed border-border bg-secondary/40 hover:bg-secondary hover:border-brand/40 text-sm font-medium h-10 px-4 transition-colors"
          >
            <Camera className="size-4" strokeWidth={1.75} />
            {images.length === 0
              ? "Dodaj sliku ili snimi"
              : `Dodaj još (${MAX_IMAGES - images.length})`}
          </label>
        )}
      </div>

      {/* Komentar */}
      <div className="space-y-1.5">
        <Label htmlFor="note" className="text-xs">
          Komentar (opciono)
        </Label>
        <Textarea
          id="note"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder='npr. "Uradio sam zadatke 1-3, 4. mi nije jasan."'
          rows={3}
          className="text-sm"
          disabled={pending}
        />
      </div>

      {error && (
        <div
          className="rounded-lg border border-rose-500/30 bg-rose-500/5 px-3 py-2 text-sm text-rose-500 dark:text-rose-400 inline-flex items-start gap-2 w-full"
          role="alert"
        >
          {error}
        </div>
      )}

      <button
        type="button"
        onClick={submit}
        disabled={pending || uploadingCount > 0}
        className="w-full inline-flex items-center justify-center gap-1.5 h-11 px-4 rounded-lg bg-brand text-brand-foreground text-sm font-semibold hover:opacity-90 transition-opacity glow-brand disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none"
      >
        {pending ? (
          <>
            <Loader2 className="size-4 animate-spin" strokeWidth={2} />
            Predavanje…
          </>
        ) : uploadingCount > 0 ? (
          <>
            <Loader2 className="size-4 animate-spin" strokeWidth={2} />
            Učitavanje slika…
          </>
        ) : (
          <>
            <Check className="size-4" strokeWidth={2.25} />
            Uradio sam
          </>
        )}
      </button>
    </div>
  );
}
