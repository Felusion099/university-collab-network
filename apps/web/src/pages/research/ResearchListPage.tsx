import { FlaskConical, Users, BookOpen } from "lucide-react";
import { useResearchTopicsList } from "@/hooks/useResearch";
import { ResearchCard } from "@/components/cards/ResearchCard";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";

export default function ResearchListPage(): JSX.Element {
  const { data, isLoading, isError, refetch, fetchNextPage, hasNextPage, isFetchingNextPage } =
    useResearchTopicsList({});

  const topics = data?.pages.flatMap((page) => page.data) ?? [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-text-primary">Research Topics</h1>
        <p className="mt-1 text-sm text-text-secondary">
          Browse active research areas and the teams working on them.
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

      {isError && <ErrorState title="Couldn't load research topics" onRetry={() => refetch()} />}

      {!isLoading && !isError && topics.length === 0 && (
        <EmptyState icon={FlaskConical} title="No research topics listed yet" />
      )}

      {!isLoading && !isError && topics.length > 0 && (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {topics.map((topic) => (
              <ResearchCard
                key={topic.id}
                href={`/research/${topic.slug}`}
                title={topic.name}
                description={topic.description}
                stats={[
                  {
                    icon: Users,
                    label: `${topic.teamCount} team${topic.teamCount === 1 ? "" : "s"}`,
                  },
                  {
                    icon: BookOpen,
                    label: `${topic.publicationCount} publication${topic.publicationCount === 1 ? "" : "s"}`,
                  },
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
