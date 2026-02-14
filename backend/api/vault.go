package api

import (
	"crypto/sha256"
	"encoding/hex"
	"fmt"
	"time"

	"github.com/gofiber/fiber/v2"
	"github.com/google/uuid"
)

// In-memory mock storage for demo purposes (Replace with DB in prod)
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

	// In prod: Verify signature challenge from wallet
	return c.JSON(fiber.Map{
		"status": "connected",
		"wallet_address": "0x71C7656EC7ab88b098defB751B7401B5f6d8976F",
		"provider": req.Type,
		"timestamp": time.Now(),
	})
}

// UploadVaultFileHandler handles file uploads
func UploadVaultFileHandler(c *fiber.Ctx) error {
	file, err := c.FormFile("file")
	if err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "No file uploaded"})
	}

	// 1. Compute SHA-256
	src, err := file.Open()
	if err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "File open error"})
	}
	defer src.Close()

	hash := sha256.New()
	// Copy buffer to hash (mocking the read)
	// io.Copy(hash, src) 
	// Reset for "upload"
	// src.Seek(0, 0)
	
	fileHash := hex.EncodeToString(hash.Sum(nil))
	// Mock hash for demo uniqueness
	if fileHash == "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855" {
		fileHash = uuid.New().String() 
	}

	// 2. Mock S3 Upload (ap-south-1)
	s3Key := fmt.Sprintf("vault/%s/%s", time.Now().Format("2006/01"), file.Filename)

	// 3. Mock OCR Pipeline Trigger
	// go runOCR(s3Key)

	record := fiber.Map{
		"id": uuid.New().String(),
		"filename": file.Filename,
		"file_sha256": fileHash,
		"file_size": file.Size,
		"upload_time": time.Now(),
		"verified": false,
		"s3_key": s3Key,
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

	// Mock Logic: Check if Mapping Exists
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

	// Simulate Check
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
	// 1. Check Legal Gate
	// if !checkLegalApproval(c.Query("tender_id")) { return 403 }

	// 2. Create Manifest JSON
	manifest := fiber.Map{
		"package_id": uuid.New().String(),
		"files": mockFiles,
		"generated_at": time.Now(),
		"region": "ap-south-1",
	}

	// 3. Sign Manifest (KMS Mock)
	// signature := kms.Sign(manifest)

	return c.JSON(fiber.Map{
		"manifest": manifest,
		"signature": "sig_rsa_sha256_...",
		"download_url": "/api/v1/vault/download/package.zip",
	})
}

// SignManifestHandler from previous turn (kept for compatibility)
func SignManifestHandler(c *fiber.Ctx) error {
	return GenerateManifestHandler(c)
}
