-- Collaboration Spaces (Phase CS): one reusable space primitive.
-- The existing `groups` table IS the Collaboration Space — extended here
-- with type/visibility/membership_mode/linked_project_id + an admin role.

-- CreateEnum
CREATE TYPE "SpaceType" AS ENUM ('project', 'community', 'club', 'research', 'study_group', 'startup', 'other');
CREATE TYPE "MembershipMode" AS ENUM ('open', 'request_to_join', 'invite_only');

-- AlterTable: Group gains space fields
ALTER TABLE "groups" ADD COLUMN "type" "SpaceType" NOT NULL DEFAULT 'community';
ALTER TABLE "groups" ADD COLUMN "visibility" "Visibility" NOT NULL DEFAULT 'private';
ALTER TABLE "groups" ADD COLUMN "membership_mode" "MembershipMode" NOT NULL DEFAULT 'request_to_join';
ALTER TABLE "groups" ADD COLUMN "linked_project_id" UUID;

-- Existing groups were invite-only (invitations/links only) — preserve that
-- behavior; new spaces choose their mode explicitly at creation.
UPDATE "groups" SET "membership_mode" = 'invite_only';

-- Message gains pinnedAt (space admin/owner pinning)
ALTER TABLE "messages" ADD COLUMN "pinned_at" TIMESTAMP(3);

-- One primary space per project
CREATE UNIQUE INDEX "groups_linked_project_id_key" ON "groups"("linked_project_id");
CREATE INDEX "groups_type_idx" ON "groups"("type");

-- AddForeignKey
ALTER TABLE "groups" ADD CONSTRAINT "groups_linked_project_id_fkey" FOREIGN KEY ("linked_project_id") REFERENCES "projects"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Idempotent backfill: every EXISTING project receives its Collaboration
-- Space (owner membership + all current project members synced). Running
-- this migration again creates nothing (WHERE NOT EXISTS guard).
INSERT INTO "groups" ("id", "name", "description", "owner_id", "type", "visibility", "membership_mode", "linked_project_id", "is_seed", "created_at", "updated_at")
SELECT
  gen_random_uuid(),
  p."name",
  p."description",
  p."created_by",
  'project'::"SpaceType",
  p."visibility",
  'invite_only'::"MembershipMode",
  p."id",
  p."is_seed",
  now(),
  now()
FROM "projects" p
WHERE NOT EXISTS (SELECT 1 FROM "groups" g WHERE g."linked_project_id" = p."id");

-- Sync the project owner into the space (owner role) — idempotent
INSERT INTO "group_members" ("group_id", "user_id", "role", "is_seed", "created_at")
SELECT g."id", p."created_by", 'owner'::"GroupMemberRole", true, now()
FROM "projects" p
JOIN "groups" g ON g."linked_project_id" = p."id"
WHERE NOT EXISTS (
  SELECT 1 FROM "group_members" gm WHERE gm."group_id" = g."id" AND gm."user_id" = p."created_by"
);

-- Sync the existing project members into the space (member role) — idempotent
INSERT INTO "group_members" ("group_id", "user_id", "role", "is_seed", "created_at")
SELECT g."id", pm."user_id", 'member'::"GroupMemberRole", true, now()
FROM "project_members" pm
JOIN "groups" g ON g."linked_project_id" = pm."project_id"
WHERE NOT EXISTS (
  SELECT 1 FROM "group_members" gm WHERE gm."group_id" = g."id" AND gm."user_id" = pm."user_id"
);
