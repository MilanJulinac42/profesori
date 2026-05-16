import Link from "next/link";
import { Eye, X, Pencil } from "lucide-react";

/**
 * Sticky preview banner shown only to the owner viewing `/p/[slug]?preview=1`.
 * Makes it obvious the page is in preview (especially when not yet published)
 * and offers a one-click back to the editor.
 */
export function PreviewBanner({ published }: { published: boolean }) {
  return (
    <div className="sticky top-0 z-50 bg-foreground text-background print:hidden">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-2.5 flex items-center gap-3 text-sm">
        <Eye className="size-4 shrink-0" strokeWidth={2} />
        <span className="flex-1 min-w-0 truncate">
          <span className="font-semibold">Preview</span>
          <span className="opacity-70 mx-2">·</span>
          <span className="opacity-90">
            {published
              ? "Ovo je tvoja objavljena stranica."
              : "Stranica još nije objavljena — vidiš je samo ti."}
          </span>
        </span>
        <Link
          href="/profile"
          className="hidden sm:inline-flex items-center gap-1.5 h-7 px-2.5 rounded-md bg-background/15 hover:bg-background/25 text-xs font-medium transition-colors"
        >
          <Pencil className="size-3" strokeWidth={2} />
          Nazad u editor
        </Link>
        <Link
          href="/profile"
          aria-label="Zatvori preview"
          className="inline-flex items-center justify-center size-7 rounded-md bg-background/15 hover:bg-background/25 transition-colors"
        >
          <X className="size-3.5" strokeWidth={2} />
        </Link>
      </div>
    </div>
  );
}
