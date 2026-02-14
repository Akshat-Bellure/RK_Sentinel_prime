-- Sentinel Prime Schema v1.1
-- Region: ap-south-1 (RDS)

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "vector"; -- For RAG

-- 1. Users & Auth
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL, -- Argon2id
    role VARCHAR(20) NOT NULL CHECK (role IN ('Admin', 'Legal-Auditor', 'Vendor-User', 'Procurement-Officer')),
    totp_secret VARCHAR(100), -- Encrypted
    organization VARCHAR(100),
    created_at TIMESTAMP DEFAULT NOW(),
    last_login TIMESTAMP
);

-- 2. Tenders
CREATE TABLE IF NOT EXISTS tenders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    source_ref_id VARCHAR(50) UNIQUE NOT NULL, -- GEM/2024/...
    title TEXT NOT NULL,
    issuing_authority VARCHAR(200),
    value_inr NUMERIC(15, 2),
    category VARCHAR(20),
    status VARCHAR(20),
    ingested_at TIMESTAMP DEFAULT NOW()
);

-- 3. Clauses (Parsed)
CREATE TABLE IF NOT EXISTS clauses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tender_id UUID REFERENCES tenders(id),
    page_number INT,
    clause_text TEXT,
    text_hash CHAR(64) NOT NULL, -- SHA256
    risk_level VARCHAR(10),
    embedding vector(768) -- For Semantic Search
);

-- 4. Vault Files (New)
CREATE TABLE IF NOT EXISTS vault_files (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    filename VARCHAR(255) NOT NULL,
    uploader_id UUID REFERENCES users(id),
    file_sha256 CHAR(64) NOT NULL,
    file_size BIGINT,
    mime_type VARCHAR(50),
    page_count INT,
    upload_time TIMESTAMP DEFAULT NOW(),
    tags TEXT[],
    expiry_date TIMESTAMP,
    verified BOOLEAN DEFAULT FALSE,
    verified_by UUID REFERENCES users(id),
    verification_time TIMESTAMP,
    s3_key VARCHAR(255) -- Points to ap-south-1 bucket
);

-- 5. Vault File Pages (OCR Content)
CREATE TABLE IF NOT EXISTS vault_file_pages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    file_id UUID REFERENCES vault_files(id),
    page_number INT,
    page_text TEXT,
    text_hash CHAR(64)
);

-- 6. Clause Evidence Mapping (Core)
CREATE TABLE IF NOT EXISTS clause_evidence (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    clause_id UUID REFERENCES clauses(id),
    file_id UUID REFERENCES vault_files(id),
    page_range VARCHAR(50), -- e.g. "1-3"
    snippet_hash CHAR(64),
    mapped_by UUID REFERENCES users(id),
    mapping_time TIMESTAMP DEFAULT NOW()
);

-- 7. Citations (Verified Proofs)
CREATE TABLE IF NOT EXISTS citations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    evidence_id UUID REFERENCES clause_evidence(id),
    source_sha256 CHAR(64),
    filename VARCHAR(255),
    page_number INT,
    matched_snippet TEXT,
    verifier_id UUID REFERENCES users(id),
    verified_at TIMESTAMP DEFAULT NOW()
);

-- 8. Evidence Manifests (Packages)
CREATE TABLE IF NOT EXISTS evidence_packages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id),
    tender_id UUID REFERENCES tenders(id),
    manifest_json JSONB NOT NULL,
    kms_signature VARCHAR(512) NOT NULL,
    s3_key VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);

-- 9. Legal Tickets (The Gate)
CREATE TABLE IF NOT EXISTS legal_tickets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    draft_id UUID,
    status VARCHAR(20) DEFAULT 'PENDING',
    auditor_id UUID REFERENCES users(id),
    auditor_comments TEXT,
    approval_signature VARCHAR(255), -- 2FA generated signature
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP
);

-- 10. Audit Log (Immutable)
CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    actor_id UUID REFERENCES users(id),
    action VARCHAR(50) NOT NULL,
    target_resource VARCHAR(100),
    payload_hash CHAR(64),
    metadata JSONB,
    ip_address INET,
    timestamp TIMESTAMP DEFAULT NOW()
);
