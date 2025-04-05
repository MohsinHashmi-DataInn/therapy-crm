-- Add TherapistRole enum if it doesn't exist
CREATE TYPE IF NOT EXISTS "therapist_role" AS ENUM ('PRIMARY', 'ASSISTANT', 'SUPERVISOR', 'OBSERVER');

-- Add RecurrenceFrequency enum if it doesn't exist
CREATE TYPE IF NOT EXISTS "recurrence_frequency" AS ENUM ('DAILY', 'WEEKLY', 'BIWEEKLY', 'MONTHLY', 'CUSTOM');

-- Create therapy_rooms table if it doesn't exist
CREATE TABLE IF NOT EXISTS "therapy_rooms" (
  "id" BIGSERIAL PRIMARY KEY,
  "name" TEXT NOT NULL,
  "capacity" INTEGER,
  "description" TEXT,
  "equipment" TEXT,
  "is_active" BOOLEAN NOT NULL DEFAULT true,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  "created_by" BIGINT,
  "updated_by" BIGINT,
  FOREIGN KEY ("created_by") REFERENCES "users"("id"),
  FOREIGN KEY ("updated_by") REFERENCES "users"("id")
);

-- Create therapy_equipment table if it doesn't exist
CREATE TABLE IF NOT EXISTS "therapy_equipment" (
  "id" BIGSERIAL PRIMARY KEY,
  "name" TEXT NOT NULL,
  "description" TEXT,
  "quantity" INTEGER NOT NULL DEFAULT 1,
  "is_available" BOOLEAN NOT NULL DEFAULT true,
  "notes" TEXT,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  "created_by" BIGINT,
  "updated_by" BIGINT,
  FOREIGN KEY ("created_by") REFERENCES "users"("id"),
  FOREIGN KEY ("updated_by") REFERENCES "users"("id")
);

-- Create appointment_recurrence_patterns table if it doesn't exist
CREATE TABLE IF NOT EXISTS "appointment_recurrence_patterns" (
  "id" BIGSERIAL PRIMARY KEY,
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
  FOREIGN KEY ("created_by") REFERENCES "users"("id"),
  FOREIGN KEY ("updated_by") REFERENCES "users"("id")
);

-- Add new columns to appointments table
ALTER TABLE "appointments"
ADD COLUMN IF NOT EXISTS "is_recurring" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS "is_group_session" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS "max_participants" INTEGER,
ADD COLUMN IF NOT EXISTS "room_id" BIGINT,
ADD COLUMN IF NOT EXISTS "recurrence_pattern_id" BIGINT,
ADD COLUMN IF NOT EXISTS "parent_appointment_id" BIGINT,
ADD FOREIGN KEY ("room_id") REFERENCES "therapy_rooms"("id"),
ADD FOREIGN KEY ("recurrence_pattern_id") REFERENCES "appointment_recurrence_patterns"("id"),
ADD FOREIGN KEY ("parent_appointment_id") REFERENCES "appointments"("id");

-- Create appointment_staff table if it doesn't exist
CREATE TABLE IF NOT EXISTS "appointment_staff" (
  "appointment_id" BIGINT NOT NULL,
  "user_id" BIGINT NOT NULL,
  "role" "therapist_role" NOT NULL,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY ("appointment_id", "user_id"),
  FOREIGN KEY ("appointment_id") REFERENCES "appointments"("id") ON DELETE CASCADE,
  FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE
);

-- Create appointment_equipment table if it doesn't exist
CREATE TABLE IF NOT EXISTS "appointment_equipment" (
  "appointment_id" BIGINT NOT NULL,
  "equipment_id" BIGINT NOT NULL,
  "quantity" INTEGER NOT NULL DEFAULT 1,
  "notes" TEXT,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY ("appointment_id", "equipment_id"),
  FOREIGN KEY ("appointment_id") REFERENCES "appointments"("id") ON DELETE CASCADE,
  FOREIGN KEY ("equipment_id") REFERENCES "therapy_equipment"("id") ON DELETE CASCADE
);

-- Create appointment_group_participants table if it doesn't exist
CREATE TABLE IF NOT EXISTS "appointment_group_participants" (
  "appointment_id" BIGINT NOT NULL,
  "learner_id" BIGINT NOT NULL,
  "notes" TEXT,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY ("appointment_id", "learner_id"),
  FOREIGN KEY ("appointment_id") REFERENCES "appointments"("id") ON DELETE CASCADE,
  FOREIGN KEY ("learner_id") REFERENCES "learners"("id") ON DELETE CASCADE
);
