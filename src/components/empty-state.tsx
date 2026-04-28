import { type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className,
}: {
  icon: LucideIcon;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "rounded-lg border border-dashed border-border px-6 py-16 text-center",
        className,
      )}
    >
      <div className="mx-auto flex size-9 items-center justify-center rounded-md bg-secondary text-muted-foreground">
        <Icon className="size-4" strokeWidth={1.75} />
      </div>
      <h3 className="text-base font-medium mt-4">{title}</h3>
      {description && (
        <p className="text-muted-foreground text-sm mt-1 max-w-sm mx-auto">
          {description}
        </p>
      )}
      {action && <div className="mt-5 flex justify-center">{action}</div>}
    </div>
  );
}
