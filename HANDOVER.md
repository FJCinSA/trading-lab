# FJC Trading Lab — Session Handover

**Date:** Thursday, 30 April 2026  
**Time:** 11:50 AM SAST (UTC+2)  
**Outgoing session:** Claude Sonnet 4.6 via Cowork mode  
**Repo:** https://github.com/FJCinSA/trading-lab  
**Live site:** https://fjcinsa.github.io/trading-lab/  
**Local folder:** `C:\Users\Francois\OneDrive\Desktop\Projects\trading-lab`

---

## What was completed this session

### ES Module Refactor — SHIPPED ✅

The entire JavaScript codebase was split from a single monolithic `<script>` block (~1,966 lines inside trading-lab.html) into **14 ES modules** under `js/`. The commit is live on GitHub:

> `refactor: split monolithic script into 14 ES modules`

**Files created/modified:**

| File | What it does |
|---|---|
| `js/config.js` | Single source of truth — TICKERS array + all constants (LS_PROXY, LS_YAHOO_PROXY, LS_FX) |
| `js/indicators.js` | Pure math: `sma()`, `bollinger()`, `rsi()` |
| `js/patterns.js` | `detectPatterns()`, `detectActions()` |
| `js/synthetic.js` | Mulberry32 PRNG + `genCandles()` — deterministic candle generator |
| `js/state.js` | Shared mutable state object + `savePortfolio()`, `savePilot()`, `saveSR()`, `defaultPortfolio()`, `defaultPilot()` |
| `js/data.js` | Yahoo Finance proxy fetch + `updateProxyStatus()`, `updateYahooStatus()`, `refreshAllFromYahoo(onSuccess)` |
| `js/chart.js` | All Canvas 2D drawing — `initChart(renderFn)`, `drawCandles()`, `drawVolume()`, `drawRSI()` |
| `js/edge.js` | Historical edge computation + `renderHistoricalEdge()` |
| `js/portfolio.js` | Paper portfolio, trade tooltips, price alerts — `trade()`, `addAlert()`, `checkAlerts()`, `renderPortfolio()`, `renderAlerts()`, `updateTradeTooltips()` |
| `js/ai.js` | Claude API integration — `askClaude('analyse' \| 'briefing')` |
| `js/autopilot.js` | Rule-based pilot engine — `pilotEngage()`, `pilotDisengage()`, `renderPilot()`, `updateAutopilotUI()`, `isAutopilotEngaged()`, `resetAutopilotState()` |
| `js/analogs.js` | Historical analog scan + render — `renderAnalogs(onJumpCallback)` |
| `js/replay.js` | Replay Mode lifecycle — `initReplay(renderFn, yahooStatusFn)`, `setupReplayMode()`, `enterReplay(idx)`, `updateReplayUI()` |
| `js/main.js` | **Orchestrator entry point** — imports all 13 modules, owns `render()`, `renderSignals()`, `buildTabs()`, `bindControls()`, `jumpToAnalog()`, `init()` |
| `trading-lab.html` | Replaced ~1,966-line `<script>` block with `<script type="module" src="./js/main.js">`. Old script preserved as HTML comment. |
| `service-worker.js` | Bumped to v4. APP_SHELL now pre-caches all 14 JS module files. |
| `README.md` | Complete professional rewrite — badges, architecture diagrams, feature tables, Cloudflare setup, anti-guru principles, full module tree |
| `ROADMAP.md` | Updated with ES module refactor decision log entry. Date header updated. |

---

## Architecture — key design decisions (must know)

**1. Circular dependency prevention via dependency injection**  
`chart.js` and `replay.js` need to trigger `render()` from `main.js`, but importing main.js from those modules would be circular. Solution:
```js
initChart(render);                         // at bottom of main.js
initReplay(render, updateYahooStatus);     // at bottom of main.js
```
These inject the callbacks at boot time. Never import main.js from any other module.

**2. `state.historicalEdge` lives on the shared state object — not a top-level `let`**  
ES module live bindings cannot safely propagate a *reassigned* `let` across module boundaries. A property mutation on the shared `state` object works correctly across all importers. Every place that recomputes edge does:
```js
state.historicalEdge = computeHistoricalEdge();
```
This applies in: `init()`, `_onYahooSuccess()`, `enterReplay()`, `exitReplay()`, and `stepReplay()`.

**3. Autopilot state is module-private**  
`autopilotState` is a `const` inside `autopilot.js` — never exported. External callers use the exported helpers: `isAutopilotEngaged()` and `resetAutopilotState()`. The pilot reset handler in main.js:
```js
state.pilot = defaultPilot();
resetAutopilotState();   // clears peakValue, mode, currentIdx, interval handle
savePilot();
```

**4. Analogs and Yahoo callbacks — no circular imports**  
`renderAnalogs(onJump)` accepts a jump callback rather than importing `jumpToAnalog` from main.js.  
`refreshAllFromYahoo(onSuccess)` accepts `_onYahooSuccess` as a callback. `_onYahooSuccess` recomputes edge and re-renders.

**5. Adding a new ticker = one line change**  
Edit `js/config.js`, append to the `TICKERS` array:
```js
{ sym: 'NVDA', name: 'NVIDIA', exch: 'NASDAQ', ccy: 'USD', yahoo: 'NVDA', start: 900, vol: 0.030, drift: 0.002 }
```
Everything else (chart, indicators, autopilot, edge tables, analog engine, AI prompts, portfolio, tabs) iterates `TICKERS` automatically.

---

## Current repo state

**Latest commits on `main` (as of this handover):**

```
refactor: split monolithic script into 14 ES modules   ← this session
fix: live FX rate field, synthetic warning, auto-load on startup, pillar priority reorder
docs+cleanup: mark Pillars 1-3 shipped, remove dead code and stale to-dos
Mark Pillar 3 (Historical Analog Engine) shipped on 30 April 2026
Pillar 3: Historical Analog Engine — bucket today's setup, scan history...
Mark Pillar 2 Phase 1 shipped on 30 April 2026
Pillar 2 Phase 1: Replay Mode MVP — date picker, step day-by-day, REPLAY pill...
```

**All files tracked and clean. No uncommitted local changes.**

---

## Verification done this session

- ✅ Live site loaded: https://fjcinsa.github.io/trading-lab/trading-lab.html
- ✅ Browser console: **zero errors**. Only log: `[FJC Lab] Service worker registered, scope: https://fjcinsa.github.io/trading-lab/`
- ✅ Live data auto-fetched on load (Yahoo proxy configured, refreshed 11:49 AM)
- ✅ Chart rendered with TDY candles, MA50, MA200, volume, RSI
- ✅ Historical edge tables populated for all 4 tickers
- ✅ All four ticker tabs functional

---

## Roadmap status

| # | Pillar | Status |
|---|---|---|
| 1 | Live Yahoo Finance data | ✅ Shipped 29 Apr 2026 |
| 2 | Replay Mode MVP | ✅ Shipped 30 Apr 2026 |
| 3 | Historical Analog Engine | ✅ Shipped 30 Apr 2026 |
| — | ES module refactor (14 modules) | ✅ Shipped 30 Apr 2026 |
| **4** | **Decision Journal with weekly AI review** | **🔜 NEXT** |
| 5 | Comparison / overlay mode | Planned |
| 6 | Famous Crashes case study library | Planned (needs static JSON for pre-2024 data) |
| 7 | Curriculum modules | Planned |

---

## Next session: Pillar 4 — Decision Journal

**What it is:** Every trade decision (manual or autopilot) is logged with the user's reasoning at the time. The AI reviews patterns weekly. This is the core teaching differentiator — not a P&L log, a *meaning* log.

**How to build it (clean with the modular architecture):**

1. **Create `js/journal.js`** — new module. Exports:
   - `addJournalEntry(type, ticker, price, reasoning, autopilotContext)` — saves to localStorage
   - `renderJournal()` — renders the journal panel
   - `getJournalEntries()` — returns all entries for AI review
   - `clearJournal()` — reset button

2. **Wire through `main.js`** — import journal.js, call `renderJournal()` in `render()`, wire the buy/sell buttons to prompt for reasoning before executing the trade.

3. **Wire into `ai.js`** — add a third AI mode: `askClaude('journal-review')` that passes the last 7 days of journal entries to Claude for pattern identification.

4. **Add HTML panel** — a collapsible journal panel below the portfolio section in trading-lab.html.

5. **Bump service worker** to v5 (add `js/journal.js` to APP_SHELL).

**Estimated build time:** 3–4 hours.

**Discipline rule:** Do not start this until the ES module refactor commit is verified live (it is — done above). ✅

---

## Environment / tooling notes for the next Claude

- **Local folder:** `C:\Users\Francois\OneDrive\Desktop\Projects\trading-lab`
- **Git:** The repo is a local clone. Use GitHub Desktop (installed) to commit and push — it's the most reliable method. The batch file approach (push-to-github.bat) created a commit but Windows blocked the push via OneDrive-synced bat files. GitHub Desktop worked cleanly.
- **Workspace bash:** Often unavailable (Linux sandbox fails to start). Use the `Read`/`Write`/`Edit` file tools directly — they work reliably on the OneDrive path.
- **Terminals are "click-only" tier** in computer-use — no typing allowed in Git Bash, Terminal, or Command Prompt. Use GitHub Desktop GUI or the Bash tool when the sandbox is available.
- **Glob tool quirk:** `Glob` fails to find files in the `js/` subfolder on this OneDrive path. Use `Read` directly with the full path to verify files exist.
- **Cloudflare Workers configured:**
  - Yahoo proxy: `https://yahoo-proxy.fjcspeel.workers.dev`
  - Anthropic/AI proxy: `https://trading-proxy.fjcspeel.workers.dev`
  - Both are live and working. API key for Anthropic is stored as a Worker secret, never in the browser.
- **User:** Dr Francois Coetzee. Anaesthesiologist. Direct communicator. Wants things that work, not things that sound good. Prefers brief factual updates. The project is personally meaningful — built for him and his husband James.

---

## Files NOT to commit to the repo

- `push-to-github.bat` — already in the folder, can stay but not critical. It was used to create the commit but the push had to be done via GitHub Desktop.
- `HANDOVER.md` — this file. For internal use only, does not need to go to GitHub. Delete or .gitignore before next push if preferred.

---

*Handover written at 11:50 AM SAST, 30 April 2026.*  
*All work verified live. Repo is clean. Site is running. Ready for Pillar 4.*
