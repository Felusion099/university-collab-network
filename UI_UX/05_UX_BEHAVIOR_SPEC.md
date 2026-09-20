# UCN UX BEHAVIOR SPECIFICATION

Version: 2.0

This document defines behavior so implementation agents do not invent interaction decisions.

## 1. Navigation

- Active navigation reflects current route.
- Back returns to the user's previous logical context where possible.
- Returning from a detail page should preserve search query, filters, sort and scroll position where technically practical.
- Unsaved form changes require an appropriate warning before destructive navigation.

## 2. Search lifecycle

`idle → focused → typing → suggestions/loading → results → result selected`

- Debounce network-backed suggestions when appropriate.
- Escape closes suggestions but preserves query.
- Clear removes query and resets suggestions.
- No results must distinguish “no matching entities” from service failure.
- Search result ranking must never fabricate relevance.

## 3. Filters

`closed → open → changed → apply → results`

If filters are applied immediately, show a clear active-filter state. Reset returns to the unfiltered state.

Mobile filters use a sheet/drawer with Apply and Clear/Reset controls where immediate filtering would cause excessive requests.

## 4. Forms

`idle → editing → validation → submitting → success | server-error`

Rules:
- Validate on blur or submit according to field type; do not aggressively interrupt typing.
- Preserve valid input after errors.
- Disable duplicate submission while submitting.
- Success must be persistent enough to confirm what happened and what the next action is.

## 5. Join/request flows

Before submitting a collaboration/join request, show enough context to understand the commitment.

After submission, action changes to an accurate pending state if supported. Never visually imply acceptance before backend confirmation.

## 6. Bookmark/save

If the backend supports optimistic save, update immediately and provide rollback on failure. If it does not, wait for confirmation. Do not fabricate persistence.

## 7. Messaging

Send lifecycle:
`draft → sending → sent`
Failure:
`draft → sending → failed → retry`

Failed messages remain understandable and retryable when technically possible. Context banner remains linked to the relevant entity when permission allows.

## 8. Notifications

Unread state must be visually and semantically distinct. Clicking a notification should route to its relevant entity/action when a destination exists.

## 9. Dialogs

Use dialogs for focused decisions, not entire pages. Escape closes only when safe. Destructive decisions require clear consequence language.

## 10. Loading

Use skeletons for predictable page structures. Preserve the shell and stable dimensions. Avoid blank screens for ordinary network waits.

## 11. Empty states

Pattern:
`What is empty → Why it is empty → What to do next`

Example structure, not literal copy:
“No saved projects yet. Save projects you want to revisit. [Discover projects]”

## 12. Errors

Pattern:
`What happened → What remains safe → Recovery`

Differentiate:
- validation error
- authentication/session error
- permission error
- not found
- network/server error
- empty results

## 13. Permissions

Never expose actions the current user cannot perform unless disabled state provides a useful explanation. Never rely solely on hidden buttons to enforce security; backend authorization remains authoritative.

## 14. Long content

Titles wrap before truncating when layout permits. Descriptions may clamp only when full content is available on detail view. Long names must not break controls or navigation.

## 15. Missing media

Use a consistent fallback rather than broken-image UI. Missing images must not collapse card layout unexpectedly.

## 16. Responsive transformations

Desktop → tablet → mobile transformations must preserve information hierarchy, not exact geometry.

Examples:
- right rail → hidden or moved below main content
- filter sidebar → filter sheet
- multi-column cards → one-column/full-width
- secondary actions → overflow/menu
- desktop conversation split view → list/detail navigation
- sticky desktop CTA → mobile persistent or contextually accessible action when needed

## 17. Motion

Motion communicates state, hierarchy or continuity. Never use motion as decoration that delays task completion. Honor reduced motion.

## 18. Recommendations

Recommendation reason must be traceable to actual available data. If insufficient data exists, omit the recommendation rather than invent a rationale.

## 19. Analytics neutrality

Do not introduce engagement patterns solely to increase time-on-site. Product instrumentation must measure task success, discovery quality and collaboration outcomes where appropriate.
