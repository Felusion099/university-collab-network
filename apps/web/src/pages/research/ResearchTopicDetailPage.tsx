import { useParams, Link } from "react-router-dom";
import { ArrowLeft, FlaskConical, Users, BookOpen } from "lucide-react";
import { useResearchTopic } from "@/hooks/useResearch";
import { Skeleton } from "@/components/ui/Skeleton";
import { ErrorState } from "@/components/ui/ErrorState";
import { EmptyState } from "@/components/ui/EmptyState";

export default function ResearchTopicDetailPage(): JSX.Element {
  const { topic: slug } = useParams<{ topic: string }>();
  const { data: topic, isLoading, isError, refetch } = useResearchTopic(slug);

  return (
    <div className="space-y-6">
      <Link
        to="/research"
        className="inline-flex items-center gap-1.5 text-sm text-text-secondary hover:text-text-primary"
      >
        <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
        Back to research topics
      </Link>

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
  );
}
