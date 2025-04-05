-- 5. Enhanced Notification Preferences with CASL Compliance

-- Add notification types for autism therapy
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'notification_type') THEN
        CREATE TYPE "notification_type" AS ENUM (
            'APPOINTMENT_REMINDER',
            'APPOINTMENT_CONFIRMATION',
            'APPOINTMENT_CANCELLATION',
            'APPOINTMENT_RESCHEDULED',
            'INVOICE_CREATED',
            'PAYMENT_RECEIVED',
            'DOCUMENT_SHARED',
            'PROGRESS_NOTE_CREATED',
            'GOAL_UPDATED',
            'ASSESSMENT_SCHEDULED',
            'THERAPY_PLAN_UPDATED',
            'COMMUNICATION_RECEIVED',
            'FUNDING_UPDATE',
            'INSURANCE_CLAIM_UPDATE',
            'SYSTEM_ANNOUNCEMENT'
        );
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'notification_delivery_status') THEN
        CREATE TYPE "notification_delivery_status" AS ENUM (
            'PENDING',
            'SENT',
            'DELIVERED',
            'FAILED',
            'READ'
        );
    END IF;
END$$;

-- Enhance notification preferences table
DROP TABLE IF EXISTS "notification_preferences";

CREATE TABLE IF NOT EXISTS "notification_preferences" (
    "id" BIGSERIAL PRIMARY KEY,
    "user_id" BIGINT NOT NULL,
    "email_notifications" BOOLEAN NOT NULL DEFAULT true,
    "sms_notifications" BOOLEAN NOT NULL DEFAULT false,
    "push_notifications" BOOLEAN NOT NULL DEFAULT false,
    "in_app_notifications" BOOLEAN NOT NULL DEFAULT true,
    -- CASL Compliance fields
    "email_consent_given" BOOLEAN NOT NULL DEFAULT false,
    "email_consent_date" TIMESTAMP(3),
    "email_consent_ip" TEXT,
    "sms_consent_given" BOOLEAN NOT NULL DEFAULT false,
    "sms_consent_date" TIMESTAMP(3),
    "sms_consent_ip" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "updated_by" BIGINT,
    CONSTRAINT "fk_notification_preferences_user" 
        FOREIGN KEY ("user_id") REFERENCES "users"("id") 
        ON DELETE CASCADE ON UPDATE NO ACTION,
    CONSTRAINT "fk_notification_preferences_updated_by" 
        FOREIGN KEY ("updated_by") REFERENCES "users"("id") 
        ON DELETE SET NULL ON UPDATE NO ACTION,
    CONSTRAINT "unique_user_notification_preferences" 
        UNIQUE ("user_id")
);

-- Create table for per-notification type preferences
CREATE TABLE IF NOT EXISTS "notification_type_preferences" (
    "id" BIGSERIAL PRIMARY KEY,
    "user_id" BIGINT NOT NULL,
    "notification_type" notification_type NOT NULL,
    "email_enabled" BOOLEAN NOT NULL DEFAULT true,
    "sms_enabled" BOOLEAN NOT NULL DEFAULT false,
    "push_enabled" BOOLEAN NOT NULL DEFAULT false,
    "in_app_enabled" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "fk_notification_type_preferences_user" 
        FOREIGN KEY ("user_id") REFERENCES "users"("id") 
        ON DELETE CASCADE ON UPDATE NO ACTION,
    CONSTRAINT "unique_user_notification_type" 
        UNIQUE ("user_id", "notification_type")
);

-- Create custom reminder settings
CREATE TABLE IF NOT EXISTS "custom_reminder_settings" (
    "id" BIGSERIAL PRIMARY KEY,
    "user_id" BIGINT NOT NULL,
    "reminder_type" notification_type NOT NULL,
    "advance_notice_hours" INTEGER NOT NULL, -- How many hours before the event
    "secondary_reminder_hours" INTEGER, -- Optional second reminder
    "email_template_id" TEXT,
    "sms_template_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "fk_custom_reminder_settings_user" 
        FOREIGN KEY ("user_id") REFERENCES "users"("id") 
        ON DELETE CASCADE ON UPDATE NO ACTION
);

-- Create client notification preferences (for caregivers/parents)
CREATE TABLE IF NOT EXISTS "client_notification_preferences" (
    "id" BIGSERIAL PRIMARY KEY,
    "client_id" BIGINT NOT NULL,
    "email_notifications" BOOLEAN NOT NULL DEFAULT true,
    "sms_notifications" BOOLEAN NOT NULL DEFAULT false,
    "therapy_reminders" BOOLEAN NOT NULL DEFAULT true,
    "appointment_changes" BOOLEAN NOT NULL DEFAULT true,
    "progress_updates" BOOLEAN NOT NULL DEFAULT true,
    "billing_notifications" BOOLEAN NOT NULL DEFAULT true,
    -- CASL Compliance fields
    "email_consent_given" BOOLEAN NOT NULL DEFAULT false,
    "email_consent_date" TIMESTAMP(3),
    "email_consent_ip" TEXT,
    "sms_consent_given" BOOLEAN NOT NULL DEFAULT false,
    "sms_consent_date" TIMESTAMP(3),
    "sms_consent_ip" TEXT,
    "preferred_reminder_time" TEXT, -- e.g., "EVENING", "MORNING"
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "updated_by" BIGINT,
    CONSTRAINT "fk_client_notification_preferences_client" 
        FOREIGN KEY ("client_id") REFERENCES "clients"("id") 
        ON DELETE CASCADE ON UPDATE NO ACTION,
    CONSTRAINT "fk_client_notification_preferences_updated_by" 
        FOREIGN KEY ("updated_by") REFERENCES "users"("id") 
        ON DELETE SET NULL ON UPDATE NO ACTION,
    CONSTRAINT "unique_client_notification_preferences" 
        UNIQUE ("client_id")
);

-- Create notifications log
CREATE TABLE IF NOT EXISTS "notification_logs" (
    "id" BIGSERIAL PRIMARY KEY,
    "user_id" BIGINT,
    "client_id" BIGINT,
    "notification_type" notification_type NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "delivery_channel" TEXT NOT NULL, -- EMAIL, SMS, PUSH, IN_APP
    "status" notification_delivery_status NOT NULL DEFAULT 'PENDING',
    "sent_at" TIMESTAMP(3),
    "delivered_at" TIMESTAMP(3),
    "read_at" TIMESTAMP(3),
    "error_message" TEXT,
    "reference_id" TEXT, -- External reference ID (e.g., from email or SMS service)
    "related_entity_type" TEXT, -- APPOINTMENT, INVOICE, etc.
    "related_entity_id" BIGINT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "fk_notification_logs_user" 
        FOREIGN KEY ("user_id") REFERENCES "users"("id") 
        ON DELETE SET NULL ON UPDATE NO ACTION,
    CONSTRAINT "fk_notification_logs_client" 
        FOREIGN KEY ("client_id") REFERENCES "clients"("id") 
        ON DELETE SET NULL ON UPDATE NO ACTION
);

-- Create notification templates
CREATE TABLE IF NOT EXISTS "notification_templates" (
    "id" BIGSERIAL PRIMARY KEY,
    "template_code" TEXT NOT NULL UNIQUE,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "notification_type" notification_type NOT NULL,
    "subject" TEXT,
    "email_body" TEXT,
    "sms_body" TEXT,
    "push_body" TEXT,
    "in_app_body" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "variables" TEXT, -- JSON string of available variables
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "created_by" BIGINT,
    "updated_by" BIGINT,
    CONSTRAINT "fk_notification_templates_created_by" 
        FOREIGN KEY ("created_by") REFERENCES "users"("id") 
        ON DELETE SET NULL ON UPDATE NO ACTION,
    CONSTRAINT "fk_notification_templates_updated_by" 
        FOREIGN KEY ("updated_by") REFERENCES "users"("id") 
        ON DELETE SET NULL ON UPDATE NO ACTION
);

-- Insert default notification templates
INSERT INTO "notification_templates" 
("template_code", "name", "description", "notification_type", "subject", "email_body", "sms_body") VALUES
('APPOINTMENT_REMINDER', 'Appointment Reminder', 'Sent to remind clients of upcoming appointments', 'APPOINTMENT_REMINDER', 
 'Reminder: Your appointment on {{appointment_date}}', 
 '<p>Dear {{client_name}},</p><p>This is a reminder of your upcoming appointment:</p><p><strong>Date:</strong> {{appointment_date}}<br><strong>Time:</strong> {{appointment_time}}<br><strong>Location:</strong> {{location}}<br><strong>Therapist:</strong> {{therapist_name}}</p><p>Please arrive 10 minutes early to complete any necessary paperwork.</p><p>If you need to reschedule, please contact us at least 24 hours in advance at {{practice_phone}}.</p>',
 'Reminder: You have an appointment on {{appointment_date}} at {{appointment_time}} with {{therapist_name}}. Please call {{practice_phone}} if you need to reschedule.'),

('ASSESSMENT_SCHEDULED', 'Assessment Scheduled', 'Notification for upcoming assessments', 'ASSESSMENT_SCHEDULED', 
 'Your upcoming assessment on {{assessment_date}}', 
 '<p>Dear {{client_name}},</p><p>This is to confirm your scheduled assessment:</p><p><strong>Date:</strong> {{assessment_date}}<br><strong>Time:</strong> {{assessment_time}}<br><strong>Location:</strong> {{location}}<br><strong>Type:</strong> {{assessment_type}}<br><strong>Assessor:</strong> {{therapist_name}}</p><p>Please bring any previous assessments or reports to this appointment. The assessment will take approximately {{assessment_duration}} hours.</p>',
 'Your assessment is scheduled for {{assessment_date}} at {{assessment_time}}. Please bring previous reports. Assessment duration: {{assessment_duration}} hours.'),

('PROGRESS_NOTE_CREATED', 'Progress Note Created', 'Notification when a new progress note is created', 'PROGRESS_NOTE_CREATED', 
 'New progress note available for {{learner_name}}', 
 '<p>Dear {{client_name}},</p><p>A new progress note has been added for {{learner_name}} following the session on {{session_date}}.</p><p>You can view this progress note by logging into your parent portal. If you have any questions about your child\'s progress, please don\'t hesitate to contact your therapist.</p>',
 'A new progress note for {{learner_name}} from {{session_date}} is now available in your parent portal.')
ON CONFLICT DO NOTHING;
