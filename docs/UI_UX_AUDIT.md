# UCN UI/UX AUDIT — Phase 0 (per IMPLEMENTATION_PROTOCOL.md)

Audited against: docs/01–07 specs. Existing architecture is preserved; no rewrites.

| Screen/Area | Current State | Problem | Severity | Spec Reference | Recommended Change | Files | Dependencies | Backend Gap |
|---|---|---|---|---|---|---|---|---|
| Design tokens | tokens.css (light+dark), Tailwind maps all colors to vars | Spec's semantic names (`bg-surface`, `brand`) differ from codebase names (`bg-raised`, `accent`) | P3 (CONFLICT — documented) | 02 §6 | Keep existing names (source-of-truth: existing tokens.css); spec names are advisory. Do NOT mass-rename | — | none | none |
| Typography | `--font-sans: "Inter", …` token; Inter referenced but never loaded | Inter not actually fetched → system-ui fallback silently used | P2 | 02 §2 | Load Inter (self-hosted woff2 via @font-face, no external CDN dependency) | tokens.css, index.html | font assets | none |
| Elevation/z-index | Components use arbitrary `z-50` | No single z-index scale | P2 | 02 §12 | Add z-index token scale (shell/sticky/popover/drawer/dialog) to tailwind config | tailwind.config.js | none | none |
| Focus visibility | global.css `:focus-visible` ring ✓ | OK | — | 06 §3 | none | — | — | — |
| Reduced motion | tokens.css `prefers-reduced-motion` block ✓ | OK | — | 06 §10 | none | — | — | — |
| App shell (mobile) | Desktop sidebar only; content squeezes | **Mobile bottom navigation missing** — spec requires stable bottom nav (Home/Discover/Projects/Messages/Profile) | **P1** | 01 §6, 03 §2 | Add MobileBottomNav component (md:hidden), 44px touch targets, active state not color-only | components/layout/, AppLayout | none | none |
| Home/Dashboard | Recent Activity (real notifications) + featured profile | **Not task-oriented** — missing greeting/context, recommended projects/people, pending actions | **P1** | 01 §8, 04 §1 | Add greeting + recommended projects (real data) + pending-actions module; keep real activity | DashboardPage | existing APIs | none |
| Search | Global search bar exists; grouped results | No `/` keyboard shortcut; no clear behavior | P2 | 03 §5 | Add `/` focuses search (when no input focused), Escape preserves query | SearchBar | none | none |
| Profiles | PortfolioView (hero/about/skills/projects/research/publications/links) | Missing **availability** display (mentorshipAvailable, currentAvailability, lookingFor) — the data EXISTS | P2 | 01 §9–10, 04 §5 | Add Availability section to PortfolioView from existing fields | PortfolioView | existing data | none |
| Projects detail | Header/about/team/requests | Missing recruiting-state display + "how to assess fit" emphasis | P2 | 04 §7–8 | Show recruiting status from real data (status pill + open roles) | ProjectDetailPage | existing data | none |
| Messaging | Two-column, tabs, composer, SSE, honest errors | Missing **context banner** ("You are discussing: [X]") for project/team conversations | P2 | 01 §14, 03 §18 | Context banner linking back to the project/team | MessagesPage | conversation type already exposed | none |
| Dialogs | Modal component (token overlay) | **No focus trap, no Escape close, no focus restore** | **P1 (a11y)** | 06 §7, 03 §11 | Add focus trap + Escape + focus restore to Modal | components/ui/Modal.tsx | none | none |
| Touch targets | Buttons ~py-1.5/py-2 (~36–40px) | Below 44px on mobile for icon-only controls | P3 | 06 §11 | Padding bump on primary mobile controls | key components | none | none |
| Empty/error states | Present across surfaces with next actions ✓ | OK | — | 07 §4–5 | none | — | — | — |
| Terminology | "Request to Join", "Message", "Connect" consistent ✓ | OK | — | 07 §2 | none | — | — | — |
| Research detail | Basic topic detail | Hub aggregation (related projects/teams/people) — backend composition pending | P2 | 04 §10 | Compose relationships server-side | researchTopic repo/service | backend work | PARTIAL (relations exist) |
| Notifications | Real events, actionable items, read state ✓ | OK | — | 04 §14 | none | — | — | — |
| Forms | Onboarding preserves input; errors inline | OK | — | 05 §4 | none | — | — | — |

## Spec-to-code contract validation (Phase 0.5)

| Requirement | Status |
|---|---|
| Design tokens (light+dark) | SUPPORTED |
| Inter font | PARTIAL (token exists, font not loaded) |
| Mobile bottom nav | MISSING |
| z-index scale | MISSING |
| Focus-visible ring | SUPPORTED |
| Reduced motion | SUPPORTED |
| Modal focus trap/Escape | MISSING |
| Task-oriented Home | PARTIAL |
| Availability display | PARTIAL (data exists, not rendered) |
| Recruiting state | PARTIAL (status exists, recruiting emphasis missing) |
| Messaging context banner | MISSING |
| Search `/` shortcut | MISSING |
| Explainable recommendations | SUPPORTED (real reasons) |
| Empty/error/terminology | SUPPORTED |
| Research hub aggregation | PARTIAL (backend gap) |
| Privacy/authorization | SUPPORTED (server-side, D-004) |

## Proposed phase order (working autonomously)

1. **Phase 1 — Design system**: z-index scale + Inter font + touch targets
2. **Phase 2 — App shell**: MobileBottomNav
3. **Phase 3 — Home**: greeting + recommended projects + pending actions (real data)
4. **Phase 5 — Profiles**: Availability section
5. **Phase 6 — Projects**: recruiting emphasis
6. **Phase 9 — Messaging**: context banner
7. **Phase 12 — Accessibility**: Modal focus trap/Escape
8. Verification after each: typecheck/lint/tests

## Risks
- Token-name conflict (spec vs codebase): resolved by keeping codebase names (documented; no mass rename).
- Mobile bottom nav must not duplicate the Sidebar (spec: do not introduce multiple competing navbars — bottom nav IS the spec's mobile primary nav).
