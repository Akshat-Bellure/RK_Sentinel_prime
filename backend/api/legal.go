package api

import (
	"crypto/sha256"
	"encoding/hex"
	"fmt"
	"log"
	"time"

	"github.com/gofiber/fiber/v2"
)

type ApprovalRequest struct {
	TicketID  string `json:"ticket_id"`
	Decision  string `json:"decision"` // APPROVED | REJECTED
	Signature string `json:"signature"` // Name of auditor
	TOTPCode  string `json:"totp_code"`
}

// GetLegalQueueHandler returns pending tickets
func GetLegalQueueHandler(c *fiber.Ctx) error {
	// Filter for PENDING tickets
	var pending []Ticket
	for _, t := range TicketStore {
		if t.Status == "PENDING" {
			pending = append(pending, t)
		}
	}
	return c.JSON(fiber.Map{"queue": pending})
}

// ApproveTicketHandler handles the 2FA sign-off
func ApproveTicketHandler(c *fiber.Ctx) error {
	var req ApprovalRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "Invalid payload"})
	}

	// 1. Validate Ticket Existence
	var targetIdx int = -1
	for i, t := range TicketStore {
		if t.ID == req.TicketID {
			targetIdx = i
			break
		}
	}

	if targetIdx == -1 {
		return c.Status(404).JSON(fiber.Map{"error": "Ticket not found"})
	}

	// 2. Validate Decision
	if req.Decision != "APPROVED" && req.Decision != "REJECTED" {
		return c.Status(400).JSON(fiber.Map{"error": "Invalid decision"})
	}

	// 3. Cryptographic Sign-off (Mock 2FA validation passed by middleware)
	// Create an immutable hash of the approval
	payload := fmt.Sprintf("%s:%s:%s:%s", req.TicketID, req.Decision, req.Signature, time.Now().String())
	hash := sha256.Sum256([]byte(payload))
	signatureHash := hex.EncodeToString(hash[:])

	// 4. Update Ticket
	TicketStore[targetIdx].Status = req.Decision
	TicketStore[targetIdx].ApprovalSignature = signatureHash
	TicketStore[targetIdx].ApproverID = req.Signature // Using name as ID for pilot

	// 5. Audit Log
	log.Printf("[AUDIT] LEGAL_DECISION: Ticket=%s Decision=%s Signer=%s Sig=%s", 
		req.TicketID, req.Decision, req.Signature, signatureHash)

	return c.JSON(fiber.Map{
		"status": "SUCCESS",
		"ticket_id": req.TicketID,
		"new_status": req.Decision,
		"approval_hash": signatureHash,
	})
}
