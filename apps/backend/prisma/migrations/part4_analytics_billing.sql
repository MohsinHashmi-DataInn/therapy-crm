-- 4. Analytics and Billing Enhancements

-- Create tables for clinical KPIs and analytics
CREATE TABLE IF NOT EXISTS "analytics_metrics" (
    "id" BIGSERIAL PRIMARY KEY,
    "metric_name" TEXT NOT NULL,
    "metric_category" TEXT NOT NULL, -- CLINICAL, OPERATIONAL, FINANCIAL
    "description" TEXT,
    "calculation_formula" TEXT,
    "display_order" INTEGER NOT NULL DEFAULT 0,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "created_by" BIGINT,
    "updated_by" BIGINT,
    CONSTRAINT "fk_analytics_metrics_created_by" 
        FOREIGN KEY ("created_by") REFERENCES "users"("id") 
        ON DELETE SET NULL ON UPDATE NO ACTION,
    CONSTRAINT "fk_analytics_metrics_updated_by" 
        FOREIGN KEY ("updated_by") REFERENCES "users"("id") 
        ON DELETE SET NULL ON UPDATE NO ACTION,
    CONSTRAINT "unique_metric_name" 
        UNIQUE ("metric_name")
);

-- Seed common metrics for autism therapy
INSERT INTO "analytics_metrics" 
("metric_name", "metric_category", "description", "calculation_formula", "display_order") VALUES
('therapy_hours_delivered', 'CLINICAL', 'Total therapy hours delivered', 'SUM(appointment_duration)', 1),
('goals_achieved_rate', 'CLINICAL', 'Percentage of goals achieved', '(goals_achieved / total_goals) * 100', 2),
('appointment_completion_rate', 'OPERATIONAL', 'Percentage of completed appointments', '(completed_appointments / scheduled_appointments) * 100', 3),
('cancellation_rate', 'OPERATIONAL', 'Percentage of cancelled appointments', '(cancelled_appointments / total_appointments) * 100', 4),
('average_session_duration', 'CLINICAL', 'Average duration of therapy sessions', 'AVG(session_duration)', 5),
('staff_utilization', 'OPERATIONAL', 'Percentage of staff time utilized for billable services', '(billable_hours / total_hours) * 100', 6),
('revenue_per_therapist', 'FINANCIAL', 'Average revenue generated per therapist', 'SUM(therapist_revenue) / COUNT(therapists)', 7),
('insurance_claim_success_rate', 'FINANCIAL', 'Percentage of successfully processed insurance claims', '(approved_claims / total_claims) * 100', 8),
('new_client_acquisition', 'OPERATIONAL', 'Number of new clients onboarded', 'COUNT(new_clients)', 9),
('client_retention_rate', 'OPERATIONAL', 'Percentage of clients who continue therapy', '(retained_clients / total_clients) * 100', 10)
ON CONFLICT DO NOTHING;

-- Create dashboard widgets configuration
CREATE TABLE IF NOT EXISTS "dashboard_widgets" (
    "id" BIGSERIAL PRIMARY KEY,
    "user_id" BIGINT NOT NULL,
    "widget_type" TEXT NOT NULL, -- CHART, TABLE, METRIC, CALENDAR
    "title" TEXT NOT NULL,
    "metric_ids" TEXT, -- Comma-separated list of metric IDs
    "chart_type" TEXT, -- LINE, BAR, PIE, etc.
    "time_range" TEXT, -- DAILY, WEEKLY, MONTHLY, YEARLY, CUSTOM
    "custom_query" TEXT,
    "position_x" INTEGER NOT NULL DEFAULT 0,
    "position_y" INTEGER NOT NULL DEFAULT 0,
    "width" INTEGER NOT NULL DEFAULT 1,
    "height" INTEGER NOT NULL DEFAULT 1,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "fk_dashboard_widgets_user" 
        FOREIGN KEY ("user_id") REFERENCES "users"("id") 
        ON DELETE CASCADE ON UPDATE NO ACTION
);

-- Create snapshot metrics history for trending
CREATE TABLE IF NOT EXISTS "metrics_snapshots" (
    "id" BIGSERIAL PRIMARY KEY,
    "metric_id" BIGINT NOT NULL,
    "snapshot_date" DATE NOT NULL,
    "value" DECIMAL(15,2) NOT NULL,
    "comparison_value" DECIMAL(15,2),
    "comparison_period" TEXT, -- PREVIOUS_DAY, PREVIOUS_WEEK, PREVIOUS_MONTH, PREVIOUS_YEAR
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "fk_metrics_snapshots_metric" 
        FOREIGN KEY ("metric_id") REFERENCES "analytics_metrics"("id") 
        ON DELETE CASCADE ON UPDATE NO ACTION,
    CONSTRAINT "unique_metric_snapshot" 
        UNIQUE ("metric_id", "snapshot_date")
);

-- Canadian Healthcare Billing Enhancements
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'funding_source') THEN
        CREATE TYPE "funding_source" AS ENUM (
            'PRIVATE_PAY',
            'INSURANCE',
            'PROVINCIAL_FUNDING',
            'FEDERAL_GRANT',
            'CHARITABLE_GRANT',
            'SCHOOL_DISTRICT',
            'OTHER'
        );
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'invoice_status') THEN
        CREATE TYPE "invoice_status" AS ENUM (
            'DRAFT',
            'PENDING',
            'SENT',
            'PAID',
            'PARTIAL',
            'OVERDUE',
            'CANCELLED',
            'REFUNDED'
        );
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'payment_method') THEN
        CREATE TYPE "payment_method" AS ENUM (
            'CREDIT_CARD',
            'DEBIT',
            'E_TRANSFER',
            'CASH',
            'CHEQUE',
            'DIRECT_DEPOSIT',
            'INSURANCE_DIRECT',
            'FUNDING_PROGRAM'
        );
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'claim_status') THEN
        CREATE TYPE "claim_status" AS ENUM (
            'PENDING',
            'SUBMITTED',
            'IN_REVIEW',
            'APPROVED',
            'PARTIAL_APPROVAL',
            'DENIED',
            'RESUBMITTED',
            'PAID',
            'APPEALED'
        );
    END IF;
END$$;

-- Create Insurance Providers table
CREATE TABLE IF NOT EXISTS "insurance_providers" (
    "id" BIGSERIAL PRIMARY KEY,
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
    CONSTRAINT "fk_insurance_providers_created_by" 
        FOREIGN KEY ("created_by") REFERENCES "users"("id") 
        ON DELETE SET NULL ON UPDATE NO ACTION,
    CONSTRAINT "fk_insurance_providers_updated_by" 
        FOREIGN KEY ("updated_by") REFERENCES "users"("id") 
        ON DELETE SET NULL ON UPDATE NO ACTION
);

-- Create Funding Programs table
CREATE TABLE IF NOT EXISTS "funding_programs" (
    "id" BIGSERIAL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "program_type" TEXT NOT NULL, -- PROVINCIAL, FEDERAL, PRIVATE
    "description" TEXT,
    "max_amount" DECIMAL(15,2),
    "coverage_period" TEXT, -- ANNUAL, LIFETIME, AGE_BASED
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
    CONSTRAINT "fk_funding_programs_created_by" 
        FOREIGN KEY ("created_by") REFERENCES "users"("id") 
        ON DELETE SET NULL ON UPDATE NO ACTION,
    CONSTRAINT "fk_funding_programs_updated_by" 
        FOREIGN KEY ("updated_by") REFERENCES "users"("id") 
        ON DELETE SET NULL ON UPDATE NO ACTION
);

-- Create Client Insurance Information
CREATE TABLE IF NOT EXISTS "client_insurance" (
    "id" BIGSERIAL PRIMARY KEY,
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
    CONSTRAINT "fk_client_insurance_client" 
        FOREIGN KEY ("client_id") REFERENCES "clients"("id") 
        ON DELETE CASCADE ON UPDATE NO ACTION,
    CONSTRAINT "fk_client_insurance_provider" 
        FOREIGN KEY ("insurance_provider_id") REFERENCES "insurance_providers"("id") 
        ON DELETE RESTRICT ON UPDATE NO ACTION,
    CONSTRAINT "fk_client_insurance_verified_by" 
        FOREIGN KEY ("verified_by") REFERENCES "users"("id") 
        ON DELETE SET NULL ON UPDATE NO ACTION,
    CONSTRAINT "fk_client_insurance_created_by" 
        FOREIGN KEY ("created_by") REFERENCES "users"("id") 
        ON DELETE SET NULL ON UPDATE NO ACTION,
    CONSTRAINT "fk_client_insurance_updated_by" 
        FOREIGN KEY ("updated_by") REFERENCES "users"("id") 
        ON DELETE SET NULL ON UPDATE NO ACTION
);

-- Create Client Funding Information
CREATE TABLE IF NOT EXISTS "client_funding" (
    "id" BIGSERIAL PRIMARY KEY,
    "client_id" BIGINT NOT NULL,
    "funding_program_id" BIGINT NOT NULL,
    "reference_number" TEXT,
    "status" TEXT NOT NULL, -- APPLIED, APPROVED, PENDING, DENIED
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
    CONSTRAINT "fk_client_funding_client" 
        FOREIGN KEY ("client_id") REFERENCES "clients"("id") 
        ON DELETE CASCADE ON UPDATE NO ACTION,
    CONSTRAINT "fk_client_funding_program" 
        FOREIGN KEY ("funding_program_id") REFERENCES "funding_programs"("id") 
        ON DELETE RESTRICT ON UPDATE NO ACTION,
    CONSTRAINT "fk_client_funding_created_by" 
        FOREIGN KEY ("created_by") REFERENCES "users"("id") 
        ON DELETE SET NULL ON UPDATE NO ACTION,
    CONSTRAINT "fk_client_funding_updated_by" 
        FOREIGN KEY ("updated_by") REFERENCES "users"("id") 
        ON DELETE SET NULL ON UPDATE NO ACTION
);

-- Create Service Codes table (for billing)
CREATE TABLE IF NOT EXISTS "service_codes" (
    "id" BIGSERIAL PRIMARY KEY,
    "code" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "rate" DECIMAL(15,2) NOT NULL,
    "tax_rate" DECIMAL(5,2) NOT NULL DEFAULT 0,
    "billable_unit" TEXT NOT NULL, -- HOUR, SESSION, DAY
    "minimum_duration" INTEGER, -- in minutes
    "notes" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "created_by" BIGINT,
    "updated_by" BIGINT,
    CONSTRAINT "fk_service_codes_created_by" 
        FOREIGN KEY ("created_by") REFERENCES "users"("id") 
        ON DELETE SET NULL ON UPDATE NO ACTION,
    CONSTRAINT "fk_service_codes_updated_by" 
        FOREIGN KEY ("updated_by") REFERENCES "users"("id") 
        ON DELETE SET NULL ON UPDATE NO ACTION,
    CONSTRAINT "unique_service_code" 
        UNIQUE ("code")
);

-- Create Invoices table
CREATE TABLE IF NOT EXISTS "invoices" (
    "id" BIGSERIAL PRIMARY KEY,
    "invoice_number" TEXT NOT NULL UNIQUE,
    "client_id" BIGINT NOT NULL,
    "funding_source" funding_source NOT NULL,
    "insurance_id" BIGINT,
    "funding_id" BIGINT,
    "status" invoice_status NOT NULL DEFAULT 'DRAFT',
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
    CONSTRAINT "fk_invoices_client" 
        FOREIGN KEY ("client_id") REFERENCES "clients"("id") 
        ON DELETE RESTRICT ON UPDATE NO ACTION,
    CONSTRAINT "fk_invoices_insurance" 
        FOREIGN KEY ("insurance_id") REFERENCES "client_insurance"("id") 
        ON DELETE SET NULL ON UPDATE NO ACTION,
    CONSTRAINT "fk_invoices_funding" 
        FOREIGN KEY ("funding_id") REFERENCES "client_funding"("id") 
        ON DELETE SET NULL ON UPDATE NO ACTION,
    CONSTRAINT "fk_invoices_created_by" 
        FOREIGN KEY ("created_by") REFERENCES "users"("id") 
        ON DELETE SET NULL ON UPDATE NO ACTION,
    CONSTRAINT "fk_invoices_updated_by" 
        FOREIGN KEY ("updated_by") REFERENCES "users"("id") 
        ON DELETE SET NULL ON UPDATE NO ACTION
);

-- Create Invoice Line Items table
CREATE TABLE IF NOT EXISTS "invoice_line_items" (
    "id" BIGSERIAL PRIMARY KEY,
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
    CONSTRAINT "fk_invoice_line_items_invoice" 
        FOREIGN KEY ("invoice_id") REFERENCES "invoices"("id") 
        ON DELETE CASCADE ON UPDATE NO ACTION,
    CONSTRAINT "fk_invoice_line_items_service_code" 
        FOREIGN KEY ("service_code_id") REFERENCES "service_codes"("id") 
        ON DELETE RESTRICT ON UPDATE NO ACTION,
    CONSTRAINT "fk_invoice_line_items_appointment" 
        FOREIGN KEY ("appointment_id") REFERENCES "appointments"("id") 
        ON DELETE SET NULL ON UPDATE NO ACTION,
    CONSTRAINT "fk_invoice_line_items_learner" 
        FOREIGN KEY ("learner_id") REFERENCES "learners"("id") 
        ON DELETE SET NULL ON UPDATE NO ACTION
);

-- Create Payments table
CREATE TABLE IF NOT EXISTS "payments" (
    "id" BIGSERIAL PRIMARY KEY,
    "invoice_id" BIGINT NOT NULL,
    "payment_date" DATE NOT NULL,
    "amount" DECIMAL(15,2) NOT NULL,
    "payment_method" payment_method NOT NULL,
    "reference_number" TEXT,
    "notes" TEXT,
    "received_by" BIGINT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "fk_payments_invoice" 
        FOREIGN KEY ("invoice_id") REFERENCES "invoices"("id") 
        ON DELETE CASCADE ON UPDATE NO ACTION,
    CONSTRAINT "fk_payments_received_by" 
        FOREIGN KEY ("received_by") REFERENCES "users"("id") 
        ON DELETE SET NULL ON UPDATE NO ACTION
);

-- Create Insurance Claims table
CREATE TABLE IF NOT EXISTS "insurance_claims" (
    "id" BIGSERIAL PRIMARY KEY,
    "invoice_id" BIGINT NOT NULL,
    "insurance_id" BIGINT NOT NULL,
    "claim_number" TEXT,
    "submission_date" DATE NOT NULL,
    "status" claim_status NOT NULL DEFAULT 'PENDING',
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
    CONSTRAINT "fk_insurance_claims_invoice" 
        FOREIGN KEY ("invoice_id") REFERENCES "invoices"("id") 
        ON DELETE RESTRICT ON UPDATE NO ACTION,
    CONSTRAINT "fk_insurance_claims_insurance" 
        FOREIGN KEY ("insurance_id") REFERENCES "client_insurance"("id") 
        ON DELETE RESTRICT ON UPDATE NO ACTION,
    CONSTRAINT "fk_insurance_claims_created_by" 
        FOREIGN KEY ("created_by") REFERENCES "users"("id") 
        ON DELETE SET NULL ON UPDATE NO ACTION,
    CONSTRAINT "fk_insurance_claims_updated_by" 
        FOREIGN KEY ("updated_by") REFERENCES "users"("id") 
        ON DELETE SET NULL ON UPDATE NO ACTION
);

-- Create Funding Authorizations
CREATE TABLE IF NOT EXISTS "funding_authorizations" (
    "id" BIGSERIAL PRIMARY KEY,
    "client_funding_id" BIGINT NOT NULL,
    "invoice_id" BIGINT NOT NULL,
    "authorization_number" TEXT,
    "authorized_date" DATE NOT NULL,
    "authorized_amount" DECIMAL(15,2) NOT NULL,
    "status" TEXT NOT NULL, -- PENDING, APPROVED, DENIED
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "created_by" BIGINT,
    "updated_by" BIGINT,
    CONSTRAINT "fk_funding_authorizations_client_funding" 
        FOREIGN KEY ("client_funding_id") REFERENCES "client_funding"("id") 
        ON DELETE RESTRICT ON UPDATE NO ACTION,
    CONSTRAINT "fk_funding_authorizations_invoice" 
        FOREIGN KEY ("invoice_id") REFERENCES "invoices"("id") 
        ON DELETE RESTRICT ON UPDATE NO ACTION,
    CONSTRAINT "fk_funding_authorizations_created_by" 
        FOREIGN KEY ("created_by") REFERENCES "users"("id") 
        ON DELETE SET NULL ON UPDATE NO ACTION,
    CONSTRAINT "fk_funding_authorizations_updated_by" 
        FOREIGN KEY ("updated_by") REFERENCES "users"("id") 
        ON DELETE SET NULL ON UPDATE NO ACTION
);
