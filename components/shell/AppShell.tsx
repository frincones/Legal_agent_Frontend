/**
 * AppShell · cached server component.
 * Single bulk fetch via unstable_cache (TTL 60s). Renders the Sidebar
 * with real firm/user/NSM data + the page content.
 */
import { Sidebar, type SidebarKey } from './Sidebar';
import { getCachedShellData } from '@/lib/api/cached-fetchers';

export async function AppShell({
  active,
  children,
}: {
  active: SidebarKey;
  children: React.ReactNode;
}) {
  const { firm, nsm, counts } = await getCachedShellData();

  return (
    <>
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
          inbox: counts.hitl,
        }}
      />
      {children}
    </>
  );
}
