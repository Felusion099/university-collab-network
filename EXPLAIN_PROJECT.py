#!/usr/bin/env python3
"""
EXPLAIN_PROJECT.py
==================
A living, runnable guide to the "University Collaboration & Research Network"
monorepo. It reads the real files in the project and prints a structured
walkthrough so you can understand WHAT the project is, HOW it is organised,
WHAT each folder does, and HOW the parts talk to each other.

Run it from the project root (or anywhere) with:

    python3 EXPLAIN_PROJECT.py          # full walkthrough
    python3 EXPLAIN_PROJECT.py --menu   # interactive explorer
    python3 EXPLAIN_PROJECT.py --tree   # just the folder tree
    python3 EXPLAIN_PROJECT.py --routes # just the API surface
    python3 EXPLAIN_PROJECT.py --models # just the data model

It uses only the Python standard library. It never modifies the project; it
only reads files and prints explanations.
"""

from __future__ import annotations

import os
import re
import sys

# ---------------------------------------------------------------------------
# Configuration / paths
# ---------------------------------------------------------------------------

# This file lives at the root of the monorepo, so the project root is
# simply the directory this file is sitting in.
PROJECT_ROOT = os.path.dirname(os.path.abspath(__file__))

# Paths to the important sub-trees (relative to PROJECT_ROOT).
APPS_ROOT = os.path.join(PROJECT_ROOT, "apps")
API_ROOT = os.path.join(APPS_ROOT, "api")
WEB_ROOT = os.path.join(APPS_ROOT, "web")
SHARED_ROOT = os.path.join(PROJECT_ROOT, "packages", "shared-types")
SCHEMA_PATH = os.path.join(API_ROOT, "prisma", "schema.prisma")
SEED_PATH = os.path.join(API_ROOT, "prisma", "seed.ts")

# Directories that are build/cache output and get skipped when printing the
# tree, so the "real" source shape is what stands out.
SKIP_DIRS = {
    "node_modules",
    ".turbo",
    "dist",
    ".next",
    ".cache",
    "build",
    "coverage",
    ".git",
    ".vite",
}

# ---------------------------------------------------------------------------
# Small helpers
# ---------------------------------------------------------------------------


def banner(title: str, char: str = "=") -> None:
    """Print a centred banner so the output is easy to skim."""
    width = 66
    print("")
    print(char * width)
    print(title.center(width))
    print(char * width)


def section(title: str) -> None:
    print("")
    print("-- " + title + " " + "-" * max(0, 66 - len(title) - 3))


def read(path: str) -> str:
    """Read a file as text, tolerating a missing file."""
    try:
        with open(path, "r", encoding="utf-8", errors="replace") as fh:
            return fh.read()
    except OSError:
        return ""


def safepath(rel: str) -> str:
    return os.path.normpath(os.path.join(PROJECT_ROOT, rel))


# ---------------------------------------------------------------------------
# 1. Project identity
# ---------------------------------------------------------------------------


def show_identity() -> None:
    banner("WHAT IS THIS PROJECT?")
    pkg = read(safepath("package.json"))
    name = re.search(r'"name"\s*:\s*"([^"]+)"', pkg)
    desc = re.search(r'"description"\s*:\s*"([^"]+)"', pkg)
    print("")
    print("  Project :", name.group(1) if name else "university-collab-network")
    print("  Purpose :", desc.group(1) if desc else "University Collaboration & Research Network")
    print(
        "  Stack   : pnpm workspaces + Turborepo monorepo\n"
        "            Backend  : Node + Express + TypeScript + Prisma + Postgres\n"
        "            Frontend : React 18 + Vite + TypeScript + Tailwind + Zustand + TanStack Query\n"
        "            Shared   : Zod schemas / TS types in packages/shared-types"
    )

    spec = read(safepath("PROJECT_SPEC.md"))
    m = re.search(r"Core question it must answer.*?\n", spec)
    print("")
    print("  One-line mission:", (m.group(0).strip() if m else "(see PROJECT_SPEC.md)"))
    print(
        "  A university platform that connects Students, Professors, Researchers,\n"
        "  Research Teams, Projects, Clubs, Startups, Publications, Topics,\n"
        "  Opportunities and Events into one discoverable collaboration graph."
    )


# ---------------------------------------------------------------------------
# 2. Folder tree
# ---------------------------------------------------------------------------


def build_tree(start: str, prefix: str = "", depth: int = 0, max_depth: int = 4) -> list:
    tree = []
    try:
        entries = sorted(
            os.listdir(start), key=lambda e: (not os.path.isdir(os.path.join(start, e)), e.lower())
        )
    except OSError:
        return tree

    for i, entry in enumerate(entries):
        if entry in SKIP_DIRS:
            continue
        full = os.path.join(start, entry)
        is_dir = os.path.isdir(full)
        is_last = i == len(entries) - 1
        branch = "`-- " if is_last else "|-- "
        tree.append(prefix + branch + entry + ("/" if is_dir else ""))
        if is_dir and depth + 1 <= max_depth:
            next_prefix = prefix + ("    " if is_last else "|   ")
            tree.extend(build_tree(full, next_prefix, depth + 1, max_depth))
    return tree


def show_tree() -> None:
    banner("FOLDER TREE (source files only, build output hidden)")
    print("  " + os.path.basename(PROJECT_ROOT) + "/")
    print("\n".join("  " + line for line in build_tree(PROJECT_ROOT, max_depth=4)))
    print("")
    print("  (node_modules, dist, .turbo, .next were skipped to keep the tree readable)")


# ---------------------------------------------------------------------------
# 3. The layered architecture and how a request flows
# ---------------------------------------------------------------------------


def show_architecture() -> None:
    banner("HOW THE CODE IS ORGANISED (layers)")
    print(
        """
  Frontend (apps/web)
    pages / layouts        -> screens the user sees
    components/            -> reusable UI (ProfileCard, Modal, Toast, ...)
    hooks/                 -> TanStack Query hooks, one per resource
    stores/                -> Zustand (session, ui, toast)
    services/api/          -> typed fetch clients, ONE per backend resource
               |
               |  HTTP  (fetch, JWT in Authorization header)
               v
  Backend (apps/api)
    routes/                -> thin wiring: maps URL path -> controller
    controllers/           -> parse + validate (Zod) + call a service
    services/              -> business logic, privacy filtering, matching
    repositories/          -> Prisma queries live here (isolated)
    middleware/            -> requireAuth / requireRole / errorHandler
               |
               |  Prisma ORM
               v
    Postgres database      (schema in prisma/schema.prisma)

  packages/shared-types    -> Zod schemas shared by web + api (single source
                             of truth for every API request/response shape)
  packages/config          -> shared eslint / tsconfig / prettier setup
"""
    )

    banner("WHAT HAPPENS WHEN A USER REQUESTS A PAGE / API CALL", "-")
    print(
        """
  1. A React component calls a typed client in services/api/ (never raw fetch).
  2. The client sends JSON to http://localhost:4000/api/v1/...
     with  Authorization: Bearer <access_jwt>  (if logged in).
  3. Express middleware order (apps/api/src/app.ts):
        pino logging -> CORS check -> JSON body parse -> cookie parse
        -> /health -> /api/v1/* (the versioned router) -> 404 fallback
        -> central errorHandler
  4. The versioned router (routes/index.ts) dispatches by path:
        /auth, /users, /research-topics, /organizations, /research-teams,
        /publications, /projects, /skills, /events, /opportunities,
        /connections, /conversations, /notifications, /discover, /admin
  5. Controller validates the body with a Zod schema, then calls a service.
  6. Service applies business rules (privacy filtering, match scoring) and
     calls a repository.
  7. Repository runs the Prisma query against Postgres and returns data.
  8. The response goes back up the same chain as JSON.
"""
    )


# ---------------------------------------------------------------------------
# 4. Authentication flow
# ---------------------------------------------------------------------------


def show_auth() -> None:
    banner("AUTHENTICATION FLOW")
    print(
        """
  Signup
    1. POST /auth/signup  -> users row created with status=pending_verification
    2. POST /auth/verify-email (token) -> account activated
    3. University-email domains auto-verify when the domain matches
       UNIVERSITY_EMAIL_DOMAINS in apps/api/.env

  Login
    POST /auth/login  -> bcrypt password check
    -> short-lived JWT access token (15 min, returned in JSON)
    -> long-lived refresh token (7 days, set as httpOnly cookie)

  Refresh
    POST /auth/refresh -> issues a new access token + rotates the refresh
    token (old one is revoked; stored hashed in the refresh_tokens table)

  Authorization (middleware)
    requireAuth           -> validates JWT, attaches req.user
    requireRole([...])    -> checks the verifications table (role claims),
                             NOT the self-reported requested_role

  Privacy (hard rule, DECISIONS D-004)
    Profile-level : public | university_only | connections_only | private
    Field-level   : choose what email/phone/CGPA/projects etc. reveal
    The API never sends fields the viewer is not allowed to see -- the
    frontend is never trusted to hide them. Enforcement lives in the
    service layer (services/privacy.service.ts).
"""
    )


# ---------------------------------------------------------------------------
# 5. Data model
# ---------------------------------------------------------------------------


def parse_models(schema: str) -> dict:
    """Extract Prisma 'model' and 'enum' block headers from the schema."""
    models = {}
    for match in re.finditer(r"^model\s+(\w+)|\benum\s+(\w+)", schema, re.M):
        name = match.group(1) or match.group(2)
        kind = "model" if match.group(1) else "enum"
        models.setdefault(kind, []).append(name)
    return models


def show_models() -> None:
    banner("DATA MODEL (prisma/schema.prisma)")
    schema = read(SCHEMA_PATH)
    parsed = parse_models(schema)
    n_models = len(parsed.get("model", []))
    n_enums = len(parsed.get("enum", []))

    print(f"  {n_models} models  |  {n_enums} enums  |  total lines ~{len(schema.splitlines())}")
    print("")
    print("  Core people  : User, StudentProfile, ProfessorProfile, ResearcherProfile")
    print("  Org / research: Organization, StartupDetails, ResearchTeam, ResearchTopic")
    print("  Outputs      : Publication, Project, Event, Opportunity")
    print("  Network      : Connection, Follow, Membership, Skill, UserSkill")
    print("  Messaging    : Conversation, ConversationParticipant, Message")
    print("  Platform     : Notification, NotificationPreferences, Report, Application")
    print("  Auth internals: RefreshToken, Verification, PrivacySettings")
    print("")
    print("  Full model list:")
    for i, name in enumerate(parsed.get("model", []), 1):
        print(f"    {i:2d}. {name}")

    print("")
    print("  Enums:")
    for name in parsed.get("enum", []):
        print(f"    - {name}  ({', '.join(find_enum_values(schema, name))})")


def find_enum_values(schema: str, enum_name: str) -> list:
    """Return the literal values inside a Prisma enum block."""
    m = re.search(rf"enum\s+{re.escape(enum_name)}\s*\{{(.*?)\}}", schema, re.S)
    if not m:
        return []
    return [
        line.strip().rstrip(",")
        for line in m.group(1).splitlines()
        if line.strip() and not line.strip().startswith("//")
    ][:8]  # cap display at first 8 values


# ---------------------------------------------------------------------------
# 6. API surface
# ---------------------------------------------------------------------------


def show_api_routes() -> None:
    banner("API SURFACE (what the backend exposes)")
    routes_dir = os.path.join(API_ROOT, "src", "routes")
    if not os.path.isdir(routes_dir):
        print("  (no routes directory found)")
        return

    found = 0
    for fname in sorted(os.listdir(routes_dir)):
        if not fname.endswith(".routes.ts"):
            continue
        path = os.path.join(routes_dir, fname)
        text = read(path)
        routes = re.findall(
            r"\.(get|post|put|patch|delete)\s*\(\s*[\"'](/[^\"']*)?[\"']",
            text,
            re.I,
        )
        if not routes:
            continue
        found += 1
        label = fname.replace(".routes.ts", "")
        print(f"\n  /api/v1/{label}")
        printed = set()
        for method, sub_path in routes:
            sub = sub_path or "/"
            key = (method.upper(), sub)
            if key in printed:
                continue
            printed.add(key)
            print(f"    {method.upper():6s} {sub}")

    print(f"\n  (scanned {found} route files; mounted under the /api/v1 prefix)")


# ---------------------------------------------------------------------------
# 7. Match score (the one clever algorithm)
# ---------------------------------------------------------------------------


def show_matching() -> None:
    banner("TEAM BUILDER MATCH SCORE")
    print(
        """
  score = w1 * skill_overlap          (w1 = 0.40 -- project skills matched)
        + w2 * research_topic_overlap (w2 = 0.30)
        + w3 * availability_match     (w3 = 0.15)
        + w4 * department_proximity   (w4 = 0.10)
        + w5 * existing_connection    (w5 = 0.05)

  Implementation: apps/api/src/services/matching.service.ts

  Important detail:
  The API never returns just a number. It always returns the matched /
  unmatched criteria list (e.g. "matched: Python, ML" / "missing: React")
  alongside the score, so every score is explainable.
"""
    )


# ---------------------------------------------------------------------------
# 8. Implementation status by phase
# ---------------------------------------------------------------------------


def show_status() -> None:
    banner("IMPLEMENTATION STATUS (from IMPLEMENTATION_STATUS.md)")
    text = read(safepath("IMPLEMENTATION_STATUS.md"))
    statuses = []
    for line in text.splitlines():
        m = re.match(r"### (Phase [\d.]+[^—]*)", line)
        s = re.search(r"\bSTATUS:\s*\*?\*?([^*\n]+)", line)
        if m and s:
            statuses.append((m.group(1).strip(), s.group(1).strip()))

    if not statuses:
        print("  (phase status table not found in IMPLEMENTATION_STATUS.md)")
        return

    for phase, status in statuses:
        print(f"  {phase:12s} -> {status}")
    print(
        "\n  Note: several later phases were completed ahead of the strict "
        "phase-gate order at the\n  user's direction; live DB / browser "
        "verification is still pending a working PostgreSQL.\n"
        "  See AGENT_HANDOFF.md and DECISIONS.md for the full story."
    )


# ---------------------------------------------------------------------------
# 9. How to run the thing
# ---------------------------------------------------------------------------

SHORT_COMMANDS = """
  pnpm dev          run api + web dev servers together (via turbo)
  cd apps/api       backend work
    pnpm prisma:generate   (re)generate the Prisma client
    pnpm prisma:migrate    apply schema migrations to Postgres
    pnpm prisma:seed       load demo/interconnected demo data
    pnpm prisma:studio     open a GUI for the database
    pnpm test              run backend unit/integration tests
  cd apps/web       frontend work
    pnpm dev         -> Vite dev server
    pnpm build       -> production bundle
"""


def show_how_to_run() -> None:
    banner("HOW TO RUN / DEVELOP")
    print(SHORT_COMMANDS)
    env = read(safepath("apps/api/.env.example"))
    needed = [m for m in re.findall(r"(?m)^([A-Z0-9_]+)=", env) if m]
    print("  Required env vars (apps/api/.env, see ENVIRONMENT.md):")
    print("    " + ", ".join(needed))
    print(
        "  You need a running PostgreSQL server; set DATABASE_URL in apps/api/.env\n"
        "  (a docker/ folder exists for containerised setup but is not yet populated)."
    )


# ---------------------------------------------------------------------------
# 10. Interactive menu
# ---------------------------------------------------------------------------

MENU = [
    ("1", "What is this project?", show_identity),
    ("2", "Folder tree", show_tree),
    ("3", "Architecture + request flow", show_architecture),
    ("4", "Authentication flow", show_auth),
    ("5", "Data model (Prisma models/enums)", show_models),
    ("6", "API routes", show_api_routes),
    ("7", "Team-builder match score", show_matching),
    ("8", "Implementation status by phase", show_status),
    ("9", "How to run / develop", show_how_to_run),
    ("0", "Show all sections", lambda: None),
    ("q", "Quit", lambda: None),
]


def interactive_menu() -> None:
    banner("INTERACTIVE EXPLORER")
    while True:
        print("\n  Pick a topic:")
        for key, label, _ in MENU:
            print(f"    {key}) {label}")
        choice = input("\n  > ").strip().lower()

        if choice == "q":
            print("  Bye.")
            break
        if choice == "0":
            run_all()
            continue
        for key, label, func in MENU:
            if choice == key:
                func()
                break
        else:
            print("  Unknown choice, try again.")


# ---------------------------------------------------------------------------
# 11. Main
# ---------------------------------------------------------------------------


def run_all() -> None:
    show_identity()
    show_tree()
    show_architecture()
    show_auth()
    show_models()
    show_api_routes()
    show_matching()
    show_status()
    show_how_to_run()
    banner("END OF GUIDE")


def main() -> None:
    args = sys.argv[1:]

    if not os.path.isdir(APPS_ROOT):
        print("ERROR: apps/ directory not found next to this script.")
        print("Run this script from inside the extracted university-collab-network folder.")
        sys.exit(1)

    if "--menu" in args:
        interactive_menu()
    elif "--tree" in args:
        banner("SOURCE TREE (build output hidden)")
        print("  " + os.path.basename(PROJECT_ROOT) + "/")
        print("\n".join("  " + line for line in build_tree(PROJECT_ROOT, max_depth=4)))
    elif "--routes" in args:
        show_api_routes()
    elif "--models" in args:
        show_models()
    else:
        run_all()


if __name__ == "__main__":
    main()