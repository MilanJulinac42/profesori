/**
 * Visually hidden link that becomes visible on keyboard focus and jumps the
 * cursor past the sidebar/topbar to the main content. Standard a11y pattern
 * for keyboard-only users (and screen reader users who appreciate not
 * navigating the nav on every page).
 */
export function SkipLink({ targetId = "main-content" }: { targetId?: string }) {
  return (
    <a
      href={`#${targetId}`}
      className="
        sr-only focus:not-sr-only
        focus:fixed focus:top-2 focus:left-2 focus:z-[100]
        focus:inline-flex focus:items-center focus:gap-1.5
        focus:rounded-lg focus:bg-foreground focus:text-background
        focus:px-3 focus:py-2 focus:text-sm focus:font-semibold
        focus:shadow-xl focus:outline-none focus:ring-2 focus:ring-brand
      "
    >
      Preskoči na sadržaj
    </a>
  );
}
