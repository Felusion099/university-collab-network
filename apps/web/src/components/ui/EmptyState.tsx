import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * EmptyState — ARCHITECTURE.md §5. Every data-driven page needs one
 * (spec §40: loading/empty/error states are an acceptance criterion, not
 * optional polish) — this is the shared shape so each page doesn't hand-roll
 * its own "nothing here" message.
 */
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
  action?: ReactNode;
  className?: string;
}): JSX.Element {
  return (
    <div
      role="status"
      className={cn(
        "flex flex-col items-center gap-3 rounded-lg border border-dashed border-border px-6 py-14 text-center",
        className,
      )}
    >
      <Icon className="h-8 w-8 text-text-muted" aria-hidden="true" />
      <div className="space-y-1">
        <p className="font-medium text-text-primary">{title}</p>
        {description && <p className="max-w-sm text-sm text-text-secondary">{description}</p>}
      </div>
      {action}
    </div>
  );
}
