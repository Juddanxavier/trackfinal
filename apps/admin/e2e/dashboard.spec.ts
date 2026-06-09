import { test, expect } from "@playwright/test"

test.describe("Dashboard", () => {
  test.beforeEach(async ({ page }) => {
    // Login before each test
    await page.goto("/login")
    await page.getByPlaceholder(/email/i).fill("admin@example.com")
    await page.getByPlaceholder(/password/i).fill("password123")
    await page.getByRole("button", { name: /sign in/i }).click()
    await expect(page).toHaveURL(/dashboard/)
  })

  test("should display dashboard with stats", async ({ page }) => {
    await expect(page.getByText(/shipments/i)).toBeVisible()
    await expect(page.getByText(/quotes/i)).toBeVisible()
    await expect(page.getByText(/users/i)).toBeVisible()
  })

  test("should navigate to shipments page", async ({ page }) => {
    await page.getByRole("link", { name: /shipments/i }).click()
    await expect(page).toHaveURL(/shipments/)
    await expect(page.getByText(/tracking number/i)).toBeVisible()
  })

  test("should navigate to users page", async ({ page }) => {
    await page.getByRole("link", { name: /users/i }).click()
    await expect(page).toHaveURL(/users/)
    await expect(page.getByText(/name/i)).toBeVisible()
  })

  test("should display organization selector for admins", async ({ page }) => {
    await expect(
      page.getByRole("button", { name: /select org|my organisation/i })
    ).toBeVisible()
  })
})
