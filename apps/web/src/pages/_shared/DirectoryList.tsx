import type { LucideIcon } from "lucide-react";
import type { UserRole } from "@app/shared-types";
import { useDirectoryList } from "@/hooks/useDirectory";
import { UserCard } from "@/components/cards/UserCard";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";

/**
 * Not a page in its own right — the shared implementation behind
 * /students, /professors, /researchers (FILE_STRUCTURE.md: three route
 * groups, one generic UserCard + one generic list view per
 * ARCHITECTURE.md §1's "reusable components" principle, rather than three
 * copy-pasted pages). Each real page file (e.g. StudentsListPage.tsx)
 * just supplies its role/title/icon and re-exports this as its default.
 */
export function DirectoryList({
  role,
  title,
  description,
  icon: Icon,
}: {
  role: UserRole;
  title: string;
  description: string;
  icon: LucideIcon;
}): JSX.Element {
  const { data, isLoading, isError, refetch, fetchNextPage, hasNextPage, isFetchingNextPage } =
    useDirectoryList({ role });

  const people = data?.pages.flatMap((page) => page.data) ?? [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-text-primary">{title}</h1>
        <p className="mt-1 text-sm text-text-secondary">{description}</p>
      </div>

      {isLoading && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            // eslint-disable-next-line react/no-array-index-key -- static skeleton count, never reordered
            <UserCard.Skeleton key={i} />
          ))}
        </div>
      )}

      {isError && (
        <ErrorState title={`Couldn't load ${title.toLowerCase()}`} onRetry={() => refetch()} />
      )}

      {!isLoading && !isError && people.length === 0 && (
        <EmptyState
          icon={Icon}
          title={`No ${title.toLowerCase()} yet`}
          description="Check back once more people join, or invite someone from your department."
        />
      )}

      {!isLoading && !isError && people.length > 0 && (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {people.map((person) => (
              <UserCard key={person.id} user={person} />
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
