import { test, expect } from "@playwright/test";

test.describe("ECOPRO2 App E2E", () => {
  test("1. Home redirects to /dashboard", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveURL(/\/dashboard/);
  });

  test("2. Dashboard loads with activities or empty state", async ({ page }) => {
    await page.goto("/dashboard");
    await page.waitForLoadState("networkidle");

    const hasActivities = (await page.locator('[href^="/dashboard/"]').filter({ hasNot: page.locator("text=Global Dashboard") }).count()) > 0;
    const hasEmptyState = await page.getByText("Nessuna activity").first().isVisible();

    expect(hasActivities || hasEmptyState).toBeTruthy();
  });

  test("3. Create new activity", async ({ page }) => {
    await page.goto("/dashboard");
    await page.waitForLoadState("networkidle");

    await page.getByRole("button", { name: /Nuova Activity|Crea Activity/ }).first().click();
    await expect(page.getByText("Nuova Activity")).toBeVisible({ timeout: 5000 });

    await page.getByPlaceholder(/OWLTECH|Nome/).first().fill("Test Activity E2E");
    await page.locator('select').first().selectOption({ label: /Technology/ });
    await page.locator('button[style*="background-color: rgb(99, 102, 241)"]').first().click();

    await page.getByRole("button", { name: /Crea Activity/ }).click();
    await expect(page.getByText("Test Activity E2E")).toBeVisible({ timeout: 5000 });
  });

  test("4. Click activity card goes to activity dashboard", async ({ page }) => {
    await page.goto("/dashboard");
    await page.waitForLoadState("networkidle");

    const activityLink = page.locator('a[href^="/dashboard/"]').filter({ hasText: /Test Activity|OWL|E-commerce/ }).first();
    if ((await activityLink.count()) > 0) {
      await activityLink.click();
      await expect(page).toHaveURL(/\/dashboard\/[a-f0-9-]+/);
      await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    }
  });

  test("5. Setup screen: Crea il primo progetto link", async ({ page }) => {
    await page.goto("/dashboard");
    await page.waitForLoadState("networkidle");

    const activityLink = page.locator('a[href^="/dashboard/"]').filter({ hasNot: page.locator("text=Global Dashboard") }).first();
    if ((await activityLink.count()) > 0) {
      await activityLink.click();
      await page.waitForLoadState("networkidle");

      const setupLink = page.getByRole("link", { name: /Crea il primo progetto/ });
      if (await setupLink.isVisible()) {
        await setupLink.click();
        await expect(page).toHaveURL(/\/projects/);
      }
    }
  });

  test("6. Create project on Projects page", async ({ page }) => {
    await page.goto("/dashboard");
    await page.waitForLoadState("networkidle");

    const activityLink = page.locator('a[href^="/dashboard/"]').filter({ hasNot: page.locator("text=Global Dashboard") }).first();
    await activityLink.click();
    await page.waitForLoadState("networkidle");

    const projectsLink = page.getByRole("link", { name: /Crea il primo progetto|Progetti/ }).first();
    await projectsLink.click();
    await page.waitForLoadState("networkidle");

    await expect(page).toHaveURL(/\/projects/);

    await page.getByRole("button", { name: /Nuovo Progetto|Crea primo progetto/ }).first().click();
    await expect(page.getByRole("dialog")).toBeVisible({ timeout: 5000 });

    await page.getByLabel(/Nome/).first().fill("E2E Test Project");
    const today = new Date().toISOString().split("T")[0];
    const endDate = new Date(Date.now() + 90 * 86400000).toISOString().split("T")[0];
    await page.locator('input[type="date"]').first().fill(today);
    await page.locator('input[type="date"]').nth(1).fill(endDate);
    await page.getByPlaceholder(/0|Budget/).first().fill("5000");

    await page.getByRole("button", { name: /Crea Progetto|Salva/ }).click();
    await expect(page.getByText("E2E Test Project")).toBeVisible({ timeout: 5000 });
  });

  test("7. Create task for project", async ({ page }) => {
    await page.goto("/dashboard");
    await page.waitForLoadState("networkidle");

    const activityLink = page.locator('a[href^="/dashboard/"]').filter({ hasNot: page.locator("text=Global Dashboard") }).first();
    await activityLink.click();
    await page.waitForLoadState("networkidle");

    await page.getByRole("link", { name: "Progetti" }).first().click();
    await page.waitForLoadState("networkidle");

    await page.getByRole("button", { name: "Task" }).click();
    await page.waitForLoadState("networkidle");
    await page.getByRole("button", { name: /Nuovo Task/ }).click();

    await expect(page.getByRole("dialog")).toBeVisible({ timeout: 5000 });
    await page.getByLabel(/Nome|Task/).first().fill("E2E Test Task");
    const deadline = new Date(Date.now() + 14 * 86400000).toISOString().split("T")[0];
    await page.locator('input[type="date"]').first().fill(deadline);
    await page.getByRole("button", { name: /Crea Task|Salva/ }).click();

    await expect(page.getByText("E2E Test Task")).toBeVisible({ timeout: 5000 });
  });

  test("8. Add financial record", async ({ page }) => {
    await page.goto("/dashboard");
    await page.waitForLoadState("networkidle");

    const activityLink = page.locator('a[href^="/dashboard/"]').filter({ hasNot: page.locator("text=Global Dashboard") }).first();
    await activityLink.click();
    await page.waitForLoadState("networkidle");

    await page.getByRole("link", { name: /Registra entrate|Finanza/ }).first().click();
    await page.waitForLoadState("networkidle");

    await page.getByRole("button", { name: /Aggiungi/ }).click();
    await expect(page.getByRole("dialog")).toBeVisible({ timeout: 5000 });

    await page.getByLabel(/Descrizione/).fill("E2E Test Entrata");
    await page.getByLabel(/Importo|amount/i).first().fill("1500");
    await page.locator('input[type="date"]').first().fill(new Date().toISOString().split("T")[0]);
    await page.getByRole("button", { name: /Aggiungi|Salva|Crea/ }).click();

    await expect(page.getByText("E2E Test Entrata")).toBeVisible({ timeout: 5000 });
  });

  test("9. Create scenario", async ({ page }) => {
    await page.goto("/dashboard");
    await page.waitForLoadState("networkidle");

    const activityLink = page.locator('a[href^="/dashboard/"]').filter({ hasNot: page.locator("text=Global Dashboard") }).first();
    await activityLink.click();
    await page.waitForLoadState("networkidle");

    await page.getByRole("link", { name: /scenario|Simulazioni/ }).first().click();
    await page.waitForLoadState("networkidle");

    await page.getByRole("button", { name: /Nuovo scenario|Crea primo scenario/ }).first().click();
    await expect(page.getByRole("dialog")).toBeVisible({ timeout: 5000 });

    await page.getByLabel(/Nome/).first().fill("E2E Test Scenario");
    await page.getByRole("button", { name: /Crea scenario|Salva/ }).click();

    await expect(page.getByText("E2E Test Scenario")).toBeVisible({ timeout: 5000 });
  });

  test("10. Edit project - change name and verify", async ({ page }) => {
    await page.goto("/dashboard");
    await page.waitForLoadState("networkidle");

    const activityLink = page.locator('a[href^="/dashboard/"]').filter({ hasNot: page.locator("text=Global Dashboard") }).first();
    await activityLink.click();
    await page.getByRole("link", { name: "Progetti" }).first().click();
    await page.waitForLoadState("networkidle");

    const projectCard = page.locator('[class*="rounded-xl"]').filter({ hasText: /E2E Test Project|Test Project/ }).first();
    if ((await projectCard.count()) > 0) {
      await projectCard.hover();
      await projectCard.getByRole("button").first().click();
      await expect(page.getByRole("dialog")).toBeVisible({ timeout: 5000 });

      await page.getByLabel(/Nome/).first().fill("E2E Project Edited");
      await page.getByRole("button", { name: /Salva/ }).click();
      await expect(page.getByText("E2E Project Edited")).toBeVisible({ timeout: 5000 });
    }
  });

  test("11. Delete task and verify removal", async ({ page }) => {
    await page.goto("/dashboard");
    await page.waitForLoadState("networkidle");

    const activityLink = page.locator('a[href^="/dashboard/"]').filter({ hasNot: page.locator("text=Global Dashboard") }).first();
    await activityLink.click();
    await page.getByRole("link", { name: "Progetti" }).first().click();
    await page.waitForLoadState("networkidle");

    await page.getByRole("button", { name: "Task" }).click();
    await page.waitForLoadState("networkidle");

    const taskRow = page.locator("tr").filter({ hasText: "E2E Test Task" });
    if ((await taskRow.count()) > 0) {
      await taskRow.hover();
      await taskRow.getByRole("button").last().click();
      await page.getByRole("button", { name: /Conferma|Elimina|Sì/ }).click();
      await expect(page.getByText("E2E Test Task")).not.toBeVisible({ timeout: 5000 });
    }
  });
});
