import { z } from "zod";
import { UserRoleEnum, UserStatusEnum } from "./auth.js";

export const VisibilityEnum = z.enum(["public", "university_only", "connections_only", "private"]);
export type Visibility = z.infer<typeof VisibilityEnum>;

export const LookingForOptionEnum = z.enum([
  "teammates",
  "research",
  "internship",
  "mentoring",
  "networking",
]);
export type LookingForOption = z.infer<typeof LookingForOptionEnum>;

export const ResearcherTypeEnum = z.enum([
  "phd",
  "postdoc",
  "research_associate",
  "research_assistant",
  "faculty",
]);
export type ResearcherType = z.infer<typeof ResearcherTypeEnum>;

// Privacy Settings
export const PrivacySettingsSchema = z.object({
  userId: z.string().uuid(),
  profileVisibility: VisibilityEnum,
  emailVisibility: VisibilityEnum,
  phoneVisibility: VisibilityEnum,
  academicVisibility: VisibilityEnum,
  cgpaVisibility: VisibilityEnum,
  projectsVisibility: VisibilityEnum,
  researchVisibility: VisibilityEnum,
  socialLinksVisibility: VisibilityEnum,
  connectionsVisibility: VisibilityEnum,
  activityVisibility: VisibilityEnum,
  contactVisibility: VisibilityEnum,
});
export type PrivacySettings = z.infer<typeof PrivacySettingsSchema>;

export const UpdatePrivacySettingsRequestSchema = PrivacySettingsSchema.omit({
  userId: true,
}).partial();
export type UpdatePrivacySettingsRequest = z.infer<typeof UpdatePrivacySettingsRequestSchema>;

// ============================================================================
// Portfolio — a composed, privacy-filtered VIEW over existing entities.
// The portfolio is never persisted; the service derives it from the user's
// real relationships on every read, so it stays a living view that updates
// automatically as platform usage changes (project joins, team membership,
// publications, skills, organization memberships).
// ============================================================================

export const UserProjectRefSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  status: z.string(),
  relation: z.enum(["lead", "member"]), // lead = creator, member = project member
});
export type UserProjectRef = z.infer<typeof UserProjectRefSchema>;

export const UserTeamRefSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  relation: z.enum(["pi", "member"]), // pi = PI/leader, member = membership row
});
export type UserTeamRef = z.infer<typeof UserTeamRefSchema>;

export const UserPublicationRefSchema = z.object({
  id: z.string().uuid(),
  title: z.string(),
  publishedDate: z.string().nullable().optional(),
  journalOrConference: z.string().nullable().optional(),
});
export type UserPublicationRef = z.infer<typeof UserPublicationRefSchema>;

export const UserOrgRefSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  orgType: z.string().nullable().optional(),
  relation: z.enum(["member", "creator", "advisor"]),
});
export type UserOrgRef = z.infer<typeof UserOrgRefSchema>;

export const UserTopicRefSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  slug: z.string(),
});
export type UserTopicRef = z.infer<typeof UserTopicRefSchema>;

export const UserSkillRefSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  proficiency: z.string().nullable().optional(),
});
export type UserSkillRef = z.infer<typeof UserSkillRefSchema>;

export const PortfolioSchema = z.object({
  projects: z.array(UserProjectRefSchema),
  researchTeams: z.array(UserTeamRefSchema),
  publications: z.array(UserPublicationRefSchema),
  organizations: z.array(UserOrgRefSchema),
  skills: z.array(UserSkillRefSchema),
  researchTopics: z.array(UserTopicRefSchema),
});
export type Portfolio = z.infer<typeof PortfolioSchema>;

// ============================================================================
// Onboarding — new-user, role-aware onboarding state. The marker lives on
// users.onboarding_completed_at (nullable timestamp); no onboarding-role
// enum is introduced (the existing UserRole drives step configuration).
// ============================================================================

export const OnboardingStatusSchema = z.object({
  completed: z.boolean(),
  completedAt: z.string().datetime().nullable(),
  role: UserRoleEnum,
});
export type OnboardingStatus = z.infer<typeof OnboardingStatusSchema>;

export const CompleteOnboardingRequestSchema = z.object({
  completed: z.literal(true),
});
export type CompleteOnboardingRequest = z.infer<typeof CompleteOnboardingRequestSchema>;

// Profile Schemas
export const StudentProfileSchema = z.object({
  userId: z.string().uuid(),
  fullName: z.string(),
  department: z.string().nullable().optional(),
  course: z.string().nullable().optional(),
  year: z.number().int().nullable().optional(),
  university: z.string().nullable().optional(),
  bio: z.string().nullable().optional(),
  cgpa: z.number().nullable().optional(),
  githubUrl: z.string().url().nullable().optional(),
  linkedinUrl: z.string().url().nullable().optional(),
  portfolioUrl: z.string().url().nullable().optional(),
  lookingFor: z.any().optional(),
});
export type StudentProfile = z.infer<typeof StudentProfileSchema>;

export const ProfessorProfileSchema = z.object({
  userId: z.string().uuid(),
  fullName: z.string(),
  department: z.string().nullable().optional(),
  designation: z.string().nullable().optional(),
  expertise: z.array(z.string()).default([]),
  bio: z.string().nullable().optional(),
  officeContact: z.string().nullable().optional(),
  mentorshipAvailable: z.boolean().default(false),
});
export type ProfessorProfile = z.infer<typeof ProfessorProfileSchema>;

export const ResearcherProfileSchema = z.object({
  userId: z.string().uuid(),
  fullName: z.string(),
  researcherType: ResearcherTypeEnum.optional(),
  department: z.string().nullable().optional(),
  bio: z.string().nullable().optional(),
  currentAvailability: z.boolean().default(true),
});
export type ResearcherProfile = z.infer<typeof ResearcherProfileSchema>;

export const UserProfileResponseSchema = z.object({
  id: z.string().uuid(),
  username: z.string(),
  email: z.string().email().optional(),
  phone: z.string().nullable().optional(),
  role: UserRoleEnum,
  status: UserStatusEnum,
  isUniversityVerified: z.boolean(),
  avatarUrl: z.string().nullable().optional(),
  studentProfile: StudentProfileSchema.nullable().optional(),
  professorProfile: ProfessorProfileSchema.nullable().optional(),
  researcherProfile: ResearcherProfileSchema.nullable().optional(),
  privacySettings: PrivacySettingsSchema.optional(),
  createdAt: z.string().datetime(),
  // Composed portfolio view — derived server-side from existing entity
  // relationships (projects, teams, publications, organizations, skills,
  // research topics). Never a stored duplicate; sections are
  // privacy-filtered per the viewer before the response is built.
  portfolio: PortfolioSchema.optional(),
});
export type UserProfileResponse = z.infer<typeof UserProfileResponseSchema>;

export const UpdateProfileRequestSchema = z.object({
  fullName: z.string().min(1).optional(),
  bio: z.string().optional(),
  department: z.string().optional(),
  phone: z.string().nullable().optional(),
  avatarUrl: z.string().url().nullable().optional(),
  studentProfile: StudentProfileSchema.omit({ userId: true }).partial().optional(),
  professorProfile: ProfessorProfileSchema.omit({ userId: true }).partial().optional(),
  researcherProfile: ResearcherProfileSchema.omit({ userId: true }).partial().optional(),
});
export type UpdateProfileRequest = z.infer<typeof UpdateProfileRequestSchema>;
