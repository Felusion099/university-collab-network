import { Link } from "react-router-dom";
import { GraduationCap, ShieldCheck } from "lucide-react";
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
 * UserCard — ARCHITECTURE.md §5. One card, reused across /students,
 * /professors, /researchers, and Discover's "people" group, per
 * FILE_STRUCTURE.md's directory pattern — a single generic card rather
 * than three near-identical role-specific ones (Anti-Crap Rule: reuse
 * over duplication).
 */
export function UserCard({
  user,
  className,
}: {
  user: DirectoryUserSummary;
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
    <Link
      to={`/${routeSegment}/${user.username}`}
      className={cn(
        "flex flex-col gap-3 rounded-xl border border-border bg-raised p-5 shadow-sm transition-all hover:border-accent-500 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)]",
        className,
      )}
    >
      <div className="flex items-start gap-3">
        {user.avatarUrl ? (
          <img
            src={user.avatarUrl}
            alt=""
            className="h-11 w-11 flex-shrink-0 rounded-full object-cover"
          />
        ) : (
          <div
            aria-hidden="true"
            className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-full bg-accent-100 text-sm font-semibold text-accent-700"
          >
            {initials || <GraduationCap className="h-5 w-5" />}
          </div>
        )}
        <div className="min-w-0 flex-1">
          <div className="flex min-w-0 items-center gap-1.5">
            <p className="truncate font-semibold text-text-primary">{user.fullName}</p>
            <VerificationBadge verified={user.isUniversityVerified} />
          </div>
          {/* MALT hierarchy: role/department context under the name — quiet
              metadata, name carries the scan */}
          <p className="truncate text-xs capitalize text-text-muted">
            {user.role.replace("_", " ")}
            {user.department ? ` · ${user.department}` : ""}
          </p>
          {user.headline && <p className="line-clamp-2 text-sm text-text-secondary">{user.headline}</p>}
        </div>
      </div>
      {/* Trust + availability pills (C1 pattern, real data) */}
      <div className="flex flex-wrap items-center gap-1.5">
        <span className="inline-flex items-center gap-1 rounded-full bg-success-100 px-2.5 py-0.5 text-[11px] font-semibold text-success-600">
          <ShieldCheck className="h-3 w-3" aria-hidden="true" />
          Verified {user.role.replace("_", " ").replace(/\b\w/g, (c) => c.toUpperCase())}
        </span>
      </div>
      {user.topSkills.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {user.topSkills.slice(0, 3).map((skill) => (
            <SkillBadge key={skill} skill={skill} />
          ))}
          {user.topSkills.length > 3 && (
            <span className="rounded-lg bg-sunken px-2 py-0.5 text-[11px] font-medium text-text-secondary">
              +{user.topSkills.length - 3} more
            </span>
          )}
        </div>
      )}
    </Link>
  );
}

/** Matches UserCard's layout exactly so a loading grid doesn't jump/reflow
 * once real cards replace it (spec §40's loading-state requirement). */
UserCard.Skeleton = function UserCardSkeleton(): JSX.Element {
  return (
    <div className="flex flex-col gap-3 rounded-xl border border-border bg-raised p-5">
      <div className="flex items-start gap-3">
        <Skeleton className="h-11 w-11 flex-shrink-0 rounded-full" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-4 w-2/3" />
          <Skeleton className="h-3 w-1/2" />
        </div>
      </div>
      <div className="flex gap-1.5">
        <Skeleton className="h-5 w-14 rounded-full" />
        <Skeleton className="h-5 w-16 rounded-full" />
      </div>
    </div>
  );
};
