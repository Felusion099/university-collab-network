import { Users2 } from "lucide-react";
import { useOrganizationsList } from "@/hooks/useOrganizations";
import { ClubCard } from "@/components/cards/ClubCard";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";

export default function ClubsListPage(): JSX.Element {
  const { data, isLoading, isError, refetch, fetchNextPage, hasNextPage, isFetchingNextPage } =
    useOrganizationsList({ type: ["club", "society"] });

  const orgs = data?.pages.flatMap((page) => page.data) ?? [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-text-primary">Clubs & Societies</h1>
        <p className="mt-1 text-sm text-text-secondary">
          Student-run clubs and societies you can join.
        </p>
      </div>

      {isLoading && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <ClubCard.Skeleton key={i} />
          ))}
        </div>
      )}

      {isError && <ErrorState title="Couldn't load clubs" onRetry={() => refetch()} />}

      {!isLoading && !isError && orgs.length === 0 && (
        <EmptyState icon={Users2} title="No clubs listed yet" />
      )}

      {!isLoading && !isError && orgs.length > 0 && (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {orgs.map((org) => (
              <ClubCard key={org.id} organization={org} />
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
