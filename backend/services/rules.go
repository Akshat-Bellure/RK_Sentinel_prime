package services

import (
	"regexp"
	"strings"
)

// Violation represents a specific rule breach
type Violation struct {
	RuleID      string `json:"rule_id"`
	Description string `json:"description"`
	Severity    string `json:"severity"` // BLOCKING | WARNING
}

// ComplianceReport holds the result of the validation
type ComplianceReport struct {
	Blocked       bool        `json:"blocked"`
	Violations    []Violation `json:"violations"`
	BlockedReason string      `json:"blocked_reason,omitempty"`
}

// ValidateContent checks text against compliance rules
func ValidateContent(text string, citationsVerified bool) ComplianceReport {
	var violations []Violation
	textLower := strings.ToLower(text)

	// Rule 1: Off-Portal Contact (Anti-Corruption)
	// Detects emails, phone numbers, or phrases asking for direct contact
	emailRegex := regexp.MustCompile(`[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}`)
	phoneRegex := regexp.MustCompile(`(\+\d{1,2}\s?)?\(?\d{3}\)?[\s.-]?\d{3}[\s.-]?\d{4}`)
	
	if emailRegex.MatchString(text) || 
	   phoneRegex.MatchString(text) || 
	   strings.Contains(textLower, "contact us directly") || 
	   strings.Contains(textLower, "offline meeting") {
		violations = append(violations, Violation{
			RuleID:      "RULE-NO-OFF-PORTAL",
			Description: "Output instructs off-portal contact (email/phone/meeting).",
			Severity:    "BLOCKING",
		})
	}

	// Rule 2: Brand Favoritism (CVC Guidelines)
	// Detects specific brand names combined with mandatory language
	// Pilot list of major tech brands often cited
	restrictedBrands := []string{"cisco", "aws", "azure", "oracle", "hp", "dell", "microsoft"}
	mandatoryTerms := []string{"must use", "mandatory", "only", "required"}
	
	for _, brand := range restrictedBrands {
		if strings.Contains(textLower, brand) {
			isMandatory := false
			for _, term := range mandatoryTerms {
				if strings.Contains(textLower, term) {
					isMandatory = true
					break
				}
			}
			if isMandatory {
				violations = append(violations, Violation{
					RuleID:      "RULE-BRAND-NEUTRALITY",
					Description: "Output implies favoritism towards specific brand: " + brand,
					Severity:    "BLOCKING",
				})
			}
		}
	}

	// Rule 3: Collusion / Anti-Competitive Strategy
	collusionKeywords := []string{
		"price fixing", 
		"suppress competition", 
		"coordinate with", 
		"pool resources with other bidders",
		"bid rotation",
		"market allocation",
	}
	for _, kw := range collusionKeywords {
		if strings.Contains(textLower, kw) {
			violations = append(violations, Violation{
				RuleID:      "RULE-ANTI-COLLUSION",
				Description: "Output suggests illegal bidding strategy or collusion.",
				Severity:    "BLOCKING",
			})
		}
	}

	// Rule 4: Citation Integrity
	if !citationsVerified {
		violations = append(violations, Violation{
			RuleID:      "RULE-VERIFIED-CITATIONS",
			Description: "Citations generated could not be verified against the Knowledge Base.",
			Severity:    "BLOCKING",
		})
	}

	// Determine Block Status
	blocked := false
	var reasons []string
	for _, v := range violations {
		if v.Severity == "BLOCKING" {
			blocked = true
			reasons = append(reasons, v.RuleID)
		}
	}

	return ComplianceReport{
		Blocked:       blocked,
		Violations:    violations,
		BlockedReason: strings.Join(reasons, ", "),
	}
}
