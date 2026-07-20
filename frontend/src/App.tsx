import React, { useState, useEffect, useRef } from "react";
import type { ScanReport } from "./types";
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
  Zap:      () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" className="w-full h-full"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>,
  Lock:     () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" className="w-full h-full"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>,
};

// ─── Aurora background ───────────────────────────────────────────────────────
function AuroraBg() {
  return (
    <div className="aurora-bg">
      <div className="aurora-orb aurora-orb-1" />
      <div className="aurora-orb aurora-orb-2" />
      <div className="aurora-orb aurora-orb-3" />
      <div className="aurora-orb aurora-orb-4" />
    </div>
  );
}

// ─── Loading steps ─────────────────────────────────────────────────────────
const STEPS = [
  { label: "Initializing scanner",    sub: "Setting up HTTP analyzer",         icon: "⚡" },
  { label: "Fetching page HTML",      sub: "Loading target document",          icon: "🌐" },
  { label: "Extracting resources",    sub: "Finding scripts, styles, images",  icon: "📦" },
  { label: "Probing network",         sub: "Measuring load timings",           icon: "📡" },
  { label: "Parsing DOM structure",   sub: "Building element tree",            icon: "🌿" },
  { label: "Auditing accessibility",  sub: "Running WCAG checks",             icon: "♿" },
  { label: "Inspecting security",     sub: "Checking HTTP headers",           icon: "🔒" },
  { label: "AI analysis",             sub: "Generating insights",             icon: "✨" },
];

type TabId = "overview" | "ai" | "vitals" | "dom" | "network" | "security";
type DomView = "graph" | "tree";

// ─── Real scoring ──────────────────────────────────────────────────────────
function calcRealScore(r: ScanReport) {
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
  const domPenalty = r.dom.nodeCount > 1500 ? Math.min(15, (r.dom.nodeCount - 1500) / 100) : 0;
  const overall = Math.round(Math.max(0, (perfScore * 0.5 + a11y * 0.3 + sec * 0.2) - domPenalty));
  return { overall, perf: perfScore, a11y, sec, lcp: lcpScore, fcp: fcpScore, cls: clsScore, tti: ttiScore };
}

const gradeInfo = (s: number) =>
  s >= 90 ? { grade: "A+", label: "Excellent",  color: "#34d399", glow: "rgba(52,211,153,0.2)"   } :
  s >= 80 ? { grade: "A",  label: "Very Good",  color: "#34d399", glow: "rgba(52,211,153,0.15)"  } :
  s >= 70 ? { grade: "B+", label: "Good",       color: "#22d3ee", glow: "rgba(34,211,238,0.15)"  } :
  s >= 60 ? { grade: "B",  label: "Fair",       color: "#60a5fa", glow: "rgba(96,165,250,0.15)"  } :
  s >= 50 ? { grade: "C",  label: "Needs Work", color: "#fbbf24", glow: "rgba(251,191,36,0.15)"  } :
  s >= 35 ? { grade: "D",  label: "Poor",       color: "#fb923c", glow: "rgba(251,146,60,0.15)"  } :
             { grade: "F",  label: "Critical",   color: "#f87171", glow: "rgba(248,113,113,0.15)" };

// ─── Reusable UI pieces ────────────────────────────────────────────────────
function SectionHead({ children }: { children: React.ReactNode }) {
  return <div className="section-head">{children}</div>;
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
    <div className="stat-chip">
      <span className="font-mono text-xl font-black leading-none" style={{ color }}>{value}</span>
      <span className="text-[9px] uppercase tracking-widest font-semibold" style={{ color: "var(--text-muted)" }}>{label}</span>
    </div>
  );
}

function ImpactBadge({ impact }: { impact: "low" | "medium" | "high" }) {
  const cls = impact === "high" ? "badge-high" : impact === "medium" ? "badge-medium" : "badge-low";
  const label = impact === "high" ? "High" : impact === "medium" ? "Medium" : "Low";
  return (
    <span className={`text-[9px] font-mono font-bold uppercase px-2.5 py-1 rounded-full flex-shrink-0 ${cls}`}>
      {label}
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
    if (v.includes("@")) return "That looks like an email — please enter a website URL like example.com";
    try {
      const withProto = /^https?:\/\//i.test(v) ? v : `https://${v}`;
      const parsed = new URL(withProto);
      if (!parsed.hostname.includes(".")) return "Please enter a valid website URL like example.com";
    } catch {
      return "Invalid URL — try something like youtube.com or https://github.com";
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
      const apiBase = import.meta.env.VITE_API_URL ?? "/api";
      const res = await fetch(`${apiBase}/scan`, {
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

  const ecgPath = "M0,20 L15,20 L22,5 L32,35 L40,12 L50,28 L58,20 L80,20 L88,2 L98,38 L106,14 L114,25 L122,20 L150,20";

  /* ═══════════════════ IDLE / HERO ═════════════════════════════════════════ */
  if (status === "idle") return (
    <div className="min-h-screen flex flex-col relative overflow-hidden" style={{ background: "#0d0d1f" }}>
      <AuroraBg />

      {/* Navbar */}
      <div className="relative z-50">
        <nav className="navbar max-w-5xl mx-auto" style={{ margin: "12px auto", maxWidth: "900px", left: 0, right: 0, position: "relative" }}>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: "linear-gradient(135deg,#6d28d9,#0891b2)", boxShadow: "0 4px 12px rgba(109,40,217,0.4)" }}>
              <div className="w-4 h-4 text-white"><I.Scan /></div>
            </div>
            <span className="font-black text-lg tracking-tight text-gradient-cyan-violet" style={{ fontFamily: "Inter" }}>Web Inspectra</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="pill">
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 blink inline-block" />
              AI Powered
            </span>
          </div>
        </nav>
      </div>

      {/* Hero content */}
      <div className="relative z-10 flex-1 flex flex-col items-center justify-center px-4 text-center gap-0 pt-4 pb-24">

        {/* ECG decoration */}
        <div className="mb-8 opacity-40 w-[180px] animate-fade-in">
          <svg viewBox="0 0 150 40" fill="none" className="w-full">
            <path d={ecgPath} stroke="url(#ecg-grad)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"
              strokeDasharray="600" strokeDashoffset="600"
              style={{ animation: "ecg 2.5s ease forwards" }} />
            <defs>
              <linearGradient id="ecg-grad" x1="0" y1="0" x2="150" y2="0">
                <stop stopColor="#22d3ee" />
                <stop offset="0.5" stopColor="#a78bfa" />
                <stop offset="1" stopColor="#f472b6" />
              </linearGradient>
            </defs>
          </svg>
        </div>

        {/* Badge pill */}
        <div className="pill mb-6 animate-fade-up">
          <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 blink inline-block" />
          Website Diagnostic Engine · AI Powered
        </div>

        {/* Hero title */}
        <h1 className="font-black leading-[0.92] tracking-tight mb-5 animate-fade-up anim-delay-1"
          style={{ fontSize: "clamp(48px, 10vw, 96px)" }}>
          <span className="text-white">Web</span>
          <span className="text-gradient"> Inspectra</span>
        </h1>

        <p className="mb-10 max-w-lg leading-relaxed animate-fade-up anim-delay-2"
          style={{ color: "var(--text-secondary)", fontSize: "16px" }}>
          Full-spectrum diagnostic — performance, accessibility, security,{" "}
          <span style={{ color: "var(--accent-cyan)" }}>DOM anatomy</span> &amp; AI-powered insights.
        </p>

        {/* Scan input */}
        <form onSubmit={scan} className="w-full max-w-xl animate-fade-up anim-delay-3">
          <div className="glass-strong rounded-2xl flex items-center overflow-hidden p-1.5 gap-2" style={{ boxShadow: "0 8px 40px rgba(0,0,0,0.35), 0 0 0 1px rgba(255,255,255,0.1)" }}>
            <div className="flex items-center gap-3 flex-1 px-3">
              <div className="w-5 h-5 flex-shrink-0" style={{ color: "var(--text-muted)" }}>
                <I.Globe />
              </div>
              <input
                ref={inputRef}
                type="text"
                value={urlInput}
                onChange={e => {
                  setUrlInput(e.target.value);
                  if (urlError) setUrlError(validateUrl(e.target.value));
                }}
                placeholder="Enter a URL — youtube.com, github.com..."
                autoFocus
                className="flex-1 py-3 bg-transparent border-0 outline-none font-mono text-sm"
                style={{ color: "var(--text-primary)", caretColor: "#a78bfa" }}
              />
            </div>
            <button
              type="submit"
              disabled={!urlInput.trim()}
              className="btn-glow flex-shrink-0 disabled:opacity-30 disabled:cursor-not-allowed disabled:transform-none disabled:shadow-none"
              style={{ padding: "10px 24px", fontSize: "12px", borderRadius: "12px" }}
            >
              Scan →
            </button>
          </div>
          {urlError && (
            <p className="mt-2.5 text-xs font-mono flex items-center gap-2 pl-1" style={{ color: "#fca5a5" }}>
              <span>⚠</span> {urlError}
            </p>
          )}
        </form>

        {/* Feature tags */}
        <div className="flex flex-wrap justify-center gap-2 mt-8 animate-fade-up anim-delay-4">
          {[
            { label: "⚡ Perf Vitals", color: "#22d3ee" },
            { label: "🌿 DOM Graph",   color: "#34d399" },
            { label: "✨ AI Doctor",   color: "#a78bfa" },
            { label: "🔒 Security",    color: "#f472b6" },
            { label: "♿ A11y",        color: "#fbbf24" },
            { label: "📡 Waterfall",   color: "#60a5fa" },
            { label: "🧱 Tech Stack",  color: "#fb923c" },
          ].map(({ label, color }) => (
            <span key={label} className="text-[11px] font-mono px-3 py-1.5 rounded-full"
              style={{ background: `${color}10`, border: `1px solid ${color}25`, color }}>
              {label}
            </span>
          ))}
        </div>

        {/* Feature cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-14 max-w-3xl w-full px-2 animate-fade-up anim-delay-5">
          {[
            { icon: <I.Zap />,     title: "Lightning Analysis",     desc: "Real Core Web Vitals — LCP, FCP, CLS, TTI measured accurately",       color: "#22d3ee" },
            { icon: <I.Stars />,   title: "AI-Powered Insights",    desc: "Gemini AI diagnoses issues and recommends actionable fixes",           color: "#a78bfa" },
            { icon: <I.Lock />,    title: "Security Auditing",      desc: "Full HTTP header audit & WCAG accessibility compliance check",         color: "#f472b6" },
          ].map(({ icon, title, desc, color }) => (
            <div key={title} className="glass-card rounded-2xl p-5 text-left hover-glow">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-4"
                style={{ background: `${color}18`, border: `1px solid ${color}30`, color }}>
                <div className="w-5 h-5">{icon}</div>
              </div>
              <h3 className="text-sm font-bold mb-2" style={{ color: "var(--text-primary)" }}>{title}</h3>
              <p className="text-xs leading-relaxed" style={{ color: "var(--text-secondary)" }}>{desc}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  /* ═══════════════════ LOADING ═════════════════════════════════════════════ */
  if (status === "loading") return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 gap-10 relative overflow-hidden" style={{ background: "#0d0d1f" }}>
      <AuroraBg />

      {/* Scanning beam overlay */}
      <div className="fixed inset-0 pointer-events-none z-5" style={{ overflow: "hidden" }}>
        <div style={{
          position: "absolute",
          top: 0, left: 0, right: 0,
          height: "2px",
          background: "linear-gradient(90deg, transparent 0%, #22d3ee 30%, #a78bfa 60%, transparent 100%)",
          boxShadow: "0 0 20px rgba(34,211,238,0.6), 0 0 60px rgba(167,139,250,0.3)",
          animation: "scanBeam 2.8s ease-in-out infinite",
        }} />
      </div>

      <div className="relative z-10 flex flex-col items-center gap-8 animate-scale-in">

        {/* Radar scanner animation */}
        <div className="relative" style={{ width: 160, height: 160 }}>
          {/* Outer ring pulse */}
          {[0,1,2].map(i => (
            <div key={i} className="absolute rounded-full" style={{
              inset: `${i * 20}px`,
              border: "1px solid rgba(167,139,250,0.15)",
              animation: `radarRing 2s ease-out ${i * 0.5}s infinite`,
            }} />
          ))}
          {/* Main spinning ring */}
          <svg viewBox="0 0 160 160" className="absolute inset-0 w-full h-full" style={{ animation: "rotateSlow 3s linear infinite" }}>
            <circle cx="80" cy="80" r="74" fill="none" stroke="rgba(34,211,238,0.08)" strokeWidth="1.5"/>
            <circle cx="80" cy="80" r="74" fill="none" stroke="url(#scan-outer)" strokeWidth="2"
              strokeDasharray="40 426" strokeLinecap="round"/>
            <defs>
              <linearGradient id="scan-outer" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#22d3ee"/>
                <stop offset="100%" stopColor="#a78bfa"/>
              </linearGradient>
            </defs>
          </svg>
          {/* Counter ring */}
          <svg viewBox="0 0 160 160" className="absolute inset-0 w-full h-full" style={{ animation: "rotateSlow 2s linear infinite reverse" }}>
            <circle cx="80" cy="80" r="52" fill="none" stroke="rgba(244,114,182,0.08)" strokeWidth="1.5"/>
            <circle cx="80" cy="80" r="52" fill="none" stroke="#f472b6" strokeWidth="1.5"
              strokeDasharray="16 310" strokeLinecap="round"/>
          </svg>
          {/* Radar sweep */}
          <svg viewBox="0 0 160 160" className="absolute inset-0 w-full h-full" style={{ animation: "rotateSlow 2.5s linear infinite" }}>
            <defs>
              <radialGradient id="sweep-grad" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="rgba(34,211,238,0.0)"/>
                <stop offset="40%" stopColor="rgba(34,211,238,0.0)"/>
                <stop offset="80%" stopColor="rgba(34,211,238,0.12)"/>
                <stop offset="100%" stopColor="rgba(34,211,238,0.0)"/>
              </radialGradient>
            </defs>
            <path d="M80,80 L80,6 A74,74 0 0,1 154,80 Z" fill="url(#sweep-grad)"/>
            <line x1="80" y1="80" x2="80" y2="8" stroke="rgba(34,211,238,0.5)" strokeWidth="1.5"/>
          </svg>
          {/* Center */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center glass"
              style={{ border: "1px solid rgba(167,139,250,0.35)", boxShadow: "0 0 24px rgba(167,139,250,0.35), inset 0 1px 0 rgba(255,255,255,0.1)" }}>
              <div className="w-7 h-7" style={{ color: "#c4b5fd" }}><I.Scan /></div>
            </div>
          </div>
          {/* Blips */}
          {[
            { top: "18%", left: "62%", delay: "0.4s" },
            { top: "55%", left: "80%", delay: "1.1s" },
            { top: "72%", left: "35%", delay: "0.8s" },
            { top: "30%", left: "22%", delay: "1.6s" },
          ].map((b, i) => (
            <div key={i} className="absolute w-1.5 h-1.5 rounded-full" style={{
              top: b.top, left: b.left,
              background: "#22d3ee",
              boxShadow: "0 0 6px #22d3ee",
              animation: `blip 2.5s ease-in-out ${b.delay} infinite`,
            }} />
          ))}
        </div>

        {/* URL being scanned */}
        <div className="text-center animate-fade-up">
          <p className="text-base font-bold mb-1" style={{ color: "var(--text-primary)" }}>{STEPS[stepIdx].label}</p>
          <p className="text-xs font-mono" style={{ color: "var(--text-muted)" }}>{STEPS[stepIdx].sub}</p>
        </div>

        {/* Steps list */}
        <div className="glass rounded-2xl p-5 w-80 space-y-3" style={{ border: "1px solid rgba(255,255,255,0.1)" }}>
          {STEPS.map((s, i) => (
            <div key={i} className="flex items-center gap-3 transition-all duration-300">
              <div className={`w-6 h-6 rounded-lg flex items-center justify-center flex-shrink-0 text-xs transition-all duration-500`}
                style={{
                  background: i < stepIdx ? "rgba(52,211,153,0.15)" : i === stepIdx ? "rgba(34,211,238,0.15)" : "rgba(255,255,255,0.03)",
                  border: i < stepIdx ? "1px solid rgba(52,211,153,0.35)" : i === stepIdx ? "1px solid rgba(34,211,238,0.5)" : "1px solid rgba(255,255,255,0.05)",
                  boxShadow: i === stepIdx ? "0 0 10px rgba(34,211,238,0.2)" : "none",
                }}>
                {i < stepIdx
                  ? <span className="w-3 h-3 text-emerald-400"><I.Check /></span>
                  : i === stepIdx
                  ? <span className="w-2 h-2 rounded-full blink inline-block" style={{ background: "#22d3ee", boxShadow: "0 0 6px #22d3ee" }} />
                  : <span className="text-[10px]">{s.icon}</span>}
              </div>
              <span className={`text-xs font-mono transition-all duration-300 ${i < stepIdx ? "line-through" : ""}`}
                style={{
                  color: i < stepIdx ? "var(--text-muted)" : i === stepIdx ? "#22d3ee" : "rgba(150,170,220,0.25)",
                  fontWeight: i === stepIdx ? 600 : 400,
                }}>
                {s.label}
              </span>
              {i === stepIdx && (
                <span className="ml-auto text-[9px] font-mono" style={{ color: "rgba(34,211,238,0.6)" }}>…</span>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  /* ═══════════════════ ERROR ═══════════════════════════════════════════════ */
  if (status === "error") return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 gap-6 relative overflow-hidden" style={{ background: "#0d0d1f" }}>
      <AuroraBg />
      <div className="relative z-10 flex flex-col items-center gap-6 animate-scale-in">
        <div className="w-16 h-16 rounded-2xl flex items-center justify-center"
          style={{ background: "rgba(248,113,113,0.12)", border: "1px solid rgba(248,113,113,0.3)", color: "#f87171", boxShadow: "0 0 30px rgba(248,113,113,0.2)" }}>
          <div className="w-8 h-8"><I.X /></div>
        </div>
        <div className="text-center max-w-md">
          <h3 className="font-black text-xl mb-3" style={{ color: "#fca5a5" }}>Scan Failed</h3>
          <p className="text-sm font-mono leading-relaxed" style={{ color: "var(--text-secondary)" }}>{error}</p>
        </div>
        <button onClick={reset} className="btn-ghost flex items-center gap-2">
          <span className="w-4 h-4"><I.Refresh /></span> Try Again
        </button>
      </div>
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
    <div className="min-h-screen relative" style={{ background: "#0d0d1f" }}>
      <AuroraBg />

      <div className="relative z-10 max-w-[1240px] mx-auto px-4 sm:px-6 pb-24 pt-4">

        {/* ── Top bar / Navbar ── */}
        <div className="navbar mb-6" style={{ position: "relative", top: 0, margin: "0 0 24px 0", borderRadius: "20px" }}>
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ background: "linear-gradient(135deg,#6d28d9,#0891b2)", boxShadow: "0 4px 12px rgba(109,40,217,0.4)" }}>
              <div className="w-4 h-4 text-white"><I.Globe /></div>
            </div>
            <div className="min-w-0">
              <p className="text-sm font-mono font-bold truncate" style={{ color: "var(--text-primary)" }}>{report.url}</p>
              <p className="text-[10px] font-mono" style={{ color: "var(--text-muted)" }}>
                {(() => { try { return new Date(report.scannedAt).toLocaleString(); } catch { return report.scannedAt; } })()}
              </p>
            </div>
          </div>
          <button onClick={reset}
            className="btn-ghost flex items-center gap-2 flex-shrink-0"
            style={{ padding: "8px 16px", fontSize: "12px", borderRadius: "12px" }}>
            <span className="w-3.5 h-3.5"><I.Refresh /></span> New Scan
          </button>
        </div>

        {/* ── Tab nav ── */}
        <div className="tab-bar mb-6 overflow-x-auto">
          {TABS.map(({ id, label, icon }) => (
            <button key={id} onClick={() => setTab(id)}
              className={`tab-item ${tab === id ? "active" : ""}`}>
              <span className="w-3.5 h-3.5 flex-shrink-0">{icon}</span>
              {label}
            </button>
          ))}
        </div>

        {/* ══════════════ OVERVIEW ══════════════ */}
        {tab === "overview" && (
          <div className="grid grid-cols-12 gap-4 animate-fade-up">

            {/* Grade card */}
            <div className="col-span-12 md:col-span-4 glass-card rounded-2xl p-6 flex flex-col items-center text-center gap-4 relative overflow-hidden gradient-border"
              style={{ background: `radial-gradient(ellipse at 50% -10%, ${gradeGlow}, rgba(20,15,45,0.7) 60%)` }}>
              <div className="text-[10px] uppercase tracking-widest font-bold section-head justify-center" style={{ marginBottom: 0 }}>
                Overall Health
              </div>
              <div className="font-black leading-none font-mono"
                style={{ fontSize: 80, color: gradeColor, textShadow: `0 0 40px ${gradeColor}60` }}>
                {grade}
              </div>
              <div className="text-sm font-bold" style={{ color: gradeColor }}>{gradeLabel}</div>
              <div className="text-4xl font-black font-mono" style={{ color: "var(--text-primary)" }}>
                {scores.overall}
                <span className="text-lg" style={{ color: "var(--text-muted)" }}>/100</span>
              </div>
              {/* Divider */}
              <div className="w-full h-px" style={{ background: `linear-gradient(90deg, transparent, ${gradeColor}50, transparent)` }} />
              {/* Sub scores */}
              <div className="grid grid-cols-3 gap-3 w-full">
                {[
                  { label: "Perf", val: scores.perf, color: "#22d3ee" },
                  { label: "A11y", val: scores.a11y, color: "#34d399" },
                  { label: "Sec",  val: scores.sec,  color: "#a78bfa" },
                ].map(({ label, val, color }) => (
                  <div key={label} className="text-center glass-panel rounded-xl py-3">
                    <div className="font-mono text-lg font-black" style={{ color }}>{val}</div>
                    <div className="text-[9px] uppercase tracking-widest font-semibold mt-0.5" style={{ color: "var(--text-muted)" }}>{label}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Right side */}
            <div className="col-span-12 md:col-span-8 flex flex-col gap-4">
              {/* Stat chips */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <StatChip value={`${loadS}s`} label="Load Time"  color="#22d3ee" />
                <StatChip value={`${report.performance.resourceCount}`} label="Requests" color="#a78bfa" />
                <StatChip value={`${report.accessibility.score}`}       label="A11y"     color="#34d399" />
                <StatChip value={sizeStr}                                label="Page Size" color="#fbbf24" />
              </div>

              {/* AI prognosis */}
              <div className="flex-1 glass-card rounded-2xl p-5"
                style={{ background: "linear-gradient(135deg, rgba(167,139,250,0.07), rgba(244,114,182,0.04))", border: "1px solid rgba(167,139,250,0.2)" }}>
                <div className="flex items-center gap-2 mb-3">
                  <span className="w-5 h-5" style={{ color: "#c4b5fd" }}><I.Stars /></span>
                  <span className="text-[10px] uppercase tracking-widest font-bold" style={{ color: "#c4b5fd" }}>AI Prognosis</span>
                </div>
                <p className="text-sm leading-relaxed" style={{ color: "var(--text-secondary)" }}>
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
                    <span className="px-3 py-1.5 rounded-xl text-xs font-mono font-bold"
                      style={{ background: "rgba(34,211,238,0.1)", border: "1px solid rgba(34,211,238,0.25)", color: "#22d3ee" }}>
                      ☁ {report.techStack.hosting}
                    </span>
                  )}
                  {[...report.techStack.frameworks, ...report.techStack.cssLibraries, ...report.techStack.analytics, ...report.techStack.other].map((t, i) => (
                    <span key={i} className="px-3 py-1.5 rounded-xl text-xs font-mono font-bold"
                      style={{ background: "rgba(167,139,250,0.1)", border: "1px solid rgba(167,139,250,0.22)", color: "#c4b5fd" }}>{t}</span>
                  ))}
                  {!report.techStack.frameworks.length && !report.techStack.cssLibraries.length && (
                    <span className="text-xs italic font-mono" style={{ color: "var(--text-muted)" }}>No frameworks detected — vanilla stack</span>
                  )}
                </div>
              </Card>
            </div>

            {/* Top findings */}
            <div className="col-span-12">
              <SectionHead>Top Priority Issues</SectionHead>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {(report.aiSummary?.findings?.slice(0, 3) || []).map((f, i) => (
                  <Card key={i} className="p-5 flex flex-col gap-3 hover-glow">
                    <div className="flex items-start justify-between gap-2">
                      <ImpactBadge impact={f.impact} />
                      <span className="text-[9px] font-mono uppercase tracking-widest" style={{ color: "var(--text-muted)" }}>{f.category}</span>
                    </div>
                    <p className="text-xs font-bold" style={{ color: "var(--text-primary)" }}>{f.title}</p>
                    <p className="text-[11px] leading-relaxed flex-1" style={{ color: "var(--text-secondary)" }}>
                      {f.explanation.substring(0, 130)}{f.explanation.length > 130 ? "…" : ""}
                    </p>
                    <button onClick={() => setTab("ai")} className="text-[10px] font-mono font-bold self-start transition-colors hover:underline"
                      style={{ color: "#a78bfa" }}>
                      Full details →
                    </button>
                  </Card>
                ))}
                {!report.aiSummary?.findings?.length && (
                  <div className="col-span-3 text-center py-10 glass-card rounded-2xl" style={{ color: "var(--text-muted)" }}>
                    <span className="text-sm">Add GEMINI_API_KEY to backend/.env for AI findings</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ══════════════ AI DOCTOR ══════════════ */}
        {tab === "ai" && (
          <div className="flex flex-col gap-5 animate-fade-up">
            <div className="glass-card rounded-2xl p-6"
              style={{ background: "linear-gradient(135deg, rgba(167,139,250,0.08), rgba(34,211,238,0.04))", border: "1px solid rgba(167,139,250,0.2)" }}>
              <div className="flex items-center gap-2 mb-3">
                <span className="w-5 h-5" style={{ color: "#c4b5fd" }}><I.Stars /></span>
                <span className="text-[10px] uppercase tracking-widest font-bold" style={{ color: "#c4b5fd" }}>AI Chief Medical Officer</span>
              </div>
              <p className="leading-relaxed" style={{ color: "var(--text-secondary)" }}>
                {report.aiSummary?.overallHealth || "Enable AI by adding GEMINI_API_KEY to backend/.env"}
              </p>
            </div>

            <SectionHead>Diagnostic Findings ({report.aiSummary?.findings?.length || 0})</SectionHead>
            <div className="flex flex-col gap-3">
              {(report.aiSummary?.findings || []).map((f, i) => (
                <Card key={i} className="p-5 flex gap-5 items-start hover-glow">
                  <div className="w-7 h-7 rounded-xl flex items-center justify-center flex-shrink-0 font-mono text-xs font-black"
                    style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", color: "var(--text-muted)" }}>
                    {i + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-2">
                      <ImpactBadge impact={f.impact} />
                      <span className="text-[9px] font-mono uppercase tracking-widest" style={{ color: "var(--text-muted)" }}>{f.category}</span>
                    </div>
                    <h4 className="text-sm font-bold mb-1.5" style={{ color: "var(--text-primary)" }}>{f.title}</h4>
                    <p className="text-xs leading-relaxed" style={{ color: "var(--text-secondary)" }}>{f.explanation}</p>
                  </div>
                </Card>
              ))}
              {!report.aiSummary?.findings?.length && (
                <div className="text-center py-16 glass-card rounded-2xl">
                  <div className="w-10 h-10 mx-auto mb-3 opacity-20" style={{ color: "var(--text-muted)" }}><I.Stars /></div>
                  <p className="text-sm" style={{ color: "var(--text-muted)" }}>No AI findings — add GEMINI_API_KEY to backend/.env</p>
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
                <Card key={label} className="p-4 flex flex-col items-center gap-3 hover-glow">
                  <ScoreGauge score={score} label={label} subtitle={sub} size={88} />
                </Card>
              ))}
            </div>

            {/* Summary cards */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              {[
                { icon: <I.Clock />,   val: `${loadS}s`,  label: "Total Load Time",  color: "#22d3ee" },
                { icon: <I.Network/>,  val: `${report.performance.resourceCount}`, label: "Total Requests", color: "#a78bfa" },
                { icon: <I.Eye />,     val: sizeStr,        label: "Transfer Size",    color: "#34d399" },
              ].map(({ icon, val, label, color }) => (
                <Card key={label} className="flex items-center gap-4 p-5 hover-glow">
                  <div className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{ background: `${color}15`, border: `1px solid ${color}25`, color }}>
                    <div className="w-5 h-5">{icon}</div>
                  </div>
                  <div>
                    <p className="font-mono text-xl font-black" style={{ color }}>{val}</p>
                    <p className="text-[9px] uppercase tracking-widest font-semibold mt-0.5" style={{ color: "var(--text-muted)" }}>{label}</p>
                  </div>
                </Card>
              ))}
            </div>

            {(report.aiSummary?.findings?.filter(f => f.category.toLowerCase() === "performance").length ?? 0) > 0 && (
              <Card className="p-5">
                <SectionHead>AI Performance Notes</SectionHead>
                <div className="flex flex-col gap-4">
                  {report.aiSummary?.findings?.filter(f => f.category.toLowerCase() === "performance").map((f, i) => (
                    <div key={i} className="flex gap-3 items-start">
                      <ImpactBadge impact={f.impact} />
                      <div>
                        <p className="text-xs font-bold mb-1" style={{ color: "var(--text-primary)" }}>{f.title}</p>
                        <p className="text-xs leading-relaxed" style={{ color: "var(--text-secondary)" }}>{f.explanation}</p>
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
            <div className="flex items-center justify-between flex-wrap gap-3">
              {/* View toggle */}
              <div className="tab-bar" style={{ gap: "2px" }}>
                {(["graph", "tree"] as DomView[]).map((v) => (
                  <button key={v} onClick={() => setDomView(v)}
                    className={`tab-item ${domView === v ? "active" : ""}`}>
                    <span className="w-3.5 h-3.5">{v === "graph" ? <I.Network /> : <I.Tree />}</span>
                    {v === "graph" ? "Node Graph" : "Tree View"}
                  </button>
                ))}
              </div>
              <div className="flex gap-5">
                {[
                  { label: "Nodes", val: report.dom.nodeCount,     warn: report.dom.nodeCount > 1500 },
                  { label: "Depth", val: `${report.dom.maxDepth} lvl`, warn: report.dom.maxDepth > 32 },
                ].map(({ label, val, warn }) => (
                  <div key={label} className="text-center">
                    <p className="font-mono font-black text-xl leading-none" style={{ color: warn ? "#f87171" : "var(--text-primary)" }}>{val}</p>
                    <p className="text-[9px] uppercase tracking-widest font-semibold mt-1" style={{ color: "var(--text-muted)" }}>{label}</p>
                    {warn && <p className="text-[9px] mt-0.5" style={{ color: "#fca5a5" }}>⚠ Bloated</p>}
                  </div>
                ))}
              </div>
            </div>

            {domView === "graph" && (
              <div className="glass-card rounded-2xl overflow-hidden" style={{ height: 520 }}>
                <DOMGraph node={report.dom.tree} />
              </div>
            )}
            {domView === "tree" && (
              <div className="glass-card rounded-2xl overflow-hidden">
                <div className="flex items-center gap-2 px-5 py-3" style={{ borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
                  <div className="flex gap-1.5">
                    {["#f87171","#fbbf24","#34d399"].map(c => <span key={c} className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: c, opacity: 0.8 }} />)}
                  </div>
                  <span className="text-[10px] font-mono ml-1" style={{ color: "var(--text-muted)" }}>DOM Tree Explorer</span>
                </div>
                <div className="p-4 max-h-[560px] overflow-y-auto">
                  {report.dom.tree ? <DOMTreeViewer node={report.dom.tree} /> : <p className="text-xs" style={{ color: "var(--text-muted)" }}>No DOM data</p>}
                </div>
              </div>
            )}

            {domView === "graph" && (report.dom.largestSubtrees?.length ?? 0) > 0 && (
              <Card className="p-5">
                <SectionHead>Heaviest Subtrees</SectionHead>
                <div className="flex flex-col gap-2.5">
                  {report.dom.largestSubtrees!.map((s, i) => (
                    <div key={i} className="flex items-center gap-3">
                      <span className="text-[9px] font-mono w-5 text-right font-bold" style={{ color: "var(--text-muted)" }}>{i + 1}</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-[10px] font-mono truncate" style={{ color: "#c4b5fd" }} title={s.selector}>{s.selector}</p>
                      </div>
                      <span className="text-[10px] font-mono flex-shrink-0 font-bold" style={{ color: "var(--text-secondary)" }}>{s.nodeCount} nodes</span>
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
                { val: report.network.totalRequests,  label: "Total",       color: "#22d3ee" },
                { val: report.network.failedRequests, label: "Failed",      color: report.network.failedRequests > 0 ? "#f87171" : "#34d399" },
                { val: report.network.requests.filter(r => r.duration > 1000).length, label: "Slow (>1s)", color: "#fbbf24" },
                { val: sizeStr,                        label: "Total Size",  color: "#a78bfa" },
              ].map(({ val, label, color }) => (
                <Card key={label} className="p-5 text-center hover-glow">
                  <p className="font-mono text-2xl font-black mb-1" style={{ color }}>{val}</p>
                  <p className="text-[9px] uppercase tracking-widest font-semibold" style={{ color: "var(--text-muted)" }}>{label}</p>
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
            {/* Score column */}
            <div className="col-span-12 md:col-span-4 flex flex-col gap-4">
              <Card className="p-6 flex flex-col items-center text-center gap-4 hover-glow">
                <ScoreGauge score={report.security.score} label="Security Score" subtitle="HTTP headers audit" size={120} />
              </Card>
              <Card className="p-5 hover-glow">
                <ScoreGauge score={report.accessibility.score} label="Accessibility" subtitle={`${report.accessibility.violations.length} violations`} size={100} />
              </Card>
              {report.aiSummary?.findings?.filter(f => f.category.toLowerCase() === "security").map((f, i) => (
                <Card key={i} className="p-4 hover-glow">
                  <div className="flex items-center gap-2 mb-2"><ImpactBadge impact={f.impact} /></div>
                  <p className="text-xs font-bold mb-1" style={{ color: "var(--text-primary)" }}>{f.title}</p>
                  <p className="text-[11px] leading-relaxed" style={{ color: "var(--text-secondary)" }}>{f.explanation}</p>
                </Card>
              ))}
            </div>

            {/* Headers + violations */}
            <div className="col-span-12 md:col-span-8 flex flex-col gap-4">
              <Card className="overflow-hidden">
                <div className="px-5 py-4" style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                  <SectionHead>HTTP Security Headers</SectionHead>
                </div>
                <div>
                  {report.security.headers.map((h, i) => (
                    <div key={i} className="px-5 py-4 flex items-start gap-4 transition-colors"
                      style={{ borderBottom: i < report.security.headers.length - 1 ? "1px solid rgba(255,255,255,0.04)" : "none" }}
                      onMouseEnter={e => (e.currentTarget.style.background = "rgba(255,255,255,0.02)")}
                      onMouseLeave={e => (e.currentTarget.style.background = "")}>
                      <div className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5"
                        style={{
                          background: h.present ? "rgba(52,211,153,0.12)" : "rgba(248,113,113,0.12)",
                          border: `1px solid ${h.present ? "rgba(52,211,153,0.3)" : "rgba(248,113,113,0.3)"}`,
                          color: h.present ? "#34d399" : "#f87171"
                        }}>
                        <span className="w-3 h-3">{h.present ? <I.Check /> : <I.X />}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-0.5">
                          <span className="text-xs font-mono font-bold" style={{ color: "var(--text-primary)" }}>{h.header}</span>
                          {!h.present && h.risk !== "none" && (
                            <span className="text-[9px] font-mono uppercase px-2 py-0.5 rounded-full font-bold"
                              style={{
                                color: h.risk === "high" ? "#fca5a5" : "#fcd34d",
                                background: h.risk === "high" ? "rgba(248,113,113,0.1)" : "rgba(251,191,36,0.1)",
                                border: `1px solid ${h.risk === "high" ? "rgba(248,113,113,0.25)" : "rgba(251,191,36,0.25)"}`
                              }}>
                              {h.risk} risk
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] leading-relaxed" style={{ color: "var(--text-secondary)" }}>{h.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>

              {/* Accessibility violations */}
              <Card className="overflow-hidden">
                <div className="px-5 py-4 flex items-center justify-between" style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                  <SectionHead>Accessibility Violations</SectionHead>
                  <span className="font-mono text-xs font-black"
                    style={{ color: report.accessibility.score >= 80 ? "#34d399" : "#fbbf24" }}>
                    {report.accessibility.score}/100 · {report.accessibility.passes} passed
                  </span>
                </div>
                {report.accessibility.violations.length === 0 ? (
                  <div className="flex flex-col items-center py-10 gap-3">
                    <div className="w-12 h-12 rounded-2xl flex items-center justify-center"
                      style={{ background: "rgba(52,211,153,0.12)", border: "1px solid rgba(52,211,153,0.25)", color: "#34d399" }}>
                      <span className="w-6 h-6"><I.Check /></span>
                    </div>
                    <p className="font-bold text-sm" style={{ color: "#6ee7b7" }}>No violations detected</p>
                  </div>
                ) : (
                  <div>
                    {report.accessibility.violations.map((v, i) => {
                      const ic = { critical: "#f87171", serious: "#fb923c", moderate: "#fbbf24", minor: "#60a5fa" }[v.impact] ?? "#94a3b8";
                      return (
                        <div key={i} className="px-5 py-4 flex gap-4 items-start transition-colors"
                          style={{ borderBottom: i < report.accessibility.violations.length - 1 ? "1px solid rgba(255,255,255,0.04)" : "none" }}
                          onMouseEnter={e => (e.currentTarget.style.background = "rgba(255,255,255,0.02)")}
                          onMouseLeave={e => (e.currentTarget.style.background = "")}>
                          <span className="text-[9px] font-mono uppercase font-black px-2 py-1 rounded-full flex-shrink-0 mt-0.5"
                            style={{ color: ic, background: `${ic}15`, border: `1px solid ${ic}30` }}>
                            {v.impact}
                          </span>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-mono font-bold" style={{ color: "var(--text-primary)" }}>{v.id}</span>
                              <a href={v.helpUrl} target="_blank" rel="noopener noreferrer"
                                className="text-[10px] flex items-center gap-0.5 transition-colors"
                                style={{ color: "var(--text-muted)" }}
                                onMouseEnter={e => ((e.currentTarget as HTMLElement).style.color = "#22d3ee")}
                                onMouseLeave={e => ((e.currentTarget as HTMLElement).style.color = "var(--text-muted)")}>
                                docs <span className="w-2.5 h-2.5"><I.ExtLink /></span>
                              </a>
                            </div>
                            <p className="text-[11px] mt-0.5 leading-relaxed" style={{ color: "var(--text-secondary)" }}>{v.description}</p>
                            {v.nodes.length > 0 && (
                              <div className="mt-2 flex flex-wrap gap-1">
                                {v.nodes.slice(0, 4).map((n, ni) => (
                                  <span key={ni} className="text-[9px] font-mono px-1.5 py-0.5 rounded truncate max-w-[200px]"
                                    style={{ background: "rgba(167,139,250,0.08)", border: "1px solid rgba(167,139,250,0.18)", color: "#c4b5fd" }}>
                                    {n}
                                  </span>
                                ))}
                                {v.nodes.length > 4 && <span className="text-[9px] self-center" style={{ color: "var(--text-muted)" }}>+{v.nodes.length - 4}</span>}
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
