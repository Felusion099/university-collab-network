// Shared ESLint flat-config base, consumed by apps/web and apps/api.
//
// NOTE (Phase 1 handoff item — see AGENT_HANDOFF.md HANDOFF-01):
// "@eslint/js" and "typescript-eslint" are used here so ESLint can actually
// parse and lint .ts/.tsx files. Neither package appears in DEPENDENCIES.md's
// Root table, which only lists "eslint, prettier". They are added to the
// root package.json devDependencies as the minimum necessary companions to
// make "eslint" functional on a TypeScript codebase at all (without them,
// ESLint cannot parse TypeScript syntax and Phase 1's "lint runs clean"
// acceptance criterion would be unverifiable). This is flagged, not silent —
// formalize with a DEPENDENCIES.md + DECISIONS.md entry in a documentation
// pass rather than treating it as already frozen.
import js from "@eslint/js";
import tseslint from "typescript-eslint";

/** @type {import("eslint").Linter.Config[]} */
export default [
  {
    ignores: ["**/dist/**", "**/node_modules/**", "**/.turbo/**", "**/coverage/**"],
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
];
