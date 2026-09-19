import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { FolderKanban, Compass, Clock } from "lucide-react";
import { useMe } from "@/hooks/useMe";
import { meApi, type JoinRequestRef } from "@/services/api/me";
import { ProjectCard } from "@/components/cards/ProjectCard";
import { Skeleton } from "@/components/ui/Skeleton";
import { ErrorState } from "@/components/ui/ErrorState";
import { EmptyState } from "@/components/ui/EmptyState";

/**
 * MyProjectsPage (/my-projects) — "What projects am I involved in?"
 * Leading/Owned (creator) and Member (accepted) come from the composed
 * portfolio (real ProjectMember/creatorBy records); Pending comes from
 * real JoinRequest rows (both directions). Never global-search results.
 */
export default function MyProjectsPage(): JSX.Element {
  const { data: me, isLoading: meLoading, isError: meError, refetch } = useMe();
  const {
    data: pending,
    isLoading: pendingLoading,
    isError: pendingError,
    refetch: refetchPending,
  } = usePendingRequests();

  const leading = (me?.portfolio?.projects ?? []).filter((p) => p.relation === "lead");
  const member = (me?.portfolio?.projects ?? []).filter((p) => p.relation === "member");

  if (meLoading || pendingLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-1/3" />
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-24 w-full" />
      </div>
    );
  }

  if (meError || pendingError) {
    return <ErrorState title="Couldn't load your projects" onRetry={() => { refetch(); refetchPending(); }} />;
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight text-text-primary">My Projects</h1>
        <p className="mt-1 text-sm text-text-secondary">
          Everything you lead, contribute to, or have requested to join.
        </p>
      </div>

      {/* PENDING — real JoinRequest rows */}
      {pending && pending.data.length > 0 && (
        <section>
          <h2 className="mb-2 flex items-center gap-1.5 text-sm font-semibold uppercase tracking-wide text-text-muted">
            <Clock className="h-3.5 w-3.5" aria-hidden="true" />
            Pending
          </h2>
          <div className="space-y-2">
            {pending.data.map((r) => (
              <PendingRequestRow key={r.id} request={r} onSettled={() => refetchPending()} />
            ))}
          </div>
        </section>
      )}

      {/* LEADING / OWNED */}
      <section>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-text-muted">
          Leading
        </h2>
        {leading.length === 0 ? (
          <EmptyState
            icon={FolderKanban}
            title="No projects led yet"
            description="Create a project to recruit collaborators around your idea."
            action={
              <Link
                to="/projects"
                className="mt-2 inline-flex items-center gap-1.5 rounded-md bg-accent-600 px-3 py-1.5 text-sm font-medium text-text-onAccent hover:bg-accent-700"
              >
                Create a project
              </Link>
            }
          />
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {leading.map((p) => (
              <ProjectCard
                key={p.id}
                project={{
                  id: p.id,
                  name: p.name,
                  logoUrl: null,
                  description: "",
                  status: p.status as "idea",
                  skillsNeeded: [],
                  memberCount: 0,
                }}
              />
            ))}
          </div>
        )}
      </section>

      {/* MEMBER */}
      <section>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-text-muted">
          Member
        </h2>
        {member.length === 0 ? (
          <EmptyState
            icon={Compass}
            title="You aren't part of any projects yet"
            description="Explore projects that match your skills and interests, then request to join."
            action={
              <Link
                to="/projects"
                className="mt-2 inline-flex items-center gap-1.5 rounded-md border border-border px-3 py-1.5 text-sm text-text-primary hover:bg-sunken"
              >
                Discover projects
              </Link>
            }
          />
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {member.map((p) => (
              <ProjectCard
                key={p.id}
                project={{
                  id: p.id,
                  name: p.name,
                  logoUrl: null,
                  description: "",
                  status: p.status as "idea",
                  skillsNeeded: [],
                  memberCount: 0,
                }}
              />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function usePendingRequests() {
  return useQuery({
    queryKey: ["my-join-requests"],
    queryFn: () => meApi.getJoinRequests(),
  });
}

function PendingRequestRow({
  request,
  onSettled,
}: {
  request: JoinRequestRef;
  onSettled: () => void;
}) {
  const queryClient = useQueryClient();
  const mutation = useMutation({
    mutationFn: (action: "accept" | "decline") =>
      meApi.respondToInvitation(request.id, action),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["my-join-requests"] });
      queryClient.invalidateQueries({ queryKey: ["me"] });
      onSettled();
    },
  });
  const name = request.project?.name ?? request.researchTeam?.name ?? "Unknown";
  const kind = request.project ? "project" : "team";

  return (
    <div className="flex flex-col gap-2 rounded-lg border border-border bg-raised p-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0">
        <p className="text-sm font-medium text-text-primary">{name}</p>
        <p className="text-xs text-text-muted">
          {request.direction === "invitation"
            ? `You were invited to join this ${kind}`
            : `Your request to join this ${kind} is pending review`}
        </p>
      </div>
      {request.direction === "invitation" ? (
        <div className="flex flex-shrink-0 gap-2">
          <button
            type="button"
            onClick={() => mutation.mutate("accept")}
            disabled={mutation.isPending}
            className="rounded-md bg-accent-600 px-3 py-1.5 text-xs font-medium text-text-onAccent hover:bg-accent-700 disabled:opacity-50"
          >
            Accept
          </button>
          <button
            type="button"
            onClick={() => mutation.mutate("decline")}
            disabled={mutation.isPending}
            className="rounded-md border border-border px-3 py-1.5 text-xs font-medium text-text-primary hover:bg-sunken disabled:opacity-50"
          >
            Decline
          </button>
        </div>
      ) : (
        <span className="flex-shrink-0 rounded-full bg-warning-100 px-2.5 py-0.5 text-xs font-medium text-warning-600">
          Pending
        </span>
      )}
    </div>
  );
}
