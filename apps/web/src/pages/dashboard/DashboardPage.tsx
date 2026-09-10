import { useSessionStore } from "@/stores/session.store";
import { useFeaturedProfile, useRecentActivity } from "@/hooks/useDashboard";
import { ProfileCard } from "@/components/cards/ProfileCard";
import { Timeline } from "@/components/Timeline";
import { Skeleton } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import { Compass } from "lucide-react";

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
      <div>
        <h1 className="text-2xl font-semibold text-text-primary">Dashboard</h1>
        {user && <p className="mt-1 text-sm text-text-secondary">Signed in as {user.email}</p>}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <section className="lg:col-span-2">
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
