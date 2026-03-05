package auth

import (
	"crypto/rand"
	"crypto/subtle"
	"encoding/base64"
	"errors"
	"fmt"
	"os"
	"time"

	"github.com/golang-jwt/jwt/v5"
	"github.com/google/uuid"
	"golang.org/x/crypto/argon2"
)

// Service handles authentication logic
type Service struct {
	jwtSecret       []byte
	refreshDuration time.Duration
}

func NewService() *Service {
	secret := os.Getenv("JWT_SECRET")
	if secret == "" {
		secret = "default-dev-secret"
	}
	return &Service{
		jwtSecret:       []byte(secret),
		refreshDuration: 24 * time.Hour,
	}
}

// HashPassword using Argon2id
func (s *Service) HashPassword(password string) (string, error) {
	salt := make([]byte, 16)
	if _, err := rand.Read(salt); err != nil {
		return "", err
	}
	hash := argon2.IDKey([]byte(password), salt, 1, 64*1024, 4, 32)
	
	// Format: base64(salt)$base64(hash)
	b64Salt := base64.RawStdEncoding.EncodeToString(salt)
	b64Hash := base64.RawStdEncoding.EncodeToString(hash)
	return fmt.Sprintf("%s$%s", b64Salt, b64Hash), nil
}

// VerifyPassword checks Argon2id hash
func (s *Service) VerifyPassword(password, encodedHash string) (bool, error) {
	// Parse salt$hash
	var salt, hash []byte
	var err error
	
	parts := split(encodedHash, '$') // Helper needed
	if len(parts) != 2 {
		return false, errors.New("invalid hash format")
	}
	
	salt, err = base64.RawStdEncoding.DecodeString(parts[0])
	if err != nil { return false, err }
	hash, err = base64.RawStdEncoding.DecodeString(parts[1])
	if err != nil { return false, err }

	comparisonHash := argon2.IDKey([]byte(password), salt, 1, 64*1024, 4, 32)
	return subtle.ConstantTimeCompare(hash, comparisonHash) == 1, nil
}

// GenerateTokens creates Access and Refresh JWTs
func (s *Service) GenerateTokens(user *User) (*TokenPair, error) {
	// 1. Access Token
	claims := AuthClaims{
		UserID: user.ID.String(),
		Role:   user.Role,
		RegisteredClaims: jwt.RegisteredClaims{
			ExpiresAt: jwt.NewNumericDate(time.Now().Add(15 * time.Minute)),
			Issuer:    "sentinel-prime-auth",
			Subject:   user.Username,
		},
	}
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	accessToken, err := token.SignedString(s.jwtSecret)
	if err != nil {
		return nil, err
	}

	// 2. Refresh Token (Opaque usually, but JWT here for simplicity in this snippet)
	refreshClaims := jwt.RegisteredClaims{
		ExpiresAt: jwt.NewNumericDate(time.Now().Add(s.refreshDuration)),
		Subject:   user.ID.String(),
	}
	refreshTokenObj := jwt.NewWithClaims(jwt.SigningMethodHS256, refreshClaims)
	refreshToken, err := refreshTokenObj.SignedString(s.jwtSecret)
	if err != nil {
		return nil, err
	}

	return &TokenPair{
		AccessToken:  accessToken,
		RefreshToken: refreshToken,
		ExpiresIn:    900, // 15 min
		TokenType:    "Bearer",
	}, nil
}

// ValidateDeveloperAccess enforces Staging-Only constraint
func (s *Service) ValidateDeveloperAccess(username string) error {
	if username == "Sentinel_Developer" {
		env := os.Getenv("APP_ENV")
		if env == "production" {
			// CRITICAL SECURITY LOG WOULD GO HERE
			return errors.New("FATAL: Developer credentials strictly forbidden in Production")
		}
	}
	return nil
}

// Helper
func split(s string, sep byte) []string {
	var parts []string
	current := ""
	for i := 0; i < len(s); i++ {
		if s[i] == sep {
			parts = append(parts, current)
			current = ""
		} else {
			current += string(s[i])
		}
	}
	parts = append(parts, current)
	return parts
}
