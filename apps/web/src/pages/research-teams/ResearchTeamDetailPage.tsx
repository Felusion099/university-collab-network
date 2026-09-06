import { useParams, Link } from "react-router-dom";
import { ArrowLeft, Users2, User, Users } from "lucide-react";
import { useResearchTeam } from "@/hooks/useResearchTeams";
import { SkillBadge } from "@/components/ui/Badge";
import { Skeleton } from "@/components/ui/Skeleton";
import { ErrorState } from "@/components/ui/ErrorState";
import { EmptyState } from "@/components/ui/EmptyState";

export default function ResearchTeamDetailPage(): JSX.Element {
  const { id } = useParams<{ id: string }>();
  const { data: team, isLoading, isError, refetch } = useResearchTeam(id);

  return (
    <div className="space-y-6">
      <Link
        to="/research-teams"
        className="inline-flex items-center gap-1.5 text-sm text-text-secondary hover:text-text-primary"
      >
        <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
        Back to research teams
      </Link>

      {isLoading && (
        <div className="space-y-3">
          <Skeleton className="h-7 w-1/2" />
          <Skeleton className="h-16 w-full" />
        </div>
      )}

      {isError && <ErrorState title="Couldn't load this team" onRetry={() => refetch()} />}

      {!isLoading && !isError && !team && (
        <EmptyState icon={Users2} title="Research team not found" />
      )}

      {!isLoading && !isError && team && (
        <div className="space-y-4">
          <div>
            <h1 className="text-xl font-semibold text-text-primary">{team.name}</h1>
            <div className="mt-1 flex gap-4 text-sm text-text-secondary">
              <span className="flex items-center gap-1.5">
                <User className="h-4 w-4" aria-hidden="true" />
                {team.piName} (PI)
              </span>
              <span className="flex items-center gap-1.5">
                <Users className="h-4 w-4" aria-hidden="true" />
                {team.memberCount} members
              </span>
            </div>
          </div>
          {team.description && <p className="text-sm text-text-primary">{team.description}</p>}
          {team.topicNames.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {team.topicNames.map((topic) => (
                <SkillBadge key={topic} skill={topic} />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
