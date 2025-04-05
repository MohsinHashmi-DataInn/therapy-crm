-- 3. Multi-Location Support & Practice Settings

-- Create locations table for multi-location practices
CREATE TABLE IF NOT EXISTS "practice_locations" (
    "id" BIGSERIAL PRIMARY KEY,
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
    CONSTRAINT "fk_practice_locations_practice" 
        FOREIGN KEY ("practice_id") REFERENCES "practice"("id") 
        ON DELETE CASCADE ON UPDATE NO ACTION,
    CONSTRAINT "fk_practice_locations_created_by" 
        FOREIGN KEY ("created_by") REFERENCES "users"("id") 
        ON DELETE SET NULL ON UPDATE NO ACTION,
    CONSTRAINT "fk_practice_locations_updated_by" 
        FOREIGN KEY ("updated_by") REFERENCES "users"("id") 
        ON DELETE SET NULL ON UPDATE NO ACTION
);

-- Add support for room assignments at specific locations
ALTER TABLE "therapy_rooms"
ADD COLUMN IF NOT EXISTS "location_id" BIGINT,
ADD CONSTRAINT "fk_therapy_rooms_location" 
    FOREIGN KEY ("location_id") REFERENCES "practice_locations"("id") 
    ON DELETE SET NULL ON UPDATE NO ACTION;

-- Add location assignments for staff (therapists can work at multiple locations)
CREATE TABLE IF NOT EXISTS "user_locations" (
    "user_id" BIGINT NOT NULL,
    "location_id" BIGINT NOT NULL,
    "is_primary" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "fk_user_locations_user" 
        FOREIGN KEY ("user_id") REFERENCES "users"("id") 
        ON DELETE CASCADE ON UPDATE NO ACTION,
    CONSTRAINT "fk_user_locations_location" 
        FOREIGN KEY ("location_id") REFERENCES "practice_locations"("id") 
        ON DELETE CASCADE ON UPDATE NO ACTION,
    PRIMARY KEY ("user_id", "location_id")
);

-- Link appointments to specific locations
ALTER TABLE "appointments"
ADD COLUMN IF NOT EXISTS "location_id" BIGINT,
ADD CONSTRAINT "fk_appointments_location" 
    FOREIGN KEY ("location_id") REFERENCES "practice_locations"("id") 
    ON DELETE SET NULL ON UPDATE NO ACTION;

-- Add multi-lingual support
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'language_code') THEN
        CREATE TYPE "language_code" AS ENUM (
            'EN', -- English
            'FR', -- French
            'ES', -- Spanish
            'ZH', -- Chinese
            'AR', -- Arabic
            'UR', -- Urdu
            'PA', -- Punjabi
            'HI', -- Hindi
            'DE', -- German
            'PT', -- Portuguese
            'IT', -- Italian
            'RU'  -- Russian
        );
    END IF;
END$$;

-- Add language preferences at practice level
ALTER TABLE "practice"
ADD COLUMN IF NOT EXISTS "primary_language" language_code NOT NULL DEFAULT 'EN',
ADD COLUMN IF NOT EXISTS "supported_languages" TEXT; -- Comma-separated list of language codes

-- Add language preferences for users
ALTER TABLE "users"
ADD COLUMN IF NOT EXISTS "preferred_language" language_code NOT NULL DEFAULT 'EN',
ADD COLUMN IF NOT EXISTS "secondary_languages" TEXT; -- Comma-separated list of language codes

-- Add language preferences for clients
ALTER TABLE "clients"
ADD COLUMN IF NOT EXISTS "preferred_language" language_code NOT NULL DEFAULT 'EN',
ADD COLUMN IF NOT EXISTS "requires_interpreter" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS "interpreter_notes" TEXT;

-- Create table for translated content
CREATE TABLE IF NOT EXISTS "content_translations" (
    "id" BIGSERIAL PRIMARY KEY,
    "content_type" TEXT NOT NULL, -- EMAIL_TEMPLATE, FORM, DOCUMENT, etc.
    "content_id" TEXT NOT NULL, -- Reference to the original content
    "language" language_code NOT NULL,
    "translated_content" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "created_by" BIGINT,
    "updated_by" BIGINT,
    CONSTRAINT "fk_content_translations_created_by" 
        FOREIGN KEY ("created_by") REFERENCES "users"("id") 
        ON DELETE SET NULL ON UPDATE NO ACTION,
    CONSTRAINT "fk_content_translations_updated_by" 
        FOREIGN KEY ("updated_by") REFERENCES "users"("id") 
        ON DELETE SET NULL ON UPDATE NO ACTION,
    CONSTRAINT "unique_content_translation" 
        UNIQUE ("content_type", "content_id", "language")
);
