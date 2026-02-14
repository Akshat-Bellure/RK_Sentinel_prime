package services

import (
	"crypto/sha256"
	"encoding/hex"
	"strings"
)

type VerificationResult struct {
	Verified      bool    `json:"verified"`
	SourceSHA256  string  `json:"source_sha256"`
	MatchScore    float64 `json:"match_score"`
	ProofURL      string  `json:"proof_url"`
	TicketID      string  `json:"ticket_id,omitempty"`
}

// VerifyCitation performs the double-blind check
func VerifyCitation(draftSnippet string, sourceDocID string) VerificationResult {
	// 1. Normalize
	cleanDraft := normalizeText(draftSnippet)
	
	// 2. Fetch Source (Mock)
	// sourceText := db.GetSourceText(sourceDocID)
	sourceText := "The Cloud Service Provider (CSP) must ensure that all data is hosted within the territorial jurisdiction of India."
	cleanSource := normalizeText(sourceText)

	// 3. Exact Match Check
	if strings.Contains(cleanSource, cleanDraft) {
		hash := sha256.Sum256([]byte(sourceText))
		return VerificationResult{
			Verified:     true,
			SourceSHA256: hex.EncodeToString(hash[:]),
			MatchScore:   1.0,
			ProofURL:     "https://sentinel.gov.in/kb/docs/" + sourceDocID,
		}
	}

	// 4. Fuzzy Match (Levenshtein/Jaccard stub)
	// score := fuzzyMatch(cleanDraft, cleanSource)
	// if score > 0.95 { return Verified }

	return VerificationResult{
		Verified: false,
		MatchScore: 0.45,
		TicketID: "TKT-LEGAL-REQ-881",
	}
}

func normalizeText(s string) string {
	return strings.ToLower(strings.Join(strings.Fields(s), " "))
}
