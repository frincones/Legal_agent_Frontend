/* Auth + Onboarding + Command Palette + HITL gates + Mobile PWA */

function AuthScreen({mode="signup"}) {
  return (
    <div className="auth-shell">
      <aside className="auth-aside">
        <div style={{display:"flex", flexDirection:"column", height:"100%"}}>
          <Logo size={20}/>
          <div style={{flex:1}}/>
          <blockquote className="serif" style={{fontSize:24, lineHeight:1.4, letterSpacing:"-0.01em", margin:0, fontWeight:400}}>
            "Nunca pens\u00e9 que la tecnolog\u00eda pudiera entender un escrito procesal mexicano. LexAI me ahorra 4 horas al d\u00eda."
          </blockquote>
          <div style={{display:"flex", alignItems:"center", gap:10, marginTop:18}}>
            <div className="lex-avatar" style={{width:36, height:36, fontSize:13}}>RM</div>
            <div>
              <div style={{fontSize:13, fontWeight:600}}>Lic. Roberto Madrigal</div>
              <div className="muted" style={{fontSize:11.5}}>Madrigal y Asoc. \u00b7 CDMX \u00b7 design partner</div>
            </div>
          </div>
          <div style={{display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:10, marginTop:24, paddingTop:18, borderTop:"1px solid var(--line)"}}>
            <div><div className="serif" style={{fontSize:18, fontWeight:600}}>0%</div><div className="muted" style={{fontSize:10.5}}>citas alucinadas</div></div>
            <div><div className="serif" style={{fontSize:18, fontWeight:600}}>840ms</div><div className="muted" style={{fontSize:10.5}}>voice E2E p50</div></div>
            <div><div className="serif" style={{fontSize:18, fontWeight:600}}>14d</div><div className="muted" style={{fontSize:10.5}}>trial gratuito</div></div>
          </div>
        </div>
      </aside>
      <main className="auth-main">
        <div className="auth-card">
          <h1 className="serif" style={{fontSize:28, letterSpacing:"-0.02em", margin:"0 0 4px"}}>{mode==="signup"?"Crea tu cuenta":"Bienvenida de vuelta"}</h1>
          <p className="muted" style={{fontSize:13.5, margin:"0 0 24px"}}>{mode==="signup"?"Verificamos tu c\u00e9dula contra la SEP. Toma 60 segundos.":"Continuemos donde dejaste \u00b7 Lic. \u00c1lvarez"}</p>

          {mode==="signup" && (<>
            <Field label="Nombre completo" v="Ana \u00c1lvarez Mart\u00ednez"/>
            <Field label="C\u00e9dula profesional" v="12345678" badge={<span className="chip chip-green"><span className="dot"/>Verificada SEP</span>}/>
            <Field label="Email corporativo" v="ana@lopez-asociados.mx"/>
          </>)}
          {mode==="login" && (<>
            <Field label="Email" v="ana@lopez-asociados.mx"/>
            <Field label="Contrase\u00f1a" v="\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022" type="password"/>
          </>)}

          <div className="auth-mfa">
            <div style={{display:"flex", alignItems:"center", gap:8, marginBottom:10}}>
              <span style={{display:"inline-flex", color:"var(--ok)"}}>{Ic.shield}</span>
              <span style={{fontSize:13, fontWeight:600}}>MFA TOTP obligatorio</span>
              <span className="chip chip-green" style={{marginLeft:"auto"}}>Activo</span>
            </div>
            <div className="muted" style={{fontSize:11.5, lineHeight:1.5}}>Protege expedientes de tus clientes con autenticaci\u00f3n de dos factores. LexAI cumple con LFPDPPP y zero data retention con Anthropic.</div>
            <div style={{display:"flex", gap:6, marginTop:12}}>
              {["6","2","9","4","1","7"].map((d,i)=>(<div key={i} className="otp-cell">{d}</div>))}
            </div>
          </div>

          <button className="btn btn-primary btn-lg" style={{width:"100%", justifyContent:"center", marginTop:18}}>
            {mode==="signup"?"Iniciar 14 d\u00edas gratis":"Entrar a LexAI"} {Ic.arrow}
          </button>
          <div className="muted" style={{fontSize:11, textAlign:"center", marginTop:12, lineHeight:1.5}}>
            Tarjeta requerida. Sin cargos hasta el d\u00eda 15. Cancelas con un click. Cumplimos LFPDPPP \u00b7 Aviso de Privacidad \u00b7 DPA disponible.
          </div>
        </div>
      </main>
      <style>{`
        .auth-shell { display: grid; grid-template-columns: 1fr 1.1fr; height: 100%; background: var(--bg); }
        .auth-aside { padding: 40px; background: var(--bg-sunken); border-right: 1px solid var(--line); display: flex; }
        .auth-main { display: grid; place-items: center; padding: 40px; }
        .auth-card { width: 100%; max-width: 440px; }
        .field-row { margin-bottom: 14px; }
        .field-row label { display: block; font-size: 11.5px; color: var(--ink-3); font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 6px; }
        .field-row .field-input { display: flex; align-items: center; gap: 8px; padding: 10px 12px; border: 1px solid var(--line-strong); border-radius: var(--r-md); background: var(--bg-elev); font-size: 14px; }
        .auth-mfa { margin-top: 20px; padding: 14px; border: 1px solid var(--line); border-radius: var(--r-md); background: var(--bg-elev); }
        .otp-cell { width: 40px; height: 44px; border-radius: 8px; border: 1px solid var(--line-strong); background: var(--bg); display: grid; place-items: center; font-family: var(--font-mono); font-size: 18px; font-weight: 600; }
      `}</style>
    </div>
  );
}

function Field({label, v, badge}) {
  return (
    <div className="field-row">
      <label>{label}</label>
      <div className="field-input">
        <span style={{flex:1}}>{v}</span>
        {badge}
      </div>
    </div>
  );
}

function OnboardingScreen() {
  return (
    <div className="lex-app">
      <Sidebar active="home"/>
      <main className="lex-main">
        <div style={{padding:"28px var(--pad-screen)", borderBottom:"1px solid var(--line)"}}>
          <div className="muted" style={{fontSize:11.5, textTransform:"uppercase", letterSpacing:"0.06em", fontWeight:600}}>Demo mode \u00b7 caso ficticio P\u00e9rez vs. ACME</div>
          <h1 className="serif" style={{fontSize:28, letterSpacing:"-0.02em", margin:"4px 0 0"}}>Veamos LexAI con un caso de mentira (sin riesgo)</h1>
          <p className="muted" style={{fontSize:13.5, margin:"6px 0 0", maxWidth:680, lineHeight:1.55}}>Te llevamos por los 4 momentos clave en menos de 5 minutos. Todo lo que veas est\u00e1 simulado: no hay datos reales de clientes ni se enviar\u00e1 nada al exterior.</p>
        </div>
        <div className="lex-content scroll-y">
          <div className="onb-progress">
            {[
              {n:1, t:"Activa LexAI con tu voz", s:"Di \u201cHola LexAI\u201d", state:"done"},
              {n:2, t:"Dicta lo que necesitas", s:"\u201cRed\u00e1ctame demanda P\u00e9rez vs. ACME\u201d", state:"current"},
              {n:3, t:"Verifica las citas SCJN", s:"Click en cualquier cita azul", state:"todo"},
              {n:4, t:"Exporta a Word", s:"\u2318E", state:"todo"},
            ].map((p,i)=>(
              <div key={i} className={`onb-step onb-${p.state}`}>
                <div className="onb-num">{p.state==="done" ? Ic.check : p.n}</div>
                <div>
                  <div style={{fontSize:14, fontWeight:600}}>{p.t}</div>
                  <div className="muted" style={{fontSize:12}}>{p.s}</div>
                </div>
              </div>
            ))}
          </div>
          <section className="surface" style={{padding:32, marginTop:24, textAlign:"center"}}>
            <div style={{margin:"0 auto", maxWidth:520}}>
              <VoiceHUD state="listening" transcript="Red\u00e1ctame demanda P\u00e9rez vs. ACME por incumplimiento\u2026"/>
              <h2 className="serif" style={{fontSize:22, letterSpacing:"-0.01em", margin:"24px 0 8px"}}>Ahora, t\u00fa.</h2>
              <p className="muted" style={{fontSize:13.5}}>Mant\u00e9n presionado <span className="kbd">␣</span> y di: <i>\u201cRed\u00e1ctame una demanda civil por incumplimiento\u201d</i>. Si est\u00e1s en la oficina, prueba <i>\u201cHola LexAI, c\u00f3mo est\u00e1n mis casos hoy\u201d</i>.</p>
              <div style={{display:"flex", gap:8, justifyContent:"center", marginTop:16}}>
                <button className="btn btn-sm">Saltar onboarding</button>
                <button className="btn btn-sm btn-primary">Ya termin\u00e9, contin\u00faa</button>
              </div>
            </div>
          </section>
        </div>
      </main>
      <style>{`
        .onb-progress { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; }
        .onb-step { display: flex; align-items: center; gap: 12px; padding: 14px; border: 1px solid var(--line); border-radius: var(--r-md); background: var(--bg-elev); }
        .onb-step.onb-done { border-color: color-mix(in oklab, var(--ok) 40%, var(--line)); background: var(--ok-soft); }
        .onb-step.onb-current { border-color: var(--accent); box-shadow: 0 0 0 3px var(--accent-soft); }
        .onb-num { width: 28px; height: 28px; border-radius: 999px; display: grid; place-items: center; background: var(--bg-sunken); color: var(--ink-3); font-weight: 600; font-size: 13px; flex: none; }
        .onb-done .onb-num { background: var(--ok); color: white; }
        .onb-current .onb-num { background: var(--accent); color: white; }
      `}</style>
    </div>
  );
}

function CommandPalette() {
  return (
    <div className="cmdk-shell">
      <div className="cmdk-overlay"/>
      <div className="cmdk-panel surface">
        <div className="cmdk-input">
          <span style={{display:"inline-flex", color:"var(--ink-3)"}}>{Ic.search}</span>
          <input defaultValue="redactar dem" autoFocus placeholder="Busca o ejecuta\u2026"/>
          <span className="kbd">esc</span>
        </div>
        <div className="cmdk-list scroll-y">
          <div className="cmdk-group">Sugerencias para "redactar dem"</div>
          {[
            {ic:Ic.bolt, t:"Redactar demanda laboral", s:"Plantilla LFT \u00b7 voice o teclado", k:"\u2318 D"},
            {ic:Ic.bolt, t:"Redactar demanda civil", s:"Plantilla CCF \u00b7 6 variantes", k:""},
            {ic:Ic.scales, t:"Demanda de amparo indirecto", s:"Plantilla Ley de Amparo", k:""},
          ].map((c,i)=>(<CmdRow key={i} {...c} active={i===0}/>))}

          <div className="cmdk-group">Casos</div>
          <CmdRow ic={Ic.folder} t="Rodr\u00edguez vs. Telmex" s="Laboral \u00b7 Audiencia mi\u00e9 27 may" k=""/>
          <CmdRow ic={Ic.folder} t="Constructora del Valle" s="Civil \u00b7 Vence vie 29 may"/>

          <div className="cmdk-group">Acciones</div>
          <CmdRow ic={Ic.search} t="Buscar jurisprudencia SCJN" s="dictar el tema o tema en texto" k="\u2318 J"/>
          <CmdRow ic={Ic.upload} t="Subir documento al caso actual" s="PDF, DOCX \u00b7 OCR autom\u00e1tico" k="\u2318 U"/>
          <CmdRow ic={Ic.download} t="Exportar a Word" s="con disclaimer footer + SHA-256" k="\u2318 E"/>
          <CmdRow ic={Ic.users} t="Cambiar despacho" s="L\u00f3pez & Asoc. \u2192 ?" k=""/>
        </div>
        <div className="cmdk-foot">
          <span className="muted" style={{fontSize:11}}>
            <span className="kbd">\u2191</span><span className="kbd">\u2193</span> navegar \u00b7 <span className="kbd">\u23ce</span> ejecutar \u00b7 <span className="kbd">\u2318</span><span className="kbd">K</span> alternar
          </span>
          <span className="muted" style={{fontSize:11, marginLeft:"auto"}}>render &lt; 50ms \u2713</span>
        </div>
      </div>
      <style>{`
        .cmdk-shell { position: relative; height: 100%; background: var(--bg); padding: 80px 0 0; display: flex; justify-content: center; }
        .cmdk-overlay { position: absolute; inset: 0; background: var(--bg-overlay, rgba(20,18,14,0.45)); }
        .cmdk-panel { position: relative; width: min(640px, 92vw); max-height: 460px; display: flex; flex-direction: column; box-shadow: var(--shadow-3); overflow: hidden; }
        .cmdk-input { display: flex; align-items: center; gap: 12px; padding: 16px 18px; border-bottom: 1px solid var(--line); }
        .cmdk-input input { flex: 1; border: 0; outline: 0; background: transparent; font: inherit; font-size: 15px; color: var(--ink); }
        .cmdk-list { flex: 1; min-height: 0; padding: 6px 0; }
        .cmdk-group { font-size: 10.5px; text-transform: uppercase; letter-spacing: 0.05em; font-weight: 600; color: var(--ink-3); padding: 10px 18px 4px; }
        .cmd-row { display: flex; align-items: center; gap: 12px; padding: 9px 18px; cursor: pointer; }
        .cmd-row.active, .cmd-row:hover { background: var(--accent-soft); }
        .cmd-row .ico { color: var(--ink-3); }
        .cmd-row.active .ico { color: var(--accent-ink); }
        .cmdk-foot { padding: 10px 16px; border-top: 1px solid var(--line); display: flex; align-items: center; gap: 10px; background: var(--bg-sunken); }
      `}</style>
    </div>
  );
}

function CmdRow({ic,t,s,k,active}) {
  return (
    <div className={`cmd-row ${active?"active":""}`}>
      {ic}
      <div style={{minWidth:0, flex:1}}>
        <div style={{fontSize:13.5, fontWeight:500}}>{t}</div>
        <div className="muted" style={{fontSize:11.5}}>{s}</div>
      </div>
      {k && <span className="kbd" style={{fontSize:11}}>{k}</span>}
    </div>
  );
}

function HITLGatesScreen() {
  return (
    <div className="lex-app">
      <Sidebar active="canvas"/>
      <main className="lex-main">
        <TopBar
          breadcrumb="HITL Gates \u00b7 7 momentos de confirmaci\u00f3n humana"
          title="Human-in-the-loop"
          subtitle="Toda acci\u00f3n que modifica el mundo exterior pasa por aprobaci\u00f3n humana visible."
        />
        <div className="lex-content scroll-y">
          <div style={{display:"grid", gridTemplateColumns:"repeat(2, 1fr)", gap:16}}>
            <GateCard n={1} ic={Ic.send} t="Env\u00edo de email externo" tone="amber" preview={<EmailGatePreview/>}/>
            <GateCard n={2} ic={Ic.shield} t="Firma electr\u00f3nica e.firma SAT" tone="danger" preview={<SignGatePreview/>}/>
            <GateCard n={3} ic={Ic.scales} t="Cita SCJN en documento" tone="blue" preview={<CiteGatePreview/>}/>
            <GateCard n={4} ic={Ic.badge} t="Acci\u00f3n financiera &gt; $50K MXN" tone="amber" preview={<MoneyGatePreview/>}/>
            <GateCard n={5} ic={Ic.edit} t="Sobrescribir documento del cliente" tone="amber" preview={<OverwritePreview/>}/>
            <GateCard n={6} ic={Ic.doc} t="Escrito a juez/contraparte" tone="amber" preview={<CourtPreview/>}/>
            <GateCard n={7} ic={Ic.shield} t="Datos sensibles LFPDPPP detectados" tone="blue" preview={<PrivacyPreview/>} full/>
          </div>
        </div>
      </main>
    </div>
  );
}

function GateCard({n, ic, t, tone, preview, full}) {
  return (
    <article className="surface" style={{padding:"var(--pad-card)", gridColumn: full?"1 / -1":"auto"}}>
      <div style={{display:"flex", alignItems:"center", gap:10, marginBottom:12}}>
        <span className={`gate-ic gate-${tone}`}>{ic}</span>
        <div>
          <div className="muted" style={{fontSize:10.5, textTransform:"uppercase", letterSpacing:"0.06em", fontWeight:600}}>Gate {n}</div>
          <h4 className="serif" style={{fontSize:15, fontWeight:600, margin:0, letterSpacing:"-0.005em"}}>{t}</h4>
        </div>
        <span className={`chip chip-${tone==="danger"?"red":tone==="amber"?"amber":"blue"}`} style={{marginLeft:"auto"}}>HITL</span>
      </div>
      {preview}
      <style>{`
        .gate-ic { width: 32px; height: 32px; border-radius: 8px; display: grid; place-items: center; flex: none; }
        .gate-amber { background: var(--warn-soft); color: var(--warn); }
        .gate-danger { background: var(--danger-soft); color: var(--danger); }
        .gate-blue { background: var(--accent-soft); color: var(--accent-ink); }
      `}</style>
    </article>
  );
}

function EmailGatePreview() {
  return (
    <div className="gate-modal">
      <div className="muted" style={{fontSize:11}}>Para</div>
      <div style={{fontSize:13, fontWeight:500}}>maria@lopez-contraparte.com.mx <span className="chip chip-amber" style={{marginLeft:6}}>fuera del dominio</span></div>
      <div className="muted" style={{fontSize:11, marginTop:8}}>Asunto</div>
      <div style={{fontSize:13, fontWeight:500}}>Notificaci\u00f3n de demanda \u00b7 Exp. 473/2026</div>
      <div className="muted" style={{fontSize:11, marginTop:8}}>Cuerpo (preview)</div>
      <div style={{fontSize:12, padding:8, background:"var(--bg-sunken)", borderRadius:6, marginTop:4}}>Por instrucciones de mi cliente, le notifico\u2026</div>
      <div style={{display:"flex", gap:6, marginTop:12}}>
        <button className="btn btn-sm">Editar</button>
        <button className="btn btn-sm">Cancelar</button>
        <button className="btn btn-sm btn-primary" style={{marginLeft:"auto"}}>Enviar</button>
      </div>
    </div>
  );
}
function SignGatePreview() {
  return (
    <div className="gate-modal" style={{textAlign:"center"}}>
      <div style={{fontSize:11, color:"var(--danger)", textTransform:"uppercase", letterSpacing:"0.06em", fontWeight:600}}>Modo seguro \u00b7 voz silenciada</div>
      <div className="serif" style={{fontSize:18, fontWeight:600, margin:"8px 0 4px"}}>Firmar con e.firma</div>
      <div className="muted mono" style={{fontSize:10.5}}>SHA-256 a3f29e\u20264c1d</div>
      <div style={{display:"grid", gridTemplateColumns:"repeat(6,1fr)", gap:4, margin:"14px 32px"}}>
        {Array.from({length:6}).map((_,i)=>(<div key={i} className="otp-cell" style={{height:36, fontSize:14}}>{i<2?"\u2022":""}</div>))}
      </div>
      <button className="btn btn-sm btn-primary" style={{width:"100%"}}>{Ic.shield} Firmar y archivar</button>
    </div>
  );
}
function CiteGatePreview() {
  return (
    <div className="gate-modal">
      <div style={{display:"flex", alignItems:"center", gap:8}}>
        <span className="dot" style={{background:"var(--ok)"}}/>
        <span style={{fontSize:13, fontWeight:600}}>Tesis 2a./J. 14/2024 verificada</span>
        <span className="chip chip-green" style={{marginLeft:"auto"}}>Match 0.98</span>
      </div>
      <div className="muted" style={{fontSize:11.5, marginTop:6, lineHeight:1.5}}>Registro 2027183 \u00b7 vigente \u00b7 \u00daltima validaci\u00f3n: hace 2 horas vs SCJN</div>
      <a className="muted" style={{fontSize:11.5, marginTop:8, display:"inline-flex", alignItems:"center", gap:4, color:"var(--accent)"}}>{Ic.link} Abrir en sjf.scjn.gob.mx</a>
      <div style={{display:"flex", gap:6, marginTop:12}}>
        <button className="btn btn-sm">Rechazar</button>
        <button className="btn btn-sm btn-primary" style={{marginLeft:"auto"}}>{Ic.check} Insertar cita</button>
      </div>
    </div>
  );
}
function MoneyGatePreview() {
  return (
    <div className="gate-modal">
      <div style={{fontSize:11, color:"var(--ink-3)"}}>Pago a registrar</div>
      <div className="serif tabular" style={{fontSize:24, fontWeight:600, letterSpacing:"-0.01em"}}>$78,500.00 <span style={{fontSize:13, color:"var(--ink-3)"}}>MXN</span></div>
      <div className="muted" style={{fontSize:11.5, marginTop:4}}>Beneficiario: Notar\u00eda 47 \u00b7 RFC NCC910314 \u00b7 Honorarios escritura</div>
      <div style={{display:"flex", gap:6, marginTop:12}}>
        <button className="btn btn-sm">Cancelar</button>
        <button className="btn btn-sm btn-primary" style={{marginLeft:"auto"}}>Doble auth + autorizar</button>
      </div>
    </div>
  );
}
function OverwritePreview() {
  return (
    <div className="gate-modal">
      <div style={{fontSize:13, fontWeight:600}}>demanda-rodriguez-v3.docx</div>
      <div className="muted" style={{fontSize:11.5, marginTop:4}}>Subido por cliente hace 2 d\u00edas \u00b7 modificar?</div>
      <div style={{display:"flex", gap:6, marginTop:12}}>
        <button className="btn btn-sm btn-primary">Crear v4</button>
        <button className="btn btn-sm" style={{marginLeft:"auto"}}>Sobrescribir v3</button>
      </div>
    </div>
  );
}
function CourtPreview() {
  return (
    <div className="gate-modal">
      <div style={{fontSize:11.5, fontWeight:600, marginBottom:6}}>Checklist pre-presentaci\u00f3n</div>
      {["Partes correctamente identificadas","Fechas y plazos validados","Expediente y juzgado verificados","Cliente firm\u00f3 autorizaci\u00f3n"].map((c,i)=>(
        <div key={i} style={{display:"flex", alignItems:"center", gap:8, padding:"4px 0", fontSize:12}}>
          <span style={{display:"inline-flex", color:i<3?"var(--ok)":"var(--ink-4)"}}>{Ic.check}</span> {c}
        </div>
      ))}
    </div>
  );
}
function PrivacyPreview() {
  return (
    <div className="gate-modal" style={{display:"flex", gap:14, alignItems:"center"}}>
      <span className="gate-ic gate-blue" style={{width:40, height:40}}>{Ic.shield}</span>
      <div style={{flex:1}}>
        <div style={{fontSize:13, fontWeight:600}}>RFC y CURP detectados en transcripci\u00f3n</div>
        <div className="muted" style={{fontSize:11.5}}>Datos personales sensibles enmascarados en log. Soft toast \u00b7 audit log autom\u00e1tico \u00b7 LFPDPPP art. 19.</div>
      </div>
      <button className="btn btn-sm">Ver en audit log</button>
    </div>
  );
}

function MobilePWAScreen() {
  return (
    <div style={{display:"flex", gap:32, alignItems:"flex-start", justifyContent:"center", padding:24}}>
      <PhoneFrame title="Voice on-the-go" content={<MobileVoice/>}/>
      <PhoneFrame title="Caso en bolsillo" content={<MobileCaso/>}/>
      <PhoneFrame title="Resultado dictado" content={<MobileResult/>}/>
    </div>
  );
}

function PhoneFrame({title, content}) {
  return (
    <div style={{textAlign:"center"}}>
      <div className="phone">
        <div className="phone-notch"/>
        <div className="phone-screen">{content}</div>
      </div>
      <div className="muted serif" style={{fontSize:13, marginTop:10}}>{title}</div>
      <style>{`
        .phone { width: 290px; height: 600px; background: #1A1816; border-radius: 38px; padding: 10px; position: relative; box-shadow: 0 30px 60px -30px rgba(0,0,0,0.5), inset 0 0 0 1.5px rgba(255,255,255,0.06); }
        .phone-notch { position: absolute; top: 16px; left: 50%; transform: translateX(-50%); width: 96px; height: 26px; border-radius: 999px; background: #050505; z-index: 2; }
        .phone-screen { width: 100%; height: 100%; border-radius: 28px; background: var(--bg); overflow: hidden; position: relative; display: flex; flex-direction: column; }
      `}</style>
    </div>
  );
}

function MobileVoice() {
  return (
    <>
      <div className="m-status">9:41 \u00b7 LTE</div>
      <div style={{padding:"40px 18px 14px", flex:1, display:"flex", flexDirection:"column"}}>
        <Logo size={14}/>
        <div className="muted" style={{fontSize:11, marginTop:14}}>En camino a Juzgado 12 Laboral</div>
        <h2 className="serif" style={{fontSize:22, letterSpacing:"-0.02em", margin:"4px 0 14px", lineHeight:1.2}}>Repasemos los alegatos</h2>
        <div style={{flex:1, display:"flex", flexDirection:"column", gap:10}}>
          <div className="m-bubble m-ai">"Buenos d\u00edas Lic. Tu audiencia es en 18 minutos. Estos son los puntos principales de Rodr\u00edguez vs. Telmex\u2026"</div>
          <div className="m-bubble m-user">"Recu\u00e9rdame la jurisprudencia sobre carga de prueba"</div>
          <div className="m-bubble m-ai">
            "Tesis 2a./J. 76/2022 — verificada. La carga procesal de demostrar el despido recae en el patrón. Te muestro el rubro completo?"
            <div style={{display:"flex", gap:6, marginTop:8}}>
              <span className="chip chip-green" style={{fontSize:10}}><span className="dot"/>verificada</span>
            </div>
          </div>
        </div>
        <div style={{marginTop:14, marginBottom:6}}><VoiceHUD state="listening" compact showTranscript={false}/></div>
      </div>
      <style>{`
        .m-status { position: absolute; top: 12px; left: 22px; font-size: 11px; font-weight: 600; color: var(--ink); z-index: 1; }
        .m-bubble { padding: 8px 12px; border-radius: 14px; font-size: 12.5px; line-height: 1.45; max-width: 80%; }
        .m-user { background: var(--accent); color: white; align-self: flex-end; border-bottom-right-radius: 4px; }
        .m-ai { background: var(--bg-sunken); color: var(--ink); align-self: flex-start; border-bottom-left-radius: 4px; }
      `}</style>
    </>
  );
}

function MobileCaso() {
  return (
    <>
      <div className="m-status">9:41 \u00b7 LTE</div>
      <div style={{padding:"40px 18px 14px", flex:1, overflow:"auto"}}>
        <button className="btn btn-sm" style={{padding:"4px 8px"}}>{Ic.arrowL} Casos</button>
        <h2 className="serif" style={{fontSize:18, letterSpacing:"-0.01em", margin:"12px 0 4px", lineHeight:1.2}}>Rodr\u00edguez vs. Telmex</h2>
        <div className="muted" style={{fontSize:11.5}}>Exp. 473/2026 \u00b7 J. 12 Laboral CDMX</div>
        <div className="surface" style={{padding:14, marginTop:14, background:"var(--danger-soft)", borderColor:"transparent"}}>
          <span className="chip chip-red" style={{fontSize:10}}><span className="dot"/>en 3 días</span>
          <div className="serif" style={{fontSize:14, fontWeight:600, marginTop:8}}>Audiencia preliminar</div>
          <div className="muted" style={{fontSize:11.5}}>Mi\u00e9 27 may \u00b7 10:00</div>
        </div>
        <div className="surface" style={{padding:12, marginTop:10}}>
          <div className="muted" style={{fontSize:10.5}}>CUANT\u00cdA</div>
          <div className="serif tabular" style={{fontSize:18, fontWeight:600, color:"var(--ok)"}}>$432,180</div>
        </div>
        <div style={{marginTop:14, fontSize:12, fontWeight:600}}>Acciones r\u00e1pidas</div>
        <div style={{display:"flex", flexDirection:"column", gap:6, marginTop:6}}>
          <button className="btn btn-sm" style={{justifyContent:"flex-start"}}>{Ic.bolt} Dictar promoci\u00f3n</button>
          <button className="btn btn-sm" style={{justifyContent:"flex-start"}}>{Ic.upload} Subir foto del expediente</button>
          <button className="btn btn-sm" style={{justifyContent:"flex-start"}}>{Ic.cal} Ver agenda completa</button>
        </div>
      </div>
    </>
  );
}

function MobileResult() {
  return (
    <>
      <div className="m-status">9:41 \u00b7 LTE</div>
      <div style={{padding:"40px 18px 14px", flex:1, overflow:"auto"}}>
        <div className="muted" style={{fontSize:10.5, textTransform:"uppercase", letterSpacing:"0.06em", fontWeight:600}}>RESPUESTA \u00b7 4.2 SEG</div>
        <h2 className="serif" style={{fontSize:17, letterSpacing:"-0.01em", margin:"6px 0 10px", lineHeight:1.3}}>4 tesis SCJN sobre carga de prueba</h2>
        {TESIS.slice(0,3).map((t,i)=>(
          <div key={i} className="surface" style={{padding:12, marginBottom:8}}>
            <div style={{display:"flex", alignItems:"center", gap:6}}>
              <span className="dot" style={{background:"var(--ok)"}}/>
              <span className="mono" style={{fontSize:10, color:"var(--ink-3)"}}>Reg. {t.registro}</span>
              <span className={`chip ${t.relevancia==="Muy alta"?"chip-green":"chip-blue"}`} style={{marginLeft:"auto", fontSize:9.5}}>{t.relevancia}</span>
            </div>
            <div style={{fontSize:11.5, lineHeight:1.4, marginTop:4, fontWeight:500}}>{t.rubro.slice(0,76)}\u2026</div>
          </div>
        ))}
        <button className="btn btn-sm btn-primary" style={{width:"100%", justifyContent:"center", marginTop:6}}>Citar las 3 en demanda</button>
      </div>
    </>
  );
}

Object.assign(window, { AuthScreen, OnboardingScreen, CommandPalette, HITLGatesScreen, MobilePWAScreen });
