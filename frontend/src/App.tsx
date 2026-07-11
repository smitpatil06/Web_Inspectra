import React, { useState, useEffect } from "react";
import type { ScanReport } from "@web-inspectra/shared-types";
import DOMTreeViewer from "./components/DOMTreeViewer";
import WaterfallChart from "./components/WaterfallChart";
import ScoreGauge from "./components/ScoreGauge";
import {
  Activity,
  HeartPulse,
  Sparkles,
  Network,
  CheckCircle2,
  AlertTriangle,
  AlertOctagon,
  RefreshCw,
  GitCompare,
  ExternalLink,
  ShieldCheck,
  Globe,
  Clock,
  HardDrive,
  Code,
  LayoutDashboard,
  Zap,
} from "lucide-react";

const SCAN_STEPS = [
  "🔬 Calibrating MRI scanner...",
  "🧬 Injecting network contrast agents...",
  "🛡️ Auditing security immune system...",
  "💀 Reading HTML skeletal anatomy...",
  "♿ Testing accessibility reflexes...",
  "❤️ Measuring Lighthouse cardio vitals...",
  "🩺 Consulting AI Chief Medical Officer...",
  "📋 Compiling visual anatomy report...",
];

type TabType = "overview" | "ai" | "performance" | "dom" | "accessibility" | "security";
type CompareTabType = "matchup" | "ai" | "performance" | "accessibility" | "security";

export default function App() {
  const [activeMode, setActiveMode] = useState<"single" | "compare">("single");

  // Single scan state
  const [singleUrl, setSingleUrl] = useState("");
  const [scanStatus, setScanStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [currentStepIdx, setCurrentStepIdx] = useState(0);
  const [report, setReport] = useState<ScanReport | null>(null);
  const [scanError, setScanError] = useState("");
  const [activeTab, setActiveTab] = useState<TabType>("overview");

  // Compare state
  const [urlA, setUrlA] = useState("");
  const [urlB, setUrlB] = useState("");
  const [compareStatus, setCompareStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [compareStepIdx, setCompareStepIdx] = useState(0);
  const [reportA, setReportA] = useState<ScanReport | null>(null);
  const [reportB, setReportB] = useState<ScanReport | null>(null);
  const [compareError, setCompareError] = useState("");
  const [compareTab, setCompareTab] = useState<CompareTabType>("matchup");

  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (scanStatus === "loading") {
      setCurrentStepIdx(0);
      interval = setInterval(() => {
        setCurrentStepIdx((prev) => (prev < SCAN_STEPS.length - 2 ? prev + 1 : prev));
      }, 2500);
    }
    return () => clearInterval(interval);
  }, [scanStatus]);

  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (compareStatus === "loading") {
      setCompareStepIdx(0);
      interval = setInterval(() => {
        setCompareStepIdx((prev) => (prev < SCAN_STEPS.length - 2 ? prev + 1 : prev));
      }, 3500);
    }
    return () => clearInterval(interval);
  }, [compareStatus]);

  const doScan = async (url: string): Promise<ScanReport> => {
    const response = await fetch("/api/scan", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url }),
    });
    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err.error || `HTTP ${response.status}: Failed to scan`);
    }
    const data = await response.json();
    return data.report;
  };

  const handleSingleScan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!singleUrl) return;
    setScanStatus("loading");
    setScanError("");
    setReport(null);
    try {
      const result = await doScan(singleUrl);
      setCurrentStepIdx(SCAN_STEPS.length - 1);
      setReport(result);
      setScanStatus("success");
      setActiveTab("overview");
    } catch (err: any) {
      setScanError(err.message || "Unexpected error. Is the backend running on port 3001?");
      setScanStatus("error");
    }
  };

  const handleCompareScan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!urlA || !urlB) return;
    setCompareStatus("loading");
    setCompareError("");
    setReportA(null);
    setReportB(null);
    try {
      const [ra, rb] = await Promise.all([doScan(urlA), doScan(urlB)]);
      setReportA(ra);
      setReportB(rb);
      setCompareStatus("success");
      setCompareTab("matchup");
    } catch (err: any) {
      setCompareError(err.message || "Unexpected error during comparison.");
      setCompareStatus("error");
    }
  };

  const impactColor = (impact: "low" | "medium" | "high") =>
    impact === "high"
      ? "bg-red-500/10 text-red-400 border-red-500/20"
      : impact === "medium"
      ? "bg-amber-500/10 text-amber-400 border-amber-500/20"
      : "bg-sky-500/10 text-sky-400 border-sky-500/20";

  const impactIcon = (impact: "low" | "medium" | "high") =>
    impact === "high" ? (
      <AlertOctagon className="w-4 h-4 text-red-400 mr-1" />
    ) : impact === "medium" ? (
      <AlertTriangle className="w-4 h-4 text-amber-400 mr-1" />
    ) : (
      <CheckCircle2 className="w-4 h-4 text-sky-400 mr-1" />
    );

  const tabBtn = (id: TabType, label: string, icon: React.ReactNode) => (
    <button
      onClick={() => setActiveTab(id)}
      className={`flex items-center gap-2 px-4 py-3 text-xs font-bold tracking-wide uppercase border-b-2 whitespace-nowrap transition-all ${
        activeTab === id
          ? "border-purple-500 text-purple-400"
          : "border-transparent text-zinc-500 hover:text-zinc-300"
      }`}
    >
      {icon} {label}
    </button>
  );

  const cmpTabBtn = (id: CompareTabType, label: string) => (
    <button
      onClick={() => setCompareTab(id)}
      className={`flex items-center gap-2 px-4 py-3 text-xs font-bold tracking-wide uppercase border-b-2 whitespace-nowrap transition-all ${
        compareTab === id
          ? "border-purple-500 text-purple-400"
          : "border-transparent text-zinc-500 hover:text-zinc-300"
      }`}
    >
      {label}
    </button>
  );

  // Compute overall score from report
  const overallScore = (r: ScanReport) => {
    const perf = Math.max(0, 100 - Math.min((r.performance.totalLoadTime / 80), 100));
    const a11y = r.accessibility.score;
    const sec = r.security.score;
    return Math.round((perf + a11y + sec) / 3);
  };

  const scoreGrade = (s: number) =>
    s >= 90 ? { grade: "A", color: "text-emerald-400", bg: "bg-emerald-500/10 border-emerald-500/30" } :
    s >= 75 ? { grade: "B", color: "text-cyan-400", bg: "bg-cyan-500/10 border-cyan-500/30" } :
    s >= 60 ? { grade: "C", color: "text-amber-400", bg: "bg-amber-500/10 border-amber-500/30" } :
    s >= 45 ? { grade: "D", color: "text-orange-400", bg: "bg-orange-500/10 border-orange-500/30" } :
    { grade: "F", color: "text-red-400", bg: "bg-red-500/10 border-red-500/30" };

  const LoadingBox = ({ stepIdx }: { stepIdx: number }) => (
    <div className="w-full max-w-lg bg-zinc-900/60 border border-zinc-800 p-8 rounded-3xl flex flex-col items-center text-center backdrop-blur-md shadow-2xl">
      <div className="relative mb-6">
        <div className="w-16 h-16 border-4 border-zinc-800 rounded-full" />
        <div className="w-16 h-16 border-4 border-purple-500 border-t-transparent rounded-full animate-spin absolute inset-0" />
        <span className="absolute inset-0 flex items-center justify-center text-2xl">🩺</span>
      </div>
      <h3 className="text-lg font-bold text-zinc-200">Website MRI in Progress</h3>
      <p className="text-zinc-500 text-xs mt-1 mb-6">Running full diagnostic scan (15–30 seconds)</p>
      <div className="w-full bg-zinc-950 border border-zinc-900 rounded-xl p-4 text-left space-y-2">
        {SCAN_STEPS.map((step, idx) => (
          <div key={idx} className="flex items-center gap-3 text-xs transition-all duration-300">
            <span className="w-5 h-5 flex items-center justify-center flex-shrink-0">
              {stepIdx > idx ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              ) : stepIdx === idx ? (
                <RefreshCw className="w-3.5 h-3.5 text-purple-400 animate-spin" />
              ) : (
                <span className="w-1.5 h-1.5 rounded-full bg-zinc-700 inline-block" />
              )}
            </span>
            <span
              className={
                stepIdx === idx
                  ? "text-purple-400 font-semibold"
                  : stepIdx > idx
                  ? "text-zinc-600 line-through"
                  : "text-zinc-600"
              }
            >
              {step}
            </span>
          </div>
        ))}
      </div>
    </div>
  );

  const ErrorBox = ({ message, onRetry }: { message: string; onRetry: () => void }) => (
    <div className="w-full max-w-xl bg-red-500/5 border border-red-500/20 p-6 rounded-2xl flex items-start gap-4">
      <AlertOctagon className="w-6 h-6 text-red-500 flex-shrink-0 mt-0.5" />
      <div className="flex-1">
        <h4 className="font-bold text-red-400 text-sm">Scan Failed — Diagnostic Error</h4>
        <p className="text-zinc-400 text-xs mt-2 leading-relaxed font-mono">{message}</p>
        <p className="text-zinc-500 text-xs mt-2">Make sure the backend is running: <code className="text-purple-400">pnpm run dev:backend</code></p>
        <button
          onClick={onRetry}
          className="mt-3 text-xs bg-red-500/20 hover:bg-red-500/30 text-red-300 font-semibold px-4 py-2 rounded-lg border border-red-500/20 transition-colors"
        >
          Try Again
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-black text-zinc-100 relative overflow-x-hidden">
      {/* Background */}
      <div
        className="fixed inset-0 pointer-events-none"
        style={{
          backgroundImage:
            "linear-gradient(to right, #8080800a 1px, transparent 1px), linear-gradient(to bottom, #8080800a 1px, transparent 1px)",
          backgroundSize: "24px 24px",
        }}
      />
      <div className="fixed top-0 left-0 w-1/2 h-1/2 bg-purple-900/8 blur-[150px] rounded-full pointer-events-none" />
      <div className="fixed bottom-0 right-0 w-1/2 h-1/2 bg-indigo-900/8 blur-[150px] rounded-full pointer-events-none" />

      <div className="relative z-10 max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <header className="flex flex-col items-center text-center mt-6 mb-10">
          <div className="flex items-center gap-2 px-3 py-1 rounded-full border border-purple-500/30 bg-purple-500/5 text-purple-400 text-xs font-bold uppercase tracking-wider mb-4">
            <Sparkles className="w-3.5 h-3.5 animate-pulse" /> AI-Powered Website MRI Scanner
          </div>
          <h1 className="text-5xl md:text-7xl font-black tracking-tight"
            style={{ background: "linear-gradient(135deg, #a855f7, #6366f1, #22d3ee)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
            Web Inspectra
          </h1>
          <p className="text-zinc-400 mt-3 text-sm md:text-lg max-w-2xl leading-relaxed">
            Diagnose the digital health of any website — interactive MRI scan with AI-prescribed treatments in plain English.
          </p>

          {/* Mode Toggle */}
          <div className="flex bg-zinc-900/80 border border-zinc-800 rounded-xl p-1 mt-6 gap-1">
            <button
              onClick={() => { setActiveMode("single"); setScanStatus("idle"); }}
              className={`flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-lg transition-all ${
                activeMode === "single"
                  ? "bg-purple-600 text-white shadow-lg shadow-purple-500/20"
                  : "text-zinc-400 hover:text-zinc-200"
              }`}
            >
              <Activity className="w-4 h-4" /> Single URL Scan
            </button>
            <button
              onClick={() => { setActiveMode("compare"); setCompareStatus("idle"); }}
              className={`flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-lg transition-all ${
                activeMode === "compare"
                  ? "bg-purple-600 text-white shadow-lg shadow-purple-500/20"
                  : "text-zinc-400 hover:text-zinc-200"
              }`}
            >
              <GitCompare className="w-4 h-4" /> Side-by-Side Comparison
            </button>
          </div>
        </header>

        {/* ── SINGLE SCAN MODE ── */}
        {activeMode === "single" && (
          <div className="flex flex-col items-center gap-6">
            {/* URL Input */}
            {scanStatus !== "loading" && (
              <form
                onSubmit={handleSingleScan}
                className="w-full max-w-2xl flex items-center gap-2 bg-zinc-900/60 border border-zinc-800 rounded-2xl p-2 shadow-2xl hover:border-zinc-700 transition-colors"
              >
                <Globe className="w-5 h-5 text-zinc-500 ml-3 flex-shrink-0" />
                <input
                  type="text"
                  placeholder="Enter any website URL — e.g. example.com, github.com..."
                  value={singleUrl}
                  onChange={(e) => setSingleUrl(e.target.value)}
                  className="flex-1 bg-transparent border-0 outline-none text-zinc-100 placeholder-zinc-600 text-sm py-2.5 px-2"
                />
                <button
                  type="submit"
                  disabled={!singleUrl}
                  className="flex items-center gap-2 bg-purple-600 hover:bg-purple-500 disabled:opacity-40 text-white text-sm font-semibold px-5 py-2.5 rounded-xl transition-all active:scale-95"
                >
                  <Zap className="w-4 h-4" /> Scan Site
                </button>
              </form>
            )}

            {scanStatus === "loading" && <LoadingBox stepIdx={currentStepIdx} />}
            {scanStatus === "error" && <ErrorBox message={scanError} onRetry={() => setScanStatus("idle")} />}

            {/* RESULTS */}
            {scanStatus === "success" && report && (
              <div className="w-full animate-fade-in">
                {/* Result Header */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-zinc-900/40 border border-zinc-800 p-5 rounded-2xl mb-4">
                  <div className="flex items-center gap-3">
                    <Globe className="w-6 h-6 text-purple-400 flex-shrink-0" />
                    <div>
                      <h2 className="text-lg font-extrabold text-zinc-100">{report.url}</h2>
                      <p className="text-zinc-500 text-xs mt-0.5">
                        Scanned {new Date(report.scannedAt).toLocaleString()}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => { setScanStatus("idle"); setReport(null); }}
                    className="text-xs bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-semibold px-4 py-2.5 rounded-xl border border-zinc-700 transition-all"
                  >
                    ↩ New Scan
                  </button>
                </div>

                {/* Tab Navigation */}
                <div className="flex border-b border-zinc-800 overflow-x-auto mb-6">
                  {tabBtn("overview", "Overview", <LayoutDashboard className="w-4 h-4" />)}
                  {tabBtn("ai", "🩺 AI Doctor", <Sparkles className="w-4 h-4" />)}
                  {tabBtn("performance", "❤️ Vitals", <Activity className="w-4 h-4" />)}
                  {tabBtn("dom", "💀 DOM Anatomy", <Code className="w-4 h-4" />)}
                  {tabBtn("accessibility", "♿ Accessibility", <HeartPulse className="w-4 h-4" />)}
                  {tabBtn("security", "🛡️ Security & Tech", <ShieldCheck className="w-4 h-4" />)}
                </div>

                {/* ── OVERVIEW TAB ── */}
                {activeTab === "overview" && (() => {
                  const score = overallScore(report);
                  const { grade, color, bg } = scoreGrade(score);
                  const topFindings = report.aiSummary?.findings?.slice(0, 3) || [];
                  return (
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                      {/* Left: Score + Summary */}
                      <div className="lg:col-span-1 flex flex-col gap-4">
                        {/* Overall Health Score */}
                        <div className={`border rounded-2xl p-6 flex flex-col items-center text-center ${bg}`}>
                          <p className="text-zinc-400 text-xs uppercase font-bold tracking-wider mb-2">Overall Health Score</p>
                          <div className={`text-7xl font-black ${color}`}>{score}</div>
                          <div className={`text-3xl font-black mt-1 ${color}`}>Grade {grade}</div>
                          <p className="text-zinc-500 text-xs mt-3">Combined performance, accessibility & security rating</p>
                        </div>

                        {/* Stat Chips */}
                        <div className="grid grid-cols-2 gap-3">
                          <div className="bg-zinc-900/60 border border-zinc-800 rounded-xl p-3 text-center">
                            <Clock className="w-5 h-5 text-cyan-400 mx-auto mb-1" />
                            <div className="text-base font-bold text-zinc-200">{(report.performance.totalLoadTime / 1000).toFixed(2)}s</div>
                            <div className="text-zinc-500 text-[10px] uppercase font-semibold">Load Time</div>
                          </div>
                          <div className="bg-zinc-900/60 border border-zinc-800 rounded-xl p-3 text-center">
                            <Network className="w-5 h-5 text-purple-400 mx-auto mb-1" />
                            <div className="text-base font-bold text-zinc-200">{report.performance.resourceCount}</div>
                            <div className="text-zinc-500 text-[10px] uppercase font-semibold">Requests</div>
                          </div>
                          <div className="bg-zinc-900/60 border border-zinc-800 rounded-xl p-3 text-center">
                            <HeartPulse className="w-5 h-5 text-emerald-400 mx-auto mb-1" />
                            <div className="text-base font-bold text-zinc-200">{report.accessibility.score}</div>
                            <div className="text-zinc-500 text-[10px] uppercase font-semibold">A11y Score</div>
                          </div>
                          <div className="bg-zinc-900/60 border border-zinc-800 rounded-xl p-3 text-center">
                            <ShieldCheck className="w-5 h-5 text-amber-400 mx-auto mb-1" />
                            <div className="text-base font-bold text-zinc-200">{report.security.score}</div>
                            <div className="text-zinc-500 text-[10px] uppercase font-semibold">Security</div>
                          </div>
                        </div>

                        {/* Tech Stack Summary */}
                        <div className="bg-zinc-900/40 border border-zinc-800 rounded-xl p-4">
                          <p className="text-zinc-500 text-[10px] uppercase font-bold tracking-wider mb-3">Tech Stack Detected</p>
                          <div className="flex flex-wrap gap-2">
                            {report.techStack.hosting !== "Unknown" && (
                              <span className="px-2.5 py-1 rounded-lg bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-xs font-semibold">
                                {report.techStack.hosting}
                              </span>
                            )}
                            {[...report.techStack.frameworks, ...report.techStack.cssLibraries].map((t, i) => (
                              <span key={i} className="px-2.5 py-1 rounded-lg bg-purple-500/10 border border-purple-500/20 text-purple-400 text-xs font-semibold">
                                {t}
                              </span>
                            ))}
                            {report.techStack.frameworks.length === 0 && report.techStack.cssLibraries.length === 0 && (
                              <span className="text-zinc-500 text-xs italic">Vanilla / Unknown stack</span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Right: AI Summary + Top Issues */}
                      <div className="lg:col-span-2 flex flex-col gap-4">
                        {/* AI Prognosis */}
                        <div className="bg-gradient-to-br from-purple-950/30 to-zinc-900 border border-purple-800/30 rounded-2xl p-6">
                          <div className="flex items-center gap-2 mb-3">
                            <Sparkles className="w-5 h-5 text-purple-400" />
                            <h3 className="font-bold text-purple-300 text-sm uppercase tracking-wider">AI Chief Medical Officer's Prognosis</h3>
                          </div>
                          <p className="text-zinc-300 text-sm leading-relaxed">
                            {report.aiSummary?.overallHealth || "AI analysis unavailable. Set GEMINI_API_KEY in backend/.env to enable AI diagnostics."}
                          </p>
                        </div>

                        {/* Top 3 Priority Issues */}
                        <div className="flex flex-col gap-3">
                          <h4 className="text-zinc-400 text-xs uppercase font-bold tracking-wider">Top Priority Diagnoses</h4>
                          {topFindings.length === 0 ? (
                            <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-4 text-center">
                              <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto mb-2" />
                              <p className="text-emerald-400 font-semibold text-sm">No critical issues found!</p>
                            </div>
                          ) : (
                            topFindings.map((f, i) => (
                              <div key={i} className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-4 flex gap-4 items-start hover:border-zinc-700 transition-colors">
                                <span className={`flex items-center px-2.5 py-1 text-[10px] font-bold uppercase rounded-full border flex-shrink-0 ${impactColor(f.impact)}`}>
                                  {impactIcon(f.impact)} {f.impact}
                                </span>
                                <div>
                                  <h5 className="font-bold text-zinc-200 text-sm">{f.title}</h5>
                                  <p className="text-zinc-400 text-xs mt-1 leading-relaxed">{f.explanation}</p>
                                </div>
                              </div>
                            ))
                          )}
                          {(report.aiSummary?.findings?.length || 0) > 3 && (
                            <button
                              onClick={() => setActiveTab("ai")}
                              className="text-xs text-purple-400 hover:text-purple-300 font-semibold self-start mt-1 transition-colors"
                            >
                              View all {report.aiSummary?.findings.length} findings →
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })()}

                {/* ── AI DOCTOR TAB ── */}
                {activeTab === "ai" && (
                  <div className="flex flex-col gap-6">
                    <div className="bg-gradient-to-br from-purple-950/30 to-zinc-900 border border-purple-800/30 rounded-2xl p-6">
                      <div className="flex items-center gap-2 mb-3">
                        <Sparkles className="w-5 h-5 text-purple-400" />
                        <h3 className="font-bold text-purple-300 text-sm uppercase tracking-wider">AI Chief Medical Officer's Prognosis</h3>
                      </div>
                      <p className="text-zinc-300 text-sm leading-relaxed">
                        {report.aiSummary?.overallHealth || "AI analysis unavailable — add GEMINI_API_KEY to backend/.env"}
                      </p>
                    </div>

                    <h4 className="text-zinc-400 text-xs uppercase font-bold tracking-wider">
                      Prescribed Treatments & Remediation ({report.aiSummary?.findings?.length || 0})
                    </h4>
                    <div className="grid gap-4">
                      {(report.aiSummary?.findings || []).map((f, i) => (
                        <div key={i} className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-5 hover:border-zinc-700 transition-colors flex flex-col md:flex-row gap-4">
                          <div className="flex-shrink-0">
                            <span className={`flex items-center px-2.5 py-1 text-[10px] font-bold uppercase rounded-full border ${impactColor(f.impact)}`}>
                              {impactIcon(f.impact)} {f.impact} priority
                            </span>
                            <span className="mt-2 block text-[10px] uppercase font-bold text-zinc-600 tracking-wider">{f.category}</span>
                          </div>
                          <div>
                            <h5 className="font-bold text-zinc-200 text-sm">{f.title}</h5>
                            <p className="text-zinc-400 text-sm mt-2 leading-relaxed">{f.explanation}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* ── PERFORMANCE TAB ── */}
                {activeTab === "performance" && (
                  <div className="flex flex-col gap-8">
                    {/* Vitals Gauges */}
                    <div>
                      <h4 className="text-zinc-400 text-xs uppercase font-bold tracking-wider mb-4">Core Web Vitals</h4>
                      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                        <ScoreGauge
                          score={Math.max(0, 100 - Math.min((report.performance.lcp / 40), 100))}
                          label="LCP"
                          subtitle={`${(report.performance.lcp / 1000).toFixed(2)}s · ${report.performance.lcp < 2500 ? "Good" : report.performance.lcp < 4000 ? "Needs work" : "Poor"}`}
                        />
                        <ScoreGauge
                          score={Math.max(0, 100 - Math.min((report.performance.fcp / 25), 100))}
                          label="FCP"
                          subtitle={`${(report.performance.fcp / 1000).toFixed(2)}s · ${report.performance.fcp < 1800 ? "Good" : report.performance.fcp < 3000 ? "Needs work" : "Poor"}`}
                        />
                        <ScoreGauge
                          score={report.performance.cls < 0.1 ? 95 : report.performance.cls < 0.25 ? 60 : 25}
                          label="CLS"
                          subtitle={`${report.performance.cls.toFixed(3)} · ${report.performance.cls < 0.1 ? "Good" : report.performance.cls < 0.25 ? "Needs work" : "Poor"}`}
                        />
                        <ScoreGauge
                          score={Math.max(0, 100 - Math.min((report.performance.tti / 70), 100))}
                          label="TTI"
                          subtitle={`${(report.performance.tti / 1000).toFixed(2)}s`}
                        />
                        <ScoreGauge
                          score={Math.max(0, 100 - Math.min((report.performance.totalLoadTime / 100), 100))}
                          label="Speed Index"
                          subtitle={`${(report.performance.totalLoadTime / 1000).toFixed(2)}s total`}
                        />
                      </div>
                    </div>

                    {/* AI Explanation for Performance */}
                    {report.aiSummary?.findings?.filter(f => f.category === "performance").length! > 0 && (
                      <div className="bg-zinc-900/40 border border-zinc-800 rounded-2xl p-5">
                        <div className="flex items-center gap-2 mb-3">
                          <Sparkles className="w-4 h-4 text-purple-400" />
                          <h4 className="text-purple-300 text-xs uppercase font-bold tracking-wider">AI Performance Diagnostics</h4>
                        </div>
                        <div className="flex flex-col gap-3">
                          {report.aiSummary?.findings?.filter(f => f.category === "performance").map((f, i) => (
                            <div key={i} className="flex gap-3 items-start">
                              <span className={`px-2 py-0.5 text-[10px] font-bold uppercase rounded border flex-shrink-0 ${impactColor(f.impact)}`}>{f.impact}</span>
                              <div>
                                <p className="text-zinc-300 text-xs font-semibold">{f.title}</p>
                                <p className="text-zinc-500 text-xs mt-0.5">{f.explanation}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Summary Stats */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="bg-zinc-900/40 border border-zinc-800 rounded-2xl p-5 flex items-center gap-4">
                        <Clock className="w-9 h-9 text-cyan-400 flex-shrink-0" />
                        <div>
                          <p className="text-zinc-500 text-xs uppercase font-semibold">Total Load Time</p>
                          <p className="text-2xl font-bold text-zinc-200">{(report.performance.totalLoadTime / 1000).toFixed(2)}s</p>
                        </div>
                      </div>
                      <div className="bg-zinc-900/40 border border-zinc-800 rounded-2xl p-5 flex items-center gap-4">
                        <Network className="w-9 h-9 text-purple-400 flex-shrink-0" />
                        <div>
                          <p className="text-zinc-500 text-xs uppercase font-semibold">Total Requests</p>
                          <p className="text-2xl font-bold text-zinc-200">{report.performance.resourceCount}</p>
                        </div>
                      </div>
                      <div className="bg-zinc-900/40 border border-zinc-800 rounded-2xl p-5 flex items-center gap-4">
                        <HardDrive className="w-9 h-9 text-emerald-400 flex-shrink-0" />
                        <div>
                          <p className="text-zinc-500 text-xs uppercase font-semibold">Page Weight</p>
                          <p className="text-2xl font-bold text-zinc-200">
                            {report.performance.totalTransferSize > 1024 * 1024
                              ? `${(report.performance.totalTransferSize / 1024 / 1024).toFixed(2)} MB`
                              : `${(report.performance.totalTransferSize / 1024).toFixed(0)} KB`}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Waterfall */}
                    <div>
                      <h4 className="text-zinc-400 text-xs uppercase font-bold tracking-wider mb-3">Network Resource Waterfall</h4>
                      <WaterfallChart requests={report.network.requests} />
                    </div>
                  </div>
                )}

                {/* ── DOM TAB ── */}
                {activeTab === "dom" && (
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="flex flex-col gap-4">
                      <div className="bg-zinc-900/40 border border-zinc-800 rounded-2xl p-5">
                        <h4 className="text-zinc-400 text-xs uppercase font-bold tracking-wider mb-4">DOM Anatomy Stats</h4>
                        <div className="flex flex-col gap-3">
                          <div className="flex justify-between items-center py-2 border-b border-zinc-800">
                            <span className="text-zinc-400 text-xs">Total Nodes</span>
                            <span className={`text-sm font-bold ${report.dom.nodeCount > 1500 ? "text-rose-400" : report.dom.nodeCount > 800 ? "text-amber-400" : "text-emerald-400"}`}>
                              {report.dom.nodeCount}
                              {report.dom.nodeCount > 1500 && <span className="ml-1 text-[10px] text-rose-500">⚠ Bloated</span>}
                            </span>
                          </div>
                          <div className="flex justify-between items-center py-2">
                            <span className="text-zinc-400 text-xs">Max Depth</span>
                            <span className={`text-sm font-bold ${report.dom.maxDepth > 32 ? "text-rose-400" : report.dom.maxDepth > 20 ? "text-amber-400" : "text-emerald-400"}`}>
                              {report.dom.maxDepth} levels
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="bg-zinc-900/40 border border-zinc-800 rounded-2xl p-5">
                        <h4 className="text-zinc-400 text-xs uppercase font-bold tracking-wider mb-4">Heaviest Subtrees</h4>
                        <div className="flex flex-col gap-3">
                          {(report.dom.largestSubtrees || []).map((sub, i) => (
                            <div key={i}>
                              <p className="text-purple-400 text-[10px] font-mono truncate" title={sub.selector}>{sub.selector}</p>
                              <div className="flex justify-between text-xs mt-0.5">
                                <span className="text-zinc-500">Children</span>
                                <span className="text-zinc-300 font-bold">{sub.nodeCount}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="lg:col-span-2 bg-zinc-900/40 border border-zinc-800 rounded-2xl p-5">
                      <h4 className="text-zinc-400 text-xs uppercase font-bold tracking-wider mb-4">Interactive DOM Tree Explorer</h4>
                      <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-4 max-h-[550px] overflow-y-auto">
                        <DOMTreeViewer node={report.dom.tree} />
                      </div>
                    </div>
                  </div>
                )}

                {/* ── ACCESSIBILITY TAB ── */}
                {activeTab === "accessibility" && (
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="flex flex-col gap-4 lg:col-span-1">
                      <ScoreGauge score={report.accessibility.score} label="Accessibility Score" subtitle="axe-core audit" size={130} />
                      <div className="bg-zinc-900/40 border border-zinc-800 rounded-2xl p-5">
                        <div className="flex justify-between py-2 border-b border-zinc-800">
                          <span className="text-zinc-400 text-xs">Passed Rules</span>
                          <span className="text-emerald-400 font-bold text-sm">{report.accessibility.passes}</span>
                        </div>
                        <div className="flex justify-between py-2">
                          <span className="text-zinc-400 text-xs">Violations</span>
                          <span className="text-rose-400 font-bold text-sm">{report.accessibility.violations.length}</span>
                        </div>
                      </div>

                      {/* AI a11y advice */}
                      {report.aiSummary?.findings?.filter(f => f.category === "accessibility").length! > 0 && (
                        <div className="bg-zinc-900/40 border border-purple-800/20 rounded-2xl p-4">
                          <div className="flex items-center gap-1.5 mb-2">
                            <Sparkles className="w-3.5 h-3.5 text-purple-400" />
                            <span className="text-purple-300 text-[10px] uppercase font-bold">AI Advice</span>
                          </div>
                          {report.aiSummary?.findings?.filter(f => f.category === "accessibility").slice(0, 2).map((f, i) => (
                            <p key={i} className="text-zinc-400 text-xs leading-relaxed mb-2">{f.explanation}</p>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="lg:col-span-2 flex flex-col gap-4">
                      <h4 className="text-zinc-400 text-xs uppercase font-bold tracking-wider">
                        Accessibility Violations ({report.accessibility.violations.length})
                      </h4>
                      {report.accessibility.violations.length === 0 ? (
                        <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-2xl p-10 text-center flex flex-col items-center">
                          <CheckCircle2 className="w-14 h-14 text-emerald-500 mb-3" />
                          <h5 className="text-emerald-400 font-bold text-lg">Zero violations detected!</h5>
                          <p className="text-zinc-400 text-xs mt-1">This site fully respects accessibility standards.</p>
                        </div>
                      ) : (
                        <div className="flex flex-col gap-3">
                          {report.accessibility.violations.map((v, i) => {
                            const sevBg: Record<string, string> = {
                              critical: "bg-red-500/10 text-red-400 border-red-500/20",
                              serious: "bg-orange-500/10 text-orange-400 border-orange-500/20",
                              moderate: "bg-amber-500/10 text-amber-400 border-amber-500/20",
                              minor: "bg-sky-500/10 text-sky-400 border-sky-500/20",
                            };
                            return (
                              <div key={i} className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-5 hover:border-zinc-700 transition-colors">
                                <div className="flex items-center justify-between gap-2 mb-3">
                                  <div className="flex items-center gap-2">
                                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase border ${sevBg[v.impact]}`}>{v.impact}</span>
                                    <span className="font-bold text-zinc-200 text-sm">{v.id}</span>
                                  </div>
                                  <a href={v.helpUrl} target="_blank" rel="noopener noreferrer"
                                    className="text-xs text-purple-400 hover:text-purple-300 flex items-center gap-1 font-semibold">
                                    Docs <ExternalLink className="w-3 h-3" />
                                  </a>
                                </div>
                                <p className="text-zinc-400 text-xs leading-relaxed">{v.description}</p>
                                {v.nodes.length > 0 && (
                                  <div className="mt-3 bg-zinc-950 rounded-lg p-3 border border-zinc-900 max-h-28 overflow-y-auto">
                                    <span className="text-[10px] text-zinc-600 uppercase font-bold block mb-1">Elements ({v.nodes.length})</span>
                                    {v.nodes.map((n, ni) => (
                                      <code key={ni} className="text-[10px] font-mono text-purple-300 block truncate">{n}</code>
                                    ))}
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* ── SECURITY TAB ── */}
                {activeTab === "security" && (
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Security Headers */}
                    <div className="bg-zinc-900/40 border border-zinc-800 rounded-2xl p-6">
                      <div className="flex items-center justify-between mb-5">
                        <h4 className="text-zinc-400 text-xs uppercase font-bold tracking-wider">Security Headers</h4>
                        <span className={`px-2.5 py-1 rounded text-xs font-bold border ${
                          report.security.score >= 80
                            ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                            : report.security.score >= 50
                            ? "bg-amber-500/10 text-amber-400 border-amber-500/20"
                            : "bg-rose-500/10 text-rose-400 border-rose-500/20"
                        }`}>
                          Score: {report.security.score}/100
                        </span>
                      </div>
                      <div className="flex flex-col gap-3">
                        {report.security.headers.map((h, i) => (
                          <div key={i} className="py-3 border-b border-zinc-800/50 last:border-0">
                            <div className="flex justify-between items-center">
                              <span className="text-zinc-300 text-xs font-semibold">{h.header}</span>
                              <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                                h.present
                                  ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                                  : h.risk === "high"
                                  ? "bg-red-500/10 text-red-400 border-red-500/20"
                                  : "bg-amber-500/10 text-amber-400 border-amber-500/20"
                              }`}>
                                {h.present ? "✓ Present" : `✗ Missing (${h.risk} risk)`}
                              </span>
                            </div>
                            <p className="text-zinc-600 text-[10px] mt-1 leading-relaxed">{h.description}</p>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Tech Stack */}
                    <div className="bg-zinc-900/40 border border-zinc-800 rounded-2xl p-6 flex flex-col gap-6">
                      <h4 className="text-zinc-400 text-xs uppercase font-bold tracking-wider">Technology Stack</h4>

                      {[
                        { label: "Hosting / Server", items: report.techStack.hosting !== "Unknown" ? [report.techStack.hosting] : [], color: "text-cyan-400 bg-cyan-500/10 border-cyan-500/20" },
                        { label: "JS Frameworks", items: report.techStack.frameworks, color: "text-purple-400 bg-purple-500/10 border-purple-500/20" },
                        { label: "CSS Libraries", items: report.techStack.cssLibraries, color: "text-pink-400 bg-pink-500/10 border-pink-500/20" },
                        { label: "Analytics", items: report.techStack.analytics, color: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20" },
                        { label: "Other Tools", items: report.techStack.other, color: "text-zinc-400 bg-zinc-800 border-zinc-700" },
                      ].map(({ label, items, color }) => (
                        <div key={label}>
                          <p className="text-zinc-600 text-[10px] uppercase font-bold tracking-wider mb-2">{label}</p>
                          {items.length === 0 ? (
                            <span className="text-zinc-600 text-xs italic">None detected</span>
                          ) : (
                            <div className="flex flex-wrap gap-2">
                              {items.map((t, i) => (
                                <span key={i} className={`px-3 py-1.5 rounded-lg text-xs font-semibold border ${color}`}>{t}</span>
                              ))}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* ── COMPARE MODE ── */}
        {activeMode === "compare" && (
          <div className="flex flex-col items-center gap-6">
            {compareStatus !== "loading" && (
              <form onSubmit={handleCompareScan} className="w-full max-w-4xl bg-zinc-900/60 border border-zinc-800 p-4 rounded-2xl flex flex-col md:flex-row gap-3 shadow-2xl">
                <div className="flex-1 flex items-center bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 gap-2">
                  <span className="text-purple-400 text-[10px] font-bold uppercase px-2 py-0.5 bg-purple-500/10 border border-purple-500/20 rounded">A</span>
                  <input type="text" placeholder="First site (e.g. github.com)" value={urlA} onChange={e => setUrlA(e.target.value)}
                    className="flex-1 bg-transparent outline-none text-zinc-200 placeholder-zinc-600 text-sm" required />
                </div>
                <div className="flex-1 flex items-center bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 gap-2">
                  <span className="text-cyan-400 text-[10px] font-bold uppercase px-2 py-0.5 bg-cyan-500/10 border border-cyan-500/20 rounded">B</span>
                  <input type="text" placeholder="Second site (e.g. gitlab.com)" value={urlB} onChange={e => setUrlB(e.target.value)}
                    className="flex-1 bg-transparent outline-none text-zinc-200 placeholder-zinc-600 text-sm" required />
                </div>
                <button type="submit" disabled={!urlA || !urlB}
                  className="flex items-center gap-2 bg-purple-600 hover:bg-purple-500 disabled:opacity-40 text-white text-sm font-semibold px-5 py-2.5 rounded-xl transition-all">
                  <GitCompare className="w-4 h-4" /> Compare
                </button>
              </form>
            )}

            {compareStatus === "loading" && <LoadingBox stepIdx={compareStepIdx} />}
            {compareStatus === "error" && <ErrorBox message={compareError} onRetry={() => setCompareStatus("idle")} />}

            {compareStatus === "success" && reportA && reportB && (
              <div className="w-full animate-fade-in">
                <div className="flex items-center gap-4 bg-zinc-900/40 border border-zinc-800 p-5 rounded-2xl mb-4">
                  <GitCompare className="w-6 h-6 text-purple-400" />
                  <div className="flex-1">
                    <h2 className="text-base font-bold text-zinc-100 flex items-center gap-2 flex-wrap">
                      <span className="text-purple-400">{reportA.url}</span>
                      <span className="text-zinc-600">vs</span>
                      <span className="text-cyan-400">{reportB.url}</span>
                    </h2>
                    <p className="text-zinc-500 text-xs">{new Date().toLocaleString()}</p>
                  </div>
                  <button onClick={() => { setCompareStatus("idle"); setReportA(null); setReportB(null); }}
                    className="text-xs bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-semibold px-4 py-2 rounded-xl border border-zinc-700">
                    ↩ New Compare
                  </button>
                </div>

                <div className="flex border-b border-zinc-800 overflow-x-auto mb-6">
                  {cmpTabBtn("matchup", "📊 Matchup")}
                  {cmpTabBtn("ai", "🩺 AI Analysis")}
                  {cmpTabBtn("performance", "⚡ Performance")}
                  {cmpTabBtn("accessibility", "♿ Accessibility")}
                  {cmpTabBtn("security", "🔒 Security")}
                </div>

                {compareTab === "matchup" && (
                  <div className="bg-zinc-900/40 border border-zinc-800 rounded-2xl overflow-hidden">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="bg-zinc-950 border-b border-zinc-800 text-xs uppercase text-zinc-500">
                          <th className="p-4 text-left font-bold">Metric</th>
                          <th className="p-4 text-left text-purple-400 font-bold">{reportA.url}</th>
                          <th className="p-4 text-left text-cyan-400 font-bold">{reportB.url}</th>
                          <th className="p-4 text-center font-bold">Winner</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-zinc-800/50 text-zinc-300">
                        {[
                          { label: "Load Time", aVal: `${(reportA.performance.totalLoadTime / 1000).toFixed(2)}s`, bVal: `${(reportB.performance.totalLoadTime / 1000).toFixed(2)}s`, aWins: reportA.performance.totalLoadTime < reportB.performance.totalLoadTime },
                          { label: "LCP (Largest Paint)", aVal: `${(reportA.performance.lcp / 1000).toFixed(2)}s`, bVal: `${(reportB.performance.lcp / 1000).toFixed(2)}s`, aWins: reportA.performance.lcp < reportB.performance.lcp },
                          { label: "FCP (First Paint)", aVal: `${(reportA.performance.fcp / 1000).toFixed(2)}s`, bVal: `${(reportB.performance.fcp / 1000).toFixed(2)}s`, aWins: reportA.performance.fcp < reportB.performance.fcp },
                          { label: "CLS (Layout Shift)", aVal: reportA.performance.cls.toFixed(3), bVal: reportB.performance.cls.toFixed(3), aWins: reportA.performance.cls < reportB.performance.cls },
                          { label: "Accessibility Score", aVal: `${reportA.accessibility.score}/100`, bVal: `${reportB.accessibility.score}/100`, aWins: reportA.accessibility.score > reportB.accessibility.score },
                          { label: "Security Score", aVal: `${reportA.security.score}/100`, bVal: `${reportB.security.score}/100`, aWins: reportA.security.score > reportB.security.score },
                          { label: "Total Requests", aVal: `${reportA.performance.resourceCount}`, bVal: `${reportB.performance.resourceCount}`, aWins: reportA.performance.resourceCount < reportB.performance.resourceCount },
                          { label: "DOM Nodes", aVal: `${reportA.dom.nodeCount}`, bVal: `${reportB.dom.nodeCount}`, aWins: reportA.dom.nodeCount < reportB.dom.nodeCount },
                        ].map(({ label, aVal, bVal, aWins }, i) => (
                          <tr key={i} className="hover:bg-zinc-800/20">
                            <td className="p-4 font-medium text-zinc-400 text-xs">{label}</td>
                            <td className={`p-4 font-mono text-sm font-bold ${aWins ? "text-purple-400" : "text-zinc-400"}`}>{aVal}</td>
                            <td className={`p-4 font-mono text-sm font-bold ${!aWins ? "text-cyan-400" : "text-zinc-400"}`}>{bVal}</td>
                            <td className="p-4 text-center">
                              {aWins ? (
                                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-500/10 text-purple-400 border border-purple-500/20">Site A</span>
                              ) : (
                                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">Site B</span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                {compareTab === "ai" && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {[{ r: reportA, label: "A", color: "text-purple-400", bg: "border-purple-500/20" }, { r: reportB, label: "B", color: "text-cyan-400", bg: "border-cyan-500/20" }].map(({ r, label, color, bg }) => (
                      <div key={label} className={`bg-zinc-900/40 border ${bg} rounded-2xl p-5 flex flex-col gap-3`}>
                        <div className="flex items-center gap-2 border-b border-zinc-800 pb-3">
                          <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded border ${color} bg-zinc-950`}>Site {label}</span>
                          <span className={`font-bold text-xs ${color} truncate`}>{r.url}</span>
                        </div>
                        <p className="text-zinc-400 text-xs leading-relaxed italic">{r.aiSummary?.overallHealth}</p>
                        {r.aiSummary?.findings?.slice(0, 3).map((f, i) => (
                          <div key={i} className="bg-zinc-950 border border-zinc-900 rounded-xl p-3">
                            <div className="flex items-center justify-between">
                              <span className="text-zinc-200 text-xs font-bold">{f.title}</span>
                              <span className={`text-[10px] font-bold uppercase ${f.impact === "high" ? "text-red-400" : "text-amber-400"}`}>{f.impact}</span>
                            </div>
                            <p className="text-zinc-500 text-[11px] mt-1">{f.explanation}</p>
                          </div>
                        ))}
                      </div>
                    ))}
                  </div>
                )}

                {compareTab === "performance" && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {[{ r: reportA, label: "A", color: "text-purple-400" }, { r: reportB, label: "B", color: "text-cyan-400" }].map(({ r, label, color }) => (
                      <div key={label} className="bg-zinc-900/40 border border-zinc-800 rounded-2xl p-5">
                        <h4 className={`text-xs uppercase font-bold tracking-wider mb-4 ${color}`}>Site {label}: {r.url}</h4>
                        <div className="grid grid-cols-2 gap-3 mb-4">
                          {[["LCP", `${(r.performance.lcp / 1000).toFixed(2)}s`], ["FCP", `${(r.performance.fcp / 1000).toFixed(2)}s`], ["TTI", `${(r.performance.tti / 1000).toFixed(2)}s`], ["CLS", r.performance.cls.toFixed(3)]].map(([k, v]) => (
                            <div key={k} className="bg-zinc-950 border border-zinc-900 rounded-xl p-3 text-center">
                              <p className="text-zinc-500 text-[10px] uppercase font-bold">{k}</p>
                              <p className="text-zinc-200 font-bold text-sm">{v}</p>
                            </div>
                          ))}
                        </div>
                        <WaterfallChart requests={r.network.requests.slice(0, 40)} />
                      </div>
                    ))}
                  </div>
                )}

                {compareTab === "accessibility" && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {[{ r: reportA, label: "A", color: "text-purple-400", bg: "border-purple-500/20" }, { r: reportB, label: "B", color: "text-cyan-400", bg: "border-cyan-500/20" }].map(({ r, label, color, bg }) => (
                      <div key={label} className={`bg-zinc-900/40 border ${bg} rounded-2xl p-5`}>
                        <div className={`flex justify-between items-center border-b border-zinc-800 pb-3 mb-4`}>
                          <h4 className={`text-xs uppercase font-bold tracking-wider ${color}`}>Site {label}</h4>
                          <span className={`text-sm font-bold ${color}`}>{r.accessibility.score}/100</span>
                        </div>
                        <div className="flex flex-col gap-2 max-h-[400px] overflow-y-auto">
                          {r.accessibility.violations.length === 0 ? (
                            <p className="text-emerald-400 text-xs italic">✓ No violations</p>
                          ) : r.accessibility.violations.map((v, i) => (
                            <div key={i} className="bg-zinc-950 border border-zinc-900 rounded-lg p-3">
                              <span className="text-zinc-200 text-xs font-bold block">{v.id}</span>
                              <p className="text-zinc-500 text-[11px] mt-0.5">{v.description}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {compareTab === "security" && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {[{ r: reportA, label: "A", color: "text-purple-400", bg: "border-purple-500/20" }, { r: reportB, label: "B", color: "text-cyan-400", bg: "border-cyan-500/20" }].map(({ r, label, color, bg }) => (
                      <div key={label} className={`bg-zinc-900/40 border ${bg} rounded-2xl p-5`}>
                        <div className="flex justify-between items-center mb-4 border-b border-zinc-800 pb-3">
                          <h4 className={`text-xs uppercase font-bold tracking-wider ${color}`}>Site {label}: Security</h4>
                          <span className={`text-sm font-bold ${color}`}>{r.security.score}/100</span>
                        </div>
                        {r.security.headers.map((h, i) => (
                          <div key={i} className="flex justify-between items-center py-2 border-b border-zinc-800/30 last:border-0">
                            <span className="text-zinc-400 text-xs">{h.header}</span>
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${h.present ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" : "bg-red-500/10 text-red-400 border-red-500/20"}`}>
                              {h.present ? "✓" : "✗"}
                            </span>
                          </div>
                        ))}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Footer */}
        <footer className="mt-16 pb-8 text-center text-zinc-700 text-xs">
          Web Inspectra — AI-Powered Website MRI Scanner · React + Vite Frontend · Node.js Express Backend
        </footer>
      </div>
    </div>
  );
}
