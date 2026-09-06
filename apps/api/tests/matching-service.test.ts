import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { matchingService } from "../src/services/matching.service.js";

describe("Phase 3 - Matching Service (Explainable Scoring)", () => {
  test("computes explainable match with full overlap", () => {
    const candidate = {
      userId: "u-123",
      skills: ["Python", "Machine Learning", "PyTorch"],
      researchTopics: ["Autonomous Systems", "Computer Vision"],
      department: "Computer Science",
      availability: true,
      isConnected: true,
    };

    const requirements = {
      skillsNeeded: ["Python", "Machine Learning"],
      researchTopics: ["Autonomous Systems"],
      targetDepartment: "Computer Science",
    };

    const result = matchingService.computeMatch(candidate, requirements);

    assert.equal(result.userId, "u-123");
    assert.equal(result.matchScore, 100);
    assert.ok(result.matchedCriteria.includes("Python"));
    assert.ok(result.matchedCriteria.includes("Machine Learning"));
    assert.ok(result.matchedCriteria.includes("Interested in Autonomous Systems"));
    assert.ok(result.matchedCriteria.includes("Department: Computer Science"));
    assert.ok(result.matchedCriteria.includes("Available for collaboration"));
    assert.ok(result.matchedCriteria.includes("Existing connection"));
    assert.equal(result.unmatchedCriteria.length, 0);
  });

  test("computes partial match and accurately categorizes unmatched criteria", () => {
    const candidate = {
      userId: "u-456",
      skills: ["Python"],
      researchTopics: ["Robotics"],
      department: "Mechanical Engineering",
      availability: false,
      isConnected: false,
    };

    const requirements = {
      skillsNeeded: ["Python", "Rust", "React"],
      researchTopics: ["Robotics", "Quantum Computing"],
      targetDepartment: "Computer Science",
    };

    const result = matchingService.computeMatch(candidate, requirements);

    assert.ok(result.matchScore < 60);
    assert.ok(result.matchedCriteria.includes("Python"));
    assert.ok(result.matchedCriteria.includes("Interested in Robotics"));
    assert.ok(result.unmatchedCriteria.includes("Rust"));
    assert.ok(result.unmatchedCriteria.includes("React"));
    assert.ok(result.unmatchedCriteria.includes("Topic: Quantum Computing"));
    assert.ok(result.unmatchedCriteria.includes("Currently unavailable"));
  });
});
