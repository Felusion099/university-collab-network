import { Link } from "react-router-dom";
import { TrendingUp } from "lucide-react";
import type { OrganizationSummary } from "@/services/api/organizations";
import { Skeleton } from "@/components/ui/Skeleton";
import { cn } from "@/lib/utils";

/**
 * StartupCard — ARCHITECTURE.md §5. Only for `type: "startup"`
 * organizations — surfaces `startupDetails` (industry/stage/hiring),
 * which club/society organizations never have (DATABASE_SCHEMA.md:
 * `startup_details` is a 1:1 extension table, only present when
 * `organizations.type = startup`). See ClubCard.tsx for club/society.
 */
export function StartupCard({
  organization,
  className,
}: {
  organization: OrganizationSummary;
  className?: string;
}): JSX.Element {
  const details = organization.startupDetails;
  return (
    <Link
      to={`/startups/${organization.id}`}
      className={cn(
        "flex flex-col gap-2 rounded-lg border border-border bg-raised p-4 transition-colors hover:border-accent-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)]",
        className,
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-start gap-3">
          {organization.logoUrl ? (
            <img
              src={organization.logoUrl}
              alt=""
              className="h-10 w-10 flex-shrink-0 rounded-md object-cover"
            />
          ) : (
            <div
              aria-hidden="true"
              className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-md bg-accent-100 text-sm font-semibold text-accent-700"
            >
              {organization.name[0]?.toUpperCase()}
            </div>
          )}
          <div className="min-w-0">
            <p className="truncate font-medium text-text-primary">{organization.name}</p>
            {details?.industry && (
              <p className="truncate text-xs text-text-muted">{details.industry}</p>
            )}
          </div>
        </div>
        {details?.hiring && (
          <span className="flex-shrink-0 rounded-full bg-success-100 px-2 py-0.5 text-xs font-medium text-success-600">
            Hiring
          </span>
        )}
      </div>
      {organization.description && (
        <p className="line-clamp-2 text-sm text-text-secondary">{organization.description}</p>
      )}
      {details?.stage && (
        <span className="flex items-center gap-1 text-xs text-text-muted">
          <TrendingUp className="h-3.5 w-3.5" aria-hidden="true" />
          {details.stage}
        </span>
      )}
    </Link>
  );
}

StartupCard.Skeleton = function StartupCardSkeleton(): JSX.Element {
  return (
    <div className="flex flex-col gap-2 rounded-lg border border-border bg-raised p-4">
      <div className="flex items-center gap-3">
        <Skeleton className="h-10 w-10 flex-shrink-0 rounded-md" />
        <Skeleton className="h-4 w-1/2" />
      </div>
      <Skeleton className="h-3 w-full" />
      <Skeleton className="h-3 w-1/3" />
    </div>
  );
};
