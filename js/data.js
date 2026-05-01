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

import { TICKERS, LS_PROXY, LS_YAHOO_PROXY, LS_FX } from './config.js';
import { state }                                      from './state.js';

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
 * Fetch the full available history of daily OHLCV candles for one ticker
 * from the user's Yahoo Finance Cloudflare Worker proxy.
 *
 * Returns an array of { d, o, h, l, c, v } objects — same shape as
 * the synthetic data engine, so the rest of the app is data-source agnostic.
 *
 * @param {string} ticker - e.g. 'TDY', 'TSLA'
 * @param {object} [opts]
 * @param {boolean} [opts.usePeriods] - When true, uses period1/period2 Unix timestamps
 *   instead of range=max.  Yahoo Finance v8 ignores interval=1d for range=max on very
 *   long-dated tickers (returning monthly data instead), but DOES honour it when
 *   period1/period2 are supplied — essential for crash-study scenarios like QQQ 1999.
 * @param {string|null} [opts.fetchStart] - ISO date string (e.g. '2005-01-01') for period1.
 *   If null/omitted, defaults to Unix epoch 0 (fetch from ticker inception).
 * @param {string|null} [opts.fetchEnd]   - ISO date string (e.g. '2011-12-31') for period2.
 *   If null/omitted, defaults to now. Bounding the window prevents proxy timeouts when
 *   fetching old tickers with 20+ years of history.
 * @returns {Promise<{d:string,o:number,h:number,l:number,c:number,v:number}[]>}
 */
export async function fetchYahoo(ticker, opts = {}) {
  const t = TICKERS.find(x => x.sym === ticker);
  if (!t) throw new Error('Unknown ticker: ' + ticker);
  if (!state.yahooProxy) throw new Error('Yahoo proxy URL not configured');
  if (!t.yahoo) throw new Error('No Yahoo symbol mapping for ' + ticker);

  const base = state.yahooProxy.replace(/\/$/, '');
  let url;
  if (opts.usePeriods) {
    // Use Unix-timestamp range so Yahoo returns genuine daily candles regardless
    // of how far back the ticker goes (bypasses Yahoo's auto-coarsening for range=max).
    // fetchStart/fetchEnd bound the window to avoid downloading decades of unused data.
    const period1 = opts.fetchStart
      ? String(Math.floor(new Date(opts.fetchStart).getTime() / 1000))
      : '0';
    const period2 = opts.fetchEnd
      ? String(Math.floor(new Date(opts.fetchEnd).getTime() / 1000))
      : String(Math.floor(Date.now() / 1000));
    url = base + '/?symbol=' + encodeURIComponent(t.yahoo) +
          '&period1=' + period1 + '&period2=' + period2 + '&interval=1d';
  } else {
    url = base + '/?symbol=' + encodeURIComponent(t.yahoo) + '&range=max&interval=1d';
  }
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
    state.dataMode   = 'live';
    state.liveDataAt = new Date();

    // Auto-update the USD/ZAR rate from the live USDZAR fetch so portfolio
    // ZAR valuations always reflect the real exchange rate without manual input.
    // USDZAR=X is in the TICKERS list and just fetched — its closing price
    // IS the current USD/ZAR rate (e.g. 18.72). Sanity-checked 5–60 to guard
    // against stale/bad data being written as the conversion rate.
    const zarCandles = state.data['USDZAR'];
    if (zarCandles && zarCandles.length > 0) {
      const liveRate = zarCandles[zarCandles.length - 1].c;
      if (liveRate > 5 && liveRate < 60) {
        state.fxUsdZar = liveRate;
        localStorage.setItem(LS_FX, String(liveRate));
      }
    }

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
