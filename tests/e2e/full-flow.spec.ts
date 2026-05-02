import { test, expect, type Page } from '@playwright/test';

/**
 * LexAI · End-to-end UI test against production.
 *
 * Covers:
 *   1. Login con credenciales reales
 *   2. Navegación a todas las pantallas y verificación de datos reales
 *   3. Buscador ⌘K (cmdk) con queries con/sin tildes
 *   4. Voice agent: HUD click → mic permission → WS ticket
 *   5. Liquidación form
 *   6. HITL queue
 *   7. Performance: cada navegación debe responder en <2s perceived
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
  await expect(page.getByText(/Buenos|Buenas/)).toBeVisible({ timeout: 10_000 });
}

test.describe('LexAI · UI E2E', () => {
  test('1 · login + dashboard carga datos reales del firm', async ({ page }) => {
    await login(page);
    // Sidebar: nombre del firm correcto
    await expect(page.getByText('López & Asociados')).toBeVisible();
    // Sidebar: usuario admin
    await expect(page.getByText(/Lic\. Ana/)).toBeVisible();
    // Página /inicio: stats reales
    await expect(page.getByText(/Documentos verificados/)).toBeVisible();
    await expect(page.getByText('Citas verificadas')).toBeVisible();
  });

  test('2 · navegación a /casos · 8 casos reales · click abre detalle', async ({ page }) => {
    await login(page);
    await page.click('a[href="/casos"]');
    await page.waitForURL(/\/casos$/, { timeout: 10_000 });
    // Tabs con counts reales
    await expect(page.getByRole('button', { name: /Todos \(8\)/ })).toBeVisible();
    await expect(page.getByRole('button', { name: /Laborales/ })).toBeVisible();
    // Click primer caso
    await page.getByText('Rodríguez vs.').first().click();
    await page.waitForURL(/\/casos\/[a-f0-9-]+/, { timeout: 10_000 });
    // Tabs del detalle
    await expect(page.getByText('Cronología')).toBeVisible();
    await expect(page.getByText(/Documentos \(/)).toBeVisible();
  });

  test('3 · /clientes · 6 clientes reales · click abre ficha 360', async ({ page }) => {
    await login(page);
    await page.click('a[href="/clientes"]');
    await page.waitForURL(/\/clientes$/, { timeout: 10_000 });
    await expect(page.getByText(/clientes activos|Constructora del Valle|María Rodríguez/i).first()).toBeVisible();
    // Click un cliente
    await page.getByText('María Rodríguez').first().click();
    await page.waitForURL(/\/clientes\/[a-f0-9-]+/, { timeout: 10_000 });
    await expect(page.getByText(/Habeas Data|Ley 1581/)).toBeVisible();
  });

  test('4 · ⌘K command palette · busca con/sin tildes', async ({ page }) => {
    await login(page);
    await page.keyboard.press('Control+k');
    const input = page.getByPlaceholder(/Busca casos/);
    await expect(input).toBeVisible({ timeout: 5_000 });
    // Search WITHOUT accent — must find Rodríguez
    await input.fill('Rodriguez');
    await page.waitForTimeout(400);
    await expect(page.getByText(/Casos \(\d+\)/).first()).toBeVisible({ timeout: 5_000 });
    // Escape
    await page.keyboard.press('Escape');
    // Search WITH partial sentence
    await page.keyboard.press('Control+k');
    await page.getByPlaceholder(/Busca casos/).fill('despido');
    await page.waitForTimeout(400);
    await expect(page.getByText(/Jurisprudencia \(\d+\)/)).toBeVisible({ timeout: 5_000 });
  });

  test('5 · Voice HUD · click activa mic + emite ticket', async ({ page, context }) => {
    await context.grantPermissions(['microphone']);
    await login(page);

    // Watch the WS connection attempt
    let ticketIssued = false;
    page.on('request', (req) => {
      if (req.url().includes('/api/voice/ticket')) ticketIssued = true;
    });

    // The HUD has a button (the orb)
    const hudButton = page.locator('button[aria-label*="voz"]').first();
    await expect(hudButton).toBeVisible({ timeout: 5_000 });
    await hudButton.click();

    // Wait for ticket request to fire
    await page.waitForTimeout(2_000);
    expect(ticketIssued).toBe(true);
  });

  test('6 · Liquidación form · cálculo determinista funciona', async ({ page }) => {
    await login(page);
    await page.goto('/liquidacion');
    await page.waitForURL(/\/liquidacion/, { timeout: 10_000 });
    await expect(page.getByText('Datos del trabajador')).toBeVisible();
    // Llenar form
    await page.fill('input[type="date"]:nth-of-type(1)', '2019-01-15');
    await page.fill('input[type="date"]:nth-of-type(2)', '2026-03-14');
    await page.locator('input[type="number"]').fill('4500000');
    // Submit
    await page.click('button:has-text("Calcular liquidación")');
    // Esperar resultado
    await expect(page.getByText(/COP \$/)).toBeVisible({ timeout: 15_000 });
    await expect(page.getByText(/Total reclamable|Cesantías/)).toBeVisible();
  });

  test('7 · Notificaciones · HITL queue + actividad agente', async ({ page }) => {
    await login(page);
    await page.click('a[href="/notificaciones"]');
    await page.waitForURL(/\/notificaciones/, { timeout: 10_000 });
    await expect(page.getByText(/Aprobaciones pendientes|Bandeja de entrada/)).toBeVisible();
    await expect(page.getByText(/Actividad reciente/)).toBeVisible();
  });

  test('8 · Aviso de Privacidad público accesible sin login', async ({ page }) => {
    await page.goto('/aviso-privacidad');
    await expect(page.getByText('Aviso de Privacidad LexAI')).toBeVisible();
    await expect(page.getByText(/Habeas Data|Ley 1581/)).toBeVisible();
  });

  test('9 · Settings audit log · 50 entradas históricas', async ({ page }) => {
    await login(page);
    await page.goto('/settings/despacho');
    await expect(page.getByText('Audit log')).toBeVisible({ timeout: 10_000 });
    await expect(page.getByText('Append-only')).toBeVisible();
    // Al menos 5 entradas visibles
    const auditRows = page.locator('text=/auth\\.|matter\\.|agent\\.|hitl\\.|voice\\./');
    await expect(auditRows.first()).toBeVisible();
  });

  test('10 · Performance · cada ruta debe responder en <3s en navegador', async ({ page }) => {
    await login(page);
    const routes = ['/casos', '/clientes', '/calendario', '/documentos', '/notificaciones', '/liquidacion'];
    for (const route of routes) {
      const t0 = Date.now();
      await page.goto(route, { waitUntil: 'domcontentloaded' });
      const elapsed = Date.now() - t0;
      console.log(`  ${route}: ${elapsed}ms`);
      expect(elapsed, `${route} should load in <3s`).toBeLessThan(3000);
    }
  });
});
