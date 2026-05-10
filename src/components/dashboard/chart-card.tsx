import { cn } from "@/lib/utils";

type Props = {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  /** content area min height (in px) */
  contentMinHeight?: number;
};

export function ChartCard({
  title,
  subtitle,
  action,
  children,
  className,
  contentMinHeight,
}: Props) {
  return (
    <section
      className={cn(
        "card-elevated card-glow rounded-2xl flex flex-col overflow-hidden",
        className,
      )}
    >
      <header className="flex items-center justify-between gap-3 px-5 pt-5 pb-3">
        <div className="min-w-0">
          <h3 className="text-[15px] font-semibold text-foreground tracking-tight">
            {title}
          </h3>
          {subtitle && (
            <p className="text-xs text-muted-foreground mt-0.5">{subtitle}</p>
          )}
        </div>
        {action && <div className="shrink-0">{action}</div>}
      </header>
      <div
        className="flex-1 px-5 pb-5"
        style={
          contentMinHeight ? { minHeight: contentMinHeight } : undefined
        }
      >
        {children}
      </div>
    </section>
  );
}
