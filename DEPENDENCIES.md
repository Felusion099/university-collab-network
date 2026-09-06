# DEPENDENCIES.md

No dependency may be added outside this list without a new entry here + a note in `DECISIONS.md`. "Introduced in Phase" = first phase allowed to add it to a `package.json`.

## Root
| Package | Purpose | Introduced in Phase |
|---|---|---|
| turbo | Monorepo task orchestration | 1 |
| typescript | Language | 1 |
| eslint, prettier | Lint/format | 1 |
| husky, lint-staged | Pre-commit hooks | 1 |
| @eslint/js, typescript-eslint | ESLint cannot parse/lint TypeScript syntax without these; required for the base `eslint` package to function on a TS codebase at all — see D-006 | 1 |

## apps/web
| Package | Purpose | Introduced in Phase |
|---|---|---|
| react, react-dom | UI runtime | 1 |
| vite, @vitejs/plugin-react | Build tool | 1 |
| @types/react, @types/react-dom | Type declarations required for `tsc` to compile React/JSX at all — without them every component fails to typecheck, not just a nicety | 1 |
| react-router-dom | Routing | 6 |
| @tanstack/react-query | Server state/cache | 6 |
| zustand | Client state | 6 |
| tailwindcss, postcss, autoprefixer | Styling | 6 |
| class-variance-authority, tailwind-merge | shadcn/ui support | 6 |
| @radix-ui/* (via shadcn/ui components as needed) | Accessible primitives | 6/7 |
| framer-motion | Animation | 7 |
| zod | Shared validation (via shared-types) | 6 |
| react-hook-form, @hookform/resolvers | Forms | 7 |
| date-fns | Date formatting | 7 |
| lucide-react | Icons | 6 |

## apps/api
| Package | Purpose | Introduced in Phase |
|---|---|---|
| express | HTTP server | 3 |
| @prisma/client, prisma | DB access | 2 |
| tsx | Runs `prisma/seed.ts` directly (TS, ESM-safe) via Prisma's `prisma.seed` config hook (`prisma migrate dev`/`reset` invoke it automatically) — `ts-node` has known ESM/`NodeNext`-resolution friction with this repo's `moduleResolution: "NodeNext"` base tsconfig, `tsx` does not | 2 |
| zod | Validation | 3 |
| bcrypt | Password hashing | 4 |
| jsonwebtoken | JWT issuing/verifying | 4 |
| cookie-parser | Refresh-token cookie | 4 |
| @types/bcrypt, @types/jsonwebtoken, @types/cookie-parser | Type declarations for the above; required for TypeScript compilation | 4 |
| helmet | Security headers | 11 |
| express-rate-limit | Rate limiting | 11 |
| cors | CORS handling | 3 |
| @types/node | Type declarations for Node builtins (`node:http`, etc.); Phase 1's boot-check server uses Node's built-in `http` module directly and cannot typecheck without this | 1 |
| multer | File upload handling (dev/local) | 7/8 (TBD) — first needed wherever avatar/logo/publication-PDF upload is implemented; pin the exact phase in `IMPLEMENTATION_STATUS.md` when that endpoint is built, see D-005 |
| resend (or chosen provider) | Transactional email — **not installed**; Phase 4 called Resend's REST API directly via `fetch` instead because the implementing session had no package-registry access. See DECISIONS.md D-011 point 4. A future phase with registry access may install the SDK; no code change needed in `EmailService` consumers if so. | 4 |
| dotenv | Env loading | 3 |
| pino, pino-http | Structured logging | 3 |
| @types/express, @types/cors, @types/pino-http | Type declarations for Express, CORS, and pino-http middleware; required for TypeScript compilation | 3 |
| pino-pretty | Development pretty-printing stream for pino structured logs | 3 |
| @types/express-serve-static-core | `@types/express` depends on this transitively, but under pnpm's strict (non-hoisted) `node_modules` layout a transitive `@types/*` package is only linked inside `@types/express`'s own nested store folder — not at `apps/api/node_modules/@types/`, where a file doing `declare module "express-serve-static-core" { interface Request { ... } }` (the standard Express request-augmentation pattern, used by `requireAuth.ts`) needs to resolve it directly. Without an explicit devDependency entry, `tsc` fails with "Invalid module name in augmentation, module 'express-serve-static-core' cannot be found," which cascades into every file referencing `req.user`. Added explicitly, verified via a real `pnpm install` + `tsc --noEmit` in a session with genuine registry access (see DECISIONS.md D-012); this was previously misdiagnosed as an artifact of a manual `node_modules` reconstruction (HANDOFF-10) — this session's fix confirms it is a real, independent gap. | 4 |

## packages/shared-types
| Package | Purpose | Introduced in Phase |
|---|---|---|
| zod | Schema declaration and TS type inference for shared API contract shapes | 3 |

## Testing (both apps)
| Package | Purpose | Introduced in Phase |
|---|---|---|
| vitest | Unit/integration test runner | 10 |
| supertest | HTTP integration testing (api) | 10 |
| @testing-library/react | Component testing (web) | 10 |
| playwright | E2E | 10 |

## Explicitly Deferred (documented, not installed yet)
- `socket.io` — only if/when real-time messaging upgrade is greenlit (see ARCHITECTURE §7).
- `aws-sdk` / S3 client — only when storage moves off local disk (Phase 13+).
- Search engine client (e.g. `meilisearch`) — only if Postgres full-text search proves insufficient at scale.

## Rule
Adding an unlisted dependency requires: (1) an entry added here with justification and phase, (2) a corresponding `DECISIONS.md` note if it changes an architectural choice from `DECISIONS.md` D-001.
