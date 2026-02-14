package main

import (
	"log"
	"os"

	"github.com/gofiber/fiber/v2"
	"github.com/gofiber/fiber/v2/middleware/cors"
	"github.com/gofiber/fiber/v2/middleware/helmet"
	"github.com/gofiber/fiber/v2/middleware/logger"
	
	"github.com/gov-india/sentinel-bharat/backend/api"
	"github.com/gov-india/sentinel-bharat/backend/auth"
)

func main() {
	// 1. Initialize Fiber with strict security config
	app := fiber.New(fiber.Config{
		AppName:       "Sentinel Prime Core v1.1",
		ServerHeader:  "Sentinel-Secure",
		CaseSensitive: true,
		StrictRouting: true,
		BodyLimit:     100 * 1024 * 1024, // 100MB Upload Limit
	})

	// 2. Middleware Stack
	app.Use(logger.New())
	app.Use(helmet.New())
	app.Use(cors.New(cors.Config{
		AllowOrigins: "https://sentinel.gov.in, http://localhost:3000",
		AllowHeaders: "Origin, Content-Type, Accept, Authorization, X-Sentinel-2FA",
		AllowMethods: "GET, POST, PUT, DELETE, OPTIONS",
	}))

	// 4. Routes
	apiGroup := app.Group("/api/v1")

	// Public Routes
	apiGroup.Post("/auth/login", auth.LoginHandler)
	apiGroup.Post("/webhooks/gem", api.GemWebhookHandler)

	// Protected Routes (JWT Required)
	protected := apiGroup.Use(auth.JwtMiddleware)
	
	// Dashboard & Analysis
	protected.Post("/tenders/ingest", api.IngestTenderHandler)
	protected.Get("/analysis/clauses/:id", api.GetClausesHandler)
	
	// Verification Engine
	protected.Post("/verify/citation", api.VerifyCitationHandler)
	
	// Evidence Vault API
	vault := protected.Group("/vault")
	vault.Get("/keys", api.GetVaultKeysHandler)
	vault.Post("/wallet/connect", api.ConnectWalletHandler)
	vault.Post("/upload", api.UploadVaultFileHandler)
	vault.Post("/map", api.MapEvidenceHandler)
	vault.Post("/verify", api.VerifyEvidenceHandler)
	vault.Post("/manifest/generate", api.GenerateManifestHandler)
	vault.Post("/sign-manifest", api.SignManifestHandler) // Legacy alias

	// Legal Gate
	legal := protected.Use(auth.RequireRole("Legal-Auditor", "Admin"))
	legal.Post("/legal/approve", auth.Require2FA, api.ApproveDraftHandler)

	// 5. Start Server
	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}
	log.Fatal(app.Listen(":" + port))
}
