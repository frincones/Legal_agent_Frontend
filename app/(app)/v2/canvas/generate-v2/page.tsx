/**
 * Página /v2/canvas/generate-v2
 *
 * Sprint M · Document Generation v3.1 con block-level streaming.
 * No reemplaza /v2/canvas/generate (v1) — ruta paralela detrás de flag.
 */
import { GenerationView } from "@/components/v2/document-gen/v2/GenerationView";

export const dynamic = "force-dynamic";

export default function GenerateV2Page() {
  return <GenerationView />;
}
