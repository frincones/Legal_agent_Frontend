'use client';

/**
 * MarkdownContent — minimal-deps markdown renderer styled to match the
 * Claude Code / Claude Cowork output (clear hierarchy, no emoji, code pills,
 * tables with subtle borders, inline citation links).
 *
 * Why a custom parser instead of react-markdown:
 *   - Zero new dependencies (no pnpm-lock churn, no Vercel install risk).
 *   - Full control over styling (Tailwind classes + design tokens already
 *     defined in tailwind.config.ts: bg, ink, accent, ok, warn, danger).
 *   - Streaming-friendly (no virtualization of AST per token).
 *
 * Supported syntax (everything the /ask skill prompt emits):
 *   #  ##  ###          headings
 *   **bold**            bold (no nesting)
 *   *italic*            italic
 *   `inline code`       inline code chip
 *   ```fenced blocks``` code blocks (with optional language label)
 *   - bullet / * bullet unordered list (single level)
 *   1. ordered          ordered list (single level)
 *   > blockquote        callout box
 *   | a | b |           tables (with header row + separator)
 *   ---                 horizontal rule
 *   [text](url)         link
 *   raw URLs            auto-linked
 *
 * Intentionally NOT supported (overkill for chat answers):
 *   - nested lists, footnotes, definition lists, html, math
 *   - if the user really needs them they can open the canvas
 */

import { Fragment, type ReactNode } from 'react';

interface MarkdownContentProps {
  source: string;
  /** Optional small density override for compact threads. */
  density?: 'normal' | 'compact';
}

export function MarkdownContent({ source, density = 'normal' }: MarkdownContentProps) {
  const blocks = parseBlocks(unwrapFullMessageFence(source));
  const gap = density === 'compact' ? 'gap-1.5' : 'gap-2.5';
  return (
    <div className={`flex flex-col ${gap} text-[13px] leading-[1.55] text-ink`}>
      {blocks.map((b, i) => renderBlock(b, i))}
    </div>
  );
}

// Defensive · if the whole reply is wrapped in a single ```fence``` block
// (some models do this when the system prompt shows markdown templates inside
// code fences), strip the outer fence so we render the inner markdown properly.
// Only unwrap when the fence language is empty or "markdown"/"md" — never for
// real code blocks (json, python, etc.).
function unwrapFullMessageFence(source: string): string {
  const trimmed = source.trim();
  const match = trimmed.match(/^```(\w*)\s*\n([\s\S]*?)\n```\s*$/);
  if (!match) return source;
  const lang = (match[1] || '').toLowerCase();
  if (lang && lang !== 'markdown' && lang !== 'md') return source;
  return match[2] ?? source;
}

// ──────────────────────────────────────────────────────────────
// Block-level parsing
// ──────────────────────────────────────────────────────────────

type Block =
  | { kind: 'heading'; level: 1 | 2 | 3; text: string }
  | { kind: 'paragraph'; text: string }
  | { kind: 'code'; lang?: string; code: string }
  | { kind: 'list'; ordered: boolean; items: string[] }
  | { kind: 'quote'; text: string }
  | { kind: 'table'; headers: string[]; rows: string[][] }
  | { kind: 'hr' };

function parseBlocks(source: string): Block[] {
  const lines = source.replace(/\r\n/g, '\n').split('\n');
  const blocks: Block[] = [];
  let i = 0;
  const lineAt = (idx: number): string => lines[idx] ?? '';
  while (i < lines.length) {
    const line = lineAt(i);

    // Fenced code block
    const fence = line.match(/^```(\w*)\s*$/);
    if (fence) {
      const lang = fence[1] || undefined;
      const codeLines: string[] = [];
      i++;
      while (i < lines.length && !/^```/.test(lineAt(i))) {
        codeLines.push(lineAt(i));
        i++;
      }
      if (i < lines.length) i++; // skip closing fence
      blocks.push({ kind: 'code', lang, code: codeLines.join('\n') });
      continue;
    }

    // Horizontal rule
    if (/^(\s*[-*_]){3,}\s*$/.test(line) && line.trim().length > 0) {
      blocks.push({ kind: 'hr' });
      i++;
      continue;
    }

    // Headings (#, ##, ###)
    const h = line.match(/^(#{1,3})\s+(.+?)\s*#*\s*$/);
    if (h && h[1] && h[2] !== undefined) {
      blocks.push({
        kind: 'heading',
        level: h[1].length as 1 | 2 | 3,
        text: h[2],
      });
      i++;
      continue;
    }

    // Blockquote (can span multiple lines)
    if (/^>\s?/.test(line)) {
      const qLines: string[] = [];
      while (i < lines.length && /^>\s?/.test(lineAt(i))) {
        qLines.push(lineAt(i).replace(/^>\s?/, ''));
        i++;
      }
      blocks.push({ kind: 'quote', text: qLines.join('\n').trim() });
      continue;
    }

    // Tables: a line of pipes followed by a separator |---|---|
    if (
      /^\s*\|/.test(line) &&
      i + 1 < lines.length &&
      /^\s*\|?\s*:?-{3,}/.test(lineAt(i + 1))
    ) {
      const headers = parseTableRow(line);
      i += 2; // skip header + separator
      const rows: string[][] = [];
      while (i < lines.length && /^\s*\|/.test(lineAt(i))) {
        rows.push(parseTableRow(lineAt(i)));
        i++;
      }
      blocks.push({ kind: 'table', headers, rows });
      continue;
    }

    // Lists (unordered: - or * · ordered: 1. )
    if (/^\s*([-*]|\d+\.)\s+/.test(line)) {
      const ordered = /^\s*\d+\.\s+/.test(line);
      const items: string[] = [];
      while (i < lines.length && /^\s*([-*]|\d+\.)\s+/.test(lineAt(i))) {
        const stripped = lineAt(i).replace(/^\s*([-*]|\d+\.)\s+/, '');
        // Multi-line item: subsequent indented lines belong to last item.
        let item = stripped;
        let j = i + 1;
        while (
          j < lines.length &&
          /^\s{2,}\S/.test(lineAt(j)) &&
          !/^\s*([-*]|\d+\.)\s+/.test(lineAt(j))
        ) {
          item += '\n' + lineAt(j).replace(/^\s+/, '');
          j++;
        }
        items.push(item);
        i = j;
      }
      blocks.push({ kind: 'list', ordered, items });
      continue;
    }

    // Blank line → skip
    if (line.trim() === '') {
      i++;
      continue;
    }

    // Paragraph (collect contiguous non-blank, non-block lines)
    const para: string[] = [line];
    i++;
    while (i < lines.length) {
      const next = lineAt(i);
      if (
        next.trim() === '' ||
        /^(#{1,3})\s+/.test(next) ||
        /^>\s?/.test(next) ||
        /^```/.test(next) ||
        /^\s*([-*]|\d+\.)\s+/.test(next) ||
        /^\s*\|/.test(next)
      ) {
        break;
      }
      para.push(next);
      i++;
    }
    blocks.push({ kind: 'paragraph', text: para.join(' ') });
  }
  return blocks;
}

function parseTableRow(line: string): string[] {
  // Strip leading + trailing | then split. Pipes inside backticks shouldn't
  // appear in our agent output but be defensive about backslash-escapes.
  const trimmed = line.trim().replace(/^\|/, '').replace(/\|$/, '');
  return trimmed.split('|').map((c) => c.trim());
}

// ──────────────────────────────────────────────────────────────
// Block-level rendering
// ──────────────────────────────────────────────────────────────

function renderBlock(block: Block, key: number): ReactNode {
  switch (block.kind) {
    case 'heading': {
      const Tag = (`h${block.level}` as const) as 'h1' | 'h2' | 'h3';
      const sizeClass =
        block.level === 1
          ? 'text-base font-semibold text-ink'
          : block.level === 2
          ? 'text-sm font-semibold text-ink border-line border-b pb-1 mt-1'
          : 'text-[13px] font-semibold text-ink-2 uppercase tracking-wide';
      return (
        <Tag key={key} className={sizeClass}>
          {renderInline(block.text)}
        </Tag>
      );
    }
    case 'paragraph':
      return (
        <p key={key} className="text-ink leading-[1.55]">
          {renderInline(block.text)}
        </p>
      );
    case 'code':
      return (
        <div key={key} className="bg-bg-sunken border-line overflow-x-auto rounded-md border">
          {block.lang && (
            <div className="border-line text-ink-3 border-b px-3 py-1 font-mono text-[10px] uppercase tracking-wide">
              {block.lang}
            </div>
          )}
          <pre className="px-3 py-2 font-mono text-[12px] leading-relaxed text-ink whitespace-pre overflow-x-auto">
            {block.code}
          </pre>
        </div>
      );
    case 'list': {
      if (block.ordered) {
        return (
          <ol
            key={key}
            className="text-ink ml-4 list-decimal space-y-1 marker:text-ink-3"
          >
            {block.items.map((it, idx) => (
              <li key={idx} className="leading-[1.55]">
                {renderInline(it)}
              </li>
            ))}
          </ol>
        );
      }
      return (
        <ul
          key={key}
          className="text-ink ml-4 list-disc space-y-1 marker:text-ink-3"
        >
          {block.items.map((it, idx) => (
            <li key={idx} className="leading-[1.55]">
              {renderInline(it)}
            </li>
          ))}
        </ul>
      );
    }
    case 'quote':
      return (
        <blockquote
          key={key}
          className="border-warn/40 bg-warn-soft text-ink rounded-r-md border-l-2 px-3 py-2 text-[13px]"
        >
          {renderInline(block.text)}
        </blockquote>
      );
    case 'hr':
      return <hr key={key} className="border-line my-1 border-t" />;
    case 'table':
      return (
        <div key={key} className="border-line overflow-x-auto rounded-md border">
          <table className="text-ink min-w-full text-[12px]">
            <thead className="bg-bg-sunken">
              <tr>
                {block.headers.map((h, idx) => (
                  <th
                    key={idx}
                    className="border-line text-ink-2 border-b px-2.5 py-1.5 text-left font-medium"
                  >
                    {renderInline(h)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {block.rows.map((row, rIdx) => (
                <tr key={rIdx} className={rIdx % 2 ? 'bg-bg-sunken/40' : ''}>
                  {row.map((cell, cIdx) => (
                    <td
                      key={cIdx}
                      className="border-line border-t px-2.5 py-1.5 align-top"
                    >
                      {renderInline(cell)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
  }
}

// ──────────────────────────────────────────────────────────────
// Inline parsing · order matters · code chips > links > bold > italic
// ──────────────────────────────────────────────────────────────

const INLINE_RE = new RegExp(
  [
    '(`[^`]+`)',                                  // 1. inline code
    '(\\[[^\\]]+\\]\\([^)]+\\))',                 // 2. markdown link
    '(https?://[^\\s)]+)',                        // 3. bare URL
    '(\\*\\*[^*]+\\*\\*)',                        // 4. bold
    '(__[^_]+__)',                                // 5. bold (alt)
    '(\\*[^*]+\\*)',                              // 6. italic
    '(_[^_]+_)',                                  // 7. italic (alt)
  ].join('|'),
  'g',
);

function renderInline(text: string): ReactNode {
  if (!text) return null;
  const parts: ReactNode[] = [];
  let lastIdx = 0;
  let match: RegExpExecArray | null;
  let nodeKey = 0;
  INLINE_RE.lastIndex = 0;
  while ((match = INLINE_RE.exec(text)) !== null) {
    if (match.index > lastIdx) {
      parts.push(escapeNode(text.slice(lastIdx, match.index), nodeKey++));
    }
    const token = match[0];
    parts.push(renderInlineToken(token, nodeKey++));
    lastIdx = match.index + token.length;
  }
  if (lastIdx < text.length) {
    parts.push(escapeNode(text.slice(lastIdx), nodeKey++));
  }
  return <>{parts}</>;
}

function escapeNode(text: string, key: number): ReactNode {
  // Newlines inside a paragraph become <br>. No HTML escaping needed because
  // React handles it automatically when rendering as children.
  if (text.indexOf('\n') === -1) return <Fragment key={key}>{text}</Fragment>;
  const lines = text.split('\n');
  return (
    <Fragment key={key}>
      {lines.map((l, i) => (
        <Fragment key={i}>
          {l}
          {i < lines.length - 1 && <br />}
        </Fragment>
      ))}
    </Fragment>
  );
}

function renderInlineToken(token: string, key: number): ReactNode {
  // Inline code
  if (token.startsWith('`') && token.endsWith('`')) {
    return (
      <code
        key={key}
        className="bg-bg-sunken text-ink border-line rounded-sm border px-1 py-0.5 font-mono text-[11px]"
      >
        {token.slice(1, -1)}
      </code>
    );
  }
  // Markdown link [text](url)
  const md = token.match(/^\[([^\]]+)\]\(([^)]+)\)$/);
  if (md) {
    return (
      <a
        key={key}
        href={md[2]}
        target="_blank"
        rel="noopener noreferrer"
        className="text-accent hover:underline"
      >
        {md[1]}
      </a>
    );
  }
  // Bare URL
  if (/^https?:\/\//.test(token)) {
    return (
      <a
        key={key}
        href={token}
        target="_blank"
        rel="noopener noreferrer"
        className="text-accent break-all hover:underline"
      >
        {token}
      </a>
    );
  }
  // Bold (** or __)
  if (
    (token.startsWith('**') && token.endsWith('**')) ||
    (token.startsWith('__') && token.endsWith('__'))
  ) {
    return (
      <strong key={key} className="text-ink font-semibold">
        {token.slice(2, -2)}
      </strong>
    );
  }
  // Italic (* or _)
  if (
    (token.startsWith('*') && token.endsWith('*')) ||
    (token.startsWith('_') && token.endsWith('_'))
  ) {
    return (
      <em key={key} className="text-ink italic">
        {token.slice(1, -1)}
      </em>
    );
  }
  return <Fragment key={key}>{token}</Fragment>;
}
