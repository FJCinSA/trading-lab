// ============================================================
// FJC Trading Lab — Shared Application State
// ============================================================
// The single state object that all modules read from and write to.
// It is a plain mutable object — ES module live bindings mean any
// module that imports { state } always sees the current property values.
//
// historicalEdge lives here (not a top-level let) because ES modules
// cannot safely share a reassigned binding across module boundaries.
// Callers recompute it with:
//   state.historicalEdge = computeHistoricalEdge();
// ============================================================

import { TICKERS, LS_PORTFOLIO, LS_ALERTS, LS_PROXY, LS_SR,
         LS_PILOT, LS_YAHOO_PROXY, LS_FX } from './config.js';

// ------------------------------------------------------------------
// Default factory functions (also called by autopilot & portfolio reset)
// ------------------------------------------------------------------

export function defaultPortfolio() {
  return { cash: 100000, positions: {} };
}

export function defaultPilot() {
  return { cash: 100000, positions: {}, log: [], lastTradeDay: {} };
}

// ------------------------------------------------------------------
// localStorage loaders (called once during state initialisation below)
// ------------------------------------------------------------------

function loadPortfolio() {
  try { return JSON.parse(localStorage.getItem(LS_PORTFOLIO)) || defaultPortfolio(); }
  catch (e) { return defaultPortfolio(); }
}

function loadAlerts() {
  try { return JSON.parse(localStorage.getItem(LS_ALERTS)) || []; }
  catch (e) { return []; }
}

function loadSR() {
  try { return JSON.parse(localStorage.getItem(LS_SR)) || {}; }
  catch (e) { return {}; }
}

function loadPilot() {
  try { return JSON.parse(localStorage.getItem(LS_PILOT)) || defaultPilot(); }
  catch (e) { return defaultPilot(); }
}

// ------------------------------------------------------------------
// Shared application state
// ------------------------------------------------------------------

export const state = {
  active:    'TDY',
  timeframe: 30,
  indicators: { ma50: true, ma200: true, bb: false, patterns: true, actions: true, sr: false },

  data:      {},            // keyed by ticker sym; populated by genCandles or fetchYahoo
  sr:        loadSR(),      // support/resistance lines: { TDY: [price, ...], ... }

  portfolio: loadPortfolio(),
  alerts:    loadAlerts(),
  pilot:     loadPilot(),

  proxy:      localStorage.getItem(LS_PROXY)       || '',
  yahooProxy: localStorage.getItem(LS_YAHOO_PROXY) || '',
  fxUsdZar:   parseFloat(localStorage.getItem(LS_FX)) || 18.50,

  dataMode:   'synthetic',  // 'synthetic' | 'live'
  liveDataAt: null,         // Date of most recent successful Yahoo fetch

  // Replay Mode (Pillar 2) — when active, state.data is truncated per-ticker
  replay: { active: false, idx: {} },

  // Historical Edge — updated by: state.historicalEdge = computeHistoricalEdge()
  // Lives on state so every module reads the same recomputed value after replay/init
  historicalEdge: {},

  // Overlay comparison (Pillar 5) — null = off, or a ticker symbol e.g. 'TSLA'
  // Not persisted — view preference only, resets on reload
  overlay: { sym: null },

  // Active crash case study (Pillar 6) — set by jumpToCrash(), cleared on panel close
  // Used by chart.js to draw the crash zone overlay shading
  crashStudy: null,

  // Pan offset — how many candles back from the most recent to anchor the right edge.
  // 0 = live (right edge = latest candle). Positive = panned back in time.
  // Reset to 0 on ticker switch, replay step, and exit-replay.
  viewOffset: 0
};

// ------------------------------------------------------------------
// Persistence helpers (write state back to localStorage)
// ------------------------------------------------------------------

export function savePortfolio() {
  localStorage.setItem(LS_PORTFOLIO, JSON.stringify(state.portfolio));
}

export function saveAlerts() {
  localStorage.setItem(LS_ALERTS, JSON.stringify(state.alerts));
}

export function saveSR() {
  localStorage.setItem(LS_SR, JSON.stringify(state.sr));
}

export function savePilot() {
  localStorage.setItem(LS_PILOT, JSON.stringify(state.pilot));
}

// ------------------------------------------------------------------
// Currency / conversion helpers
// ------------------------------------------------------------------

// Build a sym→ccy lookup once at module load time from config.js TICKERS
const _ccyMap = {};
for (const t of TICKERS) _ccyMap[t.sym] = t.ccy;

/** Return the currency code ('USD' or 'ZAR') for a ticker symbol. */
export function tickerCcy(sym) {
  return _ccyMap[sym] || 'USD';
}

/** Convert a native-currency price to ZAR for portfolio valuation. */
export function priceToZar(sym, price) {
  return _ccyMap[sym] === 'USD' ? price * state.fxUsdZar : price;
}

/** Absolute calendar-day difference between two 'YYYY-MM-DD' strings. */
export function dayDiff(d1, d2) {
  return Math.abs((new Date(d1) - new Date(d2)) / (1000 * 60 * 60 * 24));
}
