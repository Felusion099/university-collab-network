# UCN UI/UX IMPLEMENTATION PROTOCOL

Version: 2.0

## Role

You are the implementation agent for UCN.

Read before changing UI:
1. UI_UX_MASTER_SPEC.md
2. DESIGN_SYSTEM_SPEC.md
3. UI_COMPONENT_SPEC.md
4. SCREEN_SPEC.md
5. UX_BEHAVIOR_SPEC.md
6. ACCESSIBILITY_SPEC.md
7. CONTENT_SPEC.md

## Golden rule

Do not invent a different UX when the specifications already define the decision.

## Phase 0 — Audit

Do not modify code.

Inspect routes, pages, components, tokens/Tailwind, state, API integration, authentication UI, profiles, projects, research, search/discovery, messaging, notifications and responsive behavior.

Create `docs/UI_UX_AUDIT.md` with:

| Screen/Area | Current State | Problem | Severity | Spec Reference | Recommended Change | Files | Dependencies | Backend Gap |
|---|---|---|---|---|---|---|---|---|

Severity: P0 blocks core experience; P1 major UX problem; P2 important improvement; P3 polish.

## Phase 0.5 — Contract validation

Before implementation, map each major screen to:
- existing route
- existing API/data source
- existing reusable components
- required states
- backend limitations

Mark each requirement `SUPPORTED`, `PARTIAL`, `MISSING`, or `CONFLICTING`.

## Phase 1 — Design system

Centralize tokens and reusable primitives. Do not redesign individual pages first.

## Phase 2 — App shell

Navigation, sidebar/header, container, mobile navigation and global overlays.

## Phase 3 — Home

Task-oriented discovery homepage.

## Phase 4 — Discover/Search

Universal search, tabs, filters, results and explainable recommendations.

## Phase 5 — Profiles

Student, professor and researcher profiles.

## Phase 6 — Projects

List, cards, detail, case study and recruitment.

## Phase 7 — Research

Discovery, detail, teams, publications and collaboration.

## Phase 8 — Opportunities

Discovery and detail.

## Phase 9 — Messaging

Contextual conversations.

## Phase 10 — Notifications

Action-oriented notifications.

## Phase 11 — Mobile

Full responsive transformation audit.

## Phase 12 — Accessibility

Keyboard, focus, contrast, semantics, forms, dialogs and reduced motion.

## Phase 13 — Polish

Spacing, typography, loading, empty/error states, transitions and consistency.

## Phase 14 — Final audit

Compare implementation against all specifications.

Output each requirement as `PASS / PARTIAL / FAIL / N/A` with evidence.

## Rules

- Do not rewrite working architecture without justification.
- Do not break API contracts.
- Do not invent backend functionality.
- Do not create fake data to hide missing APIs.
- Reuse components.
- Avoid duplicate UI patterns.
- Keep dependencies minimal.
- Do not modify unrelated files.
- Keep changes reviewable.
- Verify before claiming completion.
- If a spec requirement cannot be supported by current backend/data, report it instead of faking it.
- If an interaction is unspecified, choose the smallest behavior consistent with existing patterns and record the decision in the audit/change report.

## Verification after each phase

Run available:
`pnpm lint`
`pnpm typecheck`
`pnpm test`

Also inspect desktop, tablet where practical, mobile, loading, empty, error, long text, missing images and keyboard navigation.

## Screenshot QA

After major page work, inspect screenshots at representative desktop and mobile widths. Compare hierarchy, spacing, density, state coverage, responsive transformation and primary actions against the spec.

## Change report

After every phase:

PHASE:
FILES CHANGED:
UI CHANGES:
UX CHANGES:
API CHANGES:
TESTS:
ACCESSIBILITY:
RESPONSIVE CHECK:
REGRESSIONS:
KNOWN ISSUES:
SPEC GAPS:
NEXT PHASE:

## Conflict protocol

If requirements conflict: STOP. Identify the conflict, quote the relevant sections, recommend the smallest resolution, and wait for approval.

## Completion rule

A phase is complete only when implementation exists, verification passes, responsive behavior is checked, required states are checked, and the result is documented.
