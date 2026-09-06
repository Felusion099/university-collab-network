import { Link } from "react-router-dom";
import { Users } from "lucide-react";
import type { OrganizationSummary } from "@/services/api/organizations";
import { Skeleton } from "@/components/ui/Skeleton";
import { cn } from "@/lib/utils";

/**
 * ClubCard — ARCHITECTURE.md §5. Covers both `type: "club"` and
 * `type: "society"` organizations (DATABASE_SCHEMA.md's `organizations`
 * table doesn't distinguish them beyond the enum value, and neither does
 * the route map — `/clubs` covers both) — StartupCard.tsx is the
 * separate card for `type: "startup"`, which has its own extra fields
 * (`startupDetails`) this card doesn't need.
 */
export function ClubCard({
  organization,
  className,
}: {
  organization: OrganizationSummary;
  className?: string;
}): JSX.Element {
  return (
    <Link
      to={`/clubs/${organization.id}`}
      className={cn(
        "flex flex-col gap-2 rounded-lg border border-border bg-raised p-4 transition-colors hover:border-accent-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)]",
        className,
      )}
    >
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
          {organization.category && (
            <p className="truncate text-xs text-text-muted">{organization.category}</p>
          )}
        </div>
      </div>
      {organization.description && (
        <p className="line-clamp-2 text-sm text-text-secondary">{organization.description}</p>
      )}
      <span className="flex items-center gap-1 text-xs text-text-muted">
        <Users className="h-3.5 w-3.5" aria-hidden="true" />
        {organization.memberCount} member{organization.memberCount === 1 ? "" : "s"}
      </span>
    </Link>
  );
}

ClubCard.Skeleton = function ClubCardSkeleton(): JSX.Element {
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
