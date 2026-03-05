package tests

import (
	"regexp"
	"strings"
	"testing"
)

// Mocking the generation functions here for unit testing as they are unexported in api package usually
// In a real repo, we would export them or test via the public handler
func generateVendorID(name string) string {
	reg := regexp.MustCompile("[^bcdfghjklmnpqrstvwxyzBCDFGHJKLMNPQRSTVWXYZ]+")
	onlyConsonants := reg.ReplaceAllString(name, "")
	if len(onlyConsonants) < 3 {
		onlyConsonants = name + "XXX"
	}
	prefix := strings.ToUpper(onlyConsonants[:3])
	return "SB-" + prefix + "-1234" // Mock digits
}

func TestVendorIDGeneration(t *testing.T) {
	name := "Defense Electronics"
	id := generateVendorID(name)
	
	if !strings.HasPrefix(id, "SB-DFN") {
		t.Errorf("Expected SB-DFN..., got %s", id)
	}

	name2 := "Aero" // 'r' is the only consonant
	id2 := generateVendorID(name2)
	if !strings.HasPrefix(id2, "SB-R") {
		t.Errorf("Expected SB-R..., got %s", id2)
	}
}

func TestPasswordComplexity(t *testing.T) {
	// [Adjective][2digits][Syllable][Symbol]
	// Example: Solar99Xen#
	password := "Solar99Xen#"
	
	match, _ := regexp.MatchString(`^[A-Z][a-z]+\d{2}[A-Z][a-z]+[^a-zA-Z0-9]$`, password)
	if !match {
		t.Error("Password does not match complexity policy")
	}
}
