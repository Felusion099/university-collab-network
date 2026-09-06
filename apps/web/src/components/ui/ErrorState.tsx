import { AlertTriangle, RotateCw } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * ErrorState — ARCHITECTURE.md §5. Paired with EmptyState/Skeleton to
 * satisfy spec §40's loading/empty/error acceptance criterion. Takes an
 * optional retry so pages backed by TanStack Query can wire `refetch`
 * straight in without each page inventing its own retry button.
 */
export function ErrorState({
  title = "Something went wrong",
  description,
  onRetry,
  className,
}: {
  title?: string;
  description?: string;
  onRetry?: () => void;
  className?: string;
}): JSX.Element {
  return (
    <div
      role="alert"
      className={cn(
        // Only danger-100/danger-600 exist in tokens.css, and neither has a
        // .dark override (a Phase 6 token-set gap, noted in this session's
        // IMPLEMENTATION_STATUS.md entry) — so this deliberately avoids a
        // danger-100 background, which would wash out in dark mode, and
        // uses an accent border + icon color instead, which reads fine on
        // both bg-raised (light) and bg-raised (dark).
        "flex flex-col items-center gap-3 rounded-lg border-2 border-danger-600/40 bg-raised px-6 py-14 text-center",
        className,
      )}
    >
      <AlertTriangle className="h-8 w-8 text-danger-600" aria-hidden="true" />
      <div className="space-y-1">
        <p className="font-medium text-text-primary">{title}</p>
        {description && <p className="max-w-sm text-sm text-text-secondary">{description}</p>}
      </div>
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="mt-1 flex items-center gap-1.5 rounded-md border border-border px-3 py-1.5 text-sm text-text-primary transition-colors hover:bg-sunken"
        >
          <RotateCw className="h-3.5 w-3.5" aria-hidden="true" />
          Try again
        </button>
      )}
    </div>
  );
}
