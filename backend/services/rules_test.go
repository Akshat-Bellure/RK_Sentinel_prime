package services

import (
	"testing"
)

func TestValidateContent_OffPortalContact(t *testing.T) {
	input := "Please contact us directly at sales@vendor.com for negotiation."
	report := ValidateContent(input, true)

	if !report.Blocked {
		t.Error("Expected blocking for email address")
	}
	found := false
	for _, v := range report.Violations {
		if v.RuleID == "RULE-NO-OFF-PORTAL" {
			found = true
			break
		}
	}
	if !found {
		t.Error("Expected RULE-NO-OFF-PORTAL violation")
	}
}

func TestValidateContent_BrandFavoritism(t *testing.T) {
	input := "The solution must use Cisco routers exclusively."
	report := ValidateContent(input, true)

	if !report.Blocked {
		t.Error("Expected blocking for mandatory brand usage")
	}
	found := false
	for _, v := range report.Violations {
		if v.RuleID == "RULE-BRAND-NEUTRALITY" {
			found = true
			break
		}
	}
	if !found {
		t.Error("Expected RULE-BRAND-NEUTRALITY violation")
	}
}

func TestValidateContent_Collusion(t *testing.T) {
	input := "We should coordinate with other bidders to ensure we win."
	report := ValidateContent(input, true)

	if !report.Blocked {
		t.Error("Expected blocking for collusion keywords")
	}
	found := false
	for _, v := range report.Violations {
		if v.RuleID == "RULE-ANTI-COLLUSION" {
			found = true
			break
		}
	}
	if !found {
		t.Error("Expected RULE-ANTI-COLLUSION violation")
	}
}

func TestValidateContent_UnverifiedCitations(t *testing.T) {
	input := "Standard compliant text."
	// citationsVerified = false
	report := ValidateContent(input, false)

	if !report.Blocked {
		t.Error("Expected blocking for unverified citations")
	}
	found := false
	for _, v := range report.Violations {
		if v.RuleID == "RULE-VERIFIED-CITATIONS" {
			found = true
			break
		}
	}
	if !found {
		t.Error("Expected RULE-VERIFIED-CITATIONS violation")
	}
}

func TestValidateContent_Clean(t *testing.T) {
	input := "The system should support open standards and be interoperable."
	report := ValidateContent(input, true)

	if report.Blocked {
		t.Error("Expected clean text to pass")
	}
	if len(report.Violations) > 0 {
		t.Errorf("Expected 0 violations, got %d", len(report.Violations))
	}
}
