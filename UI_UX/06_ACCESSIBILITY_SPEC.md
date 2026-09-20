# UCN ACCESSIBILITY SPECIFICATION

Version: 2.0
Target: WCAG 2.2 AA

## 1. Semantics

Use native HTML semantics before ARIA. One clear page heading. Use landmarks for header/navigation/main/aside/footer where applicable.

## 2. Keyboard

All interactive controls are reachable and operable by keyboard. Focus order follows visual/logical order. No keyboard trap except intentional modal focus management.

## 3. Focus

Use a visible `:focus-visible` treatment with sufficient contrast. Never remove outlines without an equivalent accessible replacement.

## 4. Contrast

Meet WCAG 2.2 AA contrast requirements for normal text, large text, controls and meaningful non-text indicators. Do not rely on muted gray that becomes unreadable.

## 5. Color independence

Never communicate status through color alone. Pair color with text, iconography or shape where appropriate.

## 6. Forms

Every field has an accessible label. Errors are associated with the relevant field and include actionable guidance. Required fields are programmatically identified.

## 7. Dialogs

Dialog has an accessible name, focus moves into it, focus is trapped appropriately while open, Escape behavior is defined, and focus returns to the triggering control after close.

## 8. Menus / popovers

Keyboard navigation follows established patterns. Opening and closing behavior is predictable. Focus does not disappear behind an overlay.

## 9. Images

Informative images receive useful alt text. Decorative images use empty alt. Do not repeat adjacent visible text unnecessarily.

## 10. Motion

Respect `prefers-reduced-motion`. Essential state changes must remain understandable without animation.

## 11. Touch

Target at least 44×44px for touch interactions where practical. Avoid controls so close together that accidental activation is likely.

## 12. Screen reader behavior

Dynamic updates such as form errors, save confirmation and relevant status changes should be announced without creating excessive noise. Use live regions sparingly.

## 13. Tables / structured data

Use semantic tables only for genuinely tabular information. Provide headers and relationships correctly.

## 14. Testing gate

Before completion of a major phase:
- keyboard-only traversal
- focus visibility
- zoom/reflow check
- contrast check
- form error check
- dialog check
- reduced-motion check
- screen-reader smoke test where tooling is available
