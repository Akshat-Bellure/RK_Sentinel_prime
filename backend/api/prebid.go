package api

import (
	"log"
	"time"

	"github.com/gofiber/fiber/v2"
	"github.com/google/uuid"
	"github.com/gov-india/sentinel-bharat/backend/services"
)

// Ticket represents a Pre-Bid Draft awaiting Legal Approval
type Ticket struct {
	ID                string               `json:"id"`
	TenderID          string               `json:"tender_id"`
	ClauseID          string               `json:"clause_id"`
	Title             string               `json:"title"`
	QueryText         string               `json:"query_text"`
	Author            string               `json:"author"`
	RiskLevel         string               `json:"risk"`
	Status            string               `json:"status"` // PENDING, APPROVED, REJECTED, BLOCKED
	Citations         []string             `json:"citations"`
	CreatedAt         time.Time            `json:"created_at"`
	ApprovalSignature string               `json:"approval_signature,omitempty"`
	ApproverID        string               `json:"approver_id,omitempty"`
	Violations        []services.Violation `json:"violations,omitempty"`
	BlockedOutput     bool                 `json:"blocked_output"`
}

// In-memory store for pilot
var TicketStore = []Ticket{}

type CreateDraftRequest struct {
	TenderID   string   `json:"tender_id"`
	ClauseID   string   `json:"clause_id"`
	ClauseText string   `json:"clause_text"`
	Category   string   `json:"category"`
	Tone       string   `json:"tone"`
	Risk       string   `json:"risk"`
	Citations  []string `json:"citations"`
}

// CreateDraftHandler generates a query and creates a ticket
func CreateDraftHandler(c *fiber.Ctx) error {
	var req CreateDraftRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "Invalid payload"})
	}

	// 1. Verification Check (Mock - assume citations passed are verified if they exist)
	// In production, we'd verify them here against the Verifier Engine.
	citationsVerified := true 
	if len(req.Citations) > 0 {
		// Mock logic: fail verification if citation contains "unverified" string
		for _, cit := range req.Citations {
			if cit == "unverified" { 
				citationsVerified = false 
			}
		}
	}

	// 2. Generate Query Text via Service
	generatedText := services.GenerateQuery(
		req.ClauseID, 
		req.ClauseText, 
		req.Category, 
		req.Tone, 
		req.Citations,
	)

	// 3. Run Policy Rules Engine
	complianceReport := services.ValidateContent(generatedText, citationsVerified)

	status := "PENDING"
	blocked := false
	if complianceReport.Blocked {
		status = "BLOCKED"
		blocked = true
	}

	// 4. Create Ticket
	ticket := Ticket{
		ID:            "TKT-" + uuid.New().String()[:8],
		TenderID:      req.TenderID,
		ClauseID:      req.ClauseID,
		Title:         "Query: " + req.Category,
		QueryText:     generatedText,
		Author:        "Vendor User", // In prod, get from JWT
		RiskLevel:     req.Risk,
		Status:        status,
		Citations:     req.Citations,
		CreatedAt:     time.Now(),
		Violations:    complianceReport.Violations,
		BlockedOutput: blocked,
	}

	TicketStore = append(TicketStore, ticket)

	log.Printf("[AUDIT] DRAFT_CREATED: ID=%s Tender=%s Risk=%s Blocked=%v", ticket.ID, ticket.TenderID, ticket.RiskLevel, blocked)

	if blocked {
		return c.Status(422).JSON(fiber.Map{
			"status": "BLOCKED",
			"error": "Content Policy Violation",
			"ticket": ticket,
			"violations": complianceReport.Violations,
			"message": "Draft blocked by Rules Engine. Legal ticket created automatically.",
		})
	}

	return c.JSON(fiber.Map{
		"status": "CREATED",
		"ticket": ticket,
		"message": "Draft generated and submitted to Legal Queue.",
	})
}
