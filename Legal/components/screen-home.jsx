/* Home (Dashboard diario) + Casos (lista densa) + Cliente (ficha 360) */

function HomeScreen() {
  return (
    <div className="lex-app">
      <Sidebar active="home" />
      <main className="lex-main">
        <TopBar
          breadcrumb="Lunes 25 mayo \u00b7 09:14"
          title={<>Buenos d\u00edas, <span style={{color:"var(--accent)"}}>Lic. \u00c1lvarez</span></>}
          subtitle="Tienes 1 audiencia esta semana, 2 promociones por entregar y 3 actualizaciones del DOF relevantes."
          actions={<>
            <button className="btn"><span style={{display:"inline-flex"}}>{Ic.upload}</span> Subir documento</button>
            <button className="btn btn-primary"><span style={{display:"inline-flex"}}>{Ic.bolt}</span> Nuevo dictado</button>
          </>}
        />
        <div className="lex-content scroll-y">
          <section className="home-greet surface" style={{padding:24, marginBottom:24, display:"flex", gap:20, alignItems:"flex-start"}}>
            <div style={{flex:1}}>
              <div className="muted" style={{fontSize:11.5, textTransform:"uppercase", letterSpacing:"0.06em", fontWeight:600}}>LexAI te dijo al iniciar sesi\u00f3n</div>
              <p className="serif" style={{fontSize:21, lineHeight:1.4, margin:"8px 0 0", maxWidth:680, fontWeight:400, letterSpacing:"-0.01em"}}>
                "Buenos d\u00edas Lic. Tienes audiencia el mi\u00e9rcoles 10am en <em style={{fontStyle:"italic"}}>Rodr\u00edguez vs. Telmex</em>. Falta entregar la contestaci\u00f3n de <em>Constructora del Valle</em> el viernes. \u00bfPreparamos los alegatos primero?"
              </p>
              <div style={{display:"flex", gap:8, marginTop:14}}>
                <button className="btn btn-sm btn-primary">S\u00ed, preparar alegatos</button>
                <button className="btn btn-sm">Ver agenda completa</button>
                <button className="btn btn-sm btn-ghost">Silenciar saludo</button>
              </div>
            </div>
            <div style={{textAlign:"right", flex:"none"}}>
              <span className="chip chip-green"><span className="dot"/>Voice listo · 840ms</span>
              <div className="muted" style={{fontSize:11, marginTop:6}}>cascada Sonnet+Sonic-3</div>
            </div>
          </section>

          <div style={{display:"grid", gridTemplateColumns:"repeat(3, 1fr)", gap:16, marginBottom:24}}>
            <UrgentCard kind="audiencia" cas={CASES[0]} />
            <UrgentCard kind="vencimiento" cas={CASES[1]} />
            <UrgentCard kind="dof" />
          </div>

          <div style={{display:"grid", gridTemplateColumns:"1.4fr 1fr", gap:16}}>
            <section className="surface" style={{padding:"var(--pad-card)"}}>
              <div className="section-head">
                <h3 className="section-title serif">Acciones r\u00e1pidas</h3>
                <span className="muted" style={{fontSize:12}}>5 plantillas core</span>
              </div>
              <div style={{display:"grid", gridTemplateColumns:"repeat(2, 1fr)", gap:8, marginTop:14}}>
                {[
                  {ic:Ic.scales, t:"Demanda laboral", s:"despido injustificado / liquidaci\u00f3n"},
                  {ic:Ic.doc,    t:"Contestaci\u00f3n",  s:"civil / mercantil"},
                  {ic:Ic.send,   t:"Carta requerimiento", s:"cobranza / desocupaci\u00f3n"},
                  {ic:Ic.shield, t:"Amparo indirecto", s:"contra acto de autoridad"},
                ].map((q,i) => (
                  <button key={i} className="quick-action">
                    <span className="qa-ic">{q.ic}</span>
                    <span><div style={{fontWeight:600, fontSize:13}}>{q.t}</div><div className="muted" style={{fontSize:11.5}}>{q.s}</div></span>
                    <span className="muted" style={{marginLeft:"auto", display:"inline-flex"}}>{Ic.arrow}</span>
                  </button>
                ))}
              </div>
            </section>

            <section className="surface" style={{padding:"var(--pad-card)"}}>
              <div className="section-head">
                <h3 className="section-title serif">Tu mes en LexAI</h3>
                <span className="chip chip-green"><span className="dot"/>+18%</span>
              </div>
              <div style={{display:"grid", gridTemplateColumns:"repeat(2,1fr)", gap:14, marginTop:14}}>
                <Stat label="Documentos verificados" big="47" sub="Meta 40 \u00b7 supera por 18%" tone="ok"/>
                <Stat label="Voice / semana" big="89" sub="cmds \u00b7 vs 75 meta" />
                <Stat label="Horas ahorradas" big="31h" sub="vs paralegal junior" />
                <Stat label="Citas SCJN" big="100%" sub="verificadas \u00b7 0 alucinadas" tone="ok" />
              </div>
            </section>
          </div>

          <section style={{marginTop:24}}>
            <div className="section-head">
              <h3 className="section-title serif">Casos activos</h3>
              <a className="link-arrow">Ver todos los 23 casos {Ic.arrow}</a>
            </div>
            <CasesTable rows={CASES.slice(0,5)} />
          </section>
        </div>
        <div className="lex-hud-mount"><VoiceHUD state="idle" /></div>
      </main>
    </div>
  );
}

function UrgentCard({kind, cas}) {
  if (kind === "dof") return (
    <article className="urgent-card surface" style={{padding:"var(--pad-card)"}}>
      <div style={{display:"flex", alignItems:"center", gap:8}}>
        <span className="chip chip-purple">DOF \u00b7 hoy</span>
        <span className="muted" style={{fontSize:11.5, marginLeft:"auto"}}>3 nuevas</span>
      </div>
      <h4 className="serif" style={{fontSize:18, margin:"10px 0 4px", letterSpacing:"-0.01em", lineHeight:1.25}}>
        Reforma a la LFT (art. 162 bis)
      </h4>
      <p className="muted" style={{fontSize:12.5, margin:0, lineHeight:1.5}}>
        Nuevo c\u00e1lculo de prima de antig\u00fcedad para trabajadores con &gt;15 a\u00f1os. Aplica a 4 de tus casos activos.
      </p>
      <div style={{display:"flex", gap:6, marginTop:14}}>
        <button className="btn btn-sm btn-primary">Resumen IA</button>
        <button className="btn btn-sm">Ver afectados</button>
      </div>
    </article>
  );
  const tone = kind==="audiencia" ? "danger" : "warn";
  return (
    <article className={`urgent-card surface tone-${tone}`} style={{padding:"var(--pad-card)"}}>
      <div style={{display:"flex", alignItems:"center", gap:8}}>
        <span className={`chip ${kind==="audiencia"?"chip-red":"chip-amber"}`}><span className="dot"/>en {cas.diasRestantes} d\u00edas</span>
        <span className="muted" style={{fontSize:11.5, marginLeft:"auto"}}>{cas.proxima}</span>
      </div>
      <h4 className="serif" style={{fontSize:18, margin:"10px 0 4px", letterSpacing:"-0.01em", lineHeight:1.25}}>{cas.titulo}</h4>
      <p className="muted" style={{fontSize:12.5, margin:0, lineHeight:1.5}}>{cas.proximaTipo} \u00b7 {cas.tribunal} \u00b7 Exp. {cas.expediente}</p>
      <div style={{display:"flex", gap:6, marginTop:14}}>
        <button className="btn btn-sm btn-primary">{kind==="audiencia"?"Preparar alegatos":"Redactar contestaci\u00f3n"}</button>
        <button className="btn btn-sm">Abrir caso</button>
      </div>
    </article>
  );
}

function Stat({label, big, sub, tone}) {
  return (
    <div>
      <div className="muted" style={{fontSize:11, fontWeight:500}}>{label}</div>
      <div className="serif tabular" style={{fontSize:28, fontWeight:600, letterSpacing:"-0.02em", marginTop:2, color: tone==="ok" ? "var(--ok)" : "var(--ink)"}}>{big}</div>
      <div className="muted" style={{fontSize:11.5, marginTop:2}}>{sub}</div>
    </div>
  );
}

function CasesTable({rows, dense}) {
  return (
    <div className="surface" style={{overflow:"hidden"}}>
      <table className="cases-table">
        <thead>
          <tr>
            <th style={{width:"36%"}}>Caso</th>
            <th>Materia</th>
            <th>Etapa</th>
            <th>Pr\u00f3xima fecha</th>
            <th>Owner</th>
            <th style={{textAlign:"right"}}>Pendientes</th>
          </tr>
        </thead>
        <tbody>
          {rows.map(c => (
            <tr key={c.id} className={c.prioridad==="alta"?"row-prio":""}>
              <td>
                <div style={{display:"flex", alignItems:"center", gap:10}}>
                  <span className={`prio prio-${c.prioridad}`} title={c.prioridad}/>
                  <div style={{minWidth:0}}>
                    <div style={{fontWeight:600, fontSize:13.5, letterSpacing:"-0.01em"}}>{c.titulo}</div>
                    <div className="muted" style={{fontSize:11.5}}>{c.tribunal} \u00b7 Exp. {c.expediente}</div>
                  </div>
                </div>
              </td>
              <td><span className={`chip ${
                c.materia==="Laboral"?"chip-amber":
                c.materia==="Civil"?"chip-blue":
                c.materia==="Mercantil"?"chip-purple":
                c.materia==="Amparo"?"chip-red":""
              }`}>{c.materia}</span></td>
              <td><span className="muted" style={{fontSize:12.5}}>{c.etapa}</span></td>
              <td>
                <div style={{fontSize:12.5}}>{c.proxima}</div>
                <div className="muted" style={{fontSize:11}}>{c.proximaTipo}</div>
              </td>
              <td><span className="muted" style={{fontSize:12.5}}>{c.owner.replace("Lic. ","")}</span></td>
              <td style={{textAlign:"right"}}>
                {c.pendientes>0 ? <span className="chip chip-amber">{c.pendientes}</span> : <span className="muted">\u2014</span>}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

const HOME_CSS = `
.section-head { display: flex; align-items: center; justify-content: space-between; }
.section-title { font-size: 16px; margin: 0; font-weight: 600; letter-spacing: -0.01em; }
.link-arrow { display: inline-flex; align-items: center; gap: 4px; font-size: 12.5px; color: var(--accent); cursor: pointer; }
.urgent-card.tone-danger { border-top: 2px solid var(--danger); }
.urgent-card.tone-warn { border-top: 2px solid var(--warn); }
.quick-action {
  display: inline-flex; align-items: center; gap: 12px;
  padding: 10px 12px; border-radius: 10px;
  border: 1px solid var(--line); background: var(--bg);
  cursor: pointer; text-align: left; font-family: inherit; color: var(--ink);
}
.quick-action:hover { background: var(--bg-sunken); }
.qa-ic { width: 30px; height: 30px; border-radius: 8px; background: var(--accent-soft); color: var(--accent-ink); display: grid; place-items: center; }

.cases-table { width: 100%; border-collapse: collapse; }
.cases-table th { text-align: left; font-size: 11px; text-transform: uppercase; letter-spacing: 0.05em; color: var(--ink-3); font-weight: 600; padding: 10px 14px; border-bottom: 1px solid var(--line); background: var(--bg-sunken); }
.cases-table td { padding: 10px 14px; border-bottom: 1px solid var(--line); font-size: 13px; vertical-align: middle; }
.cases-table tr:last-child td { border-bottom: 0; }
.cases-table tr:hover td { background: var(--bg-sunken); }
[data-density="compacta"] .cases-table td { padding: 6px 12px; font-size: 12.5px; }
[data-density="compacta"] .cases-table th { padding: 8px 12px; }
.prio { width: 6px; height: 6px; border-radius: 999px; flex: none; }
.prio-alta { background: var(--danger); }
.prio-media { background: var(--warn); }
.prio-baja { background: var(--ink-4); }
`;
if (!document.getElementById("home-css")) { const el = document.createElement("style"); el.id="home-css"; el.textContent=HOME_CSS; document.head.appendChild(el); }

Object.assign(window, { HomeScreen, CasesTable, UrgentCard, Stat });
