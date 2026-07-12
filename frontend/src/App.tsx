import React, { useState, useEffect, useRef } from "react";
import type { ScanReport } from "@web-inspectra/shared-types";
import DOMGraph from "./components/DOMGraph";
import DOMTreeViewer from "./components/DOMTreeViewer";
import WaterfallChart from "./components/WaterfallChart";
import ScoreGauge from "./components/ScoreGauge";

// ─── Inline SVG icons ──────────────────────────────────────────────────────
const I = {
  Pulse:    () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" className="w-full h-full"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>,
  Globe:    () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" className="w-full h-full"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>,
  Scan:     () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" className="w-full h-full"><path d="M3 7V5a2 2 0 0 1 2-2h2"/><path d="M17 3h2a2 2 0 0 1 2 2v2"/><path d="M21 17v2a2 2 0 0 1-2 2h-2"/><path d="M7 21H5a2 2 0 0 1-2-2v-2"/><line x1="3" y1="12" x2="21" y2="12"/></svg>,
  Shield:   () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" className="w-full h-full"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>,
  Code:     () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" className="w-full h-full"><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></svg>,
  Eye:      () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" className="w-full h-full"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>,
  Network:  () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" className="w-full h-full"><rect x="2" y="2" width="6" height="6" rx="1"/><rect x="16" y="2" width="6" height="6" rx="1"/><rect x="9" y="16" width="6" height="6" rx="1"/><path d="M5 8v4a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V8"/><line x1="12" y1="12" x2="12" y2="16"/></svg>,
  Stars:    () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" className="w-full h-full"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>,
  Dashboard:() => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" className="w-full h-full"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>,
  Check:    () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" className="w-full h-full"><polyline points="20 6 9 17 4 12"/></svg>,
  X:        () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="w-full h-full"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>,
  Refresh:  () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" className="w-full h-full"><polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 .49-4.14"/></svg>,
  ExtLink:  () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" className="w-full h-full"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>,
  Clock:    () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" className="w-full h-full"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>,
  Tree:     () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" className="w-full h-full"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>,
};

// ─── Loading steps ─────────────────────────────────────────────────────────
const STEPS = [
  { label: "Initializing scanner",    sub: "Setting up HTTP analyzer" },
  { label: "Fetching page HTML",      sub: "Loading target document" },
  { label: "Extracting resources",    sub: "Finding scripts, styles, images" },
  { label: "Probing network",         sub: "Measuring load timings" },
  { label: "Parsing DOM structure",   sub: "Building element tree" },
  { label: "Auditing accessibility",  sub: "Running WCAG checks" },
  { label: "Inspecting security",     sub: "Checking HTTP headers" },
  { label: "AI analysis",             sub: "Generating insights" },
];

type TabId = "overview" | "ai" | "vitals" | "dom" | "network" | "security";
type DomView = "graph" | "tree";

// ─── Real scoring ──────────────────────────────────────────────────────────
function calcRealScore(r: ScanReport) {
  // Performance score (0-100) — weighted composite
  const lcp    = r.performance.lcp;
  const fcp    = r.performance.fcp;
  const cls    = r.performance.cls;
  const tti    = r.performance.tti;
  const load   = r.performance.totalLoadTime;

  const lcpScore  = lcp  <= 2500 ? 100 : lcp  <= 4000 ? Math.round(100 - ((lcp - 2500) / 1500) * 50) : Math.max(0, Math.round(50 - ((lcp - 4000) / 4000) * 50));
  const fcpScore  = fcp  <= 1800 ? 100 : fcp  <= 3000 ? Math.round(100 - ((fcp - 1800) / 1200) * 50) : Math.max(0, Math.round(50 - ((fcp - 3000) / 3000) * 50));
  const clsScore  = cls  <= 0.1  ? 100 : cls  <= 0.25 ? Math.round(100 - ((cls - 0.1) / 0.15) * 60) : Math.max(0, 40 - Math.round((cls - 0.25) * 160));
  const ttiScore  = tti  <= 3800 ? 100 : tti  <= 7300 ? Math.round(100 - ((tti - 3800) / 3500) * 50) : Math.max(0, Math.round(50 - ((tti - 7300) / 7300) * 50));
  const loadScore = load <= 2000 ? 100 : load <= 5000 ? Math.round(100 - ((load - 2000) / 3000) * 50) : Math.max(0, Math.round(50 - ((load - 5000) / 5000) * 50));

  const perfScore = Math.round(lcpScore * 0.25 + fcpScore * 0.2 + clsScore * 0.15 + ttiScore * 0.2 + loadScore * 0.2);
  const a11y      = r.accessibility.score;
  const sec       = r.security.score;

  // DOM penalty
  const domPenalty = r.dom.nodeCount > 1500 ? Math.min(15, (r.dom.nodeCount - 1500) / 100) : 0;

  const overall = Math.round(Math.max(0, (perfScore * 0.5 + a11y * 0.3 + sec * 0.2) - domPenalty));
  return { overall, perf: perfScore, a11y, sec, lcp: lcpScore, fcp: fcpScore, cls: clsScore, tti: ttiScore };
}

const gradeInfo = (s: number) =>
  s >= 90 ? { grade: "A+", label: "Excellent",  color: "#34d399", glow: "rgba(52,211,153,0.15)"  } :
  s >= 80 ? { grade: "A",  label: "Very Good",  color: "#34d399", glow: "rgba(52,211,153,0.12)"  } :
  s >= 70 ? { grade: "B+", label: "Good",       color: "#38bdf8", glow: "rgba(56,189,248,0.12)"  } :
  s >= 60 ? { grade: "B",  label: "Fair",       color: "#38bdf8", glow: "rgba(56,189,248,0.10)"  } :
  s >= 50 ? { grade: "C",  label: "Needs Work", color: "#fbbf24", glow: "rgba(251,191,36,0.12)"  } :
  s >= 35 ? { grade: "D",  label: "Poor",       color: "#fb923c", glow: "rgba(251,146,60,0.12)"  } :
             { grade: "F",  label: "Critical",   color: "#f87171", glow: "rgba(248,113,113,0.12)" };

// ─── Reusable UI pieces ────────────────────────────────────────────────────
function SectionHead({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="text-[10px] uppercase tracking-[0.18em] text-slate-500 font-semibold mb-4 flex items-center gap-2">
      <span className="block w-3 h-px" style={{ background: "linear-gradient(90deg,#38bdf8,#a78bfa)" }} />
      {children}
    </h3>
  );
}

function Card({ children, className = "", style = {} }: { children: React.ReactNode; className?: string; style?: React.CSSProperties }) {
  return (
    <div className={`glass-card rounded-2xl ${className}`} style={style}>
      {children}
    </div>
  );
}

function StatChip({ value, label, color }: { value: string; label: string; color: string }) {
  return (
    <div className="flex flex-col items-center gap-1.5 px-4 py-3 rounded-xl glass-card">
      <span className="font-mono text-lg font-bold leading-none" style={{ color }}>{value}</span>
      <span className="text-[9px] uppercase tracking-widest text-slate-500 font-semibold">{label}</span>
    </div>
  );
}

function ImpactBadge({ impact }: { impact: "low" | "medium" | "high" }) {
  const cfg = impact === "high"
    ? { label: "High",   color: "#f87171", bg: "rgba(248,113,113,0.12)" }
    : impact === "medium"
    ? { label: "Medium", color: "#fbbf24", bg: "rgba(251,191,36,0.12)"  }
    : { label: "Low",    color: "#34d399", bg: "rgba(52,211,153,0.12)"  };
  return (
    <span className="text-[9px] font-mono font-bold uppercase px-2 py-0.5 rounded-full border flex-shrink-0"
      style={{ color: cfg.color, backgroundColor: cfg.bg, borderColor: `${cfg.color}30` }}>
      {cfg.label}
    </span>
  );
}

// ─── App ───────────────────────────────────────────────────────────────────
export default function App() {
  const [urlInput, setUrlInput] = useState("");
  const [urlError, setUrlError] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "done" | "error">("idle");
  const [stepIdx, setStepIdx] = useState(0);
  const [report, setReport] = useState<ScanReport | null>(null);
  const [error, setError] = useState("");
  const [tab, setTab] = useState<TabId>("overview");
  const [domView, setDomView] = useState<DomView>("graph");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (status !== "loading") return;
    setStepIdx(0);
    const id = setInterval(() => setStepIdx((p) => (p < STEPS.length - 2 ? p + 1 : p)), 3200);
    return () => clearInterval(id);
  }, [status]);

  const validateUrl = (value: string): string => {
    const v = value.trim();
    if (!v) return "";
    // Reject email addresses
    if (v.includes("@")) return "That looks like an email address — please enter a website URL like example.com";
    // Must resolve to something with a dot in the hostname
    try {
      const withProto = /^https?:\/\//i.test(v) ? v : `https://${v}`;
      const parsed = new URL(withProto);
      if (!parsed.hostname.includes(".")) return "Please enter a valid website URL like example.com";
    } catch {
      return "Invalid URL — try something like stripe.com or https://github.com";
    }
    return "";
  };

  const scan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!urlInput.trim()) return;
    const validationErr = validateUrl(urlInput);
    if (validationErr) { setUrlError(validationErr); return; }
    setStatus("loading"); setError(""); setReport(null);
    try {
      const res = await fetch("/api/scan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: urlInput.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || `Error ${res.status}`);
      setReport(data.report);
      setStatus("done");
      setTab("overview");
    } catch (err: any) {
      setError(err.message || "Scan failed. Is the backend running?");
      setStatus("error");
    }
  };

  const reset = () => { setStatus("idle"); setReport(null); setError(""); setUrlError(""); setTimeout(() => inputRef.current?.focus(), 80); };

  // ECG path for decoration
  const ecgPath = "M0,20 L15,20 L22,5 L32,35 L40,12 L50,28 L58,20 L80,20 L88,2 L98,38 L106,14 L114,25 L122,20 L150,20";

  /* ═══════════════════ IDLE / HERO ═════════════════════════════════════════ */
  if (status === "idle") return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 relative overflow-hidden" style={{ background: "#12121f" }}>
      {/* Dot grid */}
      <div className="fixed inset-0 pointer-events-none" style={{ backgroundImage: "radial-gradient(circle, rgba(255,255,255,0.055) 1px, transparent 1px)", backgroundSize: "26px 26px" }} />
      {/* Gradient orbs */}
      <div className="fixed pointer-events-none" style={{ top: "-15%", left: "-10%", width: "55vw", height: "55vw", background: "radial-gradient(circle, rgba(99,102,241,0.09) 0%, transparent 70%)", borderRadius: "50%" }} />
      <div className="fixed pointer-events-none" style={{ bottom: "-20%", right: "-10%", width: "50vw", height: "50vw", background: "radial-gradient(circle, rgba(56,189,248,0.07) 0%, transparent 70%)", borderRadius: "50%" }} />

      <div className="relative z-10 flex flex-col items-center text-center gap-0 animate-fade-up max-w-2xl w-full">
        {/* ECG decoration */}
        <div className="mb-7 opacity-25 w-[160px]">
          <svg viewBox="0 0 150 40" fill="none" className="w-full">
            <path d={ecgPath} stroke="url(#eg)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" strokeDasharray="600" strokeDashoffset="600" style={{ animation: "ecg 2.5s ease forwards" }} />
            <defs>
              <linearGradient id="eg" x1="0" y1="0" x2="150" y2="0">
                <stop stopColor="#38bdf8" /><stop offset="1" stopColor="#a78bfa" />
              </linearGradient>
            </defs>
          </svg>
        </div>

        {/* Pill */}
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full mb-5 text-[10px] font-mono font-semibold uppercase tracking-widest"
          style={{ background: "rgba(56,189,248,0.08)", border: "1px solid rgba(56,189,248,0.18)", color: "#38bdf8" }}>
          <span className="w-1.5 h-1.5 rounded-full bg-sky-400 blink inline-block" />
          Website Diagnostic Engine
        </div>

        {/* Title */}
        <h1 className="text-[clamp(44px,9vw,88px)] font-black leading-[0.95] tracking-tight mb-4">
          <span className="text-gradient">Web</span>
          <span className="text-white"> Inspectra</span>
        </h1>
        <p className="text-slate-400 text-[15px] max-w-md leading-relaxed mb-10">
          Full-spectrum diagnostic scan — performance, accessibility, security, DOM anatomy & AI-powered insights.
        </p>

        {/* Input */}
        <form onSubmit={scan} className="w-full">
          <div className="relative flex items-center rounded-2xl overflow-hidden" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)", boxShadow: "0 4px 24px rgba(0,0,0,0.3)" }}>
            <div className="absolute left-4 w-5 h-5 text-slate-500 pointer-events-none flex-shrink-0"><I.Globe /></div>
            <input
              ref={inputRef}
              type="text"
              value={urlInput}
              onChange={e => {
                setUrlInput(e.target.value);
                if (urlError) setUrlError(validateUrl(e.target.value));
              }}
              placeholder="Enter a website URL — stripe.com, github.com..."
              autoFocus
              className="w-full pl-11 pr-32 py-4 bg-transparent border-0 outline-none text-slate-200 placeholder-slate-600 text-sm font-mono input-glow"
              style={{ caretColor: "#38bdf8" }}
            />
            <button
              type="submit"
              disabled={!urlInput.trim()}
              className="absolute right-2 px-5 py-2.5 rounded-xl text-[11px] font-bold uppercase tracking-wider transition-all active:scale-95 disabled:opacity-30 disabled:cursor-not-allowed"
              style={{ background: "linear-gradient(135deg, #38bdf8, #a78bfa)", color: "#0d0d1f" }}
            >
              Scan
            </button>
          </div>
          {urlError && (
            <p className="mt-2 text-xs font-mono text-red-400 flex items-center gap-1.5 pl-1">
              <span>⚠</span> {urlError}
            </p>
          )}
        </form>

        {/* Feature tags */}
        <div className="flex flex-wrap justify-center gap-2 mt-8">
          {["Perf Vitals", "DOM Graph", "AI Doctor", "Security Audit", "A11y Check", "Network Waterfall", "Tech Stack"].map(f => (
            <span key={f} className="text-[11px] text-slate-600 px-3 py-1 rounded-full font-mono" style={{ border: "1px solid rgba(255,255,255,0.07)" }}>{f}</span>
          ))}
        </div>
      </div>
    </div>
  );

  /* ═══════════════════ LOADING ═════════════════════════════════════════════ */
  if (status === "loading") return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 gap-8" style={{ background: "#12121f" }}>
      <div className="fixed inset-0 pointer-events-none" style={{ backgroundImage: "radial-gradient(circle, rgba(255,255,255,0.05) 1px, transparent 1px)", backgroundSize: "26px 26px" }} />
      <div className="relative z-10 flex flex-col items-center gap-8 animate-fade-up">
        {/* Dual-ring spinner */}
        <div className="relative w-20 h-20">
          <svg viewBox="0 0 80 80" className="absolute inset-0 w-full h-full animate-spin-slow">
            <circle cx="40" cy="40" r="36" fill="none" stroke="rgba(56,189,248,0.1)" strokeWidth="2"/>
            <circle cx="40" cy="40" r="36" fill="none" stroke="rgba(56,189,248,0.7)" strokeWidth="2" strokeDasharray="16 210" strokeLinecap="round"/>
          </svg>
          <svg viewBox="0 0 80 80" className="absolute inset-0 w-full h-full" style={{ animation: "rotateSlow 1.8s linear infinite reverse" }}>
            <circle cx="40" cy="40" r="24" fill="none" stroke="rgba(167,139,250,0.12)" strokeWidth="2"/>
            <circle cx="40" cy="40" r="24" fill="none" stroke="rgba(167,139,250,0.8)" strokeWidth="2" strokeDasharray="8 142" strokeLinecap="round"/>
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: "rgba(56,189,248,0.1)", border: "1px solid rgba(56,189,248,0.2)" }}>
              <div className="w-5 h-5 text-sky-400"><I.Scan /></div>
            </div>
          </div>
        </div>

        <div className="text-center">
          <p className="text-slate-300 font-semibold">{STEPS[stepIdx].label}</p>
          <p className="text-slate-600 text-xs font-mono mt-1">{STEPS[stepIdx].sub}</p>
        </div>

        {/* Steps */}
        <div className="w-72 space-y-2">
          {STEPS.map((s, i) => (
            <div key={i} className="flex items-center gap-3">
              <div className={`w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0 transition-all duration-500 ${i < stepIdx ? "bg-emerald-500/20 text-emerald-400" : i === stepIdx ? "bg-violet-500/20 text-violet-400" : ""}`}
                style={{ border: i < stepIdx ? "1px solid rgba(52,211,153,0.3)" : i === stepIdx ? "1px solid rgba(167,139,250,0.3)" : "1px solid rgba(255,255,255,0.07)" }}>
                {i < stepIdx
                  ? <span className="w-2.5 h-2.5 text-emerald-400"><I.Check /></span>
                  : i === stepIdx
                  ? <span className="w-1.5 h-1.5 rounded-full bg-violet-400 blink inline-block" />
                  : <span className="w-1.5 h-1.5 rounded-full bg-slate-700 inline-block" />}
              </div>
              <span className={`text-xs font-mono transition-colors ${i < stepIdx ? "text-slate-600 line-through" : i === stepIdx ? "text-slate-300" : "text-slate-700"}`}>{s.label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  /* ═══════════════════ ERROR ═══════════════════════════════════════════════ */
  if (status === "error") return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 gap-6" style={{ background: "#12121f" }}>
      <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-rose-400"
        style={{ background: "rgba(248,113,113,0.1)", border: "1px solid rgba(248,113,113,0.2)" }}>
        <div className="w-7 h-7"><I.X /></div>
      </div>
      <div className="text-center max-w-md">
        <h3 className="text-rose-400 font-bold text-lg mb-2">Scan Failed</h3>
        <p className="text-slate-500 text-sm font-mono leading-relaxed">{error}</p>
      </div>
      <button onClick={reset}
        className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all hover:scale-105"
        style={{ background: "rgba(248,113,113,0.1)", border: "1px solid rgba(248,113,113,0.25)", color: "#f87171" }}>
        <span className="w-4 h-4"><I.Refresh /></span> Try Again
      </button>
    </div>
  );

  /* ═══════════════════ RESULTS ═════════════════════════════════════════════ */
  if (status !== "done" || !report) return null;

  const scores = calcRealScore(report);
  const { grade, label: gradeLabel, color: gradeColor, glow: gradeGlow } = gradeInfo(scores.overall);
  const loadS = (report.performance.totalLoadTime / 1000).toFixed(2);
  const sizeStr = report.performance.totalTransferSize > 1024 * 1024
    ? `${(report.performance.totalTransferSize / 1024 / 1024).toFixed(1)} MB`
    : `${Math.round(report.performance.totalTransferSize / 1024)} KB`;

  const TABS: { id: TabId; label: string; icon: React.ReactNode }[] = [
    { id: "overview", label: "Overview",  icon: <I.Dashboard /> },
    { id: "ai",       label: "AI Doctor", icon: <I.Stars />     },
    { id: "vitals",   label: "Vitals",    icon: <I.Pulse />     },
    { id: "dom",      label: "DOM",       icon: <I.Code />      },
    { id: "network",  label: "Network",   icon: <I.Network />   },
    { id: "security", label: "Security",  icon: <I.Shield />    },
  ];

  return (
    <div className="min-h-screen" style={{ background: "#12121f" }}>
      {/* Dot grid */}
      <div className="fixed inset-0 pointer-events-none" style={{ backgroundImage: "radial-gradient(circle, rgba(255,255,255,0.05) 1px, transparent 1px)", backgroundSize: "26px 26px" }} />

      <div className="relative z-10 max-w-[1200px] mx-auto px-4 sm:px-6 pb-24 pt-6">

        {/* ── Top bar ── */}
        <div className="flex items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 text-sky-400"
              style={{ background: "rgba(56,189,248,0.1)", border: "1px solid rgba(56,189,248,0.2)" }}>
              <div className="w-4 h-4"><I.Globe /></div>
            </div>
            <div className="min-w-0">
              <p className="text-sm font-mono font-semibold text-slate-200 truncate">{report.url}</p>
              <p className="text-[10px] text-slate-600 font-mono">{(() => { try { return new Date(report.scannedAt).toLocaleString(); } catch { return report.scannedAt; } })()}</p>
            </div>
          </div>
          <button onClick={reset}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-mono font-semibold transition-all hover:bg-white/5 flex-shrink-0"
            style={{ border: "1px solid rgba(255,255,255,0.09)", color: "#64748b" }}>
            <span className="w-3.5 h-3.5"><I.Refresh /></span> New Scan
          </button>
        </div>

        {/* ── Tab nav ── */}
        <div className="flex gap-0 mb-6 overflow-x-auto" style={{ borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
          {TABS.map(({ id, label, icon }) => (
            <button key={id} onClick={() => setTab(id)}
              className={`flex items-center gap-1.5 px-4 py-3 text-[11px] font-semibold uppercase tracking-widest whitespace-nowrap transition-all relative ${tab === id ? "text-sky-400 tab-active" : "text-slate-600 hover:text-slate-400"}`}>
              <span className="w-3.5 h-3.5 flex-shrink-0">{icon}</span>
              {label}
            </button>
          ))}
        </div>

        {/* ══════════════ OVERVIEW ══════════════ */}
        {tab === "overview" && (
          <div className="grid grid-cols-12 gap-4 animate-fade-up">
            {/* Grade card */}
            <div className="col-span-12 md:col-span-4 rounded-2xl p-6 flex flex-col items-center text-center gap-3 relative overflow-hidden"
              style={{ background: `radial-gradient(ellipse at 50% -20%, ${gradeGlow}, rgba(30,30,58,0.6) 60%)`, border: `1px solid ${gradeColor}22` }}>
              <div className="text-[10px] uppercase tracking-widest font-semibold text-slate-500">Overall Health Score</div>
              <div className="font-black leading-none font-mono" style={{ fontSize: 72, color: gradeColor }}>{grade}</div>
              <div className="text-sm font-semibold" style={{ color: gradeColor }}>{gradeLabel}</div>
              <div className="text-3xl font-black font-mono text-slate-200">{scores.overall}<span className="text-slate-600 text-lg">/100</span></div>
              <div className="w-full h-px" style={{ background: `linear-gradient(90deg, transparent, ${gradeColor}40, transparent)` }} />
              {/* Sub scores */}
              <div className="grid grid-cols-3 gap-2 w-full">
                {[
                  { label: "Perf",  val: scores.perf, color: "#38bdf8" },
                  { label: "A11y",  val: scores.a11y, color: "#34d399" },
                  { label: "Sec",   val: scores.sec,  color: "#a78bfa" },
                ].map(({ label, val, color }) => (
                  <div key={label} className="text-center">
                    <div className="font-mono text-base font-bold" style={{ color }}>{val}</div>
                    <div className="text-[9px] text-slate-600 uppercase font-semibold">{label}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Right side */}
            <div className="col-span-12 md:col-span-8 flex flex-col gap-4">
              {/* Stat chips */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <StatChip value={`${loadS}s`} label="Load Time"  color="#38bdf8" />
                <StatChip value={`${report.performance.resourceCount}`} label="Requests" color="#a78bfa" />
                <StatChip value={`${report.accessibility.score}`} label="A11y"    color="#34d399" />
                <StatChip value={sizeStr}  label="Page Size" color="#fbbf24" />
              </div>

              {/* AI prognosis */}
              <div className="flex-1 rounded-2xl p-5"
                style={{ background: "rgba(167,139,250,0.05)", border: "1px solid rgba(167,139,250,0.14)" }}>
                <div className="flex items-center gap-2 mb-3">
                  <span className="w-4 h-4 text-violet-400"><I.Stars /></span>
                  <span className="text-[10px] uppercase tracking-widest font-semibold text-violet-400">AI Prognosis</span>
                </div>
                <p className="text-sm text-slate-400 leading-relaxed">
                  {report.aiSummary?.overallHealth || "Add GEMINI_API_KEY to backend/.env to enable AI analysis."}
                </p>
              </div>
            </div>

            {/* Tech stack */}
            <div className="col-span-12">
              <Card className="p-5">
                <SectionHead>Detected Technology Stack</SectionHead>
                <div className="flex flex-wrap gap-2">
                  {report.techStack.hosting && report.techStack.hosting !== "Unknown" && (
                    <span className="px-3 py-1.5 rounded-lg text-xs font-mono font-semibold" style={{ background: "rgba(56,189,248,0.1)", border: "1px solid rgba(56,189,248,0.22)", color: "#38bdf8" }}>
                      ☁ {report.techStack.hosting}
                    </span>
                  )}
                  {[...report.techStack.frameworks, ...report.techStack.cssLibraries, ...report.techStack.analytics, ...report.techStack.other].map((t, i) => (
                    <span key={i} className="px-3 py-1.5 rounded-lg text-xs font-mono font-semibold" style={{ background: "rgba(167,139,250,0.08)", border: "1px solid rgba(167,139,250,0.18)", color: "#a78bfa" }}>{t}</span>
                  ))}
                  {!report.techStack.frameworks.length && !report.techStack.cssLibraries.length && (
                    <span className="text-slate-600 text-xs italic font-mono">No frameworks detected — vanilla stack</span>
                  )}
                </div>
              </Card>
            </div>

            {/* Top findings */}
            <div className="col-span-12">
              <SectionHead>Top Priority Issues</SectionHead>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {(report.aiSummary?.findings?.slice(0, 3) || []).map((f, i) => (
                  <Card key={i} className="p-4 flex flex-col gap-3">
                    <div className="flex items-start justify-between gap-2">
                      <ImpactBadge impact={f.impact} />
                      <span className="text-[9px] font-mono text-slate-600 uppercase tracking-widest">{f.category}</span>
                    </div>
                    <p className="text-xs font-semibold text-slate-300">{f.title}</p>
                    <p className="text-[11px] text-slate-500 leading-relaxed flex-1">{f.explanation.substring(0, 130)}{f.explanation.length > 130 ? "…" : ""}</p>
                    <button onClick={() => setTab("ai")} className="text-[10px] font-mono self-start transition-colors" style={{ color: "#38bdf8" }}>
                      Full details →
                    </button>
                  </Card>
                ))}
                {!report.aiSummary?.findings?.length && (
                  <div className="col-span-3 text-center py-10 text-slate-600 text-sm">Add GEMINI_API_KEY to backend/.env for AI findings</div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ══════════════ AI DOCTOR ══════════════ */}
        {tab === "ai" && (
          <div className="flex flex-col gap-5 animate-fade-up">
            <div className="rounded-2xl p-6" style={{ background: "linear-gradient(135deg, rgba(167,139,250,0.07), rgba(56,189,248,0.04))", border: "1px solid rgba(167,139,250,0.16)" }}>
              <div className="flex items-center gap-2 mb-3">
                <span className="w-5 h-5 text-violet-400"><I.Stars /></span>
                <span className="text-[10px] uppercase tracking-widest font-semibold text-violet-400">AI Chief Medical Officer</span>
              </div>
              <p className="text-slate-300 leading-relaxed">{report.aiSummary?.overallHealth || "Enable AI by adding GEMINI_API_KEY to backend/.env"}</p>
            </div>

            <SectionHead>Diagnostic Findings ({report.aiSummary?.findings?.length || 0})</SectionHead>
            <div className="flex flex-col gap-3">
              {(report.aiSummary?.findings || []).map((f, i) => (
                <Card key={i} className="p-5 flex gap-5 items-start">
                  <div className="w-6 h-6 rounded-lg flex items-center justify-center flex-shrink-0 font-mono text-xs font-bold"
                    style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.09)", color: "#475569" }}>
                    {i + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-2">
                      <ImpactBadge impact={f.impact} />
                      <span className="text-[9px] font-mono text-slate-600 uppercase tracking-widest">{f.category}</span>
                    </div>
                    <h4 className="text-sm font-semibold text-slate-200 mb-1.5">{f.title}</h4>
                    <p className="text-xs text-slate-400 leading-relaxed">{f.explanation}</p>
                  </div>
                </Card>
              ))}
              {!report.aiSummary?.findings?.length && (
                <div className="text-center py-16 text-slate-600">
                  <div className="w-8 h-8 mx-auto mb-3 opacity-20 text-slate-500"><I.Stars /></div>
                  <p className="text-sm">No AI findings — add GEMINI_API_KEY to backend/.env</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ══════════════ VITALS ══════════════ */}
        {tab === "vitals" && (
          <div className="flex flex-col gap-6 animate-fade-up">
            <SectionHead>Core Web Vitals (Real Scores)</SectionHead>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
              {[
                { label: "LCP",  score: scores.lcp,  sub: `${(report.performance.lcp/1000).toFixed(2)}s · Largest Paint` },
                { label: "FCP",  score: scores.fcp,  sub: `${(report.performance.fcp/1000).toFixed(2)}s · First Paint` },
                { label: "CLS",  score: scores.cls,  sub: `${report.performance.cls.toFixed(3)} · Layout Shift` },
                { label: "TTI",  score: scores.tti,  sub: `${(report.performance.tti/1000).toFixed(2)}s · Interactive` },
                { label: "Perf", score: scores.perf, sub: "Composite Score" },
              ].map(({ label, score, sub }) => (
                <Card key={label} className="p-4 flex flex-col items-center gap-3">
                  <ScoreGauge score={score} label={label} subtitle={sub} size={88} />
                </Card>
              ))}
            </div>

            {/* Summary cards */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              {[
                { icon: <I.Clock />, val: `${loadS}s`,      label: "Total Load Time",  color: "#38bdf8" },
                { icon: <I.Network/>, val: `${report.performance.resourceCount}`, label: "Total Requests", color: "#a78bfa" },
                { icon: <I.Eye />,  val: sizeStr,            label: "Transfer Size",    color: "#34d399" },
              ].map(({ icon, val, label, color }) => (
                <Card key={label} className="flex items-center gap-4 p-4">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{ background: `${color}12`, border: `1px solid ${color}20`, color }}>
                    <div className="w-5 h-5">{icon}</div>
                  </div>
                  <div>
                    <p className="font-mono text-lg font-bold text-slate-200">{val}</p>
                    <p className="text-[9px] uppercase tracking-widest text-slate-500">{label}</p>
                  </div>
                </Card>
              ))}
            </div>

            {/* AI performance notes */}
            {(report.aiSummary?.findings?.filter(f => f.category.toLowerCase() === "performance").length ?? 0) > 0 && (
              <Card className="p-5">
                <SectionHead>AI Performance Notes</SectionHead>
                <div className="flex flex-col gap-4">
                  {report.aiSummary?.findings?.filter(f => f.category.toLowerCase() === "performance").map((f, i) => (
                    <div key={i} className="flex gap-3 items-start">
                      <ImpactBadge impact={f.impact} />
                      <div>
                        <p className="text-xs font-semibold text-slate-300 mb-1">{f.title}</p>
                        <p className="text-xs text-slate-500 leading-relaxed">{f.explanation}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            )}
          </div>
        )}

        {/* ══════════════ DOM ══════════════ */}
        {tab === "dom" && (
          <div className="flex flex-col gap-4 animate-fade-up">
            {/* View toggle + stats */}
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div className="flex gap-1 p-1 rounded-xl" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
                {(["graph", "tree"] as DomView[]).map((v) => (
                  <button key={v} onClick={() => setDomView(v)}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-[11px] font-semibold uppercase tracking-widest transition-all ${domView === v ? "text-sky-400" : "text-slate-600 hover:text-slate-400"}`}
                    style={domView === v ? { background: "rgba(56,189,248,0.1)", border: "1px solid rgba(56,189,248,0.2)" } : {}}>
                    <span className="w-3.5 h-3.5">{v === "graph" ? <I.Network /> : <I.Tree />}</span>
                    {v === "graph" ? "Node Graph" : "Tree View"}
                  </button>
                ))}
              </div>
              <div className="flex gap-4">
                {[
                  { label: "Nodes", val: report.dom.nodeCount, warn: report.dom.nodeCount > 1500 },
                  { label: "Depth", val: `${report.dom.maxDepth} lvl`, warn: report.dom.maxDepth > 32 },
                ].map(({ label, val, warn }) => (
                  <div key={label} className="text-center">
                    <p className={`font-mono font-bold text-lg leading-none ${warn ? "text-rose-400" : "text-slate-200"}`}>{val}</p>
                    <p className="text-[9px] uppercase tracking-widest text-slate-500">{label}</p>
                    {warn && <p className="text-[9px] text-rose-500">⚠ Bloated</p>}
                  </div>
                ))}
              </div>
            </div>

            {/* Graph view */}
            {domView === "graph" && (
              <div style={{ height: 520 }}>
                <DOMGraph node={report.dom.tree} />
              </div>
            )}

            {/* Tree view */}
            {domView === "tree" && (
              <div className="rounded-2xl overflow-hidden" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.07)" }}>
                <div className="flex items-center gap-2 px-4 py-3" style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                  <div className="flex gap-1.5">
                    {["#f87171","#fbbf24","#34d399"].map(c => <span key={c} className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: c, opacity: 0.7 }} />)}
                  </div>
                  <span className="text-[10px] font-mono text-slate-600 ml-1">DOM Tree Explorer</span>
                </div>
                <div className="p-4 max-h-[560px] overflow-y-auto">
                  {report.dom.tree ? <DOMTreeViewer node={report.dom.tree} /> : <p className="text-slate-600 text-xs">No DOM data</p>}
                </div>
              </div>
            )}

            {/* Heaviest subtrees */}
            {domView === "graph" && (report.dom.largestSubtrees?.length ?? 0) > 0 && (
              <Card className="p-4">
                <SectionHead>Heaviest Subtrees</SectionHead>
                <div className="flex flex-col gap-2">
                  {report.dom.largestSubtrees!.map((s, i) => (
                    <div key={i} className="flex items-center gap-3">
                      <span className="text-[9px] font-mono text-slate-600 w-4">{i + 1}</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-[10px] font-mono text-violet-400 truncate" title={s.selector}>{s.selector}</p>
                      </div>
                      <span className="text-[10px] font-mono text-slate-400 flex-shrink-0">{s.nodeCount} nodes</span>
                    </div>
                  ))}
                </div>
              </Card>
            )}
          </div>
        )}

        {/* ══════════════ NETWORK ══════════════ */}
        {tab === "network" && (
          <div className="flex flex-col gap-5 animate-fade-up">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {[
                { val: report.network.totalRequests,  label: "Total",       color: "#38bdf8" },
                { val: report.network.failedRequests, label: "Failed",      color: report.network.failedRequests > 0 ? "#f87171" : "#34d399" },
                { val: report.network.requests.filter(r => r.duration > 1000).length, label: "Slow (>1s)", color: "#fbbf24" },
                { val: sizeStr,                       label: "Total Size",  color: "#a78bfa" },
              ].map(({ val, label, color }) => (
                <Card key={label} className="p-4 text-center">
                  <p className="font-mono text-xl font-bold mb-1" style={{ color }}>{val}</p>
                  <p className="text-[9px] uppercase tracking-widest text-slate-500">{label}</p>
                </Card>
              ))}
            </div>
            <Card className="p-5">
              <SectionHead>Resource Waterfall</SectionHead>
              <WaterfallChart requests={report.network.requests} />
            </Card>
          </div>
        )}

        {/* ══════════════ SECURITY ══════════════ */}
        {tab === "security" && (
          <div className="grid grid-cols-12 gap-5 animate-fade-up">
            {/* Score */}
            <div className="col-span-12 md:col-span-4 flex flex-col gap-4">
              <Card className="p-6 flex flex-col items-center text-center gap-4">
                <ScoreGauge score={report.security.score} label="Security Score" subtitle="HTTP headers audit" size={120} />
              </Card>
              <Card className="p-5">
                <ScoreGauge score={report.accessibility.score} label="Accessibility" subtitle={`${report.accessibility.violations.length} violations`} size={100} />
              </Card>
              {report.aiSummary?.findings?.filter(f => f.category.toLowerCase() === "security").map((f, i) => (
                <Card key={i} className="p-4">
                  <div className="flex items-center gap-2 mb-2"><ImpactBadge impact={f.impact} /></div>
                  <p className="text-xs font-semibold text-slate-300 mb-1">{f.title}</p>
                  <p className="text-[11px] text-slate-500 leading-relaxed">{f.explanation}</p>
                </Card>
              ))}
            </div>

            {/* Headers */}
            <div className="col-span-12 md:col-span-8 flex flex-col gap-4">
              <Card className="overflow-hidden">
                <div className="px-5 py-4" style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                  <SectionHead>HTTP Security Headers</SectionHead>
                </div>
                <div>
                  {report.security.headers.map((h, i) => (
                    <div key={i} className="px-5 py-4 flex items-start gap-4 hover:bg-white/[0.02] transition-colors" style={{ borderBottom: i < report.security.headers.length - 1 ? "1px solid rgba(255,255,255,0.04)" : "none" }}>
                      <div className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5`}
                        style={{ background: h.present ? "rgba(52,211,153,0.12)" : "rgba(248,113,113,0.12)", border: `1px solid ${h.present ? "rgba(52,211,153,0.25)" : "rgba(248,113,113,0.25)"}`, color: h.present ? "#34d399" : "#f87171" }}>
                        <span className="w-2.5 h-2.5">{h.present ? <I.Check /> : <I.X />}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-0.5">
                          <span className="text-xs font-mono font-semibold text-slate-300">{h.header}</span>
                          {!h.present && h.risk !== "none" && (
                            <span className="text-[9px] font-mono uppercase px-1.5 py-0.5 rounded border"
                              style={{ color: h.risk === "high" ? "#f87171" : "#fbbf24", background: h.risk === "high" ? "rgba(248,113,113,0.08)" : "rgba(251,191,36,0.08)", borderColor: h.risk === "high" ? "rgba(248,113,113,0.2)" : "rgba(251,191,36,0.2)" }}>
                              {h.risk} risk
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-slate-500 leading-relaxed">{h.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>

              {/* Accessibility violations */}
              <Card className="overflow-hidden">
                <div className="px-5 py-4 flex items-center justify-between" style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                  <SectionHead>Accessibility Violations</SectionHead>
                  <span className="font-mono text-xs font-bold" style={{ color: report.accessibility.score >= 80 ? "#34d399" : "#fbbf24" }}>
                    {report.accessibility.score}/100 · {report.accessibility.passes} passed
                  </span>
                </div>
                {report.accessibility.violations.length === 0 ? (
                  <div className="flex flex-col items-center py-10 gap-2">
                    <div className="w-9 h-9 rounded-2xl flex items-center justify-center text-emerald-400"
                      style={{ background: "rgba(52,211,153,0.1)", border: "1px solid rgba(52,211,153,0.2)" }}>
                      <span className="w-5 h-5"><I.Check /></span>
                    </div>
                    <p className="text-emerald-400 font-semibold text-sm">No violations detected</p>
                  </div>
                ) : (
                  <div>
                    {report.accessibility.violations.map((v, i) => {
                      const ic = { critical: "#f87171", serious: "#fb923c", moderate: "#fbbf24", minor: "#38bdf8" }[v.impact] ?? "#94a3b8";
                      return (
                        <div key={i} className="px-5 py-4 flex gap-4 items-start hover:bg-white/[0.02] transition-colors" style={{ borderBottom: i < report.accessibility.violations.length - 1 ? "1px solid rgba(255,255,255,0.04)" : "none" }}>
                          <span className="text-[9px] font-mono uppercase font-bold px-2 py-0.5 rounded-full border flex-shrink-0 mt-0.5"
                            style={{ color: ic, background: `${ic}12`, borderColor: `${ic}30` }}>
                            {v.impact}
                          </span>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-mono font-semibold text-slate-300">{v.id}</span>
                              <a href={v.helpUrl} target="_blank" rel="noopener noreferrer"
                                className="text-[10px] text-slate-600 hover:text-sky-400 flex items-center gap-0.5 transition-colors">
                                docs <span className="w-2.5 h-2.5"><I.ExtLink /></span>
                              </a>
                            </div>
                            <p className="text-[11px] text-slate-500 mt-0.5 leading-relaxed">{v.description}</p>
                            {v.nodes.length > 0 && (
                              <div className="mt-2 flex flex-wrap gap-1">
                                {v.nodes.slice(0, 4).map((n, ni) => (
                                  <span key={ni} className="text-[9px] font-mono text-violet-400 px-1.5 py-0.5 rounded truncate max-w-[200px]"
                                    style={{ background: "rgba(167,139,250,0.07)", border: "1px solid rgba(167,139,250,0.14)" }}>
                                    {n}
                                  </span>
                                ))}
                                {v.nodes.length > 4 && <span className="text-[9px] text-slate-600 self-center">+{v.nodes.length - 4}</span>}
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </Card>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
