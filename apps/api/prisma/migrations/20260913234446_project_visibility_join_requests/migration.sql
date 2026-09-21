-- CreateEnum
CREATE TYPE "JoinRequestDirection" AS ENUM ('request', 'invitation');

-- CreateEnum
CREATE TYPE "JoinRequestStatus" AS ENUM ('pending', 'accepted', 'rejected');

-- AlterTable
ALTER TABLE "projects" ADD COLUMN     "visibility" "Visibility" NOT NULL DEFAULT 'public';

-- CreateTable
CREATE TABLE "join_requests" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL,
    "project_id" UUID,
    "research_team_id" UUID,
    "direction" "JoinRequestDirection" NOT NULL,
    "status" "JoinRequestStatus" NOT NULL DEFAULT 'pending',
    "message" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "join_requests_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "join_requests_user_id_idx" ON "join_requests"("user_id");

-- CreateIndex
CREATE INDEX "join_requests_project_id_idx" ON "join_requests"("project_id");

-- CreateIndex
CREATE INDEX "join_requests_research_team_id_idx" ON "join_requests"("research_team_id");

-- AddForeignKey
ALTER TABLE "join_requests" ADD CONSTRAINT "join_requests_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "join_requests" ADD CONSTRAINT "join_requests_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "join_requests" ADD CONSTRAINT "join_requests_research_team_id_fkey" FOREIGN KEY ("research_team_id") REFERENCES "research_teams"("id") ON DELETE CASCADE ON UPDATE CASCADE;
