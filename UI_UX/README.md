# UCN UI/UX Specification Pack v2.0

**Target quality: 95+ / 100 implementation-readiness**

This version preserves the original UCN product direction and adds the missing precision layers required for high-quality AI-assisted implementation.

## Files

1. `01_UI_UX_MASTER_SPEC.md` — product vision, UX principles, hierarchy and source-of-truth rules
2. `02_DESIGN_SYSTEM_SPEC.md` — tokens, typography, spacing, layout, color, motion and visual rules
3. `03_UI_COMPONENT_SPEC.md` — reusable component contracts and states
4. `04_SCREEN_SPEC.md` — screen-by-screen goals, hierarchy, states and responsive behavior
5. `05_UX_BEHAVIOR_SPEC.md` — navigation, search, filters, forms, messaging, errors, responsive transformations
6. `06_ACCESSIBILITY_SPEC.md` — WCAG 2.2 AA-oriented accessibility contract
7. `07_CONTENT_SPEC.md` — terminology, buttons, empty/error states and content resilience
8. `08_IMPLEMENTATION_PROTOCOL.md` — phased implementation, audit, verification and conflict protocol
9. `09_GLM_START_PROMPT.md` — controlled first prompt for GLM/AI coding agents

## Recommended workflow

1. Put these files in the repository `docs/` directory.
2. Give the coding agent repository access.
3. Give it `09_GLM_START_PROMPT.md`.
4. Run **Phase 0 — Audit only**.
5. Review `docs/UI_UX_AUDIT.md`.
6. Resolve backend/spec gaps before implementation.
7. Approve one phase at a time.
8. Require lint/typecheck/tests and responsive/accessibility checks after every phase.
9. Run the final requirement-by-requirement audit.

## What changed from v1

The pack now explicitly defines:
- design tokens instead of loose visual values
- component state matrices
- UX behavior/state transitions
- responsive transformations
- accessibility requirements
- content/microcopy rules
- screen data dependencies and backend-gap reporting
- acceptance/verification gates
- stronger AI-agent anti-invention rules

## Important

“95+” is the **specification quality target**, not a guarantee of the resulting UI. The actual product quality still depends on the repository, backend capabilities, implementation discipline and visual QA.
