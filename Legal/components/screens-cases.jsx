/* Casos screen + Cliente screen */

function CasosScreen() {
  return (
    <div className="lex-app">
      <Sidebar active="casos" />
      <main className="lex-main">
        <TopBar
          breadcrumb="Casos"
          title="Todos los casos"
          subtitle="23 activos \u00b7 2 vencen esta semana \u00b7 1 audiencia el mi\u00e9rcoles"
          actions={<>
            <button className="btn"><span style={{display:"inline-flex"}}>{Ic.filter}</span> Filtros</button>
            <button className="btn"><span style={{display:"inline-flex"}}>{Ic.mic}</span> "Casos laborales con audiencia este mes"</button>
            <button className="btn btn-primary"><span style={{display:"inline-flex"}}>{Ic.plus}</span> Nuevo caso</button>
          </>}
        />
        <div style={{padding:"12px var(--pad-screen) 0", display:"flex", alignItems:"center", gap:8, borderBottom:"1px solid var(--line)"}}>
          {["Todos (23)","Laborales (9)","Civiles (8)","Mercantiles (4)","Amparos (2)","Borradores (3)"].map((t,i) => (
            <button key={i} className={`tabbtn ${i===0?"active":""}`}>{t}</button>
          ))}
          <span style={{flex:1}}/>
          <span className="muted" style={{fontSize:12}}>Ordenar:</span>
          <button className="btn btn-sm">Pr\u00f3xima fecha {Ic.arrow}</button>
        </div>
        <div className="lex-content scroll-y">
          <CasesTable rows={CASES} />
        </div>
        <div className="lex-hud-mount"><VoiceHUD state="idle" compact /></div>
      </main>
      <style>{`
        .tabbtn { background: transparent; border: 0; padding: 10px 12px; font: inherit; font-size: 13px; font-weight: 500; color: var(--ink-3); cursor: pointer; border-bottom: 2px solid transparent; margin-bottom: -1px; }
        .tabbtn.active { color: var(--ink); border-bottom-color: var(--accent); }
        .tabbtn:hover { color: var(--ink); }
      `}</style>
    </div>
  );
}

function CasoDetalleScreen() {
  const c = CASES[0];
  return (
    <div className="lex-app">
      <Sidebar active="casos" />
      <main className="lex-main">
        <TopBar
          breadcrumb={<>Casos <span style={{margin:"0 6px"}}>/</span> Laborales <span style={{margin:"0 6px"}}>/</span> {c.expediente}</>}
          title={c.titulo}
          subtitle={<>{c.tribunal} \u00b7 Exp. {c.expediente} \u00b7 <span className="chip chip-amber" style={{marginLeft:4}}>Laboral</span> <span className="chip" style={{marginLeft:4}}>{c.etapa}</span></>}
          actions={<>
            <button className="btn">{Ic.upload} Subir</button>
            <button className="btn">{Ic.bookmark} Guardar</button>
            <button className="btn btn-primary">{Ic.bolt} Trabajar en Canvas</button>
          </>}
        />
        <div style={{padding:"10px var(--pad-screen) 0", display:"flex", alignItems:"center", gap:0, borderBottom:"1px solid var(--line)"}}>
          {["Resumen","Cronolog\u00eda","Documentos (14)","Partes","Notas","Calendario"].map((t,i) => (
            <button key={i} className={`tabbtn ${i===0?"active":""}`}>{t}</button>
          ))}
        </div>
        <div className="lex-content scroll-y">
          <div style={{display:"grid", gridTemplateColumns:"1.4fr 1fr", gap:20}}>
            <div style={{display:"flex", flexDirection:"column", gap:16}}>
              <section className="surface" style={{padding:"var(--pad-card)"}}>
                <div style={{display:"flex", alignItems:"center", gap:8}}>
                  <span className="chip chip-purple"><span style={{display:"inline-flex"}}>{Ic.sparkle}</span>Resumen IA</span>
                  <span className="muted" style={{fontSize:11.5}}>Generado hace 2h \u00b7 Sonnet 4.6 \u00b7 faithfulness 0.94</span>
                </div>
                <p className="serif" style={{fontSize:16, lineHeight:1.6, margin:"12px 0 0", letterSpacing:"-0.005em"}}>
                  La trabajadora <b>Mar\u00eda Rodr\u00edguez Vel\u00e1zquez</b> labor\u00f3 7 a\u00f1os y 2 meses como ejecutiva comercial en Tel\u00e9fonos de M\u00e9xico SAB de CV con \u00faltimo salario de <b>$28,400 MXN mensuales</b>. El 14 de marzo de 2026 fue despedida invocando tres faltas injustificadas que la actora niega y el patr\u00f3n no acredita documentalmente. Procede demanda por <b>despido injustificado</b> con reclamo de indemnizaci\u00f3n constitucional, prima de antig\u00fcedad y salarios ca\u00eddos.
                </p>
                <div style={{display:"flex", gap:14, marginTop:16, paddingTop:14, borderTop:"1px solid var(--line)"}}>
                  <Stat label="Cuant\u00eda estimada" big="$432,180" sub="indemn. + prima + ca\u00eddos"/>
                  <Stat label="Probabilidad" big="Favorable" sub="carga prueba en patr\u00f3n" tone="ok"/>
                  <Stat label="Plazo cr\u00edtico" big="3 d\u00edas" sub="audiencia preliminar"/>
                </div>
                <div className="cite-disclaimer">
                  <span style={{display:"inline-flex"}}>{Ic.shield}</span>
                  <span>Resumen generado con IA. No constituye representaci\u00f3n legal. Validado por Lic. Ana \u00c1lvarez (c\u00e9d. 12345678).</span>
                </div>
              </section>

              <section className="surface" style={{padding:"var(--pad-card)"}}>
                <div className="section-head"><h3 className="section-title serif">Cronolog\u00eda</h3><span className="muted" style={{fontSize:12}}>11 eventos</span></div>
                <ol className="timeline">
                  {[
                    {d:"hoy", t:"09:14", h:"LexAI gener\u00f3 borrador de demanda v3", k:"sparkle"},
                    {d:"hoy", t:"08:42", h:"C\u00e1lculo de prestaciones actualizado: $432,180", k:"calc"},
                    {d:"ayer", t:"17:30", h:"Cliente envi\u00f3 contratos individuales 2019\u20132026", k:"upload"},
                    {d:"22 may", t:"11:12", h:"Audiencia preliminar agendada \u00b7 27 may 10:00", k:"cal"},
                    {d:"18 may", t:"\u2014", h:"Caso creado por Lic. Ana \u00c1lvarez", k:"plus"},
                  ].map((e,i)=>(
                    <li key={i}>
                      <span className="tl-dot"/>
                      <span className="tl-date muted">{e.d} \u00b7 {e.t}</span>
                      <span className="tl-h">{e.h}</span>
                    </li>
                  ))}
                </ol>
              </section>
            </div>

            <div style={{display:"flex", flexDirection:"column", gap:16}}>
              <section className="surface ai-suggest" style={{padding:"var(--pad-card)"}}>
                <div style={{display:"flex", alignItems:"center", gap:8, marginBottom:10}}>
                  <span className="chip chip-purple"><span style={{display:"inline-flex"}}>{Ic.sparkle}</span>AI Suggestions</span>
                  <span className="muted" style={{fontSize:11.5, marginLeft:"auto"}}>3</span>
                </div>
                {[
                  {t:"Redactar contestaci\u00f3n a excepciones", s:"Telmex pedir\u00e1 prescripci\u00f3n del art. 517 LFT"},
                  {t:"Calcular PTU adicional", s:"7 ejercicios fiscales no reclamados"},
                  {t:"Buscar precedente: cl\u00e1usula de movilidad", s:"Tesis 2a./J. 14/2024 podr\u00eda aplicar"},
                ].map((s,i)=>(
                  <button key={i} className="suggest-row">
                    <span className="suggest-ic">{Ic.bolt}</span>
                    <span style={{minWidth:0, textAlign:"left"}}>
                      <div style={{fontSize:13, fontWeight:600}}>{s.t}</div>
                      <div className="muted" style={{fontSize:11.5}}>{s.s}</div>
                    </span>
                    <span style={{display:"inline-flex", color:"var(--ink-3)"}}>{Ic.arrow}</span>
                  </button>
                ))}
              </section>

              <section className="surface" style={{padding:"var(--pad-card)"}}>
                <div className="section-head"><h3 className="section-title serif">Partes</h3></div>
                <div style={{display:"flex", flexDirection:"column", gap:10, marginTop:10}}>
                  <PartyRow rol="Actora" nombre="Mar\u00eda Rodr\u00edguez Vel\u00e1zquez" sub="RFC RIVM850712 \u00b7 cliente"/>
                  <PartyRow rol="Demandada" nombre="Tel\u00e9fonos de M\u00e9xico SAB de CV" sub="RFC TME840315 \u00b7 contraparte"/>
                  <PartyRow rol="Tribunal" nombre="Juzgado 12 Laboral CDMX" sub="Mtro. Hern\u00e1n Ortega"/>
                </div>
              </section>

              <section className="surface" style={{padding:"var(--pad-card)"}}>
                <div className="section-head"><h3 className="section-title serif">Pr\u00f3ximos plazos</h3></div>
                <div style={{display:"flex", flexDirection:"column", gap:10, marginTop:10}}>
                  <DeadlineRow d="27 mayo" t="10:00" h="Audiencia preliminar" tone="danger" sub="en 3 d\u00edas"/>
                  <DeadlineRow d="3 jun" t="\u2014" h="Ofrecimiento de pruebas" tone="warn" sub="en 10 d\u00edas"/>
                  <DeadlineRow d="17 jun" t="\u2014" h="Audiencia de juicio" tone="ink" sub="en 24 d\u00edas"/>
                </div>
              </section>
            </div>
          </div>
        </div>
        <div className="lex-hud-mount"><VoiceHUD state="idle" compact /></div>
      </main>
      <style>{`
        .timeline { list-style: none; padding: 0; margin: 12px 0 0; display: flex; flex-direction: column; gap: 12px; position: relative; }
        .timeline::before { content: ""; position: absolute; left: 5px; top: 4px; bottom: 4px; width: 1px; background: var(--line); }
        .timeline li { position: relative; padding-left: 22px; display: grid; grid-template-columns: 100px 1fr; gap: 10px; align-items: baseline; font-size: 13px; }
        .tl-dot { position: absolute; left: 0; top: 6px; width: 11px; height: 11px; border-radius: 999px; background: var(--bg-elev); border: 2px solid var(--accent); }
        .tl-date { font-size: 11.5px; }
        .ai-suggest { background: linear-gradient(180deg, var(--purple-soft), var(--bg-elev) 60%); }
        .suggest-row { width: 100%; display: flex; align-items: center; gap: 10px; padding: 10px; border-radius: 10px; border: 1px solid var(--line); background: var(--bg-elev); cursor: pointer; margin-bottom: 8px; font-family: inherit; color: var(--ink); }
        .suggest-row:hover { background: var(--bg-sunken); }
        .suggest-ic { width: 28px; height: 28px; border-radius: 8px; background: var(--purple-soft); color: var(--purple); display: grid; place-items: center; flex: none; }
        .cite-disclaimer { display: flex; align-items: flex-start; gap: 8px; padding: 10px 12px; margin-top: 14px; border-radius: 8px; background: var(--bg-sunken); font-size: 11.5px; color: var(--ink-3); line-height: 1.5; }
      `}</style>
    </div>
  );
}

function PartyRow({rol, nombre, sub}) {
  return (
    <div style={{display:"flex", alignItems:"center", gap:10}}>
      <div className="muted" style={{fontSize:10.5, textTransform:"uppercase", letterSpacing:"0.06em", fontWeight:600, width:78}}>{rol}</div>
      <div style={{minWidth:0, flex:1}}>
        <div style={{fontSize:13, fontWeight:600}}>{nombre}</div>
        <div className="muted" style={{fontSize:11.5}}>{sub}</div>
      </div>
    </div>
  );
}

function DeadlineRow({d, t, h, sub, tone}) {
  const colors = {danger:"var(--danger)", warn:"var(--warn)", ink:"var(--ink-3)"};
  return (
    <div style={{display:"flex", alignItems:"center", gap:12, padding:"8px 0", borderBottom:"1px solid var(--line)"}}>
      <div style={{width:60, textAlign:"center"}}>
        <div className="serif tabular" style={{fontSize:14, fontWeight:600, color:colors[tone]}}>{d}</div>
        <div className="muted" style={{fontSize:10.5}}>{t}</div>
      </div>
      <div className="vdivider" style={{minHeight:24}}/>
      <div style={{flex:1, minWidth:0}}>
        <div style={{fontSize:13, fontWeight:500}}>{h}</div>
        <div className="muted" style={{fontSize:11.5}}>{sub}</div>
      </div>
    </div>
  );
}

function ClienteScreen() {
  return (
    <div className="lex-app">
      <Sidebar active="clientes" />
      <main className="lex-main">
        <TopBar
          breadcrumb={<>Clientes / Activos</>}
          title="Mar\u00eda Rodr\u00edguez Vel\u00e1zquez"
          subtitle={<>RFC RIVM850712H02 \u00b7 cliente desde mar 2024 \u00b7 <span className="chip chip-green" style={{marginLeft:4}}>2 casos activos</span></>}
          actions={<>
            <button className="btn">{Ic.msg} Mensaje</button>
            <button className="btn">{Ic.cal} Agendar</button>
            <button className="btn btn-primary">{Ic.plus} Nuevo caso</button>
          </>}
        />
        <div className="lex-content scroll-y">
          <div style={{display:"grid", gridTemplateColumns:"320px 1fr", gap:20}}>
            <aside>
              <section className="surface" style={{padding:"var(--pad-card)", textAlign:"center"}}>
                <div style={{width:80, height:80, borderRadius:999, background:"linear-gradient(135deg, var(--accent), var(--purple))", color:"white", fontSize:24, fontWeight:600, display:"grid", placeItems:"center", margin:"0 auto 14px"}}>MR</div>
                <h3 className="serif" style={{fontSize:18, margin:0, letterSpacing:"-0.01em"}}>Mar\u00eda Rodr\u00edguez Vel\u00e1zquez</h3>
                <div className="muted" style={{fontSize:12, marginTop:2}}>Persona f\u00edsica \u00b7 41 a\u00f1os</div>
                <div style={{display:"flex", gap:8, marginTop:14, justifyContent:"center"}}>
                  <span className="chip chip-blue">VIP</span>
                  <span className="chip"><span className="dot" style={{background:"var(--ok)"}}/>Al corriente</span>
                </div>
              </section>
              <section className="surface" style={{padding:"var(--pad-card)", marginTop:12}}>
                <h4 className="serif" style={{fontSize:14, fontWeight:600, margin:"0 0 10px"}}>Datos</h4>
                <DataRow l="Email" v="maria.rodriguez@gmail.com"/>
                <DataRow l="Tel\u00e9fono" v="+52 55 4123 5567"/>
                <DataRow l="Domicilio" v="Av. Reforma 1234, CDMX"/>
                <DataRow l="CURP" v="RIVM850712MDFRZR03"/>
                <DataRow l="Ocupaci\u00f3n" v="Ejecutiva comercial"/>
              </section>
              <section className="surface" style={{padding:"var(--pad-card)", marginTop:12, background:"var(--bg-sunken)"}}>
                <div style={{display:"flex", alignItems:"center", gap:8, marginBottom:8}}>
                  <span style={{display:"inline-flex", color:"var(--ok)"}}>{Ic.shield}</span>
                  <h4 className="serif" style={{fontSize:14, fontWeight:600, margin:0}}>LFPDPPP</h4>
                </div>
                <div className="muted" style={{fontSize:11.5, lineHeight:1.5}}>
                  \u00daltimo consentimiento: <b style={{color:"var(--ink)"}}>14 mar 2026</b>. Finalidades: representaci\u00f3n legal, contacto. Voice grabaci\u00f3n: <b style={{color:"var(--ok)"}}>autorizada</b>. Derechos ARCO disponibles.
                </div>
              </section>
            </aside>

            <div style={{display:"flex", flexDirection:"column", gap:16}}>
              <section className="surface" style={{padding:"var(--pad-card)"}}>
                <div className="section-head"><h3 className="section-title serif">Casos activos (2)</h3></div>
                <div style={{marginTop:12}}>
                  <CasesTable rows={[CASES[0], {...CASES[3], cliente:"Mar\u00eda Rodr\u00edguez Vel\u00e1zquez", titulo:"Rodr\u00edguez vs. Banco Santander (cuenta congelada)"}]} />
                </div>
              </section>
              <section className="surface" style={{padding:"var(--pad-card)"}}>
                <div className="section-head"><h3 className="section-title serif">Comunicaciones recientes</h3></div>
                <div style={{display:"flex", flexDirection:"column", gap:0, marginTop:12}}>
                  <CommRow type="voice" d="hoy 09:14" h="Llamada con LexAI \u00b7 grabada con consentimiento" sub="\u201cQuiero saber c\u00f3mo va mi caso de Telmex\u201d \u00b7 4:23 min" />
                  <CommRow type="email" d="ayer 17:30" h="Env\u00edo de contratos individuales 2019\u20132026" sub="7 PDFs \u00b7 procesados por LexAI" />
                  <CommRow type="msg" d="22 may" h="Confirmaci\u00f3n audiencia preliminar 27 may" sub="Lic. \u00c1lvarez \u00b7 v\u00eda WhatsApp" />
                </div>
              </section>
            </div>
          </div>
        </div>
        <div className="lex-hud-mount"><VoiceHUD state="idle" compact /></div>
      </main>
    </div>
  );
}

function DataRow({l, v}) {
  return (
    <div style={{display:"flex", justifyContent:"space-between", padding:"6px 0", borderBottom:"1px dashed var(--line)", fontSize:12.5}}>
      <span className="muted">{l}</span><span style={{fontWeight:500, textAlign:"right"}}>{v}</span>
    </div>
  );
}

function CommRow({type,d,h,sub}) {
  const ic = type==="voice"?Ic.mic:type==="email"?Ic.send:Ic.msg;
  return (
    <div style={{display:"flex", gap:12, padding:"10px 0", borderBottom:"1px solid var(--line)"}}>
      <span style={{width:30, height:30, borderRadius:8, background:"var(--bg-sunken)", color:"var(--ink-2)", display:"grid", placeItems:"center", flex:"none"}}>{ic}</span>
      <div style={{flex:1, minWidth:0}}>
        <div style={{fontSize:13, fontWeight:500}}>{h}</div>
        <div className="muted" style={{fontSize:11.5, marginTop:2}}>{sub}</div>
      </div>
      <div className="muted" style={{fontSize:11.5}}>{d}</div>
    </div>
  );
}

Object.assign(window, { CasosScreen, CasoDetalleScreen, ClienteScreen });
