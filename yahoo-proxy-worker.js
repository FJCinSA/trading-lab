// =====================================================================
// FJC Trading Lab - Yahoo Finance proxy (Cloudflare Worker)
// =====================================================================
// Purpose: provide real OHLC candle data for the lab without putting
// scraping logic or API calls in the browser. The lab calls this Worker;
// the Worker calls Yahoo's free chart endpoint and returns clean JSON.
//
// No API key needed (Yahoo's chart endpoint is public, used by yfinance
// and many other tools). CORS is locked to https://fjcinsa.github.io.
//
// USAGE FROM THE LAB:
//   GET https://yahoo-proxy.fjcspeel.workers.dev/?symbol=TDY&range=2y&interval=1d
//
// RESPONSE FORMAT:
//   {
//     "symbol":   "TDY",
//     "currency": "USD",
//     "exchange": "NYQ",
//     "candles":  [
//       { "d": "2024-04-29", "o": 421.10, "h": 425.30, "l": 419.80, "c": 423.55, "v": 612000 },
//       ...
//     ]
//   }
//
// ALLOWED RANGES:    1mo, 3mo, 6mo, 1y, 2y, 5y, 10y, max
// ALLOWED INTERVALS: 1d, 5d, 1wk, 1mo
// =====================================================================

const DEFAULT_ALLOWED_ORIGIN = 'https://fjcinsa.github.io';
const ALLOWED_RANGES    = new Set(['5d', '1mo', '3mo', '6mo', '1y', '2y', '5y', '10y', 'max']);
const ALLOWED_INTERVALS = new Set(['1d', '5d', '1wk', '1mo']);
const SYMBOL_RE = /^[A-Z0-9.\-=^]{1,15}$/i;  // e.g. TDY, SOL.JO, USDZAR=X, ^VIX

export default {
  async fetch(request, env) {
    const allowedOrigin = (env && env.ALLOWED_ORIGIN) || DEFAULT_ALLOWED_ORIGIN;

    const cors = {
      'Access-Control-Allow-Origin': allowedOrigin,
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Access-Control-Max-Age': '86400',
      'Vary': 'Origin'
    };

    // CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: cors });
    }

    if (request.method !== 'GET') {
      return new Response('Method not allowed', { status: 405, headers: cors });
    }

    // Parse query params
    const url      = new URL(request.url);
    const symbol   = (url.searchParams.get('symbol') || '').trim();
    const range    = (url.searchParams.get('range') || '2y').trim();
    const interval = (url.searchParams.get('interval') || '1d').trim();

    // Optional period1/period2 Unix timestamp params — bypass range= and force
    // Yahoo to return daily candles for a specific historical window.  When present
    // they take precedence over the range= param (range validation is skipped).
    const period1Raw = url.searchParams.get('period1');
    const period2Raw = url.searchParams.get('period2');
    const usePeriods = period1Raw !== null;

    if (!symbol) {
      return jsonError('Query parameter "symbol" is required.', 400, cors);
    }
    if (!SYMBOL_RE.test(symbol)) {
      return jsonError('Symbol contains illegal characters.', 400, cors);
    }
    if (!usePeriods && !ALLOWED_RANGES.has(range)) {
      return jsonError('range must be one of: ' + [...ALLOWED_RANGES].join(', '), 400, cors);
    }
    if (!ALLOWED_INTERVALS.has(interval)) {
      return jsonError('interval must be one of: ' + [...ALLOWED_INTERVALS].join(', '), 400, cors);
    }

    let yahooUrl;
    if (usePeriods) {
      const p1 = period1Raw.trim();
      const p2 = (period2Raw || String(Math.floor(Date.now() / 1000))).trim();
      if (!/^\d+$/.test(p1) || !/^\d+$/.test(p2)) {
        return jsonError('period1 and period2 must be Unix timestamps (integers).', 400, cors);
      }
      // period1/period2 always use interval=1d so Yahoo returns genuine daily data
      yahooUrl = 'https://query1.finance.yahoo.com/v8/finance/chart/' +
                 encodeURIComponent(symbol) +
                 '?period1=' + encodeURIComponent(p1) +
                 '&period2=' + encodeURIComponent(p2) +
                 '&interval=1d';
    } else {
      yahooUrl = 'https://query1.finance.yahoo.com/v8/finance/chart/' +
                 encodeURIComponent(symbol) +
                 '?range=' + encodeURIComponent(range) +
                 '&interval=' + encodeURIComponent(interval);
    }

    let upstream;
    try {
      upstream = await fetch(yahooUrl, {
        headers: {
          // A real-looking UA helps avoid Yahoo's bot blocks.
          'User-Agent': 'Mozilla/5.0 (compatible; FJC-Trading-Lab/1.0)',
          'Accept': 'application/json'
        },
        cf: {
          // Cache successful responses on Cloudflare's edge for 5 minutes.
          // Daily candles do not need to be hit fresh every request.
          cacheTtl: 300,
          cacheEverything: true
        }
      });
    } catch (e) {
      return jsonError('Failed to reach Yahoo: ' + (e && e.message || e), 502, cors);
    }

    if (!upstream.ok) {
      const text = await upstream.text();
      return jsonError(
        'Yahoo upstream error ' + upstream.status,
        upstream.status === 404 ? 404 : 502,
        cors,
        { upstreamBody: text.slice(0, 400) }
      );
    }

    let data;
    try {
      data = await upstream.json();
    } catch (e) {
      return jsonError('Yahoo response was not valid JSON.', 502, cors);
    }

    const result = data && data.chart && data.chart.result && data.chart.result[0];
    if (!result) {
      const errMsg = data && data.chart && data.chart.error && data.chart.error.description;
      return jsonError('No data returned for ' + symbol + (errMsg ? ' — ' + errMsg : ''), 404, cors);
    }

    const meta = result.meta || {};
    const ts   = result.timestamp || [];
    const q    = (result.indicators && result.indicators.quote && result.indicators.quote[0]) || {};

    const candles = [];
    for (let i = 0; i < ts.length; i++) {
      // Yahoo sometimes returns null entries on holidays / partial data.
      // Skip rows without a usable close price.
      if (q.close == null || q.close[i] == null) continue;
      const d = new Date(ts[i] * 1000).toISOString().slice(0, 10);
      candles.push({
        d: d,
        o: round2(q.open  != null ? q.open[i]  : q.close[i]),
        h: round2(q.high  != null ? q.high[i]  : q.close[i]),
        l: round2(q.low   != null ? q.low[i]   : q.close[i]),
        c: round2(q.close[i]),
        v: q.volume != null && q.volume[i] != null ? q.volume[i] : 0
      });
    }

    const body = {
      symbol:   symbol,
      currency: meta.currency || '',
      exchange: meta.exchangeName || '',
      candles:  candles
    };

    return new Response(JSON.stringify(body), {
      status: 200,
      headers: { ...cors, 'Content-Type': 'application/json', 'Cache-Control': 'public, max-age=300' }
    });
  }
};

function round2(x) {
  return Math.round((x + Number.EPSILON) * 100) / 100;
}

function jsonError(msg, status, cors, extra) {
  const body = Object.assign({ error: msg }, extra || {});
  return new Response(JSON.stringify(body), {
    status: status,
    headers: { ...cors, 'Content-Type': 'application/json' }
  });
}
