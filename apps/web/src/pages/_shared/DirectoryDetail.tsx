import { useParams, Link } from "react-router-dom";
import { UserX, ArrowLeft } from "lucide-react";
import type { UserRole } from "@app/shared-types";
import { useDirectoryUser } from "@/hooks/useDirectory";
import { ProfileHeader } from "@/components/ProfileHeader";
import { SkillBadge } from "@/components/ui/Badge";
import { Skeleton } from "@/components/ui/Skeleton";
import { ErrorState } from "@/components/ui/ErrorState";
import { EmptyState } from "@/components/ui/EmptyState";

const ROLE_LIST_ROUTE: Record<UserRole, string> = {
  student: "/students",
  professor: "/professors",
  researcher: "/researchers",
  club_rep: "/students",
  startup_member: "/students",
  alumni: "/students",
  admin: "/students",
};

/**
 * Shared implementation behind /students/:username, /professors/:username,
 * /researchers/:username. Mirrors GET /users/:username's real, already-
 * contracted shape (API_CONTRACT.md §2) loosely via `directoryApi`'s mock
 * — full profile fields (bio, links, connections) aren't in
 * `DirectoryUserSummary` yet and are Phase 8's job to wire from the real
 * endpoint, not faked here. Header block uses the shared `ProfileHeader`
 * component (ARCHITECTURE.md §5) instead of inline markup.
 */
export function DirectoryDetail({ role }: { role: UserRole }): JSX.Element {
  const { username } = useParams<{ username: string }>();
  const { data: user, isLoading, isError, refetch } = useDirectoryUser(role, username);

  return (
    <div className="space-y-6">
      <Link
        to={ROLE_LIST_ROUTE[role]}
        className="inline-flex items-center gap-1.5 text-sm text-text-secondary hover:text-text-primary"
      >
        <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
        Back
      </Link>

      {isLoading && (
        <div className="flex items-start gap-4">
          <Skeleton className="h-16 w-16 rounded-full" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-6 w-1/3" />
            <Skeleton className="h-4 w-1/2" />
          </div>
        </div>
      )}

      {isError && <ErrorState title="Couldn't load this profile" onRetry={() => refetch()} />}

      {!isLoading && !isError && !user && (
        <EmptyState
          icon={UserX}
          title="Profile not found"
          description={`No one found at @${username}.`}
        />
      )}

      {!isLoading && !isError && user && (
        <div className="space-y-6">
          <ProfileHeader
            avatarUrl={user.avatarUrl}
            name={user.fullName}
            username={user.username}
            verified={user.isUniversityVerified}
            subtitle={user.headline}
          />

          {user.topSkills.length > 0 && (
            <div>
              <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-text-muted">
                Skills
              </h2>
              <div className="flex flex-wrap gap-1.5">
                {user.topSkills.map((skill: string) => (
                  <SkillBadge key={skill} skill={skill} />
                ))}
              </div>
            </div>
          )}

          {user.department && (
            <p className="text-xs text-text-muted">{user.department}</p>
          )}

          {user.bio && (
            <div>
              <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-text-muted">About</h2>
              <p className="text-sm text-text-secondary leading-relaxed">{user.bio}</p>
            </div>
          )}

          {user.lookingFor && (
            <div>
              <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-text-muted">What they're looking for</h2>
              <p className="text-sm text-text-secondary leading-relaxed">{String(user.lookingFor)}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
