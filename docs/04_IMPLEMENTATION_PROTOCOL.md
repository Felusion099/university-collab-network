# UCN UI/UX IMPLEMENTATION PROTOCOL

## Role

You are the implementation agent for UCN.

Read these documents before changing UI:

1.  UI_UX_MASTER_SPEC.md
2.  UI_COMPONENT_SPEC.md
3.  SCREEN_SPEC.md

## Golden rule

Do not invent a different UX when the specifications already define the
decision.

## Phase 0 --- Audit

Do not modify code.

Inspect: - routes - pages - components - Tailwind/design tokens -
state - API integration - responsive behavior

Create: docs/UI_UX_AUDIT.md

For every issue: SCREEN CURRENT STATE PROBLEM SEVERITY P0/P1/P2/P3 SPEC
REFERENCE RECOMMENDED CHANGE FILES DEPENDENCIES

## Phase 1 --- Design system

Centralize: colors typography spacing radius shadows transitions buttons
inputs cards badges navigation loading/error/empty states.

## Phase 2 --- App shell

Navigation, sidebar, header, page container, mobile navigation.

## Phase 3 --- Home

Implement task-oriented discovery homepage.

## Phase 4 --- Discover/Search

Implement universal search, tabs, filters, results and explainable
recommendations.

## Phase 5 --- Profiles

Student, professor, researcher.

## Phase 6 --- Projects

List, cards, detail, case study, recruitment.

## Phase 7 --- Research

Discovery, detail, teams, publications, collaboration.

## Phase 8 --- Opportunities

Discovery and detail.

## Phase 9 --- Messaging

Contextual conversations.

## Phase 10 --- Notifications

Action-oriented notifications.

## Phase 11 --- Mobile

Full responsive audit.

## Phase 12 --- Accessibility

Keyboard, focus, contrast, semantic structure, forms, dialogs.

## Phase 13 --- Polish

Spacing, typography, loading, empty, errors, transitions, consistency.

## Phase 14 --- Final audit

Compare implementation against all three specifications.

Output: PASS / PARTIAL / FAIL / N/A for every major requirement.

## Rules

-   Do not rewrite working architecture without justification.
-   Do not break API contracts.
-   Do not invent backend functionality.
-   Do not create fake data to hide missing functionality.
-   Reuse components.
-   Avoid duplicate UI patterns.
-   Keep dependencies minimal.
-   Do not modify unrelated files.
-   Keep changes reviewable.
-   Verify before claiming completion.

## Verification after each phase

Run available: pnpm lint pnpm typecheck pnpm test

Also inspect: - desktop - tablet where practical - mobile - loading -
empty - error - long text - missing images - keyboard navigation

## Change report

After every phase report:

PHASE: FILES CHANGED: UI CHANGES: UX CHANGES: API CHANGES: TESTS:
REGRESSIONS: KNOWN ISSUES: NEXT PHASE:

## Screenshot QA

After major page work, capture or inspect screenshots and compare
against SCREEN_SPEC.md.

Do not say "looks good" without checking hierarchy, spacing, responsive
behavior and primary actions.

## Conflict protocol

If requirements conflict: STOP. Identify the conflict. Quote the
relevant sections. Recommend the smallest resolution. Do not silently
choose.

## Completion rule

A phase is complete only when: implementation exists, verification
passes, responsive behavior is checked, and the result is documented.
