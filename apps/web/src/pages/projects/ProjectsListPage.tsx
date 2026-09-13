import { useState } from "react";
import { FolderKanban, Plus, X } from "lucide-react";
import type { ProjectStatus } from "@app/shared-types";
import { useProjectsList } from "@/hooks/useProjects";
import { ProjectCard } from "@/components/cards/ProjectCard";
import { FilterPanel } from "@/components/FilterPanel";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import { useSessionStore } from "@/stores/session.store";
import { projectsApi } from "@/services/api/projects";

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
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const { data, isLoading, isError, refetch, fetchNextPage, hasNextPage, isFetchingNextPage } =
    useProjectsList({ status });
  const { user } = useSessionStore();

  const projects = data?.pages.flatMap((page) => page.data) ?? [];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-text-primary">Projects</h1>
          <p className="mt-1 text-sm text-text-secondary">
            Student and researcher-led projects looking for collaborators.
          </p>
        </div>
        {user && (
          <button
            type="button"
            onClick={() => setIsCreateOpen(true)}
            className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            <Plus className="h-4 w-4" />
            Create Project
          </button>
        )}
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
    {isCreateOpen && (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
        <div className="w-full max-w-md rounded-lg bg-surface p-6 shadow-xl">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-text-primary">Create Project</h2>
            <button
              type="button"
              onClick={() => setIsCreateOpen(false)}
              className="text-text-secondary hover:text-text-primary transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
          <CreateProjectForm onClose={() => setIsCreateOpen(false)} onSuccess={() => refetch()} />
        </div>
      </div>
    )}
    </div>
  );
}

function CreateProjectForm({
  onClose,
  onSuccess,
}: {
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState<ProjectStatus>("idea");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setIsSubmitting(true);
    setError(null);
    try {
      await projectsApi.create({
        name: name.trim(),
        description: description.trim() || undefined,
        status,
      });
      onSuccess();
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">{error}</div>
      )}
      <div>
        <label htmlFor="name" className="block text-sm font-medium text-text-primary mb-1">
          Project Name *
        </label>
        <input
          id="name"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-ring"
          placeholder="e.g., AI-Powered Cancer Detection"
          required
          disabled={isSubmitting}
        />
      </div>
      <div>
        <label htmlFor="description" className="block text-sm font-medium text-text-primary mb-1">
          Description
        </label>
        <textarea
          id="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={3}
          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-ring"
          placeholder="Brief description of the project..."
          disabled={isSubmitting}
        />
      </div>
      <div>
        <label htmlFor="status" className="block text-sm font-medium text-text-primary mb-1">
          Status
        </label>
        <select
          id="status"
          value={status}
          onChange={(e) => setStatus(e.target.value as ProjectStatus)}
          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-ring"
          disabled={isSubmitting}
        >
          <option value="idea">Idea</option>
          <option value="planning">Planning</option>
          <option value="development">Development</option>
          <option value="beta">Beta</option>
          <option value="active">Active</option>
          <option value="completed">Completed</option>
          <option value="archived">Archived</option>
        </select>
      </div>
      <div className="flex justify-end gap-2 pt-2">
        <button
          type="button"
          onClick={onClose}
          disabled={isSubmitting}
          className="rounded-md border border-border px-4 py-2 text-sm text-text-primary transition-colors hover:bg-sunken disabled:opacity-50"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isSubmitting || !name.trim()}
          className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50"
        >
          {isSubmitting ? "Creating..." : "Create Project"}
        </button>
      </div>
    </form>
  );
}
