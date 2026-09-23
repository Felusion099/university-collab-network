#!/usr/bin/env python3
"""Generate PROJECT_EXPLAINED.docx — a plain-language walkthrough of the
University Collaboration Platform, written so a non-expert can answer any
question about it with confidence. Built in pieces."""
from docx import Document
from docx.shared import Pt, RGBColor, Inches
from docx.enum.text import WD_ALIGN_PARAGRAPH

ACCENT = RGBColor(0x4F, 0x46, 0xE5)   # indigo
DARK = RGBColor(0x18, 0x18, 0x1B)     # zinc-900
GRAY = RGBColor(0x55, 0x55, 0x55)
LIGHT = RGBColor(0x88, 0x88, 0x88)


def h1(doc, text):
    p = doc.add_heading(text, level=1)
    for r in p.runs:
        r.font.color.rgb = ACCENT
    return p


def h2(doc, text):
    p = doc.add_heading(text, level=2)
    for r in p.runs:
        r.font.color.rgb = DARK
    return p


def para(doc, text, bold=False, color=None, size=10.5):
    p = doc.add_paragraph()
    r = p.add_run(text)
    r.font.size = Pt(size)
    r.bold = bold
    if color:
        r.font.color.rgb = color
    return p


def bullets(doc, items):
    for item in items:
        p = doc.add_paragraph(style="List Bullet")
        if isinstance(item, tuple):
            r = p.add_run(item[0] + " — ")
            r.bold = True
            r.font.size = Pt(10.5)
            r2 = p.add_run(item[1])
            r2.font.size = Pt(10.5)
        else:
            r = p.add_run(item)
            r.font.size = Pt(10.5)


def qna(doc, question, answer):
    para(doc, "Q: " + question, bold=True, color=DARK)
    para(doc, "A: " + answer, color=GRAY)
    doc.add_paragraph()


def build():
    doc = Document()
    doc.core_properties.title = "University Collaboration Platform — Project Explained"

    # ---- Cover ----
    t = doc.add_paragraph()
    t.alignment = WD_ALIGN_PARAGRAPH.CENTER
    r = t.add_run("University Collaboration Platform")
    r.font.size = Pt(30)
    r.bold = True
    r.font.color.rgb = ACCENT

    t2 = doc.add_paragraph()
    t2.alignment = WD_ALIGN_PARAGRAPH.CENTER
    r2 = t2.add_run("The Complete Project Explained — architecture, features, security, and how to run it")
    r2.font.size = Pt(12)
    r2.font.color.rgb = GRAY

    doc.add_paragraph()

    # ==================== PIECE 1: WHAT IS THIS? ====================
    h1(doc, "1. What is this project?")

    para(doc, "The University Collaboration Platform is a website for a university where students, "
              "professors, researchers, and student clubs can find each other and work together. "
              "Think of it as a private, university-only version of LinkedIn mixed with a project "
              "board — but focused on one thing: helping people on campus discover each other's "
              "abilities and collaborate on projects, research, and events.")

    para(doc, "The core question the platform answers is: \u201cWho should I know about, which project "
              "should I join, and what is happening on campus right now?\u201d", bold=True)

    para(doc, "It is NOT an ERP (not a fees/timetable system), NOT a social-media clone, and NOT a "
              "payments platform. There is no money involved anywhere.")

    h1(doc, "2. What does it do? (Features)")

    h2(doc, "2.1 Accounts and onboarding")
    bullets(doc, [
        ("Sign up / login", "real accounts with email + password. Passwords are hashed (scrambled "
         "so nobody — not even the admin — can read them)."),
        ("Roles", "every account is a Student, Professor, Researcher, Professional, or Admin. "
         "The role decides what the person sees and can do."),
        ("Onboarding", "when a brand-new user logs in for the first time, a 2-step setup wizard "
         "appears: (1) profile basics — name, department, degree, year; (2) skills — picked from "
         "a searchable list of 137 skills grouped into 8 categories. This is saved to the database, "
         "so it never asks again. Users can skip and finish later."),
        ("Profile pictures", "users can upload a photo. It is resized in the browser to a small "
         "256px square, converted to base64 text, and stored in the database with the rest of the "
         "profile details."),
    ])

    h2(doc, "2.2 Discovery pages (each has its own purpose)")
    bullets(doc, [
        ("Explore (Home)", "a personal dashboard: welcome banner, live stats, featured projects, "
         "people to know, upcoming events."),
        ("People & Labs", "a directory of everyone on campus — students, professors, researchers. "
         "Search by name/skill/department, filter by role, view profiles, connect, message."),
        ("Projects", "teams recruiting collaborators: search, category pills, team capacity bars, "
         "apply to join, project detail pages with full team management."),
        ("Startups", "ventures that grew out of campus projects — ongoing, incubated, graduated. "
         "Curated by the council/admin (very early ideas stay under Projects)."),
        ("Communities", "clubs and societies — join/leave, member counts, a full detail page with "
         "leadership and roles."),
        ("Events", "hackathons, workshops, seminars — dates, venues, capacity, register/RSVP, "
         "full event detail pages."),
        ("Council Notices", "official notices from the university council — stored in the database, "
         "published by admins only."),
    ])

    h2(doc, "2.3 Collaboration and teamwork")
    bullets(doc, [
        ("Project applications", "a student applies to join a project with a message. The project "
         "owner reviews it (accept/decline) from their dashboard. Accepting makes the applicant a "
         "REAL member of the team — stored in the database, not just on screen."),
        ("Project owner controls", "the owner can edit their project (title, description, category, "
         "skills, status, visibility), delete it (with a confirmation — really deleted from the "
         "database), remove teammates, and manage incoming requests. Nobody else can do these things."),
        ("Leave project", "a teammate (not the owner) can leave with a confirmation — the project "
         "stays intact, and they can request to join again later."),
        ("Public/Private visibility", "the owner chooses whether the project is discoverable. Private "
         "projects are invisible to everyone except the owner and their team — enforced on the server."),
    ])

    h2(doc, "2.4 Connections and messaging")
    bullets(doc, [
        ("Connections", "a professional \u201crequest to connect\u201d between two people — like LinkedIn. "
         "States: no connection → request sent → request received → connected. The receiver accepts "
         "or declines."),
        ("Optional message", "the sender can include a short note (\u201cI'd like to connect because…\u201d). "
         "The receiver sees who sent it and the note."),
        ("Rate limit", "maximum 3 connection requests per week to the same person — enforced on the "
         "server (a 4th attempt gets a 429 \u201ctoo many requests\u201d error). Cancelling and re-sending "
         "counts toward the limit, so spam is impossible."),
        ("Messaging", "direct chat between two people. Rule: you must be CONNECTED before you can "
         "message someone — enforced on the server. Messages appear in real time (under a second) "
         "using Server-Sent Events."),
    ])

    h2(doc, "2.5 Community roles")
    bullets(doc, [
        ("Hierarchy", "each community has leadership: President (owner) → Vice President → "
         "Department Heads → Members, with custom role titles (PR Head, Tech Head, …)."),
        ("Discord-like permissions", "nobody can remove, edit, or demote someone at or above their "
         "own rank — enforced on the server. The President can assign roles, remove members, and "
         "transfer the presidency to an eligible member."),
    ])

    h2(doc, "2.6 Other")
    bullets(doc, [
        ("Dark mode", "the user picks Light, Dark, or System in their profile menu. The choice "
         "persists after refresh."),
        ("Admin Panel", "admins see platform-wide stats and manage users, notices, communities, "
         "events, and startups."),
        ("Notifications", "connection requests, acceptances, messages, event reminders — with unread "
         "badges."),
    ])


    # ==================== PIECE 2: ARCHITECTURE ====================
    h1(doc, "3. How is it built? (Tech stack)")

    para(doc, "Three main pieces, each chosen for a reason:", bold=False)

    bullets(doc, [
        ("Frontend (the website)", "React 19 with Vite and Tailwind CSS. React builds the interface "
         "from reusable components; Vite bundles it fast; Tailwind is a styling system where the "
         "design (colors, spacing, dark mode) lives in one central place. All of it lives in apps/web."),
        ("Backend (the server)", "Express.js (a minimal Node.js web framework) written in TypeScript, "
         "organized in strict layers: Routes → Controllers → Services → Repositories. Each layer has "
         "one job. Lives in apps/api."),
        ("Database", "PostgreSQL, accessed through Prisma — a library that maps database tables to "
         "typed objects so the code can never accidentally query wrong fields. The full schema "
         "(48 models) is in apps/api/prisma/schema.prisma."),
    ])

    h2(doc, "3.1 How a click travels through the system")
    para(doc, "Example: you click “Apply / Collaborate” on a project:")
    bullets(doc, [
        "The button calls a function in the React app (the UI layer).",
        "That function makes an HTTP request to the backend API (with your identity attached — a JWT token).",
        "The API's ROUTE receives it and checks your token (Authentication: are you really you?).",
        "The CONTROLLER validates the data (is the request well-formed?).",
        "The SERVICE applies the business rules (are you already a member? do you already have a "
        "pending request? — Authorization).",
        "The REPOSITORY writes to PostgreSQL (the database).",
        "The response travels back and the UI updates (the button becomes “Request Pending”).",
    ])
    para(doc, "Every important action in the platform follows this exact path. Nothing is “faked” "
              "in the browser — the database is the single source of truth.", bold=True)

    h2(doc, "3.2 The two modes (demo and live)")
    bullets(doc, [
        ("Demo mode", "the frontend runs with mock data stored in the browser (localStorage) — no "
         "backend needed. Useful for quick previews. Turned on with VITE_API_MODE=demo."),
        ("Live mode", "the real thing — every action hits the real API and database. The deployed "
         "version always runs live. Turned on with VITE_API_MODE=live."),
    ])

    h1(doc, "4. The database (what is stored)")

    para(doc, "PostgreSQL via Prisma — 48 models. The important ones:")
    bullets(doc, [
        ("users", "every account: email, username, hashed password, role, status, avatar (base64), "
         "onboarding_completed_at."),
        ("student/professor/researcher/professional profiles", "role-specific details: department, "
         "degree, year, designation, bio, links."),
        ("skills + user_skills", "the 137-skill taxonomy grouped in 8 categories, and which user "
         "has which skill."),
        ("projects + project_members", "every project and its team members. Members are real rows — "
         "accepting a join request creates one."),
        ("join_requests", "collaboration requests: who wants to join which project, with a message, "
         "and the status (pending/accepted/rejected)."),
        ("connections + connection_request_history", "professional connections between two people "
         "(pending/accepted/declined) and the rate-limit history (max 3 requests/week/pair)."),
        ("conversations + messages", "direct chats. The message body, sender, and timestamp."),
        ("organizations (+ memberships)", "clubs, societies, and startups — who founded them, who "
         "the members are, and their role titles (President, VP, Heads…)."),
        ("events (+ participants)", "campus events with capacity and who registered."),
        ("notices", "official council notices — title, content, priority (Urgent/Important/Notice), "
         "pinned."),
        ("notifications", "per-user notifications (connection requests, acceptances, messages…)."),
        ("privacy_settings", "per-user field-level visibility — who can see your email, CGPA, "
         "projects, etc."),
        ("verifications", "role verification — a privileged role (admin, professor) is only "
         "“real” once an approved row exists here. This is how the platform prevents someone "
         "from claiming a role they don't have."),
    ])

    para(doc, "Key design rules: every table row has a UUID primary key and timestamps; every "
              "relationship is indexed; demo data is flagged is_seed so it can be cleaned up safely; "
              "everything is paginated (lists come back in pages of 20-100, never the whole table).")

    doc.save("PROJECT_EXPLAINED.docx")
    print("Piece 2 added")


    # ==================== PIECE 3: SECURITY + RUNNING ====================
    h1(doc, "5. Accounts, passwords and security")

    h2(doc, "5.1 How login works")
    bullets(doc, [
        "You enter email + password.",
        "The server looks up the account and compares the password against the stored HASH "
        "(bcrypt — a slow, salted hash; even the database owner cannot reverse it).",
        "If correct, the server issues two tokens: an ACCESS TOKEN (valid 15 minutes — used for "
        "every request) and a REFRESH TOKEN (valid 7 days — stored as a secure, httpOnly cookie, "
        "invisible to JavaScript).",
        "When the access token expires, the frontend silently calls /auth/refresh with the cookie "
        "and gets a new one — you stay logged in for a week without re-typing your password.",
        "Sign out invalidates the refresh token on the server.",
    ])

    h2(doc, "5.2 What is enforced on the server (never just in the browser)")
    bullets(doc, [
        ("Project actions", "only the OWNER can edit/delete their project or remove teammates "
         "(the server checks the created_by column). Only members can leave. The owner cannot leave "
         "their own project."),
        ("Connections", "only the recipient can accept/decline; only the sender can cancel; "
         "max 3 requests/week/pair (429 otherwise)."),
        ("Messaging", "you must be CONNECTED with someone before messaging them (403 otherwise)."),
        ("Startups", "only verified admins can add startup entries."),
        ("Notices", "only verified admins can publish notices."),
        ("Private projects", "invisible to non-members — the server filters them out of every list "
         "and returns 404 on direct access."),
        ("Password safety", "the password hash NEVER appears in any API response (there are "
         "automated regression tests for this)."),
        ("Role claims", "privileged roles (admin, professor) need an approved row in the "
         "verifications table — users.requested_role alone is never trusted."),
    ])

    h2(doc, "5.3 Privacy")
    para(doc, "Every user has privacy settings controlling who can see each profile field (public / "
              "university-only / connections-only / private). The filtering happens on the SERVER — "
              "a private field never even leaves the database for an unauthorized viewer. Private "
              "never appears in the page source.")

    h1(doc, "6. How to run it")

    h2(doc, "6.1 Locally (development)")
    para(doc, "Requirements: Node.js 20+, pnpm, PostgreSQL running.", bold=False)
    doc.add_paragraph("cd university-collab-platform", style="Intense Quote")
    bullets(doc, [
        "Database setup: create a database, then: pnpm --filter @app/api prisma:generate && "
        "pnpm --filter @app/api prisma db push && pnpm --filter @app/api prisma:seed",
        "Terminal 1 (the API): pnpm dev:api  → runs on http://localhost:4000",
        "Terminal 2 (the website): pnpm dev  → runs on http://localhost:3000",
        "Open http://localhost:3000 in the browser.",
        "Demo accounts after seeding: priya.sharma@seed.university.edu / Demo@1234 (student), "
        "vikram.singh@seed.university.edu / Demo@1234 (professor), ananya.rao@seed.university.edu / "
        "Demo@1234 (researcher).",
    ])

    h2(doc, "6.2 Live (deployed — free tiers)")
    para(doc, "The stack: website on Vercel + API on Render + database on Neon. All free:")
    bullets(doc, [
        ("Neon (neon.tech)", "free always-on PostgreSQL. Create a project, copy the connection string."),
        ("Render (render.com)", "free Node web service. Root directory apps/api; build: "
         "pnpm install && pnpm prisma generate && pnpm build; pre-deploy: pnpm prisma db push; "
         "start: node dist/server.js. Set the env vars (DATABASE_URL → Neon, JWT secrets, "
         "CORS_ALLOWED_ORIGINS → your Vercel URL, NODE_ENV=production)."),
        ("Vercel (vercel.com)", "free static hosting. Root directory apps/web (auto-detects the "
         "workspace + Vite). Set VITE_API_MODE=live and VITE_API_BASE_URL=https://<render-url>/api/v1."),
        ("Production cookies", "the refresh cookie switches to SameSite=None; Secure in production "
         "so cross-site sessions work (already implemented)."),
        ("Free-tier tradeoff", "Render sleeps after 15 min of inactivity — the first visit after "
         "sleep takes ~30-60s to wake. Neon and Vercel are always-on."),
    ])

    doc.save("PROJECT_EXPLAINED.docx")
    print("Piece 3 added")


    # ==================== PIECE 4: KEY FLOWS ====================
    h1(doc, "7. The key flows, step by step")

    h2(doc, "7.1 A new user joins (onboarding)")
    bullets(doc, [
        "The user signs up (email + password + full name + role).",
        "The account is created with status “pending verification” — they can log in immediately.",
        "On first login, the platform checks the database: is onboarding complete? If not, a 2-step "
        "setup wizard appears INSTEAD of the normal app.",
        "Step 1: profile basics (name, department, degree, year — the form adapts to the role: a "
        "professor gets designation/institution fields, a council member gets an organization field).",
        "Step 2: skills — a searchable, scrollable list of 137 skills grouped in 8 categories "
        "(Technology, AI & Data, Electronics, Design, Content & Media, Business, Academic, Other). "
        "The user picks multiple skills as chips. Optionally picks research interests.",
        "Finish: everything is saved to the DATABASE (profile + skills + a completion marker).",
        "The normal app appears. Refreshing never re-asks onboarding — the completion marker lives "
        "in the database, not the browser.",
    ])

    h2(doc, "7.2 Collaboration on a project (the complete lifecycle)")
    bullets(doc, [
        "User A opens a project and clicks “Apply / Collaborate” — writes a pitch + role.",
        "The request is stored as PENDING in the join_requests table. Duplicate requests are "
        "blocked by the server.",
        "The project owner sees the request in their Dashboard (Connection/Proposal inbox) — with "
        "the applicant's name, department, and message.",
        "The owner clicks Accept — the server creates a REAL project_members row inside a database "
        "transaction and marks the request ACCEPTED.",
        "User A's dashboard now shows the project under their joined projects; the member count "
        "updates everywhere; a notification arrives.",
        "If the owner DECLINES — no membership is created and User A sees the request as declined. "
        "They can request again later.",
        "Full team does NOT block requests: even at capacity, new requests are allowed — the owner "
        "decides who joins (they may want to replace someone or add a skilled person).",
    ])

    h2(doc, "7.3 Connecting and messaging")
    bullets(doc, [
        "User A clicks “Connect” on User B's profile — optionally adds a note.",
        "User B sees the request (with the note) and accepts or declines.",
        "Before connection, the Message button is disabled for A — and even if bypassed, the "
        "SERVER rejects the message attempt (403: “you must be connected”).",
        "After accept: A can message B — real-time chat (messages appear in under a second via "
        "Server-Sent Events, no refresh needed).",
        "Rate limit: max 3 requests/week to the same person — cancelling and re-sending counts. "
        "The 4th attempt returns 429.",
        "Stale messages are impossible: a re-request after a decline always shows the NEW message.",
    ])

    h2(doc, "7.4 Project ownership")
    bullets(doc, [
        "The owner can EDIT the project (title, description, category, skills, status, "
        "Public/Private visibility, deadline) via an edit form — saved through the API.",
        "The owner can DELETE the project — a confirmation dialog warns first; confirming REALLY "
        "deletes the row from the database (all team members, requests, and chat links clean up "
        "automatically). It disappears from discovery.",
        "The owner can REMOVE a teammate — the person loses membership but the project stays.",
        "The owner CANNOT leave their own project (the server blocks it) — they either keep it or "
        "delete it.",
        "Visibility: Public = discoverable by everyone; Private = only the owner and their team can "
        "see it — enforced by the server (private projects return 404 to outsiders).",
    ])

    h2(doc, "7.5 Community leadership (roles)")
    bullets(doc, [
        "The community's creator is the President (rank 100); Vice Presidents (90), Department "
        "Heads (80), and Members (10) are assigned below.",
        "Roles are assigned from the community page — a dropdown (VP/Head/Member) plus a custom "
        "title field (e.g. “PR Head”).",
        "Rank enforcement (server-side): nobody can remove, edit, or demote someone at-or-above "
        "their own rank; nobody can assign a role at-or-above their own authority.",
        "The President can TRANSFER the presidency to an eligible member — the new person becomes "
        "the highest authority; the old president steps down to Vice President.",
        "The President cannot leave the community while they own it — they must transfer first.",
    ])

    h2(doc, "7.6 Real-time updates")
    bullets(doc, [
        "Messages: delivered instantly via Server-Sent Events (SSE) — a one-way stream from the "
        "server. The sender's message appears in the other person's chat in under a second.",
        "Everything else (new projects, notifications, events): refreshed every 4 seconds while "
        "the app is open — the page updates in place instead of “updates each login”.",
        "Optimistic UI: sent messages appear immediately with a pending marker, then confirmed by "
        "the server — with automatic de-duplication so nothing doubles.",
    ])

    doc.save("PROJECT_EXPLAINED.docx")
    print("Piece 4 added")


    # ==================== PIECE 5: Q&A ====================
    h1(doc, "8. Questions they might ask you (with confident answers)")

    qna(doc, "What is this project in one sentence?",
        "A university-only collaboration platform where students, professors, and clubs discover "
        "each other's abilities and collaborate on projects, research, and events — like LinkedIn "
        "plus a project board, scoped to one campus, with real accounts and real-time messaging.")

    qna(doc, "Why build this instead of just using WhatsApp/LinkedIn?",
        "WhatsApp has no profiles, no projects, no roles, and no discovery — you can't search "
        "“who knows React”. LinkedIn isn't university-scoped, has no project teams, and its "
        "connections don't map to actual collaboration. This platform ties PEOPLE → SKILLS → "
        "PROJECTS → EVENTS together, and everything is backed by a real database, not chat history.")

    qna(doc, "What technologies did you use and why?",
        "React 19 + Vite + Tailwind CSS for the frontend (component reuse, fast builds, a central "
        "design system with dark mode). Express.js + TypeScript for the backend (strict layered "
        "architecture — routes, controllers, services, repositories). PostgreSQL + Prisma for the "
        "database (typed queries, safe migrations). JWT + refresh tokens for auth. Server-Sent "
        "Events for real-time messaging.")

    qna(doc, "How is security handled?",
        "Passwords are bcrypt-hashed (never visible to anyone). Login issues a 15-minute access "
        "token + a 7-day refresh token in an httpOnly cookie (JavaScript can't touch it). Every "
        "sensitive action is authorized on the SERVER: only a project's owner can edit/delete it, "
        "only the recipient can accept a connection, messaging requires a connection, admin actions "
        "require verified admin privileges. Private data is filtered server-side — it never leaves "
        "the database for unauthorized viewers. There are automated regression tests proving the "
        "password hash never appears in any response.")

    qna(doc, "How does onboarding work?",
        "When a new user logs in, the platform checks a database marker (onboarding_completed_at). "
        "If it's empty, a 2-step wizard appears instead of the app: profile basics (adapting to the "
        "user's role) and skills — a searchable multi-select from a 137-skill taxonomy stored in the "
        "database. Everything persists server-side, so refreshing never re-asks. Users can skip and "
        "finish later.")

    qna(doc, "How do collaboration requests work?",
        "A user applies to a project with a pitch. The request is stored as pending in the database "
        "(duplicates blocked server-side). The owner reviews it from their dashboard and accepts or "
        "declines. Accepting creates a real team membership in a database transaction — the "
        "applicant instantly appears in the team everywhere, and a notification is sent. Declining "
        "records the status so the sender sees it — they can re-apply later. A full team does NOT "
        "block requests; the owner always decides.")

    qna(doc, "How is real-time messaging implemented?",
        "Server-Sent Events (SSE): when you open a chat, the browser subscribes to a one-way event "
        "stream for that conversation. The server pushes every new message the instant it arrives — "
        "under a second latency, no polling, no refresh. Sent messages appear optimistically "
        "immediately and are confirmed by the server with automatic de-duplication. Other content "
        "(projects, notifications) refreshes every 4 seconds while the app is open.")

    qna(doc, "What stops someone from spamming connection requests?",
        "A server-side rate limit: maximum 3 connection requests per week to the same person. Every "
        "request attempt is logged in a database history table — cancelling and re-sending counts "
        "toward the limit. The 4th attempt gets a 429 error with an explanatory message.")

    qna(doc, "How are roles and permissions handled in communities?",
        "Each community has a hierarchy: President (owner, rank 100) → Vice President (90) → "
        "Department Heads (80) → Members (10), with custom role titles. The rank is enforced on the "
        "backend: nobody can remove, edit, or demote someone at-or-above their own rank. The "
        "President can transfer the presidency, which steps them down to Vice President. The "
        "President cannot leave while owning the community.")

    qna(doc, "What can the admin do?",
        "A dedicated Admin Panel (only visible and accessible to verified admins): platform-wide "
        "metrics (users, projects, collaborations), user management, and content curation — "
        "notices, communities/clubs, events, and startups can be created and deleted. Official "
        "notices are persisted in the database and appear on the Council Notices page.")

    qna(doc, "How do users get profile pictures?",
        "They upload a photo in the Edit Profile form. The browser resizes it to a 256px square "
        "(canvas), converts it to base64 text (~20-50KB), and it's stored in the database with the "
        "other profile details. Type and size are validated, errors are handled gracefully, and the "
        "picture shows everywhere (navbar, profiles, cards).")

    qna(doc, "What's the difference between a connection and a project collaboration?",
        "Completely separate relationships. A connection is a professional link between two people "
        "(like LinkedIn). A collaboration is membership on a specific project's team. You can be "
        "connected with someone, collaborate on their project, share a community, and attend the "
        "same event — four different things. Neither one automatically creates the other.")

    qna(doc, "Is the app responsive?",
        "Yes — fluid grids at every breakpoint, a mobile messages layout (list/chat toggle with a "
        "back button), viewport-safe modals, a collapsible navbar, and dark mode included.")

    qna(doc, "Is it deployed? Where?",
        "Yes — free tiers: the website on Vercel, the API on Render, the database on Neon "
        "(always-on serverless Postgres). The refresh cookie uses SameSite=None; Secure in "
        "production so cross-site sessions work. Render's free tier sleeps after 15 minutes of "
        "inactivity — the first visit after sleep takes about 30-60 seconds to wake.")

    qna(doc, "How would you explain the architecture in one breath?",
        "Browser (React) → HTTP request with a JWT → Express route (authentication) → controller "
        "(validation) → service (business rules + authorization) → repository (Prisma) → "
        "PostgreSQL → response → the UI updates. The database is the single source of truth; "
        "nothing is faked in the browser.")

    qna(doc, "What was the hardest part?",
        "Making the real-time + persistence layers correct: optimistic updates vs server "
        "confirmation vs concurrent refreshes — solved with id-based de-duplication and server-"
        "authoritative state merges. And enforcing authorization consistently: every mutation "
        "(projects, connections, messaging, roles) is checked server-side against the database, "
        "never just the UI.")

    # ==================== LIMITATIONS ====================
    h1(doc, "9. Known limitations (be honest about these)")
    bullets(doc, [
        "Community announcements with photo/video attachments are not built yet (text notices are).",
        "Startup entries are admin-curated; admin EDIT of a startup (beyond delete) is not yet built.",
        "Startup “origin project” association is planned but not stored.",
        "WebSocket messaging is the documented future upgrade (SSE is one-directional).",
        "Render's free tier sleeps after inactivity (cold starts on first visit).",
        "The email-verification step logs the link instead of sending real email (login works without verifying).",
        "No automated E2E test suite in the repo — flows were verified manually with real browser automation.",
    ])

    # ==================== CHEAT SHEET ====================
    h1(doc, "10. One-page cheat sheet")
    bullets(doc, [
        ("Frontend", "React 19 + Vite + Tailwind v4 (apps/web)"),
        ("Backend", "Express + TypeScript + Prisma (apps/api) — port 4000"),
        ("Database", "PostgreSQL (Neon in production) — schema: apps/api/prisma/schema.prisma, 48 models"),
        ("Shared contract", "packages/shared-types (Zod schemas shared by both apps)"),
        ("Auth", "JWT access 15m + refresh 7d (httpOnly cookie) + bcrypt"),
        ("Real-time", "SSE for messages + 4s poll for the rest"),
        ("Run locally", "pnpm dev:api + pnpm dev → http://localhost:3000"),
        ("Deploy", "Vercel (web) + Render (api) + Neon (db) — see README"),
        ("Admin", "Admin Panel tab — needs requestedRole=admin + an approved verification row"),
        ("Demo login", "priya.sharma@seed.university.edu / Demo@1234"),
    ])

    doc.save("PROJECT_EXPLAINED.docx")
    print("Piece 5 added")

    print("Saved: PROJECT_EXPLAINED.docx")


if __name__ == "__main__":
    build()
