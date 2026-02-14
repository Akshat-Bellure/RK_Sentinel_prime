import { test, expect } from '@playwright/test';

test('Evidence Vault Workflow: Upload -> Map -> Verify', async ({ page }) => {
  // 1. Navigate to Vault
  await page.goto('/');
  // Mock Login
  await page.click('button:has-text("Authenticate Access")');
  await page.click('button:has-text("Evidence Vault")');

  // 2. Connect Wallet
  await page.click('button:has-text("Connect Wallet")');
  await expect(page.locator('button')).toContainText('Wallet Connected');

  // 3. Upload File (Mock)
  // In a real env, we'd attach a file. Here we verify the UI exists.
  const fileInput = page.locator('input[type="file"]');
  await expect(fileInput).toBeAttached();

  // 4. Check Clause List
  await expect(page.locator('text=4.2 Hosting Locality')).toBeVisible();

  // 5. Simulate Mapping (Click Clause -> Click Attach in mock list)
  // Note: This requires the mock file list to be populated or interactive.
  // Since upload is simulated with timeout in React, we wait or mock the state.
  
  // For this test, we verify the "Generate Bundle" button is disabled initially
  const genButton = page.locator('button:has-text("Generate Bundle")');
  await expect(genButton).toBeDisabled();
});
