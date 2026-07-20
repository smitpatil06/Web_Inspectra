import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import axios from "axios";
import * as cheerio from "cheerio";
import type { Element, AnyNode } from "domhandler";
import { GoogleGenerativeAI } from "@google/generative-ai";
import type {
  ScanReport, DOMNode, DOMData, NetworkRequest, NetworkData,
  AccessibilityData, A11yIssue, TechStackData, SecurityData,
  SecurityHeaderCheck, AISummary, AIFinding,
} from "./types.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

const apiKey = process.env.GEMINI_API_KEY || "";
const genAI = apiKey ? new GoogleGenerativeAI(apiKey) : null;

// ─── Helpers ───────────────────────────────────────────────────────────────

function normalizeUrl(input: string): string {
  const cleaned = input.trim();

  // Reject email addresses (contain '@' but are not a valid URL with a protocol)
  if (cleaned.includes("@")) {
    throw new Error("Input looks like an email address, not a website URL.");
  }

  const withProto = /^https?:\/\//i.test(cleaned) ? cleaned : `https://${cleaned}`;
  const parsed = new URL(withProto);

  // Must have a hostname with at least one dot (e.g. 'example.com'), ruling out bare words
  if (!parsed.hostname.includes(".")) {
    throw new Error("Please enter a valid website URL like example.com");
  }

  return parsed.toString();
}

function getResourceType(url: string, contentType = ""): NetworkRequest["resourceType"] {
  const u = url.toLowerCase();
  const ct = contentType.toLowerCase();
  if (ct.includes("html") || u.endsWith(".html") || u.endsWith(".htm")) return "document";
  if (ct.includes("javascript") || u.endsWith(".js") || u.endsWith(".mjs")) return "script";
  if (ct.includes("css") || u.endsWith(".css")) return "stylesheet";
  if (ct.includes("image") || /\.(png|jpg|jpeg|gif|svg|webp|ico|avif)/.test(u)) return "image";
  if (ct.includes("font") || /\.(woff2?|ttf|otf|eot)/.test(u)) return "font";
  if (u.includes("/api/") || u.includes("graphql") || u.includes("query")) return "fetch";
  return "other";
}

// Parse HTML and extract links to all sub-resources (scripts, styles, images, fonts)
function extractResourceUrls(html: string, baseUrl: string): { url: string; type: NetworkRequest["resourceType"] }[] {
  const $ = cheerio.load(html);
  const resources: { url: string; type: NetworkRequest["resourceType"] }[] = [];
  const base = new URL(baseUrl);

  const resolve = (href: string | undefined): string | null => {
    if (!href) return null;
    try { return new URL(href, base).toString(); } catch { return null; }
  };

  $("script[src]").each((_, el) => {
    const url = resolve($(el).attr("src"));
    if (url) resources.push({ url, type: "script" });
  });
  $("link[rel='stylesheet']").each((_, el) => {
    const url = resolve($(el).attr("href"));
    if (url) resources.push({ url, type: "stylesheet" });
  });
  $("img[src], img[data-src]").each((_, el) => {
    const url = resolve($(el).attr("src") || $(el).attr("data-src"));
    if (url) resources.push({ url, type: "image" });
  });
  $("link[rel='preload'][as='font'], link[as='font']").each((_, el) => {
    const url = resolve($(el).attr("href"));
    if (url) resources.push({ url, type: "font" });
  });
  $("video[src], audio[src], source[src]").each((_, el) => {
    const url = resolve($(el).attr("src"));
    if (url) resources.push({ url, type: "other" });
  });

  return resources;
}

// Build a simple DOMNode tree from cheerio
function buildDOMTree($: cheerio.CheerioAPI, el: Element, depth: number, maxDepth = 6): DOMNode {
  const tagName = (el.tagName || (el as any).name || "unknown").toLowerCase();
  const attribs = el.attribs || {};

  const classes = (attribs.class || "").split(/\s+/).filter(Boolean);
  const id = attribs.id;
  const attributes: Record<string, string> = {};
  for (const [k, v] of Object.entries(attribs)) {
    if (k !== "class" && k !== "id" && v) {
      const sv = String(v);
      attributes[k] = sv.length > 80 ? sv.substring(0, 80) + "…" : sv;
    }
  }

  let textContent = "";
  if (depth <= 2) {
    const directText = $(el).contents().filter((_, n) => n.type === "text").text().trim().substring(0, 60);
    if (directText) textContent = directText;
  }

  const children: DOMNode[] = [];
  if (depth < maxDepth) {
    $(el).children().each((_, child) => {
      if (child.type === "tag") {
        children.push(buildDOMTree($, child, depth + 1, maxDepth));
      }
    });
  }

  return {
    tag: tagName,
    ...(id ? { id } : {}),
    ...(classes.length ? { classes } : {}),
    ...(Object.keys(attributes).length ? { attributes } : {}),
    ...(textContent ? { textContent } : {}),
    children,
  };
}

function countNodes(node: DOMNode): number {
  return 1 + node.children.reduce((sum, c) => sum + countNodes(c), 0);
}

function getMaxDepth(node: DOMNode, d = 0): number {
  if (!node.children.length) return d;
  return Math.max(...node.children.map((c) => getMaxDepth(c, d + 1)));
}

function getLargestSubtrees(node: DOMNode, selector = "", results: { selector: string; nodeCount: number }[] = []): { selector: string; nodeCount: number }[] {
  let sel = node.tag;
  if (node.id) sel += `#${node.id}`;
  else if (node.classes?.length) sel += `.${node.classes[0]}`;
  const fullSel = selector ? `${selector} > ${sel}` : sel;
  const nc = countNodes(node);
  if (node.children.length > 0) results.push({ selector: fullSel, nodeCount: nc });
  node.children.forEach((c) => getLargestSubtrees(c, fullSel, results));
  return results.sort((a, b) => b.nodeCount - a.nodeCount).slice(0, 6);
}

// ─── Accessibility rules (pure HTML analysis) ──────────────────────────────

function analyzeAccessibility(html: string): AccessibilityData {
  const $ = cheerio.load(html);
  const violations: A11yIssue[] = [];
  let passes = 0;

  // Rule 1: Images must have alt
  const imgs = $("img");
  const imgsWithoutAlt: string[] = [];
  imgs.each((_, el) => {
    const alt = $(el).attr("alt");
    if (alt === undefined || alt === null) {
      const src = $(el).attr("src") || "(no src)";
      imgsWithoutAlt.push(`img[src="${src.substring(0, 50)}"]`);
    } else passes++;
  });
  if (imgsWithoutAlt.length) {
    violations.push({
      id: "image-alt",
      impact: "critical",
      description: "Images must have alternate text. Screen readers cannot describe image content without an alt attribute.",
      helpUrl: "https://dequeuniversity.com/rules/axe/4.10/image-alt",
      nodes: imgsWithoutAlt.slice(0, 8),
    });
  }

  // Rule 2: Form inputs must have labels
  const inputs = $("input:not([type='hidden']):not([type='submit']):not([type='button'])");
  const inputsWithoutLabel: string[] = [];
  inputs.each((_, el) => {
    const id = $(el).attr("id");
    const ariaLabel = $(el).attr("aria-label") || $(el).attr("aria-labelledby");
    const hasLabel = id ? $(`label[for="${id}"]`).length > 0 : false;
    if (!hasLabel && !ariaLabel) {
      const type = $(el).attr("type") || "text";
      inputsWithoutLabel.push(`input[type="${type}"]`);
    } else passes++;
  });
  if (inputsWithoutLabel.length) {
    violations.push({
      id: "label",
      impact: "critical",
      description: "Form elements must have associated labels to communicate their purpose to screen reader users.",
      helpUrl: "https://dequeuniversity.com/rules/axe/4.10/label",
      nodes: inputsWithoutLabel.slice(0, 8),
    });
  }

  // Rule 3: Page must have a title
  const title = $("title").text().trim();
  if (!title) {
    violations.push({ id: "document-title", impact: "serious", description: "Documents must have <title> element to describe their topic or purpose.", helpUrl: "https://dequeuniversity.com/rules/axe/4.10/document-title", nodes: ["<head>"] });
  } else passes++;

  // Rule 4: HTML lang attribute
  const lang = $("html").attr("lang");
  if (!lang) {
    violations.push({ id: "html-has-lang", impact: "serious", description: "The <html> element must have a lang attribute to identify the language of the page.", helpUrl: "https://dequeuniversity.com/rules/axe/4.10/html-has-lang", nodes: ["<html>"] });
  } else passes++;

  // Rule 5: Heading order
  const headings = $("h1, h2, h3, h4, h5, h6");
  const h1Count = $("h1").length;
  if (h1Count === 0) {
    violations.push({ id: "page-has-heading-one", impact: "moderate", description: "Page should contain a level-one heading. This helps users understand the main topic of the page.", helpUrl: "https://dequeuniversity.com/rules/axe/4.10/page-has-heading-one", nodes: ["<body>"] });
  } else if (h1Count > 1) {
    violations.push({ id: "heading-order", impact: "moderate", description: `Multiple <h1> elements found (${h1Count}). A page should have only one top-level heading.`, helpUrl: "https://dequeuniversity.com/rules/axe/4.10/heading-order", nodes: ["h1"] });
  } else passes++;
  if (headings.length > 0) passes++;

  // Rule 6: Links must have discernible text
  const links = $("a");
  const emptyLinks: string[] = [];
  links.each((_, el) => {
    const text = $(el).text().trim();
    const ariaLabel = $(el).attr("aria-label");
    const hasImg = $(el).find("img[alt]").length > 0;
    if (!text && !ariaLabel && !hasImg) {
      const href = $(el).attr("href") || "#";
      emptyLinks.push(`a[href="${href.substring(0, 40)}"]`);
    } else passes++;
  });
  if (emptyLinks.length) {
    violations.push({ id: "link-name", impact: "serious", description: "Links must have discernible text so screen reader users can understand their purpose.", helpUrl: "https://dequeuniversity.com/rules/axe/4.10/link-name", nodes: emptyLinks.slice(0, 8) });
  }

  // Rule 7: Buttons must have text
  const buttons = $("button, [role='button']");
  const emptyButtons: string[] = [];
  buttons.each((_, el) => {
    const text = $(el).text().trim();
    const ariaLabel = $(el).attr("aria-label");
    if (!text && !ariaLabel) emptyButtons.push("button");
    else passes++;
  });
  if (emptyButtons.length) {
    violations.push({ id: "button-name", impact: "critical", description: "Buttons must have discernible text for screen reader users.", helpUrl: "https://dequeuniversity.com/rules/axe/4.10/button-name", nodes: emptyButtons.slice(0, 8) });
  }

  // Rule 8: Viewport meta
  const viewport = $("meta[name='viewport']").attr("content") || "";
  if (!viewport) {
    violations.push({ id: "meta-viewport", impact: "critical", description: "Zooming and scaling must not be disabled in viewport meta tag. Prevents users from reading small text.", helpUrl: "https://dequeuniversity.com/rules/axe/4.10/meta-viewport", nodes: ["<head>"] });
  } else if (viewport.includes("user-scalable=no") || viewport.includes("maximum-scale=1")) {
    violations.push({ id: "meta-viewport-large", impact: "serious", description: "Viewport scaling is restricted (user-scalable=no or maximum-scale=1), harming low-vision users.", helpUrl: "https://dequeuniversity.com/rules/axe/4.10/meta-viewport-large", nodes: [`meta[content="${viewport.substring(0, 60)}"]`] });
  } else passes++;

  passes = Math.max(passes, 0);
  const total = passes + violations.length;
  const score = total > 0 ? Math.round((passes / total) * 100) : 100;

  return { violations, passes, score };
}

// ─── Tech stack detection ──────────────────────────────────────────────────

function detectTechStack(html: string, headers: Record<string, string>): TechStackData {
  const $ = cheerio.load(html);
  const frameworks: string[] = [];
  const cssLibraries: string[] = [];
  const analytics: string[] = [];
  const other: string[] = [];

  // Frameworks from script src
  const scripts = $("script[src]").map((_, el) => $(el).attr("src") || "").get();
  const scriptContent = $("script:not([src])").map((_, el) => $(el).html() || "").get().join(" ").toLowerCase();
  const allScripts = scripts.join(" ").toLowerCase();

  if (allScripts.includes("react") || scriptContent.includes("react.createelement") || scriptContent.includes("__react")) frameworks.push("React");
  if (allScripts.includes("vue") || scriptContent.includes("vue.config") || scriptContent.includes("__vue__")) frameworks.push("Vue.js");
  if (allScripts.includes("angular") || scriptContent.includes("ng-version") || $("[ng-app],[ng-version]").length) frameworks.push("Angular");
  if (allScripts.includes("jquery") || scriptContent.includes("jquery")) frameworks.push("jQuery");
  if (allScripts.includes("svelte") || scriptContent.includes("svelte")) frameworks.push("Svelte");
  if (allScripts.includes("nuxt") || scriptContent.includes("__nuxt")) frameworks.push("Nuxt.js");
  if (allScripts.includes("next") || $("script#__NEXT_DATA__").length) frameworks.push("Next.js");
  if (allScripts.includes("remix")) frameworks.push("Remix");
  if (allScripts.includes("gatsby")) frameworks.push("Gatsby");
  if (allScripts.includes("astro")) frameworks.push("Astro");
  if (scriptContent.includes("window.alpinejs") || allScripts.includes("alpine")) frameworks.push("Alpine.js");

  // CSS Libraries
  const cssLinks = $("link[rel='stylesheet']").map((_, el) => $(el).attr("href") || "").get().join(" ").toLowerCase();
  const styleContent = $("style").map((_, el) => $(el).html() || "").get().join(" ").toLowerCase();

  if (cssLinks.includes("bootstrap") || styleContent.includes("bootstrap")) cssLibraries.push("Bootstrap");
  if (cssLinks.includes("tailwind") || $("*").first().attr("class")?.includes("tailwind")) cssLibraries.push("Tailwind CSS");
  if (cssLinks.includes("bulma") || styleContent.includes("bulma")) cssLibraries.push("Bulma");
  if (cssLinks.includes("foundation") || styleContent.includes("foundation")) cssLibraries.push("Foundation");
  if (cssLinks.includes("materialize") || styleContent.includes("materialize")) cssLibraries.push("Materialize");
  if (styleContent.includes("font-awesome") || cssLinks.includes("font-awesome")) cssLibraries.push("Font Awesome");
  if (cssLinks.includes("animate.css") || styleContent.includes("animate__")) cssLibraries.push("Animate.css");

  // Analytics
  if (scriptContent.includes("google-analytics") || scriptContent.includes("gtag") || allScripts.includes("google-analytics")) analytics.push("Google Analytics");
  if (scriptContent.includes("googletagmanager") || allScripts.includes("googletagmanager")) analytics.push("Google Tag Manager");
  if (allScripts.includes("hotjar") || scriptContent.includes("hotjar")) analytics.push("Hotjar");
  if (allScripts.includes("mixpanel") || scriptContent.includes("mixpanel")) analytics.push("Mixpanel");
  if (allScripts.includes("segment") || scriptContent.includes("analytics.js")) analytics.push("Segment");
  if (scriptContent.includes("fbq(") || allScripts.includes("facebook")) analytics.push("Facebook Pixel");
  if (allScripts.includes("plausible")) analytics.push("Plausible");
  if (allScripts.includes("clarity")) analytics.push("Microsoft Clarity");

  // Other tools
  if (scriptContent.includes("webpack") || allScripts.includes("webpack")) other.push("Webpack");
  if (allScripts.includes("vite") || scriptContent.includes("vite")) other.push("Vite");
  if (allScripts.includes("parcel")) other.push("Parcel");

  const generator = $("meta[name='generator']").attr("content");
  if (generator) other.push(`Generator: ${generator}`);

  // Hosting detection from headers
  let hosting = "Unknown";
  const server = (headers["server"] || "").toLowerCase();
  const via = (headers["via"] || "").toLowerCase();
  const xPoweredBy = (headers["x-powered-by"] || "").toLowerCase();
  const xVercelId = headers["x-vercel-id"] || headers["x-vercel-cache"];
  const xNf = headers["x-nf-request-id"];
  const xAmz = headers["x-amz-cf-id"] || headers["x-amz-request-id"];

  if (xVercelId || xPoweredBy.includes("vercel") || via.includes("vercel")) hosting = "Vercel";
  else if (xNf || server.includes("netlify")) hosting = "Netlify";
  else if (server.includes("cloudflare") || headers["cf-ray"]) hosting = "Cloudflare";
  else if (headers["x-github-request-id"] || server.includes("github")) hosting = "GitHub Pages";
  else if (xAmz) hosting = "AWS CloudFront";
  else if (server.includes("nginx")) hosting = "Nginx";
  else if (server.includes("apache")) hosting = "Apache";
  else if (server.includes("litespeed")) hosting = "LiteSpeed";
  else if (xPoweredBy.includes("php")) { hosting = "PHP Server"; other.push("PHP"); }
  else if (xPoweredBy.includes("express")) hosting = "Node.js (Express)";
  else if (server) hosting = server.charAt(0).toUpperCase() + server.slice(1);

  return { frameworks, cssLibraries, hosting, analytics, other };
}

// ─── Gemini AI Analysis ────────────────────────────────────────────────────

async function getAIAnalysis(
  url: string,
  performance: { lcp: number; fcp: number; cls: number; tti: number; totalLoadTime: number; resourceCount: number; totalTransferSize: number },
  accessibility: AccessibilityData,
  security: SecurityData,
  techStack: TechStackData,
  dom: DOMData
): Promise<AISummary> {
  const missingHeaders = security.headers.filter((h) => !h.present && h.risk !== "none").map((h) => h.header);
  const topViolations = accessibility.violations.slice(0, 5).map((v) => `${v.id} (${v.impact}): ${v.description}`).join("\n");

  const prompt = `You are an expert web performance and UX consultant acting as an "AI Website Doctor" for a hackathon project called Web Inspectra.

Analyze the following real scan data for: ${url}

PERFORMANCE VITALS:
- LCP (Largest Contentful Paint): ${(performance.lcp / 1000).toFixed(2)}s ${performance.lcp > 4000 ? "(POOR — should be <2.5s)" : performance.lcp > 2500 ? "(NEEDS WORK — should be <2.5s)" : "(GOOD)"}
- FCP (First Contentful Paint): ${(performance.fcp / 1000).toFixed(2)}s ${performance.fcp > 3000 ? "(POOR)" : performance.fcp > 1800 ? "(NEEDS WORK)" : "(GOOD)"}
- CLS (Cumulative Layout Shift): ${performance.cls.toFixed(3)} ${performance.cls > 0.25 ? "(POOR — should be <0.1)" : performance.cls > 0.1 ? "(NEEDS WORK)" : "(GOOD)"}
- TTI: ${(performance.tti / 1000).toFixed(2)}s
- Total Load Time: ${(performance.totalLoadTime / 1000).toFixed(2)}s
- Total Requests: ${performance.resourceCount}
- Page Size: ${(performance.totalTransferSize / 1024).toFixed(0)} KB

ACCESSIBILITY (score: ${accessibility.score}/100, ${accessibility.violations.length} violations):
${topViolations || "No violations found"}

SECURITY (score: ${security.score}/100):
Missing headers: ${missingHeaders.length ? missingHeaders.join(", ") : "None"}

TECH STACK:
- Frameworks: ${techStack.frameworks.join(", ") || "Unknown"}
- Hosting: ${techStack.hosting}
- DOM nodes: ${dom.nodeCount} (${dom.nodeCount > 1500 ? "BLOATED — too many, can slow rendering" : "acceptable"})

Respond with a JSON object (no markdown, raw JSON only):
{
  "overallHealth": "One paragraph (3-5 sentences) plain English summary of this site's health, like a doctor giving a diagnosis. Mention the biggest issues and biggest strengths. Be specific with numbers.",
  "findings": [
    {
      "title": "Short issue title (5-8 words)",
      "explanation": "2-3 sentence plain English explanation: what's wrong, why it matters to users, and one specific actionable fix.",
      "impact": "high|medium|low",
      "category": "performance|accessibility|security|seo|general"
    }
  ]
}

Generate 5-8 findings total. Prioritize real issues found in the data above. Be specific (use the actual numbers). Write for a non-technical audience.`;

  try {
    if (!genAI) throw new Error("No API key");
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    const result = await model.generateContent(prompt);
    const text = result.response.text().trim();
    // Bug #13: Non-greedy match to avoid spanning across multiple JSON objects in the response.
    const jsonMatch = text.match(/\{[\s\S]*?\}(?=[^{]*$)/) || text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error("No JSON in response");
    return JSON.parse(jsonMatch[0]) as AISummary;
  } catch (err) {
    console.error("[AI] Gemini call failed, using smart fallback:", err);
    return generateSmartFallback(url, performance, accessibility, security, dom);
  }
}

function generateSmartFallback(
  url: string,
  performance: { lcp: number; fcp: number; cls: number; tti: number; totalLoadTime: number; resourceCount: number; totalTransferSize: number },
  accessibility: AccessibilityData,
  security: SecurityData,
  dom: DOMData
): AISummary {
  const findings: AIFinding[] = [];
  const lcpS = (performance.lcp / 1000).toFixed(2);
  const fcpS = (performance.fcp / 1000).toFixed(2);
  const sizeKB = (performance.totalTransferSize / 1024).toFixed(0);

  // Performance findings
  if (performance.lcp > 4000) {
    findings.push({ title: "Slow Largest Contentful Paint (LCP)", explanation: `The main content takes ${lcpS}s to appear — Google's threshold is 2.5s for "good." This directly impacts search ranking and user retention. Optimize images using WebP format, add lazy loading, and use a CDN to serve assets closer to users.`, impact: "high", category: "performance" });
  } else if (performance.lcp > 2500) {
    findings.push({ title: "LCP Needs Improvement", explanation: `LCP is ${lcpS}s — acceptable but not great. Google considers anything over 2.5s needing improvement. Consider preloading the hero image and reducing render-blocking resources.`, impact: "medium", category: "performance" });
  }

  if (performance.fcp > 3000) {
    findings.push({ title: "Slow First Contentful Paint", explanation: `It takes ${fcpS}s before anything appears on screen. Users see a blank page for too long. Remove render-blocking scripts, inline critical CSS, and defer non-essential JavaScript.`, impact: "high", category: "performance" });
  }

  if (performance.totalTransferSize > 3 * 1024 * 1024) {
    findings.push({ title: "Page Weight Is Too Heavy", explanation: `This page transfers ${sizeKB}KB of data. Heavy pages load slowly on mobile networks. Compress images with WebP/AVIF, enable gzip/brotli compression, and remove unused JavaScript.`, impact: "high", category: "performance" });
  } else if (performance.totalTransferSize > 1.5 * 1024 * 1024) {
    findings.push({ title: "Page Size Could Be Reduced", explanation: `At ${sizeKB}KB, this page is larger than ideal. Mobile users on 3G connections will experience slow loads. Audit and remove unused CSS/JS, compress images.`, impact: "medium", category: "performance" });
  }

  if (performance.resourceCount > 100) {
    findings.push({ title: "Too Many Network Requests", explanation: `The page makes ${performance.resourceCount} network requests. Each request adds latency. Bundle assets, use HTTP/2 push, and eliminate unnecessary third-party scripts.`, impact: "medium", category: "performance" });
  }

  if (dom.nodeCount > 1500) {
    findings.push({ title: "DOM is Excessively Large", explanation: `The DOM has ${dom.nodeCount} elements — Google recommends fewer than 1,500. Large DOMs cause slow style recalculations and longer interactive times. Simplify HTML structure and use virtual lists for dynamic content.`, impact: "medium", category: "performance" });
  }

  // Accessibility findings
  if (accessibility.violations.length > 0) {
    const criticals = accessibility.violations.filter(v => v.impact === "critical" || v.impact === "serious");
    if (criticals.length > 0) {
      findings.push({ title: "Critical Accessibility Violations Found", explanation: `${criticals.length} serious accessibility violations detected (including ${criticals[0].id}). These prevent disabled users from using the site with assistive technology. This is also a legal liability in many countries (ADA, WCAG 2.1).`, impact: "high", category: "accessibility" });
    } else {
      findings.push({ title: "Accessibility Issues Detected", explanation: `${accessibility.violations.length} accessibility violations found. These make the site harder to use for people with disabilities. Address them to improve inclusivity and SEO.`, impact: "medium", category: "accessibility" });
    }
  }

  // Security findings
  const missingHigh = security.headers.filter(h => !h.present && h.risk === "high");
  if (missingHigh.length > 0) {
    findings.push({ title: "Critical Security Headers Missing", explanation: `${missingHigh.map(h => h.header).join(", ")} ${missingHigh.length === 1 ? "is" : "are"} missing. This makes the site vulnerable to XSS and other attacks. Add these headers in your server/CDN configuration immediately.`, impact: "high", category: "security" });
  } else if (security.score < 60) {
    findings.push({ title: "Security Headers Need Improvement", explanation: `Security score is ${security.score}/100. Several protective HTTP headers are missing. These headers cost nothing to add and significantly improve resistance to common web attacks.`, impact: "medium", category: "security" });
  }

  if (performance.cls > 0.25) {
    findings.push({ title: "Severe Layout Instability (CLS)", explanation: `CLS is ${performance.cls.toFixed(3)} — very poor. Elements jump around as the page loads, which frustrates users and hurts Core Web Vitals ranking. Always set explicit width/height on images and ads; avoid injecting content above existing content.`, impact: "high", category: "performance" });
  }

  // Overall health summary
  const score = Math.round(((100 - Math.min((performance.totalLoadTime / 80), 100)) + accessibility.score + security.score) / 3);
  const grade = score >= 90 ? "excellent" : score >= 75 ? "good" : score >= 60 ? "fair" : score >= 40 ? "poor" : "critical";
  const perfWord = performance.totalLoadTime < 3000 ? "fast" : performance.totalLoadTime < 6000 ? "moderate" : "slow";

  const overallHealth = `${url} has ${grade} overall digital health with a combined score of approximately ${score}/100. Load performance is ${perfWord} at ${(performance.totalLoadTime / 1000).toFixed(1)}s total. ${accessibility.violations.length > 0 ? `There are ${accessibility.violations.length} accessibility violations that may exclude users with disabilities. ` : "Accessibility looks clean — no violations detected. "}${security.score < 70 ? `Security headers are incomplete (${security.score}/100), leaving users potentially exposed. ` : `Security headers are reasonably configured (${security.score}/100). `}Focus on the high-priority findings below to most effectively improve user experience and search ranking.`;

  return { overallHealth, findings };
}

// ─── Main Scan Endpoint ────────────────────────────────────────────────────

app.post("/scan", async (req, res) => {
  const { url: rawUrl } = req.body;
  if (!rawUrl) { res.status(400).json({ error: "URL is required" }); return; }

  let url: string;
  try { url = normalizeUrl(rawUrl); }
  catch (e: any) { res.status(400).json({ error: e.message || "Invalid URL format — please include a valid domain like example.com" }); return; }

  console.log(`\n[Backend] ─── Scanning: ${url} ───`);

  try {
    // ── 1. Fetch the main page ──────────────────────────────────────────────
    console.log("[Backend] Fetching main page HTML...");
    const t0 = Date.now();

    const mainResponse = await axios.get(url, {
      timeout: 20000,
      maxRedirects: 10,
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; WebInspectra/1.0; +https://webinspectra.dev)",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Encoding": "gzip, deflate, br",
        "Accept-Language": "en-US,en;q=0.9",
      },
      validateStatus: () => true,
    });

    const ttfb = Date.now() - t0;
    const responseHeaders: Record<string, string> = {};
    for (const [k, v] of Object.entries(mainResponse.headers)) {
      if (typeof v === "string") responseHeaders[k] = v;
      else if (Array.isArray(v)) responseHeaders[k] = v.join(", ");
    }

    const html: string = typeof mainResponse.data === "string"
      ? mainResponse.data
      : JSON.stringify(mainResponse.data);

    const htmlSize = Buffer.byteLength(html, "utf8");
    const $ = cheerio.load(html);

    // ── 2. Extract sub-resources ────────────────────────────────────────────
    console.log("[Backend] Extracting resource URLs...");
    const resourceUrls = extractResourceUrls(html, url);

    // ── 3. Probe sub-resources concurrently (max 40, HEAD requests) ────────
    console.log(`[Backend] Probing ${Math.min(resourceUrls.length, 40)} resources...`);
    const networkRequests: NetworkRequest[] = [];

    // Add main document
    networkRequests.push({
      url,
      method: "GET",
      resourceType: "document",
      status: mainResponse.status,
      startTime: 0,
      duration: ttfb,
      size: htmlSize,
      failed: mainResponse.status >= 400,
    });

    // Probe resources in batches
    const probeTargets = resourceUrls.slice(0, 40);
    const batchSize = 10;
    for (let i = 0; i < probeTargets.length; i += batchSize) {
      const batch = probeTargets.slice(i, i + batchSize);
      const results = await Promise.allSettled(
        batch.map(async ({ url: rUrl, type }) => {
          const rt0 = Date.now();
          try {
            const r = await axios.head(rUrl, {
              timeout: 8000,
              headers: { "User-Agent": "Mozilla/5.0 (compatible; WebInspectra/1.0)" },
              validateStatus: () => true,
              maxRedirects: 5,
            });
            const duration = Date.now() - rt0;
            const size = parseInt(String(r.headers["content-length"] ?? "0"), 10) || 0;
            return { url: rUrl, type, status: r.status, duration, size, failed: r.status >= 400 };
          } catch {
            return { url: rUrl, type, status: 0, duration: Date.now() - rt0, size: 0, failed: true };
          }
        })
      );

      let cumulativeStart = ttfb;
      results.forEach((result) => {
        if (result.status === "fulfilled") {
          const { url: rUrl, type, status, duration, size, failed } = result.value;
          networkRequests.push({
            url: rUrl, method: "GET", resourceType: type,
            status, startTime: cumulativeStart, duration, size, failed,
          });
          cumulativeStart += Math.floor(duration / 3);
        }
      });
    }

    // ── 4. Security headers ──────────────────────────────────────────────────
    console.log("[Backend] Auditing security headers...");
    // Bug #11: Weighted security scoring — high-risk missing headers penalise more.
    const RISK_WEIGHT: Record<string, number> = { high: 40, medium: 25, low: 20, none: 15 };
    const secHeaders: SecurityHeaderCheck[] = [
      { header: "Content-Security-Policy", present: !!responseHeaders["content-security-policy"], value: responseHeaders["content-security-policy"], description: "Prevents XSS attacks by restricting where resources load from.", risk: "high" },
      { header: "Strict-Transport-Security", present: !!responseHeaders["strict-transport-security"], value: responseHeaders["strict-transport-security"], description: "Forces HTTPS for all future requests — prevents downgrade attacks.", risk: "medium" },
      { header: "X-Frame-Options", present: !!responseHeaders["x-frame-options"], value: responseHeaders["x-frame-options"], description: "Protects against clickjacking by controlling iframe embedding.", risk: "medium" },
      { header: "X-Content-Type-Options", present: !!responseHeaders["x-content-type-options"], value: responseHeaders["x-content-type-options"], description: "Prevents MIME-sniffing vulnerabilities.", risk: "low" },
      { header: "Referrer-Policy", present: !!responseHeaders["referrer-policy"], value: responseHeaders["referrer-policy"], description: "Controls how much referrer information is sent with requests.", risk: "low" },
      { header: "Permissions-Policy", present: !!responseHeaders["permissions-policy"], value: responseHeaders["permissions-policy"], description: "Restricts browser feature access (camera, mic, geolocation).", risk: "none" },
    ];
    const totalWeight = secHeaders.reduce((s, h) => s + (RISK_WEIGHT[h.risk] ?? 10), 0);
    const earnedWeight = secHeaders.filter(h => h.present).reduce((s, h) => s + (RISK_WEIGHT[h.risk] ?? 10), 0);
    const secScore = Math.round((earnedWeight / totalWeight) * 100);
    const security: SecurityData = { score: secScore, headers: secHeaders };

    // ── 5. Tech stack ────────────────────────────────────────────────────────
    console.log("[Backend] Detecting tech stack...");
    const techStack = detectTechStack(html, responseHeaders);

    // ── 6. Accessibility ─────────────────────────────────────────────────────
    console.log("[Backend] Auditing accessibility...");
    const accessibility = analyzeAccessibility(html);

    // ── 7. DOM tree ──────────────────────────────────────────────────────────
    console.log("[Backend] Building DOM tree...");
    const bodyEl = $("body").get(0) || $("html").get(0);
    const domTree = bodyEl ? buildDOMTree($, bodyEl, 0, 5) : { tag: "body", children: [] };
    const nodeCount = $("*").length;
    let maxDepth = 0;
    const calcDepth = (el: Element | undefined, d: number) => {
      if (!el) return;
      if (d > maxDepth) maxDepth = d;
      $(el).children().each((_, c) => calcDepth(c as Element, d + 1));
    };
    calcDepth($("html").get(0), 0);
    const largestSubtrees = getLargestSubtrees(domTree);
    const dom: DOMData = { tree: domTree, nodeCount, maxDepth, largestSubtrees };

    // ── 8. Performance estimation ────────────────────────────────────────────
    console.log("[Backend] Estimating performance metrics...");
    // Bug #3: htmlSize is already included as networkRequests[0].size (the main document).
    // Summing all requests already covers it — do NOT add htmlSize again.
    const totalTransferSize = networkRequests.reduce((s, r) => s + r.size, 0);
    const totalLoadTime = Date.now() - t0;

    // Estimate Core Web Vitals from observable data
    const scriptCount = networkRequests.filter(r => r.resourceType === "script").length;
    const imageCount = networkRequests.filter(r => r.resourceType === "image").length;
    const cssCount = networkRequests.filter(r => r.resourceType === "stylesheet").length;
    const subResources = networkRequests.slice(1);
    const avgResourceTime = subResources.length > 0
      ? subResources.reduce((s, r) => s + r.duration, 0) / subResources.length
      : 300;

    // FCP: First contentful paint — roughly TTFB + render-blocking resources
    const fcp = Math.round(ttfb + (cssCount * 80) + (scriptCount * 40));
    // LCP: Largest contentful paint — FCP + image load time + DOM complexity penalty
    const lcpExtra = imageCount > 0 ? avgResourceTime * 1.2 : 200;
    const domPenalty = Math.max(0, (nodeCount - 500) * 0.3);
    const lcp = Math.round(fcp + lcpExtra + domPenalty);
    // CLS: Estimate from images without explicit dimensions
    const imgsWithoutDimensions = $("img:not([width]):not([height])").length;
    const cls = Math.min(parseFloat((imgsWithoutDimensions * 0.03 + (networkRequests.filter(r => r.resourceType === "stylesheet").length > 5 ? 0.05 : 0)).toFixed(3)), 1.0);
    // TTI: roughly FCP + script execution time
    const tti = Math.round(fcp + (scriptCount * 120) + (domPenalty * 2));

    const performance = {
      lcp, fcp, cls, inp: Math.round(lcp * 0.4), tti,
      totalLoadTime,
      resourceCount: networkRequests.length,
      totalTransferSize,
    };

    // ── 9. Network data ──────────────────────────────────────────────────────
    const sortedBySlow = [...networkRequests].sort((a, b) => b.duration - a.duration);
    const network: NetworkData = {
      requests: networkRequests,
      totalRequests: networkRequests.length,
      failedRequests: networkRequests.filter(r => r.failed).length,
      slowestRequests: sortedBySlow.slice(0, 5),
    };

    // ── 10. AI Analysis ──────────────────────────────────────────────────────
    console.log("[Backend] Running AI analysis...");
    const aiSummary = await getAIAnalysis(url, performance, accessibility, security, techStack, dom);

    // ── 11. Assemble report ──────────────────────────────────────────────────
    const report: ScanReport = {
      url,
      scannedAt: new Date().toISOString(),
      status: "complete",
      dom,
      performance,
      network,
      accessibility,
      techStack,
      security,
      aiSummary,
    };

    console.log(`[Backend] ✓ Scan complete for ${url} in ${Date.now() - t0}ms`);
    res.json({ report });

  } catch (err: any) {
    console.error("[Backend] Scan error:", err.message || err);
    const msg = err.code === "ECONNREFUSED" ? "Could not connect to the website — it may be down or blocking bots."
      : err.code === "ETIMEDOUT" ? "Request timed out — the site took too long to respond."
      : err.code === "ENOTFOUND" ? "Domain not found — check the URL spelling."
      : err.message || "Unexpected error during scan.";
    res.status(500).json({ error: msg });
  }
});

app.get("/health", (_, res) => res.json({ status: "ok", aiEnabled: !!genAI }));

app.listen(PORT, () => {
  console.log(`\n🩺 Web Inspectra Backend running on http://localhost:${PORT}`);
  console.log(`   AI Analysis: ${genAI ? "✓ Gemini enabled" : "⚠ Mock mode (add GEMINI_API_KEY to backend/.env)"}`);
});
