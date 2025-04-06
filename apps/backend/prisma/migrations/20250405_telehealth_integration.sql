-- Telehealth Session Management Migration

-- Create telehealth_providers table
CREATE TABLE IF NOT EXISTS telehealth_providers (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    api_endpoint VARCHAR(255),
    api_key_name VARCHAR(100),
    api_key_value VARCHAR(255),
    description TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL,
    created_by BIGINT,
    updated_by BIGINT,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    supports_recording BOOLEAN NOT NULL DEFAULT FALSE,
    supports_screen_sharing BOOLEAN NOT NULL DEFAULT TRUE,
    supports_waiting_room BOOLEAN NOT NULL DEFAULT TRUE,
    max_participants INT NOT NULL DEFAULT 10,
    requires_authentication BOOLEAN NOT NULL DEFAULT TRUE,
    FOREIGN KEY (created_by) REFERENCES users(id),
    FOREIGN KEY (updated_by) REFERENCES users(id),
    UNIQUE(name)
);

-- Create virtual_sessions table for telehealth appointments
CREATE TABLE IF NOT EXISTS virtual_sessions (
    id BIGSERIAL PRIMARY KEY,
    appointment_id BIGINT NOT NULL,
    provider_id BIGINT NOT NULL,
    meeting_id VARCHAR(255) NOT NULL,
    join_url VARCHAR(500) NOT NULL,
    host_url VARCHAR(500) NOT NULL,
    password VARCHAR(100),
    waiting_room_enabled BOOLEAN NOT NULL DEFAULT TRUE,
    recording_enabled BOOLEAN NOT NULL DEFAULT FALSE,
    recording_url VARCHAR(500),
    status VARCHAR(50) NOT NULL DEFAULT 'SCHEDULED',
    start_time TIMESTAMP,
    end_time TIMESTAMP,
    duration_minutes INT,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL,
    created_by BIGINT,
    updated_by BIGINT,
    additional_settings JSONB,
    FOREIGN KEY (appointment_id) REFERENCES appointments(id) ON DELETE CASCADE,
    FOREIGN KEY (provider_id) REFERENCES telehealth_providers(id),
    FOREIGN KEY (created_by) REFERENCES users(id),
    FOREIGN KEY (updated_by) REFERENCES users(id),
    UNIQUE(appointment_id)
);

-- Create virtual_session_participants for tracking attendance
CREATE TABLE IF NOT EXISTS virtual_session_participants (
    id BIGSERIAL PRIMARY KEY,
    virtual_session_id BIGINT NOT NULL,
    user_id BIGINT,
    client_id BIGINT,
    email VARCHAR(255) NOT NULL,
    display_name VARCHAR(255) NOT NULL,
    join_time TIMESTAMP,
    leave_time TIMESTAMP,
    duration_minutes INT,
    connection_quality VARCHAR(50),
    device_type VARCHAR(100),
    ip_address VARCHAR(100),
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL,
    FOREIGN KEY (virtual_session_id) REFERENCES virtual_sessions(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (client_id) REFERENCES clients(id)
);

-- Create virtual_session_recordings for tracking session recordings
CREATE TABLE IF NOT EXISTS virtual_session_recordings (
    id BIGSERIAL PRIMARY KEY,
    virtual_session_id BIGINT NOT NULL,
    recording_url VARCHAR(500) NOT NULL,
    recording_type VARCHAR(50) NOT NULL,
    start_time TIMESTAMP NOT NULL,
    end_time TIMESTAMP,
    duration_minutes INT,
    file_size_bytes BIGINT,
    status VARCHAR(50) NOT NULL DEFAULT 'PROCESSING',
    expiration_date TIMESTAMP,
    document_id BIGINT,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL,
    created_by BIGINT,
    updated_by BIGINT,
    FOREIGN KEY (virtual_session_id) REFERENCES virtual_sessions(id) ON DELETE CASCADE,
    FOREIGN KEY (document_id) REFERENCES documents(id),
    FOREIGN KEY (created_by) REFERENCES users(id),
    FOREIGN KEY (updated_by) REFERENCES users(id)
);

-- Add telehealth info to appointments table
ALTER TABLE appointments
ADD COLUMN IF NOT EXISTS is_virtual BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS virtual_session_id BIGINT,
ADD CONSTRAINT fk_appointments_virtual_session
    FOREIGN KEY (virtual_session_id)
    REFERENCES virtual_sessions(id);

-- Insert default telehealth providers
INSERT INTO telehealth_providers 
(name, api_endpoint, description, supports_recording, supports_screen_sharing, created_at, updated_at)
VALUES 
('Zoom', 'https://api.zoom.us/v2', 'Zoom Video Communications integration for telehealth', TRUE, TRUE, NOW(), NOW()),
('Microsoft Teams', 'https://graph.microsoft.com/v1.0', 'Microsoft Teams integration for virtual therapy sessions', TRUE, TRUE, NOW(), NOW()),
('Doxy.me', 'https://api.doxy.me/v1', 'HIPAA-compliant telemedicine solution', FALSE, TRUE, NOW(), NOW());
