import { AppShell } from '@/components/shell/AppShell';
import AgentsDashboard from '@/components/v2/agents/AgentsDashboard';

export const dynamic = 'force-dynamic';

export default function AgentsPage() {
  return (
    <AppShell active="inicio">
      <main
        className="flex min-h-0 min-w-0 flex-1 flex-col overflow-auto h-full"
        style={{ backgroundColor: 'var(--v2-bg-base, #FAFAF7)' }}
      >
        <div className="max-w-4xl w-full mx-auto px-6 py-10">
          <AgentsDashboard />
        </div>
      </main>
    </AppShell>
  );
}
