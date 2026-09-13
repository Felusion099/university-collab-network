import { apiFetch } from "./client";
import type { ProjectStatus, SkillRoleNeeded } from "@app/shared-types";

export interface ProjectSummary {
  id: string;
  name: string;
  logoUrl: string | null;
  description: string;
  status: ProjectStatus;
  skillsNeeded: { role: SkillRoleNeeded; skill: string }[];
  memberCount: number;
}

export interface ProjectDetail extends ProjectSummary {
  problemStatement: string | null;
  solutionDescription: string | null;
  githubUrl: string | null;
  demoUrl: string | null;
  docsUrl: string | null;
}

export interface ProjectListParams {
  status?: ProjectStatus;
  skill?: string;
  q?: string;
  cursor?: string | null;
  limit?: number;
}

/* Backend row shape (project.repository.ts include: creator, members w/ user,
 * skillsNeeded w/ skill, topics). Mapped to the card/detail interfaces —
 * memberCount comes from the members array, skill names from the nested
 * skill relation, nulls normalized to the display defaults. */
function mapProject(raw: Record<string, unknown>): ProjectDetail {
  const skills = (raw.skillsNeeded as { skill?: { name?: string }; roleNeeded?: SkillRoleNeeded }[] | undefined) ?? [];
  const members = (raw.members as unknown[] | undefined) ?? [];
  return {
    id: String(raw.id),
    name: String(raw.name),
    logoUrl: (raw.logoUrl as string | null) ?? null,
    description: (raw.description as string | null) ?? "",
    status: raw.status as ProjectStatus,
    skillsNeeded: skills
      .filter((s) => s.roleNeeded)
      .map((s) => ({ role: s.roleNeeded as SkillRoleNeeded, skill: s.skill?.name ?? "" })),
    memberCount: members.length,
    problemStatement: (raw.problemStatement as string | null) ?? null,
    solutionDescription: (raw.solutionDescription as string | null) ?? null,
    githubUrl: (raw.githubUrl as string | null) ?? null,
    demoUrl: (raw.demoUrl as string | null) ?? null,
    docsUrl: (raw.docsUrl as string | null) ?? null,
  };
}

export const projectsApi = {
  list: async (
    params: ProjectListParams,
  ): Promise<{ data: ProjectSummary[]; nextCursor: string | null }> => {
    const search = new URLSearchParams();
    if (params.status) search.set("status", params.status);
    if (params.skill) search.set("skill", params.skill);
    if (params.cursor) search.set("cursor", params.cursor);
    if (params.limit) search.set("limit", String(params.limit));
    const page = await apiFetch<{ data: Record<string, unknown>[]; nextCursor: string | null }>(
      `/projects${search.toString() ? `?${search.toString()}` : ""}`,
    );
    return { data: page.data.map(mapProject), nextCursor: page.nextCursor };
  },

  getById: async (id: string): Promise<ProjectDetail | null> => {
    try {
      const raw = await apiFetch<Record<string, unknown>>(`/projects/${id}`);
      return mapProject(raw);
    } catch (err) {
      // 404 (NotFoundError) keeps the mock-era contract: null → EmptyState,
      // not an ErrorState. Other failures still surface as errors.
      if (err && typeof err === "object" && "status" in err && (err as { status: number }).status === 404) {
        return null;
      }
      throw err;
    }
  },

  create: async (input: {
    name: string;
    description?: string;
    status?: ProjectStatus;
  }): Promise<ProjectDetail> => {
    const raw = await apiFetch<Record<string, unknown>>("/projects", {
      method: "POST",
      body: input,
    });
    return mapProject(raw);
  },
};
