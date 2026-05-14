import { FeatureFlagsPanel } from '@/components/admin/FeatureFlagsPanel';

export const dynamic = 'force-dynamic';

export default function FlagsPage() {
  return (
    <div className="p-6">
      <h1 className="serif mb-1 text-[22px] font-semibold">Feature flags</h1>
      <p className="mb-6 text-[12.5px] muted">
        Catálogo global · rollout porcentual · overrides por firm en /admin/tenants/[id].
      </p>
      <FeatureFlagsPanel />
    </div>
  );
}
