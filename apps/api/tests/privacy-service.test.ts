import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { privacyService } from "../src/services/privacy.service.js";
import type { PrivacySettings, UserProfileResponse } from "@app/shared-types";

describe("Phase 3 - Privacy Service (Server-side Enforcement D-004)", () => {
  const fullProfile: UserProfileResponse = {
    id: "9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d",
    username: "janedoe",
    email: "student@university.edu",
    phone: "+1-555-0100",
    role: "student",
    status: "active",
    isUniversityVerified: true,
    createdAt: new Date().toISOString(),
    studentProfile: {
      userId: "9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d",
      fullName: "Jane Doe",
      department: "Computer Science",
      course: "B.Tech",
      year: 3,
      university: "Central Tech University",
      bio: "AI researcher and student",
      cgpa: 3.95,
      githubUrl: "https://github.com/janedoe",
      linkedinUrl: "https://linkedin.com/in/janedoe",
      portfolioUrl: "https://janedoe.dev",
      lookingFor: ["research", "teammates"],
    },
  };

  const privacy: PrivacySettings = {
    userId: "9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d",
    profileVisibility: "public",
    emailVisibility: "university_only",
    phoneVisibility: "connections_only",
    academicVisibility: "university_only",
    cgpaVisibility: "private",
    projectsVisibility: "public",
    researchVisibility: "public",
    socialLinksVisibility: "connections_only",
    connectionsVisibility: "public",
    activityVisibility: "public",
    contactVisibility: "university_only",
  };

  test("owner sees all their own fields unfiltered", () => {
    const result = privacyService.filterProfileForViewer(fullProfile, privacy, {
      viewerId: "9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d",
    });

    assert.equal(result.email, "student@university.edu");
    assert.equal(result.phone, "+1-555-0100");
    assert.equal(result.studentProfile?.cgpa, 3.95);
    assert.equal(result.studentProfile?.githubUrl, "https://github.com/janedoe");
    assert.equal(result.studentProfile?.department, "Computer Science");
  });

  test("D-018 regression: connections-only phone is absent for an unconnected viewer (even a university member) and present for a connected viewer — field is absent, not null", () => {
    const unconnected = privacyService.filterProfileForViewer(fullProfile, privacy, {
      viewerId: "peer-user-id",
      isUniversityMember: true,
      isConnected: false,
    });
    assert.equal(unconnected.phone, undefined);
    assert.equal("phone" in unconnected, false);

    const connected = privacyService.filterProfileForViewer(fullProfile, privacy, {
      viewerId: "friend-user-id",
      isUniversityMember: true,
      isConnected: true,
    });
    assert.equal(connected.phone, "+1-555-0100");
  });

  test("public anonymous viewer does NOT receive private CGPA, university-only email, connections-only social links or academic info — fields are absent, not null", () => {
    const result = privacyService.filterProfileForViewer(fullProfile, privacy, {
      viewerId: null,
      isUniversityMember: false,
      isConnected: false,
    });

    assert.equal(result.email, undefined);
    assert.equal("email" in result, false);
    assert.equal(result.studentProfile?.cgpa, undefined);
    assert.equal("cgpa" in (result.studentProfile ?? {}), false);
    assert.equal(result.studentProfile?.githubUrl, undefined);
    assert.equal(result.studentProfile?.department, undefined);
    assert.equal("department" in (result.studentProfile ?? {}), false);
    assert.equal(result.studentProfile?.fullName, "Jane Doe");
  });

  test("university peer receives email and academic info but still does NOT receive private CGPA", () => {
    const result = privacyService.filterProfileForViewer(fullProfile, privacy, {
      viewerId: "peer-user-id",
      isUniversityMember: true,
      isConnected: false,
    });

    assert.equal(result.email, "student@university.edu");
    assert.equal(result.studentProfile?.cgpa, undefined);
    assert.equal(result.studentProfile?.githubUrl, undefined);
    assert.equal(result.studentProfile?.department, "Computer Science");
  });

  test("connected user receives connections-only social links and academic info but not private CGPA", () => {
    const result = privacyService.filterProfileForViewer(fullProfile, privacy, {
      viewerId: "friend-user-id",
      isUniversityMember: true,
      isConnected: true,
    });

    assert.equal(result.email, "student@university.edu");
    assert.equal(result.studentProfile?.githubUrl, "https://github.com/janedoe");
    assert.equal(result.studentProfile?.department, "Computer Science");
    assert.equal(result.studentProfile?.cgpa, undefined);
  });

  test("professor's contact info is omitted from unauthorized viewers, present for university members", () => {
    const professorProfile: UserProfileResponse = {
      id: "b2c3d4e5-1111-2222-3333-444455556666",
      username: "profsmith",
      role: "professor",
      status: "active",
      isUniversityVerified: true,
      createdAt: new Date().toISOString(),
      professorProfile: {
        userId: "b2c3d4e5-1111-2222-3333-444455556666",
        fullName: "Dr. Smith",
        department: "Physics",
        designation: "Associate Professor",
        expertise: ["Quantum Computing"],
        officeContact: "Room 402, ext. 4021",
        mentorshipAvailable: true,
      },
    };
    const profPrivacy: PrivacySettings = {
      ...privacy,
      userId: professorProfile.id,
      contactVisibility: "university_only",
      academicVisibility: "public",
    };

    const anonymous = privacyService.filterProfileForViewer(professorProfile, profPrivacy, {
      viewerId: null,
      isUniversityMember: false,
    });
    assert.equal(anonymous.professorProfile?.officeContact, undefined);
    assert.equal(anonymous.professorProfile?.department, "Physics");

    const universityMember = privacyService.filterProfileForViewer(professorProfile, profPrivacy, {
      viewerId: "peer-user-id",
      isUniversityMember: true,
    });
    assert.equal(universityMember.professorProfile?.officeContact, "Room 402, ext. 4021");
  });
});
