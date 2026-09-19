import { useState } from "react";
import { FolderKanban, Plus, X } from "lucide-react";
import type { ProjectStatus } from "@app/shared-types";
import { useProjectsList } from "@/hooks/useProjects";
import { ProjectCard } from "@/components/cards/ProjectCard";
import { ErrorState } from "@/components/ui/ErrorState";
import { useSessionStore } from "@/stores/session.store";
import { projectsApi } from "@/services/api/projects";
import { cn } from "@/lib/utils";

const STATUS_OPTIONS: { value: ProjectStatus | "all"; label: string }[] = [
  { value: "all", label: "All" },
  { value: "idea", label: "Idea" },
  { value: "planning", label: "Planning" },
  { value: "development", label: "Development" },
  { value: "beta", label: "Beta" },
  { value: "active", label: "Active" },
  { value: "completed", label: "Completed" },
  { value: "archived", label: "Archived" },
];

/**
 * Projects discovery — C1 orientation adapted to UCN tokens: header with
 * description + live result count + Post action over a border-b, one-row
 * filter pills (dark active, scroll on mobile), lg:grid-cols-2 cards, and
 * a centered empty state with Reset. Real data only.
 */
export default function ProjectsListPage(): JSX.Element {
  const [status, setStatus] = useState<ProjectStatus | "all">("all");
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const { data, isLoading, isError, refetch, fetchNextPage, hasNextPage, isFetchingNextPage } =
    useProjectsList({ status: status === "all" ? undefined : status });
  const { user } = useSessionStore();

  const projects = data?.pages.flatMap((page) => page.data) ?? [];
  const filtersActive = status !== "all";

  return (
    <div className="space-y-6">
      {/* Header — title + description + count + action (C1 pattern) */}
      <div className="flex flex-col justify-between gap-4 border-b border-border pb-6 md:flex-row md:items-end">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-text-primary">
            Projects, Hackathons & Research Teams
          </h1>
          <p className="mt-1 text-sm text-text-secondary">
            Find teams actively recruiting student developers, researchers, and designers.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs text-text-muted">
            <strong className="text-text-primary">{projects.length}</strong> active{" "}
            {projects.length === 1 ? "project" : "projects"}
          </span>
          {user && (
            <button
              type="button"
              onClick={() => setIsCreateOpen(true)}
              className="flex items-center gap-1.5 rounded-lg bg-accent-600 px-3.5 py-1.5 text-xs font-medium text-text-onAccent shadow-sm transition-colors hover:bg-accent-700"
            >
              <Plus className="h-3.5 w-3.5" />
              Post a Project
            </button>
          )}
        </div>
      </div>

      {/* Filter pills — dark active state, horizontally scrollable on mobile */}
      <div className="flex flex-wrap items-center gap-3 py-1">
        <div className="flex items-center gap-1 overflow-x-auto py-1">
          {STATUS_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => setStatus(opt.value)}
              className={cn(
                "shrink-0 rounded-lg px-3.5 py-1.5 text-xs font-medium capitalize transition-colors",
                status === opt.value
                  ? "bg-accent-600 text-text-onAccent"
                  : "bg-sunken text-text-secondary hover:text-text-primary",
              )}
            >
              {opt.label === "all" ? "All Categories" : opt.label}
            </button>
          ))}
        </div>
        {filtersActive && (
          <button
            type="button"
            onClick={() => setStatus("all")}
            className="ml-auto shrink-0 rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-text-secondary hover:text-text-primary"
          >
            Reset Filters
          </button>
        )}
      </div>

      {isLoading && (
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <ProjectCard.Skeleton key={i} />
          ))}
        </div>
      )}

      {isError && <ErrorState title="Couldn't load projects" onRetry={() => refetch()} />}

      {/* Centered empty state with reset (C1 pattern) */}
      {!isLoading && !isError && projects.length === 0 && (
        <div className="mt-4 rounded-2xl border border-border bg-raised py-16 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-sunken text-text-muted">
            <FolderKanban className="h-6 w-6" />
          </div>
          <h3 className="mt-3 text-sm font-semibold text-text-primary">
            No matching projects found
          </h3>
          <p className="mx-auto mt-1 max-w-sm text-xs text-text-secondary">
            Try adjusting your filters — or post a new project to recruit collaborators!
          </p>
          {filtersActive && (
            <button
              type="button"
              onClick={() => setStatus("all")}
              className="mt-4 rounded-lg bg-accent-600 px-3 py-1.5 text-xs font-medium text-text-onAccent"
            >
              Reset Filters
            </button>
          )}
        </div>
      )}

      {!isLoading && !isError && projects.length > 0 && (
        <>
          <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
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
                className="min-h-[44px] rounded-lg border border-border px-4 py-2 text-sm text-text-primary transition-colors hover:bg-sunken disabled:opacity-50"
              >
                {isFetchingNextPage ? "Loading..." : "Load more"}
              </button>
            </div>
          )}
        </>
      )}

      {isCreateOpen && (
        <div className="z-dialog fixed inset-0 flex items-center justify-center bg-overlay p-4">
          <div className="w-full max-w-md rounded-2xl border border-border bg-raised p-6 shadow-lg">
            <div className="mb-4 flex items-center justify-between">
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
  const [problemStatement, setProblemStatement] = useState("");
  const [solutionDescription, setSolutionDescription] = useState("");
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
        problemStatement: problemStatement.trim() || undefined,
        solutionDescription: solutionDescription.trim() || undefined,
        status,
      });
      onSuccess();
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="rounded-md bg-danger-100 p-3 text-sm text-danger-600">{error}</div>
      )}
      <div>
        <label htmlFor="name" className="mb-1 block text-sm font-medium text-text-primary">
          Project name *
        </label>
        <input
          id="name"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full rounded-lg border border-border bg-canvas px-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-accent-500"
          placeholder="e.g., AI-Powered Cancer Detection"
          required
          disabled={isSubmitting}
        />
      </div>
      <div>
        <label htmlFor="description" className="mb-1 block text-sm font-medium text-text-primary">
          Short description
        </label>
        <textarea
          id="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={2}
          className="w-full rounded-lg border border-border bg-canvas px-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-accent-500"
          placeholder="What is this project?"
          disabled={isSubmitting}
        />
      </div>
      <div>
        <label htmlFor="problem" className="mb-1 block text-sm font-medium text-text-primary">
          The problem
        </label>
        <textarea
          id="problem"
          value={problemStatement}
          onChange={(e) => setProblemStatement(e.target.value)}
          rows={2}
          className="w-full rounded-lg border border-border bg-canvas px-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-accent-500"
          placeholder="What problem is this project solving?"
          disabled={isSubmitting}
        />
      </div>
      <div>
        <label htmlFor="solution" className="mb-1 block text-sm font-medium text-text-primary">
          What you're building
        </label>
        <textarea
          id="solution"
          value={solutionDescription}
          onChange={(e) => setSolutionDescription(e.target.value)}
          rows={2}
          className="w-full rounded-lg border border-border bg-canvas px-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-accent-500"
          placeholder="What will exist when the project is done?"
          disabled={isSubmitting}
        />
      </div>
      <div>
        <label htmlFor="status" className="mb-1 block text-sm font-medium text-text-primary">
          Status
        </label>
        <select
          id="status"
          value={status}
          onChange={(e) => setStatus(e.target.value as ProjectStatus)}
          className="w-full rounded-lg border border-border bg-canvas px-3 py-2 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-accent-500"
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
          className="rounded-lg border border-border px-4 py-2 text-sm text-text-primary transition-colors hover:bg-sunken disabled:opacity-50"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isSubmitting || !name.trim()}
          className="rounded-lg bg-accent-600 px-4 py-2 text-sm font-medium text-text-onAccent transition-colors hover:bg-accent-700 disabled:opacity-50"
        >
          {isSubmitting ? "Creating..." : "Create Project"}
        </button>
      </div>
    </form>
  );
}
