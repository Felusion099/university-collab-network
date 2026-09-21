import { z } from "zod";

// ============================================================================
// Shared enums for Phase 5 resources (mirror Prisma enums in schema.prisma —
// kept as a parallel Zod source per ARCHITECTURE.md's "single source of
// truth for API contract shapes" — packages/shared-types, not the Prisma
// client, is what the frontend imports).
// ============================================================================

export const OrganizationTypeEnum = z.enum(["club", "society", "startup"]);
export type OrganizationType = z.infer<typeof OrganizationTypeEnum>;

export const MembershipRoleEnum = z.enum(["member", "leader", "advisor", "founder", "pi"]);
export type MembershipRole = z.infer<typeof MembershipRoleEnum>;

export const SkillRoleNeededEnum = z.enum([
  "frontend",
  "backend",
  "ml",
  "design",
  "research",
  "product",
  "other",
]);
export type SkillRoleNeeded = z.infer<typeof SkillRoleNeededEnum>;

export const SkillProficiencyEnum = z.enum(["beginner", "intermediate", "advanced", "expert"]);
export type SkillProficiency = z.infer<typeof SkillProficiencyEnum>;

export const EventTypeEnum = z.enum([
  "hackathon",
  "workshop",
  "seminar",
  "conference",
  "talk",
  "guest_lecture",
  "competition",
  "startup_event",
  "club_event",
]);
export type EventType = z.infer<typeof EventTypeEnum>;

export const OpportunityTypeEnum = z.enum([
  "research",
  "internship",
  "project",
  "startup",
  "volunteer",
  "club",
  "hackathon",
  "mentorship",
  "thesis",
  "research_assistant",
  "teaching_assistant",
]);
export type OpportunityType = z.infer<typeof OpportunityTypeEnum>;

export const ApplicationStatusEnum = z.enum(["submitted", "under_review", "accepted", "rejected"]);
export type ApplicationStatus = z.infer<typeof ApplicationStatusEnum>;

// ============================================================================
// Research Topics — /api/v1/research-topics
// ============================================================================

export const CreateResearchTopicRequestSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  parentTopicId: z.string().uuid().nullable().optional(),
});
export type CreateResearchTopicRequest = z.infer<typeof CreateResearchTopicRequestSchema>;

export const UpdateResearchTopicRequestSchema = CreateResearchTopicRequestSchema.partial();
export type UpdateResearchTopicRequest = z.infer<typeof UpdateResearchTopicRequestSchema>;

// Professor research topic status update
export const ResearchTopicStatusEnum = z.enum([
  "DRAFT",
  "ACTIVE",
  "PAUSED",
  "COMPLETED",
  "ARCHIVED",
]);
export type ResearchTopicStatus = z.infer<typeof ResearchTopicStatusEnum>;

export const UpdateResearchTopicStatusRequestSchema = z.object({
  status: ResearchTopicStatusEnum,
});
export type UpdateResearchTopicStatusRequest = z.infer<typeof UpdateResearchTopicStatusRequestSchema>;

// Professor-specific research topic request (same as admin but for professor)
export const CreateResearchTopicByProfessorRequestSchema = CreateResearchTopicRequestSchema;
export type CreateResearchTopicByProfessorRequest = z.infer<typeof CreateResearchTopicByProfessorRequestSchema>;

export const UpdateResearchTopicByProfessorRequestSchema = UpdateResearchTopicRequestSchema;
export type UpdateResearchTopicByProfessorRequest = z.infer<typeof UpdateResearchTopicByProfessorRequestSchema>;

// ============================================================================
// Organizations — /api/v1/organizations (clubs/societies/startups per D-002)
// ============================================================================

export const CreateOrganizationRequestSchema = z.object({
  type: OrganizationTypeEnum,
  name: z.string().min(1),
  logoUrl: z.string().url().nullable().optional(),
  description: z.string().optional(),
  category: z.string().optional(),
  facultyAdvisorId: z.string().uuid().nullable().optional(),
  startupDetails: z
    .object({
      industry: z.string().optional(),
      stage: z.string().optional(),
      websiteUrl: z.string().url().optional(),
      hiring: z.boolean().optional(),
    })
    .optional(),
});
export type CreateOrganizationRequest = z.infer<typeof CreateOrganizationRequestSchema>;

export const UpdateOrganizationRequestSchema = CreateOrganizationRequestSchema.partial();
export type UpdateOrganizationRequest = z.infer<typeof UpdateOrganizationRequestSchema>;

// ============================================================================
// Research Teams — /api/v1/research-teams
// ============================================================================

export const CreateResearchTeamRequestSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  topicIds: z.array(z.string().uuid()).optional(),
});
export type CreateResearchTeamRequest = z.infer<typeof CreateResearchTeamRequestSchema>;

export const UpdateResearchTeamRequestSchema = CreateResearchTeamRequestSchema.partial();
export type UpdateResearchTeamRequest = z.infer<typeof UpdateResearchTeamRequestSchema>;

// ============================================================================
// Publications — /api/v1/publications
// ============================================================================

export const CreatePublicationRequestSchema = z.object({
  title: z.string().min(1),
  abstract: z.string().optional(),
  journalOrConference: z.string().optional(),
  publishedDate: z.string().date().optional(),
  doi: z.string().optional(),
  externalUrl: z.string().url().optional(),
  pdfUrl: z.string().url().optional(),
  authorIds: z.array(z.string().uuid()).min(1),
  topicIds: z.array(z.string().uuid()).optional(),
});
export type CreatePublicationRequest = z.infer<typeof CreatePublicationRequestSchema>;

export const UpdatePublicationRequestSchema = CreatePublicationRequestSchema.partial();
export type UpdatePublicationRequest = z.infer<typeof UpdatePublicationRequestSchema>;

// ============================================================================
// Projects — /api/v1/projects
// ============================================================================

export const ProjectStatusEnum = z.enum([
  "idea",
  "planning",
  "development",
  "beta",
  "active",
  "completed",
  "archived",
]);
export type ProjectStatus = z.infer<typeof ProjectStatusEnum>;

export const CreateProjectRequestSchema = z.object({
  name: z.string().min(1),
  logoUrl: z.string().url().nullable().optional(),
  problemStatement: z.string().optional(),
  solutionDescription: z.string().optional(),
  description: z.string().optional(),
  status: ProjectStatusEnum.optional(),
  githubUrl: z.string().url().optional(),
  demoUrl: z.string().url().optional(),
  docsUrl: z.string().url().optional(),
  topicIds: z.array(z.string().uuid()).optional(),
  skillsNeeded: z
    .array(z.object({ skillId: z.string().uuid(), roleNeeded: SkillRoleNeededEnum }))
    .optional(),
  // Combined-project extensions (Campus UI fields, all optional)
  category: z.string().optional(),
  deadlineText: z.string().optional(),
  maxTeamSize: z.number().int().min(2).max(50).optional(),
  collaborationType: z.string().optional(),
  requirements: z.array(z.string()).optional(),
});
export type CreateProjectRequest = z.infer<typeof CreateProjectRequestSchema>;

export const UpdateProjectRequestSchema = CreateProjectRequestSchema.partial();
export type UpdateProjectRequest = z.infer<typeof UpdateProjectRequestSchema>;

export const UpdateProjectStatusRequestSchema = z.object({
  status: ProjectStatusEnum,
});
export type UpdateProjectStatusRequest = z.infer<typeof UpdateProjectStatusRequestSchema>;

export const AddProjectMemberRequestSchema = z.object({
  userId: z.string().uuid(),
  roleOnProject: z.string().optional(),
});
export type AddProjectMemberRequest = z.infer<typeof AddProjectMemberRequestSchema>;

export const UpdateProjectMemberRoleRequestSchema = z.object({
  roleOnProject: z.string(),
});
export type UpdateProjectMemberRoleRequest = z.infer<typeof UpdateProjectMemberRoleRequestSchema>;

// ============================================================================
// Skills — /api/v1/skills
// ============================================================================

export const CreateSkillRequestSchema = z.object({
  name: z.string().min(1),
  category: z.string().optional(),
});
export type CreateSkillRequest = z.infer<typeof CreateSkillRequestSchema>;

// ============================================================================
// Events — /api/v1/events
// ============================================================================

export const CreateEventRequestSchema = z
  .object({
    title: z.string().min(1),
    description: z.string().optional(),
    eventType: EventTypeEnum,
    date: z.string().date(),
    time: z.string().optional(),
    venue: z.string().optional(),
    organizerOrganizationId: z.string().uuid().optional(),
    organizerResearchTeamId: z.string().uuid().optional(),
    registrationUrl: z.string().url().optional(),
    // Combined-project extensions (Campus UI fields, all optional)
    capacity: z.number().int().min(1).optional(),
    tags: z.array(z.string()).optional(),
  })
  .refine((v) => !(v.organizerOrganizationId && v.organizerResearchTeamId), {
    message: "An event may be organized by an organization or a research team, not both",
  });
export type CreateEventRequest = z.infer<typeof CreateEventRequestSchema>;

export const UpdateEventRequestSchema = z.object({
  title: z.string().min(1).optional(),
  description: z.string().optional(),
  eventType: EventTypeEnum.optional(),
  date: z.string().date().optional(),
  time: z.string().optional(),
  venue: z.string().optional(),
  registrationUrl: z.string().url().optional(),
  capacity: z.number().int().min(1).nullable().optional(),
  tags: z.array(z.string()).nullable().optional(),
});
export type UpdateEventRequest = z.infer<typeof UpdateEventRequestSchema>;

// ============================================================================
// Opportunities — /api/v1/opportunities
// ============================================================================

export const CreateOpportunityRequestSchema = z
  .object({
    title: z.string().min(1),
    description: z.string().optional(),
    opportunityType: OpportunityTypeEnum,
    providedByOrganizationId: z.string().uuid().optional(),
    providedByResearchTeamId: z.string().uuid().optional(),
    deadline: z.string().date().optional(),
    departmentTag: z.string().optional(),
    researchTopicId: z.string().uuid().optional(),
  })
  .refine((v) => !(v.providedByOrganizationId && v.providedByResearchTeamId), {
    message: "An opportunity may be provided by an organization or a research team, not both",
  });
export type CreateOpportunityRequest = z.infer<typeof CreateOpportunityRequestSchema>;

export const UpdateOpportunityRequestSchema = z.object({
  title: z.string().min(1).optional(),
  description: z.string().optional(),
  deadline: z.string().date().nullable().optional(),
  departmentTag: z.string().optional(),
});
export type UpdateOpportunityRequest = z.infer<typeof UpdateOpportunityRequestSchema>;

export const CreateApplicationRequestSchema = z.object({
  coverNote: z.string().optional(),
});
export type CreateApplicationRequest = z.infer<typeof CreateApplicationRequestSchema>;

export const UpdateApplicationRequestSchema = z.object({
  status: ApplicationStatusEnum,
});
export type UpdateApplicationRequest = z.infer<typeof UpdateApplicationRequestSchema>;
