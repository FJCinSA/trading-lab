// ============================================================
// FJC Trading Lab — Canvas Chart Rendering
// ============================================================
// Draws three canvases: price (candlesticks + overlays),
// volume (bar chart with spike highlighting), RSI (line + zones).
//
// Dependency injection: call initChart(renderFn) once from main.js
// after render() is defined. The injected function is used in
// crosshair mousemove (needs to redraw before overlaying the cross)
// and in the S/R click handler (needs render after adding a line).
// ============================================================

import { state, saveSR }              from './state.js';
import { detectPatterns, detectActions } from './patterns.js';

// Injected render callback — set by initChart(), never null after boot
let _render = null;

// Last drawn chart geometry — used by showCrosshair() and S/R click
let chartGeom = null;

/**
 * Inject the main render function so chart event handlers can call it.
 * Must be called before any drawing occurs (i.e. before init()).
 * @param {function} renderFn
 */
export function initChart(renderFn) {
  _render = renderFn;
}

// ------------------------------------------------------------------
// Canvas utility
// ------------------------------------------------------------------

/** Size a canvas to match its CSS layout rect (prevents blurry pixels). */
export function fitCanvas(cv) {
  const r = cv.getBoundingClientRect();
  cv.width  = r.width;
  cv.height = r.height;
}

// ------------------------------------------------------------------
// Helper: draw a connected line from a sparse array (nulls skipped)
// ------------------------------------------------------------------

function drawLine(ctx, arr, padL, padT, w, h, lo, hi, n, color, lw) {
  ctx.strokeStyle = color;
  ctx.lineWidth   = lw;
  ctx.beginPath();
  let first = true;
  for (let i = 0; i < arr.length; i++) {
    if (arr[i] == null) continue;
    const x = padL + i * (w / n) + (w / n) / 2;
    const y = padT + h * (1 - (arr[i] - lo) / (hi - lo));
    if (first) { ctx.moveTo(x, y); first = false; } else ctx.lineTo(x, y);
  }
  ctx.stroke();
}

// ------------------------------------------------------------------
// Price / candlestick chart
// ------------------------------------------------------------------

/**
 * Draw the main price chart including candles, MA lines, Bollinger Bands,
 * support/resistance lines, pattern markers, and action markers.
 * Also wires up mouse and click event handlers.
 */
export function drawCandles(candles, ma50, ma200, bbUp, bbDn, rsiArr) {
  const cv = document.getElementById('price-chart');
  fitCanvas(cv);
  const ctx = cv.getContext('2d');
  const W = cv.width, H = cv.height;
  ctx.clearRect(0, 0, W, H);

  const padL = 50, padR = 12, padT = 14, padB = 22;
  const w = W - padL - padR, h = H - padT - padB;

  // Price range: include all drawn data + SR lines
  let lo = Infinity, hi = -Infinity;
  for (const c of candles) { if (c.l < lo) lo = c.l; if (c.h > hi) hi = c.h; }
  if (state.indicators.bb) {
    for (const v of bbUp) if (v != null && v > hi) hi = v;
    for (const v of bbDn) if (v != null && v < lo) lo = v;
  }
  if (state.indicators.ma200) {
    for (const v of ma200) if (v != null) { if (v < lo) lo = v; if (v > hi) hi = v; }
  }
  const sr = state.sr[state.active] || [];
  for (const v of sr) { if (v < lo) lo = v; if (v > hi) hi = v; }
  const pad = (hi - lo) * 0.08;
  lo -= pad; hi += pad;

  // Grid lines
  ctx.strokeStyle = '#1d2c4a'; ctx.fillStyle = '#8a94a8';
  ctx.font = '10px Inter,Arial'; ctx.lineWidth = 1;
  const gridLines = 5;
  for (let i = 0; i <= gridLines; i++) {
    const y = padT + (h * i / gridLines);
    const v = hi - (hi - lo) * (i / gridLines);
    ctx.beginPath(); ctx.moveTo(padL, y); ctx.lineTo(W - padR, y); ctx.stroke();
    ctx.fillText(v.toFixed(2), 4, y + 3);
  }

  // Candlestick bodies and wicks
  const cw = w / candles.length;
  const bw = Math.max(1, cw * 0.7);
  for (let i = 0; i < candles.length; i++) {
    const c  = candles[i];
    const x  = padL + i * cw + cw / 2;
    const yO = padT + h * (1 - (c.o - lo) / (hi - lo));
    const yC = padT + h * (1 - (c.c - lo) / (hi - lo));
    const yH = padT + h * (1 - (c.h - lo) / (hi - lo));
    const yL = padT + h * (1 - (c.l - lo) / (hi - lo));
    const up = c.c >= c.o;
    ctx.strokeStyle = up ? '#26a96c' : '#e0524d';
    ctx.fillStyle   = up ? '#26a96c' : '#e0524d';
    ctx.beginPath(); ctx.moveTo(x, yH); ctx.lineTo(x, yL); ctx.stroke();
    const top = Math.min(yO, yC), bot = Math.max(yO, yC);
    ctx.fillRect(x - bw / 2, top, bw, Math.max(1, bot - top));
  }

  // Indicator overlays
  if (state.indicators.ma50)  drawLine(ctx, ma50,  padL, padT, w, h, lo, hi, candles.length, '#c9a84c', 1.5);
  if (state.indicators.ma200) drawLine(ctx, ma200, padL, padT, w, h, lo, hi, candles.length, '#5aa8ff', 1.5);
  if (state.indicators.bb) {
    drawLine(ctx, bbUp, padL, padT, w, h, lo, hi, candles.length, 'rgba(176,139,255,.7)', 1);
    drawLine(ctx, bbDn, padL, padT, w, h, lo, hi, candles.length, 'rgba(176,139,255,.7)', 1);
  }

  // Support / resistance lines
  ctx.lineWidth = 1; ctx.setLineDash([4, 4]);
  ctx.strokeStyle = '#f0e6c8';
  for (const v of sr) {
    const y = padT + h * (1 - (v - lo) / (hi - lo));
    ctx.beginPath(); ctx.moveTo(padL, y); ctx.lineTo(W - padR, y); ctx.stroke();
    ctx.fillStyle = '#f0e6c8'; ctx.font = '10px Inter,Arial';
    ctx.fillText(v.toFixed(2), W - padR - 36, y - 3);
  }
  ctx.setLineDash([]);

  // Pattern emoji markers (above each candle)
  if (state.indicators.patterns) {
    const tags = detectPatterns(candles);
    ctx.font = '14px Apple Color Emoji,Segoe UI Emoji,Arial';
    for (let i = 0; i < candles.length; i++) {
      if (!tags[i]) continue;
      const x  = padL + i * cw + cw / 2;
      const yH = padT + h * (1 - (candles[i].h - lo) / (hi - lo));
      ctx.fillText(tags[i].e, x - 7, yH - 4);
    }
  }

  // Action emoji markers (below each candle)
  if (state.indicators.actions) {
    const acts = detectActions(candles, ma50, ma200, rsiArr);
    ctx.font = '15px Apple Color Emoji,Segoe UI Emoji,Arial';
    for (let i = 0; i < acts.length; i++) {
      if (!acts[i]) continue;
      const x  = padL + i * cw + cw / 2;
      const yL = padT + h * (1 - (candles[i].l - lo) / (hi - lo));
      ctx.fillText(acts[i].e, x - 8, Math.min(H - padB + 16, yL + 18));
    }
  }

  // X-axis date labels — format adapts to visible timeframe
  ctx.fillStyle = '#8a94a8'; ctx.font = '10px Inter,Arial'; ctx.textAlign = 'center';
  const _MONTHS   = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  const _tf       = state.timeframe;
  const _xStep    = Math.max(1, Math.floor(candles.length / 6));
  function _fmtTf(d) {
    if (!d) return '';
    const parts = d.split('-');
    const y = parts[0], m = parts[1], dd = parts[2];
    if (_tf <= 180) return m + '-' + dd;
    if (_tf <= 365) return _MONTHS[parseInt(m, 10) - 1] + ' ' + dd;
    return _MONTHS[parseInt(m, 10) - 1] + " '" + y.slice(2);
  }
  for (let i = 0; i < candles.length; i += _xStep) {
    const x     = padL + i * cw + cw / 2;
    const label = _fmtTf(candles[i].d);
    if (label) ctx.fillText(label, x, H - 6);
  }
  ctx.textAlign = 'start';

  // Save geometry for crosshair + SR click
  chartGeom = { padL, padT, padR, padB, w, h, lo, hi, cw, candles, W, H, ma50, ma200, rsiArr };

  // Crosshair hover
  cv.onmousemove = (e) => {
    const rect = cv.getBoundingClientRect();
    const x = (e.clientX - rect.left) * (cv.width  / rect.width);
    const y = (e.clientY - rect.top)  * (cv.height / rect.height);
    showCrosshair(x, y);
  };
  cv.onmouseleave = () => {
    document.getElementById('ohlc').style.display = 'none';
    if (_render) _render();
  };

  // S/R line placement on click
  cv.onclick = (e) => {
    if (!state.indicators.sr) return;
    const rect  = cv.getBoundingClientRect();
    const y     = (e.clientY - rect.top) * (cv.height / rect.height);
    const price = chartGeom.hi - (chartGeom.hi - chartGeom.lo) * ((y - chartGeom.padT) / chartGeom.h);
    if (price > 0) {
      if (!state.sr[state.active]) state.sr[state.active] = [];
      state.sr[state.active].push(+price.toFixed(2));
      saveSR();
      if (_render) _render();
    }
  };
}

// ------------------------------------------------------------------
// Crosshair overlay (drawn on top of the price chart on mousemove)
// ------------------------------------------------------------------

function showCrosshair(x, y) {
  if (!chartGeom) return;
  const g = chartGeom;
  if (x < g.padL || x > g.W - g.padR || y < g.padT || y > g.H - g.padB) {
    document.getElementById('ohlc').style.display = 'none';
    return;
  }

  // Redraw the chart cleanly before overlaying the cross
  if (_render) _render();

  const cv  = document.getElementById('price-chart');
  const ctx = cv.getContext('2d');

  // Dashed crosshair lines
  ctx.save();
  ctx.strokeStyle = 'rgba(240,230,200,.4)'; ctx.lineWidth = 1; ctx.setLineDash([3, 3]);
  ctx.beginPath(); ctx.moveTo(x, g.padT); ctx.lineTo(x, g.padT + g.h); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(g.padL, y); ctx.lineTo(g.padL + g.w, y); ctx.stroke();
  ctx.restore();

  // Date badge at bottom of vertical crosshair
  const _hoverIdx  = Math.max(0, Math.min(g.candles.length - 1, Math.floor((x - g.padL) / g.cw)));
  const _hoverDate = g.candles[_hoverIdx] && g.candles[_hoverIdx].d ? g.candles[_hoverIdx].d : '';
  if (_hoverDate) {
    ctx.save();
    ctx.font = '10px Inter,Arial';
    const _tw = ctx.measureText(_hoverDate).width;
    const _bw = _tw + 12, _bh = 14;
    let _bx = x - _bw / 2;
    if (_bx < g.padL) _bx = g.padL;
    if (_bx + _bw > g.W - g.padR) _bx = g.W - g.padR - _bw;
    const _by = g.H - _bh - 1;
    ctx.fillStyle = '#c9a84c'; ctx.fillRect(_bx, _by, _bw, _bh);
    ctx.fillStyle = '#1a1408'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText(_hoverDate, _bx + _bw / 2, _by + _bh / 2);
    ctx.restore();
  }

  // Price badge on the left price axis
  if (y >= g.padT && y <= g.padT + g.h) {
    const _priceAtY  = g.hi - (g.hi - g.lo) * ((y - g.padT) / g.h);
    const _priceLabel = _priceAtY.toFixed(2);
    ctx.save();
    ctx.font = '10px Inter,Arial';
    const _tw = ctx.measureText(_priceLabel).width;
    const _bw = _tw + 8, _bh = 14;
    const _bx = 1;
    const _by = Math.max(0, Math.min(g.H - _bh, y - _bh / 2));
    ctx.fillStyle = '#c9a84c'; ctx.fillRect(_bx, _by, _bw, _bh);
    ctx.fillStyle = '#1a1408'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText(_priceLabel, _bx + _bw / 2, _by + _bh / 2);
    ctx.restore();
  }

  // OHLCV tooltip box (top-right of chart)
  const idx = Math.max(0, Math.min(g.candles.length - 1, Math.floor((x - g.padL) / g.cw)));
  const c   = g.candles[idx];
  const cls = c.c >= c.o ? 'up' : 'dn';

  const v    = c.v;
  const vfmt = v >= 1e9 ? (v / 1e9).toFixed(2) + 'B'
             : v >= 1e6 ? (v / 1e6).toFixed(2) + 'M'
             : v >= 1e3 ? (v / 1e3).toFixed(1) + 'K'
             : String(v);

  const _volSum  = g.candles.reduce((s, cc) => s + cc.v, 0);
  const _volAvg  = g.candles.length > 0 ? _volSum / g.candles.length : 0;
  const _volPct  = _volAvg > 0 ? ((c.v / _volAvg) - 1) * 100 : 0;
  const _volPctStr = (_volPct >= 0 ? '+' : '') + _volPct.toFixed(0) + '%';
  const _isSpike   = _volAvg > 0 && c.v > _volAvg * 1.5;
  const _volColor  = _isSpike ? '#c9a84c' : '#f0e6c8';

  const ma50v  = (g.ma50  && g.ma50[idx]  != null) ? g.ma50[idx].toFixed(2)  : '—';
  const ma200v = (g.ma200 && g.ma200[idx] != null) ? g.ma200[idx].toFixed(2) : '—';
  const rsiNum = (g.rsiArr && g.rsiArr[idx] != null) ? g.rsiArr[idx] : null;
  const rsiv   = rsiNum != null ? rsiNum.toFixed(0) : '—';
  const rsiColor = rsiNum == null     ? '#f0e6c8'
                 : rsiNum > 70        ? '#e0524d'
                 : rsiNum < 30        ? '#26a96c'
                 : '#f0e6c8';

  const box = document.getElementById('ohlc');
  box.innerHTML =
    '<div>' +
      '<span>' + c.d + '</span>' +
      '<span>O <b>' + c.o.toFixed(2) + '</b></span>' +
      '<span>H <b>' + c.h.toFixed(2) + '</b></span>' +
      '<span>L <b>' + c.l.toFixed(2) + '</b></span>' +
      '<span class="' + cls + '">C <b>' + c.c.toFixed(2) + '</b></span>' +
      '<span>V <b style="color:' + _volColor + '">' + vfmt + ' (' + _volPctStr + ')</b></span>' +
    '</div>' +
    '<div style="margin-top:2px;color:var(--muted)">' +
      '<span>MA50 <b style="color:#c9a84c">'  + ma50v  + '</b></span>' +
      '<span>MA200 <b style="color:#5aa8ff">' + ma200v + '</b></span>' +
      '<span>RSI <b style="color:' + rsiColor + '">' + rsiv + '</b></span>' +
    '</div>';
  box.style.display = 'block';
}

// ------------------------------------------------------------------
// Volume chart
// ------------------------------------------------------------------

/** Draw the volume bar chart with spike highlighting. */
export function drawVolume(candles) {
  const cv = document.getElementById('volume-chart');
  fitCanvas(cv);
  const ctx = cv.getContext('2d');
  const W = cv.width, H = cv.height;
  ctx.clearRect(0, 0, W, H);

  const padL = 50, padR = 12, padT = 8, padB = 4;
  const w = W - padL - padR, h = H - padT - padB;
  const vols = candles.map(c => c.v);
  const max  = Math.max(...vols);
  const avg  = vols.reduce((a, b) => a + b, 0) / vols.length;
  const cw   = w / candles.length;
  const spikeThreshold = avg * 1.5;

  for (let i = 0; i < candles.length; i++) {
    const c  = candles[i];
    const bh = h * (c.v / max);
    ctx.fillStyle = c.v > spikeThreshold
      ? 'rgba(201,168,76,.95)'                                 // bright gold for spikes
      : c.c >= c.o ? 'rgba(38,169,108,.6)' : 'rgba(224,82,77,.6)';
    ctx.fillRect(padL + i * cw + cw * 0.15, padT + h - bh, cw * 0.7, bh);
  }

  // Average volume dashed line
  ctx.strokeStyle = '#c9a84c'; ctx.lineWidth = 1; ctx.setLineDash([4, 4]);
  const yA = padT + h * (1 - avg / max);
  ctx.beginPath(); ctx.moveTo(padL, yA); ctx.lineTo(W - padR, yA); ctx.stroke();
  ctx.setLineDash([]);
  ctx.fillStyle = '#8a94a8'; ctx.font = '10px Inter,Arial';
  ctx.fillText('avg', padL - 30, yA + 3);
}

// ------------------------------------------------------------------
// RSI chart
// ------------------------------------------------------------------

/** Draw the RSI line chart with oversold/overbought zone shading. */
export function drawRSI(rsiArr) {
  const cv = document.getElementById('rsi-chart');
  fitCanvas(cv);
  const ctx = cv.getContext('2d');
  const W = cv.width, H = cv.height;
  ctx.clearRect(0, 0, W, H);

  const padL = 50, padR = 12, padT = 8, padB = 4;
  const w = W - padL - padR, h = H - padT - padB;

  // Grid lines at 30, 50, 70
  ctx.strokeStyle = '#1d2c4a'; ctx.fillStyle = '#8a94a8'; ctx.font = '10px Inter,Arial';
  for (const lvl of [30, 50, 70]) {
    const y = padT + h * (1 - lvl / 100);
    ctx.beginPath(); ctx.moveTo(padL, y); ctx.lineTo(W - padR, y); ctx.stroke();
    ctx.fillText(lvl, 4, y + 3);
  }

  // Zone shading
  ctx.fillStyle = 'rgba(224,82,77,.08)';
  ctx.fillRect(padL, padT, w, h * 0.3);           // overbought zone (70–100)
  ctx.fillStyle = 'rgba(38,169,108,.08)';
  ctx.fillRect(padL, padT + h * 0.7, w, h * 0.3); // oversold zone (0–30)

  // RSI line
  ctx.strokeStyle = '#b08bff'; ctx.lineWidth = 1.4;
  ctx.beginPath();
  let first = true;
  for (let i = 0; i < rsiArr.length; i++) {
    if (rsiArr[i] == null) continue;
    const x = padL + i * (w / rsiArr.length) + (w / rsiArr.length) / 2;
    const y = padT + h * (1 - rsiArr[i] / 100);
    if (first) { ctx.moveTo(x, y); first = false; } else ctx.lineTo(x, y);
  }
  ctx.stroke();

  // Current RSI value badge (colour-coded by zone)
  const last = rsiArr[rsiArr.length - 1];
  if (last != null) {
    const x = padL + w - 30;
    ctx.fillStyle = last > 70 ? '#e0524d' : last < 30 ? '#26a96c' : '#c9a84c';
    ctx.fillRect(x, padT + 2, 28, 14);
    ctx.fillStyle = '#1a1408'; ctx.font = '700 10px Inter,Arial';
    ctx.fillText(last.toFixed(0), x + 5, padT + 12);
  }
}
