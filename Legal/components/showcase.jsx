/* HUD States showcase + Tweaks panel for LexAI */

function HUDStatesShowcase() {
  const states = ["idle", "listening", "thinking", "tool", "speaking", "awaiting"];
  const [auto, setAuto] = React.useState(true);
  const [idx, setIdx] = React.useState(0);
  React.useEffect(() => {
    if (!auto) return;
    const t = setInterval(() => setIdx(i => (i+1) % states.length), 2400);
    return () => clearInterval(t);
  }, [auto]);
  return (
    <div style={{padding:32, display:"flex", flexDirection:"column", gap:24, height:"100%", background:"var(--bg)"}}>
      <div style={{display:"flex", alignItems:"center", gap:14}}>
        <Logo size={18}/>
        <div style={{flex:1}}>
          <h2 className="serif" style={{fontSize:22, letterSpacing:"-0.01em", margin:0}}>Voice HUD \u00b7 6 estados</h2>
          <div className="muted" style={{fontSize:12.5, marginTop:2}}>Bottom-center, glassmorphism, siempre visible. Wake word 'Hola LexAI' \u00b7 push-to-talk \u2423.</div>
        </div>
        <button className="btn btn-sm" onClick={()=>setAuto(!auto)}>{auto?Ic.pause:Ic.play} {auto?"Pausar":"Reproducir"}</button>
      </div>
      <div style={{flex:1, display:"grid", placeItems:"center", background:"var(--bg-sunken)", borderRadius:"var(--r-lg)", border:"1px solid var(--line)"}}>
        <VoiceHUD state={states[idx]}/>
      </div>
      <div style={{display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:10}}>
        {states.map((s,i)=>(
          <button key={s} className={`hud-state-card ${i===idx?"active":""}`} onClick={()=>{setAuto(false); setIdx(i);}}>
            <HUDOrb state={s}/>
            <div style={{textAlign:"left"}}>
              <div style={{fontSize:13, fontWeight:600, textTransform:"capitalize"}}>{s}</div>
              <div className="muted" style={{fontSize:11}}>{HUD_STATES[s].label}</div>
            </div>
          </button>
        ))}
      </div>
      <style>{`
        .hud-state-card { display:flex; align-items:center; gap:12px; padding:10px 12px; background:var(--bg-elev); border:1px solid var(--line); border-radius:10px; cursor:pointer; font-family:inherit; color:var(--ink); }
        .hud-state-card.active { border-color: var(--accent); box-shadow: 0 0 0 3px var(--accent-soft); }
      `}</style>
    </div>
  );
}

function LexTweaksPanel({tweaks, setTweak}) {
  return (
    <TweaksPanel title="Tweaks">
      <TweakSection title="Apariencia">
        <TweakRadio label="Modo" value={tweaks.mode} options={[{value:"light", label:"Claro"},{value:"dark", label:"Oscuro"}]} onChange={v=>setTweak("mode",v)}/>
        <TweakRadio label="Densidad" value={tweaks.density} options={[{value:"comoda", label:"C\u00f3moda"},{value:"compacta", label:"Compacta"}]} onChange={v=>setTweak("density",v)}/>
        <TweakSelect label="Direcci\u00f3n visual" value={tweaks.direction} options={[
          {value:"sobria", label:"Sobria \u00b7 Apple-grade"},
          {value:"editorial", label:"Editorial \u00b7 literaria"},
          {value:"tech", label:"Tech \u00b7 moderna"}
        ]} onChange={v=>setTweak("direction",v)}/>
      </TweakSection>
      <TweakSection title="Idioma">
        <TweakRadio label="Locale" value={tweaks.locale} options={[{value:"es-MX", label:"es-MX"},{value:"es-ES", label:"es-ES"}]} onChange={v=>setTweak("locale",v)}/>
      </TweakSection>
      <TweakSection title="HITL">
        <TweakToggle label="Mostrar HITL gates" value={tweaks.showHitl} onChange={v=>setTweak("showHitl",v)}/>
      </TweakSection>
    </TweaksPanel>
  );
}

Object.assign(window, { HUDStatesShowcase, LexTweaksPanel });
