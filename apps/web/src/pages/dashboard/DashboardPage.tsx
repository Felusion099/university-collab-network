import { useSessionStore } from "@/stores/session.store";
import { useFeaturedProfile, useRecentActivity } from "@/hooks/useDashboard";
import { useQuery } from "@tanstack/react-query";
import { meApi } from "@/services/api/me";
import { useProjectsList } from "@/hooks/useProjects";
import { ProfileCard } from "@/components/cards/ProfileCard";
import { ProjectCard } from "@/components/cards/ProjectCard";
import { Timeline } from "@/components/Timeline";
import { Skeleton } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import { Compass, Clock, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";

/**
 * Real Dashboard, replacing Session 18's router-skeleton placeholder
 * (that file's own comment said "real dashboard is Phase 7's job").
 * Uses ProfileCard (featured recommendation) and Timeline (recent
 * activity) — both new this session — so neither is dead code.
 */
export default function DashboardPage(): JSX.Element {
  const user = useSessionStore((s) => s.user);
  const { data: featuredProfile, isLoading: profileLoading } = useFeaturedProfile();
  const { data: activity, isLoading: activityLoading } = useRecentActivity();

  return (
    <div className="space-y-8">
      {/* Greeting/context — task-oriented, not feed-oriented (01 §8) */}
      <div>
        <h1 className="text-2xl font-semibold text-text-primary">Dashboard</h1>
        {user && <p className="mt-1 text-sm text-text-secondary">Signed in as {user.email}</p>}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <section className="space-y-6 lg:col-span-2">
          {/* PENDING ACTIONS — things requiring the user's decision */}
          <PendingActions />

          {/* RECOMMENDED PROJECTS — real data, explainable */}
          <RecommendedProjects />

          <div>
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-text-muted">
              Recent Activity
            </h2>
          {activityLoading && (
            <div className="space-y-3">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-3/4" />
            </div>
          )}
          {!activityLoading && activity && activity.length === 0 && (
            <EmptyState
              icon={Compass}
              title="No activity yet"
              description="Connect with people or join a project to see activity here."
            />
          )}
          {!activityLoading && activity && activity.length > 0 && <Timeline entries={activity} />}
          </div>
        </section>

        <section>
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-text-muted">
            Recommended for you
          </h2>
          {profileLoading && <ProfileCard.Skeleton />}
          {!profileLoading && featuredProfile && (
            <ProfileCard user={featuredProfile} ctaLabel="View profile" />
          )}
          {!profileLoading && !featuredProfile && (
            <EmptyState icon={Compass} title="No recommendations yet" />
          )}
        </section>
      </div>
    </div>
  );
}


function usePendingJoinRequests() {
  return useQuery({
    queryKey: ["my-join-requests"],
    queryFn: () => meApi.getJoinRequests(),
  });
}

/** Pending actions — the caller's open requests/invitations (real rows). */
function PendingActions(): JSX.Element {
  const { data: pending, isLoading } = usePendingJoinRequests();

  const invitationCount = (pending?.data ?? []).length;

  if (isLoading) return <Skeleton className="h-20 w-full rounded-lg" />;

  if (invitationCount === 0) return <div className="hidden" />;

  return (
    <div className="flex items-center justify-between gap-3 rounded-lg border border-warning-600/30 bg-warning-100/40 p-4">
      <div className="flex items-center gap-2">
        <Clock className="h-4 w-4 text-warning-600" aria-hidden="true" />
        <p className="text-sm text-text-primary">
          <span className="font-medium">{invitationCount}</span> pending{" "}
          {invitationCount === 1 ? "request" : "requests"} /{" "}
          {invitationCount === 1 ? "invitation" : "invitations"} need your response
        </p>
      </div>
      <Link
        to="/my-projects"
        className="inline-flex flex-shrink-0 items-center gap-1 rounded-md bg-accent-600 px-3 py-1.5 text-sm font-medium text-text-onAccent hover:bg-accent-700"
      >
        Review <ArrowRight className="h-3.5 w-3.5" />
      </Link>
    </div>
  );
}

/** Recommended projects — real active projects (explainable: status/skills). */
function RecommendedProjects(): JSX.Element {
  const { data, isLoading, isError, refetch } = useProjectsList({ status: "active" });
  const projects = data?.pages.flatMap((p) => p.data).slice(0, 3) ?? [];

  return (
    <div>
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-text-muted">
          Recommended projects
        </h2>
        <Link
          to="/projects"
          className="inline-flex items-center gap-1 text-xs text-accent-600 hover:text-accent-700"
        >
          View all <ArrowRight className="h-3 w-3" />
        </Link>
      </div>
      {isLoading && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <ProjectCard.Skeleton />
          <ProjectCard.Skeleton />
          <ProjectCard.Skeleton />
        </div>
      )}
      {isError && <p className="text-sm text-danger-600">Couldn't load projects. <button type="button" onClick={() => refetch()} className="underline">Retry</button></p>}
      {!isLoading && !isError && projects.length === 0 && (
        <EmptyState
          icon={Compass}
          title="No active projects yet"
          description="Create a project or check back soon."
        />
      )}
      {!isLoading && !isError && projects.length > 0 && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {projects.map((project) => (
            <ProjectCard key={project.id} project={project} />
          ))}
        </div>
      )}
    </div>
  );
}
