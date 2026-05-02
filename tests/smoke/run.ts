/**
 * LexAI · Full surface smoke test
 *
 * Hits every public/protected route + every API endpoint + every backend
 * endpoint in production and asserts:
 *   - HTTP status (200/30x where appropriate)
 *   - TTFB ≤ 1000 ms (PRD §10.1 perf budget)
 *   - JSON shape (where applicable)
 *
 * Usage:
 *   pnpm test:smoke
 *   FAIL_ON_SLOW=1 pnpm test:smoke   # also fail on slow routes
 *
 * Designed to run in CI · zero manual UI testing required.
 */

const FRONTEND = process.env.FRONTEND_URL ?? 'https://lexai-frontend-rho.vercel.app';
const BACKEND = process.env.BACKEND_URL ?? 'https://legal-agent-backend-production-fcfa.up.railway.app';
const SUPABASE_URL = 'https://osyrwsbruydcyhdjvjpv.supabase.co';
const SUPABASE_ANON =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9zeXJ3c2JydXlkY3loZGp2anB2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU3OTU0OTAsImV4cCI6MjA5MTM3MTQ5MH0.SFsjieS3YYpIiTAKLHPj19l53CVhRimnNDzHwhCjpEY';
const EMAIL = process.env.TEST_EMAIL ?? 'demo@lexai.co';
const PASSWORD = process.env.TEST_PASSWORD ?? 'LexAi2026!Demo';

const SLOW_THRESHOLD_MS = 1000;
const FAIL_ON_SLOW = process.env.FAIL_ON_SLOW === '1';

type Result = {
  name: string;
  ok: boolean;
  status?: number;
  ms: number;
  detail?: string;
};

const results: Result[] = [];

function pad(s: string, n: number): string {
  return s.length >= n ? s : s + ' '.repeat(n - s.length);
}

function color(ok: boolean, ms: number): string {
  if (!ok) return '🔴';
  if (ms > SLOW_THRESHOLD_MS) return '🟡';
  return '🟢';
}

async function timed<T>(name: string, fn: () => Promise<{ ok: boolean; status?: number; detail?: string; payload?: T }>): Promise<T | null> {
  const t0 = Date.now();
  try {
    const r = await fn();
    const ms = Date.now() - t0;
    results.push({ name, ok: r.ok, status: r.status, ms, detail: r.detail });
    return r.payload ?? null;
  } catch (e) {
    const ms = Date.now() - t0;
    results.push({ name, ok: false, ms, detail: e instanceof Error ? e.message : String(e) });
    return null;
  }
}

function buildSupabaseSsrCookie(access: string, refresh: string): string {
  const payload = {
    access_token: access,
    refresh_token: refresh,
    expires_in: 3600,
    expires_at: Math.floor(Date.now() / 1000) + 3600,
    token_type: 'bearer',
    user: {},
  };
  const json = JSON.stringify(payload);
  const b64 = Buffer.from(json, 'utf-8').toString('base64');
  return 'sb-osyrwsbruydcyhdjvjpv-auth-token=base64-' + b64;
}

async function main() {
  console.log(`\n=== LexAI smoke test · ${new Date().toISOString()} ===`);
  console.log(`Frontend: ${FRONTEND}`);
  console.log(`Backend:  ${BACKEND}\n`);

  // --- 1. Public pages -------------------------------------------------
  console.log('[1] Public pages');
  for (const path of ['/', '/login', '/signup', '/aviso-privacidad', '/demo']) {
    await timed(`GET ${path}`, async () => {
      const r = await fetch(FRONTEND + path);
      return { ok: r.status === 200, status: r.status };
    });
  }

  // --- 2. Auth login ----------------------------------------------------
  console.log('[2] Supabase auth login');
  let access: string | null = null;
  let refresh: string | null = null;
  await timed('POST supabase auth/token', async () => {
    const r = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=password`, {
      method: 'POST',
      headers: { apikey: SUPABASE_ANON, 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: EMAIL, password: PASSWORD }),
    });
    const data = (await r.json()) as { access_token?: string; refresh_token?: string };
    access = data.access_token ?? null;
    refresh = data.refresh_token ?? null;
    return { ok: !!access && !!refresh, status: r.status };
  });
  if (!access || !refresh) {
    console.error('LOGIN FAILED · aborting');
    process.exit(1);
  }

  // --- 3. JWT contains custom claims (firm_id, role_lexai) -------------
  console.log('[3] JWT custom claims');
  await timed('JWT.firm_id present', async () => {
    const claims = JSON.parse(Buffer.from(access!.split('.')[1]!, 'base64url').toString());
    const ok = !!claims.firm_id && !!claims.role_lexai;
    return {
      ok,
      detail: `firm_id=${claims.firm_id ?? '—'} role=${claims.role_lexai ?? '—'} cedula=${claims.cedula_profesional ?? '—'}`,
    };
  });

  const cookie = buildSupabaseSsrCookie(access, refresh);

  // --- 4. Backend endpoints (Railway) ---------------------------------
  console.log('[4] Backend Railway endpoints (auth: Bearer)');
  const auth = { Authorization: `Bearer ${access}` };
  const matters = await timed('GET /v1/matters/', async () => {
    const r = await fetch(`${BACKEND}/v1/matters/`, { headers: auth });
    const data = (await r.json()) as Array<{ id: string }>;
    return { ok: r.status === 200 && Array.isArray(data) && data.length > 0, status: r.status, payload: data, detail: `${data.length} matters` };
  });
  const clients = await timed('GET /v1/clients/', async () => {
    const r = await fetch(`${BACKEND}/v1/clients/`, { headers: auth });
    const data = (await r.json()) as Array<{ id: string }>;
    return { ok: r.status === 200 && Array.isArray(data) && data.length > 0, status: r.status, payload: data, detail: `${data.length} clients` };
  });
  await timed('GET /v1/hitl/', async () => {
    const r = await fetch(`${BACKEND}/v1/hitl/`, { headers: auth });
    const data = (await r.json()) as Array<{ kind: string }>;
    return { ok: r.status === 200, status: r.status, detail: `${data.length} pending` };
  });
  await timed('POST /v1/voice/ticket', async () => {
    const r = await fetch(`${BACKEND}/v1/voice/ticket`, { method: 'POST', headers: auth });
    const data = (await r.json()) as { ticket?: string; expires_at?: number };
    return { ok: r.status === 200 && !!data.ticket, status: r.status };
  });
  await timed('POST /v1/citations/search', async () => {
    const r = await fetch(`${BACKEND}/v1/citations/search`, {
      method: 'POST',
      headers: { ...auth, 'Content-Type': 'application/json' },
      body: JSON.stringify({ query: 'despido sin justa causa', limit: 3 }),
    });
    const data = (await r.json()) as Array<{ citation_ref: string }>;
    return {
      ok: r.status === 200 && data.length > 0,
      status: r.status,
      detail: data.map((c) => c.citation_ref).join(', '),
    };
  });
  await timed('POST /v1/calc/liquidacion', async () => {
    const r = await fetch(`${BACKEND}/v1/calc/liquidacion`, {
      method: 'POST',
      headers: { ...auth, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fecha_ingreso: '2019-01-15',
        fecha_terminacion: '2026-03-14',
        salario_mensual_cop: 4_500_000,
        causa: 'injustificado',
      }),
    });
    const data = (await r.json()) as { total_cop?: number; line_items?: unknown[] };
    return {
      ok: r.status === 200 && typeof data.total_cop === 'number' && data.total_cop > 0,
      status: r.status,
      detail: `total=COP $${data.total_cop?.toLocaleString('es-CO')} · ${data.line_items?.length ?? 0} items`,
    };
  });

  // --- 5. Frontend RSC routes (with session cookie) -------------------
  console.log('[5] Frontend RSC routes (cookie auth)');
  const matterId = matters?.[0]?.id;
  const clientId = clients?.[0]?.id;
  const protectedRoutes = [
    '/inicio',
    '/casos',
    '/clientes',
    '/calendario',
    '/documentos',
    '/notificaciones',
    '/liquidacion',
    '/settings/despacho',
    '/settings/privacidad',
    '/admin/eval',
    '/admin/pmf',
  ];
  if (matterId) {
    protectedRoutes.push(`/casos/${matterId}`);
    protectedRoutes.push(`/casos/${matterId}/canvas`);
  }
  if (clientId) protectedRoutes.push(`/clientes/${clientId}`);

  for (const path of protectedRoutes) {
    await timed(`RSC ${path}`, async () => {
      const r = await fetch(FRONTEND + path, {
        headers: { cookie },
        redirect: 'follow',
      });
      const text = await r.text();
      const ok = r.status === 200 && !text.includes('redirect') && text.length > 1000;
      return { ok, status: r.status, detail: `${(text.length / 1024).toFixed(1)} KB` };
    });
  }

  // --- 6. Frontend API routes (proxy + session) -----------------------
  console.log('[6] Frontend API routes');
  await timed('GET /api/cmdk/search?q=despido', async () => {
    const r = await fetch(`${FRONTEND}/api/cmdk/search?q=despido`, { headers: { cookie } });
    const data = (await r.json()) as {
      matters?: unknown[];
      clients?: unknown[];
      documents?: unknown[];
      sentencias?: unknown[];
    };
    const total = (data.matters?.length ?? 0) + (data.clients?.length ?? 0) + (data.documents?.length ?? 0) + (data.sentencias?.length ?? 0);
    return { ok: r.status === 200 && total > 0, status: r.status, detail: `${total} hits total` };
  });
  await timed('POST /api/voice/ticket', async () => {
    const r = await fetch(`${FRONTEND}/api/voice/ticket`, {
      method: 'POST',
      headers: { cookie, 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    });
    const data = (await r.json()) as { ticket?: string };
    return { ok: r.status === 200 && !!data.ticket, status: r.status };
  });
  await timed('POST /api/calc/liquidacion', async () => {
    const r = await fetch(`${FRONTEND}/api/calc/liquidacion`, {
      method: 'POST',
      headers: { cookie, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fecha_ingreso: '2020-06-01',
        fecha_terminacion: '2026-04-01',
        salario_mensual_cop: 3_500_000,
        causa: 'injustificado',
      }),
    });
    const data = (await r.json()) as { total_cop?: number };
    return { ok: r.status === 200 && typeof data.total_cop === 'number', status: r.status, detail: `total=${data.total_cop}` };
  });
  await timed('POST /api/arco', async () => {
    const r = await fetch(`${FRONTEND}/api/arco`, {
      method: 'POST',
      headers: { cookie, 'Content-Type': 'application/json' },
      body: JSON.stringify({ tipo: 'acceso', titular_nombre: 'Test', titular_doc: '12345', descripcion: 'smoke' }),
    });
    return { ok: r.status === 200, status: r.status };
  });
  await timed('POST /api/auth/verify-cedula', async () => {
    const r = await fetch(`${FRONTEND}/api/auth/verify-cedula`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tarjeta_profesional: '123456' }),
    });
    const data = (await r.json()) as { ok?: boolean; status?: string };
    return { ok: r.status === 200 && data.ok === true, status: r.status };
  });

  // --- 7. RLS smoke (cross-tenant) ------------------------------------
  // (Skipped: would require creating a 2nd test firm + user, out of scope
  //  for smoke. Covered by Sprint 6 Playwright suite.)

  // === Print report ===
  console.log('\n--- Report ---\n');
  console.log(`${pad('Name', 50)} ${pad('Status', 8)} ${pad('Time', 10)} Detail`);
  console.log('-'.repeat(120));
  for (const r of results) {
    const c = color(r.ok, r.ms);
    const status = r.status ? String(r.status) : '—';
    const time = `${r.ms}ms`;
    const detail = r.detail ?? '';
    console.log(`${c} ${pad(r.name, 48)} ${pad(status, 8)} ${pad(time, 10)} ${detail}`);
  }

  const failed = results.filter((r) => !r.ok);
  const slow = results.filter((r) => r.ok && r.ms > SLOW_THRESHOLD_MS);
  console.log(`\nResults: ${results.length - failed.length}/${results.length} passed`);
  console.log(`Slow (>${SLOW_THRESHOLD_MS}ms): ${slow.length}`);

  if (failed.length > 0) {
    console.error('\n❌ FAILURES:');
    for (const f of failed) console.error(`   ${f.name} → ${f.detail ?? f.status}`);
    process.exit(1);
  }
  if (FAIL_ON_SLOW && slow.length > 0) {
    console.error(`\n❌ Too slow: ${slow.length} routes >${SLOW_THRESHOLD_MS}ms`);
    process.exit(1);
  }
  console.log('\n✅ ALL CHECKS PASSED\n');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
