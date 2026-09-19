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
import { Compass, Clock, ArrowRight, Search } from "lucide-react";
import { Link } from "react-router-dom";
import { SearchBar } from "@/components/SearchBar";
import { useState } from "react";

/**
 * Home — task-oriented, not feed-oriented (MASTER_UIUX prompt DASHBOARD +
 * 01 §8). Answers "What can I do next?": greeting/context → search →
 * Pending Actions → Projects For You (real active projects) → People For
 * You → Collaboration activity. Sections omit when data is unavailable —
 * never fabricated content.
 */
export default function DashboardPage(): JSX.Element {
  const user = useSessionStore((s) => s.user);
  const { data: featuredProfile, isLoading: profileLoading } = useFeaturedProfile();
  const { data: activity, isLoading: activityLoading } = useRecentActivity();
  const [query, setQuery] = useState("");

  const firstName = user?.email ? user.email.split("@")[0]?.split(/[._]/)[0] : null;
  const greeting = firstName
    ? firstName.charAt(0).toUpperCase() + firstName.slice(1)
    : "Welcome back";

  return (
    <div className="space-y-10">
      {/* Greeting/context + search — the primary action (01 §8) */}
      <header className="space-y-5">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-text-primary">
            {greeting}.
          </h1>
          <p className="mt-1.5 text-base text-text-secondary">
            Discover people, projects, and research you can collaborate on.
          </p>
        </div>
        <div className="relative">
          <SearchBar value={query} onChange={setQuery} />
          <Link
            to={`/discover${query ? `?q=${encodeURIComponent(query)}` : ""}`}
            className="absolute right-2 top-1/2 hidden -translate-y-1/2 items-center gap-1 rounded-md bg-accent-600 px-3 py-1.5 text-sm font-medium text-text-onAccent hover:bg-accent-700 sm:inline-flex"
          >
            <Search className="h-3.5 w-3.5" aria-hidden="true" />
            Search
          </Link>
        </div>
      </header>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        <section className="space-y-8 lg:col-span-2">
          {/* PENDING ACTIONS — things requiring the user's decision */}
          <PendingActions />

          {/* PROJECTS FOR YOU — real active projects, explainable */}
          <RecommendedProjects />

          {/* COLLABORATION ACTIVITY — real notifications (never vanity) */}
          <div>
            <h2 className="mb-4 text-xl font-semibold tracking-tight text-text-primary">
              Collaboration activity
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

        {/* PEOPLE FOR YOU — contextual rail */}
        <aside className="space-y-4">
          <h2 className="text-xl font-semibold tracking-tight text-text-primary">
            People for you
          </h2>
          {profileLoading && <ProfileCard.Skeleton />}
          {!profileLoading && featuredProfile && (
            <ProfileCard user={featuredProfile} ctaLabel="View profile" />
          )}
          {!profileLoading && !featuredProfile && (
            <EmptyState
              icon={Compass}
              title="No recommendations yet"
              description="Add skills and interests to get personalized people suggestions."
            />
          )}
        </aside>
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

/** Projects For You — real active projects (explainable: status/skills). */
function RecommendedProjects(): JSX.Element {
  const { data, isLoading, isError, refetch } = useProjectsList({ status: "active" });
  const projects = data?.pages.flatMap((p) => p.data).slice(0, 3) ?? [];

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-xl font-semibold tracking-tight text-text-primary">
          Projects for you
        </h2>
        <Link
          to="/projects"
          className="inline-flex items-center gap-1 text-sm text-accent-600 hover:text-accent-700"
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
