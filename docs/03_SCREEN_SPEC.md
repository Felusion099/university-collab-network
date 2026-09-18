# UCN SCREEN SPECIFICATION

Version: 1.0

This document defines the target information architecture and layout of
major screens.

## Global layout

Desktop: Sidebar 240--260px. Main content max-width approximately
1200--1280px. Optional right rail only when it adds contextual value.

Mobile: single column, bottom navigation, compact header, no horizontal
overflow.

------------------------------------------------------------------------

# 1. HOME

Purpose: Help users discover relevant
people/projects/research/opportunities and act.

Layout: 1. Greeting/context 2. Universal search 3. Recommended projects
--- prominent visual grid 4. Recommended people --- compact list/cards
5. Research opportunities 6. Pending requests/actions 7. Upcoming
opportunities/events

Do not put a social feed above discovery.

Primary action: Search/discover.

------------------------------------------------------------------------

# 2. DISCOVER

Purpose: Search and compare things worth collaborating on.

Header: Page title + universal search.

Tabs: People \| Projects \| Research \| Teams \| Organizations \|
Opportunities

Below: filter bar result count sort/relevance if needed

Desktop: main result column + optional filter/context rail.

Mobile: search + Filter button + results.

Each result must support quick scanning.

------------------------------------------------------------------------

# 3. SEARCH OVERLAY / SEARCH RESULTS

Search field at top.

Suggested sections: Recent People Projects Research Opportunities

After submit: full results page with entity tabs.

No results: explain query + suggestions + Clear filters.

------------------------------------------------------------------------

# 4. STUDENT PROFILE

Above fold: avatar name course/year department university verification
value statement availability Connect / Message / Collaborate

Main: About Proof of Work Projects Research Experience Skills
Organizations Publications Activity

Right rail desktop: availability top skills verification quick actions

Mobile: identity → actions → proof → sections.

------------------------------------------------------------------------

# 5. PROFESSOR PROFILE

Above fold: name designation department university verification research
summary Request Collaboration

Main: Research Areas Current Research Research Teams Publications
Projects Mentorship Collaboration

Professor profile should feel academic + professional, not like a
student resume.

------------------------------------------------------------------------

# 6. RESEARCHER PROFILE

Above fold: identity research focus verification availability actions

Main: Research Interests Publications Research Projects Teams Current
Work Skills Collaboration

------------------------------------------------------------------------

# 7. PROJECT LIST

Header: Projects + search/filter.

Filters: status, skills, department, research area, recruiting.

Content: visual project cards.

Card hierarchy: visual → title → purpose → skills → status/team →
action.

------------------------------------------------------------------------

# 8. PROJECT DETAIL

Hero: visual title description status recruiting indicator team primary
action

Then: Problem Solution How it works Features Technology Research Team
Contributions Results Links

Sticky or easily accessible primary action on desktop where appropriate.

Mobile: primary action must remain easy to reach.

------------------------------------------------------------------------

# 9. PROJECT RECRUITMENT

Hero: project identity + recruiting state.

Recruitment information: What we're building Why Roles needed Required
skills Expected contribution Time commitment Current team Why you may
fit

Primary: Request to Join

------------------------------------------------------------------------

# 10. RESEARCH DISCOVERY

Header: Research + search.

Filters: research area, department, professor, skills,
active/recruiting.

Results: research topic cards, teams, people, publications.

------------------------------------------------------------------------

# 11. RESEARCH DETAIL

Identity: title + research area + owner/team.

Content: description problem/question team projects publications related
people skills collaboration status

Primary: Request Collaboration.

------------------------------------------------------------------------

# 12. OPPORTUNITIES

Categories: Internships Research Projects Hackathons Competitions
Mentorship Campus

Cards show: title type organization requirements deadline action.

------------------------------------------------------------------------

# 13. OPPORTUNITY DETAIL

Above fold: title organization type deadline eligibility primary action

Then: description requirements time commitment process contact/context.

------------------------------------------------------------------------

# 14. MESSAGES

Desktop: conversation list \| active conversation \| optional context
panel.

Conversation header: person/team/project context.

Context banner: "You are discussing \[Project\]."

Composer: large enough for real messages, attachment/action support if
available.

Mobile: conversation list → conversation detail.

------------------------------------------------------------------------

# 15. NOTIFICATIONS

Group: Today Earlier

Notification types: connections projects research teams messages
opportunities verification

Each notification should lead to a useful action.

------------------------------------------------------------------------

# 16. ONBOARDING

Step 1 Identity Step 2 Interests Step 3 Skills Step 4 Intent

Show: progress indicator, short explanation, skip where appropriate.

Do not create a long questionnaire.

------------------------------------------------------------------------

# 17. SETTINGS

Groups: Account Profile Privacy Notifications Security Connected
accounts

Privacy: Public University Only Connections Only Private

Make privacy understandable.

------------------------------------------------------------------------

# 18. PROFILE COMPLETION

Small contextual module: "Profile 42% complete"

Show only 2--4 high-value next actions.

Never block core product access.

------------------------------------------------------------------------

# 19. MOBILE RULES

Every major screen: - one-column content - primary CTA remains visible -
filters become sheet/drawer - secondary actions move to overflow - cards
become full-width - visual hierarchy remains intact - bottom nav remains
stable

------------------------------------------------------------------------

# 20. PAGE CONTRACT

Every new screen must document:

USER: PRIMARY GOAL: PRIMARY ACTION: SECONDARY ACTIONS: MUST SHOW:
OPTIONAL: MUST NOT SHOW: SUCCESS STATE: EMPTY STATE: ERROR STATE: MOBILE
TRANSFORMATION:

No screen should be implemented without this contract.
