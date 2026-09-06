import { Link } from "react-router-dom";
import { Users } from "lucide-react";
import type { ProjectSummary } from "@/services/api/projects";
import { SkillBadge } from "@/components/ui/Badge";
import { Skeleton } from "@/components/ui/Skeleton";
import { cn } from "@/lib/utils";

/**
 * ProjectCard — ARCHITECTURE.md §5. Status pill deliberately uses the
 * same neutral bg-sunken/text-secondary treatment for every status value
 * rather than inventing a red/yellow/green semantic mapping — tokens.css
 * only has accent/success/danger color stops (see ErrorState.tsx's doc
 * comment for the same constraint), and a real status-color system is a
 * design decision for whoever owns tokens.css, not something to improvise
 * per-component.
 */
export function ProjectCard({
  project,
  className,
}: {
  project: ProjectSummary;
  className?: string;
}): JSX.Element {
  return (
    <Link
      to={`/projects/${project.id}`}
      className={cn(
        "flex flex-col gap-3 rounded-lg border border-border bg-raised p-4 transition-colors hover:border-accent-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)]",
        className,
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="truncate font-medium text-text-primary">{project.name}</p>
          <p className="mt-0.5 line-clamp-2 text-sm text-text-secondary">
            {project.description}
          </p>
        </div>
        {project.logoUrl && (
          <img
            src={project.logoUrl}
            alt=""
            className="h-10 w-10 flex-shrink-0 rounded-md object-cover"
          />
        )}
      </div>

      <div className="flex flex-wrap items-center gap-1.5">
        <span className="inline-flex items-center rounded-full bg-sunken px-2.5 py-0.5 text-xs font-medium capitalize text-text-secondary">
          {project.status}
        </span>
        {project.skillsNeeded.slice(0, 3).map(({ skill }) => (
          <SkillBadge key={skill} skill={skill} />
        ))}
      </div>

      <div className="flex items-center gap-1.5 text-xs text-text-muted">
        <Users className="h-3.5 w-3.5" aria-hidden="true" />
        {project.memberCount} member{project.memberCount === 1 ? "" : "s"}
      </div>
    </Link>
  );
}

ProjectCard.Skeleton = function ProjectCardSkeleton(): JSX.Element {
  return (
    <div className="flex flex-col gap-3 rounded-lg border border-border bg-raised p-4">
      <Skeleton className="h-4 w-2/3" />
      <Skeleton className="h-3 w-full" />
      <Skeleton className="h-3 w-4/5" />
      <div className="flex gap-1.5">
        <Skeleton className="h-5 w-16 rounded-full" />
        <Skeleton className="h-5 w-14 rounded-full" />
      </div>
    </div>
  );
};
