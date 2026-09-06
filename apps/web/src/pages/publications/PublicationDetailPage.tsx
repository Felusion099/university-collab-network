import { useParams, Link } from "react-router-dom";
import { ArrowLeft, BookOpen, ExternalLink, FileText } from "lucide-react";
import { usePublication } from "@/hooks/usePublications";
import { Skeleton } from "@/components/ui/Skeleton";
import { ErrorState } from "@/components/ui/ErrorState";
import { EmptyState } from "@/components/ui/EmptyState";
import { formatDate } from "@/lib/utils";

export default function PublicationDetailPage(): JSX.Element {
  const { id } = useParams<{ id: string }>();
  const { data: publication, isLoading, isError, refetch } = usePublication(id);

  return (
    <div className="space-y-6">
      <Link
        to="/publications"
        className="inline-flex items-center gap-1.5 text-sm text-text-secondary hover:text-text-primary"
      >
        <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
        Back to publications
      </Link>

      {isLoading && (
        <div className="space-y-3">
          <Skeleton className="h-7 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
          <Skeleton className="h-20 w-full" />
        </div>
      )}

      {isError && <ErrorState title="Couldn't load this publication" onRetry={() => refetch()} />}

      {!isLoading && !isError && !publication && (
        <EmptyState icon={BookOpen} title="Publication not found" />
      )}

      {!isLoading && !isError && publication && (
        <div className="space-y-6">
          <div>
            <h1 className="text-xl font-semibold text-text-primary">{publication.title}</h1>
            <p className="mt-1 text-sm text-text-secondary">
              {publication.authorNames.join(", ")}
            </p>
            <p className="mt-1 text-xs text-text-muted">
              {[
                publication.journalOrConference,
                publication.publishedDate && formatDate(publication.publishedDate),
                publication.doi && `DOI: ${publication.doi}`,
              ]
                .filter(Boolean)
                .join(" · ")}
            </p>
          </div>

          {publication.abstract && (
            <section>
              <h2 className="mb-1 text-sm font-semibold uppercase tracking-wide text-text-muted">
                Abstract
              </h2>
              <p className="text-sm text-text-primary">{publication.abstract}</p>
            </section>
          )}

          {(publication.externalUrl || publication.pdfUrl) && (
            <section className="flex flex-wrap gap-3">
              {publication.externalUrl && (
                <a
                  href={publication.externalUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-1.5 rounded-md border border-border px-3 py-1.5 text-sm text-text-primary hover:bg-sunken"
                >
                  <ExternalLink className="h-4 w-4" aria-hidden="true" />
                  View publication
                </a>
              )}
              {publication.pdfUrl && (
                <a
                  href={publication.pdfUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-1.5 rounded-md border border-border px-3 py-1.5 text-sm text-text-primary hover:bg-sunken"
                >
                  <FileText className="h-4 w-4" aria-hidden="true" />
                  PDF
                </a>
              )}
            </section>
          )}
        </div>
      )}
    </div>
  );
}
