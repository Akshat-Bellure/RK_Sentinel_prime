package api

import (
	"crypto/sha256"
	"encoding/csv"
	"encoding/hex"
	"fmt"
	"io"
	"log"
	"math"
	"strconv"
	"time"

	"github.com/gofiber/fiber/v2"
	"github.com/google/uuid"
)

// Data Structures
type BOMItem struct {
	Name            string  `json:"name"`
	HSCode          string  `json:"hs_code"`
	Quantity        float64 `json:"quantity"`
	UnitPriceLocal  float64 `json:"unit_price_local"`
	UnitPriceImport float64 `json:"unit_price_import"`
}

type CalculationResult struct {
	ID                  string    `json:"id"`
	FileSHA256          string    `json:"file_sha256"`
	UploaderID          string    `json:"uploader_id"`
	TotalCost           float64   `json:"total_cost"`
	LocalContentValue   float64   `json:"local_content_value"`
	LocalContentPercent float64   `json:"local_content_percent"`
	Status              string    `json:"status"` // CLASS_I, CLASS_II, NON_LOCAL
	Items               []BOMItem `json:"items"`
	Timestamp           time.Time `json:"timestamp"`
	IsOverridden        bool      `json:"is_overridden"`
	OverrideReason      string    `json:"override_reason,omitempty"`
}

type OverrideRequest struct {
	CalculationID string `json:"calculation_id"`
	NewStatus     string `json:"new_status"`
	Reason        string `json:"reason"`
	AuditorID     string `json:"auditor_id"`
}

// In-memory store
var Calculations = make(map[string]CalculationResult)
var AuditOverrides = []map[string]interface{}{}

// CalculateL1Handler parses CSV and calculates LC%
func CalculateL1Handler(c *fiber.Ctx) error {
	file, err := c.FormFile("bom_csv")
	if err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "CSV file required"})
	}

	src, err := file.Open()
	if err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "Failed to open file"})
	}
	defer src.Close()

	// Compute SHA256
	hash := sha256.New()
	if _, err := io.Copy(hash, src); err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "Hashing failed"})
	}
	fileHash := hex.EncodeToString(hash.Sum(nil))

	// Reset file pointer for CSV reading
	src.Seek(0, 0)
	reader := csv.NewReader(src)
	records, err := reader.ReadAll()
	if err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "Invalid CSV format"})
	}

	var items []BOMItem
	var totalCost, totalLocal float64

	// Skip header (Row 0)
	for i, record := range records {
		if i == 0 {
			continue
		}
		if len(record) < 5 {
			continue
		}

		qty, _ := strconv.ParseFloat(record[2], 64)
		priceLocal, _ := strconv.ParseFloat(record[3], 64)
		priceImport, _ := strconv.ParseFloat(record[4], 64)

		if qty < 0 || priceLocal < 0 || priceImport < 0 {
			return c.Status(400).JSON(fiber.Map{"error": fmt.Sprintf("Negative values found at row %d", i+1)})
		}

		itemCost := qty * (priceLocal + priceImport)
		itemLocal := qty * priceLocal

		totalCost += itemCost
		totalLocal += itemLocal

		items = append(items, BOMItem{
			Name:            record[0],
			HSCode:          record[1],
			Quantity:        qty,
			UnitPriceLocal:  priceLocal,
			UnitPriceImport: priceImport,
		})
	}

	lcPercent := 0.0
	if totalCost > 0 {
		lcPercent = (totalLocal / totalCost) * 100
	}

	status := "NON_LOCAL"
	if lcPercent >= 50.0 {
		status = "CLASS_I"
	} else if lcPercent >= 20.0 {
		status = "CLASS_II"
	}

	calcID := uuid.New().String()
	result := CalculationResult{
		ID:                  calcID,
		FileSHA256:          fileHash,
		UploaderID:          "Vendor-User-001", // Mock Context
		TotalCost:           math.Round(totalCost*100) / 100,
		LocalContentValue:   math.Round(totalLocal*100) / 100,
		LocalContentPercent: math.Round(lcPercent*100) / 100,
		Status:              status,
		Items:               items,
		Timestamp:           time.Now(),
	}

	Calculations[calcID] = result

	return c.JSON(result)
}

// OverrideL1Handler allows legal auditor to force a classification
func OverrideL1Handler(c *fiber.Ctx) error {
	var req OverrideRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "Invalid payload"})
	}

	calc, exists := Calculations[req.CalculationID]
	if !exists {
		return c.Status(404).JSON(fiber.Map{"error": "Calculation ID not found"})
	}

	// Immutable Log
	auditEntry := map[string]interface{}{
		"event":         "L1_OVERRIDE",
		"calculation_id": req.CalculationID,
		"old_status":    calc.Status,
		"new_status":    req.NewStatus,
		"reason":        req.Reason,
		"auditor_id":    req.AuditorID,
		"timestamp":     time.Now(),
	}
	AuditOverrides = append(AuditOverrides, auditEntry)

	// Apply Override
	calc.Status = req.NewStatus
	calc.IsOverridden = true
	calc.OverrideReason = req.Reason
	Calculations[req.CalculationID] = calc

	log.Printf("[AUDIT] L1 OVERRIDE: ID=%s Auditor=%s Reason=%s", req.CalculationID, req.AuditorID, req.Reason)

	return c.JSON(calc)
}

// SimulateSensitivityHandler calculates impact of changes
func SimulateSensitivityHandler(c *fiber.Ctx) error {
	type SimulationRequest struct {
		Items []BOMItem `json:"items"`
	}
	var req SimulationRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "Invalid items"})
	}

	var totalCost, totalLocal float64
	for _, item := range req.Items {
		totalCost += item.Quantity * (item.UnitPriceLocal + item.UnitPriceImport)
		totalLocal += item.Quantity * item.UnitPriceLocal
	}

	lcPercent := 0.0
	if totalCost > 0 {
		lcPercent = (totalLocal / totalCost) * 100
	}

	// Simple heuristic for PWin (Probability of Win) delta
	// Assuming Class-I (50%+) gives 20% margin preference
	pWinBase := 50.0 // Base probability
	if lcPercent >= 50.0 {
		pWinBase += 25.0 // High pref
	} else if lcPercent >= 20.0 {
		pWinBase += 10.0 // Entry level
	}
	
	return c.JSON(fiber.Map{
		"projected_lc_percent": math.Round(lcPercent*100) / 100,
		"projected_pwin":       pWinBase,
		"total_cost":           totalCost,
	})
}
