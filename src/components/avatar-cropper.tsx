"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Check, RotateCcw, Loader2, X } from "lucide-react";
import { Button } from "@/components/ui/button";

const OUTPUT_SIZE = 512; // px — matches the AVATAR_RESIZE budget
const VIEWPORT_SIZE = 280; // px — UI viewport; image is fitted into this
const MIN_ZOOM = 1;
const MAX_ZOOM = 3;

/**
 * Modal cropper for circular avatars. Square crop region in a circular mask;
 * user drags to pan, slider to zoom. On confirm, the visible square is
 * drawn to a 512×512 canvas and returned as a JPEG File.
 */
export function AvatarCropperDialog({
  file,
  onConfirm,
  onCancel,
}: {
  file: File;
  onConfirm: (cropped: File) => void | Promise<void>;
  onCancel: () => void;
}) {
  const [imgUrl, setImgUrl] = useState<string | null>(null);
  const [naturalSize, setNaturalSize] = useState<{ w: number; h: number } | null>(
    null,
  );
  // Image-space coordinates: zoom + offset relative to viewport center.
  const [zoom, setZoom] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [saving, setSaving] = useState(false);
  const dragState = useRef<{ x: number; y: number; ox: number; oy: number } | null>(
    null,
  );

  // Load the image into memory.
  useEffect(() => {
    const url = URL.createObjectURL(file);
    setImgUrl(url);
    const img = new window.Image();
    img.onload = () => {
      setNaturalSize({ w: img.naturalWidth, h: img.naturalHeight });
      setZoom(1);
      setOffset({ x: 0, y: 0 });
    };
    img.src = url;
    return () => {
      URL.revokeObjectURL(url);
    };
  }, [file]);

  // Esc to cancel.
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onCancel();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onCancel]);

  // Base scale: "cover" the viewport at zoom=1.
  const baseScale = naturalSize
    ? Math.max(VIEWPORT_SIZE / naturalSize.w, VIEWPORT_SIZE / naturalSize.h)
    : 1;
  const effectiveScale = baseScale * zoom;
  const drawnW = naturalSize ? naturalSize.w * effectiveScale : 0;
  const drawnH = naturalSize ? naturalSize.h * effectiveScale : 0;

  // Clamp offset so the image never reveals empty space inside the viewport.
  const clampOffset = useCallback(
    (next: { x: number; y: number }) => {
      const maxX = Math.max(0, (drawnW - VIEWPORT_SIZE) / 2);
      const maxY = Math.max(0, (drawnH - VIEWPORT_SIZE) / 2);
      return {
        x: Math.max(-maxX, Math.min(maxX, next.x)),
        y: Math.max(-maxY, Math.min(maxY, next.y)),
      };
    },
    [drawnW, drawnH],
  );

  // Pointer drag — uses Pointer Events so mouse + touch share one code path.
  function onPointerDown(e: React.PointerEvent<HTMLDivElement>) {
    (e.target as Element).setPointerCapture?.(e.pointerId);
    dragState.current = {
      x: e.clientX,
      y: e.clientY,
      ox: offset.x,
      oy: offset.y,
    };
  }
  function onPointerMove(e: React.PointerEvent<HTMLDivElement>) {
    const d = dragState.current;
    if (!d) return;
    setOffset(
      clampOffset({
        x: d.ox + (e.clientX - d.x),
        y: d.oy + (e.clientY - d.y),
      }),
    );
  }
  function onPointerUp(e: React.PointerEvent<HTMLDivElement>) {
    (e.target as Element).releasePointerCapture?.(e.pointerId);
    dragState.current = null;
  }

  // Re-clamp offset when zoom changes (otherwise zooming out can leave gaps).
  useEffect(() => {
    setOffset((prev) => clampOffset(prev));
  }, [zoom, clampOffset]);

  async function confirm() {
    if (!naturalSize) return;
    setSaving(true);
    try {
      // The viewport's top-left in image-space coordinates.
      const imgCenterX = naturalSize.w / 2;
      const imgCenterY = naturalSize.h / 2;
      const viewportHalf = VIEWPORT_SIZE / 2;
      const offsetInImageSpaceX = offset.x / effectiveScale;
      const offsetInImageSpaceY = offset.y / effectiveScale;
      const cropSizeInImage = VIEWPORT_SIZE / effectiveScale;

      const sx = imgCenterX - viewportHalf / effectiveScale - offsetInImageSpaceX;
      const sy = imgCenterY - viewportHalf / effectiveScale - offsetInImageSpaceY;

      const canvas = document.createElement("canvas");
      canvas.width = OUTPUT_SIZE;
      canvas.height = OUTPUT_SIZE;
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        setSaving(false);
        return;
      }

      const img = new window.Image();
      await new Promise<void>((resolve, reject) => {
        img.onload = () => resolve();
        img.onerror = () => reject(new Error("Image load failed."));
        img.src = imgUrl!;
      });

      ctx.imageSmoothingQuality = "high";
      ctx.drawImage(
        img,
        sx,
        sy,
        cropSizeInImage,
        cropSizeInImage,
        0,
        0,
        OUTPUT_SIZE,
        OUTPUT_SIZE,
      );

      const blob = await new Promise<Blob | null>((r) =>
        canvas.toBlob(r, "image/jpeg", 0.9),
      );
      if (!blob) {
        setSaving(false);
        return;
      }
      const cropped = new File(
        [blob],
        file.name.replace(/\.[^.]+$/, "") + ".jpg",
        { type: "image/jpeg" },
      );
      await onConfirm(cropped);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div
      role="dialog"
      aria-label="Iseci fotografiju"
      className="fixed inset-0 z-[70] print:hidden flex items-center justify-center p-4"
    >
      <div
        aria-hidden
        onClick={onCancel}
        className="absolute inset-0 bg-background/70 backdrop-blur-sm animate-palette-fade"
      />
      <div className="relative z-10 w-full max-w-sm rounded-2xl border border-border bg-card shadow-2xl overflow-hidden animate-palette-pop">
        <div className="flex items-center justify-between px-4 py-3 border-b border-border">
          <p className="text-sm font-medium">Iseci fotografiju</p>
          <button
            type="button"
            onClick={onCancel}
            aria-label="Zatvori"
            className="inline-flex items-center justify-center size-7 rounded-md text-muted-foreground hover:text-foreground hover:bg-secondary"
          >
            <X className="size-4" strokeWidth={2} />
          </button>
        </div>

        <div className="p-4 flex flex-col items-center gap-4">
          <div
            className="relative bg-background overflow-hidden touch-none"
            style={{ width: VIEWPORT_SIZE, height: VIEWPORT_SIZE }}
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
            onPointerCancel={onPointerUp}
          >
            {imgUrl && naturalSize && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={imgUrl}
                alt=""
                draggable={false}
                style={{
                  position: "absolute",
                  left: "50%",
                  top: "50%",
                  width: drawnW,
                  height: drawnH,
                  transform: `translate(calc(-50% + ${offset.x}px), calc(-50% + ${offset.y}px))`,
                  userSelect: "none",
                  pointerEvents: "none",
                  maxWidth: "none",
                }}
              />
            )}
            {/* Circular mask overlay */}
            <div
              aria-hidden
              className="absolute inset-0 pointer-events-none"
              style={{
                background:
                  "radial-gradient(circle, transparent 50%, oklch(0 0 0 / 0.55) 50.5%)",
              }}
            />
            <div
              aria-hidden
              className="absolute inset-0 rounded-full pointer-events-none border-2 border-background/80"
              style={{ margin: 1 }}
            />
          </div>

          <div className="w-full space-y-1">
            <p className="text-[11px] uppercase tracking-[0.14em] font-semibold text-muted-foreground">
              Zum
            </p>
            <div className="flex items-center gap-3">
              <input
                type="range"
                min={MIN_ZOOM}
                max={MAX_ZOOM}
                step={0.01}
                value={zoom}
                onChange={(e) => setZoom(Number(e.target.value))}
                className="flex-1 accent-foreground"
              />
              <button
                type="button"
                onClick={() => {
                  setZoom(1);
                  setOffset({ x: 0, y: 0 });
                }}
                className="inline-flex items-center justify-center size-7 rounded-md text-muted-foreground hover:text-foreground hover:bg-secondary"
                aria-label="Resetuj"
                title="Resetuj"
              >
                <RotateCcw className="size-3.5" strokeWidth={1.75} />
              </button>
            </div>
          </div>
        </div>

        <div className="border-t border-border px-4 py-3 flex items-center justify-end gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={saving}
          >
            Otkaži
          </Button>
          <Button type="button" onClick={confirm} disabled={saving}>
            {saving ? (
              <>
                <Loader2 className="size-3.5 animate-spin" strokeWidth={2} />
                Snimam…
              </>
            ) : (
              <>
                <Check className="size-3.5" strokeWidth={2.25} />
                Sačuvaj
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
