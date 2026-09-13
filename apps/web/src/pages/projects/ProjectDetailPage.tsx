import { useParams, Link } from "react-router-dom";
import { ArrowLeft, FolderX, GitFork, ExternalLink, FileText, Users, UserPlus, X } from "lucide-react";
import { useState } from "react";
import { useProject } from "@/hooks/useProjects";
import { SkillBadge } from "@/components/ui/Badge";
import { Skeleton } from "@/components/ui/Skeleton";
import { ErrorState } from "@/components/ui/ErrorState";
import { EmptyState } from "@/components/ui/EmptyState";
import { useSessionStore } from "@/stores/session.store";
import { apiFetch } from "@/services/api/client";

export default function ProjectDetailPage(): JSX.Element {
  const { id } = useParams<{ id: string }>();
  const { data: project, isLoading, isError, refetch } = useProject(id);
  const { user } = useSessionStore();
  const [isAddMemberOpen, setIsAddMemberOpen] = useState(false);

  return (
    <>
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
            {(user?.role === "professor") && (
              <button
                type="button"
                onClick={() => setIsAddMemberOpen(true)}
                className="ml-auto inline-flex items-center gap-1.5 rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
              >
                <UserPlus className="h-3.5 w-3.5" />
                Add Member
              </button>
            )}
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
    <div className={isAddMemberOpen && project ? "fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" : "hidden"}>
      <div className="w-full max-w-md rounded-lg bg-surface p-6 shadow-xl">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-text-primary">Add Member to Project</h2>
          <button
            type="button"
            onClick={() => setIsAddMemberOpen(false)}
            className="text-text-secondary hover:text-text-primary transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        {project && <AddProjectMemberForm projectId={project.id} onClose={() => setIsAddMemberOpen(false)} onSuccess={() => refetch()} />}
      </div>
    </div>
    </>
  );
}

function AddProjectMemberForm({
  projectId,
  onClose,
  onSuccess,
}: {
  projectId: string;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("contributor");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setIsSubmitting(true);
    setError(null);
    try {
      await apiFetch(`/projects/${projectId}/members`, {
        method: "POST",
        body: { email: email.trim(), role },
      });
      onSuccess();
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">{error}</div>
      )}
      <div>
        <label htmlFor="email" className="block text-sm font-medium text-text-primary mb-1">
          Member Email *
        </label>
        <input
          id="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-ring"
          placeholder="member@university.edu"
          required
          disabled={isSubmitting}
        />
      </div>
      <div>
        <label htmlFor="role" className="block text-sm font-medium text-text-primary mb-1">
          Role
        </label>
        <select
          id="role"
          value={role}
          onChange={(e) => setRole(e.target.value)}
          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-ring"
          disabled={isSubmitting}
        >
          <option value="contributor">Contributor</option>
          <option value="lead">Lead</option>
          <option value="viewer">Viewer</option>
        </select>
      </div>
      <div className="flex justify-end gap-2 pt-2">
        <button
          type="button"
          onClick={onClose}
          disabled={isSubmitting}
          className="rounded-md border border-border px-4 py-2 text-sm text-text-primary transition-colors hover:bg-sunken disabled:opacity-50"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isSubmitting || !email.trim()}
          className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50"
        >
          {isSubmitting ? "Adding..." : "Add Member"}
        </button>
      </div>
    </form>
  );
}
