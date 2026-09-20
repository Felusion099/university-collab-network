# UNIVERSITY COLLABORATION NETWORK — UI/UX UPGRADE MASTER PROMPT

Repository: `apoorvabhiraj/university-collab-network`

## CRITICAL RULE
The existing UI/UX is already strong. Do NOT blindly redesign it.

Your workflow:
**AUDIT → IDENTIFY UX GAPS → IMPROVE → PRESERVE WHAT WORKS**

Do NOT:
- replace the whole design system
- randomly change colors, typography, spacing, or branding
- rebuild pages without evidence
- copy LinkedIn/Upwork/Fiverr/Behance
- add unnecessary animations
- break working flows
- change APIs/backend unless UX requires it

Use the reference products only for **UX principles**, not exact visual copying.

---

## PRODUCT IDENTITY

This is a **University Collaboration Network**, not a clone of another product.

Primary entities:
1. People
2. Projects
3. Teams
4. Research
5. Opportunities
6. Freelance/services
7. Collaboration

Core UX loop:

**DISCOVER → UNDERSTAND → TRUST → CONNECT → COLLABORATE**

Target feeling:
clean, modern, professional, trustworthy, attractive, fast, intuitive, information-rich without being crowded.

---

# REFERENCE MAP

## 1. CONTRA — Overall visual language / profiles / portfolio
Take inspiration for:
- whitespace
- typography hierarchy
- clean visual hierarchy
- professional profiles
- portfolio-first presentation
- project presentation
- minimal navigation
- elegant cards
- CTA placement

Apply to Home, Profiles, Project Details, Portfolio, Dashboard, Navigation.

Goal: make the platform feel like a serious modern professional product.

## 2. LINKEDIN — Professional networking / people discovery
Take inspiration for:
- people search
- professional identity
- networking
- profile information architecture
- contextual connections
- messaging
- activity

Do NOT create an endless LinkedIn-style social feed.

People should be discoverable by:
university, department, skills, interests, research area, projects, clubs/societies, experience, collaboration interests.

Search should support:
**People | Projects | Research | Teams**

## 3. MALT — Talent discovery
Take inspiration for:
- professional discovery
- search
- filtering
- profile scanning
- expertise presentation
- discovery → profile → contact

Person cards should answer “Should I click this person?” within seconds.

Suggested card:
Profile photo → Name → Role/Department → University → Skills → Projects/Research → View Profile/Connect.

## 4. UPWORK — Project discovery / workflow
Take inspiration for:
- search architecture
- filtering
- project cards
- workflow states
- collaboration management
- contextual messaging
- project workspace

Do NOT copy the marketplace identity.

Project cards should answer:
1. What is being built?
2. Who is building it?
3. What skills are needed?
4. Is collaboration open?
5. What action can I take?

Example:
AI Network Attack Forecasting
AI / Cybersecurity
Looking for: Python · ML · Cybersecurity
Team: 3/5
Status: Recruiting
[View Project] [Join Team]

## 5. FIVERR — Fast discovery / clear cards
Take inspiration only for:
- card clarity
- scanability
- strong titles
- tags
- clear CTAs
- comparison

Useful for Opportunities, Freelance, Student Services, Collaboration Offers.

Do NOT turn UCN into a Fiverr marketplace.

## 6. BEHANCE — Project / portfolio presentation
Project pages should feel like **portfolio case studies**, not database records.

Preferred:
Project title → one-line purpose → hero visual/screenshots → Problem → Solution → How it works → Technology → Team → Results → Links.

Support:
screenshots, architecture diagrams, GitHub, demos, documentation, research papers, results.

## 7. 99DESIGNS — Work-first profiles / credibility
Take inspiration for:
- project thumbnails
- portfolio browsing
- work-first profiles
- expertise visibility
- credibility

For technical work, use screenshots, demos, diagrams, GitHub, documentation and results.

## 8. TOPTAL — Trust / professional credibility
Take inspiration for:
- verification
- credentials
- professional identity
- expertise
- meaningful trust signals

Possible signals:
✓ University Email
✓ Verified Professor
✓ Verified Student
✓ Project Contributor
✓ Research Profile

Avoid badge spam.

---

# PROFESSOR UX

Profile hierarchy:
Profile photo
Name + designation + university
Research Areas
Current Research
Research Projects
Publications / Research Links
Students / Collaborators
Short Bio
[Connect] [View Research]

Prioritize:
**identity → expertise → research → current work → collaboration**

Do not force professors to fill unnecessary fields.

## Professor onboarding
Keep it low-friction.

Step 1 — Identity:
Name, University Email

Step 2 — Academic Identity:
Department, Designation, Specialisation

Step 3 — Research:
Research Interests, Research Area, Current Research

Step 4 — Profile:
Photo, Bio, optional external research links

Use progressive profiling.

---

# STUDENT PROFILE

A student can be:
student + project builder + club member + researcher + freelancer + founder + contributor.

Do NOT force a single “What do you do?” identity.

Allow multiple interests/roles.

Example:
Interests: AI/ML · Entrepreneurship · Research
Activity: Project Builder · Club Member · Research Contributor

---

# PEOPLE DISCOVERY

Main discovery categories:
**People | Projects | Research | Teams | Opportunities**

Search should move:
**search → understand → connect**

Contextual filters:
People: University, Department, Role, Skills, Interests, Research Area, Projects, Availability.
Projects: Technology, Domain, Status, Required Skills, Team Size, University.
Research: Research Area, Professor, Department, University, Project Status.

Use progressive disclosure; do not expose every filter at once.

---

# DASHBOARD

Do not make it a statistics/vanity dashboard.

Answer:
**“What can I do next?”**

Suggested hierarchy:
- Continue Collaboration
- Active Projects
- People For You
- Projects For You
- Research Opportunities
- Pending Actions
- Connection Requests
- Project Invitations
- Messages

Prioritize actions over metrics.

---

# FEED

Make activity collaboration-oriented.

Prefer:
- someone started a project
- someone needs a collaborator
- a professor opened a research project
- a team is recruiting a contributor

Avoid meaningless activity such as “X liked Y’s post.”

---

# MESSAGING

Take inspiration from LinkedIn + Upwork + Contra.

Always provide context:

Person
Regarding: Project
Reason for conversation
Message

The UI should answer:
**“Why are these people talking?”**

---

# TEAM PAGE

Show:
- project
- current team
- member roles
- open roles
- missing capabilities
- collaboration CTA

Example:
Apoorv — AI/ML
Rahul — Backend
XYZ — Cybersecurity

Open Roles:
Frontend · Research · UI/UX

[Join Project]

---

# OPPORTUNITIES

Do not become a generic job board.

Categories:
Research, Project, Internship, Club, Competition, Freelance, Startup, Collaboration.

Cards should show:
opportunity, person/organization, required skills, deadline, status, location/remote, CTA.

---

# NAVIGATION

Keep it simple.

Possible:
Home · Discover · Projects · Research · Opportunities · Messages · Profile

Do not create unnecessary top-level navigation.

---

# MOBILE

Do NOT simply shrink desktop.

Check:
touch targets, mobile navigation, cards, filters, profiles, project pages, messaging, forms, modals, scrolling, keyboard behavior.

---

# MICROINTERACTIONS

Use subtle:
hover, focus, loading, success, error, empty states, skeletons, connection states, join states, save states.

Avoid excessive animation.
Motion must communicate state.

---

# EMPTY / LOADING / ERROR STATES

Empty:
Explain why + give recovery action.

Loading:
Use skeletons where content structure is predictable.

Error:
Explain WHAT happened, WHY, and WHAT the user can do.

---

# FORMS

Use:
- clear labels
- useful placeholders
- inline validation
- sensible defaults
- clearly marked optional fields
- progress indicators
- save/continue
- no unnecessary questions

---

# REUSABLE COMPONENTS

Maintain consistent:
PersonCard
ProjectCard
ResearchCard
OpportunityCard
TeamCard

Keep consistent spacing, typography, metadata hierarchy, CTA placement and responsive behavior.

---

# DESIGN SYSTEM

Before changing anything, inspect:
colors, typography, spacing, radius, shadows, buttons, inputs, cards, badges, icons, modals, dropdowns, tabs, navigation.

Reuse existing components whenever possible.

---

# ACCESSIBILITY

Check:
keyboard navigation, focus states, contrast, semantic HTML, labels, screen-reader support, touch targets, error announcements.

# PERFORMANCE

Check:
image optimization, lazy loading, unnecessary re-renders, excessive API requests, pagination, bundle size, mobile performance.

---

# UX QUALITY TEST

For every major page:
- Can a new user understand it within 5 seconds?
- Is the hierarchy obvious?
- Is the next useful action obvious?
- Is there enough trust/context?
- Is anything causing unnecessary friction?
- Does it feel like the same product?
- Does mobile work properly?

---

# IMPLEMENTATION PROTOCOL

Before editing:
1. Inspect existing implementation.
2. Understand current design system.
3. Identify the real UX problem.
4. Compare against the reference principle.
5. Make the smallest meaningful change.
6. Preserve existing behavior.
7. Test desktop.
8. Test mobile.
9. Test loading/error/empty states.
10. Check accessibility.

Do NOT make speculative redesigns.

---

# PRIORITY

P0 — Core usability:
navigation, onboarding, people discovery, project discovery, profiles, project details, collaboration CTA, messaging, mobile.

P1 — UX quality:
search, filters, empty states, loading states, errors, information hierarchy, trust.

P2 — Polish:
microinteractions, animations, visual refinement, personalization.

Never work on P2 while P0 is broken.

---

# REQUIRED FIRST STEP

Do NOT immediately modify code.

First inspect the repository and UI and produce a UX audit:

1. Existing strength
2. UX problem
3. Why it is a problem
4. Reference principle
5. Proposed improvement
6. Expected user benefit
7. Implementation complexity
8. Priority P0/P1/P2

Identify the **10 highest-impact UX improvements**.

Then implement in priority order.

For each change document:
**BEFORE → PROBLEM → REFERENCE PRINCIPLE → CHANGE → AFTER**

---

# FINAL PRINCIPLE

Do not ask:
“How can we make UCN look like Contra?”

Ask:
“What makes Contra feel clean/professional, and how can that principle solve our university collaboration problem?”

Reference principles:
- CONTRA → clean professional presentation
- LINKEDIN → professional networking
- MALT → talent discovery
- UPWORK → project/workflow architecture
- FIVERR → fast service discovery
- BEHANCE → work/portfolio presentation
- 99DESIGNS → visual project presentation
- TOPTAL → trust and credibility

**Combine principles, not designs.**

Final product:
**world-class UX + unmistakably UCN.**

Core loop:
**DISCOVER → UNDERSTAND → TRUST → CONNECT → COLLABORATE**
