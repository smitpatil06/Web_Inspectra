// ============================================
// CORE SCAN REPORT — the single contract every service produces/consumes
// ============================================

export interface ScanReport {
  url: string;
  scannedAt: string; // ISO timestamp
  status: "pending" | "scanning" | "complete" | "failed";
  error?: string;

  dom: DOMData;
  performance: PerformanceData;
  network: NetworkData;
  accessibility: AccessibilityData;
  techStack: TechStackData;
  security: SecurityData;
  aiSummary?: AISummary;
}

// ============================================
// DOM EXPLORER
// ============================================

export interface DOMNode {
  tag: string;
  id?: string;
  classes?: string[];
  children: DOMNode[];
  textContent?: string;
  attributes?: Record<string, string>;
}

export interface DOMData {
  tree: DOMNode;
  nodeCount: number;
  maxDepth: number;
  largestSubtrees?: { selector: string; nodeCount: number }[];
}

// ============================================
// PERFORMANCE DASHBOARD
// ============================================

export interface PerformanceData {
  lcp: number;
  fcp: number;
  cls: number;
  inp: number;
  tti: number;
  totalLoadTime: number;
  resourceCount: number;
  totalTransferSize: number;
}

// ============================================
// NETWORK VISUALIZATION
// ============================================

export interface NetworkRequest {
  url: string;
  method: string;
  resourceType: "document" | "script" | "stylesheet" | "image" | "font" | "xhr" | "fetch" | "other";
  status: number;
  startTime: number;
  duration: number;
  size: number;
  failed: boolean;
}

export interface NetworkData {
  requests: NetworkRequest[];
  totalRequests: number;
  failedRequests: number;
  slowestRequests: NetworkRequest[];
}

// ============================================
// ACCESSIBILITY
// ============================================

export interface A11yIssue {
  id: string;
  impact: "minor" | "moderate" | "serious" | "critical";
  description: string;
  helpUrl: string;
  nodes: string[];
}

export interface AccessibilityData {
  violations: A11yIssue[];
  passes: number;
  score: number;
}

// ============================================
// TECH STACK
// ============================================

export interface TechStackData {
  frameworks: string[];
  cssLibraries: string[];
  hosting?: string;
  analytics: string[];
  other: string[];
}

// ============================================
// SECURITY CHECK
// ============================================

export interface SecurityHeaderCheck {
  header: string;
  present: boolean;
  value?: string;
  description: string;
  risk: "high" | "medium" | "low" | "none";
}

export interface SecurityData {
  score: number;
  headers: SecurityHeaderCheck[];
}

// ============================================
// AI WEBSITE DOCTOR
// ============================================

export interface AIFinding {
  title: string;
  explanation: string;
  impact: "low" | "medium" | "high";
  category: "performance" | "accessibility" | "security" | "seo" | "general";
}

export interface AISummary {
  overallHealth: string;
  findings: AIFinding[];
}

// ============================================
// API REQUEST/RESPONSE SHAPES
// ============================================

export interface ScanRequest {
  url: string;
}

export interface ScanResponse {
  scanId: string;
  report: ScanReport;
}
