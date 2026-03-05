package adapters

import "time"

// TenderMetadata represents standard tender data structure
type TenderMetadata struct {
	SourceRefID     string    `json:"source_ref_id"`
	Title           string    `json:"title"`
	Category        string    `json:"category"`
	PublishDate     time.Time `json:"publish_date"`
	ClosingDate     time.Time `json:"closing_date"`
	ValueINR        float64   `json:"value_inr"`
	Location        string    `json:"location"`
	Description     string    `json:"description"`
	Organization    string    `json:"organization"`
	IsVerified      bool      `json:"is_verified"`
	SourceSystem    string    `json:"source_system"` // "GEM", "CPPP", "MANUAL"
	DownloadURL     string    `json:"download_url"`
}

// TenderSource interface for different ingestion methods
type TenderSource interface {
	FetchTenders() ([]TenderMetadata, error)
	HealthCheck() bool
}
