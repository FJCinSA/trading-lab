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
import { MARKET_EVENTS, EVENT_COLOURS }  from './events.js';
import { TF_STEPS }                      from './config.js';

// Injected render callback — set by initChart(), never null after boot
let _render = null;

// Module-level drag state — persists across render() calls so drag isn't
// broken by intermediate redraws triggered during a pointer-move.
let _dragActive        = false;
let _dragStartX        = 0;
let _dragStartY        = 0;
let _dragStartOff      = 0;
let _dragStartPriceOff = 0;
let _dragStartPPP      = 0;   // price-per-pixel at drag start (for vertical pan mapping)
let _dragMoved         = false;

// Last drawn chart geometry — used by showCrosshair() and S/R click
let chartGeom = null;

// Crosshair snapshot — saved after drawCandles() so showCrosshair() can
// restore the clean chart with a single putImageData() instead of a
// full _render() call on every mousemove (dramatic perf improvement).
let _chartSnapshot   = null;
let _chartSnapshotW  = 0;
let _chartSnapshotH  = 0;

// Pre-built event date map — MARKET_EVENTS is static so build it once
// at module load rather than on every drawCandles() call.
const _EVENT_MAP = {};
for (const ev of MARKET_EVENTS) _EVENT_MAP[ev.date] = ev;

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
  // Apply vertical pan offset (user dragging chart up/down). Shifts the whole
  // visible range without changing the scale — identical behaviour to horizontal pan.
  const _priceOff = state.priceOffset || 0;
  if (_priceOff !== 0) { lo += _priceOff; hi += _priceOff; }
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

  // ── Crash zone overlay (Pillar 6) ────────────────────────────────
  // Drawn AFTER grid lines, BEFORE candles so candlesticks render on top.
  // Three visual states depending on where the replay pointer is:
  //   A) Crash hasn't started yet  → red tint + "CRASH →" arrow at right edge
  //   B) Crash onset is on screen  → red tint + deeper band from onset rightward + "▼ CRASH ONSET" pill
  //   C) Deep into crash (onset is off left edge) → red tint + entire visible area is deeper red band
  if (state.crashStudy) {
    const { startDate, endDate } = state.crashStudy;
    const firstDate = candles.length > 0 ? candles[0].d               : null;
    const lastDate  = candles.length > 0 ? candles[candles.length-1].d : null;

    // Always: red tint over entire chart area — signals crash study mode
    ctx.fillStyle = 'rgba(140, 20, 20, 0.18)';
    ctx.fillRect(padL, padT, w, h);

    // Determine left boundary of crash zone
    let czStartX;
    if (firstDate && firstDate >= startDate) {
      // Entire visible window is already inside the crash — shade it all
      czStartX = padL;
    } else {
      // Search for the crash onset candle within the visible window
      czStartX = null;
      for (let i = 0; i < candles.length; i++) {
        if (candles[i].d >= startDate) { czStartX = padL + i * cw; break; }
      }
    }

    // Determine right boundary (trough date, or right edge if still crashing)
    let czEndX = padL + w;
    if (endDate) {
      for (let i = 0; i < candles.length; i++) {
        if (candles[i].d > endDate) { czEndX = padL + i * cw; break; }
      }
    }

    ctx.save();

    if (czStartX !== null) {
      // ── State B or C: crash is visible or already past left edge ──
      ctx.fillStyle = 'rgba(200, 40, 40, 0.30)';
      ctx.fillRect(czStartX, padT, czEndX - czStartX, h);

      // Recovery zone (after trough) — subtle green tint shows "crash is over"
      if (endDate && czEndX < padL + w) {
        ctx.fillStyle = 'rgba(38, 169, 108, 0.10)';
        ctx.fillRect(czEndX, padT, padL + w - czEndX, h);
      }

      // Onset line — only draw if onset is actually on-screen (not at left edge)
      if (czStartX > padL + 2) {
        ctx.strokeStyle = 'rgba(235, 75, 75, 0.95)';
        ctx.lineWidth   = 2;
        ctx.setLineDash([5, 3]);
        ctx.beginPath();
        ctx.moveTo(czStartX, padT);
        ctx.lineTo(czStartX, padT + h);
        ctx.stroke();
        ctx.setLineDash([]);

        // Pill label — flip to left of line if near right edge
        ctx.font = 'bold 11px Inter,Arial';
        const lbl  = '▼ CRASH ONSET';
        const lw   = ctx.measureText(lbl).width + 10;
        const lh   = 16;
        const lx   = (czStartX + 6 + lw < padL + w) ? czStartX + 6 : czStartX - lw - 6;
        const ly   = padT + 4;
        ctx.fillStyle = 'rgba(200, 40, 40, 0.92)';
        ctx.beginPath();
        if (ctx.roundRect) ctx.roundRect(lx, ly, lw, lh, 3); else ctx.rect(lx, ly, lw, lh);
        ctx.fill();
        ctx.fillStyle = '#ffffff'; ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
        ctx.fillText(lbl, lx + 5, ly + lh / 2);
      }

      // Bottom / trough marker — green line + pill at endDate.
      // Show even when czEndX is at the right edge (replay pointer = endDate).
      if (endDate && czEndX > padL + 2) {
        ctx.strokeStyle = 'rgba(38, 169, 108, 0.90)';
        ctx.lineWidth   = 2;
        ctx.setLineDash([5, 3]);
        ctx.beginPath();
        ctx.moveTo(czEndX, padT);
        ctx.lineTo(czEndX, padT + h);
        ctx.stroke();
        ctx.setLineDash([]);

        ctx.font = 'bold 11px Inter,Arial';
        const lbl2 = '▲ BOTTOM';
        const lw2  = ctx.measureText(lbl2).width + 10;
        const lh2  = 16;
        // Place below onset label (padT + 24) so they don't overlap when both visible
        const lx2  = (czEndX + 6 + lw2 < padL + w) ? czEndX + 6 : czEndX - lw2 - 6;
        const ly2  = padT + 24;
        ctx.fillStyle = 'rgba(28, 130, 80, 0.92)';
        ctx.beginPath();
        if (ctx.roundRect) ctx.roundRect(lx2, ly2, lw2, lh2, 3); else ctx.rect(lx2, ly2, lw2, lh2);
        ctx.fill();
        ctx.fillStyle = '#ffffff'; ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
        ctx.fillText(lbl2, lx2 + 5, ly2 + lh2 / 2);
      }

    } else if (lastDate && lastDate < startDate) {
      // ── State A: crash is upcoming — show "CRASH →" arrow at right edge ──
      ctx.strokeStyle = 'rgba(230, 70, 70, 0.90)';
      ctx.lineWidth   = 2;
      ctx.setLineDash([5, 3]);
      ctx.beginPath();
      ctx.moveTo(padL + w - 1, padT);
      ctx.lineTo(padL + w - 1, padT + h);
      ctx.stroke();
      ctx.setLineDash([]);

      ctx.font = 'bold 11px Inter,Arial';
      const lbl = 'CRASH BEGINS ▶';
      const lw  = ctx.measureText(lbl).width + 10;
      const lh  = 16;
      const lx  = padL + w - lw - 4;
      const ly  = padT + 4;
      ctx.fillStyle = 'rgba(200, 40, 40, 0.92)';
      ctx.beginPath();
      if (ctx.roundRect) ctx.roundRect(lx, ly, lw, lh, 3); else ctx.rect(lx, ly, lw, lh);
      ctx.fill();
      ctx.fillStyle = '#ffffff'; ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
      ctx.fillText(lbl, lx + 5, ly + lh / 2);
    }

    ctx.restore();
  }
  // ── end crash zone overlay ────────────────────────────────────────

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

  // ── Market event flags ──────────────────────────────────────────────
  // Small colored flag pins at the top of the chart for each MARKET_EVENTS date
  // that falls within the visible window. Flag color = event category.
  // Dashed guide line extends from flag base to just above the candle high.
  if (state.indicators.events) {
    ctx.save();
    const FY = padT + 1;  // flag sits at very top of chart area

    for (let i = 0; i < candles.length; i++) {
      const ev = _EVENT_MAP[candles[i].d];
      if (!ev) continue;
      const x   = padL + i * cw + cw / 2;
      const col = EVENT_COLOURS[ev.category] || '#888';
      const yH  = padT + h * (1 - (candles[i].h - lo) / (hi - lo));

      // Dashed guide from flag base to just above candle high
      ctx.strokeStyle = col;
      ctx.lineWidth   = 1;
      ctx.globalAlpha = 0.35;
      ctx.setLineDash([2, 3]);
      ctx.beginPath();
      ctx.moveTo(x, FY + 9);
      ctx.lineTo(x, Math.max(yH - 3, FY + 10));
      ctx.stroke();
      ctx.setLineDash([]);

      // Flag pole stub
      ctx.strokeStyle = col;
      ctx.lineWidth   = 1.5;
      ctx.globalAlpha = 0.90;
      ctx.beginPath();
      ctx.moveTo(x, FY);
      ctx.lineTo(x, FY + 8);
      ctx.stroke();

      // Flag body (flies to the right of the pole)
      ctx.fillStyle   = col;
      ctx.globalAlpha = 0.88;
      ctx.fillRect(x, FY, 7, 5);
    }

    ctx.globalAlpha = 1;
    ctx.restore();
  }
  // ── end event flags ───────────────────────────────────────────────

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
  chartGeom = { padL, padT, padR, padB, w, h, lo, hi, cw, candles, W, H, ma50, ma200, rsiArr,
                evMap: state.indicators.events ? _EVENT_MAP : null };

  // Save canvas snapshot for fast crosshair restore (avoids full _render() on every mousemove)
  _chartSnapshotW = W;
  _chartSnapshotH = H;
  _chartSnapshot  = ctx.getImageData(0, 0, W, H);

  // Set grab cursor — shows the user the chart is draggable
  cv.style.cursor = 'grab';

  // ── Pointer events: drag-to-pan (Google Maps style) ──────────────
  cv.onpointerdown = (e) => {
    _dragActive        = true;
    _dragStartX        = e.clientX;
    _dragStartY        = e.clientY;
    _dragStartOff      = state.viewOffset || 0;
    _dragStartPriceOff = state.priceOffset || 0;
    // Capture price-per-pixel now so vertical mapping stays stable during the drag
    _dragStartPPP      = chartGeom ? (chartGeom.hi - chartGeom.lo) / chartGeom.h : 0;
    _dragMoved         = false;
    cv.setPointerCapture(e.pointerId);  // keep events even if cursor leaves canvas
    cv.style.cursor = 'grabbing';
  };

  cv.onpointermove = (e) => {
    if (!_dragActive) {
      // Not dragging — show crosshair
      const rect = cv.getBoundingClientRect();
      const x = (e.clientX - rect.left) * (cv.width  / rect.width);
      const y = (e.clientY - rect.top)  * (cv.height / rect.height);
      showCrosshair(x, y);
      return;
    }
    // Dragging — pan the chart horizontally and/or vertically
    const deltaX = e.clientX - _dragStartX;
    const deltaY = e.clientY - _dragStartY;
    if (Math.abs(deltaX) > 4 || Math.abs(deltaY) > 4) _dragMoved = true;
    if (_dragMoved && chartGeom) {
      // Horizontal: negative deltaX (drag left) = move forward in time (reduce offset)
      //             positive deltaX (drag right) = move back in time (increase offset)
      const deltaCandlesCont = -deltaX / chartGeom.cw;
      const newOff = Math.round(_dragStartOff + deltaCandlesCont);
      const all    = state.data[state.active] || [];
      const maxOff = Math.max(0, all.length - state.timeframe);
      state.viewOffset = Math.max(0, Math.min(maxOff, newOff));

      // Vertical: negative deltaY (drag up) = view higher prices (positive price offset)
      //           positive deltaY (drag down) = view lower prices (negative price offset)
      if (_dragStartPPP > 0) {
        state.priceOffset = _dragStartPriceOff + (-deltaY * _dragStartPPP);
      }

      if (_render) _render();
    }
  };

  cv.onpointerup = (e) => {
    cv.style.cursor = 'grab';
    const wasDrag = _dragMoved;
    _dragActive = false;
    _dragMoved  = false;
    // If the pointer barely moved → treat as a click (S/R placement)
    if (!wasDrag && state.indicators.sr && chartGeom) {
      const rect  = cv.getBoundingClientRect();
      const y     = (e.clientY - rect.top) * (cv.height / rect.height);
      const price = chartGeom.hi - (chartGeom.hi - chartGeom.lo) * ((y - chartGeom.padT) / chartGeom.h);
      if (price > 0) {
        if (!state.sr[state.active]) state.sr[state.active] = [];
        state.sr[state.active].push(+price.toFixed(2));
        saveSR();
        if (_render) _render();
      }
    }
  };

  cv.onpointerleave = () => {
    if (!_dragActive) {
      document.getElementById('ohlc').style.display = 'none';
      cv.style.cursor = 'grab';
      if (_render) _render();
    }
  };

  cv.onpointercancel = () => {
    _dragActive = false;
    _dragMoved  = false;
    cv.style.cursor = 'grab';
  };

  // ── Scroll wheel: zoom in / out ───────────────────────────────────
  cv.onwheel = (e) => {
    e.preventDefault();
    const curIdx = TF_STEPS.findIndex(v => v >= state.timeframe);
    const idx      = curIdx < 0 ? TF_STEPS.length - 1 : curIdx;
    const newIdx   = e.deltaY > 0
      ? Math.min(TF_STEPS.length - 1, idx + 1)   // scroll down = zoom out
      : Math.max(0, idx - 1);                     // scroll up   = zoom in
    if (newIdx !== idx) {
      state.timeframe = TF_STEPS[newIdx];
      document.querySelectorAll('#tf button').forEach(b => {
        b.classList.toggle('on', +b.dataset.tf === state.timeframe);
      });
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

  // Restore clean chart snapshot instead of a full _render() call —
  // this avoids recalculating indicators, reattaching events, and redrawing
  // all candles on every single mousemove (huge CPU saving).
  const cv  = document.getElementById('price-chart');
  const ctx = cv.getContext('2d');
  if (_chartSnapshot && cv.width === _chartSnapshotW && cv.height === _chartSnapshotH) {
    ctx.putImageData(_chartSnapshot, 0, 0);
  } else if (_render) {
    // Fallback: canvas was resized since last draw — do a full render
    _render();
    return; // showCrosshair will be retriggered by the new draw
  }

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

  // ── Event tooltip (bottom-left) ─────────────────────────────────
  // If the hovered candle has a MARKET_EVENTS entry, render a detail box
  // in the bottom-left corner of the price chart area.
  if (g.evMap) {
    const hov = g.candles[_hoverIdx];
    const ev  = hov && g.evMap[hov.d];
    if (ev) {
      const col    = EVENT_COLOURS[ev.category] || '#888';
      ctx.save();

      // Word-wrap the detail string to fit inside the box
      const BOX_W  = Math.min(310, g.w - 8);
      const INNER  = BOX_W - 14;
      const LINE_H = 13;
      ctx.font = '10px Inter,Arial';

      const words  = ev.detail.split(' ');
      const dlines = [];
      let   dline  = '';
      for (const word of words) {
        const test = dline ? dline + ' ' + word : word;
        if (ctx.measureText(test).width > INNER && dline) {
          dlines.push(dline); dline = word;
        } else { dline = test; }
      }
      if (dline) dlines.push(dline);

      // Cap at 3 lines; add ellipsis if truncated
      const MAX_LINES = 3;
      const shown     = dlines.slice(0, MAX_LINES);
      if (dlines.length > MAX_LINES) shown[MAX_LINES - 1] += ' …';

      const BOX_H = 14 + shown.length * LINE_H + 6;
      const BX    = g.padL + 4;
      const BY    = g.padT + g.h - BOX_H - 6;

      // Background
      ctx.fillStyle   = 'rgba(8,14,26,0.93)';
      ctx.strokeStyle = col;
      ctx.lineWidth   = 1;
      ctx.beginPath();
      ctx.roundRect ? ctx.roundRect(BX, BY, BOX_W, BOX_H, 4)
                    : ctx.rect(BX, BY, BOX_W, BOX_H);
      ctx.fill();
      ctx.stroke();

      // Category dot + event label
      ctx.fillStyle    = col;
      ctx.fillRect(BX + 6, BY + 4, 6, 6);
      ctx.fillStyle    = '#e9edf5';
      ctx.textBaseline = 'top';
      ctx.font         = 'bold 11px Inter,Arial';
      ctx.fillText(ev.label, BX + 16, BY + 3);

      // Detail lines
      ctx.font      = '10px Inter,Arial';
      ctx.fillStyle = '#8a94a8';
      for (let li = 0; li < shown.length; li++) {
        ctx.fillText(shown[li], BX + 6, BY + 14 + li * LINE_H);
      }

      ctx.restore();
    }
  }
  // ── end event tooltip ──────────────────────────────────────────
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

// ------------------------------------------------------------------
// Overlay comparison line (Pillar 5)
// ------------------------------------------------------------------

/**
 * Draw a normalised comparison line for a second ticker on top of the
 * existing price chart. Called AFTER drawCandles() so it renders on top.
 *
 * The overlay line uses its own Y scale (full chart height = overlay's
 * min-to-max range). A dashed zero line shows the starting reference.
 * A legend box at the top-left shows both tickers' % return.
 *
 * @param {string}   overlaySym  Ticker symbol to compare against
 * @param {object[]} visible     The base ticker's visible candle slice
 */
export function drawOverlay(overlaySym, visible) {
  if (!overlaySym || !state.data[overlaySym] || !chartGeom) return;
  if (!visible || visible.length < 2) return;

  const g = chartGeom;
  const cv = document.getElementById('price-chart');
  const ctx = cv.getContext('2d');

  // Build a date→candle lookup for the overlay ticker (fast O(1) per point)
  const overlayMap = {};
  for (const c of state.data[overlaySym]) overlayMap[c.d] = c;

  // Anchor: find the overlay candle closest to the first visible date
  const anchorDate = visible[0].d;
  let overlayAnchorC = overlayMap[anchorDate];
  if (!overlayAnchorC) {
    // Closest available date (handles holidays / date gaps)
    const t0 = new Date(anchorDate).getTime();
    overlayAnchorC = state.data[overlaySym].reduce((best, c) => {
      return Math.abs(new Date(c.d) - t0) < Math.abs(new Date(best.d) - t0) ? c : best;
    }, state.data[overlaySym][0]);
  }
  if (!overlayAnchorC) return;

  const overlayAnchor = overlayAnchorC.c;

  // Build normalised series: 100 = starting value, 110 = +10%, etc.
  const normSeries = visible.map(vc => {
    const oc = overlayMap[vc.d];
    return oc ? (oc.c / overlayAnchor) * 100 : null;
  });

  const validNorm = normSeries.filter(v => v !== null);
  if (validNorm.length < 2) return;

  // Y scale for the overlay line — always includes 100 (start point)
  let normLo = Math.min(...validNorm, 100);
  let normHi = Math.max(...validNorm, 100);
  const normPad = Math.max((normHi - normLo) * 0.12, 0.5);
  normLo -= normPad;
  normHi += normPad;

  const toY = (v) => g.padT + g.h * (1 - (v - normLo) / (normHi - normLo));
  const OVERLAY_COLOR = '#ff8c5a'; // warm coral — distinct from gold/blue/green/purple

  ctx.save();

  // Zero reference line at norm = 100 (the starting point)
  ctx.strokeStyle = 'rgba(255,140,90,0.2)';
  ctx.lineWidth = 1;
  ctx.setLineDash([4, 6]);
  const y100 = toY(100);
  ctx.beginPath();
  ctx.moveTo(g.padL, y100);
  ctx.lineTo(g.W - g.padR, y100);
  ctx.stroke();
  ctx.setLineDash([]);

  // Overlay normalised line
  ctx.strokeStyle = OVERLAY_COLOR;
  ctx.lineWidth = 1.8;
  ctx.beginPath();
  let first = true;
  let lastOverlayNorm = null;
  for (let i = 0; i < visible.length; i++) {
    const v = normSeries[i];
    if (v === null) continue;
    const x = g.padL + i * g.cw + g.cw / 2;
    const y = toY(v);
    if (first) { ctx.moveTo(x, y); first = false; } else ctx.lineTo(x, y);
    lastOverlayNorm = v;
  }
  ctx.stroke();

  // Right-side end label for the overlay line
  if (lastOverlayNorm !== null) {
    const lastIdx = normSeries.length - 1 - [...normSeries].reverse().findIndex(v => v !== null);
    const lx = g.padL + lastIdx * g.cw + g.cw / 2;
    const ly = toY(lastOverlayNorm);
    ctx.font = 'bold 10px Inter,Arial';
    const pct = lastOverlayNorm - 100;
    const label = overlaySym + ' ' + (pct >= 0 ? '+' : '') + pct.toFixed(1) + '%';
    const tw = ctx.measureText(label).width;
    // Draw pill label at the end of the line
    const px = Math.min(lx + 4, g.W - g.padR - tw - 4);
    ctx.fillStyle = 'rgba(15,20,40,0.80)';
    ctx.fillRect(px - 2, ly - 9, tw + 6, 13);
    ctx.fillStyle = pct >= 0 ? '#26a96c' : '#e0524d';
    ctx.textBaseline = 'middle';
    ctx.fillText(label, px, ly - 2);
  }

  // Legend box at top-left: "TDY +5.2%  vs  TSLA +18.4%"
  const baseRet = ((visible[visible.length - 1].c / visible[0].c) - 1) * 100;
  const overRet = lastOverlayNorm !== null ? lastOverlayNorm - 100 : null;

  if (overRet !== null) {
    const baseSym  = state.active;
    const baseTxt  = baseSym  + ' ' + (baseRet  >= 0 ? '+' : '') + baseRet.toFixed(1)  + '%';
    const vsTxt    = '  vs  ';
    const overTxt  = overlaySym + ' ' + (overRet >= 0 ? '+' : '') + overRet.toFixed(1) + '%';

    ctx.font = 'bold 10px Inter,Arial';
    const bw   = ctx.measureText(baseTxt).width;
    const vsw  = ctx.measureText(vsTxt).width;
    const ovw  = ctx.measureText(overTxt).width;
    const boxW = bw + vsw + ovw + 14;
    const lx   = g.padL + 6;
    const ly   = g.padT + 6;

    ctx.fillStyle = 'rgba(10,16,32,0.88)';
    ctx.strokeStyle = 'rgba(255,140,90,0.3)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.roundRect ? ctx.roundRect(lx - 4, ly - 4, boxW, 16, 3)
                  : ctx.rect(lx - 4, ly - 4, boxW, 16);
    ctx.fill();
    ctx.stroke();

    let cx = lx;
    ctx.textBaseline = 'top';
    ctx.fillStyle = baseRet  >= 0 ? '#26a96c' : '#e0524d';
    ctx.fillText(baseTxt, cx, ly);  cx += bw;
    ctx.fillStyle = '#8a94a8';
    ctx.fillText(vsTxt, cx, ly);    cx += vsw;
    ctx.fillStyle = overRet >= 0 ? '#26a96c' : '#e0524d';
    ctx.fillText(overTxt, cx, ly);
  }

  ctx.restore();
}

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
