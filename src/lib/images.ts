/**
 * Browser-side image resize helpers. Phone cameras emit 5-12 MB shots even
 * for a single homework page; uploading raw kills mobile bandwidth and bloats
 * Supabase storage for no visible benefit. These helpers downscale via a
 * canvas before upload.
 *
 * Notes:
 *   - HEIC images can't be decoded by canvas in all browsers — we pass them
 *     through unchanged and let the server handle it (Supabase storage will
 *     accept them, Next/Image can serve via the storage transform).
 *   - If the resize would be a no-op (image already small + file already
 *     <1 MB), the original File is returned to preserve quality + filename.
 */

export type ResizeOptions = {
  /** Max width/height in CSS pixels. Aspect ratio preserved. */
  maxDimension: number;
  /** JPEG quality 0..1. */
  quality?: number;
  /** Skip resize if file is already smaller than this many bytes. */
  passThroughBelowBytes?: number;
};

const DEFAULT_QUALITY = 0.85;
const DEFAULT_PASS_THROUGH = 1 * 1024 * 1024; // 1 MB

/**
 * Resize an image file in the browser. Returns either a new JPEG File or
 * the original if no resize was needed (or if decoding failed).
 */
export async function resizeImage(
  file: File,
  options: ResizeOptions,
): Promise<File> {
  const quality = options.quality ?? DEFAULT_QUALITY;
  const passThrough = options.passThroughBelowBytes ?? DEFAULT_PASS_THROUGH;

  // HEIC: most browsers can't draw it to canvas.
  if (file.type === "image/heic" || file.type === "image/heif") return file;
  if (!file.type.startsWith("image/")) return file;

  let img: HTMLImageElement;
  try {
    img = await loadImage(file);
  } catch {
    return file;
  }

  const longest = Math.max(img.width, img.height);
  const ratio = Math.min(1, options.maxDimension / longest);
  if (ratio === 1 && file.size < passThrough) return file;

  const canvas = document.createElement("canvas");
  canvas.width = Math.round(img.width * ratio);
  canvas.height = Math.round(img.height * ratio);
  const ctx = canvas.getContext("2d");
  if (!ctx) return file;
  ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

  const blob = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob(resolve, "image/jpeg", quality),
  );
  if (!blob) return file;

  // If the "resized" JPEG ends up larger than the original (rare — happens
  // when original is a tightly packed PNG of simple graphics), keep original.
  if (blob.size >= file.size) return file;

  const newName = file.name.replace(/\.[^.]+$/, "") + ".jpg";
  return new File([blob], newName, { type: "image/jpeg" });
}

function loadImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new window.Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Slika ne može da se učita."));
    };
    img.src = url;
  });
}

/* Sensible presets used across the app */
export const AVATAR_RESIZE: ResizeOptions = {
  maxDimension: 512,
  quality: 0.88,
};

export const GALLERY_RESIZE: ResizeOptions = {
  maxDimension: 1600,
  quality: 0.85,
};

export const HOMEWORK_RESIZE: ResizeOptions = {
  maxDimension: 1600,
  quality: 0.85,
};
