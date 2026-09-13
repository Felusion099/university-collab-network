# DATABASE_SCHEMA.md

Postgres via Prisma. Naming: `snake_case` tables/columns, plural table names, `id` = UUID PK everywhere, `created_at`/`updated_at` on every table (omitted below for brevity but mandatory). This file is authoritative — do not rename columns/tables without a `DECISIONS.md` entry.

## Core Identity

**users**
`id, email (unique), username (unique — added per DECISIONS.md D-013, server-generated at signup, backs API_CONTRACT.md §2's GET /users/:username), phone (nullable — added per DECISIONS.md D-018, gated by privacy_settings.phone_visibility), password_hash, requested_role (enum: student|professor|researcher|club_rep|startup_member|alumni|admin), status (enum: pending_verification|active|suspended|banned), is_university_verified (bool), university_domain, avatar_url, onboarding_completed_at (nullable timestamp — added per DECISIONS.md D-023, NULL = new-user onboarding incomplete; backs API_CONTRACT.md §2's GET/POST /users/me/onboarding), created_at, updated_at`
Indexes: `email`, `username`, `status`.

**refresh_tokens**
`id, user_id (FK users), token_hash, expires_at, revoked_at (nullable)`
Index: `user_id`.

**verifications**
`id, user_id (FK users), role_claimed (enum, same set as requested_role minus student/alumni), status (enum: pending|approved|rejected), reviewed_by (FK users, nullable), evidence_url (nullable)`
Index: `(user_id, role_claimed)` unique.

## Profiles (1:1 with users, role-specific)

**student_profiles**
`user_id (PK, FK users), full_name, department, course, year, university, bio, cgpa (nullable), github_url, linkedin_url, portfolio_url, looking_for (jsonb: teammates|research|internship|mentoring|networking)`

**professor_profiles**
`user_id (PK, FK users), full_name, department, designation, expertise (text[]), bio, office_contact, mentorship_available (bool)`

**researcher_profiles**
`user_id (PK, FK users), full_name, researcher_type (enum: phd|postdoc|research_associate|research_assistant|faculty), department, bio, current_availability (bool)`

**privacy_settings**
`user_id (PK, FK users), profile_visibility (enum: public|university_only|connections_only|private), email_visibility, phone_visibility, academic_visibility, cgpa_visibility, projects_visibility, research_visibility, social_links_visibility, connections_visibility, activity_visibility, contact_visibility`
(each `*_visibility` reuses the same 4-value enum as `profile_visibility`). Enforced server-side per DECISIONS D-004 — this table is read by the profile service on every profile fetch, never trusted to the client.

## Organizations (clubs / societies / startups)

**organizations**
`id, type (enum: club|society|startup), name, slug (unique), logo_url, description, category, faculty_advisor_id (FK users, nullable), created_by (FK users)`

**startup_details** (1:1 extension, only when `organizations.type = startup`)
`organization_id (PK, FK organizations), industry, stage, website_url, hiring (bool)`

**memberships** (generic join: user ↔ organization/research_team, replaces separate "club member" / "team member" tables)
`id, user_id (FK users), organization_id (FK organizations, nullable), research_team_id (FK research_teams, nullable), role (enum: member|leader|advisor|founder|pi), joined_at`
Constraint: exactly one of `organization_id`/`research_team_id` non-null. Index: `user_id`, `organization_id`, `research_team_id`.

## Research

**research_topics**
`id, name (unique), slug (unique), description, parent_topic_id (FK research_topics, nullable — for "related topics")`

**research_teams**
`id, name, description, pi_user_id (FK users), created_by (FK users)`

**research_team_topics** (join): `research_team_id, research_topic_id`

**user_research_topics** (join): `user_id (FK users), research_topic_id (FK research_topics)` — models `Student -INTERESTED_IN-> ResearchTopic` from `PROJECT_SPEC.md` §5 (a user's personal research interests, independent of any team/project/publication they belong to). Added per `DECISIONS.md` D-009 — this relationship had no table before. Mirrors `user_skills`' shape.

**publications**
`id, title, abstract, journal_or_conference, published_date, doi, external_url, pdf_url`

**publication_authors** (join, ordered): `publication_id (FK publications), user_id (FK users), author_order`

**publication_topics** (join): `publication_id, research_topic_id`

## Projects

**projects**
`id, name, logo_url, problem_statement, solution_description, description, status (enum: idea|planning|development|beta|active|completed|archived), github_url, demo_url, docs_url, created_by (FK users)`

**project_members** (join): `project_id (FK projects), user_id (FK users), role_on_project`

**project_skills_needed** (join): `project_id, skill_id (FK skills), role_needed (enum: frontend|backend|ml|design|research|product|other)`

**project_topics** (join): `project_id, research_topic_id`

## Skills

**skills**
`id, name (unique), category (nullable)`

**user_skills** (join): `user_id (FK users), skill_id (FK skills), proficiency (enum: beginner|intermediate|advanced|expert, nullable)`

## Events

**events**
`id, title, description, event_type (enum: hackathon|workshop|seminar|conference|talk|guest_lecture|competition|startup_event|club_event), date, time, venue, organizer_organization_id (FK organizations, nullable), organizer_research_team_id (FK research_teams, nullable), registration_url`

**event_participants** (join): `event_id, user_id`

## Opportunities

**opportunities**
`id, title, description, opportunity_type (enum: research|internship|project|startup|volunteer|club|hackathon|mentorship|thesis|research_assistant|teaching_assistant), provided_by_organization_id (FK organizations, nullable), provided_by_research_team_id (FK research_teams, nullable), deadline, department_tag, research_topic_id (nullable FK)`

**applications**
`id, opportunity_id (FK opportunities), applicant_id (FK users), status (enum: submitted|under_review|accepted|rejected), submitted_at`

## Networking

**connections**
`id, requester_id (FK users), addressee_id (FK users), status (enum: pending|accepted|declined|blocked), message (the "why connect" text)`
Unique: `(requester_id, addressee_id)`.

**follows**: `follower_id (FK users), followee_id (FK users)` — composite PK, no status (one-directional, instant).

## Messaging

**conversations**
`id, type (enum: direct|group|project|research_team|club), project_id (nullable FK), research_team_id (nullable FK), organization_id (nullable FK)`

**conversation_participants**: `conversation_id (FK), user_id (FK)`

**messages**
`id, conversation_id (FK conversations), sender_id (FK users), body, attachment_url (nullable), invitation_type (enum: none|project|research_team, nullable), invitation_ref_id (nullable), sent_at`

## Notifications

**notifications**
`id, user_id (FK users), type (enum matching spec §22 list), payload (jsonb), read_at (nullable), created_at`

**notification_preferences**
`user_id (PK, FK users), connection_requests (bool), messages (bool), project_invitations (bool), research_invitations (bool), club_announcements (bool), event_reminders (bool), opportunity_deadlines (bool), publications (bool), team_recruitment (bool), profile_interactions (bool)`

## Moderation

**reports**
`id, reporter_id (FK users), target_type (enum: user|project|organization|publication|message), target_id, reason (enum: fake_account|spam|harassment|impersonation|misleading|inappropriate), description, status (enum: open|reviewing|resolved|dismissed), reviewed_by (nullable FK users), action (nullable enum: none|restrict|suspend|ban — set when an admin acts on the report; added per DECISIONS.md D-007 to match `API_CONTRACT.md` §9's `PATCH /admin/reports/:id` body, which this table originally had no column for)`

## Seed Data Flag
Every table above gets an `is_seed (bool, default false)` column — a single migration adds it globally. Seed scripts set it `true`; production writes never do. This satisfies spec §39's "clearly isolate seed/demo data from production data."

## Indexing Summary
Every FK column is indexed. Full-text search (`tsvector`, GIN index) added on: `student_profiles.bio`, `professor_profiles.bio+expertise`, `researcher_profiles.bio`, `projects.name+description`, `publications.title+abstract`, `organizations.name+description`, `research_topics.name+description`.

## Migration Ownership
Prisma schema file (`apps/api/prisma/schema.prisma`) and all migrations are owned by **Phase 2** exclusively. No other phase edits the schema directly — schema changes needed by later phases go through a documented request in `AGENT_HANDOFF.md`, not a silent edit.
