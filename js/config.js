// ============================================================
// FJC Trading Lab — Configuration
// ============================================================
// SINGLE SOURCE OF TRUTH for all instruments and constants.
//
// TO ADD A NEW TICKER: append one object to the TICKERS array.
// Everything else (synthetic data, live fetch, edge tables,
// autopilot, analogs) automatically iterates over this array.
//
// Fields:
//   sym    — internal ID used as state key and display label
//   name   — full company name (shown in tabs and AI prompts)
//   exch   — exchange name (NYSE / JSE / NASDAQ)
//   ccy    — 'USD' or 'ZAR' (drives priceToZar conversion)
//   yahoo  — Yahoo Finance symbol (used by the proxy worker)
//   start  — synthetic data seed price
//   vol    — daily volatility fraction (0.018 = 1.8% typical move)
//   drift  — daily drift fraction (positive = long-term upward bias)
// ============================================================

export const TICKERS = [
  { sym:'TDY',  name:'Teledyne Technologies', exch:'NYSE',   ccy:'USD', yahoo:'TDY',    start:580, vol:0.018, drift: 0.0015 },
  { sym:'TSLA', name:'Tesla',                 exch:'NYSE',   ccy:'USD', yahoo:'TSLA',   start:250, vol:0.038, drift: 0.0000 },
  { sym:'SOL',  name:'Sasol',                 exch:'JSE',    ccy:'ZAR', yahoo:'SOL.JO', start:120, vol:0.030, drift:-0.0005 },
  { sym:'MNST', name:'Monster Beverage',      exch:'NASDAQ', ccy:'USD', yahoo:'MNST',   start:58,  vol:0.020, drift: 0.0008 },
  // --- Crash Case Study tickers (Pillar 6) — full history loaded via range=max ---
  { sym:'SPY',  name:'SPDR S&P 500 ETF',     exch:'NYSE',   ccy:'USD', yahoo:'SPY',    start:450, vol:0.011, drift: 0.0003 },
  { sym:'META', name:'Meta Platforms',        exch:'NASDAQ', ccy:'USD', yahoo:'META',   start:450, vol:0.028, drift: 0.0004 },
  { sym:'QQQ',  name:'Nasdaq 100 ETF',        exch:'NASDAQ', ccy:'USD', yahoo:'QQQ',    start:380, vol:0.016, drift: 0.0004 }
];

// localStorage keys — versioned so a schema change doesn't corrupt old data
export const LS_PORTFOLIO   = 'fjc-trading-portfolio-v1';
export const LS_ALERTS      = 'fjc-trading-alerts-v1';
export const LS_PROXY       = 'fjc-trading-proxy-v1';
export const LS_SR          = 'fjc-trading-sr-v1';
export const LS_PILOT       = 'fjc-trading-pilot-v1';
export const LS_YAHOO_PROXY = 'fjc-trading-yahoo-proxy-v1';
export const LS_FX          = 'fjc-trading-fx-v1';
export const LS_JOURNAL     = 'fjc-trading-journal-v1';
export const LS_CURRICULUM  = 'fjc-trading-curriculum-v1';

// Autopilot envelope protection — disengage when portfolio drawdown exceeds this %
export const ENVELOPE_DRAWDOWN_PCT = 15;

// Historical analog / edge look-forward window (trading days)
export const HIST_FORWARD_DAYS = 30;
