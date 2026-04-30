// ============================================================
// FJC Trading Lab — Rule-Based Autopilot
// ============================================================
// A transparent, inspectable trade engine that walks day-by-day
// through history and applies a fixed set of rules. Every decision
// is logged with the exact reason in plain English — no black box,
// no secret signals, no magic AI predictions.
//
// Rules:
//   ENTER: Golden Cross (MA50 > MA200) + RSI < 65 → buy 25% cash
//   ADD:   RSI bounce from oversold + price above MA200 → buy 15% cash
//   TRIM:  RSI crosses above 75 → sell half position
//   EXIT:  Death Cross OR price 8% below MA200 → close position
//
// autopilotState is MODULE-PRIVATE.
// Callers interact via exported functions only.
// ============================================================

import { TICKERS, ENVELOPE_DRAWDOWN_PCT } from './config.js';
import { state, defaultPilot, savePilot, tickerCcy, priceToZar, dayDiff } from './state.js';
import { sma, rsi }                       from './indicators.js';
import { addJournalEntry }                from './journal.js';

// ------------------------------------------------------------------
// Module-private runtime state (not persisted — resets on reload)
// ------------------------------------------------------------------

const autopilotState = {
  engaged:         false,
  mode:            'IDLE',   // TREND | DEFENSIVE | GROUNDED | IDLE
  currentIdx:      {},       // per-ticker pointer into data array
  peakValue:       100000,   // highest portfolio value reached — for drawdown calc
  intervalHandle:  null,
  totalDays:       0,
  daysProcessed:   0
};

// ------------------------------------------------------------------
// Public state accessors
// ------------------------------------------------------------------

export function isAutopilotEngaged() { return autopilotState.engaged; }

/** Reset all mutable autopilot runtime fields to their initial values. */
export function resetAutopilotState() {
  if (autopilotState.intervalHandle) {
    clearInterval(autopilotState.intervalHandle);
    autopilotState.intervalHandle = null;
  }
  autopilotState.engaged       = false;
  autopilotState.mode          = 'IDLE';
  autopilotState.currentIdx    = {};
  autopilotState.peakValue     = 100000;
  autopilotState.totalDays     = 0;
  autopilotState.daysProcessed = 0;
}

// ------------------------------------------------------------------
// Signal evaluation
// ------------------------------------------------------------------

function pilotEvaluate(sym, idx, all, ma50, ma200, rsiArr) {
  const c    = all[idx];
  const m50  = ma50[idx],  m200  = ma200[idx];
  const m50p = ma50[idx - 1], m200p = ma200[idx - 1];
  const r    = rsiArr[idx], rp   = rsiArr[idx - 1];
  const pos  = state.pilot.positions[sym];

  if (m50 == null || m200 == null || r == null) {
    return { action: 'WAIT', reason: 'Indicators warming up' };
  }

  // EXIT conditions first (protect capital before seeking opportunity)
  if (pos && pos.shares > 0) {
    if (m50p != null && m200p != null && m50p >= m200p && m50 < m200) {
      return { action: 'EXIT', size: 1.0, reason: 'Death Cross — MA50 fell below MA200, long-term trend broken' };
    }
    if (c.c < m200 * 0.92) {
      return { action: 'EXIT', size: 1.0, reason: 'Price closed >8% below MA200 — cut loss before bigger pain' };
    }
    if (rp != null && rp <= 75 && r > 75) {
      return { action: 'TRIM', size: 0.5, reason: 'RSI crossed above 75 — overheated, locking in half profit' };
    }
  }

  // ENTRY: Golden Cross with RSI not yet overbought
  if (m50p != null && m200p != null && m50p <= m200p && m50 > m200 && r < 65) {
    return { action: 'ENTER', size: 0.25, reason: 'Golden Cross with RSI ' + r.toFixed(0) + ' (under 65) — clean entry' };
  }

  // ADD: oversold bounce in uptrend
  if (pos && pos.shares > 0 && c.c > m200 && rp != null && rp <= 30 && r > 30) {
    return { action: 'ADD', size: 0.15, reason: 'RSI bounced from oversold, price still above MA200 — adding to winner' };
  }

  return { action: 'HOLD', reason: '' };
}

// ------------------------------------------------------------------
// Engage / Disengage
// ------------------------------------------------------------------

export function pilotEngage() {
  if (autopilotState.engaged) return;

  // Start from scratch on every engagement
  state.pilot = defaultPilot();
  autopilotState.peakValue    = 100000;
  autopilotState.mode         = 'TREND';
  autopilotState.daysProcessed = 0;
  autopilotState.totalDays    = 0;

  for (const t of TICKERS) {
    const all      = state.data[t.sym];
    const startIdx = Math.max(1, all.length - state.timeframe);
    autopilotState.currentIdx[t.sym] = startIdx;
    autopilotState.totalDays += (all.length - startIdx);
  }

  autopilotState.engaged = true;
  updateAutopilotUI();

  const speed = +document.getElementById('ap-speed').value;
  if (speed === 0) {
    // Instant: blast through the entire window synchronously
    while (autopilotState.engaged) {
      const more = pilotTick();
      if (!more) { pilotDisengage(pilotEndReason()); break; }
    }
  } else {
    autopilotState.intervalHandle = setInterval(() => {
      const more = pilotTick();
      if (!more) pilotDisengage(pilotEndReason());
    }, speed);
  }
}

export function pilotDisengage(reason) {
  if (autopilotState.intervalHandle) {
    clearInterval(autopilotState.intervalHandle);
    autopilotState.intervalHandle = null;
  }
  if (autopilotState.engaged && reason) {
    state.pilot.log.push({
      date:   new Date().toISOString().slice(0, 10),
      sym:    '---', action: 'DISENGAGE',
      price:  0, ccy: '', qty: 0, value: 0,
      reason: reason
    });
  }
  autopilotState.engaged = false;
  savePilot();
  renderPilot();
  updateAutopilotUI();
}

// ------------------------------------------------------------------
// Teaching-focused end-of-run message
// ------------------------------------------------------------------

function pilotEndReason() {
  const log      = (state.pilot && state.pilot.log) || [];
  const trades   = log.filter(e => e.action !== 'DISENGAGE' && e.action !== 'SKIP').length;
  const skipped  = log.filter(e => e.action === 'SKIP').length;
  const days     = autopilotState.daysProcessed || 0;
  const dayWord  = days === 1 ? 'day' : 'days';
  const tickers  = TICKERS.length;

  if (trades === 0) {
    let msg = 'I walked through every one of the ' + days + ' ' + dayWord +
              ' in your window across all ' + tickers + ' tickers, and found no setup that matched the rules. ';
    msg += 'That is the most common result on a short window — and it is a useful lesson: ';
    msg += 'Golden Crosses fire roughly once a year per stock, RSI extremes need price to actually cross 30 or 70 during the window, ';
    msg += 'and most days the market simply does not offer a textbook setup. ';
    msg += 'Patience is the indicator most retail traders never use. ';
    if (state.timeframe <= 90) {
      msg += 'Try switching to 1Y or 2Y and re-engaging — that is where the autopilot has room to actually work.';
    } else if (skipped > 0) {
      msg += 'Smart Filter skipped ' + skipped + ' setup' + (skipped === 1 ? '' : 's') +
             ' with poor historical edge on this ticker — turn it off to see those plays, but the filter is doing its job.';
    } else {
      msg += 'The rules held their ground. No forced trades is itself a result.';
    }
    return msg;
  }

  const tradeWord = trades === 1 ? 'decision' : 'decisions';
  let msg = 'Done. I walked through ' + days + ' ' + dayWord + ' and the rules fired ' +
            trades + ' ' + tradeWord + '. ';
  msg += 'The Decision Log above shows each one with the reason — read it like a study guide: ';
  msg += 'green entries are entries (Golden Cross or RSI bounces), red are exits (RSI overheated or Death Cross), ';
  msg += 'and the running portfolio value above shows whether the rules beat Buy & Hold.';
  if (skipped > 0) {
    msg += ' Smart Filter also skipped ' + skipped + ' weaker setup' + (skipped === 1 ? '' : 's') +
           ' — that is a feature, not a bug.';
  }
  return msg;
}

// ------------------------------------------------------------------
// Per-tick processing
// ------------------------------------------------------------------

/** Process one step for every ticker. Returns true if more steps remain. */
export function pilotTick() {
  if (!autopilotState.engaged) return false;
  let advanced = false;

  for (const t of TICKERS) {
    const all = state.data[t.sym];
    const idx = autopilotState.currentIdx[t.sym];
    if (idx >= all.length) continue;
    advanced = true;

    const slice   = all.slice(0, idx + 1);
    const closes  = slice.map(c => c.c);
    const ma50arr = sma(closes, 50);
    const ma200arr= sma(closes, 200);
    const rsiArr  = rsi(closes, 14);

    const decision = pilotEvaluate(t.sym, idx, slice, ma50arr, ma200arr, rsiArr);

    if (decision.action !== 'HOLD' && decision.action !== 'WAIT') {
      const lastTrade = state.pilot.lastTradeDay[t.sym];
      if (!lastTrade || dayDiff(all[idx].d, lastTrade) >= 5) {
        const filterOn = document.getElementById('smart-filter') &&
                         document.getElementById('smart-filter').checked;
        const edge = state.historicalEdge[t.sym] && state.historicalEdge[t.sym][decision.action];
        if (filterOn && edge && edge.fired >= 5 && edge.winRate < 50) {
          state.pilot.log.push({
            date: all[idx].d, sym: t.sym, action: 'SKIP',
            price: all[idx].c, ccy: tickerCcy(t.sym), qty: 0, value: 0,
            reason: 'Filtered: ' + decision.action + ' signal but historical win rate only ' +
                    edge.winRate.toFixed(0) + '% on this ticker'
          });
        } else {
          executeDecision(t.sym, all[idx], decision);
        }
      }
    }
    autopilotState.currentIdx[t.sym]++;
    autopilotState.daysProcessed++;
  }

  // Envelope protection: disengage if drawdown exceeds limit
  const value    = computePilotValue();
  if (value > autopilotState.peakValue) autopilotState.peakValue = value;
  const drawdown = ((autopilotState.peakValue - value) / autopilotState.peakValue) * 100;

  if (drawdown > ENVELOPE_DRAWDOWN_PCT) {
    for (const t of TICKERS) {
      const pos = state.pilot.positions[t.sym];
      if (pos && pos.shares > 0) {
        const all = state.data[t.sym];
        const idx = Math.min(autopilotState.currentIdx[t.sym] - 1, all.length - 1);
        executeDecision(t.sym, all[idx], {
          action: 'EXIT', size: 1.0,
          reason: 'ENVELOPE PROTECTION: drawdown ' + drawdown.toFixed(1) +
                  '% exceeded ' + ENVELOPE_DRAWDOWN_PCT + '% limit'
        });
      }
    }
    autopilotState.mode = 'GROUNDED';
    pilotDisengage('Envelope protection triggered — drawdown exceeded ' + ENVELOPE_DRAWDOWN_PCT + '%');
    return false;
  }

  // Determine current mode from uptrend count
  let inUptrend = 0;
  for (const t of TICKERS) {
    const all = state.data[t.sym];
    const idx = Math.min(autopilotState.currentIdx[t.sym] - 1, all.length - 1);
    if (idx < 200) continue;
    const closes = all.slice(0, idx + 1).map(c => c.c);
    const ma200L = sma(closes, 200).pop();
    if (ma200L != null && all[idx].c > ma200L) inUptrend++;
  }
  autopilotState.mode = inUptrend >= 2 ? 'TREND' : 'DEFENSIVE';

  renderPilot();
  updateAutopilotUI();
  return advanced;
}

// ------------------------------------------------------------------
// Trade execution
// ------------------------------------------------------------------

function executeDecision(sym, candle, decision) {
  // Annotate reason with historical edge stats (educates as it trades)
  const edge = state.historicalEdge[sym] && state.historicalEdge[sym][decision.action];
  if (edge && edge.fired > 0) {
    const sample = edge.fired < 5 ? ' [low sample]' : '';
    decision.reason = decision.reason +
      ' | Hist: ' + edge.fired + ' fires, ' +
      edge.winRate.toFixed(0) + '% win, avg ' +
      (edge.avgRet >= 0 ? '+' : '') + edge.avgRet.toFixed(1) + '%/30d' + sample;
  }

  const priceZar       = priceToZar(sym, candle.c);
  const pos            = state.pilot.positions[sym] || { shares: 0, avgZar: 0 };
  const portfolioValue = computePilotValue();

  if (decision.action === 'ENTER' || decision.action === 'ADD') {
    // Position cap: max 50% of portfolio in one ticker
    const currentPosValue = pos.shares * priceZar;
    if (currentPosValue >= portfolioValue * 0.5) return;

    const cashSpend = state.pilot.cash * decision.size;
    if (cashSpend < 100) return;

    const shares = Math.floor(cashSpend / priceZar);
    if (shares < 1) return;

    const cost = shares * priceZar;
    pos.avgZar  = (pos.avgZar * pos.shares + priceZar * shares) / (pos.shares + shares);
    pos.shares += shares;
    state.pilot.cash -= cost;
    state.pilot.positions[sym]     = pos;
    state.pilot.lastTradeDay[sym]  = candle.d;

    state.pilot.log.push({
      date: candle.d, sym, action: decision.action,
      price: candle.c, ccy: tickerCcy(sym), qty: shares,
      value: cost, reason: decision.reason
    });
    addJournalEntry({
      type:             decision.action,   // 'ENTER' | 'ADD'
      ticker:           sym,
      price:            candle.c,
      qty:              shares,
      ccy:              tickerCcy(sym),
      reasoning:        '',
      autopilotContext: decision.reason,
      source:           'autopilot'
    });

  } else if (decision.action === 'TRIM' || decision.action === 'EXIT') {
    if (pos.shares < 1) return;
    const sellShares = decision.action === 'EXIT'
      ? pos.shares
      : Math.floor(pos.shares * decision.size);
    if (sellShares < 1) return;

    const proceeds     = sellShares * priceZar;
    pos.shares        -= sellShares;
    state.pilot.cash  += proceeds;
    if (pos.shares === 0) pos.avgZar = 0;
    state.pilot.lastTradeDay[sym] = candle.d;

    state.pilot.log.push({
      date: candle.d, sym, action: decision.action,
      price: candle.c, ccy: tickerCcy(sym), qty: sellShares,
      value: proceeds, reason: decision.reason
    });
    addJournalEntry({
      type:             decision.action,   // 'TRIM' | 'EXIT'
      ticker:           sym,
      price:            candle.c,
      qty:              sellShares,
      ccy:              tickerCcy(sym),
      reasoning:        '',
      autopilotContext: decision.reason,
      source:           'autopilot'
    });
  }
}

// ------------------------------------------------------------------
// Portfolio valuation helpers
// ------------------------------------------------------------------

function computePilotValue() {
  let value = state.pilot.cash;
  for (const t of TICKERS) {
    const pos = state.pilot.positions[t.sym];
    if (!pos || pos.shares === 0) continue;
    const all  = state.data[t.sym];
    const last = all[all.length - 1].c;
    value += pos.shares * priceToZar(t.sym, last);
  }
  return value;
}

function computeBuyHoldValue() {
  const startCash = 100000;
  const perTicker = startCash / TICKERS.length;
  let total = 0;
  for (const t of TICKERS) {
    const all          = state.data[t.sym];
    const startIdx     = Math.max(0, all.length - state.timeframe);
    const startPriceZar = priceToZar(t.sym, all[startIdx].c);
    const endPriceZar   = priceToZar(t.sym, all[all.length - 1].c);
    const shares        = Math.floor(perTicker / startPriceZar);
    const leftover      = perTicker - shares * startPriceZar;
    total += shares * endPriceZar + leftover;
  }
  return total;
}

// ------------------------------------------------------------------
// Rendering
// ------------------------------------------------------------------

function actionColor(a) {
  return a === 'ENTER'     ? 'var(--green)'  :
         a === 'ADD'       ? 'var(--blue)'   :
         a === 'TRIM'      ? 'var(--gold)'   :
         a === 'EXIT'      ? 'var(--red)'    :
         a === 'SKIP'      ? 'var(--purple)' :
         a === 'DISENGAGE' ? 'var(--muted)'  : 'var(--muted)';
}

export function renderPilot() {
  const value    = computePilotValue();
  const bh       = computeBuyHoldValue();
  const ret      = ((value - 100000) / 100000) * 100;
  const drawdown = autopilotState.peakValue > 0
    ? ((autopilotState.peakValue - value) / autopilotState.peakValue) * 100
    : 0;

  const fmt = (n) => 'R ' + n.toLocaleString('en-ZA', { maximumFractionDigits: 0 });

  const pilotValEl  = document.getElementById('pilot-value');
  const bhEl        = document.getElementById('pilot-bh');
  const retEl       = document.getElementById('pilot-return');
  const ddEl        = document.getElementById('pilot-dd');
  if (pilotValEl) pilotValEl.textContent = fmt(value);
  if (bhEl)       bhEl.textContent       = fmt(bh);
  if (retEl) {
    retEl.textContent = (ret >= 0 ? '+' : '') + ret.toFixed(1) + '%';
    retEl.style.color = ret >= 0 ? 'var(--green)' : 'var(--red)';
  }
  if (ddEl) {
    ddEl.textContent = '-' + drawdown.toFixed(1) + '%';
    ddEl.style.color = drawdown > 10 ? 'var(--red)' : drawdown > 5 ? 'var(--gold)' : 'var(--muted)';
  }

  const ul  = document.getElementById('decision-log');
  if (!ul) return;
  ul.innerHTML = '';

  const log = state.pilot.log.slice().reverse();
  if (log.length === 0) {
    ul.innerHTML = '<li style="color:var(--muted);font-style:italic">Click "Run on visible window" to see Pilot trade across the time window.</li>';
    return;
  }

  for (const e of log) {
    const li        = document.createElement('li');
    li.className    = e.action.toLowerCase();
    const ccyPrefix = e.ccy === 'USD' ? '$' : 'R';
    const isTrade   = (e.action === 'ENTER' || e.action === 'ADD' || e.action === 'TRIM' || e.action === 'EXIT');
    li.innerHTML =
      '<span class="date">'   + e.date  + '</span>' +
      '<span class="sym">'    + e.sym   + '</span>' +
      '<span class="action" style="color:' + actionColor(e.action) + '">' + e.action + '</span>' +
      (isTrade ? (' ' + e.qty + ' @ ' + ccyPrefix + e.price.toFixed(2)) : '') +
      '<span class="reason">' + e.reason + '</span>';
    ul.appendChild(li);
  }
}

export function updateAutopilotUI() {
  const led     = document.getElementById('ap-led');
  const stateEl = document.getElementById('ap-state');
  const modeEl  = document.getElementById('ap-mode');
  const btn     = document.getElementById('ap-engage');
  const bar     = document.getElementById('ap-progress-bar');
  if (!led) return;

  if (autopilotState.engaged) {
    led.className          = 'ap-led engaged';
    stateEl.textContent    = 'ENGAGED';
    stateEl.style.color    = 'var(--green)';
    btn.textContent        = 'Disengage';
  } else {
    led.className          = 'ap-led';
    stateEl.textContent    = 'DISENGAGED';
    stateEl.style.color    = 'var(--muted)';
    btn.textContent        = 'Engage Autopilot';
  }

  modeEl.textContent = 'Mode: ' + autopilotState.mode.toLowerCase();
  if      (autopilotState.mode === 'TREND')     { modeEl.style.color = 'var(--green)'; }
  else if (autopilotState.mode === 'DEFENSIVE') { modeEl.style.color = 'var(--gold)'; }
  else if (autopilotState.mode === 'GROUNDED')  { modeEl.style.color = 'var(--red)'; led.className = 'ap-led envelope'; }
  else                                           { modeEl.style.color = 'var(--muted)'; }

  if (bar) {
    bar.style.width = autopilotState.totalDays > 0
      ? Math.min(100, (autopilotState.daysProcessed / autopilotState.totalDays) * 100) + '%'
      : '0%';
  }
}
