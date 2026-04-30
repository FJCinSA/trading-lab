// ============================================================
// FJC Trading Lab — Main Orchestrator (Pillars 1-5)
// ============================================================
// This is the entry point. Its only job is to wire everything together:
//   • imports all 14 sibling modules
//   • owns render(), renderSignals(), buildTabs(), bindControls(),
//     marketStatus(), updateClocks(), jumpToAnalog(), init()
//   • injects render() + updateYahooStatus() into chart.js and replay.js
//     so those modules can trigger redraws without importing back here
//     (which would create circular dependencies)
//
// TO ADD A NEW TICKER:
//   Edit js/config.js — append one object to TICKERS. Done.
// ============================================================

import { TICKERS, LS_PROXY, LS_YAHOO_PROXY, LS_FX } from './config.js';
import { state, defaultPortfolio, defaultPilot,
         savePortfolio, savePilot, saveSR }          from './state.js';
import { sma, bollinger, rsi }                         from './indicators.js';
import { genCandles }                                  from './synthetic.js';
import { computeHistoricalEdge, renderHistoricalEdge } from './edge.js';
import { initChart, drawCandles, drawVolume, drawRSI,
         drawOverlay }                                  from './chart.js';
import { updateProxyStatus, updateYahooStatus,
         refreshAllFromYahoo, fetchYahoo }             from './data.js';
import { renderPortfolio, renderAlerts, checkAlerts,
         updateTradeTooltips, trade, addAlert }         from './portfolio.js';
import { askClaude }                                   from './ai.js';
import { pilotEngage, pilotDisengage, renderPilot,
         updateAutopilotUI, isAutopilotEngaged,
         resetAutopilotState }                         from './autopilot.js';
import { renderAnalogs }                               from './analogs.js';
import { initReplay, setupReplayMode, enterReplay,
         updateReplayUI }                              from './replay.js';
import { addJournalEntry, renderJournal, clearJournal } from './journal.js';
import { renderCrashes, showCrashContext }              from './crashes.js';
import { renderCurriculum, closeLesson }               from './curriculum.js';

// ------------------------------------------------------------------
// Core render function — redraws everything visible on screen
// ------------------------------------------------------------------

export function render() {
  const t = TICKERS.find(x => x.sym === state.active);
  document.getElementById('lbl-ticker').textContent = t.sym;

  const all        = state.data[state.active];
  const visible    = all.slice(-state.timeframe);
  const allCloses  = all.map(c => c.c);
  const sliceStart = all.length - visible.length;

  // Compute full-series indicators then slice to visible window
  const ma50full  = sma(allCloses, 50);
  const ma200full = sma(allCloses, 200);
  const bbFull    = bollinger(allCloses, 20, 2);
  const rsiFull   = rsi(allCloses, 14);

  const ma50  = ma50full .slice(sliceStart);
  const ma200 = ma200full.slice(sliceStart);
  const bbUp  = bbFull.up.slice(sliceStart);
  const bbDn  = bbFull.dn.slice(sliceStart);
  const rsiArr = rsiFull .slice(sliceStart);

  drawCandles(visible, ma50, ma200, bbUp, bbDn, rsiArr);

  // Overlay comparison line — drawn on top of candles if active
  if (state.overlay.sym && state.overlay.sym !== state.active) {
    drawOverlay(state.overlay.sym, visible);
    const legEl  = document.getElementById('overlay-legend');
    const symEl  = document.getElementById('overlay-legend-sym');
    if (legEl)  legEl.style.display = '';
    if (symEl)  symEl.textContent   = state.overlay.sym;
  } else {
    const legEl = document.getElementById('overlay-legend');
    if (legEl) legEl.style.display = 'none';
  }

  drawVolume(visible);
  drawRSI(rsiArr);

  renderSignals(t, all, ma50full, ma200full, rsiFull);
  renderPortfolio();
  renderAlerts();
  renderPilot();
  renderJournal();
  checkAlerts();

  // Keep overlay select in sync: disable option for the active ticker, clear if self-compare
  const overlaySel = document.getElementById('overlay-sym');
  if (overlaySel) {
    for (const opt of overlaySel.options) {
      opt.disabled = (opt.value === state.active);
    }
    // If currently showing self-compare (tab switch), reset to "none"
    if (state.overlay.sym === state.active) {
      state.overlay.sym = null;
      overlaySel.value  = '';
    } else {
      overlaySel.value  = state.overlay.sym || '';
    }
  }
}

// ------------------------------------------------------------------
// Signal chips — the row of status cards below the chart
// ------------------------------------------------------------------

function renderSignals(t, all, ma50, ma200, rsiFull) {
  const last   = all[all.length - 1];
  const prev   = all[all.length - 2];
  const ma50L  = ma50 [ma50 .length - 1];
  const ma200L = ma200[ma200.length - 1];
  const ma50P  = ma50 [ma50 .length - 2];
  const ma200P = ma200[ma200.length - 2];
  const rsiL   = rsiFull[rsiFull.length - 1];

  const trendUp = last.c > (ma200L || 0);
  const cross   =
    (ma50P && ma200P && ma50L && ma200L)
      ? (ma50P <= ma200P && ma50L > ma200L ? 'GOLDEN'
       : ma50P >= ma200P && ma50L < ma200L ? 'DEATH'
       : '-')
      : '-';
  const change    = ((last.c - prev.c) / prev.c) * 100;
  const ccyPrefix = t.ccy === 'USD' ? '$' : 'R ';

  const sig = document.getElementById('signals');
  sig.innerHTML = '';

  function chip(k, v, cls) {
    const d = document.createElement('div');
    d.className = 'chip ' + (cls || '');
    d.innerHTML = '<div class="k">' + k + '</div><div class="v">' + v + '</div>';
    return d;
  }

  sig.appendChild(chip('Last',   ccyPrefix + last.c.toFixed(2),                      change >= 0 ? 'green' : 'red'));
  sig.appendChild(chip('Day',    (change >= 0 ? '+' : '') + change.toFixed(2) + '%', change >= 0 ? 'green' : 'red'));
  sig.appendChild(chip('MA200',  trendUp ? 'Above (uptrend)' : 'Below (downtrend)',  trendUp     ? 'green' : 'red'));
  sig.appendChild(chip('Cross',  cross,                                                cross === 'GOLDEN' ? 'green' : cross === 'DEATH' ? 'red' : ''));
  sig.appendChild(chip('RSI',    rsiL ? rsiL.toFixed(0) : '-',                        rsiL > 70 ? 'red' : rsiL < 30 ? 'green' : 'gold'));

  const overall = trendUp && rsiL < 70 ? 'Strong buy lean' : !trendUp && rsiL > 30 ? 'Watch / caution' : 'Mixed';
  sig.appendChild(chip('Overall', overall, trendUp ? 'green' : 'gold'));
}

// ------------------------------------------------------------------
// Tab bar — one button per ticker
// ------------------------------------------------------------------

function buildTabs() {
  const tabs = document.getElementById('tabs');
  tabs.innerHTML = '';
  for (const t of TICKERS) {
    const b = document.createElement('button');
    b.className  = 'tab' + (state.active === t.sym ? ' active' : '');
    b.textContent = t.sym + '  ' + t.name;
    b.onclick = () => {
      state.active = t.sym;
      render();
      buildTabs();
      updateReplayUI();
    };
    tabs.appendChild(b);
  }
}

// ------------------------------------------------------------------
// Control bindings — wires every button, input, and toggle
// ------------------------------------------------------------------

function bindControls() {
  // ---- Timeframe selector ----
  document.getElementById('tf').querySelectorAll('button').forEach(b => {
    b.onclick = () => {
      state.timeframe = +b.dataset.tf;
      document.querySelectorAll('#tf button').forEach(x => x.classList.remove('on'));
      b.classList.add('on');
      render();
    };
  });

  // ---- Indicator toggles ----
  document.querySelectorAll('.toggle[data-ind]').forEach(b => {
    b.onclick = () => {
      const k = b.dataset.ind;
      state.indicators[k] = !state.indicators[k];
      b.classList.toggle('on', state.indicators[k]);
      render();
    };
  });

  // ---- Clear support/resistance lines ----
  document.getElementById('clear-sr').onclick = () => {
    state.sr[state.active] = [];
    saveSR();
    render();
  };

  // ---- Manual paper trading — with Decision Journal prompt ----
  function tradeWithReasoning(direction) {
    const t    = TICKERS.find(x => x.sym === state.active);
    const qty  = +document.getElementById('qty').value;
    if (!qty || qty <= 0) { trade(direction); return; } // let trade() validate
    const last = state.data[t.sym] && state.data[t.sym][state.data[t.sym].length - 1].c;
    const verb = direction > 0 ? 'BUY' : 'SELL';
    const ccy  = t.ccy === 'USD' ? '$' : 'R';

    const reasoning = window.prompt(
      verb + ' ' + qty + ' x ' + t.sym + ' @ ' + ccy + (last ? last.toFixed(2) : '?') + '\n\n' +
      'Why are you making this trade?\n' +
      '(Write your reason — this is your learning record.\n' +
      ' Press OK with nothing typed to trade without a note.\n' +
      ' Press Cancel to abort the trade.)'
    );

    if (reasoning === null) return; // user cancelled — do not trade

    trade(direction, ({ ticker, price, qty: q, ccy: c }) => {
      addJournalEntry({
        type:             verb,
        ticker,
        price,
        qty:              q,
        ccy:              c,
        reasoning:        reasoning.trim(),
        autopilotContext: '',
        source:           'manual'
      });
    });
  }

  document.getElementById('btn-buy') .onclick = () => tradeWithReasoning(+1);
  document.getElementById('btn-sell').onclick = () => tradeWithReasoning(-1);
  document.getElementById('qty').addEventListener('input',      updateTradeTooltips);
  document.getElementById('btn-buy') .addEventListener('mouseenter', updateTradeTooltips);
  document.getElementById('btn-sell').addEventListener('mouseenter', updateTradeTooltips);

  document.getElementById('reset-portfolio').onclick = () => {
    if (confirm('Reset paper portfolio to R100,000?')) {
      state.portfolio = defaultPortfolio();
      savePortfolio();
      render();
    }
  };

  // ---- Price alerts ----
  document.getElementById('btn-add-alert').onclick = addAlert;

  // ---- AI buttons ----
  document.getElementById('btn-analyse')      .onclick = () => askClaude('analyse');
  document.getElementById('btn-briefing')     .onclick = () => askClaude('briefing');
  document.getElementById('btn-journal-review').onclick = () => askClaude('journal-review');

  // ---- Decision Journal ----
  document.getElementById('btn-clear-journal').onclick = clearJournal;

  // ---- Overlay options — built dynamically from TICKERS so adding a ticker
  //      to config.js automatically adds it here (no HTML edit required) ----
  const overlaySel = document.getElementById('overlay-sym');
  if (overlaySel) {
    while (overlaySel.options.length > 1) overlaySel.remove(1); // keep placeholder
    for (const t of TICKERS) {
      const opt = document.createElement('option');
      opt.value = t.sym;
      opt.textContent = 'vs ' + t.sym;
      overlaySel.appendChild(opt);
    }
  }

  // ---- Overlay comparison (Pillar 5) ----
  document.getElementById('overlay-sym').onchange = (e) => {
    const sel = e.target.value;
    // Don't compare a ticker to itself
    state.overlay.sym = (sel && sel !== state.active) ? sel : null;
    render();
  };

  // ---- Historical Analogs ----
  // Pass jumpToAnalog as the callback so renderAnalogs can trigger replay
  // without importing from main.js (which would be circular).
  document.getElementById('btn-analogs').onclick = () => renderAnalogs(jumpToAnalog);

  // ---- Autopilot ----
  document.getElementById('ap-engage').onclick = () => {
    if (isAutopilotEngaged()) pilotDisengage('Manual disengage by user');
    else                      pilotEngage();
  };

  document.getElementById('pilot-reset').onclick = () => {
    if (isAutopilotEngaged()) pilotDisengage('Reset');
    if (confirm('Reset Autopilot to R100,000 and clear decision log?')) {
      state.pilot = defaultPilot();
      resetAutopilotState();   // clears peakValue, mode, currentIdx, interval handle
      savePilot();
      renderPilot();
      updateAutopilotUI();
    }
  };

  // ---- Anthropic proxy URL ----
  document.getElementById('proxy-url').value = state.proxy;
  document.getElementById('save-proxy').onclick = () => {
    state.proxy = document.getElementById('proxy-url').value.trim();
    localStorage.setItem(LS_PROXY, state.proxy);
    updateProxyStatus();
  };
  updateProxyStatus();

  // ---- Yahoo Finance proxy URL + Refresh button ----
  document.getElementById('yahoo-url').value = state.yahooProxy;
  document.getElementById('save-yahoo').onclick = () => {
    state.yahooProxy = document.getElementById('yahoo-url').value.trim();
    localStorage.setItem(LS_YAHOO_PROXY, state.yahooProxy);
    updateYahooStatus();
  };
  document.getElementById('refresh-yahoo').onclick = () => {
    refreshAllFromYahoo(_onYahooSuccess);
  };
  updateYahooStatus();

  // ---- USD/ZAR FX rate ----
  const fxEl = document.getElementById('fx-rate');
  if (fxEl) fxEl.value = state.fxUsdZar.toFixed(2);
  document.getElementById('save-fx').onclick = () => {
    const v = parseFloat(document.getElementById('fx-rate').value);
    if (!isNaN(v) && v > 1) {
      state.fxUsdZar = v;
      localStorage.setItem(LS_FX, v.toFixed(2));
      render();
    }
  };
}

// ------------------------------------------------------------------
// Yahoo success callback — recompute edge + full redraw
// ------------------------------------------------------------------

function _onYahooSuccess() {
  state.historicalEdge = computeHistoricalEdge();
  render();
  renderHistoricalEdge();
}

// ------------------------------------------------------------------
// Replay — jump to an analog date
// ------------------------------------------------------------------

/**
 * Switch the active ticker to `ticker` and enter Replay Mode at `date`.
 * Called from analogs.js via the onJump callback passed to renderAnalogs().
 *
 * @param {string} ticker  - e.g. 'TDY'
 * @param {string} date    - ISO date string e.g. '2023-07-14'
 */
function jumpToAnalog(ticker, date) {
  // Switch to the right ticker first
  if (state.active !== ticker) {
    state.active = ticker;
    buildTabs();
  }

  // Use the untruncated data for index lookup, whether or not replay is already active
  const fullData = state._replayBackup ? state._replayBackup : state.data;

  // Build a per-ticker index map anchored to the same calendar date
  const idx = {};
  for (const t of TICKERS) {
    const arr = fullData[t.sym] || [];
    let found = -1;
    for (let i = arr.length - 1; i >= 0; i--) {
      if (arr[i].d <= date) { found = i; break; }
    }
    idx[t.sym] = Math.max(50, found >= 0 ? found : arr.length - 1);
  }

  // Validate: the target ticker must have enough history
  const targetArr = fullData[ticker] || [];
  let targetFound = -1;
  for (let i = targetArr.length - 1; i >= 0; i--) {
    if (targetArr[i].d <= date) { targetFound = i; break; }
  }
  if (targetFound < 0) {
    alert('No data on or before ' + date + ' for ' + ticker + '.');
    return;
  }
  if (targetFound < 50) {
    alert('Date is too early — need at least 50 prior candles for indicators.');
    return;
  }

  // enterReplay handles: backup, slicing state.data, historicalEdge recompute, render(), updateReplayUI()
  enterReplay(idx);
}

// ------------------------------------------------------------------
// Famous Crashes — activate a case study scenario (Pillar 6)
// ------------------------------------------------------------------

/**
 * Fetch full historical data for a crash scenario ticker, position
 * Replay Mode at the crash start date, and show the context panel.
 * Called by the scenario cards rendered by crashes.js.
 *
 * @param {object} scenario  one entry from CRASH_SCENARIOS
 */
async function jumpToCrash(scenario) {
  if (!state.yahooProxy) {
    alert(
      'Crash case studies require live Yahoo Finance data.\n\n' +
      'Configure your Yahoo proxy URL in the Settings section below, ' +
      'then click a scenario again.'
    );
    return;
  }

  // Exit any active replay first — enterReplay() bails silently if replay is already
  // active, which would leave the chart showing the old session instead of the crash.
  // Restoring full data here also ensures jumpToAnalog() uses freshly fetched data
  // (not the stale _replayBackup) when building the per-ticker index map.
  if (state.replay.active) {
    if (state._replayBackup) state.data = state._replayBackup;
    state._replayBackup = null;
    state.replay.active = false;
    state.replay.idx    = {};
    updateReplayUI();
  }

  // Disengage autopilot if it is running — it should not trade during a study
  if (isAutopilotEngaged()) pilotDisengage('Starting crash case study');

  // Show loading status inside the card
  const loadEl = document.getElementById('crash-loading');
  if (loadEl) {
    loadEl.textContent = 'Loading ' + scenario.ticker + ' full history — one moment…';
    loadEl.style.display = '';
  }

  try {
    // usePeriods=true forces Yahoo to return genuine daily candles (bypasses
    // Yahoo v8's auto-coarsening of interval=1d for range=max on long-dated tickers).
    // fetchStart/fetchEnd bound the window to each scenario's relevant period so we
    // never request 25+ years of data — keeps the proxy response fast and avoids timeouts.
    const candles = await fetchYahoo(scenario.ticker, {
      usePeriods:  true,
      fetchStart:  scenario.fetchStart || null,   // ISO date or null = from inception
      fetchEnd:    scenario.fetchEnd   || null    // ISO date or null = up to today
    });
    state.data[scenario.ticker] = candles;
  } catch (e) {
    alert('Failed to load ' + scenario.ticker + ' data:\n' + (e && e.message || e));
    if (loadEl) loadEl.style.display = 'none';
    return;
  }

  if (loadEl) loadEl.style.display = 'none';

  // Verify the data actually covers the scenario start date with enough prior history
  const candles  = state.data[scenario.ticker];
  const startIdx = candles.findIndex(c => c.d >= scenario.startDate);

  if (startIdx < 0) {
    // Data ends before the crash date — should never happen for current tickers,
    // but catches e.g. a newly-listed ETF or a Yahoo data gap.
    const latest = candles.length > 0 ? candles[candles.length - 1].d : 'unknown';
    alert(
      'No data found at or after ' + scenario.startDate + ' for ' + scenario.ticker + '.\n\n' +
      'Latest available date: ' + latest + '.\n\n' +
      'The scenario start date may be in the future, or Yahoo Finance may not have ' +
      'this ticker\'s data that far.'
    );
    return;
  }

  if (startIdx < 50) {
    // Not enough candles before the crash date for indicators to work.
    const earliest = candles.length > 0 ? candles[0].d : 'unknown';
    alert(
      'Not enough historical data for ' + scenario.name + '.\n\n' +
      'Yahoo Finance data for ' + scenario.ticker + ' starts on ' + earliest + '.\n' +
      'Crash start date ' + scenario.startDate + ' is only ' + startIdx + ' candles in — ' +
      'need at least 50 prior candles for the indicators to work.\n\n' +
      'Try a later start date for this scenario.'
    );
    return;
  }

  // Switch to the crash ticker and rebuild the tab bar
  if (state.active !== scenario.ticker) {
    state.active = scenario.ticker;
    buildTabs();
  }

  // Show the setting-the-scene context panel above the chart
  showCrashContext(scenario);

  // Jump replay to the crash onset — uses jumpToAnalog which handles
  // the full replay index build, state backup, and render() call
  jumpToAnalog(scenario.ticker, scenario.startDate);
}

// ------------------------------------------------------------------
// Market status (NYSE + JSE open/closed, UTC-based)
// ------------------------------------------------------------------

function marketStatus() {
  const now    = new Date();
  const day    = now.getDay();
  const weekend = (day === 0 || day === 6);
  const utcMin  = now.getUTCHours() * 60 + now.getUTCMinutes();
  const nyseOpen = !weekend && utcMin >= 13 * 60 + 30 && utcMin <= 20 * 60;
  const jseOpen  = !weekend && utcMin >= 7 * 60        && utcMin <= 15 * 60;
  return { nyse: nyseOpen, jse: jseOpen };
}

function updateClocks() {
  const now = new Date();
  document.getElementById('now').textContent = now.toLocaleString();
  const m = marketStatus();
  const n = document.getElementById('nyse-status');
  const j = document.getElementById('jse-status');
  n.textContent  = m.nyse ? 'OPEN' : 'CLOSED';
  n.style.color  = m.nyse ? 'var(--green)' : 'var(--red)';
  j.textContent  = m.jse  ? 'OPEN' : 'CLOSED';
  j.style.color  = m.jse  ? 'var(--green)' : 'var(--red)';
}

// ------------------------------------------------------------------
// App bootstrap
// ------------------------------------------------------------------

function init() {
  // Seed synthetic data for every ticker
  for (const t of TICKERS) state.data[t.sym] = genCandles(t);

  // Compute initial historical edge (before any live data arrives)
  state.historicalEdge = computeHistoricalEdge();

  buildTabs();
  bindControls();
  updateClocks();
  setInterval(updateClocks, 30000);
  render();
  renderHistoricalEdge();
  updateAutopilotUI();
  updateTradeTooltips();
  renderCrashes(jumpToCrash);
  renderCurriculum();

  // Close lesson modal on Escape key
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeLesson();
  });
}

// ------------------------------------------------------------------
// Tooltip edge guard
// ------------------------------------------------------------------
// Shift data-tip tooltips horizontally so they never clip off the
// right (or left) edge of the viewport on narrow screens.
// The handler measures the trigger's position and nudges a CSS variable
// that the tooltip pseudo-element reads via transform: translateX(…).

(function tooltipEdgeGuard() {
  const TIP_MAX = 280;  // matches max-width in CSS
  const MARGIN  = 12;   // breathing room from viewport edge
  document.addEventListener('mouseover', (e) => {
    const el = e.target.closest && e.target.closest('[data-tip]');
    if (!el) return;
    const r = el.getBoundingClientRect();
    const triggerCenter = r.left + r.width / 2;
    const halfTip = TIP_MAX / 2;
    const vw = window.innerWidth;
    let offset = 0;
    if (triggerCenter - halfTip < MARGIN) {
      offset = MARGIN - (triggerCenter - halfTip);         // nudge right
    } else if (triggerCenter + halfTip > vw - MARGIN) {
      offset = (vw - MARGIN) - (triggerCenter + halfTip); // nudge left
    }
    el.style.setProperty('--tip-offset-x', offset + 'px');
  });
})();

// ------------------------------------------------------------------
// Service worker (PWA / offline cache)
// ------------------------------------------------------------------

if ('serviceWorker' in navigator &&
    (location.protocol === 'http:' || location.protocol === 'https:')) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./service-worker.js')
      .then(reg  => console.log('[FJC Lab] Service worker registered, scope:', reg.scope))
      .catch(err => console.warn('[FJC Lab] Service worker registration failed:', err));
  });
}

// ------------------------------------------------------------------
// Wire dependency injections, then start
// ------------------------------------------------------------------

// chart.js needs render() so its canvas event handlers (mouseleave,
// S/R onclick, crosshair) can trigger a full redraw without importing
// from main.js (which would be a circular dependency).
initChart(render);

// replay.js needs both render() and updateYahooStatus() so it can
// trigger redraws and restore the Yahoo status pill on exitReplay().
initReplay(render, updateYahooStatus);

// Redraw on every window resize so the canvas fills its container correctly
window.addEventListener('resize', () => render());

// Boot the app
init();
setupReplayMode();

// Auto-fetch live prices if the user already has a Yahoo proxy configured
if (state.yahooProxy) refreshAllFromYahoo(_onYahooSuccess);
