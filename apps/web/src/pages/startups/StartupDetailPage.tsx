import { useParams, Link } from "react-router-dom";
import { ArrowLeft, Rocket, ExternalLink } from "lucide-react";
import { useOrganization } from "@/hooks/useOrganizations";
import { Skeleton } from "@/components/ui/Skeleton";
import { ErrorState } from "@/components/ui/ErrorState";
import { EmptyState } from "@/components/ui/EmptyState";

export default function StartupDetailPage(): JSX.Element {
  const { id } = useParams<{ id: string }>();
  const { data: org, isLoading, isError, refetch } = useOrganization(id);
  const details = org?.startupDetails;

  return (
    <div className="space-y-6">
      <Link
        to="/startups"
        className="inline-flex items-center gap-1.5 text-sm text-text-secondary hover:text-text-primary"
      >
        <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
        Back to startups
      </Link>

      {isLoading && (
        <div className="space-y-3">
          <Skeleton className="h-7 w-1/2" />
          <Skeleton className="h-16 w-full" />
        </div>
      )}

      {isError && <ErrorState title="Couldn't load this startup" onRetry={() => refetch()} />}

      {!isLoading && !isError && !org && <EmptyState icon={Rocket} title="Startup not found" />}

      {!isLoading && !isError && org && (
        <div className="space-y-4">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-4">
              {org.logoUrl ? (
                <img
                  src={org.logoUrl}
                  alt=""
                  className="h-14 w-14 flex-shrink-0 rounded-md object-cover"
                />
              ) : (
                <div
                  aria-hidden="true"
                  className="flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-md bg-accent-100 text-lg font-semibold text-accent-700"
                >
                  {org.name[0]?.toUpperCase()}
                </div>
              )}
              <div>
                <h1 className="text-xl font-semibold text-text-primary">{org.name}</h1>
                {details?.industry && (
                  <p className="text-sm text-text-secondary">{details.industry}</p>
                )}
              </div>
            </div>
            {details?.hiring && (
              <span className="flex-shrink-0 rounded-full bg-success-100 px-2.5 py-1 text-xs font-medium text-success-600">
                Hiring
              </span>
            )}
          </div>

          {org.description && <p className="text-sm text-text-primary">{org.description}</p>}

          <div className="flex flex-wrap items-center gap-3 text-sm text-text-secondary">
            {details?.stage && <span>{details.stage}</span>}
            {details?.websiteUrl && (
              <a
                href={details.websiteUrl}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-1 text-accent-700 hover:underline"
              >
                Website
                <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
              </a>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
