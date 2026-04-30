# FJC Trading Lab

**A calm, free, honest paper-trading and learning tool that strips out market noise and teaches with statistical honesty.**

Live at **[fjcinsa.github.io/trading-lab](https://fjcinsa.github.io/trading-lab/)**

---

## What this is

A web-based trading laboratory designed for one specific person — a 63-year-old anaesthesiologist learning to read markets — and his trader husband. Free, open source, no account, no subscription, no advertising, no upsells.

The design principle, in a single sentence:

> **The lab strips out market noise — headlines, panic, gamification — and leaves only what teaches.**

Built to be the antithesis of paid trading "gurus":
- Rule-based autopilot you can read in the source
- AI explanations that define every technical term inline, in plain English
- Every error message teaches
- Statistical honesty: no predictions, only historical analog distributions
- The track record IS the source code

This is **not financial advice**. It is a learning tool that uses paper trading and synthetic / public market data. Speak to a licensed financial advisor before any real trade.

---

## Features

### Charting
- Candlestick chart with toggleable indicators: MA50, MA200, Bollinger Bands, support/resistance
- Pattern detection: Doji, Hammer, Shooting Star, Morning Star (bullish), Evening Star (bearish)
- Action markers: Golden Cross, Death Cross, RSI threshold crosses
- Hover tooltip with date, OHLCV, volume vs average %, indicator values colour-coded by RSI thresholds
- Crosshair date and price badges on the dashed lines
- Volume spike highlight (>1.5× visible-window average renders in bright gold)
- Timeframe-aware x-axis labels (30D / 90D / 180D / 1Y / 2Y)
- Four tickers tracked simultaneously: **TDY** (Teledyne), **TSLA** (Tesla), **SOL** (Sasol JSE), **MNST** (Monster Beverage)

### Live data (optional)
Set up a private Cloudflare Worker that proxies Yahoo Finance — no API key required (Yahoo's chart endpoint is public). Toggle from synthetic data to real OHLC with a single click.

### AI analysis (optional)
Set up a second private Cloudflare Worker that proxies the Anthropic Messages API. Click "Analyse latest candle" or "Morning briefing" to get a novice-friendly explanation of what's happening on the chart. Every technical term is defined inline.

### Rule-based Autopilot
A transparent, inspectable rule engine that walks day-by-day through history and applies a fixed set of trading rules. The exact rules are visible in the source. Disengage messages teach in plain language ("patience is the indicator most retail traders never use").

Includes optional **Smart Filter** that skips signals with a poor historical edge on the active ticker, and **envelope protection** that auto-disengages if drawdown exceeds 15% from peak.

### Progressive Web App (PWA)
Installable on phone, tablet, or desktop. Works offline after first load. No app store, no platform lock-in.

---

## Why this exists

**Most retail traders fail because of emotional hijacking** — headlines, news cycles, FOMO, fear, gamified interfaces that reward activity. The lab refuses to participate in any of that:

- No real-time push notifications
- No urgency, no streaks, no XP, no leaderboards
- No charismatic teacher to follow
- No paywall, no subscription, no "advanced strategies" tier
- No predictions or guarantees of any kind

The interface is calm. The indicators are disciplined (only MA50, MA200, RSI, volume, Bollinger Bands — no mystical Fibonacci ratios, no Gann angles, no lunar cycles). The AI explains in plain English with inline definitions of every technical term.

**The track record IS the source code.** Every claim about what the lab does can be verified by reading the code in this repo. Every change is dated in git. There is no opportunity to retroactively edit "predictions" after the fact.

For a fuller statement of design principles, see [ROADMAP.md](ROADMAP.md).

---

## How to use

### Just look at it
Open **[fjcinsa.github.io/trading-lab](https://fjcinsa.github.io/trading-lab/)**. The lab loads with synthetic data and is fully usable without any setup.

### Add live market data (optional)
Deploy `yahoo-proxy-worker.js` as a Cloudflare Worker (free tier is plenty), paste its URL into the **Yahoo data URL** field at the top of the lab, click **Refresh prices**.

### Add AI explanations (optional)
Deploy `trading-proxy-worker.js` as a Cloudflare Worker, add your Anthropic API key as a Worker secret named `ANTHROPIC_API_KEY`, paste the Worker URL into the **AI proxy URL** field. Click "Analyse latest candle" or "Morning briefing".

### Install as a PWA
On phone or tablet: open the live URL in Chrome, tap the three-dot menu, choose **Install app** or **Add to Home Screen**.

---

## Architecture

```
fjcinsa.github.io/trading-lab          (static GitHub Pages)
   │
   ├─► trading-lab.html                (the lab — single file, ~1900 lines)
   │   │
   │   ├──► trading-proxy.workers.dev  (your private Cloudflare Worker)
   │   │       └──► api.anthropic.com  (Claude — for AI explanations)
   │   │
   │   └──► yahoo-proxy.workers.dev    (your private Cloudflare Worker)
   │           └──► query1.finance.yahoo.com  (Yahoo Finance — for live OHLC)
   │
   ├─► service-worker.js               (PWA shell, network-first for HTML)
   ├─► manifest.json                   (PWA metadata)
   └─► ROADMAP.md                      (vision, principles, build plan)
```

API keys live exclusively in Cloudflare Worker secrets. They never appear in the browser, in source code, or in any public file.

---

## Roadmap

The project follows a 7-pillar build plan. See [ROADMAP.md](ROADMAP.md) for the full vision, anti-guru principles, discipline rules, and decision log.

| # | Pillar | Status |
|---|---|---|
| 1 | Live Yahoo Finance data foundation | **Shipped** |
| 2 | Replay Mode (pick historical date, step day-by-day) | **Shipped** |
| 3 | Historical Analog Engine (find similar setups, show outcome distributions) | **Shipped** |
| 4 | Comparison / overlay mode | **Next** |
| 5 | Decision Journal with weekly AI review | Planned |
| 6 | Famous Crashes case study library | Planned |
| 7 | Curriculum modules | Planned |

---

## Technical notes

- **Single HTML file**: the entire lab is one self-contained `trading-lab.html`. No build step, no bundler, no framework. Vanilla JavaScript and inline CSS. Editable by anyone with a text editor.
- **No localStorage / sessionStorage abuse**: only used for user preferences (proxy URLs, indicator toggles, paper portfolio). Cleared with one button.
- **Service worker**: network-first for HTML so users always get the latest version after a deploy; cache-first for icons and manifest. Bumping `CACHE_VERSION` in `service-worker.js` invalidates all stale caches.
- **Synthetic data engine**: deterministic, seeded by ticker symbol so each user sees the same fictional history when not using live data.

---

## Disclaimer

This software is provided **as-is**, for **educational purposes only**. It is not a recommendation to buy or sell any security, currency, or other financial instrument. Past performance does not guarantee future results. The synthetic data is fictional. The live data may be delayed, incomplete, or inaccurate. Speak to a licensed financial advisor before making any real trading decision.

The author is a medical doctor, not a financial advisor.

---

## License

MIT. Use it, fork it, learn from it, build on it. Attribution appreciated but not required.

---

## Author

Built by Dr Francois Coetzee with the assistance of Claude (Anthropic). Maintained alongside other personal projects at [github.com/FJCinSA](https://github.com/FJCinSA).

For questions or to report a bug, open a GitHub issue.
