/* Voice HUD — el elemento signature de LexAI
   6 estados: idle, listening, thinking, tool, speaking, awaiting */

const HUD_STATES = {
  idle:      { color: "var(--ink-3)",   bgGlow: "transparent",     label: "Hola LexAI",                 caption: "Di \u201cHola LexAI\u201d o pulsa Espacio" },
  listening: { color: "var(--accent)",  bgGlow: "var(--accent)",    label: "Escuchando\u2026",           caption: "" },
  thinking:  { color: "var(--warn)",    bgGlow: "var(--warn)",      label: "Razonando\u2026",            caption: "Sonnet 4.6 \u00b7 contexto del caso" },
  tool:      { color: "var(--purple)",  bgGlow: "var(--purple)",    label: "Buscando jurisprudencia\u2026", caption: "research_jurisprudence \u2192 SCJN registry" },
  speaking:  { color: "var(--ok)",      bgGlow: "var(--ok)",        label: "Respondiendo\u2026",         caption: "" },
  awaiting:  { color: "var(--danger)",  bgGlow: "var(--danger)",    label: "Confirmar env\u00edo",       caption: "Email a contraparte \u00b7 mar\u00eda@lopez-asociados.mx" },
};

const HUD_TRANSCRIPTS = {
  listening: "Red\u00e1ctame demanda laboral por despido injustificado, mi cliente Mar\u00eda Rodr\u00edguez trabajaba en Telmex 7 a\u00f1os\u2026",
  speaking:  "He preparado la demanda con 4 tesis SCJN y c\u00e1lculo de prestaciones. \u00bfQuieres que la revisemos juntos?",
};

function HUDOrb({state}) {
  const s = HUD_STATES[state];
  // animated waveform bars for listening / speaking
  const bars = state === "listening" || state === "speaking";
  return (
    <div className="hud-orb" style={{["--orb-color"]: s.color, ["--orb-glow"]: s.bgGlow}}>
      <div className={`hud-orb-core hud-state-${state}`}>
        {bars ? (
          <div className="hud-bars">
            {[0,1,2,3,4].map(i => <span key={i} style={{animationDelay: `${i*90}ms`}} />)}
          </div>
        ) : state === "thinking" || state === "tool" ? (
          <div className="hud-spin" />
        ) : state === "awaiting" ? (
          <span style={{display:"inline-flex", color:"white"}}>{Ic.warn}</span>
        ) : state === "idle" ? (
          <span className="hud-mic" style={{color: "var(--ink-3)"}}>{Ic.mic}</span>
        ) : null}
      </div>
    </div>
  );
}

function VoiceHUD({state="idle", transcript, compact=false, showTranscript=true}) {
  const s = HUD_STATES[state] || HUD_STATES.idle;
  const txt = transcript ?? HUD_TRANSCRIPTS[state];
  return (
    <div className={`hud glass ${compact ? "hud-compact" : ""}`} data-state={state}>
      <HUDOrb state={state} />
      <div className="hud-body">
        <div className="hud-label" style={{color: s.color}}>{s.label}</div>
        {s.caption && <div className="hud-caption">{s.caption}</div>}
      </div>
      {showTranscript && txt && (
        <div className={`hud-transcript ${state==="listening" ? "live" : ""}`}>
          <span className="hud-transcript-text">{txt}</span>
        </div>
      )}
      <div className="hud-actions">
        {state === "awaiting" ? (
          <>
            <button className="btn btn-sm">Editar</button>
            <button className="btn btn-sm btn-primary">Enviar</button>
          </>
        ) : (
          <>
            <span className="kbd">␣</span>
            <button className="btn btn-icon btn-ghost" title="Configuraci\u00f3n">{Ic.dots}</button>
          </>
        )}
      </div>
    </div>
  );
}

const HUD_CSS = `
.hud {
  display: flex; align-items: center; gap: 14px;
  height: 64px; padding: 0 14px 0 12px;
  border-radius: 999px;
  border: 1px solid var(--line);
  box-shadow: var(--shadow-hud);
  min-width: 520px; max-width: 720px;
  font-family: var(--font-sans);
}
.hud-compact { height: 52px; min-width: 360px; gap: 10px; }
.hud-orb {
  width: 44px; height: 44px; flex: none;
  display: grid; place-items: center;
  border-radius: 999px;
  background: radial-gradient(circle at 50% 50%, color-mix(in oklab, var(--orb-glow) 22%, transparent) 0%, transparent 70%);
}
.hud-compact .hud-orb { width: 36px; height: 36px; }
.hud-orb-core {
  width: 32px; height: 32px; border-radius: 999px;
  background: var(--orb-color);
  display: grid; place-items: center;
  position: relative;
  box-shadow: 0 0 0 0 var(--orb-color);
}
.hud-compact .hud-orb-core { width: 26px; height: 26px; }
.hud-state-idle {
  background: transparent;
  border: 1.5px solid var(--ink-4);
  animation: hud-breathe 3.5s ease-in-out infinite;
}
.hud-state-listening { animation: hud-pulse 1.4s ease-in-out infinite; }
.hud-state-thinking  { animation: hud-pulse 2.2s ease-in-out infinite; }
.hud-state-tool      { animation: hud-pulse 1.6s ease-in-out infinite; }
.hud-state-speaking  { animation: hud-pulse 1.2s ease-in-out infinite; }
.hud-state-awaiting  { animation: hud-blink 1s ease-in-out infinite; }
@keyframes hud-pulse {
  0%,100% { box-shadow: 0 0 0 0 color-mix(in oklab, var(--orb-color) 70%, transparent); }
  50%     { box-shadow: 0 0 0 10px color-mix(in oklab, var(--orb-color) 0%, transparent); }
}
@keyframes hud-breathe {
  0%,100% { opacity: .55; transform: scale(1); }
  50%     { opacity: 1;   transform: scale(1.04); }
}
@keyframes hud-blink {
  0%,100% { box-shadow: 0 0 0 0 color-mix(in oklab, var(--orb-color) 80%, transparent); }
  50%     { box-shadow: 0 0 0 8px color-mix(in oklab, var(--orb-color) 0%, transparent); }
}
.hud-bars { display: flex; align-items: center; gap: 2.5px; }
.hud-bars span {
  width: 2.5px; height: 10px; background: white; border-radius: 2px;
  animation: hud-wave 0.9s ease-in-out infinite;
}
@keyframes hud-wave {
  0%, 100% { height: 6px; }
  50%      { height: 18px; }
}
.hud-spin {
  width: 14px; height: 14px; border-radius: 999px;
  border: 2px solid rgba(255,255,255,0.35);
  border-top-color: white;
  animation: hud-rot 0.8s linear infinite;
}
@keyframes hud-rot { to { transform: rotate(360deg); } }
.hud-mic { color: var(--ink-3); display: inline-flex; }
.hud-mic .ico { width: 16px; height: 16px; }
.hud-body { display: flex; flex-direction: column; gap: 1px; min-width: 110px; }
.hud-label { font-size: 13px; font-weight: 600; letter-spacing: -0.01em; }
.hud-caption { font-size: 11.5px; color: var(--ink-3); line-height: 1.3; }
.hud-transcript {
  flex: 1; min-width: 0;
  font-size: 12.5px; color: var(--ink-2);
  padding: 6px 10px;
  background: var(--bg-sunken);
  border-radius: 12px;
  white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
}
.hud-transcript.live .hud-transcript-text {
  background: linear-gradient(90deg, var(--ink) 0%, var(--ink) 50%, var(--ink-4) 100%);
  background-size: 200% 100%;
  -webkit-background-clip: text; background-clip: text;
  -webkit-text-fill-color: transparent;
  animation: hud-stream 2.5s linear infinite;
}
@keyframes hud-stream { from { background-position: 100% 0; } to { background-position: 0% 0; } }
.hud-actions { display: flex; align-items: center; gap: 6px; flex: none; }
`;

if (!document.getElementById("hud-css")) {
  const el = document.createElement("style"); el.id = "hud-css"; el.textContent = HUD_CSS;
  document.head.appendChild(el);
}

Object.assign(window, { VoiceHUD, HUDOrb, HUD_STATES });
