import { Link } from "react-router-dom";
import { BookOpen } from "lucide-react";
import { usePublicationsList } from "@/hooks/usePublications";
import { Skeleton } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import { formatDate } from "@/lib/utils";

/**
 * ARCHITECTURE.md §5's component inventory has no dedicated
 * `PublicationCard` entry, even though `/publications` is a real route in
 * FILE_STRUCTURE.md — noted in IMPLEMENTATION_STATUS.md rather than
 * silently inventing a new "official" reusable component past what that
 * list documents (Anti-Crap Rule: check the list first). This page uses
 * plain list rows instead; if Phase 3 formally adds a PublicationCard to
 * the inventory later, this is what would get refactored to use it.
 */
export default function PublicationsListPage(): JSX.Element {
  const { data, isLoading, isError, refetch, fetchNextPage, hasNextPage, isFetchingNextPage } =
    usePublicationsList({});

  const publications = data?.pages.flatMap((page) => page.data) ?? [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-text-primary">Publications</h1>
        <p className="mt-1 text-sm text-text-secondary">
          Papers and preprints published by students, professors, and researchers here.
        </p>
      </div>

      {isLoading && (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            // eslint-disable-next-line react/no-array-index-key -- static skeleton count, never reordered
            <div key={i} className="space-y-2 rounded-lg border border-border bg-raised p-4">
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-3 w-1/2" />
              <Skeleton className="h-3 w-1/3" />
            </div>
          ))}
        </div>
      )}

      {isError && <ErrorState title="Couldn't load publications" onRetry={() => refetch()} />}

      {!isLoading && !isError && publications.length === 0 && (
        <EmptyState
          icon={BookOpen}
          title="No publications listed yet"
          description="Publications added by students, professors, and researchers will show up here."
        />
      )}

      {!isLoading && !isError && publications.length > 0 && (
        <>
          <div className="space-y-3">
            {publications.map((pub) => (
              <Link
                key={pub.id}
                to={`/publications/${pub.id}`}
                className="block rounded-lg border border-border bg-raised p-4 transition-colors hover:border-accent-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)]"
              >
                <p className="font-medium text-text-primary">{pub.title}</p>
                <p className="mt-0.5 text-sm text-text-secondary">
                  {pub.authorNames.join(", ")}
                </p>
                <p className="mt-1 text-xs text-text-muted">
                  {[pub.journalOrConference, pub.publishedDate && formatDate(pub.publishedDate)]
                    .filter(Boolean)
                    .join(" · ")}
                </p>
              </Link>
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
