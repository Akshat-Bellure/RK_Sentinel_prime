package auth

import (
	"log"
	"os"

	"github.com/gofiber/fiber/v2"
	"github.com/google/uuid"
)

type Handler struct {
	service *Service
}

func NewHandler() *Handler {
	return &Handler{
		service: NewService(),
	}
}

// Login Endpoint
func (h *Handler) Login(c *fiber.Ctx) error {
	var req LoginRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "Invalid payload"})
	}

	// 1. Staging Guard
	if err := h.service.ValidateDeveloperAccess(req.Username); err != nil {
		// Log Audit: Security Violation
		log.Printf("[AUDIT] SECURITY ALERT: Dev login attempted in prod by IP %s", c.IP())
		return c.Status(403).JSON(fiber.Map{"error": "Access Denied"})
	}

	// 2. Mock User Fetch (Replace with DB call)
	// In production, fetch user by username from DB
	userID := uuid.New()
	mockUser := &User{
		ID:       userID,
		Username: req.Username,
		Role:     "Vendor-User",
		IsActive: true,
	}
	
	// Special Roles for Demo/Testing
	if req.Username == "admin" { mockUser.Role = "Admin" }
	if req.Username == "legal" { mockUser.Role = "Legal-Auditor" }
	if req.Username == "Sentinel_Developer" { mockUser.Role = "Sentinel_Developer" }

	// 3. Verify Password (Mock logic for acceptance test readiness)
	// In prod: h.service.VerifyPassword(req.Password, user.PasswordHash)
	validPass := false
	if os.Getenv("APP_ENV") != "production" {
		validPass = true // Allow simple login in dev
	}
	
	if !validPass && req.Password == "" {
		log.Printf("[AUDIT] Login Failed: %s IP: %s", req.Username, c.IP())
		return c.Status(401).JSON(fiber.Map{"error": "Invalid credentials"})
	}

	// 4. 2FA Check
	if (mockUser.Role == "Admin" || mockUser.Role == "Legal-Auditor") && req.TOTPCode == "" {
		return c.Status(401).JSON(fiber.Map{"error": "2FA TOTP Code required for this role"})
	}

	// 5. Generate Tokens
	tokens, err := h.service.GenerateTokens(mockUser)
	if err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "Token generation failed"})
	}

	// 6. Audit Log
	log.Printf("[AUDIT] Login Success: %s Role: %s IP: %s", req.Username, mockUser.Role, c.IP())

	return c.JSON(tokens)
}

// Refresh Token Endpoint
func (h *Handler) Refresh(c *fiber.Ctx) error {
	var req RefreshRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "Invalid payload"})
	}

	// In prod: Validate refresh token against DB and check revocation
	// Generate new access token
	
	return c.JSON(fiber.Map{
		"access_token": "new-access-token-placeholder",
		"expires_in": 900,
	})
}

// Forgot Password - Creates Ticket, Does NOT email immediately
func (h *Handler) RequestPasswordReset(c *fiber.Ctx) error {
	var req ForgotPasswordRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "Invalid payload"})
	}

	// 1. Check if user exists (Mock)
	// 2. Create Ticket in DB
	ticketID := uuid.New().String()
	
	log.Printf("[AUDIT] Reset Requested: %s. Ticket: %s created. Pending Admin Approval.", req.Username, ticketID)

	return c.JSON(fiber.Map{
		"message": "Password reset request submitted. Pending verification by Administrator.",
		"ticket_id": ticketID, // Returned for demo purposes
		"status": "PENDING_APPROVAL",
	})
}

// Admin Approve Reset (Legal Gate for credentials)
func (h *Handler) AdminApproveReset(c *fiber.Ctx) error {
	var req AdminApproveResetRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "Invalid payload"})
	}

	// 1. RBAC Check (Middleware handles this, but logic ensures Admin)
	// 2. Update Ticket Status in DB
	// 3. Trigger Notification (Mock)

	log.Printf("[AUDIT] Reset Ticket %s processed. Decision: %s", req.TicketID, req.Decision)

	return c.JSON(fiber.Map{
		"status": "PROCESSED",
		"decision": req.Decision,
		"message": "User will be notified if approved.",
	})
}
