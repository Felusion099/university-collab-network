import { Users2, Users, User } from "lucide-react";
import { useResearchTeamsList } from "@/hooks/useResearchTeams";
import { ResearchCard } from "@/components/cards/ResearchCard";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";

export default function ResearchTeamsListPage(): JSX.Element {
  const { data, isLoading, isError, refetch, fetchNextPage, hasNextPage, isFetchingNextPage } =
    useResearchTeamsList({});

  const teams = data?.pages.flatMap((page) => page.data) ?? [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-text-primary">Research Teams</h1>
        <p className="mt-1 text-sm text-text-secondary">
          Active labs and teams, led by a PI, working across one or more topics.
        </p>
      </div>

      {isLoading && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            // eslint-disable-next-line react/no-array-index-key -- static skeleton count, never reordered
            <ResearchCard.Skeleton key={i} />
          ))}
        </div>
      )}

      {isError && <ErrorState title="Couldn't load research teams" onRetry={() => refetch()} />}

      {!isLoading && !isError && teams.length === 0 && (
        <EmptyState icon={Users2} title="No research teams listed yet" />
      )}

      {!isLoading && !isError && teams.length > 0 && (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {teams.map((team) => (
              <ResearchCard
                key={team.id}
                href={`/research-teams/${team.id}`}
                title={team.name}
                description={team.description}
                stats={[
                  { icon: User, label: team.piName },
                  { icon: Users, label: `${team.memberCount} members` },
                ]}
              />
            ))}
          </div>
          {hasNextPage && (
            <div className="flex justify-center">
              <button
                type="button"
                onClick={() => fetchNextPage()}
                disabled={isFetchingNextPage}
                className="rounded-md border border-border px-4 py-2 text-sm text-text-primary transition-colors hover:bg-sunken disabled:opacity-50"
              >
                {isFetchingNextPage ? "Loading..." : "Load more"}
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
