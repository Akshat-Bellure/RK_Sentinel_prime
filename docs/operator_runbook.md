# Sentinel Operator Runbook

## Deployment (ap-south-1)
1. **Infrastructure**: Apply Terraform via `infra/terraform`.
   - `export AWS_REGION=ap-south-1`
   - `terraform apply`
2. **Secrets**: Inject `JWT_SECRET` and `DB_PASSWORD` via AWS Secrets Manager.
3. **AI Models**:
   - Weights for `llama-3-70b` must be pre-loaded to S3 bucket `sentinel-models-ap-south-1`.
   - Python service pulls weights on startup.

## Legal Gate Emergency Override
If Legal 2FA fails:
1. Root Admin must generate One-Time Bypass Token via Console.
2. `go run tools/bypass_2fa.go --ticket <TICKET_ID>`

## Audit
- Logs are shipped to CloudWatch Logs (Immutable).
- Run `scripts/audit_check.py` weekly to verify chain integrity.
