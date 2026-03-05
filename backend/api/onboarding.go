package api

import (
	"crypto/rand"
	"fmt"
	"log"
	"math/big"
	"regexp"
	"strings"
	"time"

	"github.com/gofiber/fiber/v2"
	"github.com/google/uuid"
)

// RegistrationRequest struct to bind form data
type RegistrationRequest struct {
	CompanyName    string   `form:"company_name"`
	Shortcode      string   `form:"shortcode"` // Optional override
	PAN            string   `form:"pan"`
	GST            string   `form:"gst"`
	AuthName       string   `form:"auth_name"`
	AuthEmail      string   `form:"auth_email"`
	AuthMobile     string   `form:"auth_mobile"`
	Categories     []string `form:"categories"`
	PreferredState string   `form:"preferred_state"`
	DataLoc        string   `form:"data_loc"`
	Consent        bool     `form:"consent"`
}

// RegisterVendorHandler handles the multipart form submission
func RegisterVendorHandler(c *fiber.Ctx) error {
	var req RegistrationRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "Invalid form data"})
	}

	// 1. Validation
	if !req.Consent {
		return c.Status(400).JSON(fiber.Map{"error": "DPDP Consent is mandatory."})
	}
	if req.DataLoc != "india" {
		// Log Audit: Data Residency Violation Attempt
		log.Printf("[AUDIT] REGISTRATION_BLOCKED: %s attempted foreign hosting.", req.CompanyName)
		return c.Status(400).JSON(fiber.Map{"error": "Non-compliant Hosting Location. Must be ap-south-1."})
	}

	// 2. Handle File Uploads (Mock S3 ap-south-1)
	form, err := c.MultipartForm()
	if err == nil {
		// Process Certifications
		if certs := form.File["certifications"]; len(certs) > 0 {
			for _, file := range certs {
				// s3.Upload(file, "bucket-ap-south-1", "vendors/certs/" + file.Filename)
				log.Printf("Uploaded Cert: %s", file.Filename)
			}
		}
		// Process Hosting Proof
		if proofs := form.File["hosting_proof"]; len(proofs) > 0 {
			log.Printf("Uploaded Hosting Proof: %s", proofs[0].Filename)
		}
		// Process BOM
		if boms := form.File["bom_csv"]; len(boms) > 0 {
			log.Printf("Uploaded BOM: %s", boms[0].Filename)
		}
	}

	// 3. Generate Credentials
	vendorID := generateVendorID(req.CompanyName)
	tempPassword := generateSecurePassword()

	// 4. Create User Record (Mock DB Insert)
	// db.CreateUser(...) 
	// Log Audit
	log.Printf("[AUDIT] VENDOR_REGISTERED: ID=%s, Org=%s, IP=%s", vendorID, req.CompanyName, c.IP())

	// 5. Send Notifications (Mock)
	// email.SendSetPasswordLink(req.AuthEmail, oneTimeToken)
	if req.AuthMobile != "" {
		// sms.SendOTP(req.AuthMobile)
		log.Printf("SMS OTP Sent to %s", req.AuthMobile)
	}

	return c.JSON(fiber.Map{
		"status": "CREATED",
		"vendor_id": vendorID,
		"temp_password": tempPassword,
		"message": "Credentials generated. Displaying ONCE. Secure link sent to email.",
		"redirect": "/dashboard",
	})
}

// generateVendorID creates SB-{3consonants}-{4digits}
func generateVendorID(name string) string {
	// Extract consonants
	reg := regexp.MustCompile("[^bcdfghjklmnpqrstvwxyzBCDFGHJKLMNPQRSTVWXYZ]+")
	onlyConsonants := reg.ReplaceAllString(name, "")
	if len(onlyConsonants) < 3 {
		onlyConsonants = name + "XXX" // Fallback
	}
	prefix := strings.ToUpper(onlyConsonants[:3])

	// Generate 4 random digits
	n, _ := rand.Int(rand.Reader, big.NewInt(9000))
	digits := n.Int64() + 1000

	// Check collision (Mock) -> Append letter logic would go here
	// e.g. if db.Exists(id) { id += 'A' }

	return fmt.Sprintf("SB-%s-%d", prefix, digits)
}

// generateSecurePassword creates [Adjective][2digits][Syllable][Symbol]
// Entropy ~ 60 bits
func generateSecurePassword() string {
	adjectives := []string{"Solar", "Lunar", "Cyber", "Rapid", "Secure", "Hyper", "Sonic", "Vivid", "Prime", "Solid"}
	syllables := []string{"Xen", "Tek", "Nov", "Sys", "Net", "Vel", "Dyn", "Flux", "Orb", "Arc"}
	symbols := []string{"#", "@", "$", "!", "%", "&", "*"}

	adj := adjectives[getRandomIndex(len(adjectives))]
	syl := syllables[getRandomIndex(len(syllables))]
	sym := symbols[getRandomIndex(len(symbols))]
	
	n, _ := rand.Int(rand.Reader, big.NewInt(90))
	digits := n.Int64() + 10

	return fmt.Sprintf("%s%d%s%s", adj, digits, syl, sym)
}

func getRandomIndex(length int) int {
	n, _ := rand.Int(rand.Reader, big.NewInt(int64(length)))
	return int(n.Int64())
}
