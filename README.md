# 🩺 Web Inspectra

**Web Inspectra** is an AI-powered diagnostic engine for websites. Paste any public URL and get a full visual health report — performance, accessibility, security, DOM structure, network activity, and tech stack — with an AI "Chief Medical Officer" that explains every technical finding in plain English and prioritizes what to fix first.

Unlike traditional tools (Lighthouse, DevTools) that dump raw metrics, Web Inspectra treats a website like a patient: it runs a full diagnostic scan and gives you a readable report, not a spreadsheet.

Instead of heavy browser automation (Playwright/Puppeteer), Web Inspectra uses a lightweight HTTP + parsing engine (`axios` + `cheerio`), so there's no browser binary to download and scans return in seconds.

---

## ✨ Features

| Module | What it does |
|---|---|
| ⚡ **Core Web Vitals** | Measures LCP, FCP, CLS, TTI, and total load time, rolled into a custom weighted health score |
| 🧠 **AI Chief Medical Officer** | Sends raw scan data to Gemini AI, which explains issues in plain English and ranks them by impact. Falls back to rule-based heuristics if no API key is set |
| 🧬 **DOM Anatomy Explorer** | Interactive SVG node graph (drag-to-pan, scroll-to-zoom) + a classic tree view. Flags DOM bloat and heaviest subtrees |
| 🛡️ **Immune System (Security)** | Audits HTTP response headers against security best practices |
| ♿ **Accessibility (A11y)** | Scans for WCAG violations — missing alt text, ARIA attributes, contrast issues |
| 📡 **Network Waterfall** | Animated, color-coded timeline of every resource the page loads, with real latency data |
| 🏗️ **Tech Stack Detection** | Identifies hosting provider, frameworks, libraries, and analytics tools in use |

---

## 🛠️ Tech Stack

Web Inspectra is a `pnpm` monorepo with three workspaces:

- **`frontend/`** — React 18, Vite, Tailwind CSS v3
- **`backend/`** — Node.js, Express, Axios (HTTP fetching), Cheerio (HTML parsing), `@google/generative-ai` (Gemini API)
- **`shared-types/`** — TypeScript interfaces (`ScanReport`, `DOMNode`, etc.) shared across frontend and backend so both sides always agree on data shape

---

## 📋 Prerequisites

Before you start, install these on your machine:

| Tool | Version | Check with | Install |
|---|---|---|---|
| Node.js | v18 or higher | `node -v` | [nodejs.org](https://nodejs.org/) |
| pnpm | latest | `pnpm -v` | `npm install -g pnpm` |
| Git | any recent | `git --version` | [git-scm.com](https://git-scm.com/) |

If `node -v` shows anything below v18, update Node before continuing — the project won't run correctly on older versions.

---

## 🚀 Getting Started (New Developer Setup)

### 1. Clone the repository

```bash
git clone https://github.com/Aryan107rn/Web_Inspectra.git
cd Web_Inspectra
```

### 2. Install all dependencies

Since this is a monorepo, one command installs dependencies for `frontend`, `backend`, and `shared-types` all at once:

```bash
pnpm install
```

No browser binaries get downloaded — Web Inspectra doesn't use Playwright, so this step is fast.

### 3. Set up environment variables

The AI Doctor feature needs a Gemini API key. The app **still works without one** — it just falls back to rule-based heuristics instead of AI-generated explanations. Recommended to set it up though, since that's the core differentiator of the project.

**Get a free Gemini API key:**
1. Go to [Google AI Studio](https://aistudio.google.com/apikey)
2. Sign in with a Google account and generate a key
3. Copy it

**Create the backend environment file:**
```bash
touch backend/.env
```

**Open it and add:**
```env
GEMINI_API_KEY=your_api_key_here
PORT=3001
```

Save the file. Never commit `.env` — it should already be covered by `.gitignore`, but double check before your first push.

### 4. Run the development servers

From the **root** of the project (not inside `frontend/` or `backend/`):

```bash
pnpm run dev
```

This starts both servers concurrently:
- **Frontend (React/Vite):** [http://localhost:3000](http://localhost:3000)
- **Backend (Express API):** [http://localhost:3001](http://localhost:3001)

Open `http://localhost:3000` in your browser. You should see the Web Inspectra landing page with a URL input box.

### 5. Verify it works

Paste a real website URL (e.g. `https://example.com`) into the input and run a scan. If everything's set up correctly, you'll get a full report within a few seconds. If the backend isn't running or crashed, check your terminal for errors — most first-time issues are a missing `.env` file or the wrong Node version.

---

## 📁 Project Structure

```text
Web_Inspectra/
├── backend/                # Express server & scanning engine
│   ├── src/
│   │   └── index.ts        # Main scanning logic, Gemini AI integration, heuristic fallback
│   ├── .env                # Your local secrets (never commit this)
│   └── package.json
│
├── frontend/                # React + Vite application
│   ├── src/
│   │   ├── components/     # UI components: DOMGraph, WaterfallChart, ScoreGauge, etc.
│   │   ├── App.tsx         # Main app layout and state management
│   │   └── index.css       # Custom animations + Tailwind setup
│   └── tailwind.config.js
│
├── shared-types/             # Shared TypeScript contract
│   └── src/index.ts        # ScanReport, DOMNode, and all other shared interfaces
│
├── pnpm-workspace.yaml       # Monorepo workspace config
└── package.json              # Root-level scripts (runs both servers via `concurrently`)
```

**Key rule for contributors:** if you're adding a new field to the scan report (performance, accessibility, whatever module), define it in `shared-types/src/index.ts` first, then use it in both `backend` and `frontend`. This keeps the contract in sync and avoids "works on backend, breaks on frontend" bugs.

---

## 🧑‍💻 Development Workflow

- **Only backend:** `pnpm --filter backend dev`
- **Only frontend:** `pnpm --filter frontend dev`
- **Both together:** `pnpm run dev` (recommended for normal work)

If you add a new npm package to just one workspace (not the whole repo):
```bash
pnpm --filter frontend add <package-name>
# or
pnpm --filter backend add <package-name>
```

Don't run plain `npm install` inside individual folders — always use `pnpm` from the root or with `--filter`, or you'll break the workspace linking.

---

## 🎨 UI/UX Design Language

The frontend follows a **"Clinical Dark"** aesthetic:
- Deep navy/black backgrounds (`#12121f`)
- Electric cyan and violet accent colors
- ECG-style scan-line animations
- Glassmorphic metric cards
- Custom inline SVG icons and data visualizations

Keep new components consistent with this theme — check `frontend/src/index.css` for existing animation/color variables before introducing new ones.

---

## 🐛 Troubleshooting

| Problem | Likely Fix |
|---|---|
| `pnpm: command not found` | Run `npm install -g pnpm` |
| Backend crashes on scan | Check `backend/.env` exists and `PORT=3001` is set |
| AI insights not showing | Confirm `GEMINI_API_KEY` is valid and has no extra spaces/quotes |
| Port already in use | Something else is running on 3000/3001 — stop it or change `PORT` in `.env` |
| Changes to `shared-types` not reflected | Restart `pnpm run dev` — TypeScript project references sometimes need a fresh start |

---

## 📝 License

ISC License
