import { useState } from "react";
import { FolderKanban } from "lucide-react";
import type { ProjectStatus } from "@app/shared-types";
import { useProjectsList } from "@/hooks/useProjects";
import { ProjectCard } from "@/components/cards/ProjectCard";
import { FilterPanel } from "@/components/FilterPanel";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";

const STATUS_OPTIONS: { value: ProjectStatus; label: string }[] = [
  { value: "idea", label: "Idea" },
  { value: "planning", label: "Planning" },
  { value: "development", label: "Development" },
  { value: "beta", label: "Beta" },
  { value: "active", label: "Active" },
  { value: "completed", label: "Completed" },
  { value: "archived", label: "Archived" },
];

export default function ProjectsListPage(): JSX.Element {
  const [status, setStatus] = useState<ProjectStatus | undefined>(undefined);
  const { data, isLoading, isError, refetch, fetchNextPage, hasNextPage, isFetchingNextPage } =
    useProjectsList({ status });

  const projects = data?.pages.flatMap((page) => page.data) ?? [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-text-primary">Projects</h1>
        <p className="mt-1 text-sm text-text-secondary">
          Student and researcher-led projects looking for collaborators.
        </p>
      </div>

      <div className="flex flex-col gap-6 md:flex-row">
        <FilterPanel
          className="w-full flex-shrink-0 md:w-48"
          groups={[{ label: "Status", key: "status", options: STATUS_OPTIONS }]}
          activeValues={{ status }}
          onChange={(_key, value) => setStatus(value as ProjectStatus | undefined)}
        />

        <div className="min-w-0 flex-1 space-y-6">
          {isLoading && (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3">
              {Array.from({ length: 6 }).map((_, i) => (
                // eslint-disable-next-line react/no-array-index-key -- static skeleton count, never reordered
                <ProjectCard.Skeleton key={i} />
              ))}
            </div>
          )}

          {isError && <ErrorState title="Couldn't load projects" onRetry={() => refetch()} />}

          {!isLoading && !isError && projects.length === 0 && (
            <EmptyState
              icon={FolderKanban}
              title="No projects match this filter"
              description="Try a different status, or check back once more projects are posted."
            />
          )}

          {!isLoading && !isError && projects.length > 0 && (
            <>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3">
                {projects.map((project) => (
                  <ProjectCard key={project.id} project={project} />
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
      </div>
    </div>
  );
}
