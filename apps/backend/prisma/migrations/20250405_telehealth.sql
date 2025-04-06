-- AddTelehealthIntegration

-- Create telehealth_providers table
CREATE TABLE IF NOT EXISTS telehealth_providers (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    api_endpoint VARCHAR(255),
    api_key_name VARCHAR(100),
    api_secret_name VARCHAR(100),
    supports_recording BOOLEAN NOT NULL DEFAULT FALSE,
    supports_screen_sharing BOOLEAN NOT NULL DEFAULT FALSE,
    supports_waiting_room BOOLEAN NOT NULL DEFAULT FALSE,
    supports_breakout_rooms BOOLEAN NOT NULL DEFAULT FALSE,
    max_participants INT,
    max_duration_minutes INT,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    created_by BIGINT,
    updated_by BIGINT,
    FOREIGN KEY (created_by) REFERENCES users(id),
    FOREIGN KEY (updated_by) REFERENCES users(id),
    UNIQUE(name)
);

-- Create virtual_sessions table
CREATE TABLE IF NOT EXISTS virtual_sessions (
    id BIGSERIAL PRIMARY KEY,
    appointment_id BIGINT,
    provider_id BIGINT NOT NULL,
    meeting_id VARCHAR(255) NOT NULL,
    meeting_password VARCHAR(255),
    host_link VARCHAR(1024) NOT NULL,
    join_link VARCHAR(1024) NOT NULL,
    scheduled_start_time TIMESTAMP NOT NULL,
    scheduled_end_time TIMESTAMP NOT NULL,
    actual_start_time TIMESTAMP,
    actual_end_time TIMESTAMP,
    duration_minutes INT,
    status VARCHAR(50) NOT NULL DEFAULT 'SCHEDULED',
    cancellation_reason TEXT,
    notes TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    created_by BIGINT NOT NULL,
    updated_by BIGINT NOT NULL,
    FOREIGN KEY (appointment_id) REFERENCES appointments(id) ON DELETE CASCADE,
    FOREIGN KEY (provider_id) REFERENCES telehealth_providers(id),
    FOREIGN KEY (created_by) REFERENCES users(id),
    FOREIGN KEY (updated_by) REFERENCES users(id)
);

-- Create virtual_session_participants table
CREATE TABLE IF NOT EXISTS virtual_session_participants (
    id BIGSERIAL PRIMARY KEY,
    session_id BIGINT NOT NULL,
    participant_type VARCHAR(50) NOT NULL, -- THERAPIST, PARENT, LEARNER, OBSERVER
    user_id BIGINT,
    external_email VARCHAR(255),
    external_name VARCHAR(255),
    personal_join_link VARCHAR(1024),
    join_token VARCHAR(255),
    attended BOOLEAN DEFAULT FALSE,
    join_time TIMESTAMP,
    leave_time TIMESTAMP,
    duration_minutes INT,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    FOREIGN KEY (session_id) REFERENCES virtual_sessions(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Create virtual_session_recordings table
CREATE TABLE IF NOT EXISTS virtual_session_recordings (
    id BIGSERIAL PRIMARY KEY,
    session_id BIGINT NOT NULL,
    recording_url VARCHAR(1024) NOT NULL,
    recording_type VARCHAR(50) NOT NULL, -- VIDEO, AUDIO, SCREEN_SHARE, TRANSCRIPT
    start_time TIMESTAMP NOT NULL,
    end_time TIMESTAMP,
    duration_minutes INT,
    file_size_bytes BIGINT,
    is_processing BOOLEAN NOT NULL DEFAULT FALSE,
    is_available BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    created_by BIGINT NOT NULL,
    FOREIGN KEY (session_id) REFERENCES virtual_sessions(id) ON DELETE CASCADE,
    FOREIGN KEY (created_by) REFERENCES users(id)
);

-- Insert initial telehealth providers
INSERT INTO telehealth_providers (name, description, supports_recording, supports_screen_sharing, supports_waiting_room, created_at, updated_at)
VALUES 
('Zoom', 'Zoom Video Communications integration', TRUE, TRUE, TRUE, NOW(), NOW()),
('Microsoft Teams', 'Microsoft Teams integration', TRUE, TRUE, FALSE, NOW(), NOW()),
('Doxy.me', 'Doxy.me telemedicine platform', FALSE, FALSE, TRUE, NOW(), NOW());
