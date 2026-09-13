import { Rocket } from "lucide-react";
import { useOrganizationsList } from "@/hooks/useOrganizations";
import { StartupCard } from "@/components/cards/StartupCard";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";

export default function StartupsListPage(): JSX.Element {
  const { data, isLoading, isError, refetch, fetchNextPage, hasNextPage, isFetchingNextPage } =
    useOrganizationsList({ type: "startup" });

  const orgs = data?.pages.flatMap((page) => page.data) ?? [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-text-primary">Startups</h1>
        <p className="mt-1 text-sm text-text-secondary">
          Student-founded startups, some hiring — look for the "Hiring" badge.
        </p>
      </div>

      {isLoading && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <StartupCard.Skeleton key={i} />
          ))}
        </div>
      )}

      {isError && <ErrorState title="Couldn't load startups" onRetry={() => refetch()} />}

      {!isLoading && !isError && orgs.length === 0 && (
        <EmptyState icon={Rocket} title="No startups listed yet" />
      )}

      {!isLoading && !isError && orgs.length > 0 && (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {orgs.map((org) => (
              <StartupCard key={org.id} organization={org} />
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
