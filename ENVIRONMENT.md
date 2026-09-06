# ENVIRONMENT.md

All secrets via env vars. Never hardcoded. `.env.example` files (not real secrets) live at `apps/api/.env.example` and `apps/web/.env.example`, kept in sync with this file.

## apps/api/.env
| Variable | Purpose | Required | Introduced in Phase |
|---|---|---|---|
| `DATABASE_URL` | Postgres connection string | yes | 2 |
| `JWT_ACCESS_SECRET` | Sign/verify access tokens | yes | 4 |
| `JWT_REFRESH_SECRET` | Sign/verify refresh tokens (distinct from access secret) | yes | 4 |
| `JWT_ACCESS_TTL` | e.g. `15m` | yes | 4 |
| `JWT_REFRESH_TTL` | e.g. `7d` | yes | 4 |
| `EMAIL_PROVIDER_API_KEY` | Transactional email provider | yes | 4 |
| `EMAIL_FROM_ADDRESS` | Sender address | yes | 4 |
| `UNIVERSITY_EMAIL_DOMAINS` | Comma-separated allowed domains for auto university-verification | yes | 4 |
| `APP_BASE_URL` | Used to build verification/reset links | yes | 4 |
| `STORAGE_DRIVER` | `local` \| `s3` | yes | 3 (default `local`) |
| `STORAGE_LOCAL_PATH` | Disk path for local uploads (dev) | if `local` | 3 |
| `CORS_ALLOWED_ORIGINS` | Comma-separated | yes | 3 |
| `RATE_LIMIT_WINDOW_MS` / `RATE_LIMIT_MAX` | Rate limiting config | yes | 11 |
| `PORT` | API port | yes | 1 |
| `NODE_ENV` | `development` \| `test` \| `production` | yes | 1 |

## apps/web/.env
| Variable | Purpose | Required | Introduced in Phase |
|---|---|---|---|
| `VITE_API_BASE_URL` | Backend base URL | yes | 6 |

## Rule
Any new env var must be added to this file **and** both `.env.example` files in the same change. An agent must never introduce a config value read from `process.env`/`import.meta.env` that isn't documented here.
