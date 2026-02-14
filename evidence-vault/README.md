# Sentinel Evidence Vault

## Overview
The Evidence Vault is a secure, region-locked document storage and verification system. It handles the ingestion of tender artifacts (Certificates, BOMs, Invoices), links them to specific RFP clauses, and generates a cryptographically signed manifest for submission.

## Architecture
- **Storage**: AWS S3 (ap-south-1). Files are encrypted at rest using SSE-KMS.
- **Verification**: Double-blind verification against clause text using OCR (Tesseract/Textract).
- **Signing**: Manifests are signed using AWS KMS (RSA-2048).

## API Endpoints

### `POST /api/v1/vault/upload`
Uploads a file.
- **Body**: `multipart/form-data` (file)
- **Response**: `{ id, file_sha256, s3_key }`

### `POST /api/v1/vault/map`
Links a file to a clause.
- **Body**: `{ clause_id, file_id, page_range }`
- **Response**: `{ mapping_id, status }`

### `POST /api/v1/vault/manifest/generate`
Generates the final package. **Blocked** if Legal Approval is missing.
- **Response**: `{ manifest_json, signature, download_url }`

## Manual Setup (Dev/Local)
If AWS keys are missing, the system falls back to `mock` storage drivers.
1. Ensure `backend/main.go` is running.
2. Uploads will be "simulated" in memory (no disk IO in demo mode).
3. To switch to real S3:
   - Set `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `AWS_REGION=ap-south-1`.
   - Update `UploadVaultFileHandler` to use the AWS SDK.

## Testing
Run `go test ./backend/...` for unit tests.
Run `npx playwright test tests/e2e/vault.spec.ts` for E2E flows.
