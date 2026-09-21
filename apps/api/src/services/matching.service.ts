export interface CandidateProfile {
  userId: string;
  skills: string[];
  researchTopics: string[];
  department?: string;
  availability?: boolean;
  isConnected?: boolean;
}

export interface ProjectRequirements {
  skillsNeeded: string[];
  researchTopics: string[];
  targetDepartment?: string;
}

export interface MatchResult {
  userId: string;
  matchScore: number;
  matchedCriteria: string[];
  unmatchedCriteria: string[];
}

export class MatchingService {
  /**
   * Explainable matching score computation per ARCHITECTURE.md §6 and API_CONTRACT.md §5
   * score = w1*skill_overlap + w2*research_topic_overlap + w3*availability_match
   *       + w4*department_proximity + w5*existing_connection_bonus
   */
  computeMatch(candidate: CandidateProfile, requirements: ProjectRequirements): MatchResult {
    const matchedCriteria: string[] = [];
    const unmatchedCriteria: string[] = [];

    // 1. Skill overlap (weight: 40%)
    let skillScore = 0;
    if (requirements.skillsNeeded.length > 0) {
      const candidateSkills = new Set(candidate.skills.map((s) => s.toLowerCase()));
      let matchedSkillCount = 0;

      for (const skill of requirements.skillsNeeded) {
        if (candidateSkills.has(skill.toLowerCase())) {
          matchedSkillCount++;
          matchedCriteria.push(skill);
        } else {
          unmatchedCriteria.push(skill);
        }
      }
      skillScore = (matchedSkillCount / requirements.skillsNeeded.length) * 40;
    } else {
      skillScore = 40;
    }

    // 2. Research topic overlap (weight: 30%)
    let topicScore = 0;
    if (requirements.researchTopics.length > 0) {
      const candidateTopics = new Set(candidate.researchTopics.map((t) => t.toLowerCase()));
      let matchedTopicCount = 0;

      for (const topic of requirements.researchTopics) {
        if (candidateTopics.has(topic.toLowerCase())) {
          matchedTopicCount++;
          matchedCriteria.push(`Interested in ${topic}`);
        } else {
          unmatchedCriteria.push(`Topic: ${topic}`);
        }
      }
      topicScore = (matchedTopicCount / requirements.researchTopics.length) * 30;
    } else {
      topicScore = 30;
    }

    // 3. Availability match (weight: 15%)
    let availabilityScore = 0;
    if (candidate.availability !== false) {
      availabilityScore = 15;
      matchedCriteria.push("Available for collaboration");
    } else {
      unmatchedCriteria.push("Currently unavailable");
    }

    // 4. Department proximity (weight: 10%)
    let departmentScore = 0;
    if (
      requirements.targetDepartment &&
      candidate.department &&
      requirements.targetDepartment.toLowerCase() === candidate.department.toLowerCase()
    ) {
      departmentScore = 10;
      matchedCriteria.push(`Department: ${candidate.department}`);
    }

    // 5. Existing connection bonus (weight: 5%)
    let connectionScore = 0;
    if (candidate.isConnected) {
      connectionScore = 5;
      matchedCriteria.push("Existing connection");
    }

    const totalScore = Math.min(
      100,
      Math.round(skillScore + topicScore + availabilityScore + departmentScore + connectionScore),
    );

    return {
      userId: candidate.userId,
      matchScore: totalScore,
      matchedCriteria,
      unmatchedCriteria,
    };
  }
}

export const matchingService = new MatchingService();
