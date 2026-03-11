import { useState, useEffect, useRef } from "react";

/* ── Your Google Apps Script URL (already connected) ── */
const WEBHOOK = "https://script.google.com/macros/s/AKfycbwXZf0IWO7lIME9JOVcLYMsHXNuNEBRPujJ-xDwXEpZBK-6kiELNGmY2I2TtI6ubQ1izg/exec";

/* ── Fields ── */
const FIELDS = [
  { id: "date",              label: "Date",                shortLabel: "Date",                type: "date",   placeholder: "",           col: 0 },
  { id: "revenue",           label: "Revenue",             shortLabel: "Revenue",             type: "number", placeholder: "e.g. 5000",  prefix: "$", col: 1 },
  { id: "jarsDelivered",     label: "Jars Delivered",      shortLabel: "Jars Delivered",      type: "number", placeholder: "e.g. 45",    col: 2 },
  { id: "newCustomers",      label: "New Customers",       shortLabel: "New Customers",       type: "number", placeholder: "e.g. 4",     col: 3 },
  { id: "emptyJars",         label: "Empty Jars in Stock", shortLabel: "Empty Jars in Stock", type: "number", placeholder: "e.g. 3000",  col: 4 },
  { id: "jarsWithCustomers", label: "Jars with Customers", shortLabel: "Jars with Customers", type: "number", placeholder: "e.g. 15001", col: 5 },
];

const QUESTIONS = [
  "What is today's date?",
  "What was today's total revenue?",
  "How many jars were delivered today?",
  "How many new customers signed up today?",
  "How many empty jars are currently in stock?",
  "How many jars are currently with customers?",
];

/* ── All sheet calls go via /api/sheet (Netlify serverless function)
   This sidesteps CORS entirely — the server calls Google, not the browser ── */
async function sendToSheet(payload) {
  const res = await fetch("/api/sheet", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error("HTTP " + res.status);
  return await res.json();
}

/* ── Styles ── */
const STYLES = `
@import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,600;0,700;1,400&family=Cinzel:wght@400;600;700&family=DM+Sans:wght@300;400;500&display=swap');

:root {
  --royal:   #1B3FA0;
  --royal-d: #0F2670;
  --royal-l: #2E5AC8;
  --sky:     #4F8EF7;
  --sky-l:   #87B8FF;
  --ink:     #070E22;
  --surface: rgba(11,22,58,0.82);
  --border:  rgba(79,142,247,0.18);
  --text:    #DDE8FF;
  --muted:   rgba(140,172,255,0.45);
  --amber:   #F0A840;
  --green:   #4FCFA0;
  --red:     #FF6B6B;
}

*,*::before,*::after { box-sizing:border-box; margin:0; padding:0; }

body { margin: 0; }

.dr-root { min-height:100vh; background:var(--ink); font-family:'DM Sans',sans-serif; color:var(--text); position:relative; overflow-x:hidden; }

.dr-bg { position:fixed; inset:0; z-index:0; pointer-events:none;
  background:
    radial-gradient(ellipse 120% 60% at 50% -5%,  rgba(30,63,160,0.55) 0%, transparent 65%),
    radial-gradient(ellipse 70%  50% at 95%  90%,  rgba(15,38,112,0.4)  0%, transparent 60%),
    radial-gradient(ellipse 50%  70% at -5%  70%,  rgba(20,50,130,0.3)  0%, transparent 60%),
    #070E22; }

.dr-caustics { position:fixed; inset:0; z-index:0; pointer-events:none; overflow:hidden; }
.dr-caustics span { display:block; position:absolute; left:0; right:0; height:1px;
  background:linear-gradient(90deg,transparent 0%,rgba(79,142,247,0.2) 40%,rgba(135,184,255,0.35) 55%,rgba(79,142,247,0.2) 70%,transparent 100%);
  animation:drift linear infinite; }
.dr-caustics span:nth-child(1) { top:12%; animation-duration:14s; animation-delay:0s;   opacity:.6; }
.dr-caustics span:nth-child(2) { top:31%; animation-duration:18s; animation-delay:-5s;  opacity:.4; }
.dr-caustics span:nth-child(3) { top:55%; animation-duration:22s; animation-delay:-9s;  opacity:.5; }
.dr-caustics span:nth-child(4) { top:73%; animation-duration:16s; animation-delay:-12s; opacity:.3; }
.dr-caustics span:nth-child(5) { top:88%; animation-duration:20s; animation-delay:-3s;  opacity:.4; }
@keyframes drift { 0%{transform:translateX(-60%) scaleX(.7);} 50%{transform:translateX(20%) scaleX(1.2);} 100%{transform:translateX(80%) scaleX(.8);} }

/* Header */
.dr-header { position:relative; z-index:30; display:flex; align-items:center; justify-content:space-between; padding:0 2.4rem; height:68px; border-bottom:1px solid var(--border); background:rgba(7,14,34,0.72); backdrop-filter:blur(18px); }
.dr-brand  { display:flex; align-items:center; gap:.85rem; }
.dr-brand-text { display:flex; flex-direction:column; line-height:1; gap:3px; }
.dr-brand-name { font-family:'Cinzel',serif; font-size:.88rem; font-weight:600; letter-spacing:.2em; color:var(--sky-l); white-space:nowrap; }
.dr-brand-tag  { font-size:.48rem; letter-spacing:.38em; color:var(--muted); text-transform:uppercase; font-weight:300; }
.dr-header-right { display:flex; align-items:center; gap:.7rem; }
.dr-edit-btn { font-family:'DM Sans',sans-serif; font-size:.72rem; letter-spacing:.09em; color:var(--amber); background:rgba(240,168,64,0.08); border:1px solid rgba(240,168,64,0.25); border-radius:5px; padding:.38rem 1rem; cursor:pointer; transition:all .2s; }
.dr-edit-btn:hover  { background:rgba(240,168,64,0.15); border-color:rgba(240,168,64,0.5); }
.dr-edit-btn.active { background:rgba(240,168,64,0.18); border-color:rgba(240,168,64,0.55); color:#F7C870; }

/* Hero */
.dr-hero { position:relative; z-index:10; text-align:center; padding:3rem 1rem 0; }
.dr-hero-eyebrow { font-family:'Cinzel',serif; font-size:.56rem; letter-spacing:.55em; color:var(--muted); margin-bottom:.7rem; }
.dr-hero-title { font-family:'Cormorant Garamond',serif; font-size:clamp(2.2rem,5vw,3.2rem); font-weight:700; line-height:1; color:#fff; letter-spacing:.02em; }
.dr-hero-title em { font-style:normal; background:linear-gradient(135deg,var(--sky-l),var(--sky)); -webkit-background-clip:text; -webkit-text-fill-color:transparent; background-clip:text; }
.dr-hero-rule { width:52px; height:2px; margin:1.3rem auto 0; background:linear-gradient(90deg,transparent,var(--sky),transparent); }

/* Main */
.dr-main { position:relative; z-index:10; display:flex; flex-direction:column; align-items:center; padding:2rem 1.2rem 4rem; }

/* Card */
.dr-card { width:100%; max-width:588px; background:var(--surface); border:1px solid var(--border); border-radius:16px; padding:2.6rem 2.6rem 2.2rem; backdrop-filter:blur(24px);
  box-shadow:0 0 0 1px rgba(30,63,160,0.12),0 30px 80px rgba(5,10,30,0.7),inset 0 1px 0 rgba(135,184,255,0.07); margin-top:2rem; }

/* Progress */
.dr-prog-track { height:2px; background:rgba(255,255,255,0.05); border-radius:99px; overflow:hidden; margin-bottom:.45rem; }
.dr-prog-fill  { height:100%; border-radius:99px; background:linear-gradient(90deg,var(--royal-l),var(--sky),var(--sky-l)); box-shadow:0 0 10px rgba(79,142,247,0.7); transition:width .45s cubic-bezier(.4,0,.2,1); }
.dr-prog-label { font-family:'Cinzel',serif; font-size:.56rem; letter-spacing:.28em; color:var(--muted); margin-bottom:2.2rem; }

/* Question */
.dr-q-wrap { margin-bottom:2rem; }
.dr-q-num  { font-family:'Cinzel',serif; font-size:.6rem; letter-spacing:.3em; color:var(--sky); margin-bottom:.55rem; }
.dr-q-text { font-family:'Cormorant Garamond',serif; font-size:1.55rem; font-weight:600; color:#EEF3FF; line-height:1.3; margin-bottom:1.6rem; }
.dr-field  { position:relative; }
.dr-prefix { position:absolute; left:1rem; top:50%; transform:translateY(-50%); color:var(--sky); font-family:'Cormorant Garamond',serif; font-size:1.1rem; pointer-events:none; }
.dr-input  { width:100%; background:rgba(10,24,72,0.55); border:1px solid rgba(79,142,247,0.22); border-radius:8px; padding:1rem 1.2rem; color:var(--text); font-size:1.05rem; font-family:'Cormorant Garamond',serif; outline:none; transition:border-color .2s,box-shadow .2s; }
.dr-input:focus { border-color:rgba(79,142,247,0.55); box-shadow:0 0 0 3px rgba(79,142,247,0.1),0 0 24px rgba(30,63,160,0.25); }
.dr-input::placeholder { color:rgba(135,184,255,0.18); }
.dr-input[type="date"]::-webkit-calendar-picker-indicator { filter:invert(.55) sepia(1) hue-rotate(195deg); opacity:.6; cursor:pointer; }
.dr-err { color:#FF7070; font-size:.72rem; margin-top:.5rem; letter-spacing:.05em; }

/* Nav */
.dr-nav { display:flex; gap:.9rem; justify-content:flex-end; margin-bottom:1.8rem; margin-top:.2rem; }
.dr-btn-back { background:transparent; border:1px solid rgba(79,142,247,0.18); color:var(--muted); padding:.72rem 1.5rem; border-radius:7px; cursor:pointer; font-size:.82rem; font-family:'DM Sans',sans-serif; letter-spacing:.05em; transition:all .2s; }
.dr-btn-back:hover { color:var(--sky-l); border-color:rgba(79,142,247,0.4); }
.dr-btn-next { background:linear-gradient(135deg,var(--royal),var(--royal-l),var(--sky)); border:none; color:#fff; padding:.72rem 2rem; border-radius:7px; cursor:pointer; font-size:.85rem; font-family:'Cinzel',serif; font-weight:600; letter-spacing:.1em; box-shadow:0 6px 24px rgba(27,63,160,0.5); transition:box-shadow .25s,transform .2s; }
.dr-btn-next:hover    { box-shadow:0 8px 32px rgba(27,63,160,0.75); transform:translateY(-1px); }
.dr-btn-next:disabled { opacity:.6; cursor:not-allowed; transform:none; }

/* Summary */
.dr-summary    { border-top:1px solid rgba(79,142,247,0.1); padding-top:1.4rem; }
.dr-summary-hd { font-family:'Cinzel',serif; font-size:.52rem; letter-spacing:.32em; color:rgba(135,184,255,0.28); margin-bottom:.8rem; }
.dr-sum-row { display:flex; justify-content:space-between; align-items:center; padding:.28rem 0; font-size:.82rem; }
.dr-sum-k { color:var(--muted); font-style:italic; }
.dr-sum-v { color:var(--sky); font-family:'Cormorant Garamond',serif; font-weight:600; font-size:.95rem; }

/* Success */
.dr-success { width:100%; max-width:588px; margin-top:2rem; background:var(--surface); border:1px solid var(--border); border-radius:16px; padding:3rem 2.5rem; text-align:center; backdrop-filter:blur(24px); box-shadow:0 30px 80px rgba(5,10,30,0.7); animation:fadeUp .4s ease forwards; }
.dr-success-orb { width:76px; height:76px; border-radius:50%; margin:0 auto 1.6rem; background:linear-gradient(135deg,var(--royal),var(--sky)); display:flex; align-items:center; justify-content:center; font-size:2.1rem; color:#fff; box-shadow:0 0 0 12px rgba(79,142,247,0.1),0 0 40px rgba(27,63,160,0.5); animation:orbPulse 2.5s ease-in-out infinite; }
@keyframes orbPulse { 0%,100%{box-shadow:0 0 0 12px rgba(79,142,247,0.08),0 0 30px rgba(27,63,160,0.4);} 50%{box-shadow:0 0 0 18px rgba(79,142,247,0.15),0 0 60px rgba(27,63,160,0.7);} }
.dr-success-title { font-family:'Cormorant Garamond',serif; font-size:2.1rem; font-weight:700; color:#fff; margin-bottom:.45rem; }
.dr-success-sub   { color:var(--muted); font-size:.85rem; font-style:italic; margin-bottom:2rem; }
.dr-receipt { border-top:1px solid var(--border); border-bottom:1px solid var(--border); padding:1.4rem 0; margin-bottom:2rem; display:flex; flex-direction:column; gap:.65rem; text-align:left; }
.dr-receipt-row { display:flex; justify-content:space-between; font-size:.85rem; }
.dr-receipt-k { color:var(--muted); font-style:italic; }
.dr-receipt-v { color:var(--sky); font-family:'Cormorant Garamond',serif; font-weight:600; }
.dr-success-btns { display:flex; gap:.8rem; justify-content:center; flex-wrap:wrap; }
.dr-btn-reset { background:transparent; border:1px solid rgba(79,142,247,0.22); color:rgba(135,184,255,0.6); padding:.72rem 2rem; border-radius:7px; cursor:pointer; font-family:'Cinzel',serif; font-size:.78rem; letter-spacing:.14em; transition:all .2s; }
.dr-btn-reset:hover { border-color:rgba(79,142,247,0.5); color:var(--sky-l); background:rgba(79,142,247,0.08); }
.dr-btn-edit-report { background:rgba(240,168,64,0.1); border:1px solid rgba(240,168,64,0.3); color:var(--amber); padding:.72rem 2rem; border-radius:7px; cursor:pointer; font-family:'Cinzel',serif; font-size:.78rem; letter-spacing:.14em; transition:all .2s; }
.dr-btn-edit-report:hover { background:rgba(240,168,64,0.2); border-color:rgba(240,168,64,0.55); }

/* Edit Mode */
.dr-edit-card { width:100%; max-width:588px; margin-top:2rem; background:var(--surface); border:1px solid rgba(240,168,64,0.22); border-radius:16px; overflow:hidden; backdrop-filter:blur(24px); box-shadow:0 0 0 1px rgba(240,168,64,0.08),0 30px 80px rgba(5,10,30,0.7); animation:fadeUp .35s ease forwards; }
.dr-edit-header { padding:1.8rem 2.4rem 1.4rem; border-bottom:1px solid rgba(240,168,64,0.12); }
.dr-edit-badge  { display:inline-flex; align-items:center; gap:.4rem; font-family:'Cinzel',serif; font-size:.55rem; letter-spacing:.3em; color:var(--amber); background:rgba(240,168,64,0.1); border:1px solid rgba(240,168,64,0.2); border-radius:99px; padding:.25rem .75rem; margin-bottom:.9rem; }
.dr-edit-title  { font-family:'Cormorant Garamond',serif; font-size:1.7rem; font-weight:700; color:#EEF3FF; margin-bottom:.3rem; }
.dr-edit-sub    { color:var(--muted); font-size:.8rem; font-style:italic; }

.dr-date-row   { padding:1.2rem 2.4rem; border-bottom:1px solid rgba(79,142,247,0.1); display:flex; align-items:center; gap:1rem; flex-wrap:wrap; }
.dr-date-label { font-family:'Cinzel',serif; font-size:.6rem; letter-spacing:.2em; color:var(--muted); white-space:nowrap; }
.dr-date-input { background:rgba(10,24,72,0.55); border:1px solid rgba(79,142,247,0.22); border-radius:7px; padding:.55rem .9rem; color:var(--text); font-size:.88rem; font-family:'Cormorant Garamond',serif; outline:none; transition:border-color .2s; }
.dr-date-input:focus { border-color:rgba(79,142,247,0.5); }
.dr-date-input[type="date"]::-webkit-calendar-picker-indicator { filter:invert(.55) sepia(1) hue-rotate(195deg); opacity:.6; cursor:pointer; }
.dr-fetch-btn { background:rgba(79,142,247,0.12); border:1px solid rgba(79,142,247,0.28); color:var(--sky-l); padding:.55rem 1.1rem; border-radius:7px; cursor:pointer; font-size:.75rem; font-family:'Cinzel',serif; letter-spacing:.08em; transition:all .2s; white-space:nowrap; }
.dr-fetch-btn:hover { background:rgba(79,142,247,0.22); border-color:rgba(79,142,247,0.5); }
.dr-fetch-btn:disabled { opacity:.5; cursor:not-allowed; }

.dr-fields-list { padding:1.4rem 2.4rem; }
.dr-field-row   { display:flex; align-items:center; gap:1rem; padding:.75rem 0; border-bottom:1px solid rgba(79,142,247,0.07); }
.dr-field-row:last-child { border-bottom:none; }
.dr-field-label { font-size:.78rem; color:var(--muted); width:160px; flex-shrink:0; font-style:italic; }
.dr-field-input-wrap { flex:1; position:relative; }
.dr-field-pfx  { position:absolute; left:.75rem; top:50%; transform:translateY(-50%); color:var(--sky); font-size:.9rem; pointer-events:none; font-family:'Cormorant Garamond',serif; }
.dr-field-input { width:100%; background:rgba(10,24,72,0.5); border:1px solid rgba(79,142,247,0.18); border-radius:7px; padding:.6rem .9rem; color:var(--text); font-size:.95rem; font-family:'Cormorant Garamond',serif; outline:none; transition:border-color .2s,box-shadow .2s; }
.dr-field-input:focus   { border-color:rgba(79,142,247,0.5); box-shadow:0 0 0 3px rgba(79,142,247,0.08); }
.dr-field-input.changed { border-color:rgba(240,168,64,0.45); background:rgba(240,168,64,0.05); }
.dr-field-input[type="date"]::-webkit-calendar-picker-indicator { filter:invert(.55) sepia(1) hue-rotate(195deg); opacity:.6; cursor:pointer; }
.dr-changed-dot   { width:6px; height:6px; border-radius:50%; background:var(--amber); flex-shrink:0; }
.dr-unchanged-dot { width:6px; height:6px; flex-shrink:0; }

.dr-edit-footer { padding:1.4rem 2.4rem; border-top:1px solid rgba(79,142,247,0.1); display:flex; align-items:center; justify-content:space-between; gap:1rem; flex-wrap:wrap; }
.dr-edit-info   { font-size:.72rem; color:var(--muted); font-style:italic; }
.dr-edit-info strong { color:var(--amber); }
.dr-edit-footer-btns { display:flex; gap:.75rem; }
.dr-btn-cancel-edit  { background:transparent; border:1px solid rgba(79,142,247,0.18); color:var(--muted); padding:.6rem 1.3rem; border-radius:7px; cursor:pointer; font-size:.78rem; font-family:'DM Sans',sans-serif; transition:all .2s; }
.dr-btn-cancel-edit:hover { color:var(--sky-l); border-color:rgba(79,142,247,0.4); }
.dr-btn-save-edit  { background:linear-gradient(135deg,#8A5F0A,var(--amber)); border:none; color:#fff; padding:.6rem 1.6rem; border-radius:7px; cursor:pointer; font-family:'Cinzel',serif; font-size:.78rem; font-weight:600; letter-spacing:.09em; box-shadow:0 4px 18px rgba(200,140,30,0.35); transition:all .2s; }
.dr-btn-save-edit:hover    { box-shadow:0 6px 24px rgba(200,140,30,0.55); transform:translateY(-1px); }
.dr-btn-save-edit:disabled { opacity:.5; cursor:not-allowed; transform:none; }

/* Toast */
.dr-toast { position:fixed; bottom:2rem; left:50%; transform:translateX(-50%); z-index:200; padding:.75rem 1.6rem; border-radius:8px; font-size:.82rem; font-family:'DM Sans',sans-serif; letter-spacing:.04em; animation:toastIn .3s ease forwards; pointer-events:none; white-space:nowrap; }
.dr-toast.success { background:rgba(79,207,160,0.15); border:1px solid rgba(79,207,160,0.35); color:#6FE8BC; }
.dr-toast.error   { background:rgba(255,107,107,0.15); border:1px solid rgba(255,107,107,0.35); color:#FF9090; }
.dr-toast.info    { background:rgba(79,142,247,0.15);  border:1px solid rgba(79,142,247,0.35);  color:var(--sky-l); }
@keyframes toastIn { from{opacity:0;transform:translateX(-50%) translateY(10px);} to{opacity:1;transform:translateX(-50%) translateY(0);} }

.dr-edit-empty { padding:2rem 2.4rem; color:var(--muted); font-size:.85rem; font-style:italic; text-align:center; }

.fade-up { animation:fadeUp .36s ease forwards; }
@keyframes fadeUp { from{opacity:0;transform:translateY(12px);} to{opacity:1;transform:translateY(0);} }
`;

/* ── Valyana Logo ── */
function ValyanaLogo() {
  return (
    <svg width="46" height="46" viewBox="0 0 46 46" fill="none">
      <defs>
        <radialGradient id="vwG" cx="50%" cy="35%" r="65%">
          <stop offset="0%" stopColor="#4F8EF7" stopOpacity="0.25"/>
          <stop offset="100%" stopColor="#0F2670" stopOpacity="0.05"/>
        </radialGradient>
        <linearGradient id="vwR" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#2E5AC8" stopOpacity="0.6"/>
          <stop offset="100%" stopColor="#4F8EF7" stopOpacity="0.2"/>
        </linearGradient>
      </defs>
      <circle cx="23" cy="23" r="22" stroke="url(#vwR)" strokeWidth="1" fill="url(#vwG)"/>
      <circle cx="23" cy="23" r="17" stroke="rgba(79,142,247,0.12)" strokeWidth="1" fill="none"/>
      <path d="M8 27 Q12 23 16 27 Q20 31 24 27 Q28 23 32 27 Q35 29 38 29.5" stroke="#87B8FF" strokeWidth="1.4" fill="none" strokeLinecap="round" opacity="0.8"/>
      <path d="M8 31 Q12 27 16 31 Q20 35 24 31 Q28 27 32 31 Q35 33 38 33.5" stroke="#4F8EF7" strokeWidth="1" fill="none" strokeLinecap="round" opacity="0.45"/>
      <path d="M16 13 L23 25 L30 13" stroke="#C0D8FF" strokeWidth="2.2" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
      <circle cx="23" cy="25.5" r="2.2" fill="#4F8EF7" opacity="0.95"/>
      <circle cx="23" cy="25.5" r="1" fill="#87B8FF"/>
    </svg>
  );
}

/* ── Toast ── */
function Toast({ msg, type }) {
  if (!msg) return null;
  return <div className={`dr-toast ${type}`}>{msg}</div>;
}

/* ── Edit Mode ── */
function EditMode({ lastAnswers, onDone, showToast }) {
  const today = () => new Date().toISOString().split("T")[0];
  const [editDate, setEditDate] = useState(lastAnswers?.date || today());
  const [original, setOriginal] = useState(lastAnswers || null);
  const [edited,   setEdited]   = useState(lastAnswers ? { ...lastAnswers } : null);
  const [fetching, setFetching] = useState(false);
  const [saving,   setSaving]   = useState(false);

  const changedFields = edited && original
    ? FIELDS.filter(f => String(edited[f.id]) !== String(original[f.id]))
    : [];

  const fetchRow = async () => {
    setFetching(true);
    try {
      const json = await sendToSheet({ action: "fetch", date: editDate });
      if (json.found) {
        const data = {};
        FIELDS.forEach((f, i) => { data[f.id] = json.row[i] ?? ""; });
        setOriginal({ ...data });
        setEdited({ ...data });
        showToast("Report loaded — make your changes below.", "info");
      } else {
        showToast("No report found for that date.", "error");
        setOriginal(null); setEdited(null);
      }
    } catch(err) {
      console.error(err);
      showToast("Could not fetch — redeploy your Apps Script with the updated code.", "error");
    }
    setFetching(false);
  };

  const saveEdit = async () => {
    if (!edited || changedFields.length === 0) { showToast("No changes to save.", "info"); return; }
    setSaving(true);
    try {
      await sendToSheet({ action: "update", date: editDate, row: FIELDS.map(f => edited[f.id] || "") });
      showToast(`${changedFields.length} field${changedFields.length > 1 ? "s" : ""} updated successfully.`, "success");
      setTimeout(onDone, 1800);
    } catch {
      showToast("Save failed — please try again.", "error");
    }
    setSaving(false);
  };

  return (
    <div className="dr-edit-card">
      <div className="dr-edit-header">
        <div className="dr-edit-badge">✏ EDIT MODE</div>
        <h2 className="dr-edit-title">Edit a Past Report</h2>
        <p className="dr-edit-sub">Select a date, load the report, update any field, then save.</p>
      </div>

      <div className="dr-date-row">
        <span className="dr-date-label">REPORT DATE</span>
        <input
          className="dr-date-input"
          type="date"
          value={editDate}
          onChange={e => { setEditDate(e.target.value); setOriginal(null); setEdited(null); }}
        />
        <button className="dr-fetch-btn" onClick={fetchRow} disabled={fetching}>
          {fetching ? "Loading…" : "Load Report →"}
        </button>
      </div>

      {edited ? (
        <>
          <div className="dr-fields-list">
            {FIELDS.filter(f => f.id !== "date").map(f => {
              const isChanged = String(edited[f.id]) !== String(original[f.id]);
              return (
                <div key={f.id} className="dr-field-row">
                  <span className="dr-field-label">{f.shortLabel}</span>
                  <div className="dr-field-input-wrap">
                    {f.prefix && <span className="dr-field-pfx">{f.prefix}</span>}
                    <input
                      className={`dr-field-input${isChanged ? " changed" : ""}`}
                      type={f.type}
                      value={edited[f.id]}
                      style={{ paddingLeft: f.prefix ? "1.8rem" : ".9rem" }}
                      onChange={e => setEdited(p => ({ ...p, [f.id]: e.target.value }))}
                    />
                  </div>
                  {isChanged ? <div className="dr-changed-dot" title="Changed" /> : <div className="dr-unchanged-dot" />}
                </div>
              );
            })}
          </div>
          <div className="dr-edit-footer">
            <p className="dr-edit-info">
              {changedFields.length > 0
                ? <><strong>{changedFields.length}</strong> field{changedFields.length > 1 ? "s" : ""} changed</>
                : "No changes yet"}
            </p>
            <div className="dr-edit-footer-btns">
              <button className="dr-btn-cancel-edit" onClick={onDone}>Cancel</button>
              <button className="dr-btn-save-edit" onClick={saveEdit} disabled={saving || changedFields.length === 0}>
                {saving ? "Saving…" : `Save ${changedFields.length > 0 ? `(${changedFields.length}) ` : ""}Changes →`}
              </button>
            </div>
          </div>
        </>
      ) : (
        <div className="dr-edit-empty">
          {fetching ? "Fetching report…" : "Select a date above and click Load Report"}
        </div>
      )}
    </div>
  );
}

/* ── Success Screen ── */
function SuccessScreen({ answers, onReset, onEdit }) {
  return (
    <div className="dr-success">
      <div className="dr-success-orb">✓</div>
      <h2 className="dr-success-title">Report Submitted</h2>
      <p className="dr-success-sub">Today's metrics have been recorded to your Daily Metrics sheet.</p>
      <div className="dr-receipt">
        {FIELDS.map(f => (
          <div key={f.id} className="dr-receipt-row">
            <span className="dr-receipt-k">{f.label}</span>
            <span className="dr-receipt-v">{f.prefix || ""}{answers[f.id]}</span>
          </div>
        ))}
      </div>
      <div className="dr-success-btns">
        <button className="dr-btn-reset" onClick={onReset}>+ New Report</button>
        <button className="dr-btn-edit-report" onClick={onEdit}>✏ Edit This Report</button>
      </div>
    </div>
  );
}

/* ── Main App ── */
export default function App() {
  const [step,       setStep]       = useState(0);
  const [answers,    setAnswers]    = useState({});
  const [inputVal,   setInputVal]   = useState("");
  const [error,      setError]      = useState("");
  const [submitted,  setSubmitted]  = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [editMode,   setEditMode]   = useState(false);
  const [animKey,    setAnimKey]    = useState(0);
  const [toast,      setToast]      = useState({ msg: "", type: "info" });
  const inputRef = useRef(null);

  const cur      = FIELDS[step];
  const progress = (step / FIELDS.length) * 100;
  const today    = () => new Date().toISOString().split("T")[0];

  const showToast = (msg, type = "info") => {
    setToast({ msg, type });
    setTimeout(() => setToast({ msg: "", type: "info" }), 3500);
  };

  useEffect(() => {
    setAnswers({ date: today() });
    setInputVal(today());
  }, []);

  useEffect(() => {
    setError("");
    setInputVal(answers[cur?.id] ?? (cur?.id === "date" ? today() : ""));
    setAnimKey(k => k + 1);
    setTimeout(() => inputRef.current?.focus(), 60);
  }, [step]);

  const validate = () => {
    if (inputVal === "" || inputVal == null) { setError("This field is required."); return false; }
    if (cur.type === "number" && isNaN(Number(inputVal))) { setError("Please enter a valid number."); return false; }
    return true;
  };

  const advance = () => {
    if (!validate()) return;
    const next = { ...answers, [cur.id]: inputVal };
    setAnswers(next);
    if (step < FIELDS.length - 1) { setStep(s => s + 1); }
    else { doSubmit(next); }
  };

  const back = () => { if (step > 0) setStep(s => s - 1); };

  const doSubmit = async (data) => {
    setSubmitting(true);
    try {
      await sendToSheet({ action: "append", row: FIELDS.map(f => data[f.id] || "") });
      showToast("Report sent to sheet ✓", "success");
    } catch (e) {
      showToast("Submit failed — check connection.", "error");
      console.error(e);
    }
    setTimeout(() => { setSubmitting(false); setSubmitted(true); }, 1000);
  };

  const reset = () => { setStep(0); setAnswers({}); setInputVal(""); setSubmitted(false); setEditMode(false); };

  return (
    <>
      <style>{STYLES}</style>
      <div className="dr-root">
        <div className="dr-bg" />
        <div className="dr-caustics"><span/><span/><span/><span/><span/></div>

        {/* Header */}
        <header className="dr-header">
          <div className="dr-brand">
            <ValyanaLogo />
            <div className="dr-brand-text">
              <span className="dr-brand-name">VALYANA WATERS</span>
              <span className="dr-brand-tag">Pure · Delivered · Daily</span>
            </div>
          </div>
          <div className="dr-header-right">
            <button
              className={`dr-edit-btn${editMode ? " active" : ""}`}
              onClick={() => { setEditMode(e => !e); setSubmitted(false); }}
            >
              {editMode ? "✕ Close Editor" : "✏ Edit Report"}
            </button>
          </div>
        </header>

        {/* Hero */}
        <div className="dr-hero">
          <p className="dr-hero-eyebrow">Operations · Internal Tool</p>
          <h1 className="dr-hero-title">Daily <em>Reporting</em> Form</h1>
          <div className="dr-hero-rule" />
        </div>

        {/* Content */}
        <main className="dr-main">
          {editMode ? (
            <EditMode
              lastAnswers={submitted ? answers : null}
              onDone={() => setEditMode(false)}
              showToast={showToast}
            />
          ) : !submitted ? (
            <div className="dr-card">
              <div className="dr-prog-track">
                <div className="dr-prog-fill" style={{ width: `${progress}%` }} />
              </div>
              <p className="dr-prog-label">QUESTION {step + 1} OF {FIELDS.length}</p>

              <div key={animKey} className="dr-q-wrap fade-up">
                <p className="dr-q-num">{String(step + 1).padStart(2, "0")} —</p>
                <h2 className="dr-q-text">{QUESTIONS[step]}</h2>
                <div className="dr-field">
                  {cur.prefix && <span className="dr-prefix">{cur.prefix}</span>}
                  <input
                    ref={inputRef}
                    className="dr-input"
                    type={cur.type}
                    value={inputVal}
                    placeholder={cur.placeholder}
                    style={{ paddingLeft: cur.prefix ? "2.1rem" : "1.2rem" }}
                    onChange={e => { setInputVal(e.target.value); setError(""); }}
                    onKeyDown={e => e.key === "Enter" && advance()}
                  />
                </div>
                {error && <p className="dr-err">{error}</p>}
              </div>

              <div className="dr-nav">
                {step > 0 && <button className="dr-btn-back" onClick={back}>← Back</button>}
                <button className="dr-btn-next" onClick={advance} disabled={submitting}>
                  {submitting ? "Submitting…" : step === FIELDS.length - 1 ? "Submit Report →" : "Next →"}
                </button>
              </div>

              {step > 0 && (
                <div className="dr-summary">
                  <p className="dr-summary-hd">ANSWERS SO FAR</p>
                  {FIELDS.slice(0, step).map(f => (
                    <div key={f.id} className="dr-sum-row">
                      <span className="dr-sum-k">{f.label}</span>
                      <span className="dr-sum-v">{f.prefix || ""}{answers[f.id]}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <SuccessScreen answers={answers} onReset={reset} onEdit={() => setEditMode(true)} />
          )}
        </main>

        <Toast msg={toast.msg} type={toast.type} />
      </div>
    </>
  );
}
