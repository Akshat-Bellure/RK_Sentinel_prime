package api

import (
	"crypto/sha256"
	"encoding/hex"
	"fmt"
	"strings"
	"time"

	"github.com/gofiber/fiber/v2"
	"github.com/google/uuid"
)

// In-memory mock storage
var mockFiles = []fiber.Map{}
var mockMappings = []fiber.Map{}
var mockKeys = []fiber.Map{
	{
		"id":          "key-ap-south-1-001",
		"created_at":  time.Now().Add(-24 * time.Hour).Format(time.RFC3339),
		"purpose":     "manifest_signing",
		"thumbprint":  "a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6",
		"algorithm":   "RSA-2048",
		"region":      "ap-south-1",
	},
}

// GetVaultKeysHandler returns public keys
func GetVaultKeysHandler(c *fiber.Ctx) error {
	return c.JSON(fiber.Map{
		"keys": mockKeys,
		"region": "ap-south-1",
	})
}

// ConnectWalletHandler simulates a wallet connection
func ConnectWalletHandler(c *fiber.Ctx) error {
	type WalletRequest struct {
		Type string `json:"type"` // "local", "kms", "external"
	}
	var req WalletRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "Invalid Request"})
	}

	return c.JSON(fiber.Map{
		"status": "connected",
		"wallet_address": "0x71C7656EC7ab88b098defB751B7401B5f6d8976F",
		"provider": req.Type,
		"timestamp": time.Now(),
	})
}

// UploadVaultFileHandler handles file uploads with versioning and auto-tagging
func UploadVaultFileHandler(c *fiber.Ctx) error {
	file, err := c.FormFile("file")
	if err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "No file uploaded"})
	}

	// 1. Compute SHA-256 (Simulated)
	src, err := file.Open()
	if err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "File open error"})
	}
	defer src.Close()

	hash := sha256.New()
	fileHash := hex.EncodeToString(hash.Sum(nil)) 
	// Mock hash uniqueness for demo
	if fileHash == "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855" {
		fileHash = uuid.New().String() 
	}

	// 2. Versioning Logic
	version := 1
	for _, f := range mockFiles {
		if f["filename"] == file.Filename {
			v := f["version"].(int)
			if v >= version {
				version = v + 1
			}
		}
	}

	// 3. Auto-OCR / Metadata Extraction (Mock)
	tags := []string{"General"}
	expiry := time.Now().AddDate(1, 0, 0).Format("2006-01-02") // Default 1 year
	
	filenameLower := strings.ToLower(file.Filename)
	if strings.Contains(filenameLower, "gst") {
		tags = []string{"Financial", "Tax"}
	} else if strings.Contains(filenameLower, "iso") || strings.Contains(filenameLower, "cert") {
		tags = []string{"Compliance", "Certification"}
		expiry = time.Now().AddDate(3, 0, 0).Format("2006-01-02")
	} else if strings.Contains(filenameLower, "balance") {
		tags = []string{"Financial", "Audit"}
	}

	// 4. Mock S3 Upload (ap-south-1)
	s3Key := fmt.Sprintf("vault/%s/v%d/%s", time.Now().Format("2006/01"), version, file.Filename)

	record := fiber.Map{
		"id": uuid.New().String(),
		"filename": file.Filename,
		"version": version,
		"file_sha256": fileHash,
		"file_size": file.Size,
		"upload_time": time.Now(),
		"verified": false,
		"s3_key": s3Key,
		"tags": tags,
		"expiry_date": expiry,
		"ocr_status": "COMPLETED",
	}
	mockFiles = append(mockFiles, record)

	return c.JSON(record)
}

// MapEvidenceHandler maps a file to a clause
func MapEvidenceHandler(c *fiber.Ctx) error {
	type MapRequest struct {
		ClauseID string `json:"clause_id"`
		FileID   string `json:"file_id"`
		PageRange string `json:"page_range"`
	}
	var req MapRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "Invalid Request"})
	}

	mapping := fiber.Map{
		"id": uuid.New().String(),
		"clause_id": req.ClauseID,
		"file_id": req.FileID,
		"page_range": req.PageRange,
		"status": "PENDING_VERIFICATION",
		"mapped_at": time.Now(),
	}
	mockMappings = append(mockMappings, mapping)

	return c.JSON(mapping)
}

// VerifyEvidenceHandler performs verification
func VerifyEvidenceHandler(c *fiber.Ctx) error {
	type VerifyRequest struct {
		MappingID string `json:"mapping_id"`
	}
	var req VerifyRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "Invalid Request"})
	}

	var targetMapping fiber.Map
	for _, m := range mockMappings {
		if m["id"] == req.MappingID {
			targetMapping = m
			break
		}
	}

	if targetMapping == nil {
		return c.Status(404).JSON(fiber.Map{"error": "Mapping not found"})
	}

	verification := fiber.Map{
		"verified": true,
		"match_score": 0.98,
		"verifier_id": "auto-bot-v1",
		"proof_hash": "a8f9c...",
	}

	return c.JSON(verification)
}

// GenerateManifestHandler creates the final package
func GenerateManifestHandler(c *fiber.Ctx) error {
	// 1. Gather Artifacts based on Mappings
	mappedFiles := []fiber.Map{}
	for _, m := range mockMappings {
		fileID := m["file_id"]
		for _, f := range mockFiles {
			if f["id"] == fileID {
				// Clone and add context
				artifact := fiber.Map{
					"clause_id": m["clause_id"],
					"file_id": f["id"],
					"filename": f["filename"],
					"sha256": f["file_sha256"],
					"s3_key": f["s3_key"],
					"tags": f["tags"],
				}
				mappedFiles = append(mappedFiles, artifact)
				break
			}
		}
	}

	if len(mappedFiles) == 0 {
		return c.Status(400).JSON(fiber.Map{"error": "No artifacts mapped to clauses. Cannot generate manifest."})
	}

	// 2. Create Manifest JSON
	manifest := fiber.Map{
		"manifest_id": uuid.New().String(),
		"tender_id": "GEM/2025/B/4829", // Mock Context
		"generated_at": time.Now(),
		"region": "ap-south-1",
		"artifacts": mappedFiles,
		"compliance_summary": fiber.Map{
			"total_clauses": 3,
			"mapped_evidence": len(mappedFiles),
			"status": "PARTIAL",
		},
	}

	// 3. Sign Manifest (Placeholder for HSM)
	signaturePlaceholder := "SIG_RSA_SHA256_PLACEHOLDER_HSM_UNAVAILABLE"
	
	// Instructions for offline signing
	instructions := "HSM signing service unreachable. Use 'manifest.json' with offline signer tool (pkcs11-tool) and upload signature."

	return c.JSON(fiber.Map{
		"manifest": manifest,
		"signature": signaturePlaceholder,
		"signing_instructions": instructions,
		"download_url": "/api/v1/vault/download/package.zip",
	})
}

func SignManifestHandler(c *fiber.Ctx) error {
	return GenerateManifestHandler(c)
}
