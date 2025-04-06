-- AddProgressNotesAndTreatmentPlanEnhancements

-- Create progress_notes table with assessment data points
CREATE TABLE IF NOT EXISTS progress_notes (
    id BIGSERIAL PRIMARY KEY,
    treatment_plan_id BIGINT NOT NULL,
    learner_id BIGINT NOT NULL,
    session_date TIMESTAMP NOT NULL,
    note_content TEXT NOT NULL,
    assessment_type VARCHAR(50),
    assessment_score DECIMAL(10, 2),
    progress_indicators JSONB,
    behaviors_observed TEXT,
    intervention_effectiveness TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL,
    created_by BIGINT,
    updated_by BIGINT,
    FOREIGN KEY (treatment_plan_id) REFERENCES treatment_plans(id) ON DELETE CASCADE,
    FOREIGN KEY (learner_id) REFERENCES learners(id) ON DELETE CASCADE,
    FOREIGN KEY (created_by) REFERENCES users(id),
    FOREIGN KEY (updated_by) REFERENCES users(id)
);

-- Create treatment_goals_progress table to track goal progress over time
CREATE TABLE IF NOT EXISTS treatment_goals_progress (
    id BIGSERIAL PRIMARY KEY,
    goal_id BIGINT NOT NULL,
    progress_note_id BIGINT NOT NULL,
    progress_percentage INT NOT NULL,
    status VARCHAR(20) NOT NULL,
    data_points JSONB,
    notes TEXT,
    date_recorded TIMESTAMP NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL,
    created_by BIGINT,
    updated_by BIGINT,
    FOREIGN KEY (goal_id) REFERENCES treatment_goals(id) ON DELETE CASCADE,
    FOREIGN KEY (progress_note_id) REFERENCES progress_notes(id) ON DELETE CASCADE,
    FOREIGN KEY (created_by) REFERENCES users(id),
    FOREIGN KEY (updated_by) REFERENCES users(id)
);

-- Add assessment_tools table for various assessment methodologies
CREATE TABLE IF NOT EXISTS assessment_tools (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    assessment_type VARCHAR(50) NOT NULL,
    scoring_guidelines TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL,
    created_by BIGINT,
    updated_by BIGINT,
    FOREIGN KEY (created_by) REFERENCES users(id),
    FOREIGN KEY (updated_by) REFERENCES users(id)
);

-- Add columns to treatment_plans
ALTER TABLE treatment_plans 
ADD COLUMN IF NOT EXISTS assessment_method VARCHAR(100),
ADD COLUMN IF NOT EXISTS baseline_assessment_data JSONB,
ADD COLUMN IF NOT EXISTS review_frequency VARCHAR(50);

-- Modifications to treatment_goals
ALTER TABLE treatment_goals
ADD COLUMN IF NOT EXISTS measurable_criteria TEXT,
ADD COLUMN IF NOT EXISTS baseline_data JSONB,
ADD COLUMN IF NOT EXISTS mastery_criteria VARCHAR(255),
ADD COLUMN IF NOT EXISTS progress_tracking_method VARCHAR(100);
