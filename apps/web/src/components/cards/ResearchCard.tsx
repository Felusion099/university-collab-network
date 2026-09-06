import { Link } from "react-router-dom";
import { Users } from "lucide-react";
import { Skeleton } from "@/components/ui/Skeleton";
import { cn } from "@/lib/utils";

/**
 * ResearchCard — ARCHITECTURE.md §5. Covers both `/research` (topics) and
 * `/research-teams` — the two entities are different tables
 * (`research_topics` vs `research_teams`, DATABASE_SCHEMA.md) but the
 * same "topic/team name + short stat row" card shape serves both, per
 * ARCHITECTURE.md §5 listing one `ResearchCard`, not two.
 */
export function ResearchCard({
  href,
  title,
  description,
  stats,
  className,
}: {
  href: string;
  title: string;
  description?: string | null;
  /** e.g. [{icon: Users, label: "4 members"}, {icon: BookOpen, label: "3 publications"}] */
  stats: { icon: typeof Users; label: string }[];
  className?: string;
}): JSX.Element {
  return (
    <Link
      to={href}
      className={cn(
        "flex flex-col gap-2 rounded-lg border border-border bg-raised p-4 transition-colors hover:border-accent-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)]",
        className,
      )}
    >
      <p className="font-medium text-text-primary">{title}</p>
      {description && <p className="line-clamp-2 text-sm text-text-secondary">{description}</p>}
      {stats.length > 0 && (
        <div className="flex flex-wrap gap-3 text-xs text-text-muted">
          {stats.map(({ icon: Icon, label }) => (
            <span key={label} className="flex items-center gap-1">
              <Icon className="h-3.5 w-3.5" aria-hidden="true" />
              {label}
            </span>
          ))}
        </div>
      )}
    </Link>
  );
}

ResearchCard.Skeleton = function ResearchCardSkeleton(): JSX.Element {
  return (
    <div className="flex flex-col gap-2 rounded-lg border border-border bg-raised p-4">
      <Skeleton className="h-4 w-2/3" />
      <Skeleton className="h-3 w-full" />
      <div className="flex gap-3">
        <Skeleton className="h-3 w-16" />
        <Skeleton className="h-3 w-16" />
      </div>
    </div>
  );
};
