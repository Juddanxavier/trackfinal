import { test, expect } from "@playwright/test"

test.describe("Authentication", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/login")
  })

  test("should display login form", async ({ page }) => {
    await expect(page.getByPlaceholder("name@example.com")).toBeVisible()
    await expect(page.getByPlaceholder("Enter password")).toBeVisible()
    await expect(page.getByRole("button", { name: /sign in/i })).toBeVisible()
  })

  test("should show error for invalid credentials", async ({ page }) => {
    await page.getByPlaceholder("name@example.com").fill("invalid@example.com")
    await page.getByPlaceholder("Enter password").fill("wrongpassword")
    await page.getByRole("button", { name: /sign in/i }).click()

    await expect(page.getByText(/invalid credentials/i)).toBeVisible()
  })

  test("should login successfully with valid credentials", async ({ page }) => {
    // Note: Use test credentials
    await page.getByPlaceholder("name@example.com").fill("admin@example.com")
    await page.getByPlaceholder("Enter password").fill("password123")
    await page.getByRole("button", { name: /sign in/i }).click()

    // Should redirect to dashboard
    await expect(page).toHaveURL(/dashboard/)
    await expect(page.getByText(/dashboard/i)).toBeVisible()
  })

  test("should logout successfully", async ({ page }) => {
    // Login first
    await page.getByPlaceholder("name@example.com").fill("admin@example.com")
    await page.getByPlaceholder("Enter password").fill("password123")
    await page.getByRole("button", { name: /sign in/i }).click()

    // Wait for dashboard
    await expect(page).toHaveURL(/dashboard/)

    // Logout
    await page.getByRole("button", { name: /logout/i }).click()

    // Should redirect to login
    await expect(page).toHaveURL(/login/)
  })

  test("should redirect unauthenticated users to login", async ({ page }) => {
    // Remove any existing session
    await page.context().clearCookies()

    // Try accessing a protected page
    await page.goto("/dashboard")

    // Should be redirected to login with redirect param
    await expect(page).toHaveURL(/\/login\?redirect=%2Fdashboard/)
  })

  test("should preserve redirect param after login", async ({ page }) => {
    // Clear any existing session
    await page.context().clearCookies()

    // Try accessing a protected page
    await page.goto("/shipments")
    await expect(page).toHaveURL(/\/login\?redirect=%2Fshipments/)
  })
})
