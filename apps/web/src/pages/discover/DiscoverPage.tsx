import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Compass } from "lucide-react";
import { useDiscover } from "@/hooks/useDiscover";
import { SearchBar } from "@/components/SearchBar";
import { UserCard } from "@/components/cards/UserCard";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";

/**
 * /discover — FILE_STRUCTURE.md route map, backend: Phase 5. Query-less =
 * personalized recommendations (API_CONTRACT.md §8); with `?q=` behaves
 * like §4 search. Only the `people` group has real cards this session —
 * see services/api/discover.ts's doc comment for exactly why and what's
 * still mocked/empty.
 */
export default function DiscoverPage(): JSX.Element {
  const [searchParams, setSearchParams] = useSearchParams();
  const [query, setQuery] = useState(searchParams.get("q") ?? "");
  const { data, isLoading, isError, refetch } = useDiscover(query);

  function handleQueryChange(next: string): void {
    setQuery(next);
    setSearchParams(next ? { q: next } : {}, { replace: true });
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight text-text-primary">Discover</h1>
        <p className="mt-1 text-sm text-text-secondary">
          {query
            ? `Results for "${query}"`
            : "People, projects, and research picked for you — see why each one appears."}
        </p>
      </div>

      <SearchBar value={query} onChange={handleQueryChange} autoFocus className="max-w-lg" />

      {isLoading && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <UserCard.Skeleton key={i} />
          ))}
        </div>
      )}

      {isError && (
        <ErrorState
          title="Couldn't load Discover"
          description="Something went wrong fetching recommendations."
          onRetry={() => refetch()}
        />
      )}

      {!isLoading && !isError && data && (
        <>
          {data.people.length === 0 ? (
            <EmptyState
              icon={Compass}
              title={query ? "No people found" : "Nothing to show yet"}
              description={
                query
                  ? "Try a different name or check the spelling."
                  : "Recommendations improve as you add skills and interests in Settings."
              }
            />
          ) : (
            <section>
              <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-text-muted">
                People
              </h2>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {data.people.map((person) => (
                  <div key={person.id} className="space-y-1.5">
                    <UserCard user={person} />
                    <p className="px-1 text-xs text-text-muted">{person.reason}</p>
                  </div>
                ))}
              </div>
            </section>
          )}
        </>
      )}
    </div>
  );
}
