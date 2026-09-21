import { prisma } from "../repositories/prisma.js";

/**
 * Personalized, query-less recommendation feed per API_CONTRACT.md �8 �
 * "same shape as �4 search response... every item includes a reason
 * string" (spec �23: explain why recommendations appear). MVP heuristic:
 * recommend projects/opportunities/research topics that overlap with the
 * user's own declared skills/research-topic interests, and people who
 * share a research topic.
 */
export async function discover(userId: string, limit: number) {
  const self = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      userSkills: { include: { skill: true } },
      userResearchTopics: { include: { researchTopic: true } },
    },
  });

  const skillNames = self?.userSkills.map((s) => s.skill.name) ?? [];
  const topicNames = self?.userResearchTopics.map((t) => t.researchTopic.name) ?? [];

  const [projects, opportunities, people] = await Promise.all([
    skillNames.length > 0
      ? prisma.project.findMany({
          where: {
            skillsNeeded: { some: { skill: { name: { in: skillNames } } } },
            createdBy: { not: userId },
          },
          take: limit,
          include: { skillsNeeded: { include: { skill: true } } },
        })
      : [],
    topicNames.length > 0
      ? prisma.opportunity.findMany({
          where: { researchTopic: { name: { in: topicNames } } },
          take: limit,
          include: { researchTopic: true },
        })
      : [],
    topicNames.length > 0
      ? prisma.user.findMany({
          where: {
            id: { not: userId },
            status: "active",
            userResearchTopics: {
              some: {
                researchTopic: { name: { in: topicNames } },
              },
            },
          },
          take: limit,
          include: {
            userResearchTopics: {
              include: { researchTopic: true },
            },
          },
        })
      : [],
  ]);

  return {
    people: people.map((p) => ({
      id: p.id,
      username: p.username,
      reason: `Shares your interest in ${p.userResearchTopics
        .map((t) => t.researchTopic.name)
        .filter((name) => topicNames.includes(name))
        .join(", ")}`,
    })),
    projects: projects.map((p) => ({
      id: p.id,
      name: p.name,
      reason: `Needs skills you have: ${p.skillsNeeded
        .map((s) => s.skill.name)
        .filter((name) => skillNames.includes(name))
        .join(", ")}`,
    })),
    research: [],
    publications: [],
    teams: [],
    organizations: [],
    events: [],
    opportunities: opportunities.map((o) => ({
      id: o.id,
      title: o.title,
      reason: `Matches your research interest in ${o.researchTopic?.name}`,
    })),
  };
}
