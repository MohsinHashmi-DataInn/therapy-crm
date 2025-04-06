-- Document Storage Tables

-- Document Categories
CREATE TABLE IF NOT EXISTS "document_categories" (
  "id" BIGSERIAL PRIMARY KEY,
  "name" VARCHAR(100) NOT NULL,
  "description" TEXT,
  "created_at" TIMESTAMP NOT NULL DEFAULT NOW(),
  "updated_at" TIMESTAMP NOT NULL DEFAULT NOW(),
  "created_by" BIGINT,
  "updated_by" BIGINT,
  CONSTRAINT "document_categories_name_key" UNIQUE ("name"),
  CONSTRAINT "fk_document_categories_created_by" FOREIGN KEY ("created_by") REFERENCES "users" ("id"),
  CONSTRAINT "fk_document_categories_updated_by" FOREIGN KEY ("updated_by") REFERENCES "users" ("id")
);

-- Documents
CREATE TABLE IF NOT EXISTS "documents" (
  "id" BIGSERIAL PRIMARY KEY,
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
  "upload_date" TIMESTAMP NOT NULL DEFAULT NOW(),
  "description" TEXT,
  "tags" VARCHAR(255)[],
  "security_classification" security_classification NOT NULL DEFAULT 'CONFIDENTIAL',
  "is_encrypted" BOOLEAN NOT NULL DEFAULT TRUE,
  "encryption_key_id" VARCHAR(255),
  "checksum" VARCHAR(255) NOT NULL,
  "retention_period_days" INTEGER,
  "expiration_date" TIMESTAMP,
  "version" INTEGER NOT NULL DEFAULT 1,
  "is_latest_version" BOOLEAN NOT NULL DEFAULT TRUE,
  "parent_document_id" BIGINT,
  "created_at" TIMESTAMP NOT NULL DEFAULT NOW(),
  "updated_at" TIMESTAMP NOT NULL DEFAULT NOW(),
  "created_by" BIGINT NOT NULL,
  "updated_by" BIGINT NOT NULL,
  CONSTRAINT "fk_documents_category" FOREIGN KEY ("category_id") REFERENCES "document_categories" ("id"),
  CONSTRAINT "fk_documents_client" FOREIGN KEY ("client_id") REFERENCES "clients" ("id") ON DELETE CASCADE,
  CONSTRAINT "fk_documents_learner" FOREIGN KEY ("learner_id") REFERENCES "learners" ("id") ON DELETE CASCADE,
  CONSTRAINT "fk_documents_uploader" FOREIGN KEY ("uploader_id") REFERENCES "users" ("id"),
  CONSTRAINT "fk_documents_parent" FOREIGN KEY ("parent_document_id") REFERENCES "documents" ("id"),
  CONSTRAINT "fk_documents_created_by" FOREIGN KEY ("created_by") REFERENCES "users" ("id"),
  CONSTRAINT "fk_documents_updated_by" FOREIGN KEY ("updated_by") REFERENCES "users" ("id")
);

-- Document Permissions
CREATE TABLE IF NOT EXISTS "document_permissions" (
  "id" BIGSERIAL PRIMARY KEY,
  "document_id" BIGINT NOT NULL,
  "user_id" BIGINT NOT NULL,
  "permission_type" VARCHAR(50) NOT NULL,
  "granted_at" TIMESTAMP NOT NULL DEFAULT NOW(),
  "expires_at" TIMESTAMP,
  "created_at" TIMESTAMP NOT NULL DEFAULT NOW(),
  "created_by" BIGINT NOT NULL,
  CONSTRAINT "document_permissions_document_id_user_id_permission_type_key" UNIQUE ("document_id", "user_id", "permission_type"),
  CONSTRAINT "fk_document_permissions_document" FOREIGN KEY ("document_id") REFERENCES "documents" ("id") ON DELETE CASCADE,
  CONSTRAINT "fk_document_permissions_user" FOREIGN KEY ("user_id") REFERENCES "users" ("id"),
  CONSTRAINT "fk_document_permissions_granter" FOREIGN KEY ("created_by") REFERENCES "users" ("id")
);

-- Document Access Logs
CREATE TABLE IF NOT EXISTS "document_access_logs" (
  "id" BIGSERIAL PRIMARY KEY,
  "document_id" BIGINT NOT NULL,
  "user_id" BIGINT NOT NULL,
  "action_type" VARCHAR(50) NOT NULL,
  "access_timestamp" TIMESTAMP NOT NULL DEFAULT NOW(),
  "ip_address" VARCHAR(45),
  "user_agent" VARCHAR(255),
  "additional_info" TEXT,
  CONSTRAINT "fk_document_access_logs_document" FOREIGN KEY ("document_id") REFERENCES "documents" ("id") ON DELETE CASCADE,
  CONSTRAINT "fk_document_access_logs_user" FOREIGN KEY ("user_id") REFERENCES "users" ("id")
);

-- Telehealth Tables

-- Telehealth Providers
CREATE TABLE IF NOT EXISTS "telehealth_providers" (
  "id" BIGSERIAL PRIMARY KEY,
  "name" VARCHAR(100) NOT NULL,
  "description" TEXT,
  "api_endpoint" VARCHAR(255),
  "api_key_name" VARCHAR(100),
  "api_secret_name" VARCHAR(100),
  "supports_recording" BOOLEAN NOT NULL DEFAULT FALSE,
  "supports_screen_sharing" BOOLEAN NOT NULL DEFAULT FALSE,
  "supports_waiting_room" BOOLEAN NOT NULL DEFAULT FALSE,
  "supports_breakout_rooms" BOOLEAN NOT NULL DEFAULT FALSE,
  "max_participants" INTEGER,
  "max_duration_minutes" INTEGER,
  "is_active" BOOLEAN NOT NULL DEFAULT TRUE,
  "created_at" TIMESTAMP NOT NULL DEFAULT NOW(),
  "updated_at" TIMESTAMP NOT NULL DEFAULT NOW(),
  "created_by" BIGINT,
  "updated_by" BIGINT,
  CONSTRAINT "telehealth_providers_name_key" UNIQUE ("name"),
  CONSTRAINT "fk_telehealth_providers_created_by" FOREIGN KEY ("created_by") REFERENCES "users" ("id"),
  CONSTRAINT "fk_telehealth_providers_updated_by" FOREIGN KEY ("updated_by") REFERENCES "users" ("id")
);

-- Virtual Sessions
CREATE TABLE IF NOT EXISTS "virtual_sessions" (
  "id" BIGSERIAL PRIMARY KEY,
  "appointment_id" BIGINT,
  "provider_id" BIGINT NOT NULL,
  "meeting_id" VARCHAR(255) NOT NULL,
  "meeting_password" VARCHAR(255),
  "host_link" VARCHAR(1024) NOT NULL,
  "join_link" VARCHAR(1024) NOT NULL,
  "scheduled_start_time" TIMESTAMP NOT NULL,
  "scheduled_end_time" TIMESTAMP NOT NULL,
  "actual_start_time" TIMESTAMP,
  "actual_end_time" TIMESTAMP,
  "duration_minutes" INTEGER,
  "status" VARCHAR(50) NOT NULL DEFAULT 'SCHEDULED',
  "cancellation_reason" TEXT,
  "notes" TEXT,
  "created_at" TIMESTAMP NOT NULL DEFAULT NOW(),
  "updated_at" TIMESTAMP NOT NULL DEFAULT NOW(),
  "created_by" BIGINT NOT NULL,
  "updated_by" BIGINT NOT NULL,
  CONSTRAINT "fk_virtual_sessions_appointment" FOREIGN KEY ("appointment_id") REFERENCES "appointments" ("id") ON DELETE CASCADE,
  CONSTRAINT "fk_virtual_sessions_provider" FOREIGN KEY ("provider_id") REFERENCES "telehealth_providers" ("id"),
  CONSTRAINT "fk_virtual_sessions_created_by" FOREIGN KEY ("created_by") REFERENCES "users" ("id"),
  CONSTRAINT "fk_virtual_sessions_updated_by" FOREIGN KEY ("updated_by") REFERENCES "users" ("id")
);

-- Virtual Session Participants
CREATE TABLE IF NOT EXISTS "virtual_session_participants" (
  "id" BIGSERIAL PRIMARY KEY,
  "session_id" BIGINT NOT NULL,
  "participant_type" VARCHAR(50) NOT NULL,
  "user_id" BIGINT,
  "external_email" VARCHAR(255),
  "external_name" VARCHAR(255),
  "personal_join_link" VARCHAR(1024),
  "join_token" VARCHAR(255),
  "attended" BOOLEAN DEFAULT FALSE,
  "join_time" TIMESTAMP,
  "leave_time" TIMESTAMP,
  "duration_minutes" INTEGER,
  "created_at" TIMESTAMP NOT NULL DEFAULT NOW(),
  "updated_at" TIMESTAMP NOT NULL DEFAULT NOW(),
  CONSTRAINT "fk_virtual_session_participants_session" FOREIGN KEY ("session_id") REFERENCES "virtual_sessions" ("id") ON DELETE CASCADE,
  CONSTRAINT "fk_virtual_session_participants_user" FOREIGN KEY ("user_id") REFERENCES "users" ("id")
);

-- Virtual Session Recordings
CREATE TABLE IF NOT EXISTS "virtual_session_recordings" (
  "id" BIGSERIAL PRIMARY KEY,
  "session_id" BIGINT NOT NULL,
  "recording_url" VARCHAR(1024) NOT NULL,
  "recording_type" VARCHAR(50) NOT NULL,
  "start_time" TIMESTAMP NOT NULL,
  "end_time" TIMESTAMP,
  "duration_minutes" INTEGER,
  "file_size_bytes" BIGINT,
  "is_processing" BOOLEAN NOT NULL DEFAULT FALSE,
  "is_available" BOOLEAN NOT NULL DEFAULT FALSE,
  "created_at" TIMESTAMP NOT NULL DEFAULT NOW(),
  "updated_at" TIMESTAMP NOT NULL DEFAULT NOW(),
  "created_by" BIGINT NOT NULL,
  CONSTRAINT "fk_virtual_session_recordings_session" FOREIGN KEY ("session_id") REFERENCES "virtual_sessions" ("id") ON DELETE CASCADE,
  CONSTRAINT "fk_virtual_session_recordings_creator" FOREIGN KEY ("created_by") REFERENCES "users" ("id")
);

-- Initial data for Telehealth Providers
INSERT INTO "telehealth_providers" 
  ("name", "description", "api_endpoint", "api_key_name", "api_secret_name", "supports_recording", "supports_screen_sharing", "supports_waiting_room", "supports_breakout_rooms", "max_participants", "max_duration_minutes", "is_active") 
VALUES 
  ('Zoom', 'Zoom Video Communications integration', 'https://api.zoom.us/v2', 'ZOOM_API_KEY', 'ZOOM_API_SECRET', TRUE, TRUE, TRUE, TRUE, 100, 60, TRUE),
  ('Microsoft Teams', 'Microsoft Teams integration', 'https://graph.microsoft.com/v1.0', 'MS_TEAMS_CLIENT_ID', 'MS_TEAMS_CLIENT_SECRET', TRUE, TRUE, TRUE, TRUE, 300, 60, TRUE),
  ('Doxy.me', 'Doxy.me telemedicine platform', 'https://api.doxy.me/v1', 'DOXYME_API_KEY', 'DOXYME_API_SECRET', FALSE, TRUE, TRUE, FALSE, 50, 60, TRUE);

-- Add RECEPTIONIST to user_role enum if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type JOIN pg_enum ON pg_enum.enumtypid = pg_type.oid 
                  WHERE pg_type.typname = 'user_role' AND pg_enum.enumlabel = 'RECEPTIONIST') THEN
        ALTER TYPE user_role ADD VALUE 'RECEPTIONIST';
    END IF;
END$$;

-- Update the security_classification enum to ensure INTERNAL is available
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type JOIN pg_enum ON pg_enum.enumtypid = pg_type.oid 
                  WHERE pg_type.typname = 'security_classification' AND pg_enum.enumlabel = 'INTERNAL') THEN
        IF EXISTS (SELECT 1 FROM pg_type JOIN pg_enum ON pg_enum.enumtypid = pg_type.oid 
                  WHERE pg_type.typname = 'security_classification' AND pg_enum.enumlabel = 'PERSONAL') THEN
            -- This is more complex and might require custom migration
            -- For simplicity, we leave this as a comment to handle manually if needed
            -- ALTER TYPE security_classification RENAME VALUE 'PERSONAL' TO 'INTERNAL';
            RAISE NOTICE 'Need to manually rename PERSONAL to INTERNAL in security_classification enum';
        ELSE
            ALTER TYPE security_classification ADD VALUE 'INTERNAL';
        END IF;
    END IF;
END$$;
