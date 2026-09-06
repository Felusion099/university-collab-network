# PROJECT_SPEC.md — University Collaboration & Research Network

## 1. Product Definition
A university-scoped platform connecting Students, Professors, Researchers, Research Teams, Projects, Clubs/Societies, Startups, Publications, Research Topics, Opportunities, and Events into one discoverable, collaborative graph. Not an ERP. Not a social-media clone. Core question it must answer for every user: *"Who / what project / what research / what opportunity should I know about right now?"*

## 2. Non-Negotiable Principles
- **Beautiful** — premium, distinctive visual identity (see ARCHITECTURE.md §Design System).
- **Functional** — auth, privacy, search, messaging, and workflows must actually work end-to-end, not be decorative.
- **Useful** — every feature must trace back to: discovery, collaboration, research, networking, opportunity-matching, or security. Anything else is out of scope (see "Anti-Crap Rule" below).

## 3. Anti-Crap Rule (applies to every phase)
Before adding anything, ask: *does this improve discovery, collaboration, research, networking, opportunity discovery, usability, security, or product quality?* If no — do not build it. No vanity metrics, no gamification, no decorative dashboards, no pages added just to pad the sitemap.

## 4. Core Entities
`User, StudentProfile, ProfessorProfile, ResearcherProfile, Organization (club/society/startup), ResearchTeam, ResearchTopic, Project, Publication, Event, Opportunity, Skill, Connection, Message, Notification, Application, Membership, PrivacySettings, Verification, Report`

Full column-level detail lives in `DATABASE_SCHEMA.md`.

## 5. Core Relationships
```
Student   -MEMBER_OF->      Organization
Student   -CONTRIBUTES_TO-> Project
Student   -INTERESTED_IN->  ResearchTopic
Professor -LEADS->          ResearchTeam
Researcher-MEMBER_OF->      ResearchTeam
Researcher-AUTHORS->        Publication
Publication-ABOUT->         ResearchTopic
Project   -RELATED_TO->     ResearchTopic
Project   -USES->           Skill
Organization(startup)-FOUNDED_BY-> Student
Opportunity-PROVIDED_BY->   Organization | ResearchTeam
Event     -ORGANIZED_BY->   Organization | ResearchTeam
```
These relationships are what power search, discovery, and the team-builder match score — they are not decorative and must be queryable both directions.

## 6. Functional Scope (mapped to routes)
See `FILE_STRUCTURE.md` for route → owning phase, and the original master prompt (sections 3–26) for full per-page field lists. Summary of top-level areas:

- Auth: signup, login, logout, forgot password, email + university-email verification, session mgmt, RBAC.
- Profiles: role-specific profile pages with field-level privacy.
- Global search across all entity types with categorized, filtered results.
- Directories: `/students /professors /researchers /research /publications /research-teams /projects /clubs /startups /events /opportunities`.
- Team Builder / collaboration matching with explainable match scores.
- Networking: connect, follow, invite, message (1:1, group, project, team, club).
- Notifications with user-controlled preferences.
- Discover page with explained recommendations.
- Optional network/graph visualization.
- Admin panel: verification, moderation, reports, suspension.

## 7. Privacy Model (mandatory, not cosmetic)
Profile-level: `public | university_only | connections_only | private`.
Field-level (independently settable): email, phone, academic info, CGPA, projects, research, social links, connections, activity, contact info.
**Hard rule:** unauthorized viewers must never receive private fields in the API response body — enforcement point is documented in `DECISIONS.md` D-004.

## 8. Success Metric
Not likes/followers/screen-time. Track: connections formed, projects formed, research collaborations created, opportunities discovered/applied-to, students joining teams. Admin dashboard metrics reflect this (see spec §25), not vanity counts.

## 9. Out-of-Scope for MVP (explicitly deferred, not forgotten)
- Multi-university federation (schema allows it later via `university_id` on `users`, not built now).
- Real-time WebSocket messaging (service-layer interface reserved, see D-001).
- Native mobile apps.
- Payment/monetization of any kind.

## 10. Reference
This spec is a condensed, implementation-oriented derivative of the full master prompt supplied by the product owner. Where this file and the original prompt appear to disagree, the original master prompt's *intent* wins and this file should be corrected — log the correction in `DECISIONS.md`.
