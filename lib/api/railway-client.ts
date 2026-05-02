/**
 * Typed fetch wrapper for the Railway FastAPI backend.
 *
 * Server-side usage (RSC, Route Handlers): pass the user's Supabase
 * access token in the Authorization header. We don't store tokens in
 * the client wrapper — auth flows through the Supabase session cookie.
 *
 * Browser usage: prefer Next.js Route Handlers under /app/api/* that
 * proxy to Railway. That way the browser never needs the access token
 * directly and we keep CORS strict.
 */

const API_BASE = process.env.NEXT_PUBLIC_RAILWAY_API ?? 'http://localhost:8000';

export class RailwayError extends Error {
  constructor(
    public status: number,
    public detail: unknown,
    message: string,
  ) {
    super(message);
    this.name = 'RailwayError';
  }
}

type FetchOpts = RequestInit & { token?: string };

export async function railwayFetch<T = unknown>(
  path: string,
  opts: FetchOpts = {},
): Promise<T> {
  const url = `${API_BASE}${path.startsWith('/') ? path : `/${path}`}`;
  const headers: Record<string, string> = {
    'content-type': 'application/json',
    ...((opts.headers as Record<string, string>) ?? {}),
  };
  if (opts.token) headers.authorization = `Bearer ${opts.token}`;

  const res = await fetch(url, {
    ...opts,
    headers,
    cache: 'no-store',
  });

  if (!res.ok) {
    let detail: unknown = await res.text().catch(() => '');
    try {
      detail = JSON.parse(detail as string);
    } catch {
      // leave as text
    }
    const message = `Railway ${res.status} ${res.statusText} on ${path}`;
    throw new RailwayError(res.status, detail, message);
  }
  if (res.status === 204) return undefined as T;
  return (await res.json()) as T;
}

/** Stream NDJSON / SSE chunks from Railway as an async iterable of parsed objects. */
export async function* railwayStream<T = unknown>(
  path: string,
  opts: FetchOpts = {},
): AsyncIterable<T> {
  const url = `${API_BASE}${path.startsWith('/') ? path : `/${path}`}`;
  const headers: Record<string, string> = {
    'content-type': 'application/json',
    accept: 'application/x-ndjson',
    ...((opts.headers as Record<string, string>) ?? {}),
  };
  if (opts.token) headers.authorization = `Bearer ${opts.token}`;

  const res = await fetch(url, { ...opts, headers });
  if (!res.ok || !res.body) {
    throw new RailwayError(res.status, await res.text(), `Stream failed on ${path}`);
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    let i;
    while ((i = buffer.indexOf('\n')) >= 0) {
      const line = buffer.slice(0, i).trim();
      buffer = buffer.slice(i + 1);
      if (!line) continue;
      // Strip "data: " SSE prefix if present
      const payload = line.startsWith('data:') ? line.slice(5).trim() : line;
      if (!payload || payload === '[DONE]') continue;
      try {
        yield JSON.parse(payload) as T;
      } catch {
        // ignore malformed lines
      }
    }
  }
}

// ─────────────────────────────────────────────────────────────────────
// Typed adapters
// ─────────────────────────────────────────────────────────────────────

export type CitationHit = {
  juris_id: string;
  corte: string;
  citation_ref: string;
  rubro: string | null;
  vigencia: string;
  url_oficial: string | null;
  ratio_decidendi: string | null;
  relevancia: 'Muy alta' | 'Alta' | 'Media';
  combined_score: number;
};

export type CitationVerifyResult = {
  citation_ref: string;
  estado: 'verificada' | 'no_encontrada' | 'superada' | 'sospechosa';
  juris_id?: string;
  corte?: string;
  rubro?: string;
  vigencia?: string;
  url_oficial?: string;
};

export type LiquidacionLineItem = {
  concepto: string;
  formula: string;
  base: number;
  multiplicador: number;
  monto_cop: number;
  nota?: string | null;
  fundamento?: string | null;
};

export type LiquidacionResponse = {
  id: string;
  formulas_version: string;
  inputs: Record<string, unknown>;
  line_items: LiquidacionLineItem[];
  total_cop: number;
  causa: string;
  aplica_indemnizacion: boolean;
  desglose_legible: string;
};

export const railwayApi = {
  voice: {
    issueTicket: (token: string, matter_id?: string) =>
      railwayFetch<{ ticket: string; expires_at: number; ttl_seconds: number }>(
        `/v1/voice/ticket${matter_id ? `?matter_id=${encodeURIComponent(matter_id)}` : ''}`,
        { method: 'POST', token },
      ),
  },
  citations: {
    search: (token: string, body: { query: string; corte?: string; limit?: number }) =>
      railwayFetch<CitationHit[]>('/v1/citations/search', {
        method: 'POST',
        token,
        body: JSON.stringify(body),
      }),
    verify: (token: string, refs: string[]) =>
      railwayFetch<CitationVerifyResult[]>('/v1/citations/verify', {
        method: 'POST',
        token,
        body: JSON.stringify({ citation_refs: refs }),
      }),
    get: (token: string, ref: string) =>
      railwayFetch<CitationVerifyResult>(`/v1/citations/${encodeURIComponent(ref)}`, { token }),
  },
  calc: {
    liquidacion: (
      token: string,
      body: {
        fecha_ingreso: string;
        fecha_terminacion: string;
        salario_mensual_cop: number;
        causa: string;
        tipo_contrato?: string;
        salario_integral?: boolean;
        trabajador_nombre?: string;
        matter_id?: string;
      },
    ) =>
      railwayFetch<LiquidacionResponse>('/v1/calc/liquidacion', {
        method: 'POST',
        token,
        body: JSON.stringify(body),
      }),
  },
  matters: {
    list: (token: string, params?: { materia?: string; status?: string; limit?: number }) => {
      const qs = new URLSearchParams();
      if (params?.materia) qs.set('materia', params.materia);
      if (params?.status) qs.set('status', params.status);
      if (params?.limit) qs.set('limit', String(params.limit));
      return railwayFetch<unknown[]>(`/v1/matters/${qs.toString() ? `?${qs}` : ''}`, { token });
    },
    get: (token: string, id: string) =>
      railwayFetch<unknown>(`/v1/matters/${id}`, { token }),
    timeline: (token: string, id: string) =>
      railwayFetch<{ items: unknown[] }>(`/v1/matters/${id}/timeline`, { token }),
  },
  hitl: {
    listPending: (token: string) =>
      railwayFetch<unknown[]>('/v1/hitl/', { token }),
    decide: (
      token: string,
      interrupt_id: string,
      body: { decision: 'approved' | 'edited' | 'rejected'; decision_payload?: unknown },
    ) =>
      railwayFetch<{ id: string; decision: string }>(
        `/v1/hitl/${encodeURIComponent(interrupt_id)}/decide`,
        { method: 'POST', token, body: JSON.stringify(body) },
      ),
  },
};
