-- Sentinel Prime Schema v1.2
-- Region: ap-south-1 (RDS)

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "vector"; 

-- 1. Users & Auth
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL, -- Argon2id
    role VARCHAR(50) NOT NULL CHECK (role IN ('Admin', 'Legal-Auditor', 'Vendor-User', 'Procurement-Officer', 'Readonly-Auditor', 'Sentinel_Developer')),
    totp_secret VARCHAR(100), -- Encrypted
    organization VARCHAR(100),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT NOW(),
    last_login TIMESTAMP
);

-- 2. Refresh Tokens (Opaque)
CREATE TABLE IF NOT EXISTS refresh_tokens (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    token_hash CHAR(64) NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    revoked BOOLEAN DEFAULT FALSE,
    ip_address INET
);

-- 3. Password Reset Tickets (Legal Gate Workflow)
CREATE TABLE IF NOT EXISTS password_reset_tickets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id),
    ticket_status VARCHAR(20) DEFAULT 'PENDING_APPROVAL' CHECK (ticket_status IN ('PENDING_APPROVAL', 'APPROVED', 'REJECTED', 'USED')),
    request_ip INET,
    admin_approver_id UUID REFERENCES users(id),
    approval_timestamp TIMESTAMP,
    reset_token_hash CHAR(64), -- Generated only after approval
    expires_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW()
);

-- 4. Audit Log (Immutable Append-Only)
CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    actor_id UUID, -- Can be null for system/failed login
    actor_username VARCHAR(50),
    action VARCHAR(50) NOT NULL, -- LOGIN_SUCCESS, LOGIN_FAILED, RESET_REQUEST, EXPORT_BLOCKED
    target_resource VARCHAR(100),
    payload_hash CHAR(64),
    metadata JSONB,
    ip_address INET,
    user_agent TEXT,
    timestamp TIMESTAMP DEFAULT NOW()
);

-- 5. Tenders (Ingestion Storage)
CREATE TABLE IF NOT EXISTS tenders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    source_ref_id VARCHAR(100) UNIQUE NOT NULL, -- GEM/2024/B/1234
    title TEXT NOT NULL,
    category VARCHAR(50),
    value_inr NUMERIC(20, 2),
    publish_date TIMESTAMP,
    closing_date TIMESTAMP,
    location VARCHAR(255),
    organization VARCHAR(255),
    is_verified BOOLEAN DEFAULT FALSE,
    source_system VARCHAR(50), -- GEM, CPPP, MANUAL
    download_url TEXT,
    ingested_at TIMESTAMP DEFAULT NOW()
);

-- ... (Rest of existing tables: clauses, vault_files, etc.)