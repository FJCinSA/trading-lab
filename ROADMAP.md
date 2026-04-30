# FJC Trading Lab — Roadmap & Build Discipline

**Last updated:** Thursday, 30 April 2026 (Pillar 6 — Famous Crashes shipped)
**Owners:** Francois Coetzee + James Caroto-Coetzee
**Build partner:** Claude (via Cowork mode)

This document is the single source of truth for what the lab is, where it's going, and the discipline rules that govern how we get there.

---

## Vision

A **calm, disciplined, teaching-first** trading learning platform that stands head and shoulders above any other paper-trading tool. Built primarily for two people — a doctor learning markets and his trader husband — but architected so it could become a public commercial tool later if it proves itself.

The core principle, in Francois's own words:

> "What I like about this graph is the emotional effects is taken away."

Every feature must reinforce that principle. The lab strips out market noise — headlines, panic, gamification — and leaves only what teaches.

---

## What makes this different from anything else

We are NOT building another TradingView. We are NOT building another Investopedia simulator. We are NOT building Robinhood (god forbid).

We are building a **teaching tool** with three differentiators no commercial platform has combined:

1. **An AI as situational coach**, not a chatbot. The AI knows what's on the chart and teaches what's relevant in plain English with inline definitions of every technical term.
2. **Replay Mode + Historical Analog Engine** — the only honest way to "predict" markets. Find past situations that resemble today's, show what happened next in each, and let history teach probabilities. No black-box ML. No hallucinated predictions.
3. **Decision journal with reflection architecture** — every decision (manual or autopilot) is logged with reasoning, and the AI surfaces patterns over time. Most platforms have a P&L log; we have a *meaning* log.

---

## The seven pillars (build order)

Each pillar must be **fully shipped to production** (committed to GitHub, deployed to GitHub Pages, tested on real device) before the next is started. **No partial features. No tentacles.**

| # | Pillar | Status | Approx build cost |
|---|---|---|---|
| 1 | **Live Yahoo Finance data foundation** | ✅ **SHIPPED 29 April 2026** | 1.5–2 hours (delivered) |
| 2 | **Replay Mode (Phase 1 MVP)** — pick any historical date, advance day-by-day, decisions on incomplete information | ✅ **SHIPPED 30 April 2026** | Delivered |
| 3 | **Historical Analog Engine** — for any setup, scan history for matches, show outcome distribution and analog dates | ✅ **SHIPPED 30 April 2026** | Delivered |
| 4 | **Decision Journal with weekly AI review** | ✅ **SHIPPED 30 April 2026** | Delivered |
| 5 | **Comparison / overlay mode** — two instruments on one chart, normalised | ✅ **SHIPPED 30 April 2026** | Delivered |
| 6 | **Famous Crashes case study library** — META 2022, COVID 2020, GFC 2008, 1987, dotcom 2000, Aug 2024 yen carry, USDZAR Dec 2015 | ✅ **SHIPPED 30 April 2026** | Delivered |
| 7 | **Curriculum modules** — structured lessons with progress tracking | Blocked by all of the above | 2–3 hours per module |

**Rough total:** 30–40 hours of focused build, spread over 6–10 weekend / off-day sessions.

---

## What's already built (the foundation)

These shipped during the 25–28 April 2026 build sprint and live at `https://fjcinsa.github.io/trading-lab/`:

- ✅ V6 chart engine with toggleable indicators (MA50, MA200, Bollinger, support/resistance)
- ✅ Hover tooltip with date, OHLCV with volume vs avg %, MA50/MA200/RSI colour-coded
- ✅ Crosshair date + price badges on the dashed lines
- ✅ Volume spike highlight (>1.5× avg in gold)
- ✅ Pattern detection: Doji, Hammer, Shooting Star, Morning Star, Evening Star
- ✅ Action detection: Golden Cross, Death Cross, RSI cross above 70 / below 30
- ✅ Action key legend describing every chart marker
- ✅ Timeframe-aware x-axis labels (MM-DD / Mon DD / Mon 'YY)
- ✅ AI Autopilot with rule-based engine, Smart Filter, envelope protection
- ✅ Teaching-voice disengage messages with plain-English explanations
- ✅ Two AI buttons (Analyse, Morning Briefing) backed by private Cloudflare Worker proxy
- ✅ AI prompts written for true beginners — define terms inline, ban jargon, demand analogies
- ✅ AI prompts receive chart context (visible patterns, Bollinger position) so the AI teaches what's actually on the chart
- ✅ Service worker fixed (network-first for HTML — no more cache hostage)
- ✅ Local git workflow (this folder is a clone of the GitHub repo)
- ✅ Desktop shortcut to launch Claude Code directly in this folder
- ✅ PWA installable on phone and tablet (Add to Home Screen)

---

## Anti-guru principles

The retail trading-education space is full of paid "gurus" selling certainty in a domain where certainty cannot exist. Their pattern is: charismatic personality, paywalled courses, curated success screenshots, vague signals, no published track record, no statistical honesty.

**Every line below is a thing the FJC Trading Lab does that those operators do not.**

1. **Free and open source.** Anyone can read every line of code. No paywall. No subscription tier. No "advanced strategies" hidden behind another payment.

2. **No predictions.** The lab refuses to forecast price. Where "prediction" appears as a feature, it is implemented as a Historical Analog Engine showing distributions of past outcomes — *"in 47 similar setups, here is the spread of what followed"* — never *"the price will go to X"*. Honest uncertainty is built into the architecture.

3. **No curated wins.** The lab shows the autopilot's actual performance — wins AND losses, side by side, with the buy-and-hold benchmark. The loud failures are visible. There is no cherry-picking.

4. **No "secret strategies".** The exact rules the autopilot follows are published in the source. MA50, MA200, RSI, volume. That is all. There is no Level 2 mentorship behind a R 50 000 fee that reveals the "real" strategy.

5. **Every technical term is defined inline the first time it appears.** No exclusion-by-jargon. A novice can read any AI output and understand it without buying a glossary.

6. **No urgency, no FOMO, no notifications.** The lab does not ping you about price moves, does not flash red, does not push you to act. It is silent unless you open it. Most platforms (and all gurus) profit from your activity; the lab profits from nothing.

7. **The autopilot is rule-based and inspectable.** When it makes a decision, the decision log shows you exactly why — by name, in plain English. There is no "magic AI signal", no proprietary indicator, no black box. Disagreement with a decision is a debate you can actually have.

8. **Every error message teaches.** When the autopilot disengages with no trades, it explains *why* in plain language and notes that "patience is the indicator most retail traders never use." The lab does not pretend to always have an answer.

9. **The lab admits when there is no signal.** Most days the market does not offer a textbook setup. The autopilot says so explicitly. Nobody who sells courses wants you to learn this — it would end their business.

10. **No charismatic teacher.** The lab is a tool, not a personality. There is no face to follow, no group to join, no community to be locked into. The teaching comes from the architecture, the data, and a patient AI that defines its terms.

11. **Built on disciplined indicators only.** MA50, MA200, RSI, volume, Bollinger Bands. No mystical Fibonacci ratios, no Gann angles, no lunar cycles, no proprietary "signals". Only tools that survive academic scrutiny.

12. **The track record is the source code.** Every change is in git. Every commit is dated. Every claim about what the lab does can be verified by reading the code. There is no opportunity to retroactively edit "predictions" after the fact.

The fraud's product is loud, paywalled, opaque, and dishonest about uncertainty.
This lab is quiet, free, transparent, and statistically honest.
That contrast is the answer.

---

## Discipline rules (non-negotiable)

These exist because ambition + AI builders + ADHD = projects that grow tentacles and never ship.

1. **No new pillar starts until the current pillar is fully shipped.** Shipped = code in `main` branch on GitHub, deployed to Pages, verified live on device.
2. **No "AI predicts the price" features.** Ever. Predictions imply confidence we cannot justify. Honest analog matching only.
3. **No gamification.** No streaks, no XP, no notifications hyping price moves. The lab is a calm space.
4. **No real-time push of price moves.** Refresh on demand only. Surprise pings break the calm.
5. **Every error message must teach.** "Reached end of data" became a paragraph explaining patience as an indicator. Every error path is a teaching opportunity.
6. **Every technical term used in any user-facing message must be defined the first time it appears.**
7. **The lab works without an account, without a subscription, without a network connection** (after first load — the service worker caches the shell).
8. **All API keys live on the server side (Cloudflare Worker secrets).** Never in the browser. Never in source code. Never in a public file.

---

## Communication discipline

Francois has asked for **regular timestamped emails** documenting progress. The pattern from now on:

- Every time a pillar is shipped → email to `fjcspeel@gmail.com` with **exact date and time SAST**, what shipped, what's next.
- Every weekend session ends with a status email even if nothing shipped — *"worked on X, blocked by Y, next session priority is Z"*.
- The roadmap (this file) is updated and committed alongside any change.
- All major decisions (e.g. "we will not add an ML model") are recorded in this file's decision log below.

---

## Decision log

| Date | Decision | Rationale |
|---|---|---|
| 30 Apr 2026 | Pillar 6 (Famous Crashes) shipped | `js/crashes.js` (16th ES module) created. 6 scenarios: GFC 2008 (SPY), dot-com 2000 (QQQ), COVID 2020 (SPY), META 2022 (META), yen carry Aug 2024 (SPY), USDZAR Dec 2015 (SOL). Three new tickers added to config.js: SPY, META, QQQ — these appear as normal tabs and enrich the Historical Analog Engine with 30+ years of S&P 500 data. Yahoo proxy `range=max` replaces `range=2y` — one-line fix in `data.js` (the Worker already allowed `range=max`). Clicking a scenario fetches the full history, positions Replay Mode at the crash onset, and shows a setting-the-scene narrative panel above the chart. Overlay options now built dynamically from TICKERS in `main.js`. Service worker bumped to v6. |
| 30 Apr 2026 | Yahoo range=max is free — no static JSON needed | The Cloudflare Worker already had `max` in ALLOWED_RANGES. The frontend was the only thing capping it at `2y`. Changing one URL parameter in `data.js` gave us 30 years of SPY history (back to 1993), 14 years of META, 25 years of QQQ — enough for every crash scenario except 1987 Black Monday (requires ^GSPC). |
| 30 Apr 2026 | Pillar 5 (Comparison/Overlay) shipped | "Compare vs" dropdown in the indicator toolbar. Overlay line uses its own normalised Y scale (full chart height = overlay min-to-max range). Both tickers rebased to 100 at the first visible candle. Legend shows "TDY +5.2% vs TSLA +18.4%" colour-coded green/red. End-of-line pill label on the overlay. No new module — added `drawOverlay()` to chart.js. No service worker bump required (no new JS file). |
| 30 Apr 2026 | Pillar 4 (Decision Journal) shipped | `js/journal.js` (15th ES module) created. Every trade — manual or autopilot — is logged with the trader's reasoning. AI Review button sends last 14 days of entries to Claude for pattern analysis. Buy/Sell buttons now prompt for reasoning before executing; pressing Cancel aborts the trade. Autopilot's `executeDecision()` logs pilot trades automatically with the plain-English rule rationale. Service worker bumped to v5. |
| 30 Apr 2026 | Decision Journal (Pillar 4) promoted ahead of Comparison/Overlay (now Pillar 5) | Journal is core to the teaching mission — it is where reflection lives. Overlay is a convenience feature. The lab's thesis demands the journal exist before analysis tools multiply. |
| 30 Apr 2026 | Pillar 6 (Famous Crashes) will require bundled historical JSON data | Yahoo Finance's 2-year limit cannot fetch 2008, 2000, or 1987. Static JSON crash datasets must be bundled in the repo before that pillar begins. |
| 30 Apr 2026 | ES module refactor completed — trading-lab.html split into 14 JS modules | trading-lab.html was ~2368 lines with one monolithic `<script>` block. Split into 14 ES modules under `js/`: config, indicators, patterns, synthetic, state, data, chart, edge, portfolio, ai, autopilot, analogs, replay, main. No build step required — ES modules run natively on GitHub Pages (HTTPS). Adding a new ticker now means editing `js/config.js` only; everything else iterates `TICKERS` automatically. Circular dependencies avoided via dependency injection: `initChart(render)` and `initReplay(render, updateYahooStatus)` inject callbacks at boot time. `state.historicalEdge` lives on the shared state object (not a top-level `let`) so ES module live-binding constraints cannot cause stale reads. Service worker bumped to v4 and updated to pre-cache all 14 JS files. |
| 30 Apr 2026 | File modularisation decision deferred but flagged | trading-lab.html is ~2350 lines. A split plan (ES modules or build step) is needed before Pillar 6 to avoid an unmaintainable monolith. |
| 30 Apr 2026 | Pillar 3 (Historical Analog Engine) shipped | Bucket today's setup into trend (above/below MA200), RSI bucket, volume regime. Scan all 4 tickers' history for matches. Compute 30-day forward returns. Display: count, median, win rate, range, top-12 clickable analog list. Verified: 26 matches found for "above MA200 + RSI>60 + normal volume" with median +0.1%, win rate 54% — honest distribution showing the setup is essentially noise. Click any analog row to jump replay there. |
| 30 Apr 2026 | Pillar 2 Phase 1 (Replay Mode MVP) shipped at ~08:20 SAST | Date picker + step day-by-day forward/back + Return to live + REPLAY pill in header + keyboard shortcuts. Chart, indicators, autopilot, AI analysis, and historical edge tables all see only data up to the replay date. Verified: TDY chart correctly truncated to 2025-09-19, indicators recomputed, pattern markers firing on real truncated history. |
| 29 Apr 2026 | Pillar 1 (Yahoo Finance data) shipped at 13:16 SAST | Cloudflare Worker `yahoo-proxy.fjcspeel.workers.dev` proxies `query1.finance.yahoo.com`. Lab integrates with `Refresh prices` button. Header pill flips SYNTHETIC → LIVE on success. Real-data lessons (volume spikes on actual high-volume days, real pattern detection, real RSI levels) now teaching for the first time. |
| 28 Apr 2026 | "Prediction" features will be implemented as Historical Analog Engine, not LLM forecasting or ML models | LLM hallucinations and ML black boxes both contradict the lab's honest-teaching ethos. Historical analog matching is statistically sound and educationally superior. |
| 28 Apr 2026 | Build order locked: Yahoo data → Replay → Analog Engine → Overlay → Journal → Cases → Curriculum | Each pillar depends on the previous. Yahoo data is the substrate everything else needs. Replay before Analog because Analog needs the replay context to teach. |
| 28 Apr 2026 | Two-user scope (Francois + James) — no public commercial features yet | Single-user / two-user simplicity lets us build fast. Commercial reopening only after the platform proves itself. |
| 27 Apr 2026 | All AI calls go through Cloudflare Worker proxy with secret API key | Browser-side API keys are a security failure mode. Worker isolation also lets us add rate limiting, cost caps, observability later without lab changes. |
| 26 Apr 2026 | Service worker is network-first for HTML, cache-first for assets | Cache-first for HTML caused a "ghost stale code" bug that wasted an evening. Network-first eliminates that class of failure. |
| 26 Apr 2026 | Local git workflow replaces drag-and-drop GitHub uploads | Drag-and-drop wasted half a morning during V6 deployment. Git push from a clone is 30 seconds. |

---

## Outstanding to-do (prioritised)

1. **Pillars 1–6 all shipped 29–30 April 2026.** Docs updated and committed — repo is current.
2. **ES module refactor + 16-module architecture** — `js/crashes.js` is now the 16th module.
3. **Next: Pillar 7 — Curriculum modules.** Structured lessons with progress tracking. Blocked until design discussion. First lesson candidate: "How to read a chart from zero" using the SPY crash scenarios as worked examples.
4. **Future crash scenarios to add**: Black Monday 1987 requires ^GSPC (Yahoo has it back to the 1920s). To add: `{ sym:'GSPC', yahoo:'^GSPC' }` in config.js and a new CRASH_SCENARIOS entry with `startDate: '1987-08-01'`.
5. NWU Engineering email for CapnoSafe — separate project, do not let trading-lab consume that bandwidth.

---

## Who this is for

Dr Francois Coetzee — anaesthesiologist learning to read markets calmly and conservatively, primarily as cognitive maintenance and as preparation for a trading partnership with his husband.

James Caroto-Coetzee — trader; the expert reader of the lab; will eventually use it for real analysis.

The lab is built for two people who trust each other, take their work seriously, and value the disciplined version of any skill over the loud version of it.

---

*This file is committed to git alongside the lab itself. Any session that materially changes direction, scope, or shipped state must update this file in the same commit.*
