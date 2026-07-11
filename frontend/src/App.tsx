import React, { useState, useEffect, useRef } from "react";
import type { ScanReport } from "@web-inspectra/shared-types";
import DOMTreeViewer from "./components/DOMTreeViewer";
import WaterfallChart from "./components/WaterfallChart";
import ScoreGauge from "./components/ScoreGauge";

// ─── Icons (inline SVG to avoid dependency issues) ────────────────────────
const Icon = {
  Pulse: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" className="w-full h-full">
      <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
    </svg>
  ),
  Globe: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" className="w-full h-full">
      <circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/>
      <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
    </svg>
  ),
  Scan: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" className="w-full h-full">
      <path d="M3 7V5a2 2 0 0 1 2-2h2"/><path d="M17 3h2a2 2 0 0 1 2 2v2"/>
      <path d="M21 17v2a2 2 0 0 1-2 2h-2"/><path d="M7 21H5a2 2 0 0 1-2-2v-2"/>
      <line x1="3" y1="12" x2="21" y2="12"/>
    </svg>
  ),
  Shield: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" className="w-full h-full">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
    </svg>
  ),
  Code: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" className="w-full h-full">
      <polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/>
    </svg>
  ),
  Eye: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" className="w-full h-full">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>
    </svg>
  ),
  Network: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" className="w-full h-full">
      <rect x="2" y="2" width="6" height="6" rx="1"/><rect x="16" y="2" width="6" height="6" rx="1"/>
      <rect x="9" y="16" width="6" height="6" rx="1"/>
      <path d="M5 8v4a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V8"/><line x1="12" y1="12" x2="12" y2="16"/>
    </svg>
  ),
  AI: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" className="w-full h-full">
      <path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/>
      <path d="M2 12l10 5 10-5"/>
    </svg>
  ),
  Dashboard: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" className="w-full h-full">
      <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/>
      <rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/>
    </svg>
  ),
  Check: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="w-full h-full">
      <polyline points="20 6 9 17 4 12"/>
    </svg>
  ),
  X: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="w-full h-full">
      <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
    </svg>
  ),
  Alert: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" className="w-full h-full">
      <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
      <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
    </svg>
  ),
  ArrowRight: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="w-full h-full">
      <line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/>
    </svg>
  ),
  Refresh: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" className="w-full h-full">
      <polyline points="1 4 1 10 7 10"/>
      <path d="M3.51 15a9 9 0 1 0 .49-4.14"/>
    </svg>
  ),
  ExternalLink: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" className="w-full h-full">
      <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>
      <polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/>
    </svg>
  ),
  Clock: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" className="w-full h-full">
      <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
    </svg>
  ),
};

// ─── Loading steps ─────────────────────────────────────────────────────────
const STEPS = [
  { label: "Initializing scanner", sub: "Setting up HTTP analyzer" },
  { label: "Loading target website", sub: "Fetching HTML document" },
  { label: "Extracting resources", sub: "Finding scripts, styles, images" },
  { label: "Probing network requests", sub: "Measuring load timings" },
  { label: "Parsing DOM structure", sub: "Building element tree" },
  { label: "Auditing accessibility", sub: "Running WCAG checks" },
  { label: "Inspecting security headers", sub: "Checking HTTP response headers" },
  { label: "Analyzing with AI", sub: "Generating plain-language insights" },
];

type TabId = "overview" | "ai" | "vitals" | "dom" | "network" | "security";

// ─── Score helpers ─────────────────────────────────────────────────────────
const calcOverallScore = (r: ScanReport) => {
  const perf = Math.max(0, 100 - Math.min((r.performance.totalLoadTime / 80), 100));
  return Math.round((perf + r.accessibility.score + r.security.score) / 3);
};
const scoreGrade = (s: number) =>
  s >= 90 ? { grade: "A+", label: "Excellent", color: "#34d399", ring: "rgba(52,211,153,0.2)" } :
  s >= 80 ? { grade: "A",  label: "Very Good", color: "#34d399", ring: "rgba(52,211,153,0.15)" } :
  s >= 70 ? { grade: "B",  label: "Good",      color: "#22d3ee", ring: "rgba(34,211,238,0.15)" } :
  s >= 60 ? { grade: "C",  label: "Fair",      color: "#fbbf24", ring: "rgba(251,191,36,0.15)"  } :
  s >= 45 ? { grade: "D",  label: "Poor",      color: "#fb923c", ring: "rgba(249,115,22,0.15)"  } :
             { grade: "F",  label: "Critical",  color: "#f87171", ring: "rgba(248,113,113,0.15)" };

// ─── Stat chip ─────────────────────────────────────────────────────────────
function Chip({ value, label, color }: { value: string; label: string; color: string }) {
  return (
    <div className="flex flex-col items-center gap-1 px-4 py-3 rounded-xl bg-white/[0.03] border border-white/[0.06] backdrop-blur-sm metric-card">
      <span className="font-mono text-lg font-bold" style={{ color }}>{value}</span>
      <span className="text-[10px] uppercase tracking-widest text-slate-500 font-semibold">{label}</span>
    </div>
  );
}

// ─── Impact badge ──────────────────────────────────────────────────────────
function ImpactBadge({ impact }: { impact: "low" | "medium" | "high" }) {
  const cfg = {
    high:   { label: "High",   color: "#f87171", bg: "rgba(248,113,113,0.1)" },
    medium: { label: "Medium", color: "#fbbf24", bg: "rgba(251,191,36,0.1)"  },
    low:    { label: "Low",    color: "#34d399", bg: "rgba(52,211,153,0.1)"  },
  }[impact];
  return (
    <span
      className="text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded-full border flex-shrink-0"
      style={{ color: cfg.color, backgroundColor: cfg.bg, borderColor: `${cfg.color}30` }}
    >
      {cfg.label}
    </span>
  );
}

// ─── Section header ────────────────────────────────────────────────────────
function SectionHeading({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="text-[11px] uppercase tracking-[0.15em] text-slate-500 font-semibold mb-4 flex items-center gap-2">
      <span className="block w-4 h-px bg-gradient-to-r from-cyan-500 to-violet-500" />
      {children}
    </h3>
  );
}

// ─── Main App ──────────────────────────────────────────────────────────────
export default function App() {
  const [url, setUrl] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "done" | "error">("idle");
  const [stepIdx, setStepIdx] = useState(0);
  const [report, setReport] = useState<ScanReport | null>(null);
  const [error, setError] = useState("");
  const [tab, setTab] = useState<TabId>("overview");
  const inputRef = useRef<HTMLInputElement>(null);

  // Animate loading steps
  useEffect(() => {
    if (status !== "loading") return;
    setStepIdx(0);
    const id = setInterval(() => setStepIdx((p) => (p < STEPS.length - 2 ? p + 1 : p)), 3000);
    return () => clearInterval(id);
  }, [status]);

  const scan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url.trim()) return;
    setStatus("loading");
    setError("");
    setReport(null);

    try {
      const res = await fetch("/api/scan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: url.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || `Error ${res.status}`);
      setReport(data.report);
      setStatus("done");
      setTab("overview");
    } catch (err: any) {
      setError(err.message || "Scan failed. Make sure the backend is running on port 3001.");
      setStatus("error");
    }
  };

  const reset = () => { setStatus("idle"); setReport(null); setError(""); setTimeout(() => inputRef.current?.focus(), 100); };

  // ECG SVG path (decorative)
  const ecgPath = "M0,32 L20,32 L30,10 L40,54 L50,20 L60,44 L70,32 L90,32 L100,32 L110,4 L120,60 L130,24 L140,40 L150,32 L180,32";

  return (
    <div className="min-h-screen bg-[#080810] text-slate-200 relative overflow-x-hidden">
      {/* ── Background elements ── */}
      {/* Dot grid */}
      <div className="fixed inset-0 pointer-events-none" style={{
        backgroundImage: "radial-gradient(circle, rgba(255,255,255,0.04) 1px, transparent 1px)",
        backgroundSize: "28px 28px",
      }} />
      {/* Gradient orbs */}
      <div className="fixed top-[-20%] left-[-10%] w-[60vw] h-[60vw] rounded-full pointer-events-none"
        style={{ background: "radial-gradient(circle, rgba(99,102,241,0.06) 0%, transparent 70%)" }} />
      <div className="fixed bottom-[-20%] right-[-10%] w-[50vw] h-[50vw] rounded-full pointer-events-none"
        style={{ background: "radial-gradient(circle, rgba(34,211,238,0.04) 0%, transparent 70%)" }} />

      <div className="relative z-10 max-w-[1200px] mx-auto px-4 sm:px-6 pb-24">

        {/* ── Hero ── */}
        {status === "idle" && (
          <div className="flex flex-col items-center justify-center min-h-screen text-center gap-0 animate-fade-up">
            {/* Decorative ECG line */}
            <div className="w-full max-w-[240px] mb-8 opacity-30">
              <svg viewBox="0 0 180 64" fill="none" className="w-full">
                <path d={ecgPath} stroke="url(#ecgGrad)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                <defs>
                  <linearGradient id="ecgGrad" x1="0" y1="0" x2="180" y2="0">
                    <stop stopColor="#818cf8" />
                    <stop offset="1" stopColor="#22d3ee" />
                  </linearGradient>
                </defs>
              </svg>
            </div>

            {/* Label pill */}
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full mb-5 text-[11px] font-mono font-semibold uppercase tracking-widest"
              style={{
                background: "rgba(34,211,238,0.06)",
                border: "1px solid rgba(34,211,238,0.15)",
                color: "#22d3ee",
              }}>
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 inline-block" style={{ animation: "blink 1s step-end infinite" }} />
              Website Diagnostic Scanner
            </div>

            {/* Wordmark */}
            <h1 className="text-[clamp(48px,10vw,96px)] font-black leading-none tracking-tight mb-3">
              <span className="text-gradient-cyan">Web</span>
              <span className="text-white"> Inspectra</span>
            </h1>
            <p className="text-slate-500 text-base max-w-md leading-relaxed mb-10">
              Enter any URL and get a full diagnostic report — performance, accessibility, security, AI insights, and DOM anatomy.
            </p>

            {/* URL Input */}
            <form onSubmit={scan} className="w-full max-w-xl">
              <div className="relative flex items-center">
                <div className="absolute left-4 w-5 h-5 text-slate-500">
                  <Icon.Globe />
                </div>
                <input
                  ref={inputRef}
                  type="text"
                  placeholder="github.com  ·  stripe.com  ·  any website..."
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  autoFocus
                  className="w-full pl-12 pr-36 py-4 rounded-2xl text-sm font-mono placeholder-slate-600 text-slate-200 outline-none transition-all"
                  style={{
                    background: "rgba(255,255,255,0.03)",
                    border: "1px solid rgba(255,255,255,0.08)",
                    boxShadow: "0 0 0 0 rgba(34,211,238,0)",
                  }}
                  onFocus={(e) => { e.currentTarget.style.border = "1px solid rgba(34,211,238,0.3)"; e.currentTarget.style.boxShadow = "0 0 0 4px rgba(34,211,238,0.06)"; }}
                  onBlur={(e) => { e.currentTarget.style.border = "1px solid rgba(255,255,255,0.08)"; e.currentTarget.style.boxShadow = "none"; }}
                />
                <button
                  type="submit"
                  disabled={!url.trim()}
                  className="absolute right-2 flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all active:scale-95 disabled:opacity-30"
                  style={{
                    background: "linear-gradient(135deg, #22d3ee, #818cf8)",
                    color: "#080810",
                  }}
                >
                  <span className="w-4 h-4"><Icon.Scan /></span>
                  Scan
                </button>
              </div>
            </form>

            {/* Feature pills */}
            <div className="flex flex-wrap justify-center gap-2 mt-8">
              {["Performance Vitals", "DOM Explorer", "AI Diagnostics", "Security Audit", "Accessibility Check", "Tech Stack"].map((f) => (
                <span key={f} className="text-[11px] text-slate-600 px-3 py-1 rounded-full border border-white/5 font-mono">
                  {f}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* ── Loading ── */}
        {status === "loading" && (
          <div className="flex flex-col items-center justify-center min-h-screen gap-8 animate-fade-up">
            <div className="relative w-24 h-24">
              {/* Outer ring */}
              <svg viewBox="0 0 96 96" className="absolute inset-0 w-full h-full" style={{ animation: "rotateSlow 3s linear infinite" }}>
                <circle cx="48" cy="48" r="44" fill="none" stroke="rgba(34,211,238,0.1)" strokeWidth="2" />
                <circle cx="48" cy="48" r="44" fill="none" stroke="rgba(34,211,238,0.6)" strokeWidth="2"
                  strokeDasharray="20 256" strokeLinecap="round" />
              </svg>
              {/* Inner ring */}
              <svg viewBox="0 0 96 96" className="absolute inset-0 w-full h-full" style={{ animation: "rotateSlow 2s linear infinite reverse" }}>
                <circle cx="48" cy="48" r="30" fill="none" stroke="rgba(129,140,248,0.1)" strokeWidth="2" />
                <circle cx="48" cy="48" r="30" fill="none" stroke="rgba(129,140,248,0.8)" strokeWidth="2"
                  strokeDasharray="10 178" strokeLinecap="round" />
              </svg>
              {/* Center icon */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: "rgba(34,211,238,0.1)", border: "1px solid rgba(34,211,238,0.2)" }}>
                  <div className="w-5 h-5 text-cyan-400"><Icon.Scan /></div>
                </div>
              </div>
            </div>

            <div className="text-center">
              <p className="text-slate-300 font-semibold text-sm mb-1">{STEPS[stepIdx].label}</p>
              <p className="text-slate-600 text-xs font-mono">{STEPS[stepIdx].sub}</p>
            </div>

            {/* Step list */}
            <div className="w-full max-w-sm space-y-2">
              {STEPS.map((step, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className={`w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0 transition-all duration-500 ${
                    i < stepIdx ? "bg-cyan-500/20 text-cyan-400" :
                    i === stepIdx ? "bg-violet-500/20 text-violet-400" :
                    "bg-white/5 text-slate-600"
                  }`}>
                    {i < stepIdx ? (
                      <span className="w-2.5 h-2.5"><Icon.Check /></span>
                    ) : i === stepIdx ? (
                      <span className="w-1.5 h-1.5 rounded-full bg-violet-400" style={{ animation: "blink 0.8s step-end infinite" }} />
                    ) : (
                      <span className="w-1.5 h-1.5 rounded-full bg-slate-700" />
                    )}
                  </div>
                  <span className={`text-xs font-mono transition-colors ${
                    i < stepIdx ? "text-slate-600 line-through" :
                    i === stepIdx ? "text-slate-300" :
                    "text-slate-700"
                  }`}>{step.label}</span>
                </div>
              ))}
            </div>

            {/* ECG line */}
            <div className="w-full max-w-sm opacity-20">
              <svg viewBox="0 0 180 32" fill="none" className="w-full">
                <path d={ecgPath.replace("32", "16").replace("54", "28").replace("10", "4").replace("60", "30").replace("24", "10").replace("40", "20")}
                  stroke="#22d3ee" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round"
                  strokeDasharray="300" strokeDashoffset="0"
                  style={{ animation: "ecg 2s linear infinite" }}
                />
              </svg>
            </div>
          </div>
        )}

        {/* ── Error ── */}
        {status === "error" && (
          <div className="flex flex-col items-center justify-center min-h-screen gap-6 animate-fade-up">
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center" style={{ background: "rgba(248,113,113,0.1)", border: "1px solid rgba(248,113,113,0.2)" }}>
              <div className="w-8 h-8 text-rose-400"><Icon.X /></div>
            </div>
            <div className="text-center max-w-md">
              <h3 className="text-rose-400 font-bold text-lg mb-2">Scan Failed</h3>
              <p className="text-slate-500 text-sm font-mono leading-relaxed">{error}</p>
            </div>
            <button
              onClick={reset}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all hover:scale-105"
              style={{ background: "rgba(248,113,113,0.1)", border: "1px solid rgba(248,113,113,0.2)", color: "#f87171" }}
            >
              <span className="w-4 h-4"><Icon.Refresh /></span> Try Again
            </button>
          </div>
        )}

        {/* ── Results ── */}
        {status === "done" && report && (() => {
          const score = calcOverallScore(report);
          const { grade, label: gradeLabel, color: gradeColor, ring: gradeRing } = scoreGrade(score);
          const loadS = (report.performance.totalLoadTime / 1000).toFixed(2);
          const sizeKB = report.performance.totalTransferSize > 1024 * 1024
            ? `${(report.performance.totalTransferSize / 1024 / 1024).toFixed(1)} MB`
            : `${Math.round(report.performance.totalTransferSize / 1024)} KB`;

          const TABS: { id: TabId; label: string; icon: React.ReactNode }[] = [
            { id: "overview",  label: "Overview",     icon: <Icon.Dashboard /> },
            { id: "ai",        label: "AI Doctor",    icon: <Icon.AI />        },
            { id: "vitals",    label: "Vitals",       icon: <Icon.Pulse />     },
            { id: "dom",       label: "DOM Tree",     icon: <Icon.Code />      },
            { id: "network",   label: "Network",      icon: <Icon.Network />   },
            { id: "security",  label: "Security",     icon: <Icon.Shield />    },
          ];

          return (
            <div className="pt-8 animate-fade-up">
              {/* ── Result header bar ── */}
              <div className="flex items-center justify-between gap-4 mb-6 py-3 px-1">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                    style={{ background: "rgba(34,211,238,0.08)", border: "1px solid rgba(34,211,238,0.15)" }}>
                    <div className="w-4 h-4 text-cyan-400"><Icon.Globe /></div>
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-mono font-semibold text-slate-200 truncate">{report.url}</p>
                    <p className="text-[10px] text-slate-600 font-mono">
                      {new Date(report.scannedAt).toLocaleString()}
                    </p>
                  </div>
                </div>
                <button onClick={reset}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-mono font-semibold flex-shrink-0 transition-all hover:bg-white/5"
                  style={{ border: "1px solid rgba(255,255,255,0.07)", color: "#64748b" }}>
                  <span className="w-3.5 h-3.5"><Icon.Refresh /></span> New Scan
                </button>
              </div>

              {/* ── Tab nav ── */}
              <div className="flex gap-0.5 mb-8 overflow-x-auto pb-0" style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                {TABS.map(({ id, label, icon }) => (
                  <button key={id} onClick={() => setTab(id)}
                    className={`flex items-center gap-2 px-4 py-3 text-[11px] font-semibold uppercase tracking-widest whitespace-nowrap transition-all relative ${
                      tab === id ? "text-cyan-400 tab-active" : "text-slate-600 hover:text-slate-400"
                    }`}
                  >
                    <span className="w-3.5 h-3.5 flex-shrink-0">{icon}</span>
                    {label}
                  </button>
                ))}
              </div>

              {/* ══ OVERVIEW ══ */}
              {tab === "overview" && (
                <div className="grid grid-cols-12 gap-5 animate-fade-up">
                  {/* Health score card — spans 4 cols */}
                  <div className="col-span-12 md:col-span-4 rounded-2xl p-6 flex flex-col items-center justify-center gap-4 text-center relative overflow-hidden"
                    style={{ background: `radial-gradient(circle at 50% 0%, ${gradeRing}, transparent 70%)`, border: `1px solid ${gradeColor}20` }}>
                    <div className="text-[11px] uppercase tracking-widest font-semibold text-slate-500">Overall Health</div>
                    <div className="relative">
                      <div className="text-[80px] font-black leading-none font-mono" style={{ color: gradeColor }}>{grade}</div>
                      <div className="text-[13px] font-semibold" style={{ color: gradeColor }}>{gradeLabel}</div>
                    </div>
                    <div className="text-4xl font-black font-mono text-slate-300">{score}<span className="text-slate-600 text-xl">/100</span></div>
                    <div className="w-full h-px" style={{ background: `linear-gradient(90deg, transparent, ${gradeColor}40, transparent)` }} />
                    <p className="text-[11px] text-slate-500 leading-relaxed">Combined score from performance, accessibility & security</p>
                  </div>

                  {/* Stat chips — spans 8 cols */}
                  <div className="col-span-12 md:col-span-8 flex flex-col gap-5">
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      <Chip value={`${loadS}s`} label="Load Time" color="#22d3ee" />
                      <Chip value={`${report.performance.resourceCount}`} label="Requests" color="#818cf8" />
                      <Chip value={`${report.accessibility.score}`} label="A11y Score" color="#34d399" />
                      <Chip value={sizeKB} label="Page Size" color="#fbbf24" />
                    </div>

                    {/* AI prognosis */}
                    <div className="flex-1 rounded-2xl p-5 relative overflow-hidden"
                      style={{ background: "rgba(129,140,248,0.04)", border: "1px solid rgba(129,140,248,0.12)" }}>
                      <div className="flex items-center gap-2 mb-3">
                        <div className="w-4 h-4 text-violet-400"><Icon.AI /></div>
                        <span className="text-[10px] uppercase tracking-widest font-semibold text-violet-400">AI Prognosis</span>
                      </div>
                      <p className="text-sm text-slate-400 leading-relaxed">
                        {report.aiSummary?.overallHealth || "Add GEMINI_API_KEY to backend/.env to enable AI analysis."}
                      </p>
                    </div>
                  </div>

                  {/* Tech stack */}
                  <div className="col-span-12 rounded-2xl p-5" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)" }}>
                    <SectionHeading>Detected Technology Stack</SectionHeading>
                    <div className="flex flex-wrap gap-2">
                      {report.techStack.hosting && report.techStack.hosting !== "Unknown" && (
                        <span className="px-3 py-1.5 rounded-lg text-xs font-mono font-semibold" style={{ background: "rgba(34,211,238,0.08)", border: "1px solid rgba(34,211,238,0.2)", color: "#22d3ee" }}>
                          ☁ {report.techStack.hosting}
                        </span>
                      )}
                      {[...report.techStack.frameworks, ...report.techStack.cssLibraries, ...report.techStack.analytics, ...report.techStack.other].map((t, i) => (
                        <span key={i} className="px-3 py-1.5 rounded-lg text-xs font-mono font-semibold" style={{ background: "rgba(129,140,248,0.08)", border: "1px solid rgba(129,140,248,0.15)", color: "#a78bfa" }}>
                          {t}
                        </span>
                      ))}
                      {report.techStack.frameworks.length + report.techStack.cssLibraries.length === 0 && (
                        <span className="text-slate-600 text-xs italic font-mono">No frameworks detected — vanilla HTML/CSS/JS</span>
                      )}
                    </div>
                  </div>

                  {/* Top findings preview */}
                  <div className="col-span-12">
                    <SectionHeading>Top Priority Issues</SectionHeading>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {(report.aiSummary?.findings?.slice(0, 3) || []).map((f, i) => (
                        <div key={i} className="rounded-xl p-4 flex flex-col gap-3 metric-card"
                          style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)" }}>
                          <div className="flex items-start justify-between gap-2">
                            <ImpactBadge impact={f.impact} />
                            <span className="text-[10px] font-mono text-slate-600 uppercase">{f.category}</span>
                          </div>
                          <p className="text-xs font-semibold text-slate-300">{f.title}</p>
                          <p className="text-[11px] text-slate-500 leading-relaxed">{f.explanation.substring(0, 120)}{f.explanation.length > 120 ? "…" : ""}</p>
                          <button onClick={() => setTab("ai")} className="text-[10px] font-mono text-cyan-500 hover:text-cyan-400 self-start flex items-center gap-1 transition-colors">
                            Full details <span className="w-3 h-3"><Icon.ArrowRight /></span>
                          </button>
                        </div>
                      ))}
                      {!report.aiSummary?.findings?.length && (
                        <div className="col-span-3 text-center py-8 text-slate-600 text-sm">
                          No AI findings — add GEMINI_API_KEY to backend/.env
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* ══ AI DOCTOR ══ */}
              {tab === "ai" && (
                <div className="flex flex-col gap-6 animate-fade-up">
                  {/* Big summary */}
                  <div className="rounded-2xl p-6 relative overflow-hidden"
                    style={{ background: "linear-gradient(135deg, rgba(129,140,248,0.06) 0%, rgba(34,211,238,0.03) 100%)", border: "1px solid rgba(129,140,248,0.15)" }}>
                    <div className="flex items-center gap-2 mb-4">
                      <div className="w-6 h-6 text-violet-400"><Icon.AI /></div>
                      <span className="text-xs uppercase tracking-widest font-semibold text-violet-400">AI Chief Medical Officer</span>
                    </div>
                    <p className="text-slate-300 leading-relaxed">{report.aiSummary?.overallHealth || "Enable AI by adding GEMINI_API_KEY to backend/.env"}</p>
                  </div>

                  {/* Findings */}
                  <SectionHeading>Full Diagnostic Report — {report.aiSummary?.findings?.length || 0} findings</SectionHeading>
                  <div className="flex flex-col gap-4">
                    {(report.aiSummary?.findings || []).map((f, i) => (
                      <div key={i} className="rounded-xl p-5 flex gap-5 items-start group metric-card"
                        style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)" }}>
                        {/* Number */}
                        <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 font-mono text-xs font-bold"
                          style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", color: "#475569" }}>
                          {i + 1}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap mb-2">
                            <ImpactBadge impact={f.impact} />
                            <span className="text-[10px] font-mono text-slate-600 uppercase tracking-widest">{f.category}</span>
                          </div>
                          <h4 className="text-sm font-semibold text-slate-200 mb-2">{f.title}</h4>
                          <p className="text-xs text-slate-400 leading-relaxed">{f.explanation}</p>
                        </div>
                      </div>
                    ))}
                    {!report.aiSummary?.findings?.length && (
                      <div className="text-center py-16 text-slate-600">
                        <div className="w-8 h-8 mx-auto mb-3 opacity-30"><Icon.AI /></div>
                        <p className="text-sm">No findings — add GEMINI_API_KEY to backend/.env for AI analysis</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* ══ VITALS ══ */}
              {tab === "vitals" && (
                <div className="flex flex-col gap-8 animate-fade-up">
                  <SectionHeading>Core Web Vitals</SectionHeading>
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-6">
                    {[
                      { label: "LCP", val: report.performance.lcp, suffix: "ms", good: 2500, poor: 4000, subtitle: "Largest Contentful Paint" },
                      { label: "FCP", val: report.performance.fcp, suffix: "ms", good: 1800, poor: 3000, subtitle: "First Contentful Paint" },
                      { label: "TTI", val: report.performance.tti, suffix: "ms", good: 3800, poor: 7300, subtitle: "Time to Interactive" },
                      { label: "CLS", val: report.performance.cls, suffix: "", good: 0.1, poor: 0.25, subtitle: "Layout Shift", isCls: true },
                      { label: "INP", val: report.performance.inp, suffix: "ms", good: 200, poor: 500, subtitle: "Interaction Delay" },
                    ].map(({ label, val, good, poor, subtitle, isCls }) => {
                      const score = isCls
                        ? val <= good ? 92 : val <= poor ? 58 : 22
                        : Math.max(0, Math.min(100, 100 - ((val - good) / (poor - good)) * 100));
                      const displayVal = isCls
                        ? (val as number).toFixed(3)
                        : val >= 1000 ? `${((val as number) / 1000).toFixed(2)}s` : `${Math.round(val as number)}ms`;
                      return (
                        <div key={label} className="flex flex-col items-center gap-3 p-4 rounded-2xl metric-card"
                          style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)" }}>
                          <ScoreGauge score={Math.round(score)} label={label} subtitle={`${displayVal} · ${subtitle}`} size={90} />
                        </div>
                      );
                    })}
                  </div>

                  {/* Summary row */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                    {[
                      { icon: <Icon.Clock />, val: `${loadS}s`, label: "Total Load Time", color: "#22d3ee" },
                      { icon: <Icon.Network />, val: `${report.performance.resourceCount}`, label: "Total Requests", color: "#818cf8" },
                      { icon: <Icon.Eye />, val: sizeKB, label: "Transfer Size", color: "#34d399" },
                    ].map(({ icon, val, label, color }) => (
                      <div key={label} className="flex items-center gap-4 p-4 rounded-2xl metric-card"
                        style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)" }}>
                        <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                          style={{ background: `${color}12`, border: `1px solid ${color}20`, color }}>
                          <div className="w-5 h-5">{icon}</div>
                        </div>
                        <div>
                          <p className="font-mono text-lg font-bold text-slate-200">{val}</p>
                          <p className="text-[10px] uppercase tracking-widest text-slate-500">{label}</p>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* AI performance notes */}
                  {report.aiSummary?.findings?.filter(f => f.category === "performance").length! > 0 && (
                    <div className="rounded-2xl p-5" style={{ background: "rgba(129,140,248,0.04)", border: "1px solid rgba(129,140,248,0.1)" }}>
                      <SectionHeading>AI Performance Notes</SectionHeading>
                      <div className="flex flex-col gap-4">
                        {report.aiSummary?.findings?.filter(f => f.category === "performance").map((f, i) => (
                          <div key={i} className="flex gap-3 items-start">
                            <ImpactBadge impact={f.impact} />
                            <div>
                              <p className="text-xs font-semibold text-slate-300 mb-1">{f.title}</p>
                              <p className="text-xs text-slate-500 leading-relaxed">{f.explanation}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* ══ DOM TREE ══ */}
              {tab === "dom" && (
                <div className="grid grid-cols-12 gap-5 animate-fade-up">
                  {/* Stats sidebar */}
                  <div className="col-span-12 md:col-span-3 flex flex-col gap-4">
                    <SectionHeading>DOM Stats</SectionHeading>
                    {[
                      { label: "Total Nodes", val: report.dom.nodeCount, warn: report.dom.nodeCount > 1500, warnText: "> 1500 is bloated" },
                      { label: "Max Depth", val: `${report.dom.maxDepth} levels`, warn: report.dom.maxDepth > 32, warnText: "> 32 is excessive" },
                    ].map(({ label, val, warn, warnText }) => (
                      <div key={label} className="p-4 rounded-xl" style={{ background: "rgba(255,255,255,0.02)", border: `1px solid ${warn ? "rgba(248,113,113,0.2)" : "rgba(255,255,255,0.06)"}` }}>
                        <p className="text-[10px] uppercase tracking-widest text-slate-500 mb-1">{label}</p>
                        <p className={`font-mono font-bold text-lg ${warn ? "text-rose-400" : "text-slate-200"}`}>{val}</p>
                        {warn && <p className="text-[10px] text-rose-500 mt-1">⚠ {warnText}</p>}
                      </div>
                    ))}

                    <div className="p-4 rounded-xl" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)" }}>
                      <p className="text-[10px] uppercase tracking-widest text-slate-500 mb-3">Heaviest Subtrees</p>
                      <div className="flex flex-col gap-2">
                        {(report.dom.largestSubtrees || []).map((s, i) => (
                          <div key={i}>
                            <p className="text-[10px] font-mono text-violet-400 truncate" title={s.selector}>{s.selector}</p>
                            <p className="text-[10px] text-slate-600">{s.nodeCount} nodes</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Tree */}
                  <div className="col-span-12 md:col-span-9 rounded-2xl overflow-hidden"
                    style={{ background: "rgba(255,255,255,0.015)", border: "1px solid rgba(255,255,255,0.06)" }}>
                    <div className="flex items-center gap-2 px-4 py-3 border-b" style={{ borderColor: "rgba(255,255,255,0.06)" }}>
                      <div className="flex gap-1.5">
                        {["#f87171", "#fbbf24", "#34d399"].map((c) => (
                          <span key={c} className="w-3 h-3 rounded-full" style={{ backgroundColor: c, opacity: 0.7 }} />
                        ))}
                      </div>
                      <span className="text-[10px] font-mono text-slate-600 ml-2">DOM Tree Explorer</span>
                    </div>
                    <div className="p-4 max-h-[600px] overflow-y-auto">
                      {report.dom.tree ? <DOMTreeViewer node={report.dom.tree} /> : <p className="text-slate-600 text-xs">No DOM data</p>}
                    </div>
                  </div>
                </div>
              )}

              {/* ══ NETWORK ══ */}
              {tab === "network" && (
                <div className="flex flex-col gap-6 animate-fade-up">
                  {/* Stats row */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    {[
                      { val: report.network.totalRequests, label: "Total Requests", color: "#22d3ee" },
                      { val: report.network.failedRequests, label: "Failed", color: report.network.failedRequests > 0 ? "#f87171" : "#34d399" },
                      { val: report.network.requests.filter(r => r.duration > 1000).length, label: "Slow (>1s)", color: "#fbbf24" },
                      { val: sizeKB, label: "Total Size", color: "#818cf8" },
                    ].map(({ val, label, color }) => (
                      <div key={label} className="p-4 rounded-xl text-center metric-card"
                        style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)" }}>
                        <p className="font-mono text-xl font-bold mb-1" style={{ color }}>{val}</p>
                        <p className="text-[10px] uppercase tracking-widest text-slate-500">{label}</p>
                      </div>
                    ))}
                  </div>

                  <div className="rounded-2xl p-5" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)" }}>
                    <SectionHeading>Resource Waterfall</SectionHeading>
                    <WaterfallChart requests={report.network.requests} />
                  </div>
                </div>
              )}

              {/* ══ SECURITY ══ */}
              {tab === "security" && (
                <div className="grid grid-cols-12 gap-5 animate-fade-up">
                  {/* Score */}
                  <div className="col-span-12 md:col-span-4 flex flex-col gap-4">
                    <div className="p-6 rounded-2xl flex flex-col items-center text-center gap-4"
                      style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)" }}>
                      <ScoreGauge score={report.security.score} label="Security Score" subtitle="HTTP headers audit" size={120} />
                    </div>

                    {/* AI security */}
                    {report.aiSummary?.findings?.filter(f => f.category === "security").map((f, i) => (
                      <div key={i} className="p-4 rounded-xl" style={{ background: "rgba(248,113,113,0.04)", border: "1px solid rgba(248,113,113,0.12)" }}>
                        <div className="flex items-center gap-2 mb-2">
                          <ImpactBadge impact={f.impact} />
                          <span className="text-[10px] font-mono text-slate-500">{f.category}</span>
                        </div>
                        <p className="text-xs font-semibold text-slate-300 mb-1">{f.title}</p>
                        <p className="text-[11px] text-slate-500 leading-relaxed">{f.explanation}</p>
                      </div>
                    ))}
                  </div>

                  {/* Headers */}
                  <div className="col-span-12 md:col-span-8 rounded-2xl overflow-hidden"
                    style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)" }}>
                    <div className="px-5 py-4 border-b" style={{ borderColor: "rgba(255,255,255,0.06)" }}>
                      <SectionHeading>HTTP Security Headers</SectionHeading>
                    </div>
                    <div className="divide-y" style={{ borderColor: "rgba(255,255,255,0.04)" }}>
                      {report.security.headers.map((h, i) => (
                        <div key={i} className="px-5 py-4 flex items-start gap-4 group hover:bg-white/[0.015] transition-colors">
                          <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${h.present ? "text-emerald-400" : "text-rose-400"}`}
                            style={{ background: h.present ? "rgba(52,211,153,0.1)" : "rgba(248,113,113,0.1)", border: `1px solid ${h.present ? "rgba(52,211,153,0.2)" : "rgba(248,113,113,0.2)"}` }}>
                            <span className="w-3 h-3">{h.present ? <Icon.Check /> : <Icon.X />}</span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap mb-1">
                              <span className="text-xs font-mono font-semibold text-slate-300">{h.header}</span>
                              {!h.present && h.risk !== "none" && (
                                <span className="text-[9px] font-mono uppercase px-1.5 py-0.5 rounded border"
                                  style={{
                                    color: h.risk === "high" ? "#f87171" : h.risk === "medium" ? "#fbbf24" : "#94a3b8",
                                    background: h.risk === "high" ? "rgba(248,113,113,0.08)" : h.risk === "medium" ? "rgba(251,191,36,0.08)" : "rgba(148,163,184,0.08)",
                                    borderColor: h.risk === "high" ? "rgba(248,113,113,0.2)" : h.risk === "medium" ? "rgba(251,191,36,0.2)" : "rgba(148,163,184,0.1)",
                                  }}>
                                  {h.risk} risk
                                </span>
                              )}
                            </div>
                            <p className="text-[11px] text-slate-500 leading-relaxed">{h.description}</p>
                            {h.value && (
                              <p className="text-[10px] font-mono text-slate-600 mt-1 truncate">{h.value.substring(0, 80)}</p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Accessibility summary in security tab */}
                  <div className="col-span-12 rounded-2xl overflow-hidden"
                    style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)" }}>
                    <div className="px-5 py-4 flex items-center justify-between border-b" style={{ borderColor: "rgba(255,255,255,0.06)" }}>
                      <SectionHeading>Accessibility Violations ({report.accessibility.violations.length})</SectionHeading>
                      <span className="font-mono text-xs font-bold" style={{ color: report.accessibility.score >= 80 ? "#34d399" : "#fbbf24" }}>
                        {report.accessibility.score}/100
                      </span>
                    </div>
                    {report.accessibility.violations.length === 0 ? (
                      <div className="flex flex-col items-center justify-center py-10 gap-2">
                        <div className="w-10 h-10 rounded-2xl flex items-center justify-center text-emerald-400"
                          style={{ background: "rgba(52,211,153,0.1)", border: "1px solid rgba(52,211,153,0.2)" }}>
                          <span className="w-5 h-5"><Icon.Check /></span>
                        </div>
                        <p className="text-emerald-400 font-semibold text-sm">No violations detected</p>
                        <p className="text-slate-600 text-xs">{report.accessibility.passes} rules passed</p>
                      </div>
                    ) : (
                      <div className="divide-y" style={{ borderColor: "rgba(255,255,255,0.04)" }}>
                        {report.accessibility.violations.map((v, i) => {
                          const impactColor = { critical: "#f87171", serious: "#fb923c", moderate: "#fbbf24", minor: "#22d3ee" }[v.impact] || "#94a3b8";
                          return (
                            <div key={i} className="px-5 py-4 flex gap-4 items-start hover:bg-white/[0.015] transition-colors">
                              <span className="text-[9px] font-mono uppercase font-bold px-2 py-1 rounded-full border flex-shrink-0 mt-0.5"
                                style={{ color: impactColor, background: `${impactColor}12`, borderColor: `${impactColor}30` }}>
                                {v.impact}
                              </span>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                  <span className="text-xs font-mono font-semibold text-slate-300">{v.id}</span>
                                  <a href={v.helpUrl} target="_blank" rel="noopener noreferrer"
                                    className="text-[10px] text-slate-600 hover:text-cyan-400 flex items-center gap-0.5 transition-colors">
                                    docs <span className="w-2.5 h-2.5"><Icon.ExternalLink /></span>
                                  </a>
                                </div>
                                <p className="text-[11px] text-slate-500 mt-0.5 leading-relaxed">{v.description}</p>
                                {v.nodes.length > 0 && (
                                  <div className="mt-2 flex flex-wrap gap-1">
                                    {v.nodes.slice(0, 4).map((n, ni) => (
                                      <span key={ni} className="text-[9px] font-mono text-violet-400 bg-violet-400/5 border border-violet-400/10 px-1.5 py-0.5 rounded truncate max-w-[200px]">
                                        {n}
                                      </span>
                                    ))}
                                    {v.nodes.length > 4 && <span className="text-[9px] text-slate-600 self-center">+{v.nodes.length - 4} more</span>}
                                  </div>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })()}
      </div>
    </div>
  );
}
