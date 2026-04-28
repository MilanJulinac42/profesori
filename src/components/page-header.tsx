import { cn } from "@/lib/utils";

export function PageHeader({
  title,
  description,
  actions,
  className,
}: {
  title: string;
  description?: string;
  actions?: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between border-b border-border pb-6",
        className,
      )}
    >
      <div className="space-y-1.5 max-w-2xl">
        <h1 className="font-heading text-3xl sm:text-4xl leading-tight">
          {title}
        </h1>
        {description && (
          <p className="text-muted-foreground text-base">{description}</p>
        )}
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </div>
  );
}
