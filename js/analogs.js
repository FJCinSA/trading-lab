// ============================================================
// FJC Trading Lab — Historical Analog Engine (Pillar 3)
// ============================================================
// For the current setup (today, or replay date), scan ALL historical
// data across every ticker for days where the setup matched on three
// categorical buckets:
//   - trend: above or below MA200
//   - rsi:   low (<40) / mid (40-60) / high (>60)
//   - vol:   normal or spike (>1.5× 20-day average)
//
// For each match, compute the 30-day forward return and surface a
// distribution: count, median, win rate, worst/best case, and a
// clickable list of analog dates (click → jump to replay there).
//
// This is the HONEST version of "prediction":
//   No AI hallucinations. No black-box ML.
//   Just statistical lookup of what tended to happen in similar
//   situations, with the full distribution shown.
//
// renderAnalogs(onJump) takes a callback so this module never
// imports from main.js (avoids circular dependencies).
// ============================================================

import { TICKERS, HIST_FORWARD_DAYS } from './config.js';
import { state }                       from './state.js';
import { sma, rsi }                    from './indicators.js';

// ------------------------------------------------------------------
// Bucket helpers
// ------------------------------------------------------------------

function bucketSetup(closes, ma200, rsiArr, volumes, idx) {
  if (idx < 200) return null;
  const c  = closes[idx];
  const m2 = ma200[idx];
  const rv = rsiArr[idx];
  if (m2 == null || rv == null) return null;

  let volBucket = 'normal';
  if (idx >= 20) {
    let s = 0;
    for (let j = idx - 19; j <= idx; j++) s += (volumes[j] || 0);
    const avg = s / 20;
    if (avg > 0 && volumes[idx] > avg * 1.5) volBucket = 'high';
  }

  return {
    trend: c > m2 ? 'above' : 'below',
    rsi:   rv < 40 ? 'low' : rv > 60 ? 'high' : 'mid',
    vol:   volBucket
  };
}

function bucketsMatch(a, b) {
  return a.trend === b.trend && a.rsi === b.rsi && a.vol === b.vol;
}

// ------------------------------------------------------------------
// Core scan
// ------------------------------------------------------------------

/**
 * Find all historical days across all tickers that match the current
 * setup bucket. Returns an error string or a result object.
 *
 * @returns {{ error: string } | { current, currentTicker, currentDate, matches[] }}
 */
export function findAnalogs() {
  const cur = state.data[state.active] || [];
  if (cur.length < 230) {
    return { error: 'Not enough history yet — need at least 230 candles for MA200 and a 30-day forward window.' };
  }

  const curIdx     = cur.length - 1;
  const curDate    = cur[curIdx].d;
  const curCloses  = cur.map(x => x.c);
  const curVolumes = cur.map(x => x.v);
  const curMa200   = sma(curCloses, 200);
  const curRsi     = rsi(curCloses, 14);
  const curBuckets = bucketSetup(curCloses, curMa200, curRsi, curVolumes, curIdx);

  if (!curBuckets) {
    return { error: 'Indicators are not yet computable for the current setup.' };
  }

  const matches = [];
  const FORWARD = HIST_FORWARD_DAYS;

  for (const tk of TICKERS) {
    const arr = state.data[tk.sym] || [];
    if (arr.length < 230 + FORWARD) continue;

    const closes  = arr.map(x => x.c);
    const volumes = arr.map(x => x.v);
    const ma200   = sma(closes, 200);
    const rsiArr  = rsi(closes, 14);
    const lastTestable = arr.length - 1 - FORWARD;

    for (let i = 200; i <= lastTestable; i++) {
      const f = bucketSetup(closes, ma200, rsiArr, volumes, i);
      if (!f) continue;
      if (!bucketsMatch(f, curBuckets)) continue;
      // Exclude the current candle from being its own analog
      if (tk.sym === state.active && arr[i].d === curDate) continue;

      const startPrice = closes[i];
      const endPrice   = closes[i + FORWARD];
      if (startPrice <= 0 || endPrice <= 0) continue;

      matches.push({
        ticker:     tk.sym,
        date:       arr[i].d,
        idx:        i,
        startPrice: startPrice,
        endPrice:   endPrice,
        ret:        (endPrice / startPrice - 1) * 100
      });
    }
  }

  return { current: curBuckets, currentTicker: state.active, currentDate: curDate, matches };
}

// ------------------------------------------------------------------
// Summary statistics
// ------------------------------------------------------------------

function summarizeAnalogs(matches) {
  if (!matches || matches.length === 0) return { count: 0 };
  const sorted  = [...matches].sort((a, b) => a.ret - b.ret);
  const n       = sorted.length;
  const median  = n % 2 === 1 ? sorted[(n - 1) / 2].ret : (sorted[n / 2 - 1].ret + sorted[n / 2].ret) / 2;
  const wins    = matches.filter(m => m.ret > 0).length;
  return {
    count:   n,
    median:  median,
    winRate: (wins / n) * 100,
    worst:   sorted[0],
    best:    sorted[n - 1]
  };
}

function describeBuckets(b) {
  const trend    = b.trend === 'above' ? 'above MA200 (uptrend)' : 'below MA200 (downtrend)';
  const rsiLabel = b.rsi === 'low' ? 'RSI < 40 (oversold zone)' : b.rsi === 'high' ? 'RSI > 60 (overbought zone)' : 'RSI 40–60 (neutral)';
  const volLabel = b.vol === 'high' ? 'volume spike (>1.5× avg)' : 'normal volume';
  return trend + ' • ' + rsiLabel + ' • ' + volLabel;
}

// ------------------------------------------------------------------
// Rendering
// ------------------------------------------------------------------

/**
 * Run the analog scan and render results into #analog-out.
 *
 * @param {function(ticker: string, date: string): void} onJump
 *   Callback invoked when the user clicks an analog row.
 *   Typically: jumpToAnalog from main.js.
 */
export function renderAnalogs(onJump) {
  const out = document.getElementById('analog-out');
  out.classList.remove('empty');
  out.style.color = 'var(--cream)';
  out.textContent = 'Scanning history…';

  // Run on next tick so the "Scanning…" text actually paints before the CPU work
  setTimeout(() => {
    const result = findAnalogs();

    if (result.error) {
      out.style.color = 'var(--red)';
      out.textContent = result.error;
      return;
    }

    const stats = summarizeAnalogs(result.matches);

    if (stats.count === 0) {
      out.style.color  = 'var(--cream)';
      out.innerHTML =
        '<div><b>0 analogs found.</b></div>' +
        '<div style="margin-top:6px;color:var(--muted)">Today\'s setup is unusual — no past day matched all three buckets. ' +
        'Either the configuration is rare, or the history is short. Either way, this is a useful signal: ' +
        'when something is unusual, statistics from history have less to say. Trust the indicators less in moments like these.</div>' +
        '<div style="margin-top:6px;color:var(--muted);font-size:11px">Current setup: ' + describeBuckets(result.current) + '</div>';
      return;
    }

    const top = [...result.matches].sort((a, b) => b.ret - a.ret).slice(0, 12);

    out.style.color = 'var(--cream)';
    out.innerHTML =
      '<div style="font-size:11px;color:var(--muted);margin-bottom:6px">Current setup: ' + describeBuckets(result.current) + '</div>' +
      '<div style="display:grid;grid-template-columns:1fr 1fr 1fr 1fr;gap:6px;margin-bottom:8px">' +
        '<div class="pilot-stat"><div class="k">Matches</div><div class="v" style="color:var(--cream)">' + stats.count + '</div></div>' +
        '<div class="pilot-stat"><div class="k">Median 30d</div><div class="v" style="color:' +
          (stats.median >= 0 ? 'var(--green)' : 'var(--red)') + '">' +
          (stats.median >= 0 ? '+' : '') + stats.median.toFixed(1) + '%</div></div>' +
        '<div class="pilot-stat"><div class="k">Win rate</div><div class="v" style="color:' +
          (stats.winRate >= 55 ? 'var(--green)' : stats.winRate < 45 ? 'var(--red)' : 'var(--gold)') + '">' +
          stats.winRate.toFixed(0) + '%</div></div>' +
        '<div class="pilot-stat"><div class="k">Range</div><div class="v" style="font-size:11px">' +
          '<span style="color:var(--red)">'   + stats.worst.ret.toFixed(0) + '%</span>' +
          ' &nbsp;to&nbsp; ' +
          '<span style="color:var(--green)">+' + stats.best.ret.toFixed(0) + '%</span></div></div>' +
      '</div>' +
      '<div style="font-size:11px;color:var(--muted);margin-bottom:4px">Top matches by return (click any date to jump replay there):</div>' +
      '<div style="max-height:160px;overflow-y:auto;border:1px solid var(--line);border-radius:6px;background:var(--panel-2)">' +
        top.map(m =>
          '<div class="analog-row" data-ticker="' + m.ticker + '" data-date="' + m.date + '" ' +
          'style="padding:5px 8px;border-bottom:1px solid var(--line);font-size:11px;cursor:pointer;display:flex;justify-content:space-between;align-items:center">' +
            '<span><b>' + m.ticker + '</b> ' + m.date + '</span>' +
            '<span style="color:' + (m.ret >= 0 ? 'var(--green)' : 'var(--red)') + ';font-variant-numeric:tabular-nums">' +
              (m.ret >= 0 ? '+' : '') + m.ret.toFixed(1) + '%' +
            '</span>' +
          '</div>'
        ).join('') +
      '</div>' +
      '<div style="font-size:10px;color:var(--muted);margin-top:6px;line-height:1.4">' +
        '<b>How to read this:</b> in past situations that looked like today, the median 30-day-forward return was ' +
        (stats.median >= 0 ? '+' : '') + stats.median.toFixed(1) + '%, with ' + stats.winRate.toFixed(0) + '% of cases positive. ' +
        '<b>This is not a prediction.</b> It is what tended to happen in similar setups historically. Notice how wide the range is — that is the real lesson.' +
        (stats.count < 5 ? ' <span style="color:var(--gold)">Only ' + stats.count + ' matches — sample size is small, treat with extra caution.</span>' : '') +
      '</div>';

    // Wire up click-to-jump for each analog row
    out.querySelectorAll('.analog-row').forEach(row => {
      row.onclick = () => {
        if (onJump) onJump(row.getAttribute('data-ticker'), row.getAttribute('data-date'));
      };
      row.onmouseenter = () => { row.style.background = 'rgba(201,168,76,.08)'; };
      row.onmouseleave = () => { row.style.background = 'transparent'; };
    });
  }, 30);
}
