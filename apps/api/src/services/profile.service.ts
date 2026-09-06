import { prisma } from "../repositories/prisma.js";
import { userRepository } from "../repositories/user.repository.js";
import { privacyService } from "./privacy.service.js";
import { NotFoundError } from "../utils/errors.js";
import type { ViewerContext } from "./privacy.service.js";
import type { UpdateProfileRequest, UpdatePrivacySettingsRequest } from "@app/shared-types";

/**
 * Server-generated username (D-013) — email local-part, lowercased,
 * non-alphanumeric characters stripped, de-duplicated with a numeric suffix
 * on collision. Never user-chosen in this MVP pass.
 */
export async function generateUniqueUsername(email: string): Promise<string> {
  const local = email.split("@")[0] ?? "user";
  const base =
    local
      .toLowerCase()
      .replace(/[^a-z0-9]/g, "")
      .slice(0, 24) || "user";

  let candidate = base;
  let suffix = 0;
  // Bounded loop — signup is rare enough that a handful of collision checks
  // is not a scaling concern; a truly pathological run falls back to a
  // random suffix rather than looping forever.
  while (await userRepository.usernameExists(candidate)) {
    suffix += 1;
    if (suffix > 50) {
      candidate = `${base}${Math.floor(Math.random() * 1_000_000)}`;
      break;
    }
    candidate = `${base}${suffix}`;
  }
  return candidate;
}

async function buildViewerContext(
  viewerId: string | undefined,
  targetUserId: string,
): Promise<ViewerContext> {
  if (!viewerId) return {};
  if (viewerId === targetUserId) return { viewerId, isAdmin: false };

  const [viewer, target, connection] = await Promise.all([
    userRepository.findByIdLean(viewerId),
    userRepository.findByIdLean(targetUserId),
    prisma.connection.findFirst({
      where: {
        status: "accepted",
        OR: [
          { requesterId: viewerId, addresseeId: targetUserId },
          { requesterId: targetUserId, addresseeId: viewerId },
        ],
      },
    }),
  ]);

  return {
    viewerId,
    isAdmin: viewer?.requestedRole === "admin",
    isUniversityMember: Boolean(viewer) && Boolean(target),
    isConnected: Boolean(connection),
  };
}

export async function getProfileByUsername(username: string, viewerId: string | undefined) {
  const user = await userRepository.findByUsername(username);
  if (!user) throw new NotFoundError("User not found");

  const context = await buildViewerContext(viewerId, user.id);

  const profile = {
    id: user.id,
    username: user.username,
    email: user.email,
    phone: user.phone,
    role: user.requestedRole,
    status: user.status,
    isUniversityVerified: user.isUniversityVerified,
    avatarUrl: user.avatarUrl,
    studentProfile: user.studentProfile
      ? {
          ...user.studentProfile,
          cgpa: user.studentProfile.cgpa !== null ? Number(user.studentProfile.cgpa) : null,
        }
      : null,
    professorProfile: user.professorProfile,
    researcherProfile: user.researcherProfile,
    createdAt: user.createdAt.toISOString(),
  };

  return privacyService.filterProfileForViewer(profile, user.privacySettings, context);
}

export async function updateOwnProfile(userId: string, input: UpdateProfileRequest) {
  const user = await userRepository.findById(userId);
  if (!user) throw new NotFoundError("User not found");

  if (input.avatarUrl !== undefined || input.phone !== undefined) {
    await userRepository.update(userId, {
      ...(input.avatarUrl !== undefined ? { avatarUrl: input.avatarUrl } : {}),
      ...(input.phone !== undefined ? { phone: input.phone } : {}),
    });
  }

  if (user.requestedRole === "student" && input.studentProfile) {
    await prisma.studentProfile.upsert({
      where: { userId },
      create: { userId, fullName: input.fullName ?? "", ...input.studentProfile },
      update: input.studentProfile,
    });
  }
  if (user.requestedRole === "professor" && input.professorProfile) {
    await prisma.professorProfile.upsert({
      where: { userId },
      create: { userId, fullName: input.fullName ?? "", ...input.professorProfile },
      update: input.professorProfile,
    });
  }
  if (user.requestedRole === "researcher" && input.researcherProfile) {
    const { researcherType, ...restResearcher } = input.researcherProfile;
    await prisma.researcherProfile.upsert({
      where: { userId },
      create: {
        userId,
        fullName: input.fullName ?? "",
        researcherType: researcherType ?? "research_assistant",
        ...restResearcher,
      },
      update: {
        ...(researcherType ? { researcherType } : {}),
        ...restResearcher,
      },
    });
  }

  return userRepository.findById(userId);
}

export async function getOwnPrivacySettings(userId: string) {
  const settings = await prisma.privacySettings.findUnique({ where: { userId } });
  if (settings) return settings;
  // Defaults per DATABASE_SCHEMA.md column defaults — created lazily on first read/write.
  return prisma.privacySettings.create({ data: { userId } });
}

export async function updateOwnPrivacySettings(
  userId: string,
  input: UpdatePrivacySettingsRequest,
) {
  return prisma.privacySettings.upsert({
    where: { userId },
    create: { userId, ...input },
    update: input,
  });
}
