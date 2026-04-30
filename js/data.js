// ============================================================
// FJC Trading Lab — Live Data (Yahoo Finance proxy)
// ============================================================
// All network calls to the user's Cloudflare Worker proxy.
// The proxy itself calls Yahoo Finance — no API key required
// on the browser side; keys stay in the Worker secrets.
//
// refreshAllFromYahoo(onSuccess) accepts an optional callback so
// the caller (main.js) can trigger render() + edge recompute after
// data loads, without data.js needing to import main.js.
// ============================================================

import { TICKERS, LS_PROXY, LS_YAHOO_PROXY } from './config.js';
import { state }                               from './state.js';

// ------------------------------------------------------------------
// Status indicator helpers (update the DOM labels/pills)
// ------------------------------------------------------------------

export function updateProxyStatus() {
  const s = document.getElementById('proxy-status');
  if (!s) return;
  s.textContent  = state.proxy ? 'configured' : 'not configured';
  s.style.color  = state.proxy ? 'var(--green)' : 'var(--muted)';
}

export function updateYahooStatus() {
  const btn    = document.getElementById('refresh-yahoo');
  const status = document.getElementById('data-status');
  const pill   = document.getElementById('data-mode');
  if (!btn || !status) return;

  if (state.yahooProxy) {
    btn.disabled = false;
    if (state.dataMode === 'live' && state.liveDataAt) {
      status.style.color = 'var(--green)';
      status.textContent = 'live (refreshed ' + state.liveDataAt.toLocaleTimeString() + ')';
      if (pill) { pill.textContent = 'LIVE DATA'; pill.style.color = 'var(--green)'; }
    } else {
      status.style.color = 'var(--muted)';
      status.textContent = 'synthetic data — click Refresh prices for live';
      if (pill) { pill.textContent = '⚠ SYNTHETIC'; pill.style.color = 'var(--gold)'; }
    }
  } else {
    btn.disabled = true;
    status.style.color = 'var(--muted)';
    status.textContent = 'synthetic data (set Yahoo URL to enable live)';
    if (pill) { pill.textContent = 'SYNTHETIC DATA'; pill.style.color = 'var(--muted)'; }
  }
}

// ------------------------------------------------------------------
// Single-ticker fetch
// ------------------------------------------------------------------

/**
 * Fetch 2 years of daily OHLCV candles for one ticker from the user's
 * Yahoo Finance Cloudflare Worker proxy.
 *
 * Returns an array of { d, o, h, l, c, v } objects — same shape as
 * the synthetic data engine, so the rest of the app is data-source agnostic.
 *
 * @param {string} ticker - e.g. 'TDY', 'TSLA'
 * @returns {Promise<{d:string,o:number,h:number,l:number,c:number,v:number}[]>}
 */
export async function fetchYahoo(ticker) {
  const t = TICKERS.find(x => x.sym === ticker);
  if (!t) throw new Error('Unknown ticker: ' + ticker);
  if (!state.yahooProxy) throw new Error('Yahoo proxy URL not configured');
  if (!t.yahoo) throw new Error('No Yahoo symbol mapping for ' + ticker);

  const base = state.yahooProxy.replace(/\/$/, '');
  const url  = base + '/?symbol=' + encodeURIComponent(t.yahoo) + '&range=2y&interval=1d';
  const resp = await fetch(url);
  if (!resp.ok) {
    const text = await resp.text();
    throw new Error('Yahoo proxy ' + resp.status + ': ' + text.slice(0, 200));
  }
  const data = await resp.json();
  if (!data || !Array.isArray(data.candles) || data.candles.length === 0) {
    throw new Error('Yahoo proxy returned no candles for ' + ticker);
  }
  return data.candles;
}

// ------------------------------------------------------------------
// All-ticker refresh
// ------------------------------------------------------------------

/**
 * Fetch all tickers in parallel from Yahoo Finance.
 * On success: updates state.data, sets state.dataMode = 'live', calls onSuccess().
 * On failure: surfaces error in the status bar, leaves state.data untouched.
 *
 * @param {function} [onSuccess] - called after state.data is updated (e.g. render)
 */
export async function refreshAllFromYahoo(onSuccess) {
  const status = document.getElementById('data-status');
  const btn    = document.getElementById('refresh-yahoo');
  if (!state.yahooProxy) {
    if (status) { status.style.color = 'var(--red)'; status.textContent = 'Yahoo proxy URL not configured'; }
    return;
  }
  if (btn) btn.disabled = true;
  if (status) { status.style.color = 'var(--cream)'; status.textContent = 'fetching live data for all tickers…'; }

  try {
    const results = await Promise.all(TICKERS.map(t => fetchYahoo(t.sym)));
    TICKERS.forEach((t, i) => { state.data[t.sym] = results[i]; });
    state.dataMode  = 'live';
    state.liveDataAt = new Date();
    updateYahooStatus();
    if (onSuccess) onSuccess();
  } catch (e) {
    if (status) {
      status.style.color = 'var(--red)';
      status.textContent = 'fetch failed: ' + (e && e.message || e) + ' — keeping previous data';
    }
  } finally {
    if (btn) btn.disabled = false;
  }
}
