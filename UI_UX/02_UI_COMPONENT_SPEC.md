# UCN UI COMPONENT SPECIFICATION

Version: 1.0

This document defines reusable UI behavior. Do not create page-specific
versions of components when a reusable component can satisfy the need.

## 1. Layout primitives

### AppShell

Desktop: - stable sidebar - main content - optional contextual right
rail - content max width around 1200--1280px

Mobile: - compact header - bottom navigation - one-column content

### PageContainer

-   max width: 1200--1280px
-   horizontal padding: 20--24px desktop
-   16px mobile
-   consistent vertical rhythm

### Section

-   24--40px vertical spacing
-   heading + optional action
-   never use a card solely to separate every section

## 2. Buttons

### Primary

Use for the single most important action. Height: 40--44px. Medium
weight. Compact horizontal padding. One primary button per action group.

### Secondary

For supporting actions.

### Tertiary

Text/ghost style for low-emphasis actions.

### Destructive

Only for irreversible/dangerous actions.

States: default, hover, active, focus, disabled, loading.

Loading button must preserve width.

## 3. Inputs

Height 40--44px. Clear label. Placeholder is not the label. Visible
focus. Inline validation. Error message directly below. Use helper text
only when useful.

## 4. Search

Global search: - prominent - keyboard accessible - supports recent
searches - grouped result categories - loading state - no-result state -
clear action

Search result should show enough context to decide whether to open it.

## 5. Tabs

Use for sibling content categories. Do not use tabs for unrelated
workflows. Active state must be obvious without relying only on color.

## 6. Cards

Cards are grouping tools, not default containers.

### ProjectCard

Required: - visual/thumbnail - title - short description - status - up
to 3 important skills - team size - recruiting state

Optional: creator/team, research area.

Hover: subtle elevation/border/visual transition. Do not create dramatic
scaling.

### ProfileCard

Required: avatar name role university top skills availability
verification when relevant

Actions: View Profile, Connect, Message depending on context.

### ResearchCard

Required: title area short description researchers/team collaboration
state

### OpportunityCard

Required: title type organization requirements summary deadline primary
action

## 7. ProfileHeader

Desktop: - avatar - identity - verification - availability - actions

Mobile: - stacked identity - primary action remains visible - secondary
actions can move into overflow

## 8. Badge

Use only for: verification, status, category, availability.

Never use decorative badge collections.

## 9. Avatar

Consistent sizes: 24, 32, 40, 56, 72, 96px.

Use initials fallback. Do not create arbitrary sizes.

## 10. Verification

Verification must explain what is verified: - University email -
Student - Professor - Researcher - Organization - Project

Tooltip/popover may explain verification.

## 11. AvailabilityIndicator

Use text + optional indicator. Never rely on color alone.

Example: "Open to collaboration"

## 12. FilterBar

Desktop: filters can be inline.

Mobile: use a Filter button opening a sheet/drawer.

Filters must be removable individually and support Clear all.

## 13. Modal/Dialog

Use for focused tasks, not full pages. Must support: focus trap, escape,
keyboard navigation, clear close action.

## 14. Drawer

Prefer for mobile filters and secondary controls.

## 15. Toast

Use for transient confirmation/errors. Never put critical information
only in a toast.

## 16. Skeleton

Match the approximate shape of real content. Avoid generic pulsing
rectangles everywhere.

## 17. EmptyState

Structure: title explanation primary action if useful optional
illustration/icon

## 18. ErrorState

Structure: what failed recovery action optional technical detail for
development only

## 19. ProjectHero

Large project visual. Identity and primary action visible without
excessive scrolling. Do not make the image so large that the project
context disappears.

## 20. ProjectCaseStudy

Use strong typography and visual sections. Support: Problem Solution
Process Features Technology Results Contributions

Do not force every project into identical content if data is
unavailable.

## 21. TeamMember

Show: avatar, name, role/contribution. Click opens profile.

## 22. ActivityItem

Show: actor, action, object, time. Avoid engagement-bait language.

## 23. ContextBanner

Used for: "You are discussing..." "You were invited to..." "This project
is recruiting..." Keep it visually restrained.

## 24. NavigationItem

States: default, hover, active, focus. Active state must be clear
through more than color alone.

## 25. Pagination / Infinite loading

Choose based on the data and API. Do not implement infinite scrolling
merely because it is fashionable. Preserve location when loading more.

## 26. Responsive component rule

Every reusable component must define: desktop behavior tablet behavior
mobile behavior

Do not rely on accidental CSS shrinking.

## 27. Component acceptance test

For each component ask: - Is the hierarchy obvious? - Is the primary
action clear? - Does it work with long text? - Does it work with missing
data? - Does it work with loading/error? - Is keyboard navigation
correct? - Does it work on mobile?
