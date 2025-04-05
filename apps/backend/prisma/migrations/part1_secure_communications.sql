-- 1. Secure Communication Enhancements for PIPEDA Compliance
-- Add new enum types for enhanced communications
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'security_classification') THEN
        CREATE TYPE "security_classification" AS ENUM (
            'PUBLIC',
            'PERSONAL',
            'CONFIDENTIAL',
            'RESTRICTED'
        );
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'encryption_status') THEN
        CREATE TYPE "encryption_status" AS ENUM (
            'UNENCRYPTED',
            'ENCRYPTED_AT_REST',
            'ENCRYPTED_IN_TRANSIT',
            'FULLY_ENCRYPTED'
        );
    END IF;
END$$;

-- Add message attachments table
CREATE TABLE IF NOT EXISTS "communication_attachments" (
    "id" BIGSERIAL PRIMARY KEY,
    "communication_id" BIGINT NOT NULL,
    "file_name" TEXT NOT NULL,
    "file_type" TEXT NOT NULL,
    "file_size" INTEGER NOT NULL,
    "file_path" TEXT NOT NULL,
    "upload_date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "security_classification" security_classification NOT NULL DEFAULT 'PERSONAL',
    "encryption_status" encryption_status NOT NULL DEFAULT 'ENCRYPTED_AT_REST',
    "checksum" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by" BIGINT,
    CONSTRAINT "fk_communication_attachments_communication" 
        FOREIGN KEY ("communication_id") REFERENCES "communications"("id") 
        ON DELETE CASCADE ON UPDATE NO ACTION,
    CONSTRAINT "fk_communication_attachments_user" 
        FOREIGN KEY ("created_by") REFERENCES "users"("id") 
        ON DELETE SET NULL ON UPDATE NO ACTION
);

-- Create access log for communications audit trail (PIPEDA compliance)
CREATE TABLE IF NOT EXISTS "communication_access_logs" (
    "id" BIGSERIAL PRIMARY KEY,
    "communication_id" BIGINT,
    "attachment_id" BIGINT,
    "user_id" BIGINT NOT NULL,
    "access_type" TEXT NOT NULL, -- VIEW, DOWNLOAD, PRINT, etc.
    "access_timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ip_address" TEXT,
    "user_agent" TEXT,
    "success" BOOLEAN NOT NULL DEFAULT true,
    CONSTRAINT "fk_communication_access_logs_communication" 
        FOREIGN KEY ("communication_id") REFERENCES "communications"("id") 
        ON DELETE SET NULL ON UPDATE NO ACTION,
    CONSTRAINT "fk_communication_access_logs_attachment" 
        FOREIGN KEY ("attachment_id") REFERENCES "communication_attachments"("id") 
        ON DELETE SET NULL ON UPDATE NO ACTION,
    CONSTRAINT "fk_communication_access_logs_user" 
        FOREIGN KEY ("user_id") REFERENCES "users"("id") 
        ON DELETE CASCADE ON UPDATE NO ACTION
);

-- Enhance communications table with security and privacy features
ALTER TABLE "communications"
ADD COLUMN IF NOT EXISTS "is_encrypted" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS "encryption_status" encryption_status,
ADD COLUMN IF NOT EXISTS "security_classification" security_classification,
ADD COLUMN IF NOT EXISTS "retention_period_days" INTEGER,
ADD COLUMN IF NOT EXISTS "expiration_date" TIMESTAMP(3),
ADD COLUMN IF NOT EXISTS "is_read" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS "read_at" TIMESTAMP(3),
ADD COLUMN IF NOT EXISTS "read_by" BIGINT,
ADD COLUMN IF NOT EXISTS "requires_signature" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS "signed_at" TIMESTAMP(3),
ADD COLUMN IF NOT EXISTS "signed_by" BIGINT,
ADD CONSTRAINT "fk_communications_read_by" 
    FOREIGN KEY ("read_by") REFERENCES "users"("id") 
    ON DELETE SET NULL ON UPDATE NO ACTION,
ADD CONSTRAINT "fk_communications_signed_by" 
    FOREIGN KEY ("signed_by") REFERENCES "users"("id") 
    ON DELETE SET NULL ON UPDATE NO ACTION;

-- Create parent/caregiver messaging threads
CREATE TABLE IF NOT EXISTS "messaging_threads" (
    "id" BIGSERIAL PRIMARY KEY,
    "subject" TEXT NOT NULL,
    "client_id" BIGINT NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "created_by" BIGINT,
    "last_message_at" TIMESTAMP(3),
    CONSTRAINT "fk_messaging_threads_client" 
        FOREIGN KEY ("client_id") REFERENCES "clients"("id") 
        ON DELETE CASCADE ON UPDATE NO ACTION,
    CONSTRAINT "fk_messaging_threads_created_by" 
        FOREIGN KEY ("created_by") REFERENCES "users"("id") 
        ON DELETE SET NULL ON UPDATE NO ACTION
);

-- Link communications to threads
ALTER TABLE "communications"
ADD COLUMN IF NOT EXISTS "thread_id" BIGINT,
ADD CONSTRAINT "fk_communications_thread" 
    FOREIGN KEY ("thread_id") REFERENCES "messaging_threads"("id") 
    ON DELETE SET NULL ON UPDATE NO ACTION;
