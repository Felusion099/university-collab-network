import { useParams, Link } from "react-router-dom";
import { ArrowLeft, Briefcase, Building2, CalendarClock, Tag } from "lucide-react";
import { useOpportunity } from "@/hooks/useOpportunities";
import { Skeleton } from "@/components/ui/Skeleton";
import { ErrorState } from "@/components/ui/ErrorState";
import { EmptyState } from "@/components/ui/EmptyState";
import { formatDate } from "@/lib/utils";

const OPPORTUNITY_TYPE_LABEL: Record<string, string> = {
  research: "Research",
  internship: "Internship",
  project: "Project",
  startup: "Startup",
  volunteer: "Volunteer",
  club: "Club",
  hackathon: "Hackathon",
  mentorship: "Mentorship",
  thesis: "Thesis",
  research_assistant: "Research Assistant",
  teaching_assistant: "Teaching Assistant",
};

export default function OpportunityDetailPage(): JSX.Element {
  const { id } = useParams<{ id: string }>();
  const { data: opportunity, isLoading, isError, refetch } = useOpportunity(id);

  return (
    <div className="space-y-6">
      <Link
        to="/opportunities"
        className="inline-flex items-center gap-1.5 text-sm text-text-secondary hover:text-text-primary"
      >
        <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
        Back to opportunities
      </Link>

      {isLoading && (
        <div className="space-y-3">
          <Skeleton className="h-7 w-2/3" />
          <Skeleton className="h-4 w-1/3" />
          <Skeleton className="h-20 w-full" />
        </div>
      )}

      {isError && (
        <ErrorState title="Couldn't load this opportunity" onRetry={() => refetch()} />
      )}

      {!isLoading && !isError && !opportunity && (
        <EmptyState icon={Briefcase} title="Opportunity not found" />
      )}

      {!isLoading && !isError && opportunity && (
        <div className="space-y-6">
          <div>
            <span className="inline-flex w-fit items-center rounded-full bg-accent-100 px-2.5 py-0.5 text-xs font-medium text-accent-700">
              {OPPORTUNITY_TYPE_LABEL[opportunity.opportunityType] ??
                opportunity.opportunityType}
            </span>
            <h1 className="mt-2 text-xl font-semibold text-text-primary">
              {opportunity.title}
            </h1>
          </div>

          <div className="flex flex-col gap-2 text-sm text-text-primary">
            {opportunity.providerName && (
              <span className="flex items-center gap-1.5">
                <Building2 className="h-4 w-4 flex-shrink-0 text-text-muted" aria-hidden="true" />
                {opportunity.providerName}
              </span>
            )}
            {opportunity.deadline && (
              <span className="flex items-center gap-1.5">
                <CalendarClock
                  className="h-4 w-4 flex-shrink-0 text-text-muted"
                  aria-hidden="true"
                />
                Apply by {formatDate(opportunity.deadline)}
              </span>
            )}
            {opportunity.departmentTag && (
              <span className="flex items-center gap-1.5">
                <Tag className="h-4 w-4 flex-shrink-0 text-text-muted" aria-hidden="true" />
                {opportunity.departmentTag}
              </span>
            )}
          </div>

          {opportunity.description && (
            <p className="text-sm text-text-primary">{opportunity.description}</p>
          )}

          {/* Apply flow (POST /applications, CreateApplicationRequestSchema) is
              Phase 8+ integration work — not built this session; a static
              "Apply" button with no working submit would be worse than none. */}
        </div>
      )}
    </div>
  );
}
