'use client';

/**
 * Sprint C · CloudDocumentBadge
 * Badge que indica el origen de un documento (manual / Drive / OneDrive / Dropbox / Canvas).
 */

const META: Record<string, { label: string; color: string }> = {
  google_drive: { label: 'Drive', color: 'chip-blue' },
  onedrive: { label: 'OneDrive', color: 'chip-blue' },
  dropbox: { label: 'Dropbox', color: 'chip-blue' },
  canvas: { label: 'Canvas', color: 'chip-purple' },
  docusign: { label: 'DocuSign', color: 'chip-amber' },
  manual: { label: 'Subido', color: '' },
};

export function CloudDocumentBadge({ provider }: { provider?: string | null }) {
  if (!provider) return null;
  const meta = META[provider];
  if (!meta) return null;
  return (
    <span className={`chip text-[10.5px] ${meta.color}`} title={`Origen: ${meta.label}`}>
      {meta.label}
    </span>
  );
}
