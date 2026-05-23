"use client";

import * as React from "react";

interface Version {
  id: string;
  version_num: number;
  change_type: string;
  section_key?: string | null;
  feedback?: string | null;
  created_at: string;
}

interface Props {
  documentId: string;
  visible: boolean;
}

const CHANGE_TYPE_LABEL: Record<string, string> = {
  initial: "Versión inicial",
  regenerate_section: "Regeneración de sección",
  manual_edit: "Edición manual",
  polish: "Polish pass",
  rebuild: "Reconstrucción",
};

export function VersionHistory({ documentId, visible }: Props) {
  const [versions, setVersions] = React.useState<Version[]>([]);
  const [loading, setLoading] = React.useState(false);

  React.useEffect(() => {
    if (!visible || !documentId) return;
    setLoading(true);
    fetch(`/api/documents/v2/documents/${encodeURIComponent(documentId)}/versions`)
      .then((r) => (r.ok ? r.json() : { versions: [] }))
      .then((d) => setVersions(d.versions || []))
      .catch(() => setVersions([]))
      .finally(() => setLoading(false));
  }, [documentId, visible]);

  if (!visible) return null;

  return (
    <div className="border border-zinc-200 rounded-md bg-white p-3 text-xs">
      <h3 className="font-semibold text-sm mb-2">📚 Historial de versiones</h3>
      {loading && <p className="text-zinc-400 text-center py-2">Cargando…</p>}
      {!loading && versions.length === 0 && (
        <p className="text-zinc-400 text-center py-2">Sin versiones previas</p>
      )}
      <ul className="divide-y divide-zinc-100">
        {versions.map((v) => (
          <li key={v.id} className="py-2 flex items-center gap-2">
            <span className="font-mono text-[10px] bg-zinc-100 px-1.5 py-0.5 rounded">v{v.version_num}</span>
            <span className="flex-1 truncate">
              {CHANGE_TYPE_LABEL[v.change_type] || v.change_type}
              {v.section_key && <span className="text-zinc-500"> · §{v.section_key}</span>}
            </span>
            <span className="text-[10px] text-zinc-400">
              {new Date(v.created_at).toLocaleString("es-CO", { dateStyle: "short", timeStyle: "short" })}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
