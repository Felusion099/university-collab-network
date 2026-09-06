import type { ProjectStatus, SkillRoleNeeded } from "@app/shared-types";

/**
 * PROVISIONAL mock for GET /projects and GET /projects/:id
 * (API_CONTRACT.md §3 generic resource convention — already documented
 * there, unlike HANDOFF-22's users case, so no new HANDOFF entry needed).
 * Field names mirror `CreateProjectRequestSchema`
 * (packages/shared-types/src/resources.ts) exactly, so a real
 * `ProjectResponseSchema` — which doesn't exist yet, same
 * no-read-schemas-anywhere gap noted for `directory.ts`/`discover.ts` —
 * should be a near-identical shape when Phase 3 adds it.
 *
 * `ProjectStatusEnum`/`SkillRoleNeededEnum` are real, already-exported
 * shared-types — used here directly rather than re-declared, so this mock
 * can't silently drift from the real enum values.
 */
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

const MOCK_PROJECTS: ProjectDetail[] = [
  {
    id: "p-1",
    name: "CampusConnect Study Groups",
    logoUrl: null,
    description: "Matches students into study groups by course and schedule overlap.",
    status: "active",
    skillsNeeded: [
      { role: "frontend", skill: "React" },
      { role: "backend", skill: "Node.js" },
    ],
    memberCount: 4,
    problemStatement: "Students struggle to find compatible study partners each semester.",
    solutionDescription:
      "A lightweight matcher that groups students by shared courses and free time slots.",
    githubUrl: "https://github.com/example/campusconnect",
    demoUrl: null,
    docsUrl: null,
  },
  {
    id: "p-2",
    name: "Low-Cost Air Quality Sensor",
    logoUrl: null,
    description: "Open-hardware PM2.5 sensor for campus-wide air quality monitoring.",
    status: "development",
    skillsNeeded: [
      { role: "other", skill: "Embedded Systems" },
      { role: "ml", skill: "Data Analysis" },
    ],
    memberCount: 3,
    problemStatement: "Commercial air quality sensors are too expensive to deploy at scale.",
    solutionDescription: "ESP32-based sensor nodes reporting to a shared dashboard.",
    githubUrl: null,
    demoUrl: null,
    docsUrl: "https://example.com/docs",
  },
  {
    id: "p-3",
    name: "Peer Code Review Bot",
    logoUrl: null,
    description: "Lightweight GitHub bot that assigns student reviewers by expertise.",
    status: "beta",
    skillsNeeded: [{ role: "backend", skill: "TypeScript" }],
    memberCount: 2,
    problemStatement: "Student projects rarely get timely code review.",
    solutionDescription: "A GitHub Action that pings the best-matched reviewer automatically.",
    githubUrl: "https://github.com/example/review-bot",
    demoUrl: "https://example.com/demo",
    docsUrl: null,
  },
];

export const projectsApi = {
  list: async (
    params: ProjectListParams,
  ): Promise<{ data: ProjectSummary[]; nextCursor: string | null }> => {
    await new Promise((resolve) => setTimeout(resolve, 350));
    const limit = params.limit ?? 20;
    const offset = params.cursor ? Number.parseInt(params.cursor, 10) : 0;

    let results = MOCK_PROJECTS;
    if (params.status) results = results.filter((p) => p.status === params.status);
    if (params.skill) {
      results = results.filter((p) => p.skillsNeeded.some((s) => s.skill === params.skill));
    }
    if (params.q) {
      const q = params.q.toLowerCase();
      results = results.filter((p) => p.name.toLowerCase().includes(q));
    }

    const page = results.slice(offset, offset + limit);
    const nextOffset = offset + limit;
    const nextCursor = nextOffset < results.length ? String(nextOffset) : null;
    return { data: page, nextCursor };
  },

  getById: async (id: string): Promise<ProjectDetail | null> => {
    await new Promise((resolve) => setTimeout(resolve, 250));
    return MOCK_PROJECTS.find((p) => p.id === id) ?? null;
  },
};
