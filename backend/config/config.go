package config

import "os"

type Config struct {
	Region    string
	Port      string
	JWTSecret string
}

func Load() *Config {
	region := os.Getenv("AWS_REGION")
	if region == "" {
		region = "ap-south-1" // Default to strict compliance
	}

	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	jwtSecret := os.Getenv("JWT_SECRET")
	if jwtSecret == "" {
		jwtSecret = "sentinel-dev-secret-do-not-use-in-prod"
	}

	return &Config{
		Region:    region,
		Port:      port,
		JWTSecret: jwtSecret,
	}
}
