import { useParams, Link } from "react-router-dom";
import { ArrowLeft, FolderX, GitFork, ExternalLink, FileText, Users } from "lucide-react";
import { useProject } from "@/hooks/useProjects";
import { SkillBadge } from "@/components/ui/Badge";
import { Skeleton } from "@/components/ui/Skeleton";
import { ErrorState } from "@/components/ui/ErrorState";
import { EmptyState } from "@/components/ui/EmptyState";

export default function ProjectDetailPage(): JSX.Element {
  const { id } = useParams<{ id: string }>();
  const { data: project, isLoading, isError, refetch } = useProject(id);

  return (
    <div className="space-y-6">
      <Link
        to="/projects"
        className="inline-flex items-center gap-1.5 text-sm text-text-secondary hover:text-text-primary"
      >
        <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
        Back to projects
      </Link>

      {isLoading && (
        <div className="space-y-3">
          <Skeleton className="h-7 w-1/3" />
          <Skeleton className="h-4 w-2/3" />
          <Skeleton className="h-24 w-full" />
        </div>
      )}

      {isError && <ErrorState title="Couldn't load this project" onRetry={() => refetch()} />}

      {!isLoading && !isError && !project && (
        <EmptyState icon={FolderX} title="Project not found" />
      )}

      {!isLoading && !isError && project && (
        <div className="space-y-6">
          <div className="flex items-start gap-4">
            {project.logoUrl && (
              <img
                src={project.logoUrl}
                alt=""
                className="h-14 w-14 flex-shrink-0 rounded-md object-cover"
              />
            )}
            <div>
              <h1 className="text-xl font-semibold text-text-primary">{project.name}</h1>
              <div className="mt-1 flex items-center gap-2 text-sm text-text-secondary">
                <span className="capitalize">{project.status}</span>
                <span aria-hidden="true">·</span>
                <span className="flex items-center gap-1">
                  <Users className="h-3.5 w-3.5" aria-hidden="true" />
                  {project.memberCount} member{project.memberCount === 1 ? "" : "s"}
                </span>
              </div>
            </div>
          </div>

          {project.problemStatement && (
            <section>
              <h2 className="mb-1 text-sm font-semibold uppercase tracking-wide text-text-muted">
                Problem
              </h2>
              <p className="text-sm text-text-primary">{project.problemStatement}</p>
            </section>
          )}

          {project.solutionDescription && (
            <section>
              <h2 className="mb-1 text-sm font-semibold uppercase tracking-wide text-text-muted">
                Solution
              </h2>
              <p className="text-sm text-text-primary">{project.solutionDescription}</p>
            </section>
          )}

          {project.skillsNeeded.length > 0 && (
            <section>
              <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-text-muted">
                Looking for
              </h2>
              <div className="flex flex-wrap gap-1.5">
                {project.skillsNeeded.map(({ skill, role }) => (
                  <SkillBadge key={skill} skill={`${skill} (${role})`} />
                ))}
              </div>
            </section>
          )}

          {(project.githubUrl || project.demoUrl || project.docsUrl) && (
            <section className="flex flex-wrap gap-3">
              {project.githubUrl && (
                <a
                  href={project.githubUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-1.5 rounded-md border border-border px-3 py-1.5 text-sm text-text-primary hover:bg-sunken"
                >
                  <GitFork className="h-4 w-4" aria-hidden="true" />
                  GitHub
                </a>
              )}
              {project.demoUrl && (
                <a
                  href={project.demoUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-1.5 rounded-md border border-border px-3 py-1.5 text-sm text-text-primary hover:bg-sunken"
                >
                  <ExternalLink className="h-4 w-4" aria-hidden="true" />
                  Demo
                </a>
              )}
              {project.docsUrl && (
                <a
                  href={project.docsUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-1.5 rounded-md border border-border px-3 py-1.5 text-sm text-text-primary hover:bg-sunken"
                >
                  <FileText className="h-4 w-4" aria-hidden="true" />
                  Docs
                </a>
              )}
            </section>
          )}
        </div>
      )}
    </div>
  );
}
