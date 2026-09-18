# UCN UI COMPONENT SPECIFICATION

Version: 2.0

This document defines reusable UI behavior. Do not create page-specific versions of components when a reusable component can satisfy the need.

## 1. Universal state contract

Every interactive component must support applicable states:

`default → hover → focus-visible → pressed/active → disabled → loading → success/error`

State changes must preserve layout whenever practical. Loading must not unexpectedly change button/card dimensions.

## 2. Layout primitives

### AppShell
Desktop: stable sidebar/navigation + main content + optional contextual rail.
Mobile: compact header + one-column content + stable bottom navigation.

### PageContainer
Max width 1200–1280px; 20–24px desktop horizontal padding; 16px mobile.

### Section
24–40px vertical rhythm, heading + optional action. Do not wrap every section in a card.

## 3. Buttons

### Primary
Single dominant action per action group. 40–44px minimum height. Medium weight. Loading preserves width and communicates progress.

### Secondary
Supporting actions. Must not visually compete with primary.

### Tertiary
Quiet text/ghost actions for low-risk navigation or utility.

### Destructive
Reserved for irreversible/dangerous actions. Require confirmation when consequences are substantial.

Keyboard: Enter/Space activate according to native semantics. Disabled means unavailable, not merely visually muted.

## 4. Inputs

Height 40–44px. Persistent visible label. Placeholder is supplemental. Helper text only when useful. Inline error immediately associated with the field.

Support: default, focused, filled, invalid, disabled, readonly and loading where relevant.

## 5. Search

Global search supports recent searches, grouped entity results, loading, no-results, clear and keyboard interaction.

Suggested keyboard model:
- `/` or project-defined shortcut focuses global search if no conflicting focused input exists.
- Arrow keys move through suggestions/results.
- Enter opens the highlighted result or search results page.
- Escape closes suggestions without destroying typed input.

## 6. Tabs

Only for sibling views. Active state must be perceivable without color alone. On narrow widths, tabs may scroll horizontally rather than wrap into an unreadable multi-line block.

## 7. Cards

Cards are grouping tools, not default containers.

### ProjectCard
Required: visual/thumbnail when available, title, short description, status, up to 3 key skills, recruiting state, creator/team.

States: default, hover, saved, recruiting, closed, loading, unavailable, missing image, long content, mobile.

### PersonCard
Name, role, institution, concise value statement, 2–3 relevant skills, availability/context, appropriate action.

Never imply endorsement through arbitrary scores.

### ResearchCard
Topic/title, area, lead/team, concise description, relevant skills, active/collaboration status.

### OpportunityCard
Title, type, organization/context, key requirement, deadline when applicable, action.

## 8. Avatar

Use consistent size tokens. Provide meaningful alt text when the image conveys identity; decorative avatars use empty alt where appropriate. Fallbacks must remain legible.

## 9. Badge / Status

Badges communicate state or category, not prestige. Use restrained visual treatment. Never overload a card with badges.

## 10. Filter controls

Desktop: inline or sidebar depending density. Mobile: sheet/drawer.

Filter changes must expose active-filter count and provide clear/reset behavior.

## 11. Dialog

Use for focused decisions. Trap focus, provide accessible name, close via explicit control and Escape when safe, restore focus to trigger.

## 12. Drawer / Sheet

Used for mobile filters and contextual actions. Preserve enough context behind the sheet. Avoid nesting sheets unless unavoidable.

## 13. Toast

Transient confirmation only. Never use a toast as the only place to communicate a persistent error or required action.

## 14. Loading

Prefer skeletons for known content structure. Use spinners for short indeterminate operations. Never create large animated placeholder noise.

## 15. Empty state

Must contain: concise explanation + reason/context where known + next useful action. Avoid generic “Nothing here.”

## 16. Error state

Must contain: what failed + recovery action. Preserve entered data where safe. Distinguish network failure, permission issue and no-results.

## 17. Pagination / infinite scroll

Choose one pattern per surface. Preserve search/filter context when navigating away and returning where practical.

## 18. Context banner

Used in messaging and related workflows to identify the project/research/opportunity being discussed. Must link back to the context when permission allows.

## 19. Recommendation reason

Show 1–4 concrete reasons. Reasons must be derived from actual available data. Never invent reasons.

## 20. Component acceptance

A component is complete only when:
- reusable
- tokenized
- keyboard-accessible
- responsive
- state-complete
- tested with long text
- tested with missing optional data
- does not require fake data to render
