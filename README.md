# FJC Trading Lab

**A calm, free, open-source paper-trading and learning platform built on statistical honesty — not promises.**

[![Live demo](https://img.shields.io/badge/Live%20demo-fjcinsa.github.io%2Ftrading--lab-brightgreen?style=flat-square)](https://fjcinsa.github.io/trading-lab/)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue?style=flat-square)](LICENSE)
[![GitHub Pages](https://img.shields.io/badge/Deployed%20via-GitHub%20Pages-orange?style=flat-square)](https://fjcinsa.github.io/trading-lab/)
[![No build step](https://img.shields.io/badge/Build%20step-none-lightgrey?style=flat-square)]()
[![Vanilla JS](https://img.shields.io/badge/Stack-Vanilla%20JS%20%2B%20Canvas-yellow?style=flat-square)]()

---

> *"What I like about this graph is the emotional effects are taken away."*
> — Dr Francois Coetzee, the person this was built for

---

## What this is

A web-based trading laboratory designed for two people: a 63-year-old anaesthesiologist learning to read markets for the first time, and his trader husband. Free, open-source, no account, no subscription, no advertising, no upsells, no paywall of any kind.

The lab does one thing that no commercial platform does: **it strips out the noise and leaves only what teaches.**

- Rule-based autopilot with a transparent decision log you can read line by line
- AI explanations that define every technical term inline, in plain English, the first time it appears
- Historical Analog Engine — the only honest way to "predict" markets: find past setups that resemble today, show the full distribution of what followed
- Replay Mode — pretend any historical date is "today" and live through the chart one day at a time
- Every error message teaches something

This is **not financial advice**. Paper trading only. Speak to a licensed financial advisor before any real trade.

---

## Live at

**[https://fjcinsa.github.io/trading-lab/](https://fjcinsa.github.io/trading-lab/)**

No install. No login. Opens in your browser. Works offline after first load (service worker cached shell).

---

## Features

### 📈 Chart engine

| Feature | Detail |
|---|---|
| Candlestick chart | OHLCV with full colour coding |
| Indicators | MA50 (gold), MA200 (blue), Bollinger Bands (purple), toggleable |
| Support / resistance | Click the chart with S/R mode on to place a level; click ✕ to clear |
| Pattern detection | Doji, Hammer, Shooting Star, Morning Star, Evening Star |
| Action markers | Golden Cross 🟢, Death Cross ⚠️, RSI > 70 🔴, RSI < 30 💚 |
| Hover crosshair | Date badge + price badge on dashed lines |
| OHLCV tooltip | Volume vs visible-window average %, MA50/MA200/RSI colour-coded |
| Volume spike | Bars > 1.5× average rendered in bright gold |
| X-axis labels | Timeframe-aware: `MM-DD` / `Mon DD` / `Mon 'YY` |
| Timeframes | 30D / 90D / 180D / 1Y / 2Y |

### 🌐 Live market data (optional)

Deploy the included `yahoo-proxy-worker.js` as a Cloudflare Worker (free tier). Paste its URL into the **Yahoo data URL** field and click **Refresh prices**. No API key required — Yahoo's public chart endpoint is used. The header pill flips from ⚠ SYNTHETIC to LIVE DATA.

### 🤖 AI analysis (optional)

Deploy `trading-proxy-worker.js` as a Cloudflare Worker with your Anthropic API key stored as a Worker secret (`ANTHROPIC_API_KEY`). Paste the URL into the **AI proxy URL** field. Two modes:

- **Analyse latest candle** — four plain-English bullets (trend, momentum, volume/patterns, what to watch tomorrow). Technical terms defined inline.
- **Morning briefing** — a single page covering all four tickers, warm teaching tone, no jargon.

API keys live exclusively in Cloudflare Worker secrets. **They never appear in the browser, in source code, or in any public file.**

### 🔁 Replay Mode (Pillar 2)

Pick any historical date from the date picker and the lab pretends that date is "today". The chart, all indicators, the autopilot, the AI analysis, the historical edge tables, and the analog engine all see only data up to the chosen date — exactly as someone living through that day would.

- Step forward or back one trading day at a time
- ← / → keyboard shortcuts while in replay
- Every subsystem is automatically isolated — no data from the future leaks
- Returns to live data with a single button click

### 🔍 Historical Analog Engine (Pillar 3)

For the current setup (or any replay date), scan all historical data across all four tickers for days where the same setup applied. "Setup" is defined by three categorical buckets:

| Bucket | Categories |
|---|---|
| Trend | Above MA200 (uptrend) / Below MA200 (downtrend) |
| RSI | Low < 40 / Mid 40–60 / High > 60 |
| Volume | Normal / Spike (> 1.5× 20-day average) |

For every match, compute the 30-day forward return. Surface: count, median return, win rate, worst/best case, and a clickable list of top analog dates. Click any date to jump Replay Mode there instantly.

**No black-box ML. No hallucinations. Just statistical lookup of what tended to happen in similar situations, with the full distribution shown.**

### 🧭 Rule-Based Autopilot

A transparent, inspectable trade engine that walks day-by-day through the visible window and applies a fixed set of rules:

| Signal | Rule | Action |
|---|---|---|
| ENTER | Golden Cross (MA50 > MA200) + RSI < 65 | Buy 25% of available cash |
| ADD | RSI bounces from oversold (< 30) while price > MA200 | Buy 15% of available cash |
| TRIM | RSI crosses above 75 | Sell half position |
| EXIT | Death Cross OR price > 8% below MA200 | Close full position |

Every decision is logged with the exact reason in plain English. The log also annotates each decision with its historical edge statistics (fires, win rate, avg 30d return) so the user learns as they watch.

**Smart Filter** (optional): skips signals with a historical win rate below 50% for that ticker.  
**Envelope protection**: auto-disengages if drawdown exceeds 15% from peak.

### 📊 Historical Edge Tables

Automatically computed for every ticker: for each of the four signal types, how many times it has fired historically, what the win rate was, and the average/best/worst 30-day forward return. Updates in real time during Replay Mode so you always see the edge for the data you can see.

### 📱 Progressive Web App (PWA)

Installable on iPhone, Android, or desktop. Works fully offline after first load. Service worker pre-caches all files at install time.

---

## Architecture

```
fjcinsa.github.io/trading-lab       (static GitHub Pages — zero server cost)
   │
   ├─► trading-lab.html             (HTML shell + CSS — no inline JS)
   │
   ├─► js/                          (14 ES modules, no build step)
   │   ├── config.js                ← single source of truth for tickers + constants
   │   ├── indicators.js            ← pure math: sma / bollinger / rsi
   │   ├── patterns.js              ← detectPatterns / detectActions
   │   ├── synthetic.js             ← deterministic candle generator (mulberry32 RNG)
   │   ├── state.js                 ← shared mutable state object + persistence helpers
   │   ├── data.js                  ← Yahoo Finance proxy fetch
   │   ├── chart.js                 ← all Canvas 2D drawing (price / volume / RSI)
   │   ├── edge.js                  ← historical edge computation + rendering
   │   ├── portfolio.js             ← paper portfolio / trades / price alerts
   │   ├── ai.js                    ← Claude API integration (analyse + briefing)
   │   ├── autopilot.js             ← rule-based pilot engine
   │   ├── analogs.js               ← historical analog scan + render
   │   ├── replay.js                ← replay mode lifecycle
   │   └── main.js                  ← orchestrator: render(), init(), bindControls()
   │
   ├─► service-worker.js            (PWA shell, network-first for HTML, v4)
   ├─► manifest.json                (PWA metadata)
   │
   ├─► trading-proxy-worker.js      (deploy to Cloudflare — Anthropic API proxy)
   ├─► yahoo-proxy-worker.js        (deploy to Cloudflare — Yahoo Finance proxy)
   │
   └─► ROADMAP.md                   (vision, principles, build plan, decision log)
```

```
trading-lab.html
      │
      └── <script type="module" src="./js/main.js">
                │
                ├── imports config, state, indicators, synthetic
                ├── imports edge, chart, data, portfolio, ai
                ├── imports autopilot, analogs, replay
                │
                ├── render()          — redraws all three canvases + signal chips
                ├── renderSignals()   — the chip row below the chart
                ├── buildTabs()       — ticker tab bar
                ├── bindControls()    — wires every button and input
                ├── jumpToAnalog()    — enters Replay at an analog date
                ├── init()            — seeds data, builds UI, starts clocks
                └── initChart(render) + initReplay(render, updateYahooStatus)
                    (dependency injection — avoids circular imports)
```

**No circular dependencies. No build step. No bundler. No framework.** ES modules run natively on GitHub Pages (HTTPS).

---

## Adding a new ticker

Open `js/config.js`. Append one object to the `TICKERS` array:

```js
{ sym: 'NVDA', name: 'NVIDIA', exch: 'NASDAQ', ccy: 'USD', yahoo: 'NVDA', start: 900, vol: 0.030, drift: 0.002 }
```

That's it. Every subsystem — synthetic data, live fetch, chart, indicators, autopilot, historical edge, analog engine, AI prompts, portfolio, tabs — iterates over `TICKERS` automatically. Nothing else needs to change.

---

## Cloudflare Worker setup

### Yahoo Finance proxy

1. Create a new Cloudflare Worker
2. Copy the contents of `yahoo-proxy-worker.js` into the Worker editor
3. Deploy
4. Paste the Worker URL into the **Yahoo data URL** field in the lab

### Anthropic (Claude) proxy

1. Create a new Cloudflare Worker
2. Copy the contents of `trading-proxy-worker.js` into the Worker editor
3. Add a secret: `ANTHROPIC_API_KEY` = your Anthropic API key
4. Deploy
5. Paste the Worker URL into the **AI proxy URL** field in the lab

---

## Running locally

```bash
git clone https://github.com/FJCinSA/trading-lab.git
cd trading-lab
```

Then serve with any static HTTP server (ES modules require HTTP, not `file://`):

```bash
# Python 3
python -m http.server 8080

# Node.js
npx serve .

# VS Code
# Install "Live Server" extension, right-click trading-lab.html → Open with Live Server
```

Open `http://localhost:8080/trading-lab.html`.

---

## Technical notes

### ES module architecture (v4)

The entire JavaScript codebase was refactored from a single monolithic `<script>` block (~1,966 lines) into 14 ES modules in April 2026. Key design decisions:

- **`state.historicalEdge` lives on the shared state object** — not a top-level `let`. ES module live bindings cannot safely propagate a *reassigned* binding across module boundaries, but property mutations on a shared object work correctly across all importers.
- **Dependency injection for callbacks** — `initChart(render)` and `initReplay(render, updateYahooStatus)` inject the main `render()` function into modules that need to trigger redraws. This avoids circular imports (chart.js and replay.js would otherwise need to import from main.js).
- **Module-private autopilot state** — `autopilotState` is a `const` inside `autopilot.js`, never exported. External callers use named helpers (`isAutopilotEngaged()`, `resetAutopilotState()`).
- **`renderAnalogs(onJump)` callback pattern** — the analog engine accepts a jump callback rather than importing `jumpToAnalog` from main.js directly.

### Service worker

Network-first for HTML (so users always get the latest code after a deploy), cache-first for JS modules, icons, and manifest. All 14 JS module files are pre-cached in the app shell. Bump `CACHE_VERSION` in `service-worker.js` to invalidate all stale caches on the next visit.

### Synthetic data engine

Deterministic Mulberry32 PRNG seeded by ticker symbol. Every user sees the same fictional history when not using live data, making it easy to discuss specific setups reproducibly.

### localStorage usage

Used only for: proxy URLs, indicator toggle states, paper portfolio, price alerts, support/resistance lines, autopilot log. Never for tracking or analytics. Cleared with the reset buttons in the UI.

---

## Roadmap

The project follows a 7-pillar build plan. See [ROADMAP.md](ROADMAP.md) for the full vision, anti-guru principles, discipline rules, and decision log.

| # | Pillar | Status |
|---|---|---|
| 1 | Live Yahoo Finance data foundation | ✅ **Shipped 29 Apr 2026** |
| 2 | Replay Mode — pick any historical date, step day-by-day | ✅ **Shipped 30 Apr 2026** |
| 3 | Historical Analog Engine — find similar setups, show outcome distributions | ✅ **Shipped 30 Apr 2026** |
| — | ES module refactor — 14-module architecture, plug-and-play tickers | ✅ **Shipped 30 Apr 2026** |
| 4 | Decision Journal with weekly AI review | 🔜 Next |
| 5 | Comparison / overlay mode — two instruments normalised on one chart | Planned |
| 6 | Famous Crashes case study library — 2008, 2000, 1987, COVID, etc. | Planned |
| 7 | Curriculum modules — structured lessons with progress tracking | Planned |

---

## Anti-guru principles

The retail trading-education space is full of paid "gurus" selling certainty in a domain where certainty cannot exist. This lab is the deliberate opposite:

1. **Free and open source.** Read every line. No paywall. No subscription.
2. **No predictions.** Where "prediction" appears as a feature, it is implemented as a historical analog engine showing distributions of past outcomes — *"in 47 similar setups, here is what followed"* — never *"the price will go to X"*.
3. **No curated wins.** The autopilot's wins AND losses are shown side-by-side with the buy-and-hold benchmark.
4. **No secret strategies.** The exact rules are in the source code.
5. **Every technical term defined inline.** No exclusion by jargon.
6. **No urgency, no FOMO, no notifications.** The lab is silent unless you open it.
7. **The autopilot is rule-based and inspectable.** Every decision is logged with the plain-English reason.
8. **Every error message teaches.** "No trades found" becomes a paragraph explaining that patience is the indicator most retail traders never use.
9. **The lab admits when there is no signal.** Most days the market does not offer a textbook setup. The autopilot says so explicitly.
10. **The track record IS the source code.** Every change is in git. Every commit is dated.

---

## Disclaimer

This software is provided **as-is**, for **educational purposes only**. It is not a recommendation to buy or sell any security, currency, or other financial instrument. Past performance of any pattern, signal, or autopilot rule does not guarantee future results. The synthetic data is entirely fictional. The live data (where configured) is sourced from a public Yahoo Finance endpoint and may be delayed, incomplete, or inaccurate.

**The author is a medical doctor, not a financial advisor.** Speak to a licensed financial advisor before making any real trading decision.

---

## License

**MIT.** Use it, fork it, learn from it, build on it. Attribution appreciated but not required.

---

## Author

Built by **Dr Francois Coetzee** with the assistance of Claude (Anthropic).

GitHub: [github.com/FJCinSA](https://github.com/FJCinSA)  
Maintained alongside CapnoSafe (open-source capnography for resource-limited settings) and other personal projects.

Bugs and suggestions welcome — open a GitHub issue.

---

*"The fraud's product is loud, paywalled, opaque, and dishonest about uncertainty.*
*This lab is quiet, free, transparent, and statistically honest.*
*That contrast is the answer."*
