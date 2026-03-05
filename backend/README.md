# Sentinel Prime Backend (Go Fiber)

## Authentication & Security
The auth microservice implements a secure OAuth2 flow with the following features:

### 1. Roles & Permissions
| Role | Access Level | 2FA Required |
|------|--------------|--------------|
| `Admin` | Full System | ✅ Yes |
| `Legal-Auditor` | Verify, Approve, View Vault | ✅ Yes |
| `Vendor-User` | Upload, Dashboard, Pre-Bid | No |
| `Sentinel_Developer` | **STAGING ONLY** | No |

### 2. Password Policy
- Hashing: **Argon2id** (Memory: 64MB, Time: 1, Threads: 4).
- Reset Flow: "Legal Gate" - Users request reset, Admin must approve the ticket before a magic link is sent.

### 3. Developer Safety
The `Sentinel_Developer` account is hard-coded to fail if `APP_ENV=production`. 
Check `backend/auth/service.go:ValidateDeveloperAccess`.

## Local Development

```bash
# 1. Run Tests
go test ./auth/...

# 2. Start Server (Dev Mode)
export APP_ENV=staging
export JWT_SECRET=dev-secret-do-not-use-in-prod
go run main.go
```

## Production Config (ap-south-1)
Secrets must be injected via AWS Secrets Manager:
- `DB_PASSWORD`
- `JWT_SECRET`
- `TOTP_ENCRYPTION_KEY`
