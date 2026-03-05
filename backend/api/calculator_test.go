package api

import (
	"bytes"
	"mime/multipart"
	"net/http/httptest"
	"testing"

	"github.com/gofiber/fiber/v2"
)

func TestCalculateL1_EdgeCases(t *testing.T) {
	app := fiber.New()
	app.Post("/calc", CalculateL1Handler)

	tests := []struct {
		name       string
		csvContent string
		wantStatus int
		wantLC     float64 // Check output JSON manually if needed, or status code for errors
	}{
		{
			name: "Valid Class-I",
			csvContent: "Item,HS,Qty,Local,Import\nA,123,10,100,0\nB,456,5,0,20", // Total: 1000 Local + 100 Import = 1100. LC: 1000/1100 = 90.9%
			wantStatus: 200,
		},
		{
			name: "Zero Total Cost",
			csvContent: "Item,HS,Qty,Local,Import\nA,123,10,0,0",
			wantStatus: 200, // Should return 0% LC, not crash
		},
		{
			name: "Negative Value",
			csvContent: "Item,HS,Qty,Local,Import\nA,123,-5,100,0",
			wantStatus: 400,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			body := new(bytes.Buffer)
			writer := multipart.NewWriter(body)
			part, _ := writer.CreateFormFile("bom_csv", "test.csv")
			part.Write([]byte(tt.csvContent))
			writer.Close()

			req := httptest.NewRequest("POST", "/calc", body)
			req.Header.Set("Content-Type", writer.FormDataContentType())

			resp, _ := app.Test(req)

			if resp.StatusCode != tt.wantStatus {
				t.Errorf("Expected status %d, got %d", tt.wantStatus, resp.StatusCode)
			}
		})
	}
}
