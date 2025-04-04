/*
  Warnings:

  - The values [SPEECH_THERAPY,OCCUPATIONAL_THERAPY,PHYSICAL_THERAPY,BEHAVIORAL_THERAPY] on the enum `service_type` will be removed. If these variants are still used in the database, this will fail.
  - The values [CONTACTED,SCHEDULED] on the enum `waitlist_status` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "service_type_new" AS ENUM ('THERAPY', 'ASSESSMENT', 'CONSULTATION');
ALTER TABLE "waitlist" ALTER COLUMN "service_type" TYPE "service_type_new" USING ("service_type"::text::"service_type_new");
ALTER TYPE "service_type" RENAME TO "service_type_old";
ALTER TYPE "service_type_new" RENAME TO "service_type";
DROP TYPE "service_type_old";
COMMIT;

-- AlterEnum
BEGIN;
CREATE TYPE "waitlist_status_new" AS ENUM ('WAITING', 'PLACED', 'CANCELLED');
ALTER TABLE "waitlist" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "waitlist" ALTER COLUMN "status" TYPE "waitlist_status_new" USING ("status"::text::"waitlist_status_new");
ALTER TYPE "waitlist_status" RENAME TO "waitlist_status_old";
ALTER TYPE "waitlist_status_new" RENAME TO "waitlist_status";
DROP TYPE "waitlist_status_old";
ALTER TABLE "waitlist" ALTER COLUMN "status" SET DEFAULT 'WAITING';
COMMIT;

-- CreateTable
CREATE TABLE "practice" (
    "id" BIGSERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "address" TEXT,
    "city" TEXT,
    "state" TEXT,
    "zip_code" TEXT,
    "phone" TEXT,
    "email" TEXT,
    "website" TEXT,
    "hours_of_operation" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "practice_pkey" PRIMARY KEY ("id")
);
