-- AddDocumentStorageAndSecureFileSharing

-- Create document_categories table
CREATE TABLE IF NOT EXISTS document_categories (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL,
    created_by BIGINT,
    updated_by BIGINT,
    FOREIGN KEY (created_by) REFERENCES users(id),
    FOREIGN KEY (updated_by) REFERENCES users(id),
    UNIQUE(name)
);

-- Create documents table for file storage
CREATE TABLE IF NOT EXISTS documents (
    id BIGSERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    file_path VARCHAR(255) NOT NULL,
    file_name VARCHAR(255) NOT NULL,
    file_type VARCHAR(100) NOT NULL,
    file_size BIGINT NOT NULL,
    mime_type VARCHAR(100) NOT NULL,
    category_id BIGINT,
    client_id BIGINT,
    learner_id BIGINT,
    uploader_id BIGINT NOT NULL,
    upload_date TIMESTAMP NOT NULL DEFAULT NOW(),
    description TEXT,
    tags VARCHAR(255)[],
    security_classification VARCHAR(50) NOT NULL DEFAULT 'CONFIDENTIAL',
    is_encrypted BOOLEAN NOT NULL DEFAULT TRUE,
    encryption_key_id VARCHAR(255),
    checksum VARCHAR(255) NOT NULL,
    retention_period_days INT,
    expiration_date TIMESTAMP,
    version INT NOT NULL DEFAULT 1,
    is_latest_version BOOLEAN NOT NULL DEFAULT TRUE,
    parent_document_id BIGINT,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL,
    created_by BIGINT NOT NULL,
    updated_by BIGINT NOT NULL,
    FOREIGN KEY (category_id) REFERENCES document_categories(id),
    FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE,
    FOREIGN KEY (learner_id) REFERENCES learners(id) ON DELETE CASCADE,
    FOREIGN KEY (uploader_id) REFERENCES users(id),
    FOREIGN KEY (parent_document_id) REFERENCES documents(id),
    FOREIGN KEY (created_by) REFERENCES users(id),
    FOREIGN KEY (updated_by) REFERENCES users(id)
);

-- Create document_permissions for access control
CREATE TABLE IF NOT EXISTS document_permissions (
    id BIGSERIAL PRIMARY KEY,
    document_id BIGINT NOT NULL,
    user_id BIGINT,
    role_id BIGINT,
    permission_type VARCHAR(50) NOT NULL, -- VIEW, EDIT, DOWNLOAD, DELETE, SHARE
    granted_by BIGINT NOT NULL,
    granted_at TIMESTAMP NOT NULL DEFAULT NOW(),
    expires_at TIMESTAMP,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL,
    FOREIGN KEY (document_id) REFERENCES documents(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE,
    FOREIGN KEY (granted_by) REFERENCES users(id),
    UNIQUE(document_id, user_id, permission_type),
    UNIQUE(document_id, role_id, permission_type)
);

-- Create document_access_logs for auditing
CREATE TABLE IF NOT EXISTS document_access_logs (
    id BIGSERIAL PRIMARY KEY,
    document_id BIGINT NOT NULL,
    user_id BIGINT NOT NULL,
    access_type VARCHAR(50) NOT NULL, -- VIEW, DOWNLOAD, EDIT, DELETE, SHARE
    access_timestamp TIMESTAMP NOT NULL DEFAULT NOW(),
    ip_address VARCHAR(50),
    user_agent TEXT,
    access_status VARCHAR(50) NOT NULL, -- SUCCESS, DENIED
    additional_details TEXT,
    FOREIGN KEY (document_id) REFERENCES documents(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Create document_shares for external sharing
CREATE TABLE IF NOT EXISTS document_shares (
    id BIGSERIAL PRIMARY KEY,
    document_id BIGINT NOT NULL,
    shared_by BIGINT NOT NULL,
    shared_with_email VARCHAR(255) NOT NULL,
    access_token VARCHAR(255) NOT NULL,
    access_count INT NOT NULL DEFAULT 0,
    last_accessed TIMESTAMP,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    expires_at TIMESTAMP NOT NULL,
    is_password_protected BOOLEAN NOT NULL DEFAULT FALSE,
    password_hash VARCHAR(255),
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    FOREIGN KEY (document_id) REFERENCES documents(id) ON DELETE CASCADE,
    FOREIGN KEY (shared_by) REFERENCES users(id) ON DELETE CASCADE
);

-- Insert default document categories
INSERT INTO document_categories (name, description, created_at, updated_at)
VALUES 
('Assessment Reports', 'Diagnostic and assessment reports from professionals', NOW(), NOW()),
('Treatment Plans', 'Formal treatment plans and goal documentation', NOW(), NOW()),
('Progress Reports', 'Periodic progress reports and measurements', NOW(), NOW()),
('Medical Records', 'Medical information and doctor communications', NOW(), NOW()),
('Educational Records', 'School records, IEPs, and educational assessments', NOW(), NOW()),
('Consent Forms', 'Signed consent and authorization forms', NOW(), NOW()),
('Insurance Documents', 'Insurance claims and coverage documentation', NOW(), NOW()),
('Session Notes', 'Notes from therapy sessions', NOW(), NOW()),
('Media', 'Photos, videos, and audio recordings from sessions', NOW(), NOW()),
('Other', 'Miscellaneous documents', NOW(), NOW());
