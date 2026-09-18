# UCN UI/UX MASTER SPECIFICATION

Version: 2.0 — 95+ Implementation Contract
Status: Authoritative product and UX source of truth

## 1. Purpose

UCN (University Collaboration Network) is a university collaboration graph connecting students, professors, researchers, clubs, societies, teams, projects, publications and opportunities.

Core loop:

**DISCOVER → UNDERSTAND → FIND FIT → COLLABORATE → BUILD PROOF OF WORK**

UCN is not a LinkedIn clone, social feed, ERP, Upwork clone, or generic SaaS dashboard.

## 2. Inspiration principles

Reference products are principles, never templates:

- LinkedIn — professional identity, network, messaging.
- Behance — visual project storytelling and case studies.
- Peerlist — proof of work and builder identity.
- Toptal — trust, verification and professional presentation.
- Upwork — structured discovery, search, filters and opportunities.
- Contra — project-first presentation and collaboration orientation.

UCN synthesis:

> **Who are you → what have you done → what are you working on → what do you want to collaborate on → why are you a fit → how do we start?**

Never copy visual layouts, terminology, interaction patterns or branding from reference products when a UCN-native solution is appropriate.

## 3. Product hierarchy

### Level 1 — Value
1. Proof of work
2. Collaboration
3. Discovery

### Level 2 — Trust
1. Identity
2. Verification
3. Contributions
4. Research
5. Experience

### Level 3 — Action
Join, collaborate, connect, message, apply, publish.

### Level 4 — Retention
Activity, notifications, recommendations, saved items and network.

Do not optimize for likes, follower counts, vanity metrics or endless feeds.

## 4. Core UX principles

1. **Evidence over claims.** Prefer projects, contributions, publications and outcomes over self-reported prestige.
2. **Context before action.** Users should understand what they are joining/contacting before committing.
3. **Fit must be explainable.** Recommendations expose useful reasons rather than opaque scores.
4. **Progressive disclosure.** Keep primary surfaces focused; reveal detail when needed.
5. **One dominant action.** Each viewport has a clear next step.
6. **Trust without status theater.** Verification is useful evidence, not decoration.
7. **Discovery without feed addiction.** Home helps users find useful things; it is not an engagement-maximizing feed.
8. **Mobile is a first-class transformation, not a squeezed desktop layout.**
9. **Accessibility is part of the design, not a final patch.**
10. **Do not invent product behavior when the specification or backend contract already defines it.**

## 5. Visual language

Target: minimal, editorial, premium, professional, calm, spacious, highly readable.

Avoid: excessive gradients, glassmorphism, rainbow UI, giant shadows, excessive rounded cards, excessive animation, dashboard clutter and badge spam.

Visual hierarchy should come from typography, spacing, alignment, imagery and restrained borders before decoration.

## 6. Information architecture

Primary desktop navigation:
- Home
- Discover
- Projects
- Research
- Opportunities
- Messages

Secondary:
- Notifications
- Profile
- Settings

Mobile primary navigation:
- Home
- Discover
- Projects
- Messages
- Profile

Navigation must communicate the current location without relying only on color.

## 7. Universal search

Placeholder: **Find people, projects, research...**

Search entities:
People, Projects, Research, Research Teams, Publications, Organizations, Events, Opportunities.

A query such as `machine learning` may surface relevant entities across these categories. Search results must preserve entity type and enough context for a confident click.

Search behavior is defined in `05_UX_BEHAVIOR_SPEC.md`.

## 8. Home

Home is task-oriented, not feed-oriented.

Recommended order:
1. Greeting/context
2. Universal search
3. Recommended projects
4. Recommended people
5. Research opportunities
6. Pending actions
7. Collaboration activity
8. Upcoming opportunities/events

Sections may be omitted when data is unavailable; never show fabricated content merely to fill the layout.

## 9. Profiles

Profile is a core product surface.

Above fold:
- avatar
- name
- role/course/designation
- university
- concise value statement
- verification where applicable
- availability
- top skills
- primary actions: Connect, Message, Collaborate as context permits

Suggested section order:
Identity → About → Proof of Work → Projects → Research → Experience → Skills → Organizations → Publications → Activity.

Student profile: course, year, department, skills, projects, research interests, organizations, hackathons, availability.

Professor profile: designation, department, verification, research expertise, research teams, current research, publications, projects, mentorship and collaboration.

Researcher profile: research interests, publications, projects, research teams, current work and collaboration availability.

## 10. Availability

Supported intents:
- Open to collaboration
- Looking for teammates
- Open to research
- Looking for hackathons
- Open to internships
- Open to mentorship

Optional: time commitment and preferred collaboration type.

Availability must be presented as contextual information, not as a rating.

## 11. Projects

Projects are first-class entities.

Project card: visual, title, short description, status, important skills, team size, recruiting state, creator/team.

Statuses:
Idea, Planning, Development, Beta, Active, Completed, Archived.

Project detail:
Identity → primary CTA → hero visual → Problem → Solution → How it works → Features → Technology → Research → Team → Contributions → Results → Links.

Recruiting projects must expose: problem, what is being built, roles, required skills, expected contribution, time commitment, current team and fit reasons.

Project pages should let a user understand the project in ~10 seconds, assess fit in ~5 seconds, then act.

## 12. Research

Research is first-class. Discovery may surface topics, researchers, professors, teams, publications, projects and collaboration opportunities.

Research detail: title, area, description, problem/question, researchers, professor/team, projects, publications, skills, collaboration status.

## 13. Opportunities

Types: internships, research, projects, hackathons, competitions, mentorship and campus opportunities.

Each opportunity exposes: what, who, requirements, deadline, time commitment and action.

## 14. Messaging

Messaging is contextual. Where possible, show:
**You are discussing: [Project / Research / Opportunity]**

Supported contexts: direct, project, research-team, club/organization and collaboration conversations.

## 15. Matching and recommendations

Do not show opaque match percentages unless every factor is genuinely explainable and supported by the product.

Prefer explicit reasons such as:
- Python
- Machine Learning
- shared research interest
- mutual connection
- same department

Recommendations must not imply certainty.

## 16. Onboarding

Maximum four primary steps:
1. Identity — name, university email, department, course, year
2. Interests
3. Skills
4. Intent — projects, research, teammates, hackathons, internships, mentorship

Everything else is progressive profile completion.

## 17. Interaction rules

Primary action dominates. Secondary actions support. Tertiary actions stay quiet.

Default motion: subtle, approximately 150–250ms. Respect reduced-motion preferences.

Use skeletons for content-shaped loading, inline validation for fields, optimistic actions only where rollback is safe, and toasts for transient confirmations that do not replace persistent error states.

## 18. Required states

Every major component/screen must define applicable states:
Default, Hover, Focus-visible, Active/Pressed, Disabled, Loading, Empty, Error, Success, Permission/Unavailable, Long-content and Mobile.

Empty states answer what is empty, why, and what can be done next.
Errors answer what happened and the safest next action.

## 19. Accessibility target

Target WCAG 2.2 AA for product UI.

Requirements include semantic HTML, keyboard navigation, visible focus, sufficient contrast, accessible names, logical tab order, reduced motion, accessible dialogs, labelled forms and touch targets appropriate for mobile.

Full contract: `06_ACCESSIBILITY_SPEC.md`.

## 20. Performance

Prefer lazy loading, optimized images, pagination/caching, efficient requests and stable rendering. Avoid unnecessary dependencies and rerenders.

Perceived performance matters: preserve layout during loading and avoid large unexplained layout shifts.

## 21. Existing codebase

Preserve the current stack and architecture unless a strong technical reason exists: React, TypeScript, Vite, Tailwind, Zustand, TanStack Query, Express, Prisma, PostgreSQL, pnpm and Turbo.

Do not rewrite working backend contracts for visual changes. Do not invent API data. Do not claim a feature works unless verified.

## 22. Implementation phases

0 Audit
1 Design system
2 App shell
3 Home
4 Discover/search
5 Profiles
6 Projects
7 Research
8 Opportunities
9 Messaging
10 Notifications
11 Mobile
12 Accessibility
13 Polish
14 Final audit

Never perform a massive uncontrolled rewrite.

## 23. Quality gates

Every major screen passes:
- 5-second purpose test
- primary-action test
- scan test
- fit test
- action test
- mobile transformation test
- consistency test
- accessibility test
- state coverage test

## 24. Source-of-truth hierarchy

1. Backend/API contracts
2. This master spec
3. Design system spec
4. Component spec
5. Screen spec
6. UX behavior spec
7. Accessibility/content specs
8. Existing architecture
9. Agent judgment

If sources conflict, STOP and report the conflict. Do not silently guess.

## 25. Final product feeling

UCN should feel like a premium professional collaboration platform designed specifically for universities.

Differentiator:

> **The easiest way inside a university to discover people, projects, research and opportunities you can actually collaborate on.**
