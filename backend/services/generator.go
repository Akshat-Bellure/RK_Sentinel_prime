package services

import (
	"fmt"
	"strings"
)

// GenerateQuery constructs a pre-bid query based on the strategy and risk profile
func GenerateQuery(clauseID, clauseText, category, tone string, citations []string) string {
	
	// Base Template Selection
	var template string
	switch tone {
	case "neutral":
		template = "Ref Clause %s (%s):\n\nRequest for clarification: %s\n\nWe request the authority to clarify if this condition is mandatory or if equivalent standards are accepted."
	case "strict":
		template = "Ref Clause %s (%s) - NOTICE OF RESTRICTIVE CONDITION:\n\nThe current clause mandates \"%s\".\n\nThis requirement explicitly excludes competent domestic bidders and violates CVC guidelines on fair competition. \n\nLegal Reference: %s\n\nRequest: The clause MUST be rectified immediately."
	case "advisory":
		fallthrough
	default:
		template = "Ref Clause %s (%s):\n\nObservation: The clause stipulates \"%s\".\n\nSubmission: We respectfully submit that this condition appears to be in contradiction with %s.\n\nRequest: Please amend the clause to ensure compliance with GOI statutory requirements and allow broader participation."
	}

	// Extract a snippet from the clause for context (first 10 words or meaningful chunk)
	snippet := clauseText
	if len(snippet) > 50 {
		snippet = snippet[:50] + "..."
	}

	// Format Citations
	citationText := "relevant government guidelines"
	if len(citations) > 0 {
		citationText = strings.Join(citations, " and ")
	}

	// Construct Query
	query := fmt.Sprintf(template, clauseID, category, snippet, citationText)
	return query
}
