-- Add TherapistRole enum if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'therapist_role') THEN
        CREATE TYPE "therapist_role" AS ENUM ('PRIMARY', 'ASSISTANT', 'SUPERVISOR', 'OBSERVER');
    END IF;
END$$;

-- Add RecurrenceFrequency enum if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'recurrence_frequency') THEN
        CREATE TYPE "recurrence_frequency" AS ENUM ('DAILY', 'WEEKLY', 'BIWEEKLY', 'MONTHLY', 'CUSTOM');
    END IF;
END$$;

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
  CONSTRAINT fk_therapy_rooms_created_by FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE SET NULL,
  CONSTRAINT fk_therapy_rooms_updated_by FOREIGN KEY ("updated_by") REFERENCES "users"("id") ON DELETE SET NULL
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
  CONSTRAINT fk_therapy_equipment_created_by FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE SET NULL,
  CONSTRAINT fk_therapy_equipment_updated_by FOREIGN KEY ("updated_by") REFERENCES "users"("id") ON DELETE SET NULL
);

-- Create appointment_recurrence_patterns table if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'appointment_recurrence_patterns') THEN
        CREATE TABLE "appointment_recurrence_patterns" (
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
          CONSTRAINT fk_recurrence_patterns_created_by FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE SET NULL,
          CONSTRAINT fk_recurrence_patterns_updated_by FOREIGN KEY ("updated_by") REFERENCES "users"("id") ON DELETE SET NULL
        );
    END IF;
END$$;

-- Add new columns to appointments table if they don't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'appointments' AND column_name = 'is_recurring') THEN
        ALTER TABLE "appointments" ADD COLUMN "is_recurring" BOOLEAN NOT NULL DEFAULT false;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'appointments' AND column_name = 'is_group_session') THEN
        ALTER TABLE "appointments" ADD COLUMN "is_group_session" BOOLEAN NOT NULL DEFAULT false;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'appointments' AND column_name = 'max_participants') THEN
        ALTER TABLE "appointments" ADD COLUMN "max_participants" INTEGER;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'appointments' AND column_name = 'room_id') THEN
        ALTER TABLE "appointments" ADD COLUMN "room_id" BIGINT;
        ALTER TABLE "appointments" ADD CONSTRAINT fk_appointments_room FOREIGN KEY ("room_id") REFERENCES "therapy_rooms"("id") ON DELETE SET NULL;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'appointments' AND column_name = 'recurrence_pattern_id') THEN
        ALTER TABLE "appointments" ADD COLUMN "recurrence_pattern_id" BIGINT;
        ALTER TABLE "appointments" ADD CONSTRAINT fk_appointments_recurrence FOREIGN KEY ("recurrence_pattern_id") REFERENCES "appointment_recurrence_patterns"("id") ON DELETE SET NULL;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'appointments' AND column_name = 'parent_appointment_id') THEN
        ALTER TABLE "appointments" ADD COLUMN "parent_appointment_id" BIGINT;
        ALTER TABLE "appointments" ADD CONSTRAINT fk_appointments_parent FOREIGN KEY ("parent_appointment_id") REFERENCES "appointments"("id") ON DELETE SET NULL;
    END IF;
END$$;

-- Create appointment_staff table if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'appointment_staff') THEN
        CREATE TABLE "appointment_staff" (
          "appointment_id" BIGINT NOT NULL,
          "user_id" BIGINT NOT NULL,
          "role" "therapist_role" NOT NULL,
          "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
          PRIMARY KEY ("appointment_id", "user_id"),
          CONSTRAINT fk_appointment_staff_appointment FOREIGN KEY ("appointment_id") REFERENCES "appointments"("id") ON DELETE CASCADE,
          CONSTRAINT fk_appointment_staff_user FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE
        );
    END IF;
END$$;

-- Create appointment_equipment table if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'appointment_equipment') THEN
        CREATE TABLE "appointment_equipment" (
          "appointment_id" BIGINT NOT NULL,
          "equipment_id" BIGINT NOT NULL,
          "quantity" INTEGER NOT NULL DEFAULT 1,
          "notes" TEXT,
          "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
          PRIMARY KEY ("appointment_id", "equipment_id"),
          CONSTRAINT fk_appointment_equipment_appointment FOREIGN KEY ("appointment_id") REFERENCES "appointments"("id") ON DELETE CASCADE,
          CONSTRAINT fk_appointment_equipment_equipment FOREIGN KEY ("equipment_id") REFERENCES "therapy_equipment"("id") ON DELETE CASCADE
        );
    END IF;
END$$;

-- Create appointment_group_participants table if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'appointment_group_participants') THEN
        CREATE TABLE "appointment_group_participants" (
          "appointment_id" BIGINT NOT NULL,
          "learner_id" BIGINT NOT NULL,
          "notes" TEXT,
          "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
          PRIMARY KEY ("appointment_id", "learner_id"),
          CONSTRAINT fk_appointment_group_participants_appointment FOREIGN KEY ("appointment_id") REFERENCES "appointments"("id") ON DELETE CASCADE,
          CONSTRAINT fk_appointment_group_participants_learner FOREIGN KEY ("learner_id") REFERENCES "learners"("id") ON DELETE CASCADE
        );
    END IF;
END$$;
