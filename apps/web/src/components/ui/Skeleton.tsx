import { cn } from "@/lib/utils";

/**
 * Skeleton — ARCHITECTURE.md §5 design-system inventory.
 * A single pulsing placeholder block. Compose several to build a
 * page-specific loading state (see UserCard.Skeleton for an example).
 * Respects prefers-reduced-motion via the `animate-pulse` utility being
 * disabled globally in tokens.css/tailwind config for that media query
 * (Phase 6's motion-scale work) — no per-component override needed here.
 */
export function Skeleton({ className }: { className?: string }): JSX.Element {
  return (
    <div
      role="presentation"
      aria-hidden="true"
      className={cn("animate-pulse rounded-md bg-sunken", className)}
    />
  );
}
