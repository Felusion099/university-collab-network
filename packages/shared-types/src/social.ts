import { z } from "zod";

// ============================================================================
// Connections & Follows — API_CONTRACT.md §6
// ============================================================================

export const ConnectionStatusEnum = z.enum(["pending", "accepted", "declined", "blocked"]);
export type ConnectionStatus = z.infer<typeof ConnectionStatusEnum>;

export const CreateConnectionRequestSchema = z.object({
  addresseeId: z.string().uuid(),
  // Optional context note — the product keeps this lightweight; the rate
  // limit (3 requests/week/pair, server-side) is the real protection.
  message: z.string().max(500).optional(),
});
export type CreateConnectionRequest = z.infer<typeof CreateConnectionRequestSchema>;

export const UpdateConnectionRequestSchema = z.object({
  status: z.enum(["accepted", "declined", "blocked"]),
});
export type UpdateConnectionRequest = z.infer<typeof UpdateConnectionRequestSchema>;

// ============================================================================
// Messaging — API_CONTRACT.md §6
// ============================================================================

export const ConversationTypeEnum = z.enum(["direct", "group", "project", "research_team", "club"]);
export type ConversationType = z.infer<typeof ConversationTypeEnum>;

export const CreateConversationRequestSchema = z.object({
  type: ConversationTypeEnum,
  participantIds: z.array(z.string().uuid()).min(1),
  projectId: z.string().uuid().optional(),
  researchTeamId: z.string().uuid().optional(),
  organizationId: z.string().uuid().optional(),
  groupId: z.string().uuid().optional(),
});
export type CreateConversationRequest = z.infer<typeof CreateConversationRequestSchema>;

export const InvitationTypeEnum = z.enum(["none", "project", "research_team"]);
export type InvitationType = z.infer<typeof InvitationTypeEnum>;

export const CreateMessageRequestSchema = z.object({
  body: z.string().min(1),
  attachmentUrl: z.string().url().optional(),
  invitationType: InvitationTypeEnum.optional(),
  invitationRefId: z.string().uuid().optional(),
});
export type CreateMessageRequest = z.infer<typeof CreateMessageRequestSchema>;

// ============================================================================
// Notifications — API_CONTRACT.md §7
// ============================================================================

export const NotificationPreferencesSchema = z.object({
  connectionRequests: z.boolean(),
  messages: z.boolean(),
  projectInvitations: z.boolean(),
  researchInvitations: z.boolean(),
  clubAnnouncements: z.boolean(),
  eventReminders: z.boolean(),
  opportunityDeadlines: z.boolean(),
  publications: z.boolean(),
  teamRecruitment: z.boolean(),
  profileInteractions: z.boolean(),
});
export type NotificationPreferences = z.infer<typeof NotificationPreferencesSchema>;

export const UpdateNotificationPreferencesRequestSchema = NotificationPreferencesSchema.partial();
export type UpdateNotificationPreferencesRequest = z.infer<
  typeof UpdateNotificationPreferencesRequestSchema
>;

// ============================================================================
// Search — API_CONTRACT.md §4
// ============================================================================

export const SearchTypesEnum = z.enum([
  "people",
  "projects",
  "research",
  "publications",
  "teams",
  "clubs",
  "startups",
  "events",
  "opportunities",
]);
export type SearchType = z.infer<typeof SearchTypesEnum>;

export const SearchQuerySchema = z.object({
  q: z.string().min(1),
  types: z.string().optional(), // comma-separated SearchType values, parsed in the service
  limit: z.coerce.number().int().min(1).max(20).default(5),
});
export type SearchQuery = z.infer<typeof SearchQuerySchema>;

// ============================================================================
// Admin — API_CONTRACT.md §9
// ============================================================================

export const ReportActionEnum = z.enum(["none", "restrict", "suspend", "ban"]);
export type ReportAction = z.infer<typeof ReportActionEnum>;

export const UpdateVerificationRequestSchema = z.object({
  status: z.enum(["approved", "rejected"]),
});
export type UpdateVerificationRequest = z.infer<typeof UpdateVerificationRequestSchema>;

export const UpdateReportRequestSchema = z.object({
  status: z.enum(["open", "reviewing", "resolved", "dismissed"]),
  action: ReportActionEnum.optional(),
});
export type UpdateReportRequest = z.infer<typeof UpdateReportRequestSchema>;

// ============================================================================
// Matching — API_CONTRACT.md §5
// ============================================================================

export const MatchResultSchema = z.object({
  userId: z.string().uuid(),
  matchScore: z.number().min(0).max(100),
  matchedCriteria: z.array(z.string()),
  unmatchedCriteria: z.array(z.string()),
});
export type MatchResultDTO = z.infer<typeof MatchResultSchema>;
