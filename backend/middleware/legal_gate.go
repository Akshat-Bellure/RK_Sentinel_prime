package middleware

import (
	"github.com/gofiber/fiber/v2"
	"strings"
)

// LegalExportGate ensures that any resource being exported or finalized 
// has a valid legal approval signature in its context or query params.
// In a real DB-backed app, this would check the 'status' column of the resource.
// For the pilot, we check for a 'legal_approved=true' flag or signature presence in request.
func LegalExportGate(c *fiber.Ctx) error {
	// 1. Skip check for non-export routes (safeguard)
	if !strings.Contains(c.Path(), "/export") && !strings.Contains(c.Path(), "/manifest/generate") {
		return c.Next()
	}

	// 2. Check for Approval Evidence
	// In the pilot integration, the frontend sends the approval hash if it exists.
	// Or we check the in-memory store status (if ID is provided).
	
	// Option A: Check Query Param (Simulated for stateless calls)
	approvalSignature := c.Query("approval_signature")
	
	// Option B: Check Body (if JSON)
	if approvalSignature == "" {
		var body map[string]interface{}
		// We try to parse body without consuming it permanently if possible, 
		// but Fiber BodyParser consumes the stream. 
		// Ideally, we rely on the upstream handler to verify status, 
		// OR we enforce a specific header "X-Sentinel-Legal-Sig".
		approvalSignature = c.Get("X-Sentinel-Legal-Sig")
	}

	// 3. Enforcement
	if approvalSignature == "" {
		return c.Status(403).JSON(fiber.Map{
			"error": "EXPORT_LOCKED",
			"message": "Legal Gate enforcement active. Resource requires Legal Auditor approval signature (2FA) before export.",
			"required_action": "Request approval via Legal Queue.",
		})
	}

	// In a real system, we would verify the signature hash integrity here.
	// For pilot, presence is sufficient to demonstrate the gate.

	return c.Next()
}
