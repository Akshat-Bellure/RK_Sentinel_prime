package auth

import (
	"os"
	"testing"
)

func TestHashPassword(t *testing.T) {
	s := NewService()
	password := "Secure@123"
	
	hash, err := s.HashPassword(password)
	if err != nil {
		t.Fatalf("Failed to hash password: %v", err)
	}

	match, err := s.VerifyPassword(password, hash)
	if err != nil {
		t.Fatalf("Failed to verify password: %v", err)
	}
	if !match {
		t.Error("Password mismatch")
	}

	match, _ = s.VerifyPassword("WrongPass", hash)
	if match {
		t.Error("Verified wrong password")
	}
}

func TestDeveloperAccessProtection(t *testing.T) {
	s := NewService()
	
	// Case 1: Staging - Should Pass
	os.Setenv("APP_ENV", "staging")
	err := s.ValidateDeveloperAccess("Sentinel_Developer")
	if err != nil {
		t.Errorf("Staging should allow dev access, got: %v", err)
	}

	// Case 2: Prod - Should Fail
	os.Setenv("APP_ENV", "production")
	err = s.ValidateDeveloperAccess("Sentinel_Developer")
	if err == nil {
		t.Error("Production should BLOCK dev access")
	}
}
