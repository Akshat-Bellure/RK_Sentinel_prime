# Pilot Acceptance Criteria (PAC)

**Project:** Sentinel Prime Pilot  
**Region:** ap-south-1  
**Date:** 2023-10-27

## 1. Core Functionality
- [ ] **Ingestion**: Upload a PDF Tender > 5MB. Parsing must complete < 30s.
- [ ] **Risk Scan**: System must identify "Foreign Hosting" clause as **CRITICAL** risk.
- [ ] **Drafting**: Generate a Pre-Bid Query. Tone must be "Advisory".
- [ ] **Verification**: Click "Verify Source". System must show exact GFR 2017 text snippet.

## 2. Security & Compliance
- [ ] **Data Residency**: Verify S3 bucket is created in `ap-south-1`.
- [ ] **Legal Gate**: Attempt to export evidence without 2FA. System MUST **BLOCK** action.
- [ ] **Legal Gate**: Perform 2FA sign-off. System MUST generate a `manifest.json` with signature.
- [ ] **Audit Trail**: Verify "LEGAL_SIGN_OFF" event exists in `audit_logs` table.

## 3. Accuracy Metrics
- [ ] **Citation Precision**: > 99.5% (No hallucinations on law numbers).
- [ ] **False Positive Rate**: < 5% on Risk Scanning.

## 4. Infrastructure
- [ ] **Terraform**: `terraform plan` shows 0 errors.
- [ ] **Encryption**: Verify KMS Key ID is present in S3 upload metadata.
