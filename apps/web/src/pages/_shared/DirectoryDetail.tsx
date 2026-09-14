import { useParams, Link } from "react-router-dom";
import { UserX, ArrowLeft } from "lucide-react";
import type { UserRole } from "@app/shared-types";
import { useDirectoryUser } from "@/hooks/useDirectory";
import { PortfolioView } from "@/components/PortfolioView";
import { MessageButton } from "@/components/MessageButton";
import { useSessionStore } from "@/stores/session.store";
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
 * /researchers/:username. Renders the real, privacy-filtered
 * UserProfileResponse (GET /users/:username) through the shared
 * PortfolioView — role-aware sections composed server-side from the
 * user's actual entity relationships.
 */
export function DirectoryDetail({ role }: { role: UserRole }): JSX.Element {
  const { username } = useParams<{ username: string }>();
  const { data: user, isLoading, isError, refetch } = useDirectoryUser(role, username);
  const sessionUser = useSessionStore((s) => s.user);

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
        <div className="space-y-4">
          {sessionUser && sessionUser.id !== user.id && (
            <MessageButton userId={user.id} username={user.username} />
          )}
          <PortfolioView user={user} />
        </div>
      )}
    </div>
  );
}
