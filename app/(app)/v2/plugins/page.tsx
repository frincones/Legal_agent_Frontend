import { AppShell } from '@/components/shell/AppShell';
import PluginsMarketplace from '@/components/v2/plugins/PluginsMarketplace';
export const dynamic = 'force-dynamic';
export default function PluginsPage() {
  return (
    <AppShell active="inicio">
      <main className="flex min-h-0 min-w-0 flex-1 flex-col overflow-auto h-full"
            style={{ backgroundColor: 'var(--v2-bg-base, #FAFAF7)' }}>
        <div className="max-w-6xl w-full mx-auto px-6 py-10">
          <PluginsMarketplace />
        </div>
      </main>
    </AppShell>
  );
}
