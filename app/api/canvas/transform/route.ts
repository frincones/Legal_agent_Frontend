import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * POST /api/canvas/transform
 * Body: { action: 'improve' | 'formalize' | 'summarize' | 'cite', text: string, context_hint?: string }
 * Devuelve: { markdown: string, action, chars_in, chars_out }
 *
 * Proxy al backend Railway (/v1/canvas/transform).
 * Usado por AIBubbleMenu y SlashMenu para transformaciones IA sobre el texto.
 */
export async function POST(req: Request) {
  const supabase = createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session?.access_token) {
    return NextResponse.json({ error: 'unauthenticated' }, { status: 401 });
  }
  const apiBase = process.env.NEXT_PUBLIC_RAILWAY_API ?? 'http://localhost:8000';
  const body = await req.text();
  const res = await fetch(`${apiBase}/v1/canvas/transform`, {
    method: 'POST',
    headers: {
      authorization: `Bearer ${session.access_token}`,
      'content-type': 'application/json',
    },
    body,
    cache: 'no-store',
  });
  const text = await res.text();
  return new NextResponse(text, {
    status: res.status,
    headers: { 'content-type': res.headers.get('content-type') ?? 'application/json' },
  });
}
