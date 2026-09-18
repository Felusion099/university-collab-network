# UCN DESIGN SYSTEM SPECIFICATION

Version: 2.0
Status: Authoritative visual token contract

## 1. Principle

Use tokens, not ad-hoc values. Components consume semantic tokens; pages should not invent local colors, radii or spacing.

## 2. Typography

Choose exactly one primary UI font already supported by the project; preferred order: Inter → Geist → Manrope. Do not mix fonts without explicit reason.

Semantic scale:

| Token | Size | Line height | Use |
|---|---:|---:|---|
| display | 48px | 1.10 | rare hero/display |
| page-title | 32px | 1.20 | page headings |
| section-title | 24px | 1.25 | major sections |
| subsection | 20px | 1.30 | subsections |
| card-title | 16–18px | 1.35 | cards |
| body | 14–16px | 1.50 | primary copy |
| metadata | 12–14px | 1.40 | secondary information |
| label | 12–14px | 1.30 | controls |

Use sentence case. Avoid all-caps except tiny, established metadata patterns.

## 3. Spacing tokens

Base unit: 4px.

`space-1 4`, `space-2 8`, `space-3 12`, `space-4 16`, `space-5 20`, `space-6 24`, `space-8 32`, `space-10 40`, `space-12 48`, `space-16 64`, `space-20 80`, `space-24 96`.

Do not introduce arbitrary spacing unless required by an asset or platform constraint.

## 4. Layout tokens

- Content max width: 1200–1280px.
- Desktop page padding: 20–24px.
- Mobile page padding: 16px.
- Comfortable reading measure: approximately 65–80 characters per line for long-form copy.
- Desktop layout may use main content plus optional contextual rail.
- Never force a three-column layout when it reduces readability.

## 5. Radius

- control: 6–8px
- card: 10–14px
- large container: 16px
- pill: 9999px

Use radius to establish hierarchy, not to make every element look like a floating pill.

## 6. Color semantics

Define project-specific palette values in one token source, then expose semantic names:

- `bg-canvas`
- `bg-surface`
- `bg-surface-raised`
- `border-subtle`
- `border-strong`
- `text-primary`
- `text-secondary`
- `text-muted`
- `text-inverse`
- `brand`
- `brand-foreground`
- `success`
- `warning`
- `danger`
- `info`

Semantic colors are reserved for meaning. Do not use success/warning/danger as decorative accents.

## 7. Elevation

Prefer borders and spacing. When elevation is needed:

- `shadow-xs`: separation
- `shadow-sm`: interactive raised surface
- `shadow-md`: popover/menu/dialog support
- `shadow-lg`: modal-level separation only

No giant persistent shadows.

## 8. Motion

- fast: 120–150ms
- standard: 150–250ms
- deliberate: 250–350ms

Use transform/opacity where possible. No decorative motion on every card. Respect `prefers-reduced-motion`.

## 9. Icons

Use one icon family consistently. Default size 16–20px for controls and 20–24px for prominent actions. Icons must not be the only carrier of meaning when text is necessary.

## 10. Breakpoints

Use the existing project breakpoints where possible. If none exist, establish:

- mobile: <640px
- tablet: 640–1023px
- desktop: 1024–1279px
- wide: ≥1280px

Components should respond to available container width, not only viewport width, when practical.

## 11. Touch targets

Interactive targets should generally be at least 44×44px on touch surfaces, including icon-only controls via padding.

## 12. Layering

Establish a single z-index scale for app shell, sticky controls, popovers, drawers and dialogs. Do not use arbitrary z-index values.

## 13. Content rules

- Buttons use action verbs.
- Avoid ambiguous labels such as `Submit` when a specific verb exists.
- Never use placeholder text as a required label.
- Truncate only when the full content remains discoverable.
- Preserve user-entered content; do not silently rewrite it.

## 14. Component composition

Prefer primitives → patterns → domain components → screens.

A page should compose reusable components. If two screens need the same interaction, share the component rather than duplicating markup.

## 15. Visual QA

A design-system change must be checked against at least: buttons, inputs, cards, navigation, tabs, dialogs, empty states, loading states and mobile navigation.
