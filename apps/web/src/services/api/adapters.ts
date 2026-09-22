import type {
  UserProfileResponse,
  UserSkillRef,
  EventType,
  SkillRoleNeeded,
} from '@app/shared-types';
import type {
  User,
  UserRole,
  AvailabilityStatus,
  Project,
  CampusEvent,
  Conversation,
  Message,
  NotificationItem,
  ProjectApplication,
  Connection,
} from '../../types';

/* ============================================================================
 * Adapters — map the live API's DTO shapes (shared-types / Prisma rows)
 * onto the Campus UI's display types. Nulls are normalized to display
 * defaults so the existing components render unchanged.
 * ==========================================================================*/

type AnyRow = Record<string, unknown>;

export const str = (v: unknown, fallback = ''): string =>
  typeof v === 'string' ? v : fallback;

const num = (v: unknown, fallback = 0): number =>
  typeof v === 'number' && Number.isFinite(v) ? v : fallback;

const arr = <T,>(v: unknown): T[] => (Array.isArray(v) ? (v as T[]) : []);

const strArr = (v: unknown): string[] => arr<string>(v).map((s) => String(s));

/** Deterministic, self-contained avatar — no network needed for users
 * without an avatarUrl. Initials on a hashed pastel background. */
export function initialsAvatar(name: string): string {
  const safeName = typeof name === 'string' ? name : '';
  const initials = safeName
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]!.toUpperCase())
    .join('') || 'U';
  let hash = 0;
  for (let i = 0; i < safeName.length; i++) hash = (hash * 31 + safeName.charCodeAt(i)) >>> 0;
  const palettes = [
    ['6366f1', 'a5b4fc'],
    ['0ea5e9', '7dd3fc'],
    ['10b981', '6ee7b7'],
    ['f59e0b', 'fcd34d'],
    ['8b5cf6', 'c4b5fd'],
    ['ec4899', 'f9a8d4'],
  ];
  const [c1, c2] = palettes[hash % palettes.length]!;
  const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='128' height='128'><defs><linearGradient id='g' x1='0' y1='0' x2='1' y2='1'><stop offset='0%' stop-color='#${c1}'/><stop offset='100%' stop-color='#${c2}'/></linearGradient></defs><rect width='128' height='128' rx='64' fill='url(#g)'/><text x='64' y='64' dy='0.36em' text-anchor='middle' font-family='Inter,system-ui,sans-serif' font-size='44' font-weight='700' fill='white'>${initials}</text></svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

const ROLE_BADGES: Record<string, { badge: User['verification']['badge']; label: string }> = {
  student: { badge: 'student', label: 'Verified Student' },
  professor: { badge: 'faculty', label: 'Verified Faculty' },
  council_admin: { badge: 'council', label: 'Council Admin' },
  admin: { badge: 'council', label: 'Administrator' },
  researcher: { badge: 'lead', label: 'Verified Researcher' },
};

const ROLE_MAP: Record<string, UserRole> = {
  student: 'student',
  professor: 'professor',
  admin: 'council_admin',
};

const mapAvailability = (v: unknown): AvailabilityStatus => {
  const s = str(v, 'available');
  return s === 'selective' || s === 'busy' ? s : 'available';
};

const AVAILABILITY_LABELS: Record<AvailabilityStatus, string> = {
  available: 'Available for new collaborations',
  selective: 'Selective — reach out with specifics',
  busy: 'Busy — expect delayed responses',
};

const ROLE_LABELS: Record<SkillRoleNeeded, string> = {
  frontend: 'Frontend Developer',
  backend: 'Backend Developer',
  ml: 'ML Engineer',
  design: 'Designer',
  research: 'Researcher',
  product: 'Product Manager',
  other: 'Collaborator',
};

export function roleLabel(role: string): string {
  return ROLE_LABELS[role as SkillRoleNeeded] ?? role;
}

export function mapApiRoleToC1(role: string): UserRole {
  return ROLE_MAP[role] ?? 'student';
}

/* ------------------------------- Users ---------------------------------- */

export function mapApiUser(raw: UserProfileResponse): User {
  const student = raw.studentProfile ?? null;
  const professor = raw.professorProfile ?? null;
  const professional = raw.professionalProfile ?? null;
  const researcher = raw.researcherProfile ?? null;
  const profile = student ?? professor ?? professional ?? researcher;

  const profileName = str(raw.username) || str(raw.email).split('@')[0] || 'Member';
  const fullName =
    student?.fullName ?? professor?.fullName ?? professional?.fullName ??
    researcher?.fullName ?? profileName;
  const username = str(raw.username) || str(raw.email).split('@')[0] || 'member';

  const portfolio = raw.portfolio;
  // Skills: the composed portfolio (detail view) OR the DB-backed
  // user_skills from the list rows (the directory — no N+1 hydration)
  const skillNames = arr<UserSkillRef>(portfolio?.skills).map((s) => s.name);
  const listSkills = arr<{ skill?: { name?: string } }>((raw as AnyRow).userSkills)
    .map((us) => us.skill?.name ?? '')
    .filter(Boolean);
  const expertise = strArr(professor?.expertise);
  const skills = skillNames.length > 0 ? skillNames : listSkills.length > 0 ? listSkills : expertise;

  const bioText = str(profile?.bio ?? '');
  const headline = bioText.split('\n')[0]?.trim().slice(0, 90) ?? '';

  const yearOrTitle = professor?.designation
    ? professor.designation.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
    : student?.year
      ? `Year ${student.year}${student.course ? ` · ${student.course}` : ''}`
      : researcher?.researcherType
        ? researcher.researcherType.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
        : '';

  const projectRefs = arr<{ status?: string }>(portfolio?.projects);
  const completedProjects = projectRefs.filter((p) => p.status === 'completed').length;

  const GOAL_LABELS: Record<string, string> = {
    find_collaborators: 'Finding collaborators',
    join_projects: 'Joining projects',
    research_opportunities: 'Research opportunities',
    find_mentors: 'Finding mentors',
    find_cofounders: 'Finding co-founders',
    internships: 'Internships',
    build_team: 'Building a team',
    share_work: 'Sharing work',
    startup_opportunities: 'Startup opportunities',
    connect_people: 'Connecting people',
  };

  const badgeInfo = ROLE_BADGES[raw.role] ?? { badge: 'student' as const, label: 'Member' };

  return {
    id: raw.id,
    name: fullName,
    username,
    email: str(raw.email),
    avatar: raw.avatarUrl || initialsAvatar(fullName),
    role: mapApiRoleToC1(raw.role),
    university: str(student?.university ?? professor?.institution ?? researcher?.institution, 'University'),
    department: str(student?.department ?? professor?.department ?? researcher?.department),
    yearOrTitle,
    headline,
    bio: bioText,
    verification: {
      isVerified: raw.isUniversityVerified,
      badge: badgeInfo.badge,
      label: badgeInfo.label,
    },
    availability: 'available',
    availabilityLabel: AVAILABILITY_LABELS.available,
    skills,
    collaborationInterests: arr<string>(raw.goals).map((g) => GOAL_LABELS[g] ?? g),
    links: {
      github: student?.githubUrl ?? undefined,
      linkedin: student?.linkedinUrl ?? undefined,
      website: student?.portfolioUrl ?? undefined,
    },
    stats: {
      completedProjects,
      portfolioCount: projectRefs.length,
      activeCollaborations: projectRefs.filter((p) => p.status !== 'completed').length,
      publicationsCount: arr(portfolio?.publications).length,
    },
    publications: arr<{ id?: string; title?: string; publishedDate?: string | null; journalOrConference?: string | null }>(portfolio?.publications).map((p) => {
      const year = p.publishedDate ? Number.parseInt(p.publishedDate.slice(0, 4), 10) : NaN;
      return {
        id: p.id ?? '',
        title: p.title ?? 'Untitled',
        venue: p.journalOrConference ?? 'Preprint',
        year: Number.isFinite(year) ? year : new Date().getFullYear(),
      };
    }),
  };
}

/* ------------------------------ Projects -------------------------------- */

function mapProjectStatus(status: string): Project['status'] {
  switch (status) {
    case 'idea':
      return 'Draft';
    case 'planning':
    case 'active':
      return 'Open';
    case 'development':
    case 'beta':
      return 'In Progress';
    case 'completed':
      return 'Completed';
    default:
      return 'Open';
  }
}

export function mapApiProject(raw: AnyRow): Project {
  const skillsNeeded = arr<{ roleNeeded?: string; skill?: { name?: string } }>(raw.skillsNeeded);
  const members = arr<{ user?: { id?: string; username?: string; avatarUrl?: string | null }; roleOnProject?: string | null }>(raw.members);
  const creator = raw.creator as { id?: string; username?: string } | null | undefined;
  const topics = arr<{ researchTopic?: { id?: string; name?: string; slug?: string } }>(raw.topics);
  const requirements = arr<string>(raw.requirements).map((s) => String(s));
  const tagsFromTopics = topics.map((t) => t.researchTopic?.name ?? '').filter(Boolean);

  const requiredRoles = skillsNeeded
    .filter((s) => s.roleNeeded)
    .map((s) => roleLabel(s.roleNeeded!));

  return {
    id: String(raw.id),
    ownerId: creator?.id ?? '',
    title: String(raw.name),
    description: str(raw.description ?? raw.problemStatement),
    category: (str(raw.category) || 'Software') as Project['category'],
    status: mapProjectStatus(str(raw.status, 'idea')),
    requiredRoles,
    skillsRequired: skillsNeeded.map((s) => s.skill?.name ?? '').filter(Boolean),
    currentTeam: members.map((m) => ({
      userId: m.user?.id ?? '',
      role: m.roleOnProject ?? 'Member',
    })),
    maxTeamSize: num(raw.maxTeamSize, Math.max(4, members.length + requiredRoles.length)),
    deadline: str(raw.deadlineText),
    collaborationType: (str(raw.collaborationType) || 'Hybrid') as Project['collaborationType'],
    requirements,
    tags: tagsFromTopics,
    createdAt: str(raw.createdAt, new Date().toISOString()).slice(0, 10),
    visibility: str(raw.visibility) === 'private' ? 'private' : 'public',
  };
}

/* ------------------------------- Events --------------------------------- */

const EVENT_CATEGORY_MAP: Record<EventType, CampusEvent['category']> = {
  hackathon: 'Hackathon',
  workshop: 'Workshop',
  seminar: 'Seminar',
  conference: 'Seminar',
  talk: 'Seminar',
  guest_lecture: 'Seminar',
  competition: 'Exhibition',
  startup_event: 'Social',
  club_event: 'Social',
};

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export function mapApiEvent(raw: AnyRow, currentUserId: string): CampusEvent {
  const participants = arr<{ user?: { id?: string } }>(raw.participants);
  const dateStr = str(raw.date);
  const d = new Date(dateStr);
  const dateLabel = Number.isNaN(d.getTime())
    ? dateStr
    : `${MONTHS[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`;

  const timeRaw = raw.time as string | null | undefined;
  let timeLabel = '';
  if (timeRaw) {
    const m = /^(\d{2}):(\d{2})/.exec(timeRaw);
    if (m) {
      const h = Number(m[1]);
      const min = m[2];
      const suffix = h >= 12 ? 'PM' : 'AM';
      const h12 = h % 12 === 0 ? 12 : h % 12;
      timeLabel = `${h12}:${min} ${suffix}`;
    } else {
      timeLabel = timeRaw;
    }
  }

  const org = raw.organizerOrganization as { name?: string } | null | undefined;
  const team = raw.organizerResearchTeam as { name?: string } | null | undefined;

  return {
    id: String(raw.id),
    title: String(raw.title),
    organizer: org?.name ?? team?.name ?? 'University',
    date: dateLabel,
    time: timeLabel,
    venue: str(raw.venue, 'TBA'),
    description: str(raw.description),
    category: EVENT_CATEGORY_MAP[str(raw.eventType) as EventType] ?? 'Social',
    capacity: num(raw.capacity),
    registeredCount: participants.length,
    isRegistered: participants.some((p) => p.user?.id === currentUserId),
    tags: arr<string>(raw.tags).map((s) => String(s)),
  };
}

/* ---------------------------- Conversations ------------------------------ */

export function mapApiConversation(raw: AnyRow): Conversation {
  const participants = arr<{ user?: { id?: string } }>(raw.participants);
  const messages = arr<{ body?: string; sentAt?: string }>(raw.messages);
  const last = messages[messages.length - 1];

  return {
    id: String(raw.id),
    participantIds: participants.map((p) => p.user?.id ?? '').filter(Boolean),
    lastMessage: last?.body ?? 'Conversation started',
    lastMessageTimestamp: last?.sentAt ? relativeTime(last.sentAt) : 'Just now',
    unreadCount: 0,
  };
}

export function mapApiMessage(raw: AnyRow, conversationId: string): Message {
  return {
    id: String(raw.id),
    conversationId,
    senderId: str(raw.senderId, str((raw.sender as AnyRow | undefined)?.id)),
    text: str(raw.body),
    timestamp: raw.sentAt ? relativeTime(str(raw.sentAt)) : 'Just now',
  };
}

export function relativeTime(iso: string): string {
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return 'Just now';
  const diff = Date.now() - then;
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  const d = new Date(iso);
  return `${MONTHS[d.getMonth()]} ${d.getDate()}`;
}

/* ---------------------------- Notifications ------------------------------ */

const NOTIF_TYPE_MAP: Record<
  string,
  { type: NotificationItem['type']; title: string; linkTab: NotificationItem['linkTab'] }
> = {
  connection_request: { type: 'collab_request', title: 'Collaboration Invitation', linkTab: 'dashboard' },
  message: { type: 'message', title: 'New Message', linkTab: 'messages' },
  new_message: { type: 'message', title: 'New Message', linkTab: 'messages' },
  project_invitation: { type: 'application', title: 'Project Invitation', linkTab: 'dashboard' },
  research_invitation: { type: 'application', title: 'Research Invitation', linkTab: 'dashboard' },
  event_reminder: { type: 'system', title: 'Event Reminder', linkTab: 'dashboard' },
  club_announcement: { type: 'announcement', title: 'Announcement', linkTab: 'announcements' },
  opportunity_deadline: { type: 'system', title: 'Opportunity Deadline', linkTab: 'dashboard' },
  publication: { type: 'system', title: 'Publication', linkTab: 'dashboard' },
  team_recruitment: { type: 'application', title: 'Team Recruitment', linkTab: 'dashboard' },
  profile_interaction: { type: 'system', title: 'Profile Interaction', linkTab: 'people' },
};

export function mapApiNotification(raw: AnyRow, currentUserId: string): NotificationItem {
  const payload = (raw.payload ?? {}) as AnyRow;
  const apiType = str(raw.type, 'system');
  const info = NOTIF_TYPE_MAP[apiType] ?? { type: 'system' as const, title: 'Notification', linkTab: 'dashboard' as const };

  return {
    id: String(raw.id),
    userId: currentUserId,
    type: info.type,
    title: str(payload.title) || info.title,
    description: str(payload.message ?? payload.body),
    timestamp: raw.createdAt ? relativeTime(str(raw.createdAt)) : 'Just now',
    isRead: !!raw.readAt,
    linkTab: info.linkTab,
    referenceId: str(payload.connectionId ?? payload.eventId ?? payload.projectId) || undefined,
  };
}

/* --------------------------- Project applications ------------------------ */

export function mapApiJoinRequestAsApplication(raw: AnyRow, forProject: boolean): ProjectApplication {
  const user = (raw.user ?? {}) as AnyRow;
  const project = (raw.project ?? {}) as AnyRow;
  const message = str(raw.message);

  // Live join-requests carry only a message — the applied role is parsed
  // back from the "[Role] ..." prefix the Campus UI prepends on apply.
  let roleApplied = 'Collaborator';
  let bodyText = message;
  const m = /^\[([^\]]+)\]\s*/.exec(message);
  if (m) {
    roleApplied = m[1]!;
    bodyText = message.slice(m[0].length);
  }

  const status = str(raw.status, 'pending');
  const statusLabel =
    status === 'accepted' ? 'Accepted' : status === 'rejected' ? 'Rejected' : 'Submitted';

  return {
    id: String(raw.id),
    projectId: forProject ? String(raw.projectId ?? '') : String(project.id ?? ''),
    applicantId: String(user.id ?? ''),
    roleApplied,
    message: bodyText,
    relevantSkills: [],
    portfolioLinks: [],
    proposedTimeline: '',
    status: statusLabel,
    submittedAt: str(raw.createdAt, new Date().toISOString()).slice(0, 10),
  };
}

/* -------------------------- Collaboration requests ----------------------- */

export function mapApiConnection(raw: AnyRow): Connection {
  const requester = (raw.requester ?? raw.requesterUser ?? {}) as AnyRow;
  const addressee = (raw.addressee ?? raw.addresseeUser ?? {}) as AnyRow;
  const status = str(raw.status, 'pending');
  const allowed = ['pending', 'accepted', 'declined', 'blocked'];

  return {
    id: String(raw.id),
    requesterId: String(requester.id ?? ''),
    addresseeId: String(addressee.id ?? ''),
    status: (allowed.includes(status) ? status : 'pending') as Connection['status'],
    message: str(raw.message),
    createdAt: str(raw.createdAt, new Date().toISOString()).slice(0, 10),
  };
}
