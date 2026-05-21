/**
 * AppShell · cached server component.
 * Single bulk fetch via unstable_cache (TTL 60s). Renders the Sidebar
 * (wrapped in a SidebarShell client island that handles the mobile drawer)
 * with real firm/user/NSM data + the page content.
 *
 * F1-T07 · Feature flag NEXT_PUBLIC_UX_V2_SHELL=true → SidebarV2
 *          Flag OFF → sidebar legacy sin cambios (zero regression).
 */
import { Sidebar, type SidebarKey } from './Sidebar';
import { SidebarShell } from './SidebarShell';
import { SidebarShellV2 } from '@/components/v2/shell/SidebarShellV2';
import { getCachedShellData } from '@/lib/api/cached-fetchers';
import { getSessionPrincipal } from '@/lib/supabase/session';

/** Leer el flag en server-side (env var disponible en build time + runtime). */
const UX_V2_SHELL = process.env.NEXT_PUBLIC_UX_V2_SHELL === 'true';

export async function AppShell({
  active,
  children,
}: {
  active: SidebarKey;
  children: React.ReactNode;
}) {
  const { firm, nsm, counts } = await getCachedShellData();

  // ── F1-T07: Switch de feature flag ───────────────────────────────────────
  // CRÍTICO: el bloque legacy (SidebarShell + Sidebar) no se modifica.
  // Solo se agrega la rama del flag ON encima.
  if (UX_V2_SHELL) {
    // El email viene del JWT — getCachedShellData no lo incluye.
    const principal = await getSessionPrincipal();
    return (
      <>
        <SidebarShellV2
          firmName={firm?.razon_social ?? 'Despacho'}
          userName={firm?.user_full_name ?? 'Usuario'}
          userEmail={principal?.email ?? undefined}
        />
        {children}
      </>
    );
  }

  // ── Legacy (flag OFF) — sin ningún cambio ─────────────────────────────────
  return (
    <>
      <SidebarShell>
        <Sidebar
          active={active}
          firmName={firm?.razon_social ?? 'Despacho'}
          user={{
            name: firm?.user_full_name ?? 'Usuario',
            cedula: firm?.user_cedula ?? '',
          }}
          nsm={{
            documentos: nsm.documentos,
            meta: nsm.meta,
            deltaPct: nsm.deltaPct,
          }}
          counts={{
            casos: counts.matters,
            clientes: counts.clients,
            calendario: counts.deadlines7d,
            inbox: counts.hitl + counts.judicial,
          }}
          role={firm?.user_role ?? null}
          modoEjercicio={firm?.modo_ejercicio ?? null}
          primaryArea={firm?.primary_area ?? null}
        />
      </SidebarShell>
      {children}
    </>
  );
}
