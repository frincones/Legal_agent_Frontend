/* App shell — sidebar + topbar shared across screens */

function Sidebar({active="home"}) {
  const items = [
    {id:"home",   icon: Ic.home,   label: "Inicio", count: null},
    {id:"casos",  icon: Ic.folder, label: "Casos",  count: 23},
    {id:"canvas", icon: Ic.bolt,   label: "Live Canvas", count: null, accent: true},
    {id:"clientes", icon: Ic.users, label: "Clientes", count: 47},
    {id:"calendar", icon: Ic.cal,  label: "Calendario", count: 5},
    {id:"docs",   icon: Ic.doc,    label: "Documentos", count: null},
    {id:"inbox",  icon: Ic.inbox,  label: "Notificaciones", count: 3},
  ];
  return (
    <aside className="lex-sidebar">
      <div className="lex-sidebar-top">
        <div className="lex-firm">
          <Logo size={15} />
          <div className="lex-firm-name">L\u00f3pez & Asociados</div>
          <button className="btn btn-icon btn-ghost btn-sm" style={{marginLeft:"auto"}}>{Ic.dots}</button>
        </div>
        <button className="btn btn-sm" style={{width:"100%", justifyContent:"space-between", marginTop: 12}}>
          <span style={{display:"inline-flex", alignItems:"center", gap:8}}>{Ic.search} Buscar o ejecutar</span>
          <span><span className="kbd">\u2318</span> <span className="kbd">K</span></span>
        </button>
      </div>
      <nav className="lex-nav">
        {items.map(it => (
          <a key={it.id} className={`lex-nav-item ${it.id===active?"active":""} ${it.accent?"accent":""}`}>
            {it.icon}
            <span>{it.label}</span>
            {it.count != null && <span className="lex-nav-count">{it.count}</span>}
          </a>
        ))}
      </nav>
      <div style={{flex:1}} />
      <div className="lex-sidebar-bottom">
        <div className="lex-nsm">
          <div className="lex-nsm-label">Documentos verificados \u00b7 mayo</div>
          <div className="lex-nsm-row">
            <span className="serif lex-nsm-num">47</span>
            <span className="chip chip-green"><span className="dot"/>+18%</span>
          </div>
          <div className="lex-nsm-bar"><span style={{width:"94%"}}/></div>
          <div className="lex-nsm-foot muted">Meta: 40 / mes</div>
        </div>
        <div className="lex-user">
          <div className="lex-avatar">AA</div>
          <div style={{minWidth:0, flex:1}}>
            <div style={{fontSize:13, fontWeight:600}}>Lic. Ana \u00c1lvarez</div>
            <div className="muted" style={{fontSize:11}}>C\u00e9d. 12345678 \u00b7 verificada</div>
          </div>
          <button className="btn btn-icon btn-ghost btn-sm">{Ic.setting}</button>
        </div>
      </div>
    </aside>
  );
}

function TopBar({title, subtitle, actions, breadcrumb}) {
  return (
    <header className="lex-topbar">
      <div style={{minWidth:0, flex:1}}>
        {breadcrumb && <div className="lex-crumb muted">{breadcrumb}</div>}
        <h1 className="lex-title serif">{title}</h1>
        {subtitle && <div className="lex-sub muted">{subtitle}</div>}
      </div>
      <div className="lex-topbar-actions">{actions}</div>
    </header>
  );
}

const SHELL_CSS = `
.lex-app {
  display: grid;
  grid-template-columns: 248px 1fr;
  height: 100%;
  width: 100%;
  background: var(--bg);
  color: var(--ink);
  font-family: var(--font-sans);
  position: relative;
}
[data-density="compacta"] .lex-app { grid-template-columns: 220px 1fr; }
.lex-sidebar {
  display: flex; flex-direction: column;
  border-right: 1px solid var(--line);
  background: var(--bg);
  padding: 14px 12px 12px;
  gap: 6px;
  min-height: 0;
}
.lex-sidebar-top { display: flex; flex-direction: column; padding: 4px 4px 8px; }
.lex-firm { display: flex; align-items: center; gap: 8px; }
.lex-firm-name { font-size: 11.5px; color: var(--ink-3); font-weight: 500; margin-left: 2px; }
.lex-nav { display: flex; flex-direction: column; gap: 1px; padding: 4px 0; }
.lex-nav-item {
  display: flex; align-items: center; gap: 10px;
  padding: 7px 10px; border-radius: 8px;
  font-size: 13px; color: var(--ink-2); font-weight: 500;
  cursor: pointer;
}
.lex-nav-item:hover { background: var(--bg-sunken); color: var(--ink); }
.lex-nav-item.active { background: var(--bg-elev); color: var(--ink); box-shadow: var(--shadow-1); }
.lex-nav-item.accent { color: var(--accent); }
.lex-nav-item.accent.active { background: var(--accent-soft); }
.lex-nav-count {
  margin-left: auto;
  min-width: 20px; height: 18px; padding: 0 5px;
  border-radius: 6px; font-size: 11px; font-weight: 500;
  background: var(--bg-sunken); color: var(--ink-3);
  display: inline-flex; align-items: center; justify-content: center;
}
.lex-sidebar-bottom { display: flex; flex-direction: column; gap: 12px; padding: 6px 4px; }
.lex-nsm {
  background: var(--bg-elev);
  border: 1px solid var(--line);
  border-radius: var(--r-md);
  padding: 10px 12px;
}
.lex-nsm-label { font-size: 10.5px; color: var(--ink-3); text-transform: uppercase; letter-spacing: 0.05em; font-weight: 600; }
.lex-nsm-row { display: flex; align-items: baseline; justify-content: space-between; margin-top: 4px; }
.lex-nsm-num { font-size: 24px; font-weight: 600; letter-spacing: -0.02em; line-height: 1; }
.lex-nsm-bar { height: 4px; background: var(--bg-sunken); border-radius: 999px; overflow: hidden; margin-top: 8px; }
.lex-nsm-bar > span { display: block; height: 100%; background: var(--ok); border-radius: 999px; }
.lex-nsm-foot { font-size: 11px; margin-top: 5px; }
.lex-user {
  display: flex; align-items: center; gap: 10px;
  padding: 8px 6px;
  border-top: 1px solid var(--line);
  padding-top: 12px;
}
.lex-avatar {
  width: 30px; height: 30px; border-radius: 999px; flex: none;
  background: linear-gradient(135deg, var(--accent), var(--purple));
  color: white; font-size: 11px; font-weight: 600;
  display: grid; place-items: center;
}
.lex-main {
  display: flex; flex-direction: column;
  min-width: 0; min-height: 0;
  overflow: hidden;
  position: relative;
}
.lex-topbar {
  display: flex; align-items: flex-end; gap: 16px;
  padding: 22px var(--pad-screen) 16px;
  border-bottom: 1px solid var(--line);
  background: var(--bg);
}
.lex-crumb { font-size: 11.5px; margin-bottom: 4px; letter-spacing: 0.02em; }
.lex-title { font-size: 26px; font-weight: 600; letter-spacing: -0.02em; margin: 0; line-height: 1.1; }
[data-density="compacta"] .lex-title { font-size: 22px; }
.lex-sub { font-size: 13px; margin-top: 4px; }
.lex-topbar-actions { display: flex; align-items: center; gap: 8px; flex: none; }
.lex-content { flex: 1; min-height: 0; overflow: auto; padding: var(--pad-screen); }
.lex-hud-mount {
  position: absolute;
  bottom: 22px; left: 50%;
  transform: translateX(-50%);
  z-index: 50;
}
`;
if (!document.getElementById("shell-css")) {
  const el = document.createElement("style"); el.id = "shell-css"; el.textContent = SHELL_CSS;
  document.head.appendChild(el);
}

Object.assign(window, { Sidebar, TopBar });
