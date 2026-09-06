import { useParams, Link } from "react-router-dom";
import { ArrowLeft, Users2, Users } from "lucide-react";
import { useOrganization } from "@/hooks/useOrganizations";
import { Skeleton } from "@/components/ui/Skeleton";
import { ErrorState } from "@/components/ui/ErrorState";
import { EmptyState } from "@/components/ui/EmptyState";

export default function ClubDetailPage(): JSX.Element {
  const { id } = useParams<{ id: string }>();
  const { data: org, isLoading, isError, refetch } = useOrganization(id);

  return (
    <div className="space-y-6">
      <Link
        to="/clubs"
        className="inline-flex items-center gap-1.5 text-sm text-text-secondary hover:text-text-primary"
      >
        <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
        Back to clubs
      </Link>

      {isLoading && (
        <div className="space-y-3">
          <Skeleton className="h-7 w-1/2" />
          <Skeleton className="h-16 w-full" />
        </div>
      )}

      {isError && <ErrorState title="Couldn't load this club" onRetry={() => refetch()} />}

      {!isLoading && !isError && !org && <EmptyState icon={Users2} title="Club not found" />}

      {!isLoading && !isError && org && (
        <div className="space-y-4">
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
              {org.category && <p className="text-sm text-text-secondary">{org.category}</p>}
              <span className="mt-1 flex items-center gap-1.5 text-sm text-text-secondary">
                <Users className="h-4 w-4" aria-hidden="true" />
                {org.memberCount} members
              </span>
            </div>
          </div>
          {org.description && <p className="text-sm text-text-primary">{org.description}</p>}
        </div>
      )}
    </div>
  );
}
