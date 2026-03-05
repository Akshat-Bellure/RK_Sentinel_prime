package adapters

import (
	"time"
)

type GeMAdapter struct {
	APIKey string
}

func NewGeMAdapter(apiKey string) *GeMAdapter {
	return &GeMAdapter{APIKey: apiKey}
}

func (g *GeMAdapter) HealthCheck() bool {
	// In prod, ping api.gem.gov.in/v2/status
	return true
}

func (g *GeMAdapter) FetchTenders() ([]TenderMetadata, error) {
	// If real key exists, implement HTTP client here.
	// For Pilot/Demo, return Mock Data.
	
	mockData := []TenderMetadata{
		{
			SourceRefID:  "GEM/2023/B/412992",
			Title:        "Supply of Ruggedized Tactical Tablets (10 inch)",
			Category:     "Goods",
			PublishDate:  time.Now().AddDate(0, 0, -2),
			ClosingDate:  time.Now().AddDate(0, 0, 15),
			ValueINR:     4500000,
			Location:     "New Delhi",
			Organization: "Border Security Force",
			IsVerified:   true, // Trusted Source
			SourceSystem: "GEM",
			DownloadURL:  "https://gem.gov.in/mock/tender_412992.pdf",
		},
		{
			SourceRefID:  "GEM/2023/B/413005",
			Title:        "Annual Maintenance Contract for CCTV Surveillance System",
			Category:     "Services",
			PublishDate:  time.Now().AddDate(0, 0, -5),
			ClosingDate:  time.Now().AddDate(0, 0, 10),
			ValueINR:     12000000,
			Location:     "Mumbai, Maharashtra",
			Organization: "Mumbai Port Authority",
			IsVerified:   true,
			SourceSystem: "GEM",
			DownloadURL:  "https://gem.gov.in/mock/tender_413005.pdf",
		},
		{
			SourceRefID:  "GEM/2023/B/413110",
			Title:        "Construction of Boundary Wall at Plot 4B",
			Category:     "Works",
			PublishDate:  time.Now().AddDate(0, 0, -1),
			ClosingDate:  time.Now().AddDate(0, 0, 21),
			ValueINR:     8500000,
			Location:     "Pune, Maharashtra",
			Organization: "CPWD",
			IsVerified:   true,
			SourceSystem: "GEM",
			DownloadURL:  "https://gem.gov.in/mock/tender_413110.pdf",
		},
	}

	return mockData, nil
}
