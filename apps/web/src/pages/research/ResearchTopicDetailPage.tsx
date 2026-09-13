import { useParams, Link } from "react-router-dom";
import { ArrowLeft, FlaskConical, Users, BookOpen, Plus, X } from "lucide-react";
import { useState } from "react";
import { useResearchTopic } from "@/hooks/useResearch";
import { Skeleton } from "@/components/ui/Skeleton";
import { ErrorState } from "@/components/ui/ErrorState";
import { EmptyState } from "@/components/ui/EmptyState";
import { useSessionStore } from "@/stores/session.store";
import { apiFetch } from "@/services/api/client";

export default function ResearchTopicDetailPage(): JSX.Element {
  const { topic: slug } = useParams<{ topic: string }>();
  const { data: topic, isLoading, isError, refetch } = useResearchTopic(slug);
  const { user } = useSessionStore();
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  return (
    <>
      <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <Link
          to="/research"
          className="inline-flex items-center gap-1.5 text-sm text-text-secondary hover:text-text-primary"
        >
          <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
          Back to research topics
        </Link>
        {(user?.role === "professor") && (
          <button
            type="button"
            onClick={() => setIsCreateOpen(true)}
            className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            <Plus className="h-4 w-4" />
            Create Publication
          </button>
        )}
      </div>

      {isLoading && (
        <div className="space-y-3">
          <Skeleton className="h-7 w-1/2" />
          <Skeleton className="h-16 w-full" />
        </div>
      )}

      {isError && <ErrorState title="Couldn't load this topic" onRetry={() => refetch()} />}

      {!isLoading && !isError && !topic && (
        <EmptyState icon={FlaskConical} title="Topic not found" />
      )}

      {!isLoading && !isError && topic && (
        <div className="space-y-4">
          <div>
            <h1 className="text-xl font-semibold text-text-primary">{topic.name}</h1>
            {topic.parentTopicName && (
              <p className="mt-0.5 text-sm text-text-secondary">Part of {topic.parentTopicName}</p>
            )}
          </div>
          {topic.description && <p className="text-sm text-text-primary">{topic.description}</p>}
          <div className="flex gap-4 text-sm text-text-secondary">
            <span className="flex items-center gap-1.5">
              <Users className="h-4 w-4" aria-hidden="true" />
              {topic.teamCount} team{topic.teamCount === 1 ? "" : "s"}
            </span>
            <span className="flex items-center gap-1.5">
              <BookOpen className="h-4 w-4" aria-hidden="true" />
              {topic.publicationCount} publication{topic.publicationCount === 1 ? "" : "s"}
            </span>
          </div>
        </div>
      )}
    </div>
    <div className={isCreateOpen ? "fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" : "hidden"}>
      <div className="w-full max-w-md rounded-lg bg-surface p-6 shadow-xl">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-text-primary">Create Publication</h2>
          <button
            type="button"
            onClick={() => setIsCreateOpen(false)}
            className="text-text-secondary hover:text-text-primary transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <CreatePublicationForm topicSlug={slug ?? ""} onClose={() => setIsCreateOpen(false)} onSuccess={() => refetch()} />
      </div>
    </div>
    </>
  );
}

function CreatePublicationForm({
  topicSlug,
  onClose,
  onSuccess,
}: {
  topicSlug: string;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [title, setTitle] = useState("");
  const [abstract, setAbstract] = useState("");
  const [journalOrConference, setJournalOrConference] = useState("");
  const [publishedDate, setPublishedDate] = useState("");
  const [doi, setDoi] = useState("");
  const [externalUrl, setExternalUrl] = useState("");
  const [pdfUrl, setPdfUrl] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    setIsSubmitting(true);
    setError(null);
    try {
      await apiFetch("/publications", {
        method: "POST",
        body: {
          title: title.trim(),
          abstract: abstract.trim() || undefined,
          journalOrConference: journalOrConference.trim() || undefined,
          publishedDate: publishedDate || undefined,
          doi: doi.trim() || undefined,
          externalUrl: externalUrl.trim() || undefined,
          pdfUrl: pdfUrl.trim() || undefined,
          topicIds: topicSlug ? [topicSlug] : [],
        },
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
        <label htmlFor="title" className="block text-sm font-medium text-text-primary mb-1">
          Title *
        </label>
        <input
          id="title"
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-ring"
          placeholder="e.g., Deep Learning for Protein Folding"
          required
          disabled={isSubmitting}
        />
      </div>
      <div>
        <label htmlFor="abstract" className="block text-sm font-medium text-text-primary mb-1">
          Abstract
        </label>
        <textarea
          id="abstract"
          value={abstract}
          onChange={(e) => setAbstract(e.target.value)}
          rows={3}
          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-ring"
          placeholder="Brief abstract of the publication..."
          disabled={isSubmitting}
        />
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="journalOrConference" className="block text-sm font-medium text-text-primary mb-1">
            Journal / Conference
          </label>
          <input
            id="journalOrConference"
            type="text"
            value={journalOrConference}
            onChange={(e) => setJournalOrConference(e.target.value)}
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-ring"
            placeholder="e.g., Nature"
            disabled={isSubmitting}
          />
        </div>
        <div>
          <label htmlFor="publishedDate" className="block text-sm font-medium text-text-primary mb-1">
            Published Date
          </label>
          <input
            id="publishedDate"
            type="date"
            value={publishedDate}
            onChange={(e) => setPublishedDate(e.target.value)}
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-ring"
            disabled={isSubmitting}
          />
        </div>
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="doi" className="block text-sm font-medium text-text-primary mb-1">
            DOI
          </label>
          <input
            id="doi"
            type="text"
            value={doi}
            onChange={(e) => setDoi(e.target.value)}
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-ring"
            placeholder="10.xxxx/xxxxx"
            disabled={isSubmitting}
          />
        </div>
        <div>
          <label htmlFor="externalUrl" className="block text-sm font-medium text-text-primary mb-1">
            External URL
          </label>
          <input
            id="externalUrl"
            type="url"
            value={externalUrl}
            onChange={(e) => setExternalUrl(e.target.value)}
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-ring"
            placeholder="https://..."
            disabled={isSubmitting}
          />
        </div>
      </div>
      <div>
        <label htmlFor="pdfUrl" className="block text-sm font-medium text-text-primary mb-1">
          PDF URL
        </label>
        <input
          id="pdfUrl"
          type="url"
          value={pdfUrl}
          onChange={(e) => setPdfUrl(e.target.value)}
          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-ring"
          placeholder="https://.../paper.pdf"
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
          disabled={isSubmitting || !title.trim()}
          className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50"
        >
          {isSubmitting ? "Creating..." : "Create Publication"}
        </button>
      </div>
    </form>
  );
}
