# UCN UX INSPIRATION AUDIT — 10 Highest-Impact Improvements

Per MASTER_UIUX_AGENT_PROMPT.md: BEFORE → PROBLEM → REFERENCE PRINCIPLE → CHANGE → AFTER.
Principles only — never visual cloning. Existing design system preserved.

| # | Area | BEFORE | PROBLEM | Reference Principle | CHANGE | AFTER (user benefit) | Complexity | Priority |
|---|---|---|---|---|---|---|---|---|
| 1 | Dashboard/Home | Generic "Dashboard" title + activity feed + 1 featured profile | New user can't answer "What can I do next?" — no greeting, no personal context, no recommended projects | CONTRA/UPWORK: task-oriented hierarchy — "Continue Collaboration → Active Projects → People For You → Projects For You → Pending Actions" | Greeting by name + role context; Pending Actions module (real requests/invitations); Recommended Projects grid (real active projects w/ skills); People For You section | Immediate personal orientation + next actions in 5 seconds | M | **P0** |
| 2 | UserCard (directory/discover) | Photo, name, headline, skills, verified | Can't answer "Should I click this person?" — missing university/department context, no availability | MALT: photo → name → role/department → university → skills → actions; 99designs: work-first | Add department + role line, availability chips from real data, stronger scan hierarchy (name prominent, metadata quiet) | Person cards answer fit in seconds | S | **P0** |
| 3 | ProjectCard | name, description, status, skills, memberCount | Can't answer UPWORK's 5 questions: what's built/who/skills/open/action — no creator, no recruiting state, no Join CTA | UPWORK: "AI Network Attack Forecasting / AI · Cybersecurity / Looking for: Python · ML / Team: 3/5 / Status: Recruiting / [View Project] [Join Team]" | Add creator line, "Looking for" roles line, recruiting pill (real skillsNeeded count), title-first hierarchy | Project cards answer fit in ~5 seconds | M | **P0** |
| 4 | Project detail | Header + problem/solution + team + requests | Sections don't read as a case study; open roles buried in skills chips | BEHANCE: case-study treatment — purpose line → problem → solution → technology → team → links; UPWORK team page: open roles + Join CTA | Purpose statement under title; "Open roles" section with explicit role chips + recruiting CTA; Team section with member roles | Understand project in ~10s, assess fit in ~5s, act | M | **P0** |
| 5 | Trust signals | Verified badge only on profile hero | Cards don't carry trust; badge spam risk if overdone | TOPTAL: meaningful trust signals — ✓ University Email / ✓ Verified Professor; avoid badge spam | VerificationBadge (already exists) on UserCard/ProfileCard where real verification exists — one badge max per card | Trust at discovery, not badge noise | S | **P1** |
| 6 | Typography hierarchy | Page titles text-2xl (24px) everywhere; section titles uppercase tracking-wide | Hierarchy flat — page title doesn't dominate; CONTRA editorial feel missing | DESIGN_SYSTEM_SPEC §2: page-title 32px, section-title 24px; CONTRA: typography + whitespace before decoration | Page titles → text-3xl (30-32px); keep uppercase metadata for tiny established patterns only; more generous section spacing (space-y-8) | Clear editorial hierarchy, premium feel | S | **P1** |
| 7 | Search | Bar exists, debounced ✓ | No keyboard model; placeholder fine | 03 §5: `/` focuses search, Escape preserves query, grouped results | (DONE in prior pass: `/` shortcut + Escape) + verify grouped results context | Power-user discovery | S | **P1** |
| 8 | Messaging context | Tabs + composer + SSE ✓ | Context banner existed for project/team ✓; direct conversations lack identity context | LINKEDIN/UPWORK: always provide context — person, regarding, reason | (DONE: conversation header w/ role + View Profile) + polish | "Why are these people talking?" answered | S | **P1** |
| 9 | Mobile | Sidebar squeezes → MobileBottomNav ✓ | Done in spec pass | 03 §2: compact header + bottom nav + one-column | (DONE) + verify touch targets on new cards | Mobile-first transformation | S | **P1** |
| 10 | Empty/loading states | Present with next actions ✓ | OK | 03 §15/16 | Maintain across new sections | Consistency | S | **P2** |

## Execution order
P0: 1 → 2 → 3 → 4 (visible transformation: Dashboard, UserCard, ProjectCard, Project detail)
P1: 5 → 6 (trust + typography)
Verify after each: typecheck / lint / tests / build.
