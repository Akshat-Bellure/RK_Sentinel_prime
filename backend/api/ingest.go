package api

import (
	"log"
	"time"
	"strconv"

	"github.com/gofiber/fiber/v2"
	"github.com/google/uuid"
	"github.com/gov-india/sentinel-bharat/backend/adapters"
)

// In-Memory Storage for Pilot
var TenderStore = []adapters.TenderMetadata{}

// IngestTenderHandler handles Manual Uploads (Multipart Form)
func IngestTenderHandler(c *fiber.Ctx) error {
	// 1. Parse Metadata
	title := c.FormValue("title")
	refID := c.FormValue("ref_id")
	category := c.FormValue("category")
	valueStr := c.FormValue("value")
	
	value, _ := strconv.ParseFloat(valueStr, 64)

	// 2. Handle File
	file, err := c.FormFile("pdf_file")
	if err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "PDF File is mandatory"})
	}

	// 3. Mock Save to Storage (S3)
	// In production: s3.Upload(file.Open(), "bucket", "key")
	s3Key := "tenders/manual/" + file.Filename

	// 4. Create Record
	metadata := adapters.TenderMetadata{
		SourceRefID:  refID,
		Title:        title,
		Category:     category,
		ValueINR:     value,
		PublishDate:  time.Now(),
		ClosingDate:  time.Now().AddDate(0, 0, 30), // Default
		Location:     "Manual Upload",
		Organization: "Unknown",
		IsVerified:   false, // Manual uploads are unverified by default
		SourceSystem: "MANUAL",
		DownloadURL:  s3Key,
	}

	// Persist to Store
	TenderStore = append(TenderStore, metadata)

	log.Printf("[AUDIT] MANUAL_INGEST: User=%s Ref=%s File=%s", "unknown", refID, file.Filename)

	return c.JSON(fiber.Map{
		"status": "INGESTED",
		"id":     uuid.New().String(),
		"data":   metadata,
		"message": "Tender uploaded successfully. Status: UNVERIFIED (Pending Operator Review).",
	})
}

// SyncTendersHandler triggers the GeM/CPPP adapters
func SyncTendersHandler(c *fiber.Ctx) error {
	source := c.Query("source", "GEM")
	
	var adapter adapters.TenderSource
	
	switch source {
	case "GEM":
		adapter = adapters.NewGeMAdapter("mock-key")
	default:
		return c.Status(400).JSON(fiber.Map{"error": "Unsupported source"})
	}

	tenders, err := adapter.FetchTenders()
	if err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "Adapter fetch failed"})
	}

	// Merge into Store (De-duplication mock logic could go here)
	for _, t := range tenders { 
		exists := false
		for _, existing := range TenderStore {
			if existing.SourceRefID == t.SourceRefID {
				exists = true
				break
			}
		}
		if !exists {
			TenderStore = append(TenderStore, t)
		}
	}

	log.Printf("[AUDIT] ADAPTER_SYNC: Source=%s Count=%d", source, len(tenders))

	return c.JSON(fiber.Map{
		"status": "SYNC_COMPLETE",
		"source": source,
		"new_tenders": len(tenders),
		"data": tenders,
	})
}

// CommercialWebhookHandler receives feed updates (Stub)
func CommercialWebhookHandler(c *fiber.Ctx) error {
	var payload map[string]interface{}
	if err := c.BodyParser(&payload); err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "Invalid Payload"})
	}

	log.Printf("[AUDIT] WEBHOOK_RECEIVED: %v", payload)
	
	return c.JSON(fiber.Map{"status": "RECEIVED"})
}
