import { CheckCircle2, XCircle, Info, X } from "lucide-react";
import { useToastStore } from "@/stores/toast.store";
import { cn } from "@/lib/utils";

const VARIANT_ICON = {
  default: Info,
  success: CheckCircle2,
  error: XCircle,
} as const;

const VARIANT_CLASS = {
  default: "border-border text-text-primary",
  success: "border-success-100 text-success-600",
  error: "border-danger-100 text-danger-600",
} as const;

/** Toast — ARCHITECTURE.md §5. Mounted once in AppLayout; call
 * `useToastStore.getState().show(message, variant)` from anywhere to
 * trigger one. */
export function Toaster(): JSX.Element {
  const toasts = useToastStore((s) => s.toasts);
  const dismiss = useToastStore((s) => s.dismiss);

  return (
    <div className="pointer-events-none fixed bottom-4 right-4 z-50 flex flex-col gap-2">
      {toasts.map((toast) => {
        const Icon = VARIANT_ICON[toast.variant];
        return (
          <div
            key={toast.id}
            role="status"
            className={cn(
              "pointer-events-auto flex items-center gap-2 rounded-md border bg-raised px-3 py-2 text-sm shadow-md",
              VARIANT_CLASS[toast.variant],
            )}
          >
            <Icon className="h-4 w-4 flex-shrink-0" aria-hidden="true" />
            <span>{toast.message}</span>
            <button
              type="button"
              onClick={() => dismiss(toast.id)}
              aria-label="Dismiss"
              className="ml-1 text-text-muted hover:text-text-primary"
            >
              <X className="h-3.5 w-3.5" aria-hidden="true" />
            </button>
          </div>
        );
      })}
    </div>
  );
}
