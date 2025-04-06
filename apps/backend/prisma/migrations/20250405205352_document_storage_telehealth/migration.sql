/*
  Warnings:

  - The values [YEARLY] on the enum `recurrence_frequency` will be removed. If these variants are still used in the database, this will fail.
  - The values [PRIMARY_THERAPIST,SECONDARY_THERAPIST] on the enum `therapist_role` will be removed. If these variants are still used in the database, this will fail.

*/
-- CreateEnum
CREATE TYPE "claim_status" AS ENUM ('PENDING', 'SUBMITTED', 'IN_REVIEW', 'APPROVED', 'PARTIAL_APPROVAL', 'DENIED', 'RESUBMITTED', 'PAID', 'APPEALED');

-- CreateEnum
CREATE TYPE "encryption_status" AS ENUM ('UNENCRYPTED', 'ENCRYPTED_AT_REST', 'ENCRYPTED_IN_TRANSIT', 'FULLY_ENCRYPTED');

-- CreateEnum
CREATE TYPE "funding_source" AS ENUM ('PRIVATE_PAY', 'INSURANCE', 'PROVINCIAL_FUNDING', 'FEDERAL_GRANT', 'CHARITABLE_GRANT', 'SCHOOL_DISTRICT', 'OTHER');

-- CreateEnum
CREATE TYPE "invoice_status" AS ENUM ('DRAFT', 'PENDING', 'SENT', 'PAID', 'PARTIAL', 'OVERDUE', 'CANCELLED', 'REFUNDED');

-- CreateEnum
CREATE TYPE "language_code" AS ENUM ('EN', 'FR', 'ES', 'ZH', 'AR', 'UR', 'PA', 'HI', 'DE', 'PT', 'IT', 'RU');

-- CreateEnum
CREATE TYPE "payment_method" AS ENUM ('CREDIT_CARD', 'DEBIT', 'E_TRANSFER', 'CASH', 'CHEQUE', 'DIRECT_DEPOSIT', 'INSURANCE_DIRECT', 'FUNDING_PROGRAM');

-- CreateEnum
CREATE TYPE "relationship_type" AS ENUM ('PARENT', 'GUARDIAN', 'GRANDPARENT', 'SIBLING', 'OTHER_FAMILY', 'CAREGIVER', 'CASE_WORKER');

-- CreateEnum
CREATE TYPE "security_classification" AS ENUM ('PUBLIC', 'INTERNAL', 'CONFIDENTIAL', 'RESTRICTED');

-- AlterEnum
BEGIN;
CREATE TYPE "recurrence_frequency_new" AS ENUM ('DAILY', 'WEEKLY', 'BIWEEKLY', 'MONTHLY', 'CUSTOM');
ALTER TABLE "appointment_recurrence_patterns" ALTER COLUMN "frequency" TYPE "recurrence_frequency_new" USING ("frequency"::text::"recurrence_frequency_new");
ALTER TYPE "recurrence_frequency" RENAME TO "recurrence_frequency_old";
ALTER TYPE "recurrence_frequency_new" RENAME TO "recurrence_frequency";
DROP TYPE "recurrence_frequency_old";
COMMIT;

-- AlterEnum
BEGIN;
CREATE TYPE "therapist_role_new" AS ENUM ('PRIMARY', 'ASSISTANT', 'SUPERVISOR', 'OBSERVER');
ALTER TABLE "appointment_staff" ALTER COLUMN "role" TYPE "therapist_role_new" USING ("role"::text::"therapist_role_new");
ALTER TYPE "therapist_role" RENAME TO "therapist_role_old";
ALTER TYPE "therapist_role_new" RENAME TO "therapist_role";
DROP TYPE "therapist_role_old";
COMMIT;

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "user_role" ADD VALUE 'RECEPTIONIST';
ALTER TYPE "user_role" ADD VALUE 'CAREGIVER';
ALTER TYPE "user_role" ADD VALUE 'PARENT';
ALTER TYPE "user_role" ADD VALUE 'SUPERVISOR';
ALTER TYPE "user_role" ADD VALUE 'BILLING_STAFF';

-- AlterTable
ALTER TABLE "appointments" ADD COLUMN     "is_group_session" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "is_recurring" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "location_id" BIGINT,
ADD COLUMN     "max_participants" INTEGER,
ADD COLUMN     "parent_appointment_id" BIGINT,
ADD COLUMN     "recurrence_pattern_id" BIGINT,
ADD COLUMN     "room_id" BIGINT;

-- AlterTable
ALTER TABLE "clients" ADD COLUMN     "interpreter_notes" TEXT,
ADD COLUMN     "preferred_language" "language_code" NOT NULL DEFAULT 'EN',
ADD COLUMN     "requires_interpreter" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "communications" ADD COLUMN     "encryption_status" "encryption_status",
ADD COLUMN     "expiration_date" TIMESTAMP(3),
ADD COLUMN     "is_encrypted" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "is_read" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "read_at" TIMESTAMP(3),
ADD COLUMN     "read_by" BIGINT,
ADD COLUMN     "requires_signature" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "retention_period_days" INTEGER,
ADD COLUMN     "security_classification" "security_classification",
ADD COLUMN     "signed_at" TIMESTAMP(3),
ADD COLUMN     "signed_by" BIGINT,
ADD COLUMN     "thread_id" BIGINT;

-- AlterTable
ALTER TABLE "practice" ADD COLUMN     "primary_language" "language_code" NOT NULL DEFAULT 'EN',
ADD COLUMN     "supported_languages" TEXT;

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "account_locked" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "email_verification_token" TEXT,
ADD COLUMN     "email_verification_token_expires" TIMESTAMP(3),
ADD COLUMN     "failed_login_attempts" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "is_email_verified" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "last_password_change" TIMESTAMP(3),
ADD COLUMN     "password_reset_expires" TIMESTAMP(3),
ADD COLUMN     "password_reset_token" TEXT,
ADD COLUMN     "portal_access" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "portal_last_login" TIMESTAMP(3),
ADD COLUMN     "preferred_language" "language_code" NOT NULL DEFAULT 'EN',
ADD COLUMN     "require_password_change" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "secondary_languages" TEXT;

-- CreateTable
CREATE TABLE "appointment_equipment" (
    "appointment_id" BIGINT NOT NULL,
    "equipment_id" BIGINT NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "appointment_equipment_pkey" PRIMARY KEY ("appointment_id","equipment_id")
);

-- CreateTable
CREATE TABLE "appointment_group_participants" (
    "appointment_id" BIGINT NOT NULL,
    "learner_id" BIGINT NOT NULL,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "appointment_group_participants_pkey" PRIMARY KEY ("appointment_id","learner_id")
);

-- CreateTable
CREATE TABLE "appointment_recurrence_patterns" (
    "id" BIGSERIAL NOT NULL,
    "frequency" "recurrence_frequency" NOT NULL,
    "interval" INTEGER NOT NULL DEFAULT 1,
    "days_of_week" TEXT,
    "start_date" TIMESTAMP(3) NOT NULL,
    "end_date" TIMESTAMP(3),
    "occurrence_count" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "created_by" BIGINT,
    "updated_by" BIGINT,

    CONSTRAINT "appointment_recurrence_patterns_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "appointment_staff" (
    "appointment_id" BIGINT NOT NULL,
    "user_id" BIGINT NOT NULL,
    "role" "therapist_role" NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "appointment_staff_pkey" PRIMARY KEY ("appointment_id","user_id")
);

-- CreateTable
CREATE TABLE "therapy_equipment" (
    "id" BIGSERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "is_available" BOOLEAN NOT NULL DEFAULT true,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "created_by" BIGINT,
    "updated_by" BIGINT,

    CONSTRAINT "therapy_equipment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "therapy_rooms" (
    "id" BIGSERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "capacity" INTEGER,
    "description" TEXT,
    "equipment" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "created_by" BIGINT,
    "updated_by" BIGINT,
    "location_id" BIGINT,

    CONSTRAINT "therapy_rooms_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "document_categories" (
    "id" BIGSERIAL NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "description" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "created_by" BIGINT,
    "updated_by" BIGINT,

    CONSTRAINT "document_categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "documents" (
    "id" BIGSERIAL NOT NULL,
    "title" VARCHAR(255) NOT NULL,
    "file_path" VARCHAR(255) NOT NULL,
    "file_name" VARCHAR(255) NOT NULL,
    "file_type" VARCHAR(100) NOT NULL,
    "file_size" BIGINT NOT NULL,
    "mime_type" VARCHAR(100) NOT NULL,
    "category_id" BIGINT,
    "client_id" BIGINT,
    "learner_id" BIGINT,
    "uploader_id" BIGINT NOT NULL,
    "upload_date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "description" TEXT,
    "tags" VARCHAR(255)[],
    "security_classification" "security_classification" NOT NULL DEFAULT 'CONFIDENTIAL',
    "is_encrypted" BOOLEAN NOT NULL DEFAULT true,
    "encryption_key_id" VARCHAR(255),
    "checksum" VARCHAR(255) NOT NULL,
    "retention_period_days" INTEGER,
    "expiration_date" TIMESTAMP(3),
    "version" INTEGER NOT NULL DEFAULT 1,
    "is_latest_version" BOOLEAN NOT NULL DEFAULT true,
    "parent_document_id" BIGINT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "created_by" BIGINT NOT NULL,
    "updated_by" BIGINT NOT NULL,

    CONSTRAINT "documents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "document_permissions" (
    "id" BIGSERIAL NOT NULL,
    "document_id" BIGINT NOT NULL,
    "user_id" BIGINT NOT NULL,
    "permission_type" VARCHAR(50) NOT NULL,
    "granted_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expires_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by" BIGINT NOT NULL,

    CONSTRAINT "document_permissions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "document_access_logs" (
    "id" BIGSERIAL NOT NULL,
    "document_id" BIGINT NOT NULL,
    "user_id" BIGINT NOT NULL,
    "action_type" VARCHAR(50) NOT NULL,
    "access_timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ip_address" VARCHAR(45),
    "user_agent" VARCHAR(255),
    "additional_info" TEXT,

    CONSTRAINT "document_access_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "telehealth_providers" (
    "id" BIGSERIAL NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "description" TEXT,
    "api_endpoint" VARCHAR(255),
    "api_key_name" VARCHAR(100),
    "api_secret_name" VARCHAR(100),
    "supports_recording" BOOLEAN NOT NULL DEFAULT false,
    "supports_screen_sharing" BOOLEAN NOT NULL DEFAULT false,
    "supports_waiting_room" BOOLEAN NOT NULL DEFAULT false,
    "supports_breakout_rooms" BOOLEAN NOT NULL DEFAULT false,
    "max_participants" INTEGER,
    "max_duration_minutes" INTEGER,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by" BIGINT,
    "updated_by" BIGINT,

    CONSTRAINT "telehealth_providers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "virtual_sessions" (
    "id" BIGSERIAL NOT NULL,
    "appointment_id" BIGINT,
    "provider_id" BIGINT NOT NULL,
    "meeting_id" VARCHAR(255) NOT NULL,
    "meeting_password" VARCHAR(255),
    "host_link" VARCHAR(1024) NOT NULL,
    "join_link" VARCHAR(1024) NOT NULL,
    "scheduled_start_time" TIMESTAMP(3) NOT NULL,
    "scheduled_end_time" TIMESTAMP(3) NOT NULL,
    "actual_start_time" TIMESTAMP(3),
    "actual_end_time" TIMESTAMP(3),
    "duration_minutes" INTEGER,
    "status" VARCHAR(50) NOT NULL DEFAULT 'SCHEDULED',
    "cancellation_reason" TEXT,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by" BIGINT NOT NULL,
    "updated_by" BIGINT NOT NULL,

    CONSTRAINT "virtual_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "virtual_session_participants" (
    "id" BIGSERIAL NOT NULL,
    "session_id" BIGINT NOT NULL,
    "participant_type" VARCHAR(50) NOT NULL,
    "user_id" BIGINT,
    "external_email" VARCHAR(255),
    "external_name" VARCHAR(255),
    "personal_join_link" VARCHAR(1024),
    "join_token" VARCHAR(255),
    "attended" BOOLEAN DEFAULT false,
    "join_time" TIMESTAMP(3),
    "leave_time" TIMESTAMP(3),
    "duration_minutes" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "virtual_session_participants_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "virtual_session_recordings" (
    "id" BIGSERIAL NOT NULL,
    "session_id" BIGINT NOT NULL,
    "recording_url" VARCHAR(1024) NOT NULL,
    "recording_type" VARCHAR(50) NOT NULL,
    "start_time" TIMESTAMP(3) NOT NULL,
    "end_time" TIMESTAMP(3),
    "duration_minutes" INTEGER,
    "file_size_bytes" BIGINT,
    "is_processing" BOOLEAN NOT NULL DEFAULT false,
    "is_available" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by" BIGINT NOT NULL,

    CONSTRAINT "virtual_session_recordings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "analytics_metrics" (
    "id" BIGSERIAL NOT NULL,
    "metric_name" TEXT NOT NULL,
    "metric_category" TEXT NOT NULL,
    "description" TEXT,
    "calculation_formula" TEXT,
    "display_order" INTEGER NOT NULL DEFAULT 0,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by" BIGINT,
    "updated_by" BIGINT,

    CONSTRAINT "analytics_metrics_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "auth_logs" (
    "id" BIGSERIAL NOT NULL,
    "user_id" BIGINT NOT NULL,
    "action" TEXT NOT NULL,
    "ip_address" TEXT,
    "user_agent" TEXT,
    "success" BOOLEAN NOT NULL DEFAULT true,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "details" TEXT,

    CONSTRAINT "auth_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "client_funding" (
    "id" BIGSERIAL NOT NULL,
    "client_id" BIGINT NOT NULL,
    "funding_program_id" BIGINT NOT NULL,
    "reference_number" TEXT,
    "status" TEXT NOT NULL,
    "total_amount" DECIMAL(15,2) NOT NULL,
    "remaining_amount" DECIMAL(15,2) NOT NULL,
    "start_date" DATE NOT NULL,
    "end_date" DATE NOT NULL,
    "approval_date" DATE,
    "approved_by" TEXT,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "created_by" BIGINT,
    "updated_by" BIGINT,

    CONSTRAINT "client_funding_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "client_insurance" (
    "id" BIGSERIAL NOT NULL,
    "client_id" BIGINT NOT NULL,
    "insurance_provider_id" BIGINT NOT NULL,
    "policy_number" TEXT NOT NULL,
    "group_number" TEXT,
    "member_id" TEXT NOT NULL,
    "policy_holder_name" TEXT NOT NULL,
    "policy_holder_dob" DATE,
    "relationship_to_client" TEXT NOT NULL,
    "coverage_start_date" DATE,
    "coverage_end_date" DATE,
    "max_annual_coverage" DECIMAL(15,2),
    "remaining_coverage" DECIMAL(15,2),
    "coverage_details" TEXT,
    "is_primary" BOOLEAN NOT NULL DEFAULT true,
    "verification_date" DATE,
    "verified_by" BIGINT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "created_by" BIGINT,
    "updated_by" BIGINT,

    CONSTRAINT "client_insurance_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "communication_access_logs" (
    "id" BIGSERIAL NOT NULL,
    "communication_id" BIGINT,
    "attachment_id" BIGINT,
    "user_id" BIGINT NOT NULL,
    "access_type" TEXT NOT NULL,
    "access_timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ip_address" TEXT,
    "user_agent" TEXT,
    "success" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "communication_access_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "communication_attachments" (
    "id" BIGSERIAL NOT NULL,
    "communication_id" BIGINT NOT NULL,
    "file_name" TEXT NOT NULL,
    "file_type" TEXT NOT NULL,
    "file_size" INTEGER NOT NULL,
    "file_path" TEXT NOT NULL,
    "upload_date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "security_classification" "security_classification" NOT NULL DEFAULT 'INTERNAL',
    "encryption_status" "encryption_status" NOT NULL DEFAULT 'ENCRYPTED_AT_REST',
    "checksum" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by" BIGINT,

    CONSTRAINT "communication_attachments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "content_translations" (
    "id" BIGSERIAL NOT NULL,
    "content_type" TEXT NOT NULL,
    "content_id" TEXT NOT NULL,
    "language" "language_code" NOT NULL,
    "translated_content" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "created_by" BIGINT,
    "updated_by" BIGINT,

    CONSTRAINT "content_translations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "dashboard_widgets" (
    "id" BIGSERIAL NOT NULL,
    "user_id" BIGINT NOT NULL,
    "widget_type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "metric_ids" TEXT,
    "chart_type" TEXT,
    "time_range" TEXT,
    "custom_query" TEXT,
    "position_x" INTEGER NOT NULL DEFAULT 0,
    "position_y" INTEGER NOT NULL DEFAULT 0,
    "width" INTEGER NOT NULL DEFAULT 1,
    "height" INTEGER NOT NULL DEFAULT 1,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "dashboard_widgets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "funding_authorizations" (
    "id" BIGSERIAL NOT NULL,
    "client_funding_id" BIGINT NOT NULL,
    "invoice_id" BIGINT NOT NULL,
    "authorization_number" TEXT,
    "authorized_date" DATE NOT NULL,
    "authorized_amount" DECIMAL(15,2) NOT NULL,
    "status" TEXT NOT NULL,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "created_by" BIGINT,
    "updated_by" BIGINT,

    CONSTRAINT "funding_authorizations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "funding_programs" (
    "id" BIGSERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "program_type" TEXT NOT NULL,
    "description" TEXT,
    "max_amount" DECIMAL(15,2),
    "coverage_period" TEXT,
    "age_restrictions" TEXT,
    "documentation_required" TEXT,
    "renewal_process" TEXT,
    "website" TEXT,
    "contact_information" TEXT,
    "application_process" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "province" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "created_by" BIGINT,
    "updated_by" BIGINT,

    CONSTRAINT "funding_programs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "insurance_claims" (
    "id" BIGSERIAL NOT NULL,
    "invoice_id" BIGINT NOT NULL,
    "insurance_id" BIGINT NOT NULL,
    "claim_number" TEXT,
    "submission_date" DATE NOT NULL,
    "status" "claim_status" NOT NULL DEFAULT 'PENDING',
    "amount_claimed" DECIMAL(15,2) NOT NULL,
    "amount_approved" DECIMAL(15,2),
    "amount_paid" DECIMAL(15,2),
    "payment_date" DATE,
    "denial_reason" TEXT,
    "notes" TEXT,
    "follow_up_date" DATE,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "created_by" BIGINT,
    "updated_by" BIGINT,

    CONSTRAINT "insurance_claims_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "insurance_providers" (
    "id" BIGSERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "contact_person" TEXT,
    "phone" TEXT,
    "email" TEXT,
    "website" TEXT,
    "address" TEXT,
    "city" TEXT,
    "province" TEXT,
    "postal_code" TEXT,
    "submission_portal" TEXT,
    "submission_format" TEXT,
    "electronic_filing" BOOLEAN NOT NULL DEFAULT false,
    "notes" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "created_by" BIGINT,
    "updated_by" BIGINT,

    CONSTRAINT "insurance_providers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "invoice_line_items" (
    "id" BIGSERIAL NOT NULL,
    "invoice_id" BIGINT NOT NULL,
    "service_code_id" BIGINT NOT NULL,
    "description" TEXT NOT NULL,
    "service_date" DATE NOT NULL,
    "quantity" DECIMAL(10,2) NOT NULL,
    "unit_price" DECIMAL(15,2) NOT NULL,
    "tax_rate" DECIMAL(5,2) NOT NULL DEFAULT 0,
    "tax_amount" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "discount_amount" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "line_total" DECIMAL(15,2) NOT NULL,
    "appointment_id" BIGINT,
    "learner_id" BIGINT,

    CONSTRAINT "invoice_line_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "invoices" (
    "id" BIGSERIAL NOT NULL,
    "invoice_number" TEXT NOT NULL,
    "client_id" BIGINT NOT NULL,
    "funding_source" "funding_source" NOT NULL,
    "insurance_id" BIGINT,
    "funding_id" BIGINT,
    "status" "invoice_status" NOT NULL DEFAULT 'DRAFT',
    "issue_date" DATE NOT NULL,
    "due_date" DATE NOT NULL,
    "subtotal" DECIMAL(15,2) NOT NULL,
    "tax_amount" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "discount_amount" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "total_amount" DECIMAL(15,2) NOT NULL,
    "amount_paid" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "balance" DECIMAL(15,2) NOT NULL,
    "notes" TEXT,
    "payment_instructions" TEXT,
    "terms_conditions" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "created_by" BIGINT,
    "updated_by" BIGINT,

    CONSTRAINT "invoices_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "messaging_threads" (
    "id" BIGSERIAL NOT NULL,
    "subject" TEXT NOT NULL,
    "client_id" BIGINT NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "created_by" BIGINT,
    "last_message_at" TIMESTAMP(3),

    CONSTRAINT "messaging_threads_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "metrics_snapshots" (
    "id" BIGSERIAL NOT NULL,
    "metric_id" BIGINT NOT NULL,
    "snapshot_date" DATE NOT NULL,
    "value" DECIMAL(15,2) NOT NULL,
    "comparison_value" DECIMAL(15,2),
    "comparison_period" TEXT,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "metrics_snapshots_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payments" (
    "id" BIGSERIAL NOT NULL,
    "invoice_id" BIGINT NOT NULL,
    "payment_date" DATE NOT NULL,
    "amount" DECIMAL(15,2) NOT NULL,
    "payment_method" "payment_method" NOT NULL,
    "reference_number" TEXT,
    "notes" TEXT,
    "received_by" BIGINT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "payments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "permission_types" (
    "id" BIGSERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "category" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "permission_types_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "practice_locations" (
    "id" BIGSERIAL NOT NULL,
    "practice_id" BIGINT NOT NULL,
    "name" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "province" TEXT NOT NULL,
    "postal_code" TEXT NOT NULL,
    "phone" TEXT,
    "email" TEXT,
    "is_main_location" BOOLEAN NOT NULL DEFAULT false,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "hours_of_operation" TEXT,
    "directions" TEXT,
    "latitude" DECIMAL(10,8),
    "longitude" DECIMAL(11,8),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "created_by" BIGINT,
    "updated_by" BIGINT,

    CONSTRAINT "practice_locations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "record_permissions" (
    "id" BIGSERIAL NOT NULL,
    "user_id" BIGINT NOT NULL,
    "permission_id" BIGINT NOT NULL,
    "client_id" BIGINT,
    "learner_id" BIGINT,
    "granted" BOOLEAN NOT NULL DEFAULT true,
    "granted_by" BIGINT,
    "granted_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expires_at" TIMESTAMP(3),

    CONSTRAINT "record_permissions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "role_permissions" (
    "id" BIGSERIAL NOT NULL,
    "role" "user_role" NOT NULL,
    "permission_id" BIGINT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "role_permissions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "service_codes" (
    "id" BIGSERIAL NOT NULL,
    "code" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "rate" DECIMAL(15,2) NOT NULL,
    "tax_rate" DECIMAL(5,2) NOT NULL DEFAULT 0,
    "billable_unit" TEXT NOT NULL,
    "minimum_duration" INTEGER,
    "notes" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "created_by" BIGINT,
    "updated_by" BIGINT,

    CONSTRAINT "service_codes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_locations" (
    "user_id" BIGINT NOT NULL,
    "location_id" BIGINT NOT NULL,
    "is_primary" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_locations_pkey" PRIMARY KEY ("user_id","location_id")
);

-- CreateTable
CREATE TABLE "user_permissions" (
    "id" BIGSERIAL NOT NULL,
    "user_id" BIGINT NOT NULL,
    "permission_id" BIGINT NOT NULL,
    "granted" BOOLEAN NOT NULL DEFAULT true,
    "granted_by" BIGINT,
    "granted_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expires_at" TIMESTAMP(3),

    CONSTRAINT "user_permissions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "document_categories_name_key" ON "document_categories"("name");

-- CreateIndex
CREATE UNIQUE INDEX "document_permissions_document_id_user_id_permission_type_key" ON "document_permissions"("document_id", "user_id", "permission_type");

-- CreateIndex
CREATE UNIQUE INDEX "telehealth_providers_name_key" ON "telehealth_providers"("name");

-- CreateIndex
CREATE UNIQUE INDEX "unique_metric_name" ON "analytics_metrics"("metric_name");

-- CreateIndex
CREATE UNIQUE INDEX "unique_content_translation" ON "content_translations"("content_type", "content_id", "language");

-- CreateIndex
CREATE UNIQUE INDEX "invoices_invoice_number_key" ON "invoices"("invoice_number");

-- CreateIndex
CREATE UNIQUE INDEX "unique_metric_snapshot" ON "metrics_snapshots"("metric_id", "snapshot_date");

-- CreateIndex
CREATE UNIQUE INDEX "permission_types_name_key" ON "permission_types"("name");

-- CreateIndex
CREATE UNIQUE INDEX "unique_role_permission" ON "role_permissions"("role", "permission_id");

-- CreateIndex
CREATE UNIQUE INDEX "unique_service_code" ON "service_codes"("code");

-- CreateIndex
CREATE UNIQUE INDEX "unique_user_permission" ON "user_permissions"("user_id", "permission_id");

-- AddForeignKey
ALTER TABLE "appointment_equipment" ADD CONSTRAINT "appointment_equipment_appointment_id_fkey" FOREIGN KEY ("appointment_id") REFERENCES "appointments"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "appointment_equipment" ADD CONSTRAINT "appointment_equipment_equipment_id_fkey" FOREIGN KEY ("equipment_id") REFERENCES "therapy_equipment"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "appointment_group_participants" ADD CONSTRAINT "appointment_group_participants_appointment_id_fkey" FOREIGN KEY ("appointment_id") REFERENCES "appointments"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "appointment_group_participants" ADD CONSTRAINT "appointment_group_participants_learner_id_fkey" FOREIGN KEY ("learner_id") REFERENCES "learners"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "appointment_recurrence_patterns" ADD CONSTRAINT "fk_recurrence_patterns_created_by" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "appointment_recurrence_patterns" ADD CONSTRAINT "fk_recurrence_patterns_updated_by" FOREIGN KEY ("updated_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "appointment_staff" ADD CONSTRAINT "fk_appointment_staff_appointment" FOREIGN KEY ("appointment_id") REFERENCES "appointments"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "appointment_staff" ADD CONSTRAINT "fk_appointment_staff_user" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "appointments" ADD CONSTRAINT "fk_appointments_location" FOREIGN KEY ("location_id") REFERENCES "practice_locations"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "appointments" ADD CONSTRAINT "fk_appointments_parent" FOREIGN KEY ("parent_appointment_id") REFERENCES "appointments"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "appointments" ADD CONSTRAINT "fk_appointments_recurrence" FOREIGN KEY ("recurrence_pattern_id") REFERENCES "appointment_recurrence_patterns"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "appointments" ADD CONSTRAINT "fk_appointments_room" FOREIGN KEY ("room_id") REFERENCES "therapy_rooms"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "communications" ADD CONSTRAINT "fk_communications_read_by" FOREIGN KEY ("read_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "communications" ADD CONSTRAINT "fk_communications_signed_by" FOREIGN KEY ("signed_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "communications" ADD CONSTRAINT "fk_communications_thread" FOREIGN KEY ("thread_id") REFERENCES "messaging_threads"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "therapy_equipment" ADD CONSTRAINT "therapy_equipment_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "therapy_equipment" ADD CONSTRAINT "therapy_equipment_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "therapy_rooms" ADD CONSTRAINT "fk_therapy_rooms_location" FOREIGN KEY ("location_id") REFERENCES "practice_locations"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "therapy_rooms" ADD CONSTRAINT "therapy_rooms_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "therapy_rooms" ADD CONSTRAINT "therapy_rooms_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "document_categories" ADD CONSTRAINT "document_categories_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "document_categories" ADD CONSTRAINT "document_categories_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "documents" ADD CONSTRAINT "documents_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "document_categories"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "documents" ADD CONSTRAINT "documents_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "clients"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "documents" ADD CONSTRAINT "documents_learner_id_fkey" FOREIGN KEY ("learner_id") REFERENCES "learners"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "documents" ADD CONSTRAINT "documents_uploader_id_fkey" FOREIGN KEY ("uploader_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "documents" ADD CONSTRAINT "documents_parent_document_id_fkey" FOREIGN KEY ("parent_document_id") REFERENCES "documents"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "documents" ADD CONSTRAINT "documents_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "documents" ADD CONSTRAINT "documents_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "document_permissions" ADD CONSTRAINT "document_permissions_document_id_fkey" FOREIGN KEY ("document_id") REFERENCES "documents"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "document_permissions" ADD CONSTRAINT "document_permissions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "document_permissions" ADD CONSTRAINT "document_permissions_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "document_access_logs" ADD CONSTRAINT "document_access_logs_document_id_fkey" FOREIGN KEY ("document_id") REFERENCES "documents"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "document_access_logs" ADD CONSTRAINT "document_access_logs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "telehealth_providers" ADD CONSTRAINT "telehealth_providers_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "telehealth_providers" ADD CONSTRAINT "telehealth_providers_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "virtual_sessions" ADD CONSTRAINT "virtual_sessions_appointment_id_fkey" FOREIGN KEY ("appointment_id") REFERENCES "appointments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "virtual_sessions" ADD CONSTRAINT "virtual_sessions_provider_id_fkey" FOREIGN KEY ("provider_id") REFERENCES "telehealth_providers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "virtual_sessions" ADD CONSTRAINT "virtual_sessions_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "virtual_sessions" ADD CONSTRAINT "virtual_sessions_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "virtual_session_participants" ADD CONSTRAINT "virtual_session_participants_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "virtual_sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "virtual_session_participants" ADD CONSTRAINT "virtual_session_participants_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "virtual_session_recordings" ADD CONSTRAINT "virtual_session_recordings_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "virtual_sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "virtual_session_recordings" ADD CONSTRAINT "virtual_session_recordings_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "analytics_metrics" ADD CONSTRAINT "fk_analytics_metrics_created_by" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "analytics_metrics" ADD CONSTRAINT "fk_analytics_metrics_updated_by" FOREIGN KEY ("updated_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "auth_logs" ADD CONSTRAINT "fk_auth_logs_user" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "client_funding" ADD CONSTRAINT "fk_client_funding_client" FOREIGN KEY ("client_id") REFERENCES "clients"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "client_funding" ADD CONSTRAINT "fk_client_funding_created_by" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "client_funding" ADD CONSTRAINT "fk_client_funding_program" FOREIGN KEY ("funding_program_id") REFERENCES "funding_programs"("id") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "client_funding" ADD CONSTRAINT "fk_client_funding_updated_by" FOREIGN KEY ("updated_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "client_insurance" ADD CONSTRAINT "fk_client_insurance_client" FOREIGN KEY ("client_id") REFERENCES "clients"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "client_insurance" ADD CONSTRAINT "fk_client_insurance_created_by" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "client_insurance" ADD CONSTRAINT "fk_client_insurance_provider" FOREIGN KEY ("insurance_provider_id") REFERENCES "insurance_providers"("id") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "client_insurance" ADD CONSTRAINT "fk_client_insurance_updated_by" FOREIGN KEY ("updated_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "client_insurance" ADD CONSTRAINT "fk_client_insurance_verified_by" FOREIGN KEY ("verified_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "communication_access_logs" ADD CONSTRAINT "fk_communication_access_logs_attachment" FOREIGN KEY ("attachment_id") REFERENCES "communication_attachments"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "communication_access_logs" ADD CONSTRAINT "fk_communication_access_logs_communication" FOREIGN KEY ("communication_id") REFERENCES "communications"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "communication_access_logs" ADD CONSTRAINT "fk_communication_access_logs_user" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "communication_attachments" ADD CONSTRAINT "fk_communication_attachments_communication" FOREIGN KEY ("communication_id") REFERENCES "communications"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "communication_attachments" ADD CONSTRAINT "fk_communication_attachments_user" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "content_translations" ADD CONSTRAINT "fk_content_translations_created_by" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "content_translations" ADD CONSTRAINT "fk_content_translations_updated_by" FOREIGN KEY ("updated_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "dashboard_widgets" ADD CONSTRAINT "fk_dashboard_widgets_user" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "funding_authorizations" ADD CONSTRAINT "fk_funding_authorizations_client_funding" FOREIGN KEY ("client_funding_id") REFERENCES "client_funding"("id") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "funding_authorizations" ADD CONSTRAINT "fk_funding_authorizations_created_by" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "funding_authorizations" ADD CONSTRAINT "fk_funding_authorizations_invoice" FOREIGN KEY ("invoice_id") REFERENCES "invoices"("id") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "funding_authorizations" ADD CONSTRAINT "fk_funding_authorizations_updated_by" FOREIGN KEY ("updated_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "funding_programs" ADD CONSTRAINT "fk_funding_programs_created_by" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "funding_programs" ADD CONSTRAINT "fk_funding_programs_updated_by" FOREIGN KEY ("updated_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "insurance_claims" ADD CONSTRAINT "fk_insurance_claims_created_by" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "insurance_claims" ADD CONSTRAINT "fk_insurance_claims_insurance" FOREIGN KEY ("insurance_id") REFERENCES "client_insurance"("id") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "insurance_claims" ADD CONSTRAINT "fk_insurance_claims_invoice" FOREIGN KEY ("invoice_id") REFERENCES "invoices"("id") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "insurance_claims" ADD CONSTRAINT "fk_insurance_claims_updated_by" FOREIGN KEY ("updated_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "insurance_providers" ADD CONSTRAINT "fk_insurance_providers_created_by" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "insurance_providers" ADD CONSTRAINT "fk_insurance_providers_updated_by" FOREIGN KEY ("updated_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "invoice_line_items" ADD CONSTRAINT "fk_invoice_line_items_appointment" FOREIGN KEY ("appointment_id") REFERENCES "appointments"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "invoice_line_items" ADD CONSTRAINT "fk_invoice_line_items_invoice" FOREIGN KEY ("invoice_id") REFERENCES "invoices"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "invoice_line_items" ADD CONSTRAINT "fk_invoice_line_items_learner" FOREIGN KEY ("learner_id") REFERENCES "learners"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "invoice_line_items" ADD CONSTRAINT "fk_invoice_line_items_service_code" FOREIGN KEY ("service_code_id") REFERENCES "service_codes"("id") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "invoices" ADD CONSTRAINT "fk_invoices_client" FOREIGN KEY ("client_id") REFERENCES "clients"("id") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "invoices" ADD CONSTRAINT "fk_invoices_created_by" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "invoices" ADD CONSTRAINT "fk_invoices_funding" FOREIGN KEY ("funding_id") REFERENCES "client_funding"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "invoices" ADD CONSTRAINT "fk_invoices_insurance" FOREIGN KEY ("insurance_id") REFERENCES "client_insurance"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "invoices" ADD CONSTRAINT "fk_invoices_updated_by" FOREIGN KEY ("updated_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "messaging_threads" ADD CONSTRAINT "fk_messaging_threads_client" FOREIGN KEY ("client_id") REFERENCES "clients"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "messaging_threads" ADD CONSTRAINT "fk_messaging_threads_created_by" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "metrics_snapshots" ADD CONSTRAINT "fk_metrics_snapshots_metric" FOREIGN KEY ("metric_id") REFERENCES "analytics_metrics"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "fk_payments_invoice" FOREIGN KEY ("invoice_id") REFERENCES "invoices"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "fk_payments_received_by" FOREIGN KEY ("received_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "practice_locations" ADD CONSTRAINT "fk_practice_locations_created_by" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "practice_locations" ADD CONSTRAINT "fk_practice_locations_practice" FOREIGN KEY ("practice_id") REFERENCES "practice"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "practice_locations" ADD CONSTRAINT "fk_practice_locations_updated_by" FOREIGN KEY ("updated_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "record_permissions" ADD CONSTRAINT "fk_record_permissions_client" FOREIGN KEY ("client_id") REFERENCES "clients"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "record_permissions" ADD CONSTRAINT "fk_record_permissions_granted_by" FOREIGN KEY ("granted_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "record_permissions" ADD CONSTRAINT "fk_record_permissions_learner" FOREIGN KEY ("learner_id") REFERENCES "learners"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "record_permissions" ADD CONSTRAINT "fk_record_permissions_permission" FOREIGN KEY ("permission_id") REFERENCES "permission_types"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "record_permissions" ADD CONSTRAINT "fk_record_permissions_user" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "role_permissions" ADD CONSTRAINT "fk_role_permissions_permission" FOREIGN KEY ("permission_id") REFERENCES "permission_types"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "service_codes" ADD CONSTRAINT "fk_service_codes_created_by" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "service_codes" ADD CONSTRAINT "fk_service_codes_updated_by" FOREIGN KEY ("updated_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "user_locations" ADD CONSTRAINT "fk_user_locations_location" FOREIGN KEY ("location_id") REFERENCES "practice_locations"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "user_locations" ADD CONSTRAINT "fk_user_locations_user" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "user_permissions" ADD CONSTRAINT "fk_user_permissions_granted_by" FOREIGN KEY ("granted_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "user_permissions" ADD CONSTRAINT "fk_user_permissions_permission" FOREIGN KEY ("permission_id") REFERENCES "permission_types"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "user_permissions" ADD CONSTRAINT "fk_user_permissions_user" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION;
