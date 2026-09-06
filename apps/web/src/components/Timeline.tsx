import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatDate } from "@/lib/utils";

export interface TimelineEntry {
  id: string;
  icon: LucideIcon;
  title: string;
  date: string; // ISO date
}

/**
 * Timeline — ARCHITECTURE.md §5. Vertical activity feed. First used on
 * Dashboard for "recent activity" — deliberately modeled on
 * PROJECT_SPEC.md §42/§56's instruction to track collaboration/activity
 * events (connections formed, projects joined, teams joined), never
 * vanity metrics — so every mock entry below is one of those, not a
 * "liked a post" style event.
 */
export function Timeline({
  entries,
  className,
}: {
  entries: TimelineEntry[];
  className?: string;
}): JSX.Element {
  return (
    <ol className={cn("space-y-4", className)}>
      {entries.map((entry, i) => {
        const Icon = entry.icon;
        return (
          <li key={entry.id} className="flex gap-3">
            <div className="flex flex-col items-center">
              <span className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-accent-100 text-accent-700">
                <Icon className="h-3.5 w-3.5" aria-hidden="true" />
              </span>
              {i < entries.length - 1 && (
                <span className="mt-1 w-px flex-1 bg-border" aria-hidden="true" />
              )}
            </div>
            <div className="pb-4">
              <p className="text-sm text-text-primary">{entry.title}</p>
              <p className="text-xs text-text-muted">{formatDate(entry.date)}</p>
            </div>
          </li>
        );
      })}
    </ol>
  );
}
