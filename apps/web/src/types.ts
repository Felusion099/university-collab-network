export type UserRole = 'student' | 'professor' | 'council_admin';

export type AvailabilityStatus = 'available' | 'selective' | 'busy';

export interface UserVerification {
  isVerified: boolean;
  badge: 'student' | 'faculty' | 'council' | 'lead';
  label: string;
}

export interface User {
  id: string;
  name: string;
  username: string;
  email: string;
  avatar: string;
  role: UserRole;
  university: string;
  department: string;
  yearOrTitle: string; // e.g. "Senior, Class of 2026" or "Associate Professor & Lab Lead"
  headline: string;
  bio: string;
  location?: string;
  verification: UserVerification;
  availability: AvailabilityStatus;
  availabilityLabel: string;
  skills: string[];
  collaborationInterests: string[];
  links: {
    github?: string;
    linkedin?: string;
    website?: string;
    scholar?: string;
  };
  stats: {
    completedProjects: number;
    portfolioCount: number;
    activeCollaborations: number;
    publicationsCount?: number;
  };
  publications?: {
    id: string;
    title: string;
    venue: string;
    year: number;
    link?: string;
    doi?: string;
  }[];
}

export interface PortfolioItem {
  id: string;
  userId: string;
  title: string;
  description: string;
  coverImage: string;
  tags: string[];
  category: 'Software' | 'Design' | 'Research' | 'Hardware' | 'Writing' | 'Other';
  role: string;
  outcomes?: string;
  technologies: string[];
  link?: string;
  date: string;
}

export interface ProjectRoleNeeded {
  id: string;
  roleTitle: string;
  skills: string[];
  filled: boolean;
}

export interface Project {
  id: string;
  ownerId: string;
  title: string;
  description: string;
  category: 'Hackathon' | 'Research' | 'Startup' | 'Software' | 'Hardware' | 'Design' | 'Academic';
  status: 'Open' | 'In Progress' | 'Completed' | 'Draft';
  requiredRoles: string[];
  skillsRequired: string[];
  currentTeam: {
    userId: string;
    role: string;
  }[];
  maxTeamSize: number;
  deadline: string;
  collaborationType: 'In-person' | 'Hybrid' | 'Remote';
  requirements: string[];
  tags: string[];
  createdAt: string;
  /** Public/private post-like visibility — separate from membership and
   * from user profile visibility. Private projects are visible only to
   * the owner and existing members (server-enforced). */
  visibility: 'public' | 'private';
}

export interface ProjectApplication {
  id: string;
  projectId: string;
  applicantId: string;
  roleApplied: string;
  message: string;
  relevantSkills: string[];
  portfolioLinks: string[];
  proposedTimeline: string;
  status: 'Submitted' | 'Shortlisted' | 'Accepted' | 'Rejected';
  submittedAt: string;
}

/** Professional connection — a first-class relationship SEPARATE from
 * project collaboration, follows, community membership and messaging.
 * States drive the UI: Connect / Request Sent / Accept-Decline / Connected. */
export interface Connection {
  id: string;
  requesterId: string;
  addresseeId: string;
  status: 'pending' | 'accepted' | 'declined' | 'blocked';
  message: string;
  createdAt: string;
}

export interface Community {
  id: string;
  name: string;
  handle: string;
  description: string;
  logo: string;
  coverImage: string;
  category: 'Club' | 'Research Lab' | 'Tech Society' | 'Cultural' | 'Design Studio';
  university: string;
  memberCount: number;
  leads: string[];
  members: string[];
  isJoined?: boolean;
  upcomingEventTitle?: string;
}

export interface CampusEvent {
  id: string;
  title: string;
  organizer: string;
  organizerId?: string;
  date: string;
  time: string;
  venue: string;
  description: string;
  category: 'Hackathon' | 'Seminar' | 'Workshop' | 'Exhibition' | 'Social';
  capacity: number;
  registeredCount: number;
  isRegistered?: boolean;
  tags: string[];
}

export interface CouncilAnnouncement {
  id: string;
  title: string;
  author: string;
  authorRole: string;
  department: string;
  date: string;
  content: string;
  priority: 'Urgent' | 'Important' | 'Notice';
  isPinned?: boolean;
  linkAction?: string;
}

export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  text: string;
  timestamp: string;
}

export interface Conversation {
  id: string;
  participantIds: string[];
  lastMessage: string;
  lastMessageTimestamp: string;
  unreadCount: number;
}

export interface NotificationItem {
  id: string;
  userId: string;
  type: 'application' | 'collab_request' | 'message' | 'announcement' | 'system';
  title: string;
  description: string;
  timestamp: string;
  isRead: boolean;
  linkTab?: 'projects' | 'people' | 'messages' | 'announcements' | 'dashboard';
  referenceId?: string;
}

export interface SavedItem {
  id: string;
  userId: string;
  itemType: 'person' | 'project' | 'community' | 'event';
  itemId: string;
  savedAt: string;
}

export interface Startup {
  id: string;
  name: string;
  slug: string;
  logo: string;
  description: string;
  category: string;
  /** Lifecycle: initial ideas stay under Projects — the Startups section
   * holds ongoing/incubated/graduated/completed ventures. */
  status: 'ongoing' | 'completed' | 'incubated' | 'graduated';
  industry: string;
  stage: string;
  websiteUrl?: string;
  hiring?: boolean;
  founders: string[];
  memberCount: number;
  university: string;
  isJoined?: boolean;
  createdAt: string;
}

export type ActiveTab =
  | 'home'
  | 'people'
  | 'projects'
  | 'startups'
  | 'communities'
  | 'events'
  | 'announcements'
  | 'dashboard'
  | 'messages'
  | 'saved';
