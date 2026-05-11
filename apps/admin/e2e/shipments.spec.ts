import { test, expect } from '@playwright/test';

test.describe('Shipments', () => {
  test.beforeEach(async ({ page }) => {
    // Login before each test
    await page.goto('/login');
    await page.getByPlaceholder(/email/i).fill('admin@example.com');
    await page.getByPlaceholder(/password/i).fill('password123');
    await page.getByRole('button', { name: /sign in/i }).click();
    await expect(page).toHaveURL(/dashboard/);
    
    // Navigate to shipments
    await page.getByRole('link', { name: /shipments/i }).click();
    await expect(page).toHaveURL(/shipments/);
  });

  test('should display shipments list', async ({ page }) => {
    await expect(page.getByText(/tracking number/i)).toBeVisible();
    await expect(page.getByText(/status/i)).toBeVisible();
    await expect(page.getByText(/recipient/i)).toBeVisible();
  });

  test('should open create shipment dialog', async ({ page }) => {
    await page.getByRole('button', { name: /create shipment|add shipment/i }).click();
    await expect(page.getByText(/create new shipment/i)).toBeVisible();
    await expect(page.getByPlaceholder(/tracking number/i)).toBeVisible();
  });

  test('should filter shipments by status', async ({ page }) => {
    // Select status filter
    await page.getByRole('combobox', { name: /status/i }).click();
    await page.getByRole('option', { name: /delivered/i }).click();
    
    // Should show filtered results
    await expect(page.getByText(/delivered/i).first()).toBeVisible();
  });

  test('should search shipments', async ({ page }) => {
    await page.getByPlaceholder(/search/i).fill('TEST123');
    await page.keyboard.press('Enter');
    
    // Should show search results or empty state
    await expect(page.getByText(/test123/i).or(page.getByText(/no results/i))).toBeVisible();
  });

  test('should view shipment details', async ({ page }) => {
    // Click on first shipment row
    const firstRow = page.locator('table tbody tr').first();
    await firstRow.click();
    
    // Should navigate to shipment detail page
    await expect(page).toHaveURL(/shipments\//);
    await expect(page.getByText(/shipment details/i)).toBeVisible();
  });
});
