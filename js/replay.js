// ============================================================
// FJC Trading Lab — Replay Mode (Pillar 2 MVP)
// ============================================================
// Replay mode pretends a chosen historical date is "today".
// state.data is replaced with per-ticker truncated slices so
// every other subsystem (chart, indicators, autopilot, AI analysis,
// historical analogs) automatically sees only data up to the
// chosen date — exactly as someone living through that day would.
//
// The full untruncated data lives in state._replayBackup until
// exitReplay() restores it.
//
// Dependency injection: call initReplay(renderFn, yahooStatusFn)
// from main.js after those functions are defined.
// ============================================================

import { TICKERS }                               from './config.js';
import { state }                                 from './state.js';
import { computeHistoricalEdge, renderHistoricalEdge } from './edge.js';

// Injected callbacks
let _render          = null;
let _updateYahooStatus = null;

/**
 * Must be called once from main.js before setupReplayMode().
 * @param {function} renderFn          - main.js render()
 * @param {function} yahooStatusFn     - data.js updateYahooStatus()
 */
export function initReplay(renderFn, yahooStatusFn) {
  _render            = renderFn;
  _updateYahooStatus = yahooStatusFn;
}

// ------------------------------------------------------------------
// Setup (wire up DOM controls and keyboard shortcuts)
// ------------------------------------------------------------------

export function setupReplayMode() {
  document.getElementById('btn-replay-start').onclick = startReplayFromDate;
  document.getElementById('btn-replay-back').onclick  = () => stepReplay(-1);
  document.getElementById('btn-replay-fwd').onclick   = () => stepReplay(1);
  document.getElementById('btn-replay-live').onclick  = exitReplay;

  // Default the date input to ~6 months ago
  const six    = new Date();
  six.setMonth(six.getMonth() - 6);
  const dateEl = document.getElementById('replay-date');
  if (dateEl && !dateEl.value) dateEl.value = six.toISOString().slice(0, 10);

  // Keyboard shortcuts: ← / → step when replay is active and focus is not in an input
  document.addEventListener('keydown', (e) => {
    if (!state.replay.active) return;
    const tag = e.target && e.target.tagName;
    if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;
    if (e.key === 'ArrowLeft')  { e.preventDefault(); stepReplay(-1); }
    else if (e.key === 'ArrowRight') { e.preventDefault(); stepReplay(1); }
  });

  updateReplayUI();
}

// ------------------------------------------------------------------
// Start replay from the date picker
// ------------------------------------------------------------------

function startReplayFromDate() {
  const dateStr = document.getElementById('replay-date').value;
  if (!dateStr) { alert('Please pick a replay date first.'); return; }

  const idx = {};
  for (const t of TICKERS) {
    const full = state.data[t.sym] || [];
    if (full.length === 0) continue;
    let foundIdx = -1;
    for (let i = full.length - 1; i >= 0; i--) {
      if (full[i].d <= dateStr) { foundIdx = i; break; }
    }
    if (foundIdx < 0) {
      alert('No data on or before ' + dateStr + ' for ' + t.sym + '. Pick a later date.');
      return;
    }
    if (foundIdx < 50) {
      alert('Date is too early — need at least 50 prior candles for the indicators to work. Pick a date at least 50 trading days into the data.');
      return;
    }
    idx[t.sym] = foundIdx;
  }
  enterReplay(idx);
}

// ------------------------------------------------------------------
// Core replay lifecycle
// ------------------------------------------------------------------

export function enterReplay(idx_per_ticker) {
  if (state.replay.active) return;

  // Backup full data
  state._replayBackup = state.data;

  // Slice each ticker's data to the replay index
  const sliced = {};
  for (const t of TICKERS) {
    const full = state._replayBackup[t.sym] || [];
    const i    = (idx_per_ticker[t.sym] != null) ? idx_per_ticker[t.sym] : full.length - 1;
    sliced[t.sym] = full.slice(0, i + 1);
  }

  state.data          = sliced;
  state.replay.active = true;
  state.replay.idx    = idx_per_ticker;

  // Disable "Refresh prices" while in replay to protect state._replayBackup
  const refreshBtn = document.getElementById('refresh-yahoo');
  if (refreshBtn) refreshBtn.disabled = true;

  // Recompute edge stats on the truncated data so the right panel reflects what the user can see
  state.historicalEdge = computeHistoricalEdge();

  if (_render) _render();
  renderHistoricalEdge();
  updateReplayUI();
}

export function exitReplay() {
  if (!state.replay.active) return;
  if (state._replayBackup) state.data = state._replayBackup;
  state._replayBackup = null;
  state.replay.active = false;
  state.replay.idx    = {};

  state.historicalEdge = computeHistoricalEdge();

  if (_render) _render();
  renderHistoricalEdge();
  updateReplayUI();
}

export function stepReplay(deltaDays) {
  if (!state.replay.active || !state._replayBackup) return;

  for (const t of TICKERS) {
    const full = state._replayBackup[t.sym] || [];
    const cur  = state.replay.idx[t.sym] || 0;
    state.replay.idx[t.sym] = Math.max(50, Math.min(full.length - 1, cur + deltaDays));
  }

  const sliced = {};
  for (const t of TICKERS) {
    sliced[t.sym] = state._replayBackup[t.sym].slice(0, state.replay.idx[t.sym] + 1);
  }
  state.data = sliced;

  state.historicalEdge = computeHistoricalEdge();

  if (_render) _render();
  renderHistoricalEdge();
  updateReplayUI();
}

// ------------------------------------------------------------------
// UI state
// ------------------------------------------------------------------

export function updateReplayUI() {
  const startBtn = document.getElementById('btn-replay-start');
  const backBtn  = document.getElementById('btn-replay-back');
  const fwdBtn   = document.getElementById('btn-replay-fwd');
  const liveBtn  = document.getElementById('btn-replay-live');
  const display  = document.getElementById('replay-display');
  const pill     = document.getElementById('data-mode');

  if (state.replay.active) {
    const idx    = state.replay.idx[state.active];
    const full   = state._replayBackup ? state._replayBackup[state.active] : null;
    const candle = (full && full[idx]) ? full[idx] : null;
    const dateStr = candle ? candle.d : '?';
    const lastIdx = full ? full.length - 1 : 0;

    startBtn.disabled = true;
    backBtn.disabled  = (idx <= 50);
    fwdBtn.disabled   = (idx >= lastIdx);
    liveBtn.disabled  = false;
    display.textContent = dateStr;
    display.style.color = 'var(--gold)';
    if (pill) { pill.textContent = 'REPLAY ' + dateStr; pill.style.color = 'var(--gold)'; }
  } else {
    startBtn.disabled = false;
    backBtn.disabled  = true;
    fwdBtn.disabled   = true;
    liveBtn.disabled  = true;
    display.textContent = 'live';
    display.style.color = 'var(--muted)';

    // Re-enable refresh-yahoo if URL is configured
    const refreshBtn = document.getElementById('refresh-yahoo');
    if (refreshBtn) refreshBtn.disabled = !state.yahooProxy;

    // Restore the pill to its normal Yahoo/synthetic state
    if (_updateYahooStatus) _updateYahooStatus();
  }
}
