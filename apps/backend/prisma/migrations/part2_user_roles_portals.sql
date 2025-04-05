-- 2. Enhanced User Roles and Parent/Caregiver Portal

-- Add new user roles for caregivers and specialized staff
ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'CAREGIVER';
ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'PARENT';
ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'SUPERVISOR';
ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'BILLING_STAFF';

-- Create caregiver/parent accounts linked to clients
CREATE TABLE IF NOT EXISTS "client_guardians" (
    "id" BIGSERIAL PRIMARY KEY,
    "client_id" BIGINT NOT NULL,
    "user_id" BIGINT NOT NULL,
    "relationship_type" relationship_type NOT NULL,
    "is_emergency_contact" BOOLEAN NOT NULL DEFAULT false,
    "is_authorized_pickup" BOOLEAN NOT NULL DEFAULT false,
    "is_billing_contact" BOOLEAN NOT NULL DEFAULT false,
    "is_primary_contact" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "notes" TEXT,
    CONSTRAINT "fk_client_guardians_client" 
        FOREIGN KEY ("client_id") REFERENCES "clients"("id") 
        ON DELETE CASCADE ON UPDATE NO ACTION,
    CONSTRAINT "fk_client_guardians_user" 
        FOREIGN KEY ("user_id") REFERENCES "users"("id") 
        ON DELETE CASCADE ON UPDATE NO ACTION,
    CONSTRAINT "unique_client_user_relationship" 
        UNIQUE ("client_id", "user_id")
);

-- Create permissions management system
CREATE TABLE IF NOT EXISTS "permission_types" (
    "id" BIGSERIAL PRIMARY KEY,
    "name" TEXT NOT NULL UNIQUE,
    "description" TEXT,
    "category" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Insert base permission types
INSERT INTO "permission_types" ("name", "description", "category") VALUES
('VIEW_APPOINTMENTS', 'View appointment details', 'APPOINTMENTS'),
('MANAGE_APPOINTMENTS', 'Create and modify appointments', 'APPOINTMENTS'),
('VIEW_CLIENT_BASIC', 'View basic client information', 'CLIENTS'),
('VIEW_CLIENT_MEDICAL', 'View client medical information', 'CLIENTS'),
('MANAGE_CLIENTS', 'Create and modify client records', 'CLIENTS'),
('VIEW_PROGRESS_NOTES', 'View progress notes', 'CLINICAL'),
('CREATE_PROGRESS_NOTES', 'Create progress notes', 'CLINICAL'),
('VIEW_INVOICES', 'View invoice information', 'BILLING'),
('MANAGE_INVOICES', 'Create and modify invoices', 'BILLING'),
('VIEW_REPORTS', 'View system reports', 'REPORTS'),
('ACCESS_PARENT_PORTAL', 'Access parent/guardian portal', 'PORTAL')
ON CONFLICT DO NOTHING;

-- Create role-based permissions
CREATE TABLE IF NOT EXISTS "role_permissions" (
    "id" BIGSERIAL PRIMARY KEY,
    "role" user_role NOT NULL,
    "permission_id" BIGINT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "fk_role_permissions_permission" 
        FOREIGN KEY ("permission_id") REFERENCES "permission_types"("id") 
        ON DELETE CASCADE ON UPDATE NO ACTION,
    CONSTRAINT "unique_role_permission" 
        UNIQUE ("role", "permission_id")
);

-- Create user-specific permissions (overrides role permissions)
CREATE TABLE IF NOT EXISTS "user_permissions" (
    "id" BIGSERIAL PRIMARY KEY,
    "user_id" BIGINT NOT NULL,
    "permission_id" BIGINT NOT NULL,
    "granted" BOOLEAN NOT NULL DEFAULT true,
    "granted_by" BIGINT,
    "granted_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expires_at" TIMESTAMP(3),
    CONSTRAINT "fk_user_permissions_user" 
        FOREIGN KEY ("user_id") REFERENCES "users"("id") 
        ON DELETE CASCADE ON UPDATE NO ACTION,
    CONSTRAINT "fk_user_permissions_permission" 
        FOREIGN KEY ("permission_id") REFERENCES "permission_types"("id") 
        ON DELETE CASCADE ON UPDATE NO ACTION,
    CONSTRAINT "fk_user_permissions_granted_by" 
        FOREIGN KEY ("granted_by") REFERENCES "users"("id") 
        ON DELETE SET NULL ON UPDATE NO ACTION,
    CONSTRAINT "unique_user_permission" 
        UNIQUE ("user_id", "permission_id")
);

-- Record-level permissions for specific clients/learners
CREATE TABLE IF NOT EXISTS "record_permissions" (
    "id" BIGSERIAL PRIMARY KEY,
    "user_id" BIGINT NOT NULL,
    "permission_id" BIGINT NOT NULL,
    "client_id" BIGINT,
    "learner_id" BIGINT,
    "granted" BOOLEAN NOT NULL DEFAULT true,
    "granted_by" BIGINT,
    "granted_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expires_at" TIMESTAMP(3),
    CONSTRAINT "fk_record_permissions_user" 
        FOREIGN KEY ("user_id") REFERENCES "users"("id") 
        ON DELETE CASCADE ON UPDATE NO ACTION,
    CONSTRAINT "fk_record_permissions_permission" 
        FOREIGN KEY ("permission_id") REFERENCES "permission_types"("id") 
        ON DELETE CASCADE ON UPDATE NO ACTION,
    CONSTRAINT "fk_record_permissions_client" 
        FOREIGN KEY ("client_id") REFERENCES "clients"("id") 
        ON DELETE CASCADE ON UPDATE NO ACTION,
    CONSTRAINT "fk_record_permissions_learner" 
        FOREIGN KEY ("learner_id") REFERENCES "learners"("id") 
        ON DELETE CASCADE ON UPDATE NO ACTION,
    CONSTRAINT "fk_record_permissions_granted_by" 
        FOREIGN KEY ("granted_by") REFERENCES "users"("id") 
        ON DELETE SET NULL ON UPDATE NO ACTION,
    CONSTRAINT "check_client_or_learner" 
        CHECK (
            (client_id IS NOT NULL AND learner_id IS NULL) OR
            (client_id IS NULL AND learner_id IS NOT NULL)
        )
);

-- Add portal-specific fields to users
ALTER TABLE "users"
ADD COLUMN IF NOT EXISTS "portal_access" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS "portal_last_login" TIMESTAMP(3),
ADD COLUMN IF NOT EXISTS "require_password_change" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS "account_locked" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS "failed_login_attempts" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS "password_reset_token" TEXT,
ADD COLUMN IF NOT EXISTS "password_reset_expires" TIMESTAMP(3),
ADD COLUMN IF NOT EXISTS "last_password_change" TIMESTAMP(3);

-- Enhanced authentication logs
CREATE TABLE IF NOT EXISTS "auth_logs" (
    "id" BIGSERIAL PRIMARY KEY,
    "user_id" BIGINT NOT NULL,
    "action" TEXT NOT NULL, -- LOGIN, LOGOUT, PASSWORD_RESET, etc.
    "ip_address" TEXT,
    "user_agent" TEXT,
    "success" BOOLEAN NOT NULL DEFAULT true,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "details" TEXT,
    CONSTRAINT "fk_auth_logs_user" 
        FOREIGN KEY ("user_id") REFERENCES "users"("id") 
        ON DELETE CASCADE ON UPDATE NO ACTION
);
