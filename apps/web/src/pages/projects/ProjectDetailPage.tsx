import { useParams, Link } from "react-router-dom";
import {
  ArrowLeft,
  FolderX,
  GitFork,
  ExternalLink,
  FileText,
  Users,
  UserPlus,
  X,
  Pencil,
} from "lucide-react";
import { useState } from "react";
import type { ProjectStatus } from "@app/shared-types";
import { useProject } from "@/hooks/useProjects";
import { SkillBadge } from "@/components/ui/Badge";
import { Skeleton } from "@/components/ui/Skeleton";
import { ErrorState } from "@/components/ui/ErrorState";
import { EmptyState } from "@/components/ui/EmptyState";
import { useSessionStore } from "@/stores/session.store";
import { apiFetch, ApiError } from "@/services/api/client";
import type { ProjectDetail } from "@/services/api/projects";

/**
 * ProjectDetailPage — a real project workspace: About/What we're building,
 * skills & technologies, research topics, and a TEAM section with actual
 * member cards (avatar/initials, username, roleOnProject, profile link) —
 * the member count is derived from the real membership records. Creator
 * controls (Edit, status change, Add Member) are gated by ownership:
 * project.createdBy === session user (server-authorized via the existing
 * update/status/members routes), never frontend-only.
 */
export default function ProjectDetailPage(): JSX.Element {
  const { id } = useParams<{ id: string }>();
  const { data: project, isLoading, isError, refetch } = useProject(id);
  const { user } = useSessionStore();
  const [isAddMemberOpen, setIsAddMemberOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);

  const isCreator = Boolean(project && user && project.creator?.id === user.id);

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

        {!isLoading && !isError && !project && <EmptyState icon={FolderX} title="Project not found" />}

        {!isLoading && !isError && project && (
          <div className="space-y-6">
            {/* PROJECT HEADER */}
            <div className="flex items-start gap-4">
              {project.logoUrl && (
                <img
                  src={project.logoUrl}
                  alt=""
                  className="h-14 w-14 flex-shrink-0 rounded-md object-cover"
                />
              )}
              <div className="min-w-0">
                <h1 className="text-xl font-semibold text-text-primary">{project.name}</h1>
                {project.description && (
                  <p className="mt-0.5 text-sm text-text-secondary">{project.description}</p>
                )}
                <div className="mt-1 flex flex-wrap items-center gap-2 text-sm text-text-secondary">
                  <span className="rounded-full bg-sunken px-2.5 py-0.5 text-xs font-medium capitalize text-text-secondary">
                    {project.status}
                  </span>
                  {project.creator && (
                    <Link
                      to={`/students/${project.creator.username}`}
                      className="inline-flex items-center gap-1 text-xs text-text-secondary hover:text-text-primary"
                    >
                      by <span className="font-medium">{project.creator.username}</span>
                    </Link>
                  )}
                  <span className="flex items-center gap-1 text-xs">
                    <Users className="h-3.5 w-3.5" aria-hidden="true" />
                    {project.memberCount} member{project.memberCount === 1 ? "" : "s"}
                  </span>
                </div>
              </div>
              {isCreator && (
                <div className="ml-auto flex flex-shrink-0 gap-2">
                  <button
                    type="button"
                    onClick={() => setIsEditOpen(true)}
                    className="inline-flex items-center gap-1.5 rounded-md border border-border px-3 py-1.5 text-sm text-text-primary transition-colors hover:bg-sunken"
                  >
                    <Pencil className="h-3.5 w-3.5" />
                    Edit
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsAddMemberOpen(true)}
                    className="inline-flex items-center gap-1.5 rounded-md bg-accent-600 px-3 py-1.5 text-sm font-medium text-text-onAccent transition-colors hover:bg-accent-700"
                  >
                    <UserPlus className="h-3.5 w-3.5" />
                    Add Member
                  </button>
                </div>
              )}
            </div>

            {/* ABOUT / WHAT WE'RE BUILDING */}
            {(project.problemStatement || project.solutionDescription) && (
              <section className="space-y-3">
                {project.problemStatement && (
                  <div className="rounded-lg border border-border bg-raised p-4">
                    <h2 className="mb-1 text-sm font-semibold uppercase tracking-wide text-text-muted">
                      The problem
                    </h2>
                    <p className="text-sm text-text-primary">{project.problemStatement}</p>
                  </div>
                )}
                {project.solutionDescription && (
                  <div className="rounded-lg border border-border bg-raised p-4">
                    <h2 className="mb-1 text-sm font-semibold uppercase tracking-wide text-text-muted">
                      What we're building
                    </h2>
                    <p className="text-sm text-text-primary">{project.solutionDescription}</p>
                  </div>
                )}
              </section>
            )}

            {/* SKILLS & TECHNOLOGIES */}
            {project.skillsNeeded.length > 0 && (
              <section>
                <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-text-muted">
                  Skills & technologies
                </h2>
                <div className="flex flex-wrap gap-1.5">
                  {project.skillsNeeded.map(({ skill, role }) => (
                    <SkillBadge key={skill} skill={`${skill} (${role})`} />
                  ))}
                </div>
              </section>
            )}

            {/* RESEARCH TOPICS */}
            {project.topics.length > 0 && (
              <section>
                <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-text-muted">
                  Research topics
                </h2>
                <div className="flex flex-wrap gap-1.5">
                  {project.topics.map((t) => (
                    <Link
                      key={t.id}
                      to={`/research/${t.slug}`}
                      className="rounded-full bg-sunken px-2.5 py-0.5 text-xs font-medium text-text-secondary transition-colors hover:text-text-primary"
                    >
                      {t.name}
                    </Link>
                  ))}
                </div>
              </section>
            )}

            {/* TEAM — real member cards derived from membership records */}
            <section>
              <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-text-muted">
                Team
              </h2>
              <ul className="space-y-2">
                {project.members.map((m) => (
                  <li key={m.userId}>
                    <Link
                      to={`/students/${m.username}`}
                      className="flex items-center gap-3 rounded-lg border border-border bg-raised p-3 transition-colors hover:border-accent-500"
                    >
                      {m.avatarUrl ? (
                        <img
                          src={m.avatarUrl}
                          alt=""
                          className="h-9 w-9 flex-shrink-0 rounded-full object-cover"
                        />
                      ) : (
                        <span className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-sunken text-xs font-semibold text-text-secondary">
                          {m.username.slice(0, 2).toUpperCase()}
                        </span>
                      )}
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-text-primary">
                          {m.username}
                          {project.creator?.id === m.userId && (
                            <span className="ml-2 rounded-full bg-accent-100 px-2 py-0.5 text-[10px] font-semibold uppercase text-accent-700">
                              Lead
                            </span>
                          )}
                        </p>
                        {m.roleOnProject && (
                          <p className="text-xs text-text-muted">{m.roleOnProject}</p>
                        )}
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
            </section>

            {/* LINKS */}
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
      {isAddMemberOpen && project && (
        <Modal onClose={() => setIsAddMemberOpen(false)} title="Add Member to Project">
          <AddProjectMemberForm
            projectId={project.id}
            onClose={() => setIsAddMemberOpen(false)}
            onSuccess={() => refetch()}
          />
        </Modal>
      )}
      {isEditOpen && project && (
        <Modal onClose={() => setIsEditOpen(false)} title="Edit Project">
          <EditProjectForm
            project={project}
            onClose={() => setIsEditOpen(false)}
            onSuccess={() => refetch()}
          />
        </Modal>
      )}
    </>
  );
}

/**
 * Modal — shared overlay using the existing token system (bg-canvas
 * surface, token borders) so it renders correctly in light AND dark mode.
 */
function Modal({
  title,
  onClose,
  children,
}: {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}): JSX.Element {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-overlay p-4">
      <div className="w-full max-w-md rounded-lg border border-border bg-raised p-6 shadow-lg">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-text-primary">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            className="text-text-secondary transition-colors hover:text-text-primary"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        {children}
      </div>
    </div>
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
  const [username, setUsername] = useState("");
  const [role, setRole] = useState("contributor");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim()) return;
    setIsSubmitting(true);
    setError(null);
    try {
      // Resolve the member's username to a user id via the existing
      // public GET /users/:username endpoint, then add them through the
      // professor members endpoint (POST /projects/professor/:id/members
      // expects { userId, roleOnProject }).
      const member = await apiFetch<{ id: string }>(`/users/${username.trim()}`);
      if (!member?.id) {
        throw new Error(`No user found with username "${username.trim()}"`);
      }
      await apiFetch(`/projects/professor/${projectId}/members`, {
        method: "POST",
        body: { userId: member.id, roleOnProject: role },
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
        <div className="rounded-md bg-danger-100 p-3 text-sm text-danger-600">{error}</div>
      )}
      <div>
        <label htmlFor="username" className="mb-1 block text-sm font-medium text-text-primary">
          Member Username *
        </label>
        <input
          id="username"
          type="text"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          className="w-full rounded-md border border-border bg-canvas px-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-accent-500"
          placeholder="e.g., priya.sharma"
          required
          disabled={isSubmitting}
        />
      </div>
      <div>
        <label htmlFor="role" className="mb-1 block text-sm font-medium text-text-primary">
          Role on project
        </label>
        <select
          id="role"
          value={role}
          onChange={(e) => setRole(e.target.value)}
          className="w-full rounded-md border border-border bg-canvas px-3 py-2 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-accent-500"
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
          disabled={isSubmitting || !username.trim()}
          className="rounded-md bg-accent-600 px-4 py-2 text-sm font-medium text-text-onAccent transition-colors hover:bg-accent-700 disabled:opacity-50"
        >
          {isSubmitting ? "Adding..." : "Add Member"}
        </button>
      </div>
    </form>
  );
}

function EditProjectForm({
  project,
  onClose,
  onSuccess,
}: {
  project: ProjectDetail;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [name, setName] = useState(project.name);
  const [description, setDescription] = useState(project.description);
  const [problemStatement, setProblemStatement] = useState(project.problemStatement ?? "");
  const [solutionDescription, setSolutionDescription] = useState(
    project.solutionDescription ?? "",
  );
  const [status, setStatus] = useState<ProjectStatus>(project.status);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    try {
      // PATCH /projects/:id — the creator edit path (service checks
      // createdBy). Persisting here means a refresh and other viewers
      // see the updated project — no local-only state.
      await apiFetch(`/projects/${project.id}`, {
        method: "PATCH",
        body: {
          name: name.trim(),
          description: description.trim() || undefined,
          problemStatement: problemStatement.trim() || undefined,
          solutionDescription: solutionDescription.trim() || undefined,
          status,
        },
      });
      onSuccess();
      onClose();
    } catch (err: unknown) {
      setError(err instanceof ApiError ? err.message : "Something went wrong");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="rounded-md bg-danger-100 p-3 text-sm text-danger-600">{error}</div>
      )}
      <div>
        <label htmlFor="ep-name" className="mb-1 block text-sm font-medium text-text-primary">
          Project name *
        </label>
        <input
          id="ep-name"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full rounded-md border border-border bg-canvas px-3 py-2 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-accent-500"
          required
          disabled={isSubmitting}
        />
      </div>
      <div>
        <label htmlFor="ep-desc" className="mb-1 block text-sm font-medium text-text-primary">
          Short description
        </label>
        <textarea
          id="ep-desc"
          rows={2}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="w-full rounded-md border border-border bg-canvas px-3 py-2 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-accent-500"
          disabled={isSubmitting}
        />
      </div>
      <div>
        <label htmlFor="ep-problem" className="mb-1 block text-sm font-medium text-text-primary">
          The problem
        </label>
        <textarea
          id="ep-problem"
          rows={2}
          value={problemStatement}
          onChange={(e) => setProblemStatement(e.target.value)}
          className="w-full rounded-md border border-border bg-canvas px-3 py-2 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-accent-500"
          disabled={isSubmitting}
        />
      </div>
      <div>
        <label htmlFor="ep-solution" className="mb-1 block text-sm font-medium text-text-primary">
          What we're building
        </label>
        <textarea
          id="ep-solution"
          rows={2}
          value={solutionDescription}
          onChange={(e) => setSolutionDescription(e.target.value)}
          className="w-full rounded-md border border-border bg-canvas px-3 py-2 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-accent-500"
          disabled={isSubmitting}
        />
      </div>
      <div>
        <label htmlFor="ep-status" className="mb-1 block text-sm font-medium text-text-primary">
          Status
        </label>
        <select
          id="ep-status"
          value={status}
          onChange={(e) => setStatus(e.target.value as ProjectStatus)}
          className="w-full rounded-md border border-border bg-canvas px-3 py-2 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-accent-500"
          disabled={isSubmitting}
        >
          <option value="idea">Idea</option>
          <option value="planning">Planning</option>
          <option value="development">Development</option>
          <option value="beta">Beta</option>
          <option value="active">Active</option>
          <option value="completed">Completed</option>
          <option value="archived">Archived</option>
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
          disabled={isSubmitting || !name.trim()}
          className="rounded-md bg-accent-600 px-4 py-2 text-sm font-medium text-text-onAccent transition-colors hover:bg-accent-700 disabled:opacity-50"
        >
          {isSubmitting ? "Saving..." : "Save changes"}
        </button>
      </div>
    </form>
  );
}
