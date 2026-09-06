import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/** Merge conditional classNames, resolving Tailwind conflicts (shadcn/ui convention). */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

/**
 * Formats an ISO date string (the `z.string().date()` shape used by
 * CreateEventRequestSchema/CreateOpportunityRequestSchema etc. in
 * packages/shared-types) for display. Added in Phase 7 since events,
 * opportunities, and publications all need the same formatting — kept
 * here rather than duplicated per-component.
 */
export function formatDate(isoDate: string): string {
  const date = new Date(`${isoDate}T00:00:00`);
  if (Number.isNaN(date.getTime())) return isoDate;
  return date.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}
