/**
 * Audit logging service for professor actions
 * Logs consequential professor actions for audit trail
 * NOTE: This is a stub implementation - requires auditLog model in Prisma schema
 */
export enum AuditAction {
  // Research Topic actions
  RESEARCH_TOPIC_CREATE = 'RESEARCH_TOPIC_CREATE',
  RESEARCH_TOPIC_UPDATE = 'RESEARCH_TOPIC_UPDATE',
  RESEARCH_TOPIC_DELETE = 'RESEARCH_TOPIC_DELETE',
  RESEARCH_TOPIC_STATUS_CHANGE = 'RESEARCH_TOPIC_STATUS_CHANGE',
  
  // Research Team actions
  RESEARCH_TEAM_CREATE = 'RESEARCH_TEAM_CREATE',
  RESEARCH_TEAM_UPDATE = 'RESEARCH_TEAM_UPDATE',
  RESEARCH_TEAM_DELETE = 'RESEARCH_TEAM_DELETE',
  RESEARCH_TEAM_ADD_MEMBER = 'RESEARCH_TEAM_ADD_MEMBER',
  RESEARCH_TEAM_REMOVE_MEMBER = 'RESEARCH_TEAM_REMOVE_MEMBER',
  RESEARCH_TEAM_UPDATE_MEMBER_ROLE = 'RESEARCH_TEAM_UPDATE_MEMBER_ROLE',
  RESEARCH_TEAM_TRANSFER_PI = 'RESEARCH_TEAM_TRANSFER_PI',
  
  // Project actions
  PROJECT_CREATE = 'PROJECT_CREATE',
  PROJECT_UPDATE = 'PROJECT_UPDATE',
  PROJECT_DELETE = 'PROJECT_DELETE',
  PROJECT_STATUS_CHANGE = 'PROJECT_STATUS_CHANGE',
  PROJECT_ADD_MEMBER = 'PROJECT_ADD_MEMBER',
  PROJECT_REMOVE_MEMBER = 'PROJECT_REMOVE_MEMBER',
  PROJECT_UPDATE_MEMBER_ROLE = 'PROJECT_UPDATE_MEMBER_ROLE',
  
  // Publication actions
  PUBLICATION_CREATE = 'PUBLICATION_CREATE',
  PUBLICATION_UPDATE = 'PUBLICATION_UPDATE',
  PUBLICATION_DELETE = 'PUBLICATION_DELETE',
  PUBLICATION_ADD_AUTHOR = 'PUBLICATION_ADD_AUTHOR',
  PUBLICATION_REMOVE_AUTHOR = 'PUBLICATION_REMOVE_AUTHOR',
  PUBLICATION_UPDATE_AUTHOR_ORDER = 'PUBLICATION_UPDATE_AUTHOR_ORDER',
}

export interface AuditLogEntry {
  actorId: string;
  action: AuditAction;
  targetType: string;
  targetId: string;
  metadata?: Record<string, unknown>;
  timestamp: Date;
  ipAddress?: string;
  userAgent?: string;
}

/**
 * Logs an audit entry for a professor action
 * NOTE: This is a stub implementation - requires auditLog model in Prisma schema
 */
export async function logAuditEntry(entry: Omit<AuditLogEntry, 'timestamp'>): Promise<void> {
  try {
    // TODO: Enable when auditLog model is added to Prisma schema
    // await prisma.auditLog.create({
    //   data: {
    //     actorId: entry.actorId,
    //     action: entry.action,
    //     targetType: entry.targetType,
    //     targetId: entry.targetId,
    //     metadata: entry.metadata || {},
    //     ipAddress: entry.ipAddress,
    //     userAgent: entry.userAgent,
    //   },
    // });
    // Stub: audit log entry
    void entry;
  } catch (err: unknown) {
    // Log error but don't throw - audit logging should never break the main flow
    // Stub: audit logging failed
    void err;
  }
}

/**
 * Helper to log professor research topic actions
 */
export async function logResearchTopicAction(
  professorId: string,
  action: 'CREATE' | 'UPDATE' | 'DELETE' | 'STATUS_CHANGE',
  topicId: string,
  metadata?: Record<string, unknown>
) {
  const actionMap = {
    CREATE: AuditAction.RESEARCH_TOPIC_CREATE,
    UPDATE: AuditAction.RESEARCH_TOPIC_UPDATE,
    DELETE: AuditAction.RESEARCH_TOPIC_DELETE,
    STATUS_CHANGE: AuditAction.RESEARCH_TOPIC_STATUS_CHANGE,
  } as const;
  
  await logAuditEntry({
    actorId: professorId,
    action: actionMap[action],
    targetType: 'researchTopic',
    targetId: topicId,
    metadata,
  });
}

/**
 * Helper to log professor research team actions
 */
export async function logResearchTeamAction(
  professorId: string,
  action: 'CREATE' | 'UPDATE' | 'DELETE' | 'ADD_MEMBER' | 'REMOVE_MEMBER' | 'UPDATE_MEMBER_ROLE' | 'TRANSFER_PI',
  teamId: string,
  metadata?: Record<string, unknown>
) {
  const actionMap = {
    CREATE: AuditAction.RESEARCH_TEAM_CREATE,
    UPDATE: AuditAction.RESEARCH_TEAM_UPDATE,
    DELETE: AuditAction.RESEARCH_TEAM_DELETE,
    ADD_MEMBER: AuditAction.RESEARCH_TEAM_ADD_MEMBER,
    REMOVE_MEMBER: AuditAction.RESEARCH_TEAM_REMOVE_MEMBER,
    UPDATE_MEMBER_ROLE: AuditAction.RESEARCH_TEAM_UPDATE_MEMBER_ROLE,
    TRANSFER_PI: AuditAction.RESEARCH_TEAM_TRANSFER_PI,
  } as const;
  
  await logAuditEntry({
    actorId: professorId,
    action: actionMap[action],
    targetType: 'researchTeam',
    targetId: teamId,
    metadata,
  });
}

/**
 * Helper to log professor project actions
 */
export async function logProjectAction(
  professorId: string,
  action: 'CREATE' | 'UPDATE' | 'DELETE' | 'STATUS_CHANGE' | 'ADD_MEMBER' | 'REMOVE_MEMBER' | 'UPDATE_MEMBER_ROLE',
  projectId: string,
  metadata?: Record<string, unknown>
) {
  const actionMap = {
    CREATE: AuditAction.PROJECT_CREATE,
    UPDATE: AuditAction.PROJECT_UPDATE,
    DELETE: AuditAction.PROJECT_DELETE,
    STATUS_CHANGE: AuditAction.PROJECT_STATUS_CHANGE,
    ADD_MEMBER: AuditAction.PROJECT_ADD_MEMBER,
    REMOVE_MEMBER: AuditAction.PROJECT_REMOVE_MEMBER,
    UPDATE_MEMBER_ROLE: AuditAction.PROJECT_UPDATE_MEMBER_ROLE,
  } as const;
  
  await logAuditEntry({
    actorId: professorId,
    action: actionMap[action],
    targetType: 'project',
    targetId: projectId,
    metadata,
  });
}

/**
 * Helper to log professor publication actions
 */
export async function logPublicationAction(
  professorId: string,
  action: 'CREATE' | 'UPDATE' | 'DELETE' | 'ADD_AUTHOR' | 'REMOVE_AUTHOR' | 'UPDATE_AUTHOR_ORDER',
  publicationId: string,
  metadata?: Record<string, unknown>
) {
  const actionMap = {
    CREATE: AuditAction.PUBLICATION_CREATE,
    UPDATE: AuditAction.PUBLICATION_UPDATE,
    DELETE: AuditAction.PUBLICATION_DELETE,
    ADD_AUTHOR: AuditAction.PUBLICATION_ADD_AUTHOR,
    REMOVE_AUTHOR: AuditAction.PUBLICATION_REMOVE_AUTHOR,
    UPDATE_AUTHOR_ORDER: AuditAction.PUBLICATION_UPDATE_AUTHOR_ORDER,
  } as const;
  
  await logAuditEntry({
    actorId: professorId,
    action: actionMap[action],
    targetType: 'publication',
    targetId: publicationId,
    metadata,
  });
}
