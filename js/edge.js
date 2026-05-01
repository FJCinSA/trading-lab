// ============================================================
// FJC Trading Lab — Historical Edge Engine
// ============================================================
// Retrospective analysis of every signal type on every ticker.
// Scans the full available history, finds every time each signal
// fired, then measures what happened 30 trading days later.
//
// The result is an edge table: fires, win rate, average return,
// best and worst case. Displayed in the right-panel Historical Edge
// card and used by the autopilot Smart Filter.
//
// computeHistoricalEdge() returns a plain object.
// Callers assign it:  state.historicalEdge = computeHistoricalEdge();
// ============================================================

import { TICKERS, HIST_FORWARD_DAYS } from './config.js';
import { state }                       from './state.js';
import { sma, rsi }                    from './indicators.js';

/**
 * Scan all tickers in state.data and compute historical win/loss stats
 * for each of the four signal types: ENTER, ADD, TRIM, EXIT.
 *
 * Signal definitions mirror the autopilot rules exactly so the edge
 * statistics are directly comparable to autopilot decisions.
 *
 * @returns {{ [sym: string]: { ENTER, ADD, TRIM, EXIT } }} edge stats object
 */
export function computeHistoricalEdge() {
  const edges = {};

  for (const t of TICKERS) {
    const sym = t.sym;
    edges[sym] = {
      ENTER: { fired: 0, wins: 0, returns: [] },
      ADD:   { fired: 0, wins: 0, returns: [] },
      TRIM:  { fired: 0, wins: 0, returns: [] },
      EXIT:  { fired: 0, wins: 0, returns: [] }
    };

    const all    = state.data[sym];
    if (!all || all.length < 200 + HIST_FORWARD_DAYS) continue;

    const closes = all.map(c => c.c);
    const ma50   = sma(closes, 50);
    const ma200  = sma(closes, 200);
    const rsiArr = rsi(closes, 14);

    // Need MA200 warmup (200 bars) and forward room for outcome measurement
    for (let i = 200; i < all.length - HIST_FORWARD_DAYS; i++) {
      const m50  = ma50[i],  m50p  = ma50[i - 1];
      const m200 = ma200[i], m200p = ma200[i - 1];
      const r    = rsiArr[i], rp   = rsiArr[i - 1];
      if (m50 == null || m200 == null || r == null || m50p == null || m200p == null || rp == null) continue;

      const entryPrice  = all[i].c;
      const futurePrice = all[i + HIST_FORWARD_DAYS].c;
      const ret = ((futurePrice - entryPrice) / entryPrice) * 100;

      // ENTER: Golden Cross (MA50 crosses above MA200) + RSI < 65
      // "win" = price higher after 30 days
      if (m50p <= m200p && m50 > m200 && r < 65) {
        edges[sym].ENTER.fired++;
        if (ret > 0) edges[sym].ENTER.wins++;
        edges[sym].ENTER.returns.push(ret);
      }

      // ADD: RSI bounce from oversold + price still above MA200
      // "win" = price higher after 30 days
      if (rp <= 30 && r > 30 && all[i].c > m200) {
        edges[sym].ADD.fired++;
        if (ret > 0) edges[sym].ADD.wins++;
        edges[sym].ADD.returns.push(ret);
      }

      // TRIM: RSI crosses above 75 (overbought)
      // "win" = price flat or lower after 30 days (we trimmed near a top)
      if (rp <= 75 && r > 75) {
        edges[sym].TRIM.fired++;
        if (ret <= 0) edges[sym].TRIM.wins++;
        edges[sym].TRIM.returns.push(ret);
      }

      // EXIT: Death Cross (MA50 crosses below MA200)
      // "win" = price lower after 30 days (we got out before more pain)
      if (m50p >= m200p && m50 < m200) {
        edges[sym].EXIT.fired++;
        if (ret < 0) edges[sym].EXIT.wins++;
        edges[sym].EXIT.returns.push(ret);
      }
    }

    // Compute summary stats for each signal type
    for (const action of ['ENTER', 'ADD', 'TRIM', 'EXIT']) {
      const e = edges[sym][action];
      e.winRate = e.fired > 0 ? (e.wins / e.fired) * 100 : 0;
      e.avgRet  = e.returns.length > 0 ? e.returns.reduce((a, b) => a + b, 0) / e.returns.length : 0;
      e.best    = e.returns.length > 0 ? Math.max(...e.returns) : 0;
      e.worst   = e.returns.length > 0 ? Math.min(...e.returns) : 0;
    }
  }

  return edges;
}

/**
 * Render the Historical Edge tables into the #edge-tables container.
 * Reads from state.historicalEdge (set by the caller after computeHistoricalEdge).
 */
export function renderHistoricalEdge() {
  const container = document.getElementById('edge-tables');
  if (!container) return;

  let html = '';
  let anyFires = false;

  for (const t of TICKERS) {
    const e = state.historicalEdge[t.sym];
    if (!e) continue;

    // Skip tickers with no signal fires at all — they add noise without information
    const totalFires = ['ENTER','ADD','TRIM','EXIT'].reduce((s, a) => s + e[a].fired, 0);
    if (totalFires === 0) continue;
    anyFires = true;

    html += '<div style="margin-bottom:10px">';
    html += '<div style="color:var(--gold);font-weight:600;font-size:12px;margin-bottom:4px">' + t.sym + '</div>';
    html += '<table style="width:100%;font-size:11px;border-collapse:collapse;font-variant-numeric:tabular-nums">';
    html += '<thead><tr style="color:var(--muted);font-size:10px;text-transform:uppercase">';
    html += '<th align="left"  style="padding:2px 4px">Sig</th>';
    html += '<th align="right" style="padding:2px 4px">Fires</th>';
    html += '<th align="right" style="padding:2px 4px">Win%</th>';
    html += '<th align="right" style="padding:2px 4px">Avg30d</th>';
    html += '<th align="right" style="padding:2px 4px">Best/Worst</th>';
    html += '</tr></thead><tbody>';

    for (const action of ['ENTER', 'ADD', 'TRIM', 'EXIT']) {
      const s = e[action];
      const winColor = s.fired === 0 ? 'var(--muted)'
                     : s.winRate >= 60 ? 'var(--green)'
                     : s.winRate >= 40 ? 'var(--gold)'
                     : 'var(--red)';
      const avgColor = s.fired === 0 ? 'var(--muted)'
                     : (action === 'ENTER' || action === 'ADD')
                         ? (s.avgRet >= 0 ? 'var(--green)' : 'var(--red)')
                         : (s.avgRet <= 0 ? 'var(--green)' : 'var(--red)');

      html += '<tr style="border-top:1px solid var(--line)">';
      html += '<td style="padding:3px 4px;font-weight:600">' + action + '</td>';
      html += '<td align="right" style="padding:3px 4px">' + s.fired + '</td>';
      html += '<td align="right" style="padding:3px 4px;color:' + winColor + '">' +
              (s.fired > 0 ? s.winRate.toFixed(0) + '%' : '-') + '</td>';
      html += '<td align="right" style="padding:3px 4px;color:' + avgColor + '">' +
              (s.fired > 0 ? (s.avgRet >= 0 ? '+' : '') + s.avgRet.toFixed(1) + '%' : '-') + '</td>';
      html += '<td align="right" style="padding:3px 4px;color:var(--muted);font-size:10px">' +
              (s.fired > 0 ? '+' + s.best.toFixed(0) + '/' + s.worst.toFixed(0) : '-') + '</td>';
      html += '</tr>';
    }

    html += '</tbody></table></div>';
  }

  if (!anyFires) {
    html = '<div style="font-size:11px;color:var(--muted);padding:4px 0">' +
           'No signal history yet — configure your Yahoo proxy and click ' +
           '<b style="color:var(--gold)">Refresh prices</b> to populate these tables with real data.' +
           '</div>';
  }

  container.innerHTML = html;
}
