@echo off
title FJC Trading Lab — Push to GitHub
color 0A
echo.
echo ============================================================
echo  FJC Trading Lab — Commit ^& Push to GitHub
echo ============================================================
echo.

cd /d "%~dp0"
echo Working directory: %CD%
echo.

echo Staging all changes...
git add -A
echo.

echo Committing...
git commit -m "refactor: split monolithic script into 14 ES modules

- trading-lab.html: replace 1966-line <script> block with
  <script type='module' src='./js/main.js'>
- js/config.js     — single source of truth for TICKERS + constants
- js/indicators.js — pure math: sma / bollinger / rsi
- js/patterns.js   — detectPatterns / detectActions
- js/synthetic.js  — deterministic candle generator (mulberry32 RNG)
- js/state.js      — shared mutable state + persistence helpers
- js/data.js       — Yahoo Finance proxy fetch
- js/chart.js      — all Canvas 2D drawing (price / volume / RSI)
- js/edge.js       — historical edge computation + rendering
- js/portfolio.js  — paper portfolio / trades / price alerts
- js/ai.js         — Claude API integration
- js/autopilot.js  — rule-based pilot engine (module-private state)
- js/analogs.js    — historical analog scan + render
- js/replay.js     — replay mode lifecycle
- js/main.js       — orchestrator: render / init / bindControls
- service-worker.js: bump to v4, pre-cache all 14 JS modules
- README.md: full rewrite for modular architecture
- ROADMAP.md: decision log updated

Adding a new ticker now requires editing js/config.js only.
No build step. No bundler. ES modules run natively on GitHub Pages."

echo.
echo Pushing to origin/main...
git push origin main
echo.

echo ============================================================
echo  Done! Check https://fjcinsa.github.io/trading-lab/
echo  (GitHub Pages deploys in about 60 seconds)
echo ============================================================
echo.
pause
