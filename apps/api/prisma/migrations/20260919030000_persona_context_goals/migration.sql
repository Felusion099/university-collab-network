-- AlterEnum
ALTER TYPE "UserRole" ADD VALUE 'professional';

-- AlterTable
ALTER TABLE "professor_profiles" ADD COLUMN     "institution" TEXT;

-- AlterTable
ALTER TABLE "researcher_profiles" ADD COLUMN     "institution" TEXT,
ADD COLUMN     "research_areas" TEXT[] DEFAULT ARRAY[]::TEXT[];

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "goals" JSONB;

-- CreateTable
CREATE TABLE "professional_profiles" (
    "user_id" UUID NOT NULL,
    "full_name" TEXT NOT NULL,
    "organization" TEXT,
    "job_title" TEXT,
    "professional_area" TEXT,
    "specialization" TEXT,
    "bio" TEXT,
    "is_seed" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "professional_profiles_pkey" PRIMARY KEY ("user_id")
);

-- CreateIndex
CREATE INDEX "professional_profiles_user_id_idx" ON "professional_profiles"("user_id");

-- AddForeignKey
ALTER TABLE "professional_profiles" ADD CONSTRAINT "professional_profiles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

