import { Link } from "react-router-dom";
import { CalendarClock, Building2 } from "lucide-react";
import type { OpportunitySummary } from "@/services/api/opportunities";
import { Skeleton } from "@/components/ui/Skeleton";
import { cn, formatDate } from "@/lib/utils";

const OPPORTUNITY_TYPE_LABEL: Record<OpportunitySummary["opportunityType"], string> = {
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

/** OpportunityCard — ARCHITECTURE.md §5. */
export function OpportunityCard({
  opportunity,
  className,
}: {
  opportunity: OpportunitySummary;
  className?: string;
}): JSX.Element {
  return (
    <Link
      to={`/opportunities/${opportunity.id}`}
      className={cn(
        "flex flex-col gap-2 rounded-lg border border-border bg-raised p-4 transition-colors hover:border-accent-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)]",
        className,
      )}
    >
      <span className="inline-flex w-fit items-center rounded-full bg-accent-100 px-2.5 py-0.5 text-xs font-medium text-accent-700">
        {OPPORTUNITY_TYPE_LABEL[opportunity.opportunityType]}
      </span>
      <p className="font-medium text-text-primary">{opportunity.title}</p>
      {opportunity.description && (
        <p className="line-clamp-2 text-sm text-text-secondary">{opportunity.description}</p>
      )}
      <div className="flex flex-col gap-1 text-sm text-text-secondary">
        {opportunity.providerName && (
          <span className="flex items-center gap-1.5">
            <Building2 className="h-3.5 w-3.5 flex-shrink-0" aria-hidden="true" />
            {opportunity.providerName}
          </span>
        )}
        {opportunity.deadline && (
          <span className="flex items-center gap-1.5">
            <CalendarClock className="h-3.5 w-3.5 flex-shrink-0" aria-hidden="true" />
            Apply by {formatDate(opportunity.deadline)}
          </span>
        )}
      </div>
    </Link>
  );
}

OpportunityCard.Skeleton = function OpportunityCardSkeleton(): JSX.Element {
  return (
    <div className="flex flex-col gap-2 rounded-lg border border-border bg-raised p-4">
      <Skeleton className="h-5 w-24 rounded-full" />
      <Skeleton className="h-4 w-2/3" />
      <Skeleton className="h-3 w-full" />
      <Skeleton className="h-3 w-1/2" />
    </div>
  );
};
