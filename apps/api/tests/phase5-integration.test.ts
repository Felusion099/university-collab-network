import "dotenv/config";
import { test, describe, before, after } from "node:test";
import assert from "node:assert/strict";
import type { Server } from "node:http";
import type { AddressInfo } from "node:net";
import { createApp } from "../src/app.js";
import { prisma } from "../src/repositories/prisma.js";
import { authService } from "../src/services/auth.service.js";

// Test bodies parse arbitrary JSON API responses and probe fields dynamically
// (including `in` presence checks for fields that must be absent under
// privacy rules) — a fixed interface per endpoint would be more precise but
// disproportionate for assertions that only ever read a handful of ad hoc
// fields. `unknown` cannot support that without a cast at every access site,
// so this single, narrowly-scoped alias opts back into a permissive shape
// rather than repeating an inline `any` at each of the ~13 call sites below.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type ApiJson = Record<string, any>;

/**
 * D-019/HANDOFF-20 regression helper: recursively walks an entire parsed
 * JSON response body (any depth — covers `members[].user`, `authors[].user`,
 * `participants[].user`, etc. without needing to know each endpoint's exact
 * nesting shape) and asserts none of the sensitive `users` columns D-019
 * fixed are present anywhere in it. `passwordHash`/`password_hash` is the
 * critical one (D-019's actual finding); `universityDomain` is included as
 * a secondary check since it was also pulled in by the same unfiltered
 * `include: { user: true }` pattern and has no legitimate reason to appear
 * in a third-party nested-user view either.
 */
function assertNoSensitiveUserFields(value: unknown, path = "$"): void {
  if (Array.isArray(value)) {
    value.forEach((item, i) => assertNoSensitiveUserFields(item, `${path}[${i}]`));
    return;
  }
  if (value && typeof value === "object") {
    for (const [key, val] of Object.entries(value as Record<string, unknown>)) {
      assert.notEqual(
        key,
        "passwordHash",
        `D-019 regression: passwordHash present at ${path}.${key}`,
      );
      assert.notEqual(
        key,
        "password_hash",
        `D-019 regression: password_hash present at ${path}.${key}`,
      );
      assert.notEqual(
        key,
        "universityDomain",
        `D-019 regression: universityDomain present at ${path}.${key} (SAFE_USER_SELECT excludes it)`,
      );
      assertNoSensitiveUserFields(val, `${path}.${key}`);
    }
  }
}

describe("Phase 5 - Complete API Endpoints Integration Test Suite", () => {
  let server: Server;
  let baseUrl: string;

  // Test identities
  let userAToken: string;
  let userAId: string;
  let userAUsername: string;

  let userBToken: string;
  let userBId: string;

  let adminToken: string;
  let adminId: string;

  before(async () => {
    process.env.JWT_ACCESS_SECRET = "dev-access-secret-change-me";
    process.env.JWT_REFRESH_SECRET = "dev-refresh-secret-change-me";
    process.env.JWT_ACCESS_TTL = "15m";
    process.env.JWT_REFRESH_TTL = "7d";
    process.env.UNIVERSITY_EMAIL_DOMAINS = "university.edu";

    const app = createApp();
    server = app.listen(0);
    const address = server.address() as AddressInfo;
    baseUrl = `http://127.0.0.1:${address.port}`;

    // Create User A (Student)
    const emailA = `alice_p5_${Date.now()}@university.edu`;
    const resA = await fetch(`${baseUrl}/api/v1/auth/signup`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: emailA,
        password: "Password123!",
        fullName: "Alice Student",
        requestedRole: "student",
      }),
    });
    const jsonA = (await resA.json()) as { userId: string };
    userAId = jsonA.userId;
    const vTokenA = authService.createEmailVerificationToken(userAId);
    await fetch(`${baseUrl}/api/v1/auth/verify-email`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token: vTokenA }),
    });
    const loginA = await fetch(`${baseUrl}/api/v1/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: emailA, password: "Password123!" }),
    });
    const loginAJson = (await loginA.json()) as { accessToken: string };
    userAToken = loginAJson.accessToken;
    const dbA = await prisma.user.findUniqueOrThrow({ where: { id: userAId } });
    userAUsername = dbA.username;

    // Set Alice's CGPA and Privacy Settings
    await prisma.studentProfile.update({
      where: { userId: userAId },
      data: {
        cgpa: 3.95,
        department: "Computer Science",
        linkedinUrl: "https://linkedin.com/in/alice",
      },
    });
    await prisma.privacySettings.update({
      where: { userId: userAId },
      data: {
        cgpaVisibility: "private",
        socialLinksVisibility: "connections_only",
        emailVisibility: "university_only",
      },
    });

    // Create User B (Student)
    const emailB = `bob_p5_${Date.now()}@university.edu`;
    const resB = await fetch(`${baseUrl}/api/v1/auth/signup`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: emailB,
        password: "Password123!",
        fullName: "Bob Student",
        requestedRole: "student",
      }),
    });
    const jsonB = (await resB.json()) as { userId: string };
    userBId = jsonB.userId;
    const vTokenB = authService.createEmailVerificationToken(userBId);
    await fetch(`${baseUrl}/api/v1/auth/verify-email`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token: vTokenB }),
    });
    const loginB = await fetch(`${baseUrl}/api/v1/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: emailB, password: "Password123!" }),
    });
    const loginBJson = (await loginB.json()) as { accessToken: string };
    userBToken = loginBJson.accessToken;
    // Create Admin User
    const adminEmail = `admin_p5_${Date.now()}@university.edu`;
    const resAdmin = await fetch(`${baseUrl}/api/v1/auth/signup`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: adminEmail,
        password: "AdminPassword123!",
        fullName: "Admin User",
        requestedRole: "student",
      }),
    });
    const adminJson = (await resAdmin.json()) as { userId: string };
    adminId = adminJson.userId;
    // Set admin role directly in DB
    await prisma.user.update({
      where: { id: adminId },
      data: { requestedRole: "admin", status: "active", isUniversityVerified: true },
    });

    await prisma.verification.create({
      data: {
        userId: adminId,
        roleClaimed: "admin",
        status: "approved",
      },
    });
    const loginAdmin = await fetch(`${baseUrl}/api/v1/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: adminEmail, password: "AdminPassword123!" }),
    });
    const loginAdminJson = (await loginAdmin.json()) as { accessToken: string };
    adminToken = loginAdminJson.accessToken;
  });

  after(async () => {
    await new Promise<void>((resolve, reject) => {
      server.close((err) => {
        if (err) {
          reject(err);
        } else {
          resolve();
        }
      });
    });
    // Self-cleaning: this suite creates fresh users per run (Date.now()
    // emails) and never removed them — accumulated rows eventually push the
    // pending-verification list past its limit=100 page and break the
    // admin-review assertions. Reverse-dependency order, is_seed=false only.
    const p5Users = await prisma.user.findMany({
      where: { email: { contains: "_p5_" } },
      select: { id: true },
    });
    const ids = p5Users.map((u) => u.id);
    if (ids.length > 0) {
      await prisma.verification.deleteMany({ where: { userId: { in: ids } } });
      await prisma.refreshToken.deleteMany({ where: { userId: { in: ids } } });
      await prisma.userResearchTopic.deleteMany({ where: { userId: { in: ids } } });
      await prisma.userSkill.deleteMany({ where: { userId: { in: ids } } });
      const p5Projects = await prisma.project.findMany({
        where: { createdBy: { in: ids } },
        select: { id: true },
      });
      const projectIds = p5Projects.map((p) => p.id);
      if (projectIds.length > 0) {
        await prisma.projectTopic.deleteMany({ where: { projectId: { in: projectIds } } });
        await prisma.projectSkillNeeded.deleteMany({ where: { projectId: { in: projectIds } } });
        await prisma.projectMember.deleteMany({ where: { projectId: { in: projectIds } } });
        await prisma.joinRequest.deleteMany({ where: { projectId: { in: projectIds } } });
        await prisma.project.deleteMany({ where: { id: { in: projectIds } } });
      }
      const p5Teams = await prisma.researchTeam.findMany({
        where: { piUserId: { in: ids } },
        select: { id: true },
      });
      const teamIds = p5Teams.map((t) => t.id);
      if (teamIds.length > 0) {
        await prisma.researchTeamTopic.deleteMany({ where: { researchTeamId: { in: teamIds } } });
        await prisma.researchTeam.deleteMany({ where: { id: { in: teamIds } } });
      }
      const p5Orgs = await prisma.organization.findMany({
        where: { createdBy: { in: ids } },
        select: { id: true },
      });
      const orgIds = p5Orgs.map((o) => o.id);
      if (orgIds.length > 0) {
        await prisma.membership.deleteMany({ where: { organizationId: { in: orgIds } } });
        await prisma.organization.deleteMany({ where: { id: { in: orgIds } } });
      }
      await prisma.connection.deleteMany({
        where: { OR: [{ requesterId: { in: ids } }, { addresseeId: { in: ids } }] },
      });
      await prisma.notificationPreferences.deleteMany({ where: { userId: { in: ids } } });
      await prisma.privacySettings.deleteMany({ where: { userId: { in: ids } } });
      await prisma.studentProfile.deleteMany({ where: { userId: { in: ids } } });
      await prisma.professorProfile.deleteMany({ where: { userId: { in: ids } } });
      await prisma.user.deleteMany({ where: { id: { in: ids } } });
    }
  });

  // ==========================================
  // 1. PROFILE & FIELD-LEVEL PRIVACY (D-004)
  // ==========================================
  describe("1. Profile & Field-Level Privacy Enforcement", () => {
    test("Public/Unauthenticated viewer: private and restricted fields are absent (not null)", async () => {
      const res = await fetch(`${baseUrl}/api/v1/users/${userAUsername}`);
      assert.equal(res.status, 200);
      const json = (await res.json()) as ApiJson;

      assert.equal(json.username, userAUsername);
      assert.equal(json.id, userAId);
      // email is university_only -> absent for public anonymous
      assert.equal("email" in json, false, "Email must be absent for public viewer");
      // cgpa is private -> absent
      if (json.studentProfile) {
        assert.equal("cgpa" in json.studentProfile, false, "CGPA must be absent");
        assert.equal("linkedinUrl" in json.studentProfile, false, "LinkedIn must be absent");
      }
    });

    test("University peer (User B, unconnected): email visible, cgpa & connections-only fields absent", async () => {
      const res = await fetch(`${baseUrl}/api/v1/users/${userAUsername}`, {
        headers: { Authorization: `Bearer ${userBToken}` },
      });
      assert.equal(res.status, 200);
      const json = (await res.json()) as ApiJson;

      assert.ok(json.email, "University peer must see university_only email");
      if (json.studentProfile) {
        assert.equal("cgpa" in json.studentProfile, false, "Private CGPA must be absent");
        assert.equal(
          "linkedinUrl" in json.studentProfile,
          false,
          "Connections-only link must be absent",
        );
      }
    });

    test("Profile Owner (User A): sees all their own fields including private CGPA", async () => {
      const res = await fetch(`${baseUrl}/api/v1/users/${userAUsername}`, {
        headers: { Authorization: `Bearer ${userAToken}` },
      });
      assert.equal(res.status, 200);
      const json = (await res.json()) as ApiJson;

      assert.ok(json.email);
      assert.ok(json.studentProfile);
      assert.equal(json.studentProfile.cgpa, 3.95, "Owner sees their own CGPA");
      assert.equal(json.studentProfile.linkedinUrl, "https://linkedin.com/in/alice");
    });

    test("PATCH /api/v1/users/me/profile and PATCH /api/v1/users/me/privacy update settings", async () => {
      const resProf = await fetch(`${baseUrl}/api/v1/users/me/profile`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${userAToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          fullName: "Alice S. Updated",
          studentProfile: { bio: "Updated robotics enthusiast" },
        }),
      });
      assert.equal(resProf.status, 200);

      const resPriv = await fetch(`${baseUrl}/api/v1/users/me/privacy`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${userAToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          profileVisibility: "public",
          cgpaVisibility: "public",
        }),
      });
      assert.equal(resPriv.status, 200);
      const privJson = (await resPriv.json()) as { cgpaVisibility: string };
      assert.equal(privJson.cgpaVisibility, "public");

      // Re-check unauthenticated read: CGPA is now visible because Alice set it to public
      const resAfter = await fetch(`${baseUrl}/api/v1/users/${userAUsername}`);
      const jsonAfter = (await resAfter.json()) as ApiJson;
      assert.equal(jsonAfter.studentProfile?.cgpa, 3.95);

      // Restore Alice privacy state for subsequent integration tests
      await prisma.privacySettings.update({
        where: { userId: userAId },
        data: {
          profileVisibility: "university_only",
          cgpaVisibility: "private",
          socialLinksVisibility: "connections_only",
          emailVisibility: "university_only",
        },
      });
    });
  });

  // ==========================================
  // 2. SKILLS & TOPICS
  // ==========================================
  let skillId: string;
  let topicId: string;
  let topicSlug: string;

  describe("2. Skills & Research Topics Taxonomy", () => {
    test("POST /api/v1/skills creates skill & POST /api/v1/users/me/skills assigns it", async () => {
      const skillName = `Skill_${Date.now()}`;
      const resSkill = await fetch(`${baseUrl}/api/v1/skills`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${userAToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ name: skillName, category: "Programming" }),
      });
      assert.equal(resSkill.status, 201);
      const skillJson = (await resSkill.json()) as { id: string; name: string };
      skillId = skillJson.id;
      assert.equal(skillJson.name, skillName);

      // User A assigns skill to self
      const resAssign = await fetch(`${baseUrl}/api/v1/users/me/skills`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${userAToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ skillId, proficiency: "expert" }),
      });
      assert.equal(resAssign.status, 201);

      // List skills
      const resList = await fetch(`${baseUrl}/api/v1/skills`);
      assert.equal(resList.status, 200);
      const listJson = (await resList.json()) as { data: ApiJson[] };
      assert.ok(listJson.data.length > 0);
    });

    test("Admin POST /api/v1/research-topics creates topic; GET /research-topics/:slug returns all 10 nested fields", async () => {
      const topicName = `Autonomous AI Systems ${Date.now()}`;
      const resTopic = await fetch(`${baseUrl}/api/v1/research-topics`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${adminToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: topicName,
          description: "Research into autonomous navigation and AI systems.",
        }),
      });
      assert.equal(resTopic.status, 201);
      const topicJson = (await resTopic.json()) as { id: string; slug: string; name: string };
      topicId = topicJson.id;
      topicSlug = topicJson.slug;

      // Link User A to this topic
      await prisma.userResearchTopic.create({
        data: { userId: userAId, researchTopicId: topicId },
      });

      // GET /research-topics/:slug
      const resDetail = await fetch(`${baseUrl}/api/v1/research-topics/${topicSlug}`);
      assert.equal(resDetail.status, 200);
      const detail = (await resDetail.json()) as ApiJson;

      assert.equal(detail.slug, topicSlug);
      // Verify all 10 required nested arrays from API_CONTRACT.md §3
      assert.ok(Array.isArray(detail.researchers), "must contain researchers");
      assert.ok(Array.isArray(detail.professors), "must contain professors");
      assert.ok(Array.isArray(detail.students), "must contain students");
      assert.ok(Array.isArray(detail.teams), "must contain teams");
      assert.ok(Array.isArray(detail.projects), "must contain projects");
      assert.ok(Array.isArray(detail.publications), "must contain publications");
      assert.ok(Array.isArray(detail.relatedTopics), "must contain relatedTopics");
      assert.ok(Array.isArray(detail.openProblems), "must contain openProblems");
      assert.ok(Array.isArray(detail.opportunities), "must contain opportunities");
      assert.ok(Array.isArray(detail.events), "must contain events");

      // Verify Alice is in the students array
      assert.ok(detail.students.some((s: { id: string }) => s.id === userAId));

      // D-019 regression: this endpoint is public/unauthenticated and
      // previously embedded every interested user's full raw role-profile
      // (cgpa included, default-private) unfiltered — must never leak cgpa
      // to this anonymous caller now, nor password_hash on any nested user.
      const alice = detail.students.find((s: { id: string }) => s.id === userAId);
      console.log("D019 ALICE RESPONSE:", JSON.stringify(alice, null, 2));
      if (alice?.profile) {
        assert.equal(
          "cgpa" in alice.profile,
          false,
          "D-019 regression: cgpa leaked to anonymous caller",
        );
      }
      assertNoSensitiveUserFields(detail);
    });
  });

  // ==========================================
  // 3. PROJECTS & MATCHING
  // ==========================================
  let projectId: string;

  describe("3. Projects CRUD, Lifecycle & Explainable Matching", () => {
    test("POST /api/v1/projects creates project with skills and topics needed", async () => {
      const res = await fetch(`${baseUrl}/api/v1/projects`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${userAToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: "Deep Learning Rover",
          description: "Autonomous rover built with ML navigation.",
          problemStatement: "Campus package delivery is inefficient.",
          solutionDescription: "Self-navigating micro-rover.",
          status: "development",
          skillsNeeded: [{ skillId, roleNeeded: "ml" }],
          topicIds: [topicId],
        }),
      });

      assert.equal(res.status, 201);
      const json = (await res.json()) as { id: string; name: string };
      projectId = json.id;
      assert.equal(json.name, "Deep Learning Rover");
    });

    test("POST /api/v1/projects/:id/join allows User B to join project", async () => {
      const res = await fetch(`${baseUrl}/api/v1/projects/${projectId}/join`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${userBToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ roleOnProject: "Frontend Developer" }),
      });
      assert.equal(res.status, 201);
    });

    test("D-019 regression: GET /api/v1/projects/:id embeds creator & members but never leaks password_hash", async () => {
      const res = await fetch(`${baseUrl}/api/v1/projects/${projectId}`, {
        headers: { Authorization: `Bearer ${userAToken}` },
      });
      assert.equal(res.status, 200);
      const json = (await res.json()) as ApiJson;

      assert.ok(
        json.creator,
        "creator must still be present (only sensitive fields were stripped)",
      );
      assert.ok(json.creator.username, "creator.username must survive the SAFE_USER_SELECT fix");
      assert.ok(
        Array.isArray(json.members) && json.members.length >= 2,
        "must include both members",
      );
      assertNoSensitiveUserFields(json);
    });

    test("GET /api/v1/projects/:id/matches returns explainable matching score and criteria", async () => {
      const res = await fetch(`${baseUrl}/api/v1/projects/${projectId}/matches`, {
        headers: { Authorization: `Bearer ${userAToken}` },
      });
      assert.equal(res.status, 200);
      const json = (await res.json()) as { data: ApiJson[] };

      assert.ok(Array.isArray(json.data));
      for (const item of json.data) {
        assert.ok(item.userId);
        assert.equal(typeof item.matchScore, "number");
        assert.ok(Array.isArray(item.matchedCriteria), "matchedCriteria must be an array");
        assert.ok(Array.isArray(item.unmatchedCriteria), "unmatchedCriteria must be an array");
      }
    });

    test("PATCH /api/v1/projects/:id updates project & DELETE archives it (soft-delete D-013)", async () => {
      const resUpdate = await fetch(`${baseUrl}/api/v1/projects/${projectId}`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${userAToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ description: "Updated rover description" }),
      });
      assert.equal(resUpdate.status, 200);

      const resDelete = await fetch(`${baseUrl}/api/v1/projects/${projectId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${userAToken}` },
      });
      assert.equal(resDelete.status, 204);

      // Hard delete per the current spec (PHASE 4.4): the database row is
      // actually REMOVED (dependents cascade) — not archived/hidden.
      const dbProject = await prisma.project.findUnique({ where: { id: projectId } });
      assert.equal(
        dbProject,
        null,
        "DELETE must remove the project row from the database (hard delete)",
      );
    });
  });

  // ==========================================
  // 4. ORGANIZATIONS & RESEARCH TEAMS
  // ==========================================
  let orgId: string;
  let orgSlug: string;
  let researchTeamId: string;

  describe("4. Organizations (Clubs/Startups) & Research Teams", () => {
    test("POST /api/v1/organizations creates club and startup", async () => {
      const resClub = await fetch(`${baseUrl}/api/v1/organizations`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${userAToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          type: "club",
          name: `Robotics Society ${Date.now()}`,
          description: "Student robotics community",
          category: "Technology",
        }),
      });
      assert.equal(resClub.status, 201);
      const clubJson = (await resClub.json()) as { id: string; slug: string };
      orgId = clubJson.id;
      orgSlug = clubJson.slug;

      // User B joins organization
      const resJoin = await fetch(`${baseUrl}/api/v1/organizations/${orgId}/join`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${userBToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ role: "member" }),
      });
      assert.equal(resJoin.status, 201);
    });

    test("D-019 regression: GET /api/v1/organizations/:slug embeds memberships but never leaks password_hash", async () => {
      const res = await fetch(`${baseUrl}/api/v1/organizations/${orgSlug}`);
      assert.equal(res.status, 200);
      const json = (await res.json()) as ApiJson;

      assert.ok(
        Array.isArray(json.memberships) && json.memberships.length >= 2,
        "must include both members' memberships",
      );
      assertNoSensitiveUserFields(json);
    });

    test("POST /api/v1/research-teams creates team and supports memberships", async () => {
      const resTeam = await fetch(`${baseUrl}/api/v1/research-teams`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${userAToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: `Autonomous Lab Team ${Date.now()}`,
          description: "AI Navigation Lab",
          topicIds: [topicId],
        }),
      });
      assert.equal(resTeam.status, 201);
      const teamJson = (await resTeam.json()) as { id: string };
      assert.ok(teamJson.id, "created research team must have an id");
      researchTeamId = teamJson.id;
    });

    test("D-019 regression: GET /api/v1/research-teams/:id embeds pi but never leaks password_hash", async () => {
      const res = await fetch(`${baseUrl}/api/v1/research-teams/${researchTeamId}`);
      assert.equal(res.status, 200);
      const json = (await res.json()) as ApiJson;

      assert.ok(json.pi, "pi must still be present (only sensitive fields were stripped)");
      assert.ok(json.pi.username, "pi.username must survive the SAFE_USER_SELECT fix");
      assertNoSensitiveUserFields(json);
    });
  });

  // ==========================================
  // 5. PUBLICATIONS, EVENTS & OPPORTUNITIES
  // ==========================================
  let publicationId: string;
  let eventId: string;
  let opportunityId: string;

  describe("5. Publications, Events & Opportunities Lifecycle", () => {
    test("Publications: create, read, update, delete", async () => {
      const res = await fetch(`${baseUrl}/api/v1/publications`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${userAToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: "Neural Pathfinding in Autonomous Rovers",
          abstract:
            "We present a robust deep reinforcement learning model for local path planning.",
          journalOrConference: "IEEE ICRA 2026",
          topicIds: [topicId],
          authorIds: [userAId],
        }),
      });
      assert.equal(res.status, 201);
      const pubJson = (await res.json()) as { id: string };
      publicationId = pubJson.id;

      const resGet = await fetch(`${baseUrl}/api/v1/publications/${publicationId}`);
      assert.equal(resGet.status, 200);
      const pubDetail = (await resGet.json()) as ApiJson;
      assert.ok(
        Array.isArray(pubDetail.authors) && pubDetail.authors.length >= 1,
        "must include author",
      );
      assertNoSensitiveUserFields(pubDetail);

      const resPatch = await fetch(`${baseUrl}/api/v1/publications/${publicationId}`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${userAToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ title: "Updated Neural Pathfinding" }),
      });
      assert.equal(resPatch.status, 200);
    });

    test("Events: create, register, read, delete", async () => {
      const res = await fetch(`${baseUrl}/api/v1/events`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${userAToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: "Annual Hackathon 2026",
          description: "48-hour collaborative robotics build.",
          eventType: "hackathon",
          date: new Date(Date.now() + 86400000).toISOString().slice(0, 10),
          venue: "Main Campus Auditorium",
          organizerOrganizationId: orgId,
        }),
      });
      assert.equal(res.status, 201);
      const eventJson = (await res.json()) as { id: string };
      eventId = eventJson.id;

      // User B registers for event
      const resReg = await fetch(`${baseUrl}/api/v1/events/${eventId}/register`, {
        method: "POST",
        headers: { Authorization: `Bearer ${userBToken}` },
      });
      assert.equal(resReg.status, 201);

      // D-019 regression: GET /events/:id embeds participants but never leaks password_hash
      const resGetEvent = await fetch(`${baseUrl}/api/v1/events/${eventId}`);
      assert.equal(resGetEvent.status, 200);
      const eventDetail = (await resGetEvent.json()) as ApiJson;
      assert.ok(
        Array.isArray(eventDetail.participants) && eventDetail.participants.length >= 1,
        "must include registered participant",
      );
      assertNoSensitiveUserFields(eventDetail);
    });

    test("Opportunities: create, apply, review application", async () => {
      const res = await fetch(`${baseUrl}/api/v1/opportunities`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${userAToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: "Graduate Research Assistant in Robotics",
          description: "Work on sensor fusion and ROS2 navigation stack.",
          opportunityType: "research",
          departmentTag: "Computer Science",
          deadline: new Date(Date.now() + 86400000 * 30).toISOString().slice(0, 10),
          providedByOrganizationId: orgId,
          researchTopicId: topicId,
        }),
      });
      assert.equal(res.status, 201);
      const oppJson = (await res.json()) as { id: string };
      opportunityId = oppJson.id;

      // User B applies
      const resApply = await fetch(`${baseUrl}/api/v1/opportunities/${opportunityId}/apply`, {
        method: "POST",
        headers: { Authorization: `Bearer ${userBToken}` },
      });
      assert.equal(resApply.status, 201);
      const appJson = (await resApply.json()) as { id: string; status: string };
      assert.equal(appJson.status, "submitted");

      // User A reviews and accepts application
      const resReview = await fetch(
        `${baseUrl}/api/v1/opportunities/${opportunityId}/applications/${appJson.id}`,
        {
          method: "PATCH",
          headers: {
            Authorization: `Bearer ${userAToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ status: "accepted" }),
        },
      );
      assert.equal(resReview.status, 200);
      const reviewedJson = (await resReview.json()) as { status: string };
      assert.equal(reviewedJson.status, "accepted");
    });
  });

  // ==========================================
  // 6. CONNECTIONS, MESSAGING & NOTIFICATIONS
  // ==========================================
  let connectionId: string;
  let conversationId: string;

  describe("6. Networking, Real-time Notification Side Effects & Messaging", () => {
    test("POST /api/v1/connections creates connection & triggers notification", async () => {
      const res = await fetch(`${baseUrl}/api/v1/connections`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${userAToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          addresseeId: userBId,
          message: "Would love to collaborate on the robotics project!",
        }),
      });
      assert.equal(res.status, 201);
      const connJson = (await res.json()) as { id: string; status: string };
      connectionId = connJson.id;
      assert.equal(connJson.status, "pending");

      // Verify User B received a connection_request notification
      const resNotifB = await fetch(`${baseUrl}/api/v1/notifications`, {
        headers: { Authorization: `Bearer ${userBToken}` },
      });
      assert.equal(resNotifB.status, 200);
      const notifB = (await resNotifB.json()) as { data: ApiJson[] };
      const reqNotif = notifB.data.find((n) => n.type === "connection_request");
      assert.ok(reqNotif, "User B must have received connection_request notification");

      // User B accepts connection
      const resAccept = await fetch(`${baseUrl}/api/v1/connections/${connectionId}`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${userBToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status: "accepted" }),
      });
      assert.equal(resAccept.status, 200);
      const acceptJson = (await resAccept.json()) as ApiJson;
      assert.ok(
        acceptJson.requester?.username,
        "requester must still be present after the SAFE_USER_SELECT fix",
      );
      assert.ok(
        acceptJson.addressee?.username,
        "addressee must still be present after the SAFE_USER_SELECT fix",
      );
      assertNoSensitiveUserFields(acceptJson);

      // Verify User A received an acceptance notification
      const resNotifA = await fetch(`${baseUrl}/api/v1/notifications`, {
        headers: { Authorization: `Bearer ${userAToken}` },
      });
      assert.equal(resNotifA.status, 200);
      const notifA = (await resNotifA.json()) as { data: ApiJson[] };
      assert.ok(notifA.data.length > 0);

      // Mark notification as read
      const notifId = notifA.data[0]!.id;
      const resRead = await fetch(`${baseUrl}/api/v1/notifications/${notifId}/read`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${userAToken}` },
      });
      assert.equal(resRead.status, 200);
    });

    test("Conversations & Messages: send message triggers recipient notification", async () => {
      const resConv = await fetch(`${baseUrl}/api/v1/conversations`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${userAToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          type: "direct",
          participantIds: [userBId],
        }),
      });
      assert.equal(resConv.status, 201);
      const convJson = (await resConv.json()) as ApiJson;
      conversationId = convJson.id;
      assertNoSensitiveUserFields(convJson);

      // User A sends message
      const resMsg = await fetch(`${baseUrl}/api/v1/conversations/${conversationId}/messages`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${userAToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          body: "Hello Bob! Let's schedule a team sync tomorrow.",
        }),
      });
      assert.equal(resMsg.status, 201);
      const msgCreateJson = (await resMsg.json()) as ApiJson;
      assertNoSensitiveUserFields(msgCreateJson);

      // User B fetches messages
      const resGetMsgs = await fetch(`${baseUrl}/api/v1/conversations/${conversationId}/messages`, {
        headers: { Authorization: `Bearer ${userBToken}` },
      });
      assert.equal(resGetMsgs.status, 200);
      const msgsJson = (await resGetMsgs.json()) as { data: ApiJson[] };
      assert.ok(msgsJson.data.length > 0);
      assert.equal(msgsJson.data[0]!.body, "Hello Bob! Let's schedule a team sync tomorrow.");
      assert.ok(
        msgsJson.data[0]!.sender?.username,
        "sender must still be present after the SAFE_USER_SELECT fix",
      );
      assertNoSensitiveUserFields(msgsJson);
    });
  });

  // ==========================================
  // 7. SEARCH & DISCOVER
  // ==========================================
  describe("7. Search & Discover", () => {
    test("GET /api/v1/search categorized search results per D-014", async () => {
      const res = await fetch(`${baseUrl}/api/v1/search?q=Robotics`, {
        headers: { Authorization: `Bearer ${userAToken}` },
      });
      assert.equal(res.status, 200);
      const json = (await res.json()) as ApiJson;

      assert.ok(json.people !== undefined, "Search must return categorized people");
      assert.ok(json.projects !== undefined, "Search must return categorized projects");
      assert.ok(json.research !== undefined, "Search must return categorized research");
      assert.ok(json.clubs !== undefined, "Search must return categorized clubs per D-014");
    });

    test("GET /api/v1/discover returns explainable recommendations", async () => {
      const res = await fetch(`${baseUrl}/api/v1/discover`, {
        headers: { Authorization: `Bearer ${userAToken}` },
      });
      assert.equal(res.status, 200);
      const json = (await res.json()) as ApiJson;

      assert.ok(json.people);
      assert.ok(json.projects);
      assert.ok(json.research);
    });
  });

  // ==========================================
  // 8. ADMIN DASHBOARD & VERIFICATION / METRICS
  // ==========================================
  describe("8. Admin Panel, Verification & Real Collaboration Metrics", () => {
    test("Non-admin user gets 403 on admin routes", async () => {
      const res = await fetch(`${baseUrl}/api/v1/admin/metrics`, {
        headers: { Authorization: `Bearer ${userAToken}` },
      });
      assert.equal(res.status, 403);
    });

    test("Admin gets aggregate platform metrics (users, collaborations formed)", async () => {
      const res = await fetch(`${baseUrl}/api/v1/admin/metrics`, {
        headers: { Authorization: `Bearer ${adminToken}` },
      });
      assert.equal(res.status, 200);
      const metrics = (await res.json()) as Record<string, number>;

      assert.ok(typeof metrics.totalUsers === "number");
      assert.ok(typeof metrics.totalProjects === "number");
      assert.ok(typeof metrics.collaborationsFormed === "number");
      assert.ok(metrics.totalUsers >= 3);
    });

    test("Admin reviews verification requests and moderation reports", async () => {
      // Create a pending verification for User A claiming researcher role
      const verification = await prisma.verification.create({
        data: {
          userId: userAId,
          roleClaimed: "researcher",
          status: "pending",
        },
      });

      const resList = await fetch(
        `${baseUrl}/api/v1/admin/verifications?status=pending&limit=100`,
        {
          headers: { Authorization: `Bearer ${adminToken}` },
        },
      );
      assert.equal(resList.status, 200);
      const verificationsJson = (await resList.json()) as { data: ApiJson[] };
      const pendingEntry = verificationsJson.data.find((v) => v.id === verification.id);
      assert.ok(
        pendingEntry?.user?.username,
        "verification.user must still be present after the SAFE_USER_SELECT_ADMIN fix",
      );
      assert.ok(
        "email" in (pendingEntry?.user ?? {}),
        "SAFE_USER_SELECT_ADMIN intentionally includes email for admin review",
      );
      assertNoSensitiveUserFields(verificationsJson);

      // Admin approves verification
      const resApprove = await fetch(`${baseUrl}/api/v1/admin/verifications/${verification.id}`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${adminToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status: "approved" }),
      });
      assert.equal(resApprove.status, 200);

      // Create a report
      const report = await prisma.report.create({
        data: {
          reporterId: userAId,
          targetType: "user",
          targetId: userBId,
          reason: "spam",
          description: "Sending repeated spam messages.",
          status: "open",
        },
      });

      // Admin acts on report per D-007
      const resAct = await fetch(`${baseUrl}/api/v1/admin/reports/${report.id}`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${adminToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          status: "resolved",
          action: "restrict",
        }),
      });
      assert.equal(resAct.status, 200);
      const reportJson = (await resAct.json()) as { status: string; action: string };

      // D-019 regression: GET /admin/reports embeds reporter (SAFE_USER_SELECT_ADMIN)
      // limit=100: the shared dev DB accumulates reports across runs —
      // the default page (20) can slice this test's report off, which is
      // a test-data artifact, not a regression.
      const resReportsList = await fetch(`${baseUrl}/api/v1/admin/reports?limit=100`, {
        headers: { Authorization: `Bearer ${adminToken}` },
      });
      assert.equal(resReportsList.status, 200);
      const reportsListJson = (await resReportsList.json()) as { data: ApiJson[] };
      const reportEntry = reportsListJson.data.find((r) => r.id === report.id);
      assert.ok(
        reportEntry?.reporter?.username,
        "report.reporter must still be present after the SAFE_USER_SELECT_ADMIN fix",
      );
      assertNoSensitiveUserFields(reportsListJson);
      assert.equal(reportJson.status, "resolved");
      assert.equal(reportJson.action, "restrict");
    });
  });
});
