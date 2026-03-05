package main

import (
	"log"

	"github.com/gofiber/fiber/v2"
	"github.com/gofiber/fiber/v2/middleware/cors"
	"github.com/gofiber/fiber/v2/middleware/helmet"
	"github.com/gofiber/fiber/v2/middleware/logger"
	
	"github.com/gov-india/sentinel-bharat/backend/api"
	"github.com/gov-india/sentinel-bharat/backend/auth"
	"github.com/gov-india/sentinel-bharat/backend/config"
	"github.com/gov-india/sentinel-bharat/backend/middleware"
)

func main() {
	// 1. Config & Safety Checks
	cfg := config.Load()
	if cfg.Region != "ap-south-1" {
		log.Printf("WARNING: Data Residency Check Failed. Expected ap-south-1, got %s", cfg.Region)
	}

	// 2. Fiber App
	app := fiber.New(fiber.Config{
		AppName:       "Sentinel Prime Core v1.2",
		ServerHeader:  "Sentinel-Secure",
		CaseSensitive: true,
		StrictRouting: true,
		BodyLimit:     100 * 1024 * 1024,
	})

	// 3. Middleware
	app.Use(logger.New())
	app.Use(helmet.New())
	app.Use(cors.New(cors.Config{
		AllowOrigins: "https://sentinel.gov.in, http://localhost:3000",
		AllowHeaders: "Origin, Content-Type, Accept, Authorization, X-Sentinel-2FA, X-Sentinel-Legal-Sig",
		AllowMethods: "GET, POST, PUT, DELETE, OPTIONS",
	}))

	// 4. Routes
	apiGroup := app.Group("/api/v1")
	authHandler := auth.NewHandler()

	// Auth Routes
	authGroup := apiGroup.Group("/auth")
	authGroup.Post("/login", authHandler.Login)
	authGroup.Post("/refresh", authHandler.Refresh)
	authGroup.Post("/forgot-password", authHandler.RequestPasswordReset)
	authGroup.Post("/admin/approve-reset", auth.RequireRole("Admin"), authHandler.AdminApproveReset)

	// Onboarding Routes
	onboarding := apiGroup.Group("/onboarding")
	onboarding.Post("/register", api.RegisterVendorHandler)

	// Protected Routes (JWT Required)
	protected := apiGroup.Use(auth.JwtMiddleware)
	
	// Ingestion Routes
	protected.Post("/tenders/ingest", api.IngestTenderHandler)
	protected.Post("/tenders/sync", api.SyncTendersHandler)
	protected.Post("/webhooks/feed", api.CommercialWebhookHandler)

	protected.Get("/analysis/clauses/:id", api.GetClausesHandler)
	protected.Post("/verify/citation", api.VerifyCitationHandler)
	
	// Pre-Bid Routes
	protected.Post("/prebid/draft", api.CreateDraftHandler)

	// Vault
	vault := protected.Group("/vault")
	vault.Get("/keys", api.GetVaultKeysHandler)
	vault.Post("/wallet/connect", api.ConnectWalletHandler)
	vault.Post("/upload", api.UploadVaultFileHandler)
	vault.Post("/map", api.MapEvidenceHandler)
	vault.Post("/verify", api.VerifyEvidenceHandler)
	
	// SENSITIVE: Manifest Generation requires Legal Gate
	vault.Post("/manifest/generate", middleware.LegalExportGate, api.GenerateManifestHandler)
	vault.Post("/sign-manifest", middleware.LegalExportGate, api.SignManifestHandler) 

	// Legal Routes (RBAC Enforced)
	legal := protected.Use(auth.RequireRole("Legal-Auditor", "Admin"))
	legal.Get("/legal/queue", api.GetLegalQueueHandler)
	legal.Post("/legal/approve", auth.Require2FA, api.ApproveTicketHandler)
	legal.Post("/calculator/override", auth.Require2FA, api.OverrideL1Handler)

	// Calculator Routes
	calc := protected.Group("/calculator")
	calc.Post("/calculate", api.CalculateL1Handler)
	calc.Post("/simulate", api.SimulateSensitivityHandler)

	// 5. Start
	log.Printf("Sentinel Prime Core active on :%s (Region: %s)", cfg.Port, cfg.Region)
	log.Fatal(app.Listen(":" + cfg.Port))
}
