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

import { TICKERS, LS_PROXY, LS_YAHOO_PROXY, LS_FX, TF_STEPS } from './config.js';
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
         updateTradeTooltips, trade, addAlert,
         recordEquitySnapshot }                         from './portfolio.js';
import { askClaude }                                   from './ai.js';
import { pilotEngage, pilotDisengage, renderPilot,
         updateAutopilotUI, isAutopilotEngaged,
         resetAutopilotState }                         from './autopilot.js';
import { renderAnalogs }                               from './analogs.js';
import { initReplay, setupReplayMode, enterReplay,
         updateReplayUI }                              from './replay.js';
import { addJournalEntry, renderJournal, clearJournal,
         getAllJournalEntries }                          from './journal.js';
import { renderCrashes, showCrashContext,
         hideCrashContext }                              from './crashes.js';
import { renderCurriculum, closeLesson }               from './curriculum.js';

// ------------------------------------------------------------------
// Core render function — redraws everything visible on screen
// ------------------------------------------------------------------

export function render() {
  try {
    _renderInner();
    // If a previous crash banner was showing, hide it on successful render
    const prev = document.getElementById('render-error');
    if (prev) prev.style.display = 'none';
  } catch (err) {
    console.error('[FJC Lab] render() crashed:', err);
    // Surface a readable banner so the screen is never silently blank
    let overlay = document.getElementById('render-error');
    if (!overlay) {
      overlay = document.createElement('div');
      overlay.id = 'render-error';
      overlay.style.cssText =
        'position:fixed;top:0;left:0;right:0;z-index:9999;' +
        'background:#1a0808;border-bottom:2px solid #e0524d;' +
        'padding:12px 20px;font-family:monospace;font-size:13px;color:#f0e6c8';
      document.body.appendChild(overlay);
    }
    overlay.innerHTML =
      '<b style="color:#e0524d">⚠ FJC Lab — render error</b>: ' +
      (err && err.message ? err.message : String(err)) +
      ' <span style="color:#8a94a8;font-size:11px">' +
        '— open DevTools console for full stack · reload to recover' +
      '</span>' +
      '<button onclick="this.parentElement.style.display=\'none\'" ' +
        'style="float:right;background:none;border:1px solid #555;' +
        'color:#888;cursor:pointer;padding:2px 8px;border-radius:3px">×</button>';
    overlay.style.display = '';
  }
}

function _renderInner() {
  const t = TICKERS.find(x => x.sym === state.active);
  document.getElementById('lbl-ticker').textContent = t.sym;

  const all    = state.data[state.active];
  const allLen = all.length;

  // Pan offset — clamp to valid range so we never go before the first candle
  const maxOff     = Math.max(0, allLen - state.timeframe);
  const off        = Math.max(0, Math.min(state.viewOffset || 0, maxOff));
  state.viewOffset = off;                         // write back clamped value

  // Compute the visible window respecting the pan offset
  const visStart   = Math.max(0, allLen - state.timeframe - off);
  const visEnd     = off > 0 ? allLen - off : allLen;
  const visible    = all.slice(visStart, visEnd);
  const sliceStart = visStart;

  const allCloses  = all.map(c => c.c);

  // Compute full-series indicators then slice to the visible window
  const ma50full  = sma(allCloses, 50);
  const ma200full = sma(allCloses, 200);
  const bbFull    = bollinger(allCloses, 20, 2);
  const rsiFull   = rsi(allCloses, 14);

  const ma50   = ma50full .slice(sliceStart, sliceStart + visible.length);
  const ma200  = ma200full.slice(sliceStart, sliceStart + visible.length);
  const bbUp   = bbFull.up.slice(sliceStart, sliceStart + visible.length);
  const bbDn   = bbFull.dn.slice(sliceStart, sliceStart + visible.length);
  const rsiArr = rsiFull  .slice(sliceStart, sliceStart + visible.length);

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

  // R:R calculator — auto-populate entry from latest close
  const lastClose = all[all.length - 1]?.c;
  if (lastClose) updateRRCalc(lastClose);

  // Equity curve sparkline + performance stats
  renderEquityCurve();

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
// Volatility Ranking table (Learn tab)
// ------------------------------------------------------------------

function renderVolRanking() {
  const el = document.getElementById('vol-ranking-table');
  if (!el) return;

  // Sort TICKERS descending by vol
  const sorted = [...TICKERS].sort((a, b) => b.vol - a.vol);
  const maxVol = sorted[0].vol;

  // Category colour map for badges
  const CAT_COLOUR = {
    crypto: '#b08bff', forex: '#5aa8ff', commodity: '#c9a84c',
    equity: '#26a96c', index: '#5aa8ff', global: '#3a9fd8',
    jse: '#e8a84c'
  };

  // Risk tier labels
  function tier(v) {
    if (v >= 0.05) return { label:'Extreme', c:'#e0524d' };
    if (v >= 0.025) return { label:'High',   c:'#e07a3d' };
    if (v >= 0.015) return { label:'Medium', c:'#c9a84c' };
    return             { label:'Low',    c:'#26a96c' };
  }

  let html = `<table style="width:100%;border-collapse:collapse;font-size:12px">
    <thead><tr style="color:var(--muted);text-align:left;border-bottom:1px solid var(--line)">
      <th style="padding:4px 6px">Symbol</th>
      <th style="padding:4px 6px">Daily Vol</th>
      <th style="padding:4px 6px;width:35%">Risk Meter</th>
      <th style="padding:4px 6px">Tier</th>
    </tr></thead><tbody>`;

  for (const t of sorted) {
    const pct  = (t.vol * 100).toFixed(2);
    const barW = Math.round((t.vol / maxVol) * 100);
    const tk   = tier(t.vol);
    const cc   = CAT_COLOUR[t.cat] || 'var(--muted)';
    const barC = tk.c;

    html += `<tr style="border-bottom:1px solid rgba(255,255,255,.04)" title="${t.name} — ${t.desc || ''}">
      <td style="padding:5px 6px">
        <b style="color:var(--text)">${t.sym}</b>
        <span style="color:${cc};font-size:10px;margin-left:4px;text-transform:uppercase">${t.cat}</span>
      </td>
      <td style="padding:5px 6px;color:var(--cream);font-weight:700">${pct}%</td>
      <td style="padding:5px 6px">
        <div style="height:6px;border-radius:3px;background:rgba(255,255,255,.08);position:relative">
          <div style="height:100%;border-radius:3px;width:${barW}%;background:${barC};transition:width .5s ease"></div>
        </div>
      </td>
      <td style="padding:5px 6px;font-weight:700;color:${tk.c}">${tk.label}</td>
    </tr>`;
  }

  html += `</tbody></table>
    <p style="font-size:11px;color:var(--muted);margin:10px 0 0;line-height:1.6">
      <b style="color:var(--gold)">Daily vol</b> = typical one-day price swing as % of price.
      Hover any row to see the instrument's full description.
      A 5% daily vol means the price commonly moves 5% in a single session —
      ETH and BTC can exceed this routinely.
    </p>`;

  el.innerHTML = html;
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

  // ── Market Regime ── computed from 4 factors
  // 1. Trend direction (above/below MA200)
  // 2. MA cross (golden/death/neutral)
  // 3. RSI zone
  // 4. Recent volatility vs 90-day average ATR (high-vol regime detection)
  const recentCloses = all.slice(-20).map(c => c.c);
  const avgMove20    = recentCloses.length > 1
    ? recentCloses.reduce((sum, _, i, a) => i === 0 ? sum : sum + Math.abs((a[i] - a[i-1]) / a[i-1]), 0) / (recentCloses.length - 1)
    : 0;
  const avgMove90    = all.length > 90
    ? all.slice(-90).reduce((sum, _, i, a) => i === 0 ? sum : sum + Math.abs((a[i].c - a[i-1].c) / a[i-1].c), 0) / 89
    : avgMove20;
  const highVol      = avgMove20 > avgMove90 * 1.5;

  let regime, regimeClass, regimeTip;
  if (highVol && !trendUp) {
    regime      = '🔴 BEAR + HIGH VOL';
    regimeClass = 'red';
    regimeTip   = 'Downtrend AND elevated volatility — the most dangerous regime. Price is falling faster than usual. Risk is highest here. Reduce position sizes, widen stops, or step aside entirely.';
  } else if (highVol && trendUp) {
    regime      = '⚡ BULL + HIGH VOL';
    regimeClass = 'gold';
    regimeTip   = 'Uptrend but elevated volatility — a strong move with wide daily swings. Could be a late-stage breakout or a topping process. The trend is your friend but the ride is rough. Keep stops wider than usual.';
  } else if (trendUp && cross === 'GOLDEN') {
    regime      = '🟢 BULL TREND';
    regimeClass = 'green';
    regimeTip   = 'Golden Cross active (MA50 > MA200) with price above MA200 — the classic bull trend regime. Historically the best time to own the asset. Favour buying dips to the MA50 or MA200.';
  } else if (!trendUp && cross === 'DEATH') {
    regime      = '🔴 BEAR TREND';
    regimeClass = 'red';
    regimeTip   = 'Death Cross active (MA50 < MA200) with price below MA200 — confirmed bear trend. Rallies tend to fail at moving averages. Favour staying flat or short, tight stops on any long.';
  } else if (trendUp) {
    regime      = '📈 UPTREND';
    regimeClass = 'green';
    regimeTip   = 'Price above MA200 — the primary trend is up. No confirmed cross signal yet, but the long-term bias is bullish. Normal volatility, normal risk.';
  } else if (!trendUp && rsiL < 35) {
    regime      = '🔄 OVERSOLD';
    regimeClass = 'gold';
    regimeTip   = 'Price below MA200 (downtrend) but RSI is approaching oversold territory — a potential mean-reversion bounce setup. Not a trend reversal signal, but may offer a short-term trading opportunity with tight risk.';
  } else {
    regime      = '📉 DOWNTREND';
    regimeClass = 'red';
    regimeTip   = 'Price below MA200 — the primary trend is down. Lower highs and lower lows are the pattern to watch. Buyers beware: the trend is your enemy until a Golden Cross confirms recovery.';
  }

  const regimeChip = chip('Regime', regime, regimeClass);
  regimeChip.dataset.tip = regimeTip;
  regimeChip.style.minWidth = '140px';
  sig.appendChild(regimeChip);

  const overall = trendUp && rsiL < 70 ? 'Buy lean' : !trendUp && rsiL > 30 ? 'Caution' : 'Mixed';
  sig.appendChild(chip('Signal', overall, trendUp ? 'green' : 'gold'));
}

// ------------------------------------------------------------------
// Tab bar — one button per ticker, with search + category filter
// ------------------------------------------------------------------

// Active category filter ('' = all)
let _tabCat = '';

function buildTabs() {
  const tabs    = document.getElementById('tabs');
  const search  = (document.getElementById('instrument-search')?.value || '').toLowerCase().trim();
  const infoEl  = document.getElementById('ticker-info-strip');
  const countEl = document.getElementById('instrument-count');

  tabs.innerHTML = '';

  const visible = TICKERS.filter(t => {
    const catMatch = !_tabCat || t.cat === _tabCat;
    if (!catMatch) return false;
    if (!search) return true;
    const haystack = [t.sym, t.name, t.exch, t.cat, t.desc || ''].join(' ').toLowerCase();
    return haystack.includes(search);
  });

  for (const t of visible) {
    const b = document.createElement('button');
    b.className   = 'tab' + (state.active === t.sym ? ' active' : '');
    b.textContent = t.sym + '  ' + t.name;
    if (t.desc) b.dataset.tip = t.desc;
    b.onclick = () => {
      state.active     = t.sym;
      state.viewOffset = 0;
      // Cinematic fade between tickers
      const cv = document.getElementById('price-chart');
      if (cv) { cv.classList.remove('chart-fade'); void cv.offsetWidth; cv.classList.add('chart-fade'); }
      // Reset R:R entry so next render auto-populates from new ticker's close
      const rrE = document.getElementById('rr-entry');
      if (rrE) { rrE.value = ''; delete rrE.dataset.userEdited; }
      render();
      buildTabs();
      updateReplayUI();
    };
    tabs.appendChild(b);
  }

  // Count badge
  if (countEl) {
    if (visible.length < TICKERS.length) {
      countEl.textContent = `${visible.length} of ${TICKERS.length} instruments`;
    } else {
      countEl.textContent = `${TICKERS.length} instruments`;
    }
  }

  // Info strip — show active ticker's description
  if (infoEl) {
    const active = TICKERS.find(t => t.sym === state.active);
    if (active?.desc) {
      const catLabels = { equity:'📈 Equity', index:'📊 Index', global:'🌍 Global', jse:'🇿🇦 JSE', commodity:'⛏ Commodity', crypto:'₿ Crypto', forex:'💱 Forex' };
      const badge = catLabels[active.cat] || active.exch;
      infoEl.style.display = '';
      infoEl.innerHTML = `<span style="color:var(--gold);font-weight:700;margin-right:8px">${active.sym}</span><span style="color:var(--muted);font-size:11px;margin-right:10px">${badge} · ${active.exch} · ${active.ccy}</span><span style="color:var(--muted)">${active.desc}</span>`;
    } else {
      infoEl.style.display = 'none';
    }
  }
}

// Wire search input + autocomplete dropdown + clear + category filter chips
function bindSearchBar() {
  const input    = document.getElementById('instrument-search');
  const clearBtn = document.getElementById('instrument-search-clear');
  const dropdown = document.getElementById('instrument-dropdown');

  if (!input || !dropdown) return;

  const CAT_COLOURS = {
    equity:'#5aa8ff', index:'var(--gold)', global:'var(--purple)',
    jse:'var(--green)', commodity:'#c87941', crypto:'#ff8c5a', forex:'var(--muted)'
  };
  const CAT_LABELS = {
    equity:'Equity', index:'Index', global:'Global',
    jse:'JSE', commodity:'Commodity', crypto:'Crypto', forex:'Forex'
  };

  let focusIdx = -1; // keyboard nav index

  function getMatches(q) {
    const s = q.toLowerCase().trim();
    if (!s) return [];
    return TICKERS.filter(t => {
      const catOk = !_tabCat || t.cat === _tabCat;
      if (!catOk) return false;
      const hay = [t.sym, t.name, t.exch, t.cat, t.desc || ''].join(' ').toLowerCase();
      return hay.includes(s);
    });
  }

  function showDropdown(matches) {
    dropdown.innerHTML = '';
    focusIdx = -1;
    if (!matches.length) {
      dropdown.style.display = 'none';
      return;
    }
    matches.forEach((t, i) => {
      const item = document.createElement('div');
      item.className = 'inst-opt';
      const col   = CAT_COLOURS[t.cat] || 'var(--muted)';
      const label = CAT_LABELS[t.cat]  || t.exch;
      const desc  = t.desc ? t.desc.slice(0, 160) + (t.desc.length > 160 ? '…' : '') : '';
      item.innerHTML =
        `<div class="inst-opt-sym">${t.sym}<br><span style="font-size:10px;color:var(--muted);font-weight:400">${t.exch}</span></div>` +
        `<div style="flex:1;min-width:0">` +
          `<div class="inst-opt-name">${t.name}<span class="inst-opt-badge" style="color:${col};border:1px solid ${col}">${label}</span></div>` +
          `<div class="inst-opt-desc">${desc}</div>` +
        `</div>`;
      item.addEventListener('mousedown', (e) => {
        e.preventDefault(); // keep input focus
        selectInstrument(t.sym);
      });
      dropdown.appendChild(item);
    });
    dropdown.style.display = '';
  }

  function hideDropdown() {
    dropdown.style.display = 'none';
    focusIdx = -1;
  }

  function selectInstrument(sym) {
    state.active     = sym;
    state.viewOffset = 0;
    input.value      = '';
    clearBtn.style.display = 'none';
    hideDropdown();
    const cv = document.getElementById('price-chart');
    if (cv) { cv.classList.remove('chart-fade'); void cv.offsetWidth; cv.classList.add('chart-fade'); }
    buildTabs();
    render();
    updateReplayUI();
    // Scroll the active tab into view
    setTimeout(() => {
      document.querySelector('.tab.active')?.scrollIntoView({ block:'nearest', inline:'center' });
    }, 50);
  }

  // Typing — show dropdown + filter tabs
  input.addEventListener('input', () => {
    const q = input.value;
    clearBtn.style.display = q ? '' : 'none';
    const matches = getMatches(q);
    if (q) {
      showDropdown(matches);
    } else {
      hideDropdown();
    }
    buildTabs(); // also filter the persistent tab bar
  });

  // Keyboard nav inside dropdown
  input.addEventListener('keydown', (e) => {
    const items = dropdown.querySelectorAll('.inst-opt');
    if (!items.length) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      focusIdx = Math.min(focusIdx + 1, items.length - 1);
      items.forEach((el, i) => el.classList.toggle('focused', i === focusIdx));
      items[focusIdx]?.scrollIntoView({ block:'nearest' });
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      focusIdx = Math.max(focusIdx - 1, 0);
      items.forEach((el, i) => el.classList.toggle('focused', i === focusIdx));
      items[focusIdx]?.scrollIntoView({ block:'nearest' });
    } else if (e.key === 'Enter') {
      if (focusIdx >= 0 && items[focusIdx]) {
        const syms = getMatches(input.value).map(t => t.sym);
        if (syms[focusIdx]) selectInstrument(syms[focusIdx]);
      } else {
        // Enter with no keyboard focus — pick first match
        const first = getMatches(input.value)[0];
        if (first) selectInstrument(first.sym);
      }
    } else if (e.key === 'Escape') {
      hideDropdown();
      input.blur();
    }
  });

  // Close dropdown when clicking anywhere else
  document.addEventListener('click', (e) => {
    if (!document.getElementById('search-wrap')?.contains(e.target)) hideDropdown();
  });

  // Clear button
  clearBtn?.addEventListener('click', () => {
    input.value = '';
    clearBtn.style.display = 'none';
    hideDropdown();
    buildTabs();
  });

  // Category filter chips
  document.querySelectorAll('.cat-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      _tabCat = btn.dataset.cat;
      document.querySelectorAll('.cat-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const q = input.value;
      if (q) showDropdown(getMatches(q));
      buildTabs();
    });
  });
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

  // ---- Zoom buttons (also wired to scroll wheel in chart.js) ----
  function _setTf(newTf) {
    state.timeframe = newTf;
    document.querySelectorAll('#tf button').forEach(b => {
      b.classList.toggle('on', +b.dataset.tf === newTf);
    });
    render();
  }
  document.getElementById('btn-zoom-in').onclick = () => {
    const idx = TF_STEPS.indexOf(state.timeframe);
    if (idx > 0) _setTf(TF_STEPS[idx - 1]);
  };
  document.getElementById('btn-zoom-out').onclick = () => {
    const idx = TF_STEPS.indexOf(state.timeframe);
    if (idx < TF_STEPS.length - 1) _setTf(TF_STEPS[idx + 1]);
  };

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

  // ---- Risk / Reward Calculator ----
  // Mark entry as user-edited so auto-populate stops overwriting it
  const rrEntry = document.getElementById('rr-entry');
  if (rrEntry) {
    rrEntry.addEventListener('input', () => {
      rrEntry.dataset.userEdited = '1';
      updateRRCalc();
    });
  }
  ['rr-stop','rr-tp','rr-qty'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.addEventListener('input', () => updateRRCalc());
  });

  // Position sizer inputs
  const psPort = document.getElementById('ps-portfolio');
  if (psPort) psPort.addEventListener('input', () => { psPort.dataset.userEdited = '1'; updateRRCalc(); });
  const psRisk = document.getElementById('ps-risk-pct');
  if (psRisk) psRisk.addEventListener('input', () => updateRRCalc());

  // ---- AI buttons ----
  document.getElementById('btn-analyse')      .onclick = () => askClaude('analyse');
  document.getElementById('btn-briefing')     .onclick = () => askClaude('briefing');
  document.getElementById('btn-journal-review').onclick = () => askClaude('journal-review');

  // ---- Decision Journal ----
  document.getElementById('btn-clear-journal').onclick = clearJournal;

  document.getElementById('btn-export-journal').onclick = () => {
    const entries = getAllJournalEntries();
    if (!entries.length) { alert('No journal entries to export yet.'); return; }

    const ESC = (v) => '"' + String(v ?? '').replace(/"/g, '""') + '"';
    const header = ['Date','Type','Ticker','Price','Qty','Currency','P/L','Reasoning','Source'];
    const rows   = entries.map(e => [
      ESC(e.date || ''),
      ESC(e.type || ''),
      ESC(e.ticker || ''),
      ESC(e.price != null ? e.price.toFixed(2) : ''),
      ESC(e.qty  != null ? e.qty  : ''),
      ESC(e.ccy  || ''),
      ESC(e.pl   != null ? e.pl.toFixed(2) : ''),
      ESC(e.reasoning || ''),
      ESC(e.source || 'manual')
    ].join(','));

    const csv  = [header.join(','), ...rows].join('\r\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href     = url;
    a.download = 'fjc-trading-journal-' + new Date().toISOString().slice(0,10) + '.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

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
      'The Yahoo proxy should be pre-configured automatically. ' +
      'If you see this message, try refreshing the page.'
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

  // Calculate a timeframe that fits the FULL story on screen:
  // crash onset → last available data candle (so recovery is always visible).
  const latestDate    = candles.length > 0 ? candles[candles.length - 1].d : scenario.endDate;
  const calDaysTotal  = latestDate
    ? Math.round((new Date(latestDate) - new Date(scenario.startDate)) / 86400000)
    : 730;
  // Trading days ≈ calDays × 5/7, add 15% padding so onset isn't right at the edge
  const newTf = Math.max(365, Math.min(1500, Math.round(calDaysTotal * 5 / 7 * 1.15)));

  state.timeframe = newTf;
  // Highlight the closest standard TF button as a reference point
  const closestTf = TF_STEPS.reduce((a, b) => Math.abs(b - newTf) < Math.abs(a - newTf) ? b : a);
  document.querySelectorAll('#tf button').forEach(b => {
    b.classList.toggle('on', +b.dataset.tf === closestTf);
  });

  // Reset pan so the crash opens at the right position
  state.viewOffset = 0;

  // Activate crash study state so chart.js draws the crash zone overlay
  state.crashStudy = scenario;

  // Show the setting-the-scene context panel above the chart
  showCrashContext(scenario);

  // Override the close button so it also clears crashStudy + redraws
  const ccClose = document.getElementById('crash-context-close');
  if (ccClose) ccClose.onclick = () => {
    hideCrashContext();
    state.crashStudy = null;
    render();
  };

  // Position replay at the LAST available data point so the full story
  // (crash onset → trough → full recovery) is always accessible.
  // The dynamic timeframe calculated above fits the entire window on screen.
  const replayTarget = latestDate || scenario.startDate;
  jumpToAnalog(scenario.ticker, replayTarget);

  // Scroll to the top so the user sees the chart + context panel + replay controls.
  // Without this the user clicks from the bottom of the page and sees no visual change.
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

// ------------------------------------------------------------------
// Portfolio Equity Curve + Performance Stats
// ------------------------------------------------------------------

function renderEquityCurve() {
  const cv = document.getElementById('equity-curve');
  if (!cv) return;
  const hist = state.portfolio.history || [];
  const ctx  = cv.getContext('2d');
  const W = cv.width, H = cv.height;
  ctx.clearRect(0, 0, W, H);

  // Always need at least 2 points to draw a line
  const pts = hist.length >= 2 ? hist : null;

  // ── Performance stats ──
  const startVal = 100000;
  let mv = 0;
  for (const t of TICKERS) {
    const pos = state.portfolio.positions[t.sym];
    if (!pos || pos.shares === 0) continue;
    const last = state.data[t.sym]?.[state.data[t.sym].length - 1]?.c || 0;
    mv += pos.shares * last;
  }
  const currentTotal = state.portfolio.cash + mv;
  const totalReturn  = ((currentTotal - startVal) / startVal) * 100;

  // Max drawdown from history
  let maxDD = 0;
  if (hist.length > 1) {
    let peak = hist[0].total;
    for (const h of hist) {
      if (h.total > peak) peak = h.total;
      const dd = (peak - h.total) / peak * 100;
      if (dd > maxDD) maxDD = dd;
    }
  }

  // Trade count from journal
  let tradeCount = 0;
  try {
    const entries = JSON.parse(localStorage.getItem('fjc-trading-journal-v1')) || [];
    tradeCount = entries.filter(e => e.type === 'BUY' || e.type === 'SELL').length;
  } catch(_) {}

  // Update text stats
  const retEl = document.getElementById('p-return');
  if (retEl) {
    retEl.textContent = (totalReturn >= 0 ? '+' : '') + totalReturn.toFixed(2) + '%';
    retEl.style.color = totalReturn > 0 ? 'var(--green)' : totalReturn < 0 ? 'var(--red)' : 'var(--muted)';
  }
  const ddEl = document.getElementById('p-maxdd');
  if (ddEl) {
    ddEl.textContent = '-' + maxDD.toFixed(2) + '%';
    ddEl.style.color = maxDD > 10 ? 'var(--red)' : maxDD > 5 ? 'var(--gold)' : 'var(--green)';
  }
  const trdEl = document.getElementById('p-trades');
  if (trdEl) trdEl.textContent = tradeCount;

  // ── Sparkline ──
  if (!pts) {
    // No history yet — draw a flat baseline
    ctx.strokeStyle = 'rgba(138,148,168,.4)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(4, H / 2); ctx.lineTo(W - 4, H / 2);
    ctx.stroke();
    return;
  }

  const vals   = pts.map(p => p.total);
  const lo     = Math.min(...vals);
  const hi     = Math.max(...vals);
  const range  = hi - lo || 1;
  const pad    = 4;
  const dw     = (W - pad * 2) / (pts.length - 1);
  const isUp   = vals[vals.length - 1] >= vals[0];
  const lineC  = isUp ? '#26a96c' : '#e0524d';
  const fillC  = isUp ? 'rgba(38,169,108,' : 'rgba(224,82,77,';

  // Gradient fill under the curve
  const grad = ctx.createLinearGradient(0, pad, 0, H - pad);
  grad.addColorStop(0,   fillC + '0.25)');
  grad.addColorStop(1,   fillC + '0.02)');

  ctx.beginPath();
  ctx.moveTo(pad, H - pad - ((vals[0] - lo) / range) * (H - pad * 2));
  for (let i = 1; i < pts.length; i++) {
    const x = pad + i * dw;
    const y = H - pad - ((vals[i] - lo) / range) * (H - pad * 2);
    ctx.lineTo(x, y);
  }
  // Close for fill
  ctx.lineTo(pad + (pts.length - 1) * dw, H - pad);
  ctx.lineTo(pad, H - pad);
  ctx.closePath();
  ctx.fillStyle = grad;
  ctx.fill();

  // Draw the line on top
  ctx.beginPath();
  ctx.moveTo(pad, H - pad - ((vals[0] - lo) / range) * (H - pad * 2));
  for (let i = 1; i < pts.length; i++) {
    const x = pad + i * dw;
    const y = H - pad - ((vals[i] - lo) / range) * (H - pad * 2);
    ctx.lineTo(x, y);
  }
  ctx.strokeStyle = lineC;
  ctx.lineWidth   = 1.5;
  ctx.lineJoin    = 'round';
  ctx.stroke();

  // Terminal dot
  const lastX = pad + (pts.length - 1) * dw;
  const lastY = H - pad - ((vals[vals.length - 1] - lo) / range) * (H - pad * 2);
  ctx.beginPath();
  ctx.arc(lastX, lastY, 2.5, 0, Math.PI * 2);
  ctx.fillStyle = lineC;
  ctx.fill();
}

// ------------------------------------------------------------------
// Correlation Matrix
// ------------------------------------------------------------------

function renderCorrelationMatrix() {
  const wrap = document.getElementById('corr-matrix-wrap');
  if (!wrap) return;

  const N = 252; // 1 year of trading days

  // Compute daily returns for each ticker from the last N+1 closes
  const returns = {};
  for (const t of TICKERS) {
    const all = state.data[t.sym];
    if (!all || all.length < N + 1) { returns[t.sym] = []; continue; }
    const slice = all.slice(all.length - N - 1);
    returns[t.sym] = [];
    for (let i = 1; i < slice.length; i++) {
      returns[t.sym].push((slice[i].c - slice[i - 1].c) / slice[i - 1].c);
    }
  }

  // Pearson correlation between two series of equal length
  function pearson(a, b) {
    const n = Math.min(a.length, b.length);
    if (n < 10) return 0;
    let sumA = 0, sumB = 0;
    for (let i = 0; i < n; i++) { sumA += a[i]; sumB += b[i]; }
    const mA = sumA / n, mB = sumB / n;
    let num = 0, dA = 0, dB = 0;
    for (let i = 0; i < n; i++) {
      const da = a[i] - mA, db = b[i] - mB;
      num += da * db; dA += da * da; dB += db * db;
    }
    const denom = Math.sqrt(dA * dB);
    return denom === 0 ? 0 : num / denom;
  }

  // Correlation colour: green (+), white (0), red (-)
  function corrColor(r) {
    const abs = Math.abs(r);
    if (r >= 0) {
      // white → emerald
      const g = Math.round(169 + (255 - 169) * (1 - abs));
      return `rgba(38,${g},108,${0.15 + abs * 0.75})`;
    } else {
      // white → red
      const r2 = Math.round(224 + (255 - 224) * (1 - abs));
      return `rgba(${r2},82,77,${0.15 + abs * 0.7})`;
    }
  }

  const syms = TICKERS.map(t => t.sym);
  const CELL = 14; // px per cell

  let html = `<table class="corr-table"><thead><tr><th></th>`;
  for (const s of syms) html += `<th style="writing-mode:vertical-rl;transform:rotate(180deg);height:52px;vertical-align:bottom;padding-bottom:3px;font-size:8px">${s}</th>`;
  html += `</tr></thead><tbody>`;

  for (const rowSym of syms) {
    html += `<tr><td class="corr-row-label">${rowSym}</td>`;
    for (const colSym of syms) {
      if (rowSym === colSym) {
        html += `<td class="corr-self" title="${rowSym} vs ${rowSym}: 1.00 (self)" style="width:${CELL}px;height:${CELL}px"></td>`;
      } else {
        const r = pearson(returns[rowSym], returns[colSym]);
        const rStr = r.toFixed(2);
        const bg = corrColor(r);
        html += `<td style="background:${bg};width:${CELL}px;height:${CELL}px"
          title="${rowSym} vs ${colSym}: ${rStr}"></td>`;
      }
    }
    html += `</tr>`;
  }

  html += `</tbody></table>
    <p style="font-size:11px;color:var(--muted);margin:8px 0 0;line-height:1.5">
      Hover any cell to see the exact correlation coefficient. Built from ${N} synthetic daily returns.
      <b style="color:var(--gold)">Note:</b> In real markets, correlations change — especially in a crisis, when selling pressure makes everything move together.
    </p>`;

  wrap.innerHTML = html;
}

// ------------------------------------------------------------------
// Risk / Reward Calculator
// ------------------------------------------------------------------

/**
 * Recalculate and display R:R results whenever any input changes,
 * and auto-populate entry price from the latest close on render.
 * @param {number|null} closePrice  — latest close; null = recalc only
 */
function updateRRCalc(closePrice = null) {
  const entryEl  = document.getElementById('rr-entry');
  const stopEl   = document.getElementById('rr-stop');
  const tpEl     = document.getElementById('rr-tp');
  const qtyEl    = document.getElementById('rr-qty');
  const resultsEl= document.getElementById('rr-results');
  if (!entryEl) return;

  // Auto-fill entry from latest close when switching tickers (but don't
  // clobber a value the user has already typed in this session).
  if (closePrice !== null && !entryEl.dataset.userEdited) {
    entryEl.value = closePrice;
  }

  const entry = parseFloat(entryEl.value);
  const stop  = parseFloat(stopEl.value);
  const tp    = parseFloat(tpEl.value);
  const qty   = parseInt(qtyEl.value) || 1;

  if (!entry || !stop || !tp || isNaN(entry) || isNaN(stop) || isNaN(tp)) {
    if (resultsEl) resultsEl.style.display = 'none';
    return;
  }

  const riskPerShare   = Math.abs(entry - stop);
  const rewardPerShare = Math.abs(tp - entry);
  if (riskPerShare === 0) { if (resultsEl) resultsEl.style.display = 'none'; return; }

  const ratio     = rewardPerShare / riskPerShare;
  const totalRisk = riskPerShare * qty;
  const cash      = state.portfolio.cash + Object.values(state.portfolio.positions)
                      .reduce((s, p) => s + (p.shares || 0) * p.avg, 0);
  const pctRisk   = cash > 0 ? (totalRisk / cash) * 100 : 0;

  // Determine currency prefix from active ticker
  const t   = TICKERS.find(x => x.sym === state.active) || {};
  const pfx = t.ccy === 'ZAR' ? 'R ' : '$ ';
  const fmt = (n) => pfx + n.toLocaleString('en-ZA', { minimumFractionDigits:2, maximumFractionDigits:2 });

  // ── Update DOM ──
  if (resultsEl) resultsEl.style.display = '';

  // Ratio display + colour
  const ratioVal = document.getElementById('rr-ratio-val');
  if (ratioVal) {
    ratioVal.textContent = ratio.toFixed(2) + ':1';
    ratioVal.style.color = ratio >= 2.5 ? 'var(--green)' : ratio >= 1.5 ? 'var(--gold)' : 'var(--red)';
  }

  // Bar (maps 0–3 R:R onto 0–100% width)
  const bar = document.getElementById('rr-bar');
  if (bar) {
    const pct = Math.min(100, (ratio / 3) * 100);
    bar.style.width = pct + '%';
    bar.style.background = ratio >= 2.5
      ? 'linear-gradient(90deg,var(--green),#32e08a)'
      : ratio >= 1.5
      ? 'linear-gradient(90deg,var(--gold),#f0c060)'
      : 'linear-gradient(90deg,var(--red),#ff8080)';
  }

  const el = (id, v) => { const e = document.getElementById(id); if (e) e.textContent = v; };
  el('rr-risk-share',   fmt(riskPerShare));
  el('rr-reward-share', fmt(rewardPerShare));
  el('rr-total-risk',   fmt(totalRisk));

  const pctEl = document.getElementById('rr-pct-risk');
  if (pctEl) {
    pctEl.textContent = pctRisk.toFixed(2) + '%';
    pctEl.style.color = pctRisk > 2 ? 'var(--red)' : pctRisk > 1 ? 'var(--gold)' : 'var(--green)';
  }

  // ── Position Sizer ──
  // Auto-populate portfolio value from paper portfolio
  const psPortEl = document.getElementById('ps-portfolio');
  if (psPortEl && !psPortEl.dataset.userEdited) {
    const mv2 = Object.entries(state.portfolio.positions).reduce((s, [sym, pos]) => {
      if (!pos || pos.shares === 0) return s;
      const last = state.data[sym]?.[state.data[sym].length - 1]?.c || 0;
      return s + pos.shares * last;
    }, 0);
    psPortEl.value = Math.round(state.portfolio.cash + mv2);
  }
  const psPortfolio = parseFloat(document.getElementById('ps-portfolio')?.value);
  const psRiskPct   = parseFloat(document.getElementById('ps-risk-pct')?.value) || 2;
  const psResult    = document.getElementById('ps-result');
  const pfxPS       = t.ccy === 'ZAR' ? 'R ' : '$ ';
  const fmtPS       = n => pfxPS + n.toLocaleString('en-ZA', {minimumFractionDigits:2,maximumFractionDigits:2});

  if (psPortfolio > 0 && riskPerShare > 0) {
    const maxRisk   = psPortfolio * (psRiskPct / 100);
    const maxShares = Math.floor(maxRisk / riskPerShare);
    const cost      = maxShares * entry;
    if (psResult) psResult.style.display = '';
    const setPS = (id, v) => { const e = document.getElementById(id); if (e) e.textContent = v; };
    setPS('ps-risk-amount', fmtPS(maxRisk));
    setPS('ps-max-shares',  maxShares.toLocaleString() + ' shares');
    setPS('ps-cost',        fmtPS(cost));
    const costEl = document.getElementById('ps-cost');
    if (costEl) costEl.style.color = cost > (state.portfolio.cash) ? 'var(--red)' : 'var(--green)';
  } else {
    if (psResult) psResult.style.display = 'none';
  }

  // Verdict banner
  const verdict = document.getElementById('rr-verdict');
  if (verdict) {
    if (ratio >= 2.5) {
      verdict.textContent = '✅ Excellent trade setup — reward significantly outweighs risk.';
      verdict.className   = 'rr-verdict good';
    } else if (ratio >= 1.5) {
      verdict.textContent = '⚠️ Acceptable setup — consider tightening stop or widening target.';
      verdict.className   = 'rr-verdict ok';
    } else {
      verdict.textContent = '🚫 Poor R:R — do not take this trade. The risk outweighs the reward.';
      verdict.className   = 'rr-verdict bad';
    }
    // Overlay 2% portfolio warning if needed
    if (pctRisk > 2) {
      verdict.textContent += '  |  ⚠️ You are risking more than 2% of your portfolio!';
    }
  }
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
  bindSearchBar();
  bindControls();
  updateClocks();
  setInterval(updateClocks, 30000);
  render();
  renderHistoricalEdge();
  updateAutopilotUI();
  updateTradeTooltips();
  renderCrashes(jumpToCrash);
  renderCurriculum();
  renderVolRanking();
  renderCorrelationMatrix();

  // Global keyboard shortcuts — skip when typing in an input field
  document.addEventListener('keydown', (e) => {
    // Always close lesson modal on Escape
    if (e.key === 'Escape') { closeLesson(); return; }

    // Skip all shortcuts when user is typing in an input / textarea / select
    const tag = e.target && e.target.tagName;
    if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;

    const k = e.key.toLowerCase();

    // B = Buy, S = Sell (only if not in replay so real decisions aren't accidental)
    if (k === 'b' && !e.ctrlKey && !e.metaKey) { e.preventDefault(); document.getElementById('btn-buy')?.click(); }
    if (k === 's' && !e.ctrlKey && !e.metaKey) { e.preventDefault(); document.getElementById('btn-sell')?.click(); }

    // 1-5 = timeframe shortcuts (30 / 90 / 180 / 365 / 730 days)
    const TF_MAP = { '1': 30, '2': 90, '3': 180, '4': 365, '5': 730 };
    if (TF_MAP[e.key]) {
      e.preventDefault();
      state.timeframe = TF_MAP[e.key];
      // Visually activate the matching timeframe button (uses class 'on' like the click handler)
      document.querySelectorAll('.timeframe button').forEach(btn => {
        btn.classList.toggle('on', parseInt(btn.dataset.tf) === TF_MAP[e.key]);
      });
      render();
    }

    // E = toggle Events overlay
    if (k === 'e') {
      e.preventDefault();
      state.indicators.events = !state.indicators.events;
      document.querySelectorAll('[data-ind="events"]').forEach(btn =>
        btn.classList.toggle('on', state.indicators.events)
      );
      render();
    }

    // ? = show/hide keyboard shortcut overlay
    if (e.key === '?') {
      e.preventDefault();
      const ov = document.getElementById('kb-overlay');
      if (ov) ov.style.display = ov.style.display === 'flex' ? 'none' : 'flex';
    }
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

// Redraw on window resize — debounced 100 ms so rapid resize events don't
// flood the render pipeline (common on desktop when dragging window edges).
let _resizeTimer = null;
window.addEventListener('resize', () => {
  clearTimeout(_resizeTimer);
  _resizeTimer = setTimeout(render, 100);
});

// Boot the app
init();
setupReplayMode();

// Auto-fetch live prices if the user already has a Yahoo proxy configured
if (state.yahooProxy) refreshAllFromYahoo(_onYahooSuccess);
