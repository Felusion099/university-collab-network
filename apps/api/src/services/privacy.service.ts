import type { PrivacySettings, UserProfileResponse } from "@app/shared-types";

export interface ViewerContext {
  viewerId?: string | null;
  isUniversityMember?: boolean;
  isConnected?: boolean;
  isAdmin?: boolean;
}

export class PrivacyService {
  /**
   * Enforce field-level privacy server-side per DECISIONS D-004.
   *
   * Per API_CONTRACT.md §2, a field the viewer isn't authorized for is
   * OMITTED from the response entirely (key absent) — never set to null or
   * masked. Every branch below deletes keys rather than nulling them.
   *
   * Coverage of PROJECT_SPEC.md §7's field list: email, phone, CGPA, social
   * links, and academic info (department/course/year/university for
   * students; department/designation for professors; department for
   * researchers) and contact info (professor officeContact) are enforced
   * here. `phone` was added to `users` per DECISIONS.md D-018 — previously
   * `phoneVisibility` existed as a persisted column with no data field to
   * gate; this now strips it the same way `email` is stripped, below.
   * `projectsVisibility`/`researchVisibility`/`connectionsVisibility`/
   * `activityVisibility` govern data returned by other endpoints (e.g. a
   * user's project list), not this profile object — those must be enforced
   * at the point each of those endpoints is built, not here.
   */
  filterProfileForViewer<T extends Partial<UserProfileResponse>>(
    profile: T,
    privacy: PrivacySettings | null | undefined,
    context: ViewerContext,
  ): T {
    // If viewer is owner or admin, all fields are visible
    if (context.isAdmin || (context.viewerId && context.viewerId === profile.id)) {
      return profile;
    }

    const filtered = { ...profile };

    // Default privacy if none set: matches privacy_settings column defaults
    // in DATABASE_SCHEMA.md / prisma/schema.prisma.
    const effectivePrivacy = privacy ?? {
      userId: profile.id || "",
      profileVisibility: "public" as const,
      emailVisibility: "university_only" as const,
      phoneVisibility: "connections_only" as const,
      academicVisibility: "public" as const,
      cgpaVisibility: "private" as const,
      projectsVisibility: "public" as const,
      researchVisibility: "public" as const,
      socialLinksVisibility: "public" as const,
      connectionsVisibility: "public" as const,
      activityVisibility: "public" as const,
      contactVisibility: "university_only" as const,
    };

    // If profile itself is not visible to this viewer, return minimal stub
    if (!this.isAllowed(effectivePrivacy.profileVisibility, context)) {
      return {
        id: filtered.id,
        username: filtered.username,
        role: filtered.role,
        status: filtered.status,
        isUniversityVerified: filtered.isUniversityVerified,
        createdAt: filtered.createdAt,
      } as T;
    }

    // Strip email — omitted entirely, not nulled.
    if (!this.isAllowed(effectivePrivacy.emailVisibility, context)) {
      delete filtered.email;
    }

    // Strip phone — omitted entirely, not nulled. See DECISIONS.md D-018.
    if (!this.isAllowed(effectivePrivacy.phoneVisibility, context)) {
      delete filtered.phone;
    }

    if (filtered.studentProfile && !this.isAllowed(effectivePrivacy.cgpaVisibility, context)) {
      filtered.studentProfile = this.omit(filtered.studentProfile, ["cgpa"]);
    }
    if (
      filtered.studentProfile &&
      !this.isAllowed(effectivePrivacy.socialLinksVisibility, context)
    ) {
      filtered.studentProfile = this.omit(filtered.studentProfile, [
        "githubUrl",
        "linkedinUrl",
        "portfolioUrl",
      ]);
    }
    if (filtered.studentProfile && !this.isAllowed(effectivePrivacy.academicVisibility, context)) {
      filtered.studentProfile = this.omit(filtered.studentProfile, [
        "department",
        "course",
        "year",
        "university",
      ]);
    }

    if (filtered.professorProfile && !this.isAllowed(effectivePrivacy.contactVisibility, context)) {
      filtered.professorProfile = this.omit(filtered.professorProfile, ["officeContact"]);
    }
    if (
      filtered.professorProfile &&
      !this.isAllowed(effectivePrivacy.academicVisibility, context)
    ) {
      filtered.professorProfile = this.omit(filtered.professorProfile, [
        "department",
        "designation",
      ]);
    }

    if (
      filtered.researcherProfile &&
      !this.isAllowed(effectivePrivacy.academicVisibility, context)
    ) {
      filtered.researcherProfile = this.omit(filtered.researcherProfile, ["department"]);
    }

    return filtered;
  }

  /** Returns a shallow copy of `obj` with `keys` deleted — never nulled. */
  private omit<O extends object, K extends keyof O>(obj: O, keys: K[]): O {
    const copy = { ...obj };
    for (const key of keys) {
      delete copy[key];
    }
    return copy;
  }

  /**
   * Public per DECISIONS.md D-019 — reused by researchTopic.service.ts to
   * gate whether a user should appear at all in a topic's reverse
   * (topic -> interested users) listing, based on `researchVisibility`,
   * before `filterProfileForViewer` is applied to strip their embedded
   * profile's own sub-fields (cgpa, social links, academic info).
   */
  isAllowed(
    level: "public" | "university_only" | "connections_only" | "private",
    context: ViewerContext,
  ): boolean {
    switch (level) {
      case "public":
        return true;
      case "university_only":
        return Boolean(context.isUniversityMember);
      case "connections_only":
        return Boolean(context.isConnected);
      case "private":
        return false;
      default:
        return false;
    }
  }
}

export const privacyService = new PrivacyService();
