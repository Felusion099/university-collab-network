import { useState } from "react";
import { Briefcase } from "lucide-react";
import type { OpportunityType } from "@app/shared-types";
import { useOpportunitiesList } from "@/hooks/useOpportunities";
import { OpportunityCard } from "@/components/cards/OpportunityCard";
import { FilterPanel } from "@/components/FilterPanel";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";

const OPPORTUNITY_TYPE_OPTIONS: { value: OpportunityType; label: string }[] = [
  { value: "research", label: "Research" },
  { value: "internship", label: "Internship" },
  { value: "project", label: "Project" },
  { value: "startup", label: "Startup" },
  { value: "volunteer", label: "Volunteer" },
  { value: "club", label: "Club" },
  { value: "hackathon", label: "Hackathon" },
  { value: "mentorship", label: "Mentorship" },
  { value: "thesis", label: "Thesis" },
  { value: "research_assistant", label: "Research Assistant" },
  { value: "teaching_assistant", label: "Teaching Assistant" },
];

export default function OpportunitiesListPage(): JSX.Element {
  const [opportunityType, setOpportunityType] = useState<OpportunityType | undefined>(undefined);
  const { data, isLoading, isError, refetch, fetchNextPage, hasNextPage, isFetchingNextPage } =
    useOpportunitiesList({ opportunityType });

  const opportunities = data?.pages.flatMap((page) => page.data) ?? [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-text-primary">Opportunities</h1>
        <p className="mt-1 text-sm text-text-secondary">
          Research assistant roles, internships, TA positions, and more.
        </p>
      </div>

      <div className="flex flex-col gap-6 md:flex-row">
        <FilterPanel
          className="w-full flex-shrink-0 md:w-48"
          groups={[{ label: "Type", key: "opportunityType", options: OPPORTUNITY_TYPE_OPTIONS }]}
          activeValues={{ opportunityType }}
          onChange={(_key, value) => setOpportunityType(value as OpportunityType | undefined)}
        />

        <div className="min-w-0 flex-1 space-y-6">
          {isLoading && (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {Array.from({ length: 6 }).map((_, i) => (
                // eslint-disable-next-line react/no-array-index-key -- static skeleton count, never reordered
                <OpportunityCard.Skeleton key={i} />
              ))}
            </div>
          )}

          {isError && (
            <ErrorState title="Couldn't load opportunities" onRetry={() => refetch()} />
          )}

          {!isLoading && !isError && opportunities.length === 0 && (
            <EmptyState
              icon={Briefcase}
              title="No opportunities match this filter"
              description="Try a different type, or check back once more are posted."
            />
          )}

          {!isLoading && !isError && opportunities.length > 0 && (
            <>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {opportunities.map((opportunity) => (
                  <OpportunityCard key={opportunity.id} opportunity={opportunity} />
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
