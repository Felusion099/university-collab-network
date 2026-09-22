/**
 * apps/api/prisma/seed.ts
 *
 * Generates interconnected demo data per ARCHITECTURE.md §8: "a student who
 * belongs to a club, contributes to a project, follows a topic, and is
 * connected to a researcher — not independent rows." All rows are tagged
 * is_seed = true.
 *
 * NOT YET EXECUTED VIA `pnpm prisma:seed` in this environment — Prisma
 * Client needs the same query-engine binary that `binaries.prisma.sh` being
 * outside this agent's allowed egress domains blocked for the whole Prisma
 * CLI toolchain this session (see AGENT_HANDOFF.md "Phase 2" for the full
 * story). An equivalent dataset — identical rows, identical relationships —
 * was inserted directly via raw SQL and verified end-to-end (spot-check
 * query in AGENT_HANDOFF.md) so the *data model* is proven to work even
 * though this exact script has not itself been run. The next agent with
 * binary access should run `pnpm prisma:seed` and confirm it produces the
 * same shape, then this comment can be deleted.
 *
 * Password hashes below are an obvious, clearly-labeled placeholder — NOT
 * real bcrypt hashes. `bcrypt` is a Phase 4 dependency (see DEPENDENCIES.md)
 * and Phase 2 does not add dependencies out of turn. Phase 4 should either
 * special-case is_seed=true users or re-seed with real hashes once auth
 * exists.
 *
 * Idempotent: deletes rows this script owns (by is_seed=true, in
 * reverse-dependency order) before recreating them, so `pnpm prisma:seed`
 * is safe to re-run.
 */

import "dotenv/config";
import bcrypt from "bcrypt";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

/** Known demo credentials for seed users — hashed for real at seed time so
 * `POST /auth/login` works out of the box in the combined project. */
export const DEMO_PASSWORD = "Demo@1234";
const DEMO_PASSWORD_HASH = bcrypt.hashSync(DEMO_PASSWORD, 10);

async function clearExistingSeedData() {
  // Reverse dependency order. Most of this cascades from users/topics/etc.
  // being deleted, but being explicit keeps this safe if the graph grows.

  // Clean up NON-seed artifacts created BY seed users (test projects,
  // organizations, teams created while testing) — they RESTRICT the
  // seed-user deletion via projects_created_by / organizations_created_by.
  const seedUserIds = (await prisma.user.findMany({ where: { isSeed: true }, select: { id: true } })).map((u) => u.id);
  if (seedUserIds.length > 0) {
    await prisma.projectTopic.deleteMany({ where: { project: { createdBy: { in: seedUserIds } } } });
    await prisma.projectSkillNeeded.deleteMany({ where: { project: { createdBy: { in: seedUserIds } } } });
    await prisma.projectMember.deleteMany({ where: { project: { createdBy: { in: seedUserIds } } } });
    await prisma.joinRequest.deleteMany({ where: { project: { createdBy: { in: seedUserIds } } } });
    await prisma.project.deleteMany({ where: { createdBy: { in: seedUserIds } } });
    await prisma.membership.deleteMany({ where: { organization: { createdBy: { in: seedUserIds } } } });
    await prisma.organization.deleteMany({ where: { createdBy: { in: seedUserIds } } });
    await prisma.researchTeamTopic.deleteMany({ where: { researchTeam: { piUserId: { in: seedUserIds } } } });
    await prisma.researchTeam.deleteMany({ where: { piUserId: { in: seedUserIds } } });
    await prisma.connectionRequestHistory.deleteMany({
      where: { OR: [{ requesterId: { in: seedUserIds } }, { addresseeId: { in: seedUserIds } }] },
    });
    await prisma.joinRequest.deleteMany({ where: { userId: { in: seedUserIds } } });
  }
  await prisma.userResearchTopic.deleteMany({ where: { isSeed: true } });
  await prisma.projectTopic.deleteMany({ where: { isSeed: true } });
  await prisma.projectMember.deleteMany({ where: { isSeed: true } });
  await prisma.connection.deleteMany({ where: { isSeed: true } });
  await prisma.researchTeamTopic.deleteMany({ where: { isSeed: true } });
  await prisma.membership.deleteMany({ where: { isSeed: true } });
  await prisma.project.deleteMany({ where: { isSeed: true } });
  await prisma.researchTeam.deleteMany({ where: { isSeed: true } });
  await prisma.organization.deleteMany({ where: { isSeed: true } });
  await prisma.researchTopic.deleteMany({ where: { isSeed: true } });
  await prisma.notificationPreferences.deleteMany({ where: { isSeed: true } });
  await prisma.privacySettings.deleteMany({ where: { isSeed: true } });
  await prisma.studentProfile.deleteMany({ where: { isSeed: true } });
  await prisma.professorProfile.deleteMany({ where: { isSeed: true } });
  await prisma.researcherProfile.deleteMany({ where: { isSeed: true } });
  await prisma.user.deleteMany({ where: { isSeed: true } });
}

async function main() {
  await clearExistingSeedData();

  const student = await prisma.user.create({
    data: {
      email: "priya.sharma@seed.university.edu",
      username: "priya.sharma",
      passwordHash: DEMO_PASSWORD_HASH,
      requestedRole: "student",
      status: "active",
      isUniversityVerified: true,
      isSeed: true,
      studentProfile: {
        create: {
          fullName: "Priya Sharma",
          department: "Computer Science",
          course: "B.Tech",
          year: 3,
          university: "Seed University",
          bio: "Third-year CS student interested in robotics and autonomous systems.",
          lookingFor: ["teammates", "research"],
          isSeed: true,
        },
      },
      privacySettings: { create: { isSeed: true } },
      notificationPreferences: { create: { isSeed: true } },
    },
  });

  const professor = await prisma.user.create({
    data: {
      email: "vikram.singh@seed.university.edu",
      username: "vikram.singh",
      passwordHash: DEMO_PASSWORD_HASH,
      requestedRole: "professor",
      status: "active",
      isUniversityVerified: true,
      isSeed: true,
      professorProfile: {
        create: {
          fullName: "Dr. Vikram Singh",
          department: "Computer Science",
          designation: "Associate Professor",
          expertise: ["Robotics", "Machine Learning"],
          bio: "Leads the Robotics & AI Lab; faculty advisor to the Robotics Club.",
          mentorshipAvailable: true,
          isSeed: true,
        },
      },
      privacySettings: { create: { isSeed: true } },
      notificationPreferences: { create: { isSeed: true } },
    },
  });

  const researcher = await prisma.user.create({
    data: {
      email: "ananya.rao@seed.university.edu",
      username: "ananya.rao",
      passwordHash: DEMO_PASSWORD_HASH,
      requestedRole: "researcher",
      status: "active",
      isUniversityVerified: true,
      isSeed: true,
      researcherProfile: {
        create: {
          fullName: "Dr. Ananya Rao",
          researcherType: "postdoc",
          department: "Computer Science",
          bio: "Postdoctoral researcher working on autonomous navigation.",
          currentAvailability: true,
          isSeed: true,
        },
      },
      privacySettings: { create: { isSeed: true } },
      notificationPreferences: { create: { isSeed: true } },
    },
  });

  const topic = await prisma.researchTopic.create({
    data: {
      name: "Autonomous Robotics",
      slug: "autonomous-robotics",
      description: "Self-directed robotic systems: navigation, perception, and control.",
      isSeed: true,
    },
  });

  const club = await prisma.organization.create({
    data: {
      type: "club",
      name: "Robotics Club",
      slug: "robotics-club",
      description: "Student-run club building robots and competing in campus hackathons.",
      facultyAdvisorId: professor.id,
      createdBy: student.id,
      isSeed: true,
    },
  });

  const researchTeam = await prisma.researchTeam.create({
    data: {
      name: "Robotics & AI Lab",
      description: "Dr. Singh's research group working on autonomous systems.",
      piUserId: professor.id,
      createdBy: professor.id,
      isSeed: true,
    },
  });

  const project = await prisma.project.create({
    data: {
      name: "Autonomous Campus Delivery Bot",
      problemStatement: "Manual campus deliveries are slow and inconsistent.",
      solutionDescription:
        "A small autonomous robot that navigates campus paths to deliver packages.",
      status: "development",
      createdBy: student.id,
      isSeed: true,
    },
  });

  // "belongs to a club"
  await prisma.membership.create({
    data: {
      userId: student.id,
      organizationId: club.id,
      role: "leader",
      isSeed: true,
    },
  });

  // researcher on the research team (gives the team a real member beyond its PI)
  await prisma.membership.create({
    data: {
      userId: researcher.id,
      researchTeamId: researchTeam.id,
      role: "member",
      isSeed: true,
    },
  });

  await prisma.researchTeamTopic.create({
    data: { researchTeamId: researchTeam.id, researchTopicId: topic.id, isSeed: true },
  });

  // "contributes to a project"
  await prisma.projectMember.create({
    data: {
      projectId: project.id,
      userId: student.id,
      roleOnProject: "Lead Developer",
      isSeed: true,
    },
  });

  await prisma.projectTopic.create({
    data: { projectId: project.id, researchTopicId: topic.id, isSeed: true },
  });

  // "follows a topic" — see DECISIONS.md D-009 for why this table exists
  await prisma.userResearchTopic.create({
    data: { userId: student.id, researchTopicId: topic.id, isSeed: true },
  });

  // "is connected to a researcher"
  await prisma.connection.create({
    data: {
      requesterId: student.id,
      addresseeId: researcher.id,
      status: "accepted",
      message:
        "Hi Dr. Rao, I'd love to connect and learn more about your work on autonomous navigation!",
      isSeed: true,
    },
  });

  // ============================================================
  // Skills taxonomy — the maintainable, database-backed skill list the
  // whole platform selects from (onboarding, profiles, services, projects).
  // Structured categories; idempotent upsert by unique name; junk rows
  // (Skill_<timestamp> leftovers from failed test validations) removed.
  // ============================================================
  const SKILL_TAXONOMY: Record<string, string[]> = {
    "Technology & Software": [
      "C", "C++", "C#", "Java", "Python", "JavaScript", "TypeScript", "Go", "Rust", "PHP",
      "Kotlin", "Swift", "HTML", "CSS", "React", "Next.js", "Node.js", "Express.js",
      "Django", "Flask", "Spring Boot", ".NET", "REST APIs", "GraphQL", "Git", "GitHub",
      "Docker", "Linux", "SQL", "PostgreSQL", "MySQL", "MongoDB", "Firebase", "Supabase",
    ],
    "AI & Data": [
      "Artificial Intelligence", "Machine Learning", "Deep Learning", "Generative AI",
      "Natural Language Processing", "Computer Vision", "Data Science", "Data Analysis",
      "Statistics", "TensorFlow", "PyTorch", "OpenCV", "LLMs", "Prompt Engineering",
    ],
    "Electronics & Hardware": [
      "Embedded Systems", "Arduino", "ESP32", "ESP8266", "Raspberry Pi", "STM32",
      "PCB Design", "Circuit Design", "Electronics", "IoT", "Robotics", "Sensors",
      "Microcontrollers", "VLSI", "Verilog", "VHDL", "FPGA", "MATLAB", "Simulink",
      "3D Printing", "CAD",
    ],
    "Design": [
      "UI Design", "UX Design", "Graphic Design", "Figma", "Adobe Photoshop",
      "Adobe Illustrator", "Canva", "Branding", "Logo Design", "Presentation Design",
      "Design Systems", "Motion Design", "3D Design", "Blender", "CAD Design",
    ],
    "Content & Media": [
      "Video Editing", "Photography", "Videography", "Photo Editing", "Animation",
      "Motion Graphics", "Content Writing", "Copywriting", "Script Writing", "Blogging",
      "Social Media", "SEO", "Voice Over", "Podcasting",
    ],
    "Business & Professional": [
      "Entrepreneurship", "Business Strategy", "Marketing", "Digital Marketing", "Sales",
      "Market Research", "Financial Analysis", "Project Management", "Product Management",
      "Public Relations", "Event Management", "Communication", "Leadership",
      "Presentation", "Public Speaking",
    ],
    "Academic": [
      "Mathematics", "Physics", "Chemistry", "Biology", "Economics", "Research",
      "Academic Writing", "Technical Writing", "Literature Review", "Tutoring", "Mentoring",
    ],
    "Other": [
      "Fashion", "Styling", "Music", "Singing", "Instrumental Music", "Dance", "Sports",
      "Fitness", "Event Photography", "Event Planning", "Translation", "Languages",
      "Community Building",
    ],
  };

  // Remove junk skills (Skill_<timestamp> leftovers) and stale test-created rows
  await prisma.skill.deleteMany({ where: { name: { startsWith: "Skill_" } } });

  let skillCount = 0;
  for (const [category, names] of Object.entries(SKILL_TAXONOMY)) {
    for (const name of names) {
      await prisma.skill.upsert({
        where: { name },
        update: { category, isSeed: true },
        create: { name, category, isSeed: true },
      });
      skillCount++;
    }
  }

  console.log("Seed complete:", {
    student: student.email,
    professor: professor.email,
    researcher: researcher.email,
    topic: topic.slug,
    club: club.slug,
    project: project.name,
    skills: skillCount,
  });
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
