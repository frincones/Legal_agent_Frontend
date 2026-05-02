/* Live Canvas — la pantalla diferenciadora */

function LiveCanvasScreen() {
  const [playing, setPlaying] = React.useState(true);
  const [phase, setPhase] = React.useState(0); // 0=listening, 1=tools, 2=streaming, 3=done
  const [streamPos, setStreamPos] = React.useState(0);

  React.useEffect(() => {
    if (!playing) return;
    let raf;
    const tick = () => {
      setStreamPos(p => {
        const next = p + 1;
        if (next < 40) { setPhase(0); }
        else if (next < 80) { setPhase(1); }
        else if (next < 360) { setPhase(2); }
        else { setPhase(3); return 0; }
        return next;
      });
      raf = setTimeout(tick, 50);
    };
    raf = setTimeout(tick, 50);
    return () => clearTimeout(raf);
  }, [playing]);

  const hudState = phase===0 ? "listening" : phase===1 ? "tool" : phase===2 ? "speaking" : "idle";
  const visibleChars = Math.max(0, (streamPos - 80) * 12);

  return (
    <div className="lex-app">
      <Sidebar active="canvas" />
      <main className="lex-main">
        <TopBar
          breadcrumb={<>Casos / Rodr\u00edguez vs. Telmex / <span style={{color:"var(--accent)"}}>Live Canvas</span></>}
          title={<>Demanda laboral \u00b7 v3 <span className="chip chip-amber" style={{marginLeft:10, verticalAlign:"middle"}}>Borrador</span></>}
          subtitle="Construyendo en tiempo real \u00b7 4 herramientas en paralelo \u00b7 SCJN registry activo"
          actions={<>
            <button className={`btn btn-sm ${playing?"":"btn-primary"}`} onClick={()=>setPlaying(!playing)}>
              {playing ? <>{Ic.pause} Pausar demo</> : <>{Ic.play} Reanudar</>}
            </button>
            <button className="btn">{Ic.download} Export .docx</button>
            <button className="btn btn-primary">{Ic.send} Revisar y enviar</button>
          </>}
        />
        <div style={{flex:1, minHeight:0, display:"grid", gridTemplateColumns:"320px 1fr 300px", gap:0, borderTop:"1px solid var(--line)"}}>
          <aside className="canvas-rail">
            <div style={{padding:"14px 16px", borderBottom:"1px solid var(--line)"}}>
              <div className="muted" style={{fontSize:10.5, textTransform:"uppercase", letterSpacing:"0.06em", fontWeight:600}}>Transcripci\u00f3n</div>
              <div style={{fontSize:11, color:"var(--ink-3)", marginTop:2}}>Gemini 3.1 Flash Live \u00b7 STT</div>
            </div>
            <div className="scroll-y" style={{padding:14, fontSize:13, lineHeight:1.6}}>
              <div className="transcript-block muted">
                <div style={{fontSize:10.5, marginBottom:4}}>09:11:03 \u00b7 dictado</div>
                <span style={{color:"var(--ink-2)"}}>"Red\u00e1ctame demanda laboral por despido injustificado, mi cliente <b style={{color:"var(--ink)"}}>Mar\u00eda Rodr\u00edguez</b> trabajaba en <b style={{color:"var(--ink)"}}>Telmex</b> 7 a\u00f1os 2 meses, le inventaron 3 faltas, salario 28 mil 400. Incluye prima de antig\u00fcedad y salarios ca\u00eddos."</span>
              </div>
              {phase >= 1 && (
                <div className="transcript-block">
                  <div style={{fontSize:10.5, marginBottom:4, color:"var(--ok)"}}>09:11:09 \u00b7 LexAI</div>
                  <span className="serif">Claro, d\u00e9jame revisar el expediente. Voy a buscar jurisprudencia reciente sobre despidos injustificados, validar las citas contra el registry de la SCJN y calcular las prestaciones.</span>
                </div>
              )}
              {phase >= 2 && (
                <div className="transcript-block">
                  <div style={{fontSize:10.5, marginBottom:4, color:"var(--ok)"}}>09:11:14 \u00b7 LexAI</div>
                  <span className="serif">Listo. He preparado la demanda con 4 tesis SCJN verificadas y el c\u00e1lculo de prestaciones por <b>$432,180 MXN</b>. \u00bfQuieres que revisemos el petitorio juntos?</span>
                </div>
              )}
            </div>
          </aside>

          <section className="canvas-doc scroll-y">
            <div className="doc-paper">
              <div className="doc-header">
                <div className="muted" style={{fontSize:11, textTransform:"uppercase", letterSpacing:"0.08em"}}>JUZGADO 12 LABORAL CDMX \u00b7 EXP. 473/2026</div>
                <h1 className="serif doc-h1">DEMANDA LABORAL POR DESPIDO INJUSTIFICADO</h1>
                <div className="muted" style={{fontSize:12, marginTop:8}}>MAR\u00cdA RODR\u00cdGUEZ VEL\u00c1ZQUEZ <b>vs.</b> TEL\u00c9FONOS DE M\u00c9XICO SAB DE CV</div>
              </div>

              <p className="doc-p">
                <b>C. JUEZ DEL TRIBUNAL LABORAL EN TURNO,</b> presente:
              </p>
              <p className="doc-p">
                <b>MAR\u00cdA RODR\u00cdGUEZ VEL\u00c1ZQUEZ</b>, por mi propio derecho, se\u00f1alando como domicilio para o\u00edr y recibir notificaciones el ubicado en Av. Reforma 1234, Col. Ju\u00e1rez, CDMX, autorizando para tales efectos a la Lic. Ana \u00c1lvarez Mart\u00ednez (c\u00e9d. prof. 12345678), comparezco para promover juicio ordinario laboral en contra de <b>TEL\u00c9FONOS DE M\u00c9XICO SAB DE CV</b>, con domicilio conocido, demandando las prestaciones que a continuaci\u00f3n se precisan.
              </p>

              <h2 className="serif doc-h2">I. PRESTACIONES</h2>
              <ol className="doc-list">
                <li>El pago de la <b>indemnizaci\u00f3n constitucional</b> equivalente a tres meses de salario integrado, conforme al art\u00edculo 123, apartado A, fracci\u00f3n XXII de la CPEUM y 48 de la LFT.</li>
                <li>El pago de la <b>prima de antig\u00fcedad</b> a raz\u00f3n de doce d\u00edas por cada a\u00f1o de servicios, topada conforme al art\u00edculo 162 de la LFT.</li>
                <li>El pago de los <b>salarios ca\u00eddos</b> desde la fecha del despido hasta el cumplimiento del laudo, con tope de doce meses m\u00e1s intereses, en los t\u00e9rminos del art\u00edculo 48 reformado.</li>
                <li>Vacaciones, prima vacacional y aguinaldo proporcionales del ejercicio en curso.</li>
                <li>Reparto de utilidades de los \u00faltimos cinco ejercicios fiscales.</li>
              </ol>

              <h2 className="serif doc-h2">II. HECHOS</h2>
              <p className="doc-p">
                <b>1.</b> La suscrita ingres\u00f3 a prestar sus servicios personales subordinados en favor de la demandada el d\u00eda <b>15 de enero de 2019</b>, desempe\u00f1\u00e1ndose como Ejecutiva Comercial Senior con \u00faltimo salario tabular de <b>$28,400.00 MXN mensuales</b>.
              </p>
              <p className="doc-p">
                <b>2.</b> El d\u00eda <b>14 de marzo de 2026</b> la demandada me notific\u00f3 verbalmente la rescisi\u00f3n de la relaci\u00f3n laboral, imput\u00e1ndome tres faltas injustificadas en los d\u00edas 8, 9 y 10 de marzo del mismo a\u00f1o, las cuales <b>niego categ\u00f3ricamente</b>.
              </p>
              <p className="doc-p">
                <b>3.</b> Sirve de fundamento la jurisprudencia <a className="cite-verified" title="Registro 2027183 \u00b7 Verificada vs SCJN">2a./J. 14/2024</a>, que establece que cuando el patr\u00f3n invoca causal de despido sin acreditar los hechos constitutivos, procede el pago de indemnizaci\u00f3n constitucional. La carga procesal es del patr\u00f3n conforme a la jurisprudencia <a className="cite-verified" title="Registro 2024417 \u00b7 Verificada">2a./J. 76/2022</a> y al art\u00edculo 784 de la LFT.
              </p>

              {phase >= 2 && (
                <>
                  {visibleChars < 600 && (
                    <p className="doc-p" style={{position:"relative"}}>
                      <span style={{color:"var(--ink)"}}>{`4. Por cuanto hace al c\u00e1lculo de la prima de antig\u00fcedad, el suscrito reclama 7 a\u00f1os y 2 meses de servicios, lo que conforme al art\u00edculo 162 de la LFT y la tesis `.slice(0, visibleChars)}</span>
                      {visibleChars > 0 && <span className="cursor-blink"/>}
                    </p>
                  )}
                  {visibleChars >= 600 && (
                    <>
                      <p className="doc-p"><b>4.</b> Por cuanto hace al c\u00e1lculo de la prima de antig\u00fcedad, el suscrito reclama 7 a\u00f1os y 2 meses de servicios, lo que conforme al art\u00edculo 162 de la LFT y la tesis <a className="cite-verified">IV.4o.T.21 L (11a.)</a> arroja un total de <b>$24,888.00 MXN</b>.</p>
                      <h2 className="serif doc-h2">III. DERECHO</h2>
                      <div className="shimmer" style={{height:14, width:"92%", marginBottom:8}}/>
                      <div className="shimmer" style={{height:14, width:"88%", marginBottom:8}}/>
                      <div className="shimmer" style={{height:14, width:"60%"}}/>
                    </>
                  )}
                </>
              )}

              <div className="doc-foot">
                <div className="muted" style={{fontSize:10.5, lineHeight:1.5}}>
                  Documento generado con asistencia de IA (LexAI v0.9). Revisado por Lic. Ana \u00c1lvarez Mart\u00ednez \u2014 c\u00e9d. prof. 12345678. No constituye asesor\u00eda legal automatizada. SHA-256: a3f2\u20269e1d.
                </div>
              </div>
            </div>
          </section>

          <aside className="canvas-tools">
            <div style={{padding:"14px 16px", borderBottom:"1px solid var(--line)"}}>
              <div className="muted" style={{fontSize:10.5, textTransform:"uppercase", letterSpacing:"0.06em", fontWeight:600}}>Herramientas</div>
              <div style={{fontSize:11, color:"var(--ink-3)", marginTop:2}}>4 tools en paralelo \u00b7 LangGraph</div>
            </div>
            <div className="scroll-y" style={{padding:"10px 12px"}}>
              {TOOLS_RUNNING.map((t,i)=>(
                <div key={t.id} className={`tool-row tool-${t.status}`}>
                  <span className="tool-ic">
                    {t.status==="done" ? Ic.check : t.status==="running" ? <span className="hud-spin" style={{borderColor:"rgba(0,0,0,0.15)", borderTopColor:"var(--purple)", width:11, height:11, borderWidth:1.5}}/> : <span className="dot" style={{background:"var(--ink-4)"}}/>}
                  </span>
                  <div style={{minWidth:0, flex:1}}>
                    <div className="mono" style={{fontSize:11, color:"var(--ink-3)"}}>{t.name}</div>
                    <div style={{fontSize:12.5, fontWeight:500, marginTop:1}}>{t.label}</div>
                    {t.result && <div className="muted" style={{fontSize:11, marginTop:2}}>{t.result}</div>}
                  </div>
                  <div className="muted mono" style={{fontSize:10.5}}>{t.time}</div>
                </div>
              ))}
              <div style={{borderTop:"1px solid var(--line)", marginTop:12, paddingTop:12}}>
                <div className="muted" style={{fontSize:10.5, textTransform:"uppercase", letterSpacing:"0.06em", fontWeight:600, marginBottom:8}}>Citas verificadas</div>
                {TESIS.slice(0,3).map((t,i)=>(
                  <div key={i} className="tesis-mini">
                    <div style={{display:"flex", alignItems:"center", gap:6}}>
                      <span className="dot" style={{background:"var(--ok)"}}/>
                      <span className="mono" style={{fontSize:10.5, color:"var(--ink-3)"}}>Reg. {t.registro}</span>
                      <span className={`chip ${t.relevancia==="Muy alta"?"chip-green":"chip-blue"}`} style={{marginLeft:"auto", fontSize:10}}>{t.relevancia}</span>
                    </div>
                    <div style={{fontSize:11.5, lineHeight:1.4, marginTop:4, fontWeight:500}}>{t.rubro.slice(0, 90)}\u2026</div>
                  </div>
                ))}
              </div>
              <div style={{borderTop:"1px solid var(--line)", marginTop:12, paddingTop:12}}>
                <div className="muted" style={{fontSize:10.5, textTransform:"uppercase", letterSpacing:"0.06em", fontWeight:600, marginBottom:8}}>Prestaciones (LFT)</div>
                <CalcRow l="Indemn. constitucional (90 d\u00edas)" v="$255,600"/>
                <CalcRow l="Prima antig\u00fcedad (7.2 a\u00f1os)" v="$24,888"/>
                <CalcRow l="Salarios ca\u00eddos (12 m m\u00e1x.)" v="$340,800"/>
                <CalcRow l="Vacaciones + prima" v="$5,852"/>
                <CalcRow l="Aguinaldo proporcional" v="$5,040"/>
                <div style={{display:"flex", justifyContent:"space-between", marginTop:8, paddingTop:8, borderTop:"1px solid var(--line)"}}>
                  <span style={{fontSize:12, fontWeight:600}}>Total reclamado</span>
                  <span className="serif tabular" style={{fontSize:15, fontWeight:600, color:"var(--ok)"}}>$432,180</span>
                </div>
              </div>
            </div>
          </aside>
        </div>
        <div className="lex-hud-mount"><VoiceHUD state={hudState} compact={false} /></div>
      </main>
      <style>{`
        .canvas-rail { display: flex; flex-direction: column; min-height: 0; border-right: 1px solid var(--line); background: var(--bg); }
        .canvas-tools { display: flex; flex-direction: column; min-height: 0; border-left: 1px solid var(--line); background: var(--bg); }
        .canvas-doc { background: var(--bg-sunken); padding: 32px 32px 120px; min-height: 0; }
        .doc-paper { max-width: 760px; margin: 0 auto; background: var(--bg-elev); border: 1px solid var(--line); border-radius: 4px; padding: 56px 64px; box-shadow: var(--shadow-2); font-family: var(--font-serif); font-size: 13.5px; line-height: 1.65; color: var(--ink); }
        .doc-header { text-align: center; padding-bottom: 18px; border-bottom: 1px solid var(--line); margin-bottom: 22px; }
        .doc-h1 { font-size: 22px; font-weight: 600; letter-spacing: -0.01em; margin: 8px 0 0; line-height: 1.2; }
        .doc-h2 { font-size: 14px; font-weight: 700; letter-spacing: 0.04em; text-transform: uppercase; margin: 22px 0 8px; }
        .doc-p { margin: 0 0 12px; text-align: justify; }
        .doc-list { padding-left: 22px; margin: 0 0 14px; }
        .doc-list li { margin-bottom: 8px; text-align: justify; }
        .doc-foot { margin-top: 28px; padding-top: 14px; border-top: 1px dashed var(--line); }
        .cursor-blink { display: inline-block; width: 8px; height: 14px; background: var(--accent); vertical-align: -2px; margin-left: 1px; animation: blink 1s steps(2) infinite; }
        @keyframes blink { 50% { opacity: 0; } }
        .transcript-block { padding: 10px 12px; border-radius: 8px; background: var(--bg-elev); border: 1px solid var(--line); margin-bottom: 8px; }
        .tool-row { display: flex; align-items: flex-start; gap: 10px; padding: 8px 8px; border-radius: 8px; margin-bottom: 2px; }
        .tool-row.tool-running { background: var(--purple-soft); }
        .tool-ic { width: 18px; height: 18px; border-radius: 999px; display: grid; place-items: center; flex: none; margin-top: 2px; color: var(--ok); }
        .tool-row.tool-queued .tool-ic { color: var(--ink-4); }
        .tesis-mini { padding: 8px 0; border-bottom: 1px dashed var(--line); }
        .tesis-mini:last-child { border-bottom: 0; }
      `}</style>
    </div>
  );
}

function CalcRow({l,v}) {
  return (
    <div style={{display:"flex", justifyContent:"space-between", padding:"3px 0", fontSize:11.5}}>
      <span className="muted">{l}</span><span className="tabular mono" style={{fontWeight:500}}>{v}</span>
    </div>
  );
}

Object.assign(window, { LiveCanvasScreen });
