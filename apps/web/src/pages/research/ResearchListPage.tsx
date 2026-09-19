import { useState } from "react";
import { FlaskConical, Users, BookOpen, Plus, X } from "lucide-react";
import { useResearchTopicsList } from "@/hooks/useResearch";
import { ResearchCard } from "@/components/cards/ResearchCard";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import { useSessionStore } from "@/stores/session.store";
import { apiFetch } from "@/services/api/client";

export default function ResearchListPage(): JSX.Element {
  const { data, isLoading, isError, refetch, fetchNextPage, hasNextPage, isFetchingNextPage } =
    useResearchTopicsList({});
  const { user } = useSessionStore();
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  const topics = data?.pages.flatMap((page) => page.data) ?? [];

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 border-b border-border pb-6 md:flex-row md:items-end">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-text-primary">Research</h1>
          <p className="mt-1 text-sm text-text-secondary">
            Browse active research areas and the teams working on them.
          </p>
        </div>
        <span className="text-xs text-text-muted">
          <strong className="text-text-primary">{topics.length}</strong> active{" "}
          {topics.length === 1 ? "area" : "areas"}
        </span>
        {(user?.role === "professor") && (
          <button
            type="button"
            onClick={() => setIsCreateOpen(true)}
            className="inline-flex items-center gap-2 rounded-md bg-accent-600 px-4 py-2 text-sm font-medium text-text-onAccent transition-colors hover:bg-accent-700"
          >
            <Plus className="h-4 w-4" />
            Create Topic
          </button>
        )}
      </div>

      {isLoading && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
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
      {isCreateOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-lg bg-raised p-6 shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-text-primary">Create Research Topic</h2>
              <button
                type="button"
                onClick={() => setIsCreateOpen(false)}
                className="text-text-secondary hover:text-text-primary transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <CreateResearchTopicForm onClose={() => setIsCreateOpen(false)} onSuccess={() => refetch()} />
          </div>
        </div>
      )}
    </div>
  );
}

function CreateResearchTopicForm({
  onClose,
  onSuccess,
}: {
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setIsSubmitting(true);
    setError(null);
    try {
      await apiFetch("/research-topics/professor", {
        method: "POST",
        body: { name: name.trim(), description: description.trim() || undefined },
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
        <div className="rounded-md bg-danger-100 p-3 text-sm text-danger-600">{error}</div>
      )}
      <div>
        <label htmlFor="name" className="block text-sm font-medium text-text-primary mb-1">
          Topic Name *
        </label>
        <input
          id="name"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full rounded-md border border-border bg-canvas px-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-accent-500"
          placeholder="e.g., Machine Learning for Healthcare"
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
          className="w-full rounded-md border border-border bg-canvas px-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-accent-500"
          placeholder="Brief description of the research area..."
          disabled={isSubmitting}
        />
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
          className="rounded-md bg-accent-600 px-4 py-2 text-sm font-medium text-text-onAccent transition-colors hover:bg-accent-700 disabled:opacity-50"
        >
          {isSubmitting ? "Creating..." : "Create Topic"}
        </button>
      </div>
    </form>
  );
}
