/* Icons + small atoms used across LexAI screens */
const Ic = {
  mic: <svg className="ico" viewBox="0 0 24 24"><rect x="9" y="3" width="6" height="12" rx="3"/><path d="M5 11a7 7 0 0 0 14 0M12 18v3"/></svg>,
  search: <svg className="ico" viewBox="0 0 24 24"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg>,
  plus: <svg className="ico" viewBox="0 0 24 24"><path d="M12 5v14M5 12h14"/></svg>,
  arrow: <svg className="ico" viewBox="0 0 24 24"><path d="M5 12h14m-5-5 5 5-5 5"/></svg>,
  arrowL: <svg className="ico" viewBox="0 0 24 24"><path d="M19 12H5m5-5-5 5 5 5"/></svg>,
  check: <svg className="ico" viewBox="0 0 24 24"><path d="m5 12 5 5 9-11"/></svg>,
  x: <svg className="ico" viewBox="0 0 24 24"><path d="M6 6l12 12M18 6 6 18"/></svg>,
  dots: <svg className="ico" viewBox="0 0 24 24"><circle cx="5" cy="12" r="1.4" fill="currentColor" stroke="none"/><circle cx="12" cy="12" r="1.4" fill="currentColor" stroke="none"/><circle cx="19" cy="12" r="1.4" fill="currentColor" stroke="none"/></svg>,
  cmd: <svg className="ico" viewBox="0 0 24 24"><path d="M9 6a3 3 0 1 0-3 3h12a3 3 0 1 0-3-3v12a3 3 0 1 0 3-3H6a3 3 0 1 0 3 3z"/></svg>,
  scales: <svg className="ico" viewBox="0 0 24 24"><path d="M12 4v16M5 8h14M3 14l3-7 3 7M15 14l3-7 3 7M3 14a3 3 0 0 0 6 0M15 14a3 3 0 0 0 6 0M8 20h8"/></svg>,
  doc: <svg className="ico" viewBox="0 0 24 24"><path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z"/><path d="M14 3v5h5M9 13h6M9 17h4"/></svg>,
  folder: <svg className="ico" viewBox="0 0 24 24"><path d="M3 6a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/></svg>,
  cal: <svg className="ico" viewBox="0 0 24 24"><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M8 3v4M16 3v4M3 10h18"/></svg>,
  user: <svg className="ico" viewBox="0 0 24 24"><circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/></svg>,
  users: <svg className="ico" viewBox="0 0 24 24"><circle cx="9" cy="8" r="3.5"/><path d="M3 20a6 6 0 0 1 12 0M16 5.5a3.5 3.5 0 0 1 0 6.5M21 20a6 6 0 0 0-3-5.2"/></svg>,
  bell: <svg className="ico" viewBox="0 0 24 24"><path d="M6 9a6 6 0 1 1 12 0c0 4.5 2 6 2 6H4s2-1.5 2-6M10 19a2 2 0 0 0 4 0"/></svg>,
  setting: <svg className="ico" viewBox="0 0 24 24"><circle cx="12" cy="12" r="3"/><path d="M19 12a7 7 0 0 0-.1-1.2l2-1.5-2-3.4-2.3.8a7 7 0 0 0-2-1.2L14 3h-4l-.6 2.5a7 7 0 0 0-2 1.2L5 6l-2 3.4 2 1.5a7 7 0 0 0 0 2.4l-2 1.5 2 3.4 2.3-.8a7 7 0 0 0 2 1.2L10 21h4l.6-2.5a7 7 0 0 0 2-1.2l2.3.8 2-3.4-2-1.5"/></svg>,
  shield: <svg className="ico" viewBox="0 0 24 24"><path d="M12 3 4 6v6c0 5 3.5 8 8 9 4.5-1 8-4 8-9V6z"/><path d="m9 12 2 2 4-4"/></svg>,
  upload: <svg className="ico" viewBox="0 0 24 24"><path d="M12 16V4m-5 5 5-5 5 5M5 20h14"/></svg>,
  download: <svg className="ico" viewBox="0 0 24 24"><path d="M12 4v12m-5-5 5 5 5-5M5 20h14"/></svg>,
  bolt: <svg className="ico" viewBox="0 0 24 24"><path d="M13 2 4 14h7l-1 8 9-12h-7z"/></svg>,
  send: <svg className="ico" viewBox="0 0 24 24"><path d="m4 12 17-8-5 18-4-7z"/></svg>,
  pause: <svg className="ico" viewBox="0 0 24 24"><rect x="6" y="5" width="4" height="14" rx="1"/><rect x="14" y="5" width="4" height="14" rx="1"/></svg>,
  play: <svg className="ico" viewBox="0 0 24 24"><path d="M7 5v14l12-7z"/></svg>,
  warn: <svg className="ico" viewBox="0 0 24 24"><path d="m12 3 10 18H2zM12 10v5M12 18v.5"/></svg>,
  link: <svg className="ico" viewBox="0 0 24 24"><path d="M10 14a4 4 0 0 1 0-6l3-3a4 4 0 0 1 6 6l-1.5 1.5M14 10a4 4 0 0 1 0 6l-3 3a4 4 0 0 1-6-6l1.5-1.5"/></svg>,
  edit: <svg className="ico" viewBox="0 0 24 24"><path d="m4 20 4-1 11-11a2.83 2.83 0 0 0-4-4L4 15z"/></svg>,
  filter: <svg className="ico" viewBox="0 0 24 24"><path d="M3 5h18l-7 9v6l-4-2v-4z"/></svg>,
  home: <svg className="ico" viewBox="0 0 24 24"><path d="m3 11 9-8 9 8M5 9v11h14V9"/></svg>,
  msg: <svg className="ico" viewBox="0 0 24 24"><path d="M4 5h16v11H8l-4 4z"/></svg>,
  bookmark: <svg className="ico" viewBox="0 0 24 24"><path d="M6 3h12v18l-6-4-6 4z"/></svg>,
  clock: <svg className="ico" viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>,
  inbox: <svg className="ico" viewBox="0 0 24 24"><path d="M3 13h5l1 3h6l1-3h5M3 13l3-8h12l3 8v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/></svg>,
  sparkle: <svg className="ico" viewBox="0 0 24 24"><path d="M12 3v6m0 6v6m-9-9h6m6 0h6M6 6l3 3m6 6 3 3M6 18l3-3m6-6 3-3"/></svg>,
  badge: <svg className="ico" viewBox="0 0 24 24"><circle cx="12" cy="9" r="6"/><path d="m9 14-2 7 5-3 5 3-2-7"/></svg>,
};

const Logo = ({size=18, label=true, className=""}) => (
  <span className={`lex-mark ${className}`} style={{fontSize: size}}>
    <span className="lex-mark-sigil" style={{width:size+6, height:size+6, fontSize: size-2}}>L</span>
    {label && <span style={{letterSpacing:"-0.01em"}}>LexAI</span>}
  </span>
);

Object.assign(window, { Ic, Logo });
