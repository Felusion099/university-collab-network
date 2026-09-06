import { Link } from "react-router-dom";
import type { DirectoryUserSummary } from "@/services/api/directory";
import { SkillBadge, VerificationBadge } from "@/components/ui/Badge";
import { Skeleton } from "@/components/ui/Skeleton";
import { cn } from "@/lib/utils";

const ROLE_ROUTE: Record<string, string> = {
  student: "students",
  professor: "professors",
  researcher: "researchers",
};

/**
 * ProfileCard — ARCHITECTURE.md §5. ARCHITECTURE.md lists both
 * `ProfileCard` and `UserCard` without distinguishing them; this session
 * resolves that ambiguity as: `UserCard` is the compact grid-of-many item
 * (directory/discover lists), `ProfileCard` is a larger single-profile
 * highlight (full, non-truncated skill list, bigger avatar, a primary
 * CTA) — used on Dashboard for a single featured/recommended profile,
 * not a grid. If a future session reconciles this differently, this
 * comment is the place to update.
 */
export function ProfileCard({
  user,
  ctaLabel = "View profile",
  className,
}: {
  user: DirectoryUserSummary;
  ctaLabel?: string;
  className?: string;
}): JSX.Element {
  const routeSegment = ROLE_ROUTE[user.role] ?? "students";
  const initials = user.fullName
    .split(" ")
    .map((part) => part[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <div className={cn("rounded-lg border border-border bg-raised p-5", className)}>
      <div className="flex items-start gap-4">
        {user.avatarUrl ? (
          <img
            src={user.avatarUrl}
            alt=""
            className="h-14 w-14 flex-shrink-0 rounded-full object-cover"
          />
        ) : (
          <div
            aria-hidden="true"
            className="flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-full bg-accent-100 text-base font-semibold text-accent-700"
          >
            {initials}
          </div>
        )}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <p className="truncate font-medium text-text-primary">{user.fullName}</p>
            <VerificationBadge verified={user.isUniversityVerified} />
          </div>
          {user.headline && <p className="text-sm text-text-secondary">{user.headline}</p>}
        </div>
      </div>

      {user.topSkills.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {user.topSkills.map((skill) => (
            <SkillBadge key={skill} skill={skill} />
          ))}
        </div>
      )}

      <Link
        to={`/${routeSegment}/${user.username}`}
        className="mt-4 inline-flex w-full items-center justify-center rounded-md border border-border px-3 py-1.5 text-sm font-medium text-text-primary transition-colors hover:bg-sunken"
      >
        {ctaLabel}
      </Link>
    </div>
  );
}

ProfileCard.Skeleton = function ProfileCardSkeleton(): JSX.Element {
  return (
    <div className="rounded-lg border border-border bg-raised p-5">
      <div className="flex items-start gap-4">
        <Skeleton className="h-14 w-14 flex-shrink-0 rounded-full" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-4 w-2/3" />
          <Skeleton className="h-3 w-1/2" />
        </div>
      </div>
      <Skeleton className="mt-4 h-8 w-full rounded-md" />
    </div>
  );
};
