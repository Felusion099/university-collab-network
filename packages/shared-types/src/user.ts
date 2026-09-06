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
