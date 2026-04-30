// ============================================================
// FJC Trading Lab — Decision Journal (Pillar 4)
// ============================================================
// Every trade — manual or autopilot — is logged with the
// trader's reasoning at the time. The AI reviews patterns
// across entries so Francois can see his own habits.
//
// This is the teaching core: not a P/L log, a meaning log.
//
// Exports:
//   addJournalEntry(opts)      — save one entry
//   getJournalEntries(daysBack)— return entries from last N days
//   getAllJournalEntries()      — return all entries
//   clearJournal()             — wipe all (asks confirm)
//   renderJournal()            — update the UI panel
// ============================================================

import { LS_JOURNAL } from './config.js';

// ------------------------------------------------------------------
// Load / Save (localStorage)
// ------------------------------------------------------------------

function loadJournal() {
  try   { return JSON.parse(localStorage.getItem(LS_JOURNAL)) || []; }
  catch { return []; }
}

function saveJournal(entries) {
  localStorage.setItem(LS_JOURNAL, JSON.stringify(entries));
}

// ------------------------------------------------------------------
// Public API
// ------------------------------------------------------------------

/**
 * Add one entry to the journal. Called by:
 *   - manual buy/sell handler in main.js  (source = 'manual')
 *   - executeDecision() in autopilot.js   (source = 'autopilot')
 *
 * @param {object} opts
 *   type            'BUY' | 'SELL' | 'ENTER' | 'ADD' | 'TRIM' | 'EXIT'
 *   ticker          e.g. 'TDY'
 *   price           close price at execution
 *   qty             number of shares
 *   ccy             'USD' | 'ZAR'
 *   reasoning       what the user typed (empty string for autopilot)
 *   autopilotContext the pilot's plain-English reason (empty for manual)
 *   source          'manual' | 'autopilot'
 */
export function addJournalEntry({ type, ticker, price, qty, ccy,
                                   reasoning, autopilotContext, source }) {
  const entries = loadJournal();
  entries.push({
    id:               Date.now(),
    date:             new Date().toISOString().slice(0, 10),
    type:             type             || 'TRADE',
    ticker:           ticker           || '',
    price:            price            || 0,
    qty:              qty              || 0,
    ccy:              ccy              || 'USD',
    reasoning:        reasoning        || '',
    autopilotContext: autopilotContext || '',
    source:           source           || 'manual'
  });
  saveJournal(entries);
  renderJournal();
}

/**
 * Return entries from the last N calendar days.
 * Default: 14 days (two trading weeks — enough for a pattern scan).
 */
export function getJournalEntries(daysBack = 14) {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - daysBack);
  const cutoffStr = cutoff.toISOString().slice(0, 10);
  return loadJournal().filter(e => e.date >= cutoffStr);
}

/** Return every entry ever recorded (used for full AI review). */
export function getAllJournalEntries() {
  return loadJournal();
}

/**
 * Wipe all journal entries after user confirmation.
 */
export function clearJournal() {
  if (!confirm('Clear all journal entries? This cannot be undone.')) return;
  saveJournal([]);
  renderJournal();
}

// ------------------------------------------------------------------
// Rendering
// ------------------------------------------------------------------

/**
 * Render the journal panel. Called after addJournalEntry(), clearJournal(),
 * and on every render() cycle (cheap — just DOM writes).
 */
export function renderJournal() {
  const container = document.getElementById('journal-entries');
  if (!container) return;

  const entries = loadJournal().slice().reverse(); // most recent first

  if (entries.length === 0) {
    container.innerHTML =
      '<p style="color:var(--muted);font-style:italic;font-size:13px;margin:8px 0 0">' +
      'No trades recorded yet. Make a buy or sell and write down why — ' +
      'that reasoning is your real education.' +
      '</p>';
    return;
  }

  container.innerHTML = '';
  for (const e of entries) {
    const div = document.createElement('div');
    div.className = 'journal-entry';

    const isEntry   = ['BUY','ENTER','ADD'].includes(e.type);
    const typeColor = isEntry ? 'var(--green)' : 'var(--red)';
    const ccyPfx    = e.ccy === 'USD' ? '$' : 'R';
    const srcTag    = e.source === 'autopilot'
      ? '<span style="font-size:10px;color:var(--purple);margin-left:6px;' +
        'border:1px solid var(--purple);border-radius:3px;padding:1px 4px">PILOT</span>'
      : '<span style="font-size:10px;color:var(--gold);margin-left:6px;' +
        'border:1px solid var(--gold);border-radius:3px;padding:1px 4px">MANUAL</span>';

    let html =
      '<div class="je-header">' +
        '<span class="je-date">'   + _esc(e.date)                       + '</span>' +
        '<span class="je-ticker">' + _esc(e.ticker)                     + '</span>' +
        '<span class="je-type" style="color:' + typeColor + ';font-weight:700">' +
          _esc(e.type) +
        '</span>' +
        '<span class="je-qty">'    + e.qty + ' @ ' + ccyPfx + Number(e.price).toFixed(2) + '</span>' +
        srcTag +
      '</div>';

    if (e.reasoning) {
      html += '<div class="je-reasoning">' +
                '<b style="color:var(--cream)">Why:</b> ' + _esc(e.reasoning) +
              '</div>';
    }

    if (e.autopilotContext) {
      html += '<div class="je-pilot-ctx">' +
                '<b style="color:var(--muted)">Pilot logic:</b> ' + _esc(e.autopilotContext) +
              '</div>';
    }

    if (!e.reasoning && !e.autopilotContext) {
      html += '<div class="je-reasoning" style="color:var(--muted);font-style:italic">' +
                'No reasoning recorded.' +
              '</div>';
    }

    div.innerHTML = html;
    container.appendChild(div);
  }
}

// ------------------------------------------------------------------
// Safety helper — prevent XSS from user-typed reasoning
// ------------------------------------------------------------------

function _esc(str) {
  return String(str || '')
    .replace(/&/g,  '&amp;')
    .replace(/</g,  '&lt;')
    .replace(/>/g,  '&gt;')
    .replace(/"/g,  '&quot;');
}
