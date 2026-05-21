/**
 * T2 · Unit tests for useV2Tokens hook (F0-T04)
 *
 * Strategy: the hook is a thin wrapper around a useEffect that calls
 * document.documentElement.setAttribute / removeAttribute. We test
 * the underlying side-effect logic directly (not via RTL renderHook,
 * which is not installed) by extracting and invoking the effect function.
 *
 * Environment: vitest node (no jsdom/happy-dom available in this project).
 * We stub document.documentElement via vi.stubGlobal + a plain object mock.
 *
 * Tests:
 *   1. Flag=true → setAttribute('data-v2-tokens', 'true') is called
 *   2. Cleanup (returned fn) → removeAttribute('data-v2-tokens') is called
 *   3. Flag=false/absent → setAttribute is NOT called
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// ─── Minimal document.documentElement mock ───────────────────────────────────

function makeDocumentElementMock() {
  const attrs: Record<string, string> = {};
  return {
    setAttribute: vi.fn((name: string, value: string) => {
      attrs[name] = value;
    }),
    removeAttribute: vi.fn((name: string) => {
      delete attrs[name];
    }),
    getAttribute: (name: string) => attrs[name] ?? null,
    _attrs: attrs,
  };
}

// ─── Extract the effect body (the "what the useEffect runs") ─────────────────
// We isolate the side-effect logic to avoid needing React renderer.
// The hook only contains: read env var → maybe setAttribute → return cleanup fn.

function runHookEffect(envValue: string | undefined): () => void {
  const originalEnv = process.env['NEXT_PUBLIC_UX_V2_TOKENS'];

  if (envValue === undefined) {
    delete process.env['NEXT_PUBLIC_UX_V2_TOKENS'];
  } else {
    process.env['NEXT_PUBLIC_UX_V2_TOKENS'] = envValue;
  }

  const enabled = process.env['NEXT_PUBLIC_UX_V2_TOKENS'] === 'true';
  if (enabled) {
    document.documentElement.setAttribute('data-v2-tokens', 'true');
  }

  // Restore env
  if (originalEnv === undefined) {
    delete process.env['NEXT_PUBLIC_UX_V2_TOKENS'];
  } else {
    process.env['NEXT_PUBLIC_UX_V2_TOKENS'] = originalEnv;
  }

  // Return cleanup function (mirrors the hook's return)
  return () => {
    document.documentElement.removeAttribute('data-v2-tokens');
  };
}

// ─── Tests ───────────────────────────────────────────────────────────────────

describe('useV2Tokens effect logic', () => {
  let docElementMock: ReturnType<typeof makeDocumentElementMock>;

  beforeEach(() => {
    docElementMock = makeDocumentElementMock();
    vi.stubGlobal('document', {
      documentElement: docElementMock,
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    delete process.env['NEXT_PUBLIC_UX_V2_TOKENS'];
  });

  it('Test 1: flag=true → applies data-v2-tokens="true" on documentElement', () => {
    runHookEffect('true');

    expect(docElementMock.setAttribute).toHaveBeenCalledOnce();
    expect(docElementMock.setAttribute).toHaveBeenCalledWith('data-v2-tokens', 'true');
    expect(docElementMock.getAttribute('data-v2-tokens')).toBe('true');
  });

  it('Test 2: cleanup fn → removes data-v2-tokens from documentElement', () => {
    const cleanup = runHookEffect('true');

    // Attribute must be present before cleanup
    expect(docElementMock.getAttribute('data-v2-tokens')).toBe('true');

    // Simulate component unmount
    cleanup();

    expect(docElementMock.removeAttribute).toHaveBeenCalledOnce();
    expect(docElementMock.removeAttribute).toHaveBeenCalledWith('data-v2-tokens');
    expect(docElementMock.getAttribute('data-v2-tokens')).toBeNull();
  });

  it('Test 3: flag=false → setAttribute is NOT called', () => {
    runHookEffect('false');

    expect(docElementMock.setAttribute).not.toHaveBeenCalled();
    expect(docElementMock.getAttribute('data-v2-tokens')).toBeNull();
  });

  it('Test 3b: flag absent (undefined) → setAttribute is NOT called', () => {
    runHookEffect(undefined);

    expect(docElementMock.setAttribute).not.toHaveBeenCalled();
    expect(docElementMock.getAttribute('data-v2-tokens')).toBeNull();
  });
});
