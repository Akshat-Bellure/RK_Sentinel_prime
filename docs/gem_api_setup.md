# GeM & CPPP API Integration Guide

## Overview
Sentinel Prime uses an Adapter Pattern to ingest tenders from multiple sources. By default, the system runs in **Mock Mode** using `adapters/gem_mock.go`.

## Prerequisites
1.  **GeM Developer Account**: Register at [https://gem.gov.in/developer](https://gem.gov.in/developer).
2.  **CPPP API Access**: Request XML Feed access via NIC portal.
3.  **Whitelisting**: Ensure your Production IP (ap-south-1 NAT Gateway) is whitelisted by GeM/NIC.

## Configuration Steps

### 1. Set Environment Variables
In your AWS Secrets Manager or `.env` file (Staging only), add:
```bash
GEM_API_BASE_URL="https://api.gem.gov.in/v2"
GEM_API_KEY="<YOUR_GEM_API_KEY>"
CPPP_XML_FEED_URL="https://eprocure.gov.in/cppp/xml/feeds"
```

### 2. Enable Real Adapter in `backend/api/ingest.go`
Currently, the sync handler uses the mock adapter:
```go
// backend/api/ingest.go
adapter = adapters.NewGeMAdapter("mock-key")
```

Change this to use the live adapter (once implemented in `backend/adapters/gem_live.go`):
```go
// adapter = adapters.NewLiveGeMAdapter(os.Getenv("GEM_API_KEY"))
```

## Security Constraints
*   **No Scraping**: Do not implement HTML scraping logic. Use only official APIs.
*   **Verification**: Tenders ingested via API are automatically marked `verified=true` if the digital signature matches.
*   **Rate Limiting**: The Adapter must respect GeM's rate limit (default: 100 requests/minute).

## Troubleshooting
*   **403 Forbidden**: Check IP Whitelisting.
*   **Empty Feed**: Verify categories in your GeM profile subscription.
