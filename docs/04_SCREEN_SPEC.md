# UCN SCREEN SPECIFICATION

Version: 2.0

Every screen follows the PAGE CONTRACT in this document and the state/behavior rules in the supporting specifications.

## Global page contract

Every new screen must define:

USER:
PRIMARY GOAL:
PRIMARY ACTION:
SECONDARY ACTIONS:
MUST SHOW:
OPTIONAL:
MUST NOT SHOW:
LOADING:
EMPTY:
ERROR:
PERMISSION/UNAVAILABLE:
SUCCESS:
MOBILE TRANSFORMATION:
ACCESSIBILITY NOTES:
DATA DEPENDENCIES:

No screen should be implemented without this contract.

---

## 1. HOME

**User:** signed-in university member.
**Primary goal:** discover useful people/projects/research/opportunities and act.
**Primary action:** search/discover.
**Must show:** greeting/context, search, recommended projects, people, research opportunities and pending actions when available.
**Must not show:** engagement-maximizing infinite social feed.
**Loading:** skeleton sections that match final layout.
**Empty:** explain that recommendations are not ready and provide discovery actions.
**Error:** preserve navigation/search; allow retry per failed section.
**Mobile:** one-column; section density reduced; search remains prominent.

## 2. DISCOVER

**Goal:** browse people, projects, research and opportunities.
**Primary action:** select an entity or apply a filter.
**Must show:** search/query context, category tabs, filters, result count where supported, result cards.
**Empty:** no matching results + clear filters + broader discovery action.
**Mobile:** filters become sheet; tabs may horizontally scroll.

## 3. UNIVERSAL SEARCH RESULTS

**Goal:** find the right entity quickly.
**Must show:** query, grouped entity categories, relevant metadata, active filters.
**Primary action:** open result.
**States:** typing/suggestions, loading, results, no results, service error.
**Accessibility:** result groups and counts announced meaningfully; keyboard traversal.

## 4. PEOPLE DISCOVERY

Filters: university, department, course/designation, skills, availability, research interests.
Cards expose evidence and context, not vanity scores.

## 5. PROFILE

Above fold: identity, institution, value statement, verification when applicable, availability, skills and relevant actions.
Sections: About, Proof of Work, Projects, Research, Experience, Skills, Organizations, Publications, Activity.
Owner view may expose edit/completion actions not visible to visitors.

## 6. PROJECTS

**Goal:** discover projects and determine fit.
Cards: visual, title, summary, status, skills, recruiting state, team/creator.
Filters: status, skills, recruiting, institution/context where supported.

## 7. PROJECT DETAIL

Above fold: identity, recruiting state, primary action and key fit information.
Then: hero, problem, solution, how it works, features, technology, research, team, contributions, results, links.

**Recruitment:** what is being built, roles, required skills, contribution, time commitment, current team, fit reasons.

States: loading, unavailable, archived, recruiting closed, request pending, request accepted/declined where supported.

## 8. PROJECT RECRUITMENT

Hero: project identity + recruiting state.

Information: what we're building, why, roles needed, required skills, expected contribution, time commitment, current team, why you may fit.

Primary: Request to Join.

## 9. RESEARCH DISCOVERY

Header: Research + search.
Filters: area, department, professor, skills, active/recruiting.
Results: topics, teams, people, publications.

## 10. RESEARCH DETAIL

Identity: title + area + owner/team.
Content: description, problem/question, team, projects, publications, related people, skills, collaboration status.
Primary: Request Collaboration.

## 11. OPPORTUNITIES

Categories: internships, research, projects, hackathons, competitions, mentorship, campus.
Cards: title, type, organization/context, requirements, deadline, action.

## 12. OPPORTUNITY DETAIL

Above fold: title, organization/context, type, deadline, eligibility, primary action.
Then description, requirements, time commitment, process and context.

## 13. MESSAGES

Desktop: conversation list | active conversation | optional context panel.
Header: person/team/project context.
Banner: “You are discussing: [context].”
Composer supports only capabilities actually available in backend.
Mobile: list → detail; preserve back navigation.

States: loading, empty inbox, send success, send failure/retry, unavailable conversation, permission change.

## 14. NOTIFICATIONS

Group Today / Earlier.
Types: connections, projects, research teams, messages, opportunities, verification.
Each actionable notification should lead to the relevant destination.

## 15. ONBOARDING

Four steps: Identity → Interests → Skills → Intent.
Show progress and allow safe skipping. Avoid long questionnaire behavior.

## 16. SETTINGS

Groups: Account, Profile, Privacy, Notifications, Security, Connected Accounts.
Privacy levels: Public / University Only / Connections Only / Private where supported.

## 17. PROFILE COMPLETION

Small contextual module. Show only 2–4 high-value next actions. Never block core product access unless a backend-required field genuinely must exist.

## 18. MOBILE RULES

Every major screen: one-column content, primary CTA remains discoverable, filters become sheet/drawer, secondary actions may move to overflow, cards become full-width, hierarchy remains intact, bottom navigation stays stable.

## 19. Cross-screen consistency

Back navigation preserves useful state. Search/filter context is preserved where practical. Terminology is identical across cards, detail pages, notifications and messaging.
