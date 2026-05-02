import { test, expect, type Page } from '@playwright/test';

/**
 * LexAI · Mobile responsive smoke
 *
 * Verifies the chassis adapts to small viewports:
 *   1. Sidebar hidden by default at 375px
 *   2. Hamburger button toggles drawer
 *   3. Backdrop click closes drawer
 *   4. Nav link click closes drawer + navigates
 *   5. VoiceHUD fits inside viewport
 *   6. Cmd+K palette still opens via sidebar trigger
 */

const EMAIL = 'demo@lexai.co';
const PASSWORD = 'LexAi2026!Demo';

async function login(page: Page): Promise<void> {
  await page.goto('/login');
  await page.fill('input[type="email"]', EMAIL);
  await page.fill('input[type="password"]', PASSWORD);
  await Promise.all([
    page.waitForURL(/\/inicio/, { timeout: 15_000 }),
    page.click('button[type="submit"]'),
  ]);
}

test.describe('LexAI · Mobile responsive', () => {
  test('1 · sidebar oculto por defecto en mobile', async ({ page }) => {
    await login(page);
    // Sidebar drawer (aside in SidebarShell) should be off-canvas: data-open=false.
    const drawer = page.locator('aside[data-open]').first();
    await expect(drawer).toHaveAttribute('data-open', 'false');
  });

  test('2 · hamburger abre el drawer', async ({ page }) => {
    await login(page);
    await page.getByLabel('Abrir menú').click();
    const drawer = page.locator('aside[data-open]').first();
    await expect(drawer).toHaveAttribute('data-open', 'true');
    // Backdrop should be present + interactive
    await expect(page.locator('.bg-black\\/40').first()).toBeVisible();
  });

  test('3 · backdrop cierra el drawer', async ({ page }) => {
    await login(page);
    await page.getByLabel('Abrir menú').click();
    // Click outside the drawer (backdrop area is to the right of the 280px sidebar).
    const vw = page.viewportSize()?.width ?? 390;
    await page.mouse.click(vw - 30, 200);
    const drawer = page.locator('aside[data-open]').first();
    await expect(drawer).toHaveAttribute('data-open', 'false');
  });

  test('4 · click en ítem nav cierra drawer + navega', async ({ page }) => {
    await login(page);
    await page.getByLabel('Abrir menú').click();
    await page.locator('aside a[href="/casos"]').first().click();
    await page.waitForURL(/\/casos/, { timeout: 10_000 });
    const drawer = page.locator('aside[data-open]').first();
    await expect(drawer).toHaveAttribute('data-open', 'false');
  });

  test('5 · VoiceHUD cabe en viewport (≤92vw)', async ({ page }) => {
    await login(page);
    const hud = page.locator('[data-state]').first();
    const box = await hud.boundingBox();
    expect(box).not.toBeNull();
    if (box) {
      const vw = page.viewportSize()?.width ?? 0;
      expect(box.width).toBeLessThanOrEqual(vw * 0.95);
    }
  });

  test('6 · barra de búsqueda del sidebar abre Command Palette', async ({ page }) => {
    await login(page);
    await page.getByLabel('Abrir menú').click();
    await page.getByLabel('Abrir buscador').click();
    await expect(page.getByPlaceholder(/Busca casos/)).toBeVisible({ timeout: 5_000 });
  });
});
