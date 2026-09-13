import { Link } from "react-router-dom";
import {
  FolderKanban,
  Users2,
  Building2,
  FlaskConical,
  ArrowRight,
} from "lucide-react";
import type { UserProfileResponse } from "@app/shared-types";
import { ProfileHeader } from "@/components/ProfileHeader";
import { SkillBadge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { cn } from "@/lib/utils";

/**
 * PortfolioView — the living university portfolio, shared by the viewer
 * detail pages (/students|/professors|/researchers/:username) and the
 * owner's /me page. Sections are role-aware: the professor portfolio
 * emphasizes research/mentorship, the student portfolio emphasizes
 * skills/projects/interests, the researcher portfolio emphasizes
 * expertise/publications. Data comes from GET /users/:username's
 * server-composed `portfolio` (real relationships, privacy-filtered
 * server-side) — never a stored duplicate.
 */
export function PortfolioView({
  user,
  isOwner = false,
  className,
}: {
  user: UserProfileResponse;
  isOwner?: boolean;
  className?: string;
}): JSX.Element {
  const role = user.role;
  const portfolio = user.portfolio;
  const profile =
    user.studentProfile ?? user.professorProfile ?? user.researcherProfile ?? null;

  const subtitle = buildSubtitle(user);
  const links = buildLinks(profile);
  const collaboration = buildCollaboration(user, profile);

  return (
    <div className={cn("space-y-8", className)}>
      {/* HERO — who is this person */}
      <ProfileHeader
        avatarUrl={user.avatarUrl ?? null}
        name={profile?.fullName ?? user.username}
        username={user.username}
        verified={user.isUniversityVerified}
        subtitle={subtitle}
      />

      {profile?.bio && (
        <section>
          <SectionTitle>About</SectionTitle>
          <p className="text-sm leading-relaxed text-text-secondary">{profile.bio}</p>
        </section>
      )}

      {/* SKILLS & EXPERTISE — role-aware emphasis */}
      {role === "professor" ? (
        <>
          {user.professorProfile?.expertise && user.professorProfile.expertise.length > 0 && (
            <section>
              <SectionTitle>Expertise</SectionTitle>
              <div className="flex flex-wrap gap-1.5">
                {user.professorProfile.expertise.map((e) => (
                  <SkillBadge key={e} skill={e} />
                ))}
              </div>
            </section>
          )}
          {portfolio && portfolio.skills.length > 0 && (
            <section>
              <SectionTitle>Skills</SectionTitle>
              <div className="flex flex-wrap gap-1.5">
                {portfolio.skills.map((s) => (
                  <SkillBadge key={s.id} skill={s.name} />
                ))}
              </div>
            </section>
          )}
        </>
      ) : (
        portfolio &&
        portfolio.skills.length > 0 && (
          <section>
            <SectionTitle>Skills</SectionTitle>
            <div className="flex flex-wrap gap-1.5">
              {portfolio.skills.map((s) => (
                <SkillBadge key={s.id} skill={s.name} />
              ))}
            </div>
          </section>
        )
      )}

      {/* RESEARCH — topics, teams, publications */}
      {portfolio && (portfolio.researchTopics.length > 0 || portfolio.researchTeams.length > 0 || portfolio.publications.length > 0) && (
        <section>
          <SectionTitle>Research</SectionTitle>
          <div className="space-y-4">
            {portfolio.researchTopics.length > 0 && (
              <div>
                <p className="mb-1.5 text-xs font-medium text-text-muted">Research interests</p>
                <div className="flex flex-wrap gap-1.5">
                  {portfolio.researchTopics.map((t) => (
                    <Link
                      key={t.id}
                      to={`/research/${t.slug}`}
                      className="inline-flex items-center gap-1 rounded-full bg-sunken px-2.5 py-0.5 text-xs font-medium text-text-secondary transition-colors hover:text-text-primary"
                    >
                      <FlaskConical className="h-3 w-3" aria-hidden="true" />
                      {t.name}
                    </Link>
                  ))}
                </div>
              </div>
            )}
            {portfolio.researchTeams.length > 0 && (
              <div>
                <p className="mb-1.5 text-xs font-medium text-text-muted">
                  {role === "professor" ? "Research teams led" : "Research teams"}
                </p>
                <ul className="space-y-1.5">
                  {portfolio.researchTeams.map((t) => (
                    <li key={t.id}>
                      <Link
                        to={`/research-teams/${t.id}`}
                        className="inline-flex items-center gap-1.5 text-sm text-text-primary hover:text-accent-600"
                      >
                        <Users2 className="h-3.5 w-3.5 text-text-muted" aria-hidden="true" />
                        {t.name}
                        {t.relation === "pi" && (
                          <span className="rounded-full bg-accent-100 px-2 py-0.5 text-[10px] font-semibold uppercase text-accent-700">
                            PI
                          </span>
                        )}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {portfolio.publications.length > 0 && (
              <div>
                <p className="mb-1.5 text-xs font-medium text-text-muted">Publications</p>
                <ul className="space-y-2">
                  {portfolio.publications.map((p) => (
                    <li key={p.id}>
                      <Link
                        to={`/publications/${p.id}`}
                        className="text-sm text-text-primary hover:text-accent-600"
                      >
                        {p.title}
                      </Link>
                      {p.journalOrConference && (
                        <span className="text-xs text-text-muted"> — {p.journalOrConference}</span>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </section>
      )}

      {/* PROJECTS — lead vs member distinction */}
      {portfolio &&
        (portfolio.projects.length > 0 ? (
          <section>
            <SectionTitle>Projects</SectionTitle>
            <ul className="space-y-2">
              {portfolio.projects.map((p) => (
                <li key={p.id}>
                  <Link
                    to={`/projects/${p.id}`}
                    className="inline-flex items-center gap-2 text-sm text-text-primary hover:text-accent-600"
                  >
                    <FolderKanban className="h-3.5 w-3.5 text-text-muted" aria-hidden="true" />
                    {p.name}
                    <span className="rounded-full bg-sunken px-2 py-0.5 text-[10px] font-semibold uppercase text-text-secondary">
                      {p.relation === "lead" ? "Lead" : "Member"}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        ) : (
          isOwner && (
            <EmptyState
              icon={FolderKanban}
              title="No projects yet"
              description="Create a project or join a team to showcase your work here."
              action={
                <Link
                  to="/projects"
                  className="mt-2 inline-flex items-center gap-1.5 rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground hover:bg-primary/90"
                >
                  Browse projects <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              }
            />
          )
        ))}

      {/* ORGANIZATIONS */}
      {portfolio && portfolio.organizations.length > 0 && (
        <section>
          <SectionTitle>Organizations</SectionTitle>
          <ul className="space-y-1.5">
            {portfolio.organizations.map((o) => (
              <li key={o.id} className="flex items-center gap-2 text-sm text-text-primary">
                <Building2 className="h-3.5 w-3.5 text-text-muted" aria-hidden="true" />
                {o.name}
                {o.orgType && (
                  <span className="text-xs capitalize text-text-muted">({o.orgType.replace(/_/g, " ")})</span>
                )}
                {o.relation === "creator" && (
                  <span className="rounded-full bg-accent-100 px-2 py-0.5 text-[10px] font-semibold uppercase text-accent-700">
                    Founder
                  </span>
                )}
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* COLLABORATION — what can I collaborate with this person on */}
      {collaboration && (
        <section>
          <SectionTitle>Collaboration</SectionTitle>
          <div className="rounded-lg border border-border bg-raised p-4 text-sm text-text-secondary">
            {collaboration}
          </div>
        </section>
      )}

      {/* LINKS */}
      {links.length > 0 && (
        <section>
          <SectionTitle>Links</SectionTitle>
          <div className="flex flex-wrap gap-2">
            {links.map((l) => (
              <a
                key={l.url}
                href={l.url}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 rounded-md border border-border px-3 py-1.5 text-sm text-text-primary hover:bg-sunken"
              >
                {l.label}
              </a>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }): JSX.Element {
  return (
    <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-text-muted">
      {children}
    </h2>
  );
}

function buildSubtitle(user: UserProfileResponse): string | null {
  const p = user.studentProfile ?? user.professorProfile ?? user.researcherProfile;
  if (user.professorProfile) {
    const parts = [user.professorProfile.designation, user.professorProfile.department].filter(
      Boolean,
    );
    if (parts.length > 0) return parts.join(" · ");
    return user.professorProfile.bio ? user.professorProfile.bio.slice(0, 80) : null;
  }
  if (user.studentProfile) {
    const parts = [user.studentProfile.course, user.studentProfile.department].filter(Boolean);
    if (parts.length > 0) return parts.join(" · ");
    return null;
  }
  if (user.researcherProfile) {
    return (user.researcherProfile.researcherType ?? "").replace(/_/g, " ") || null;
  }
  return p ? null : null;
}

interface ProfileLike {
  bio?: string | null;
  githubUrl?: string | null;
  linkedinUrl?: string | null;
  portfolioUrl?: string | null;
}

function buildLinks(profile: ProfileLike | null): { label: string; url: string }[] {
  if (!profile) return [];
  const links: { label: string; url: string }[] = [];
  if (profile.githubUrl) links.push({ label: "GitHub", url: profile.githubUrl });
  if (profile.linkedinUrl) links.push({ label: "LinkedIn", url: profile.linkedinUrl });
  if (profile.portfolioUrl) links.push({ label: "Portfolio", url: profile.portfolioUrl });
  return links;
}

function buildCollaboration(
  user: UserProfileResponse,
  profile: ProfileLike | null,
): string | null {
  const parts: string[] = [];

  if (user.professorProfile) {
    if (user.professorProfile.mentorshipAvailable) {
      parts.push("Open to mentoring students and researchers.");
    }
    if (user.professorProfile.officeContact) {
      parts.push(`Office contact available for university members.`);
    }
  }

  if (user.researcherProfile) {
    parts.push(
      user.researcherProfile.currentAvailability
        ? "Currently available for research collaboration."
        : "Not currently available for new collaborations.",
    );
  }

  const studentProfile = user.studentProfile;
  if (studentProfile?.lookingFor) {
    const lf = studentProfile.lookingFor;
    const items = Array.isArray(lf)
      ? lf.map(String)
      : typeof lf === "string"
        ? [lf]
        : [];
    if (items.length > 0) {
      parts.push(`Looking for: ${items.join(", ")}.`);
    }
  }

  if (parts.length === 0 && profile?.bio && profile.bio.length > 0) {
    return null;
  }

  return parts.length > 0 ? parts.join(" ") : null;
}
