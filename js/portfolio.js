// ============================================================
// FJC Trading Lab — Paper Portfolio, Trades & Price Alerts
// ============================================================

import { TICKERS }                       from './config.js';
import { state, savePortfolio, saveAlerts } from './state.js';

// ------------------------------------------------------------------
// Portfolio display
// ------------------------------------------------------------------

/** Render the paper portfolio table and cash/total summary. */
export function renderPortfolio() {
  const tbody = document.getElementById('p-rows');
  if (!tbody) return;
  tbody.innerHTML = '';
  let mv = 0;
  for (const t of TICKERS) {
    const pos = state.portfolio.positions[t.sym];
    if (!pos || pos.shares === 0) continue;
    const last  = state.data[t.sym][state.data[t.sym].length - 1].c;
    const value = pos.shares * last;
    const pl    = (last - pos.avg) * pos.shares;
    mv += value;
    const tr = document.createElement('tr');
    tr.innerHTML =
      '<td>' + t.sym + '</td>' +
      '<td class="num">' + pos.shares + '</td>' +
      '<td class="num">' + pos.avg.toFixed(2) + '</td>' +
      '<td class="num" style="color:' + (pl >= 0 ? 'var(--green)' : 'var(--red)') + '">' +
        (pl >= 0 ? '+' : '') + pl.toFixed(2) +
      '</td>';
    tbody.appendChild(tr);
  }
  const cashEl  = document.getElementById('p-cash');
  const totalEl = document.getElementById('p-total');
  if (cashEl)  cashEl.textContent  = 'R ' + state.portfolio.cash.toFixed(2);
  if (totalEl) totalEl.textContent = 'R ' + (state.portfolio.cash + mv).toFixed(2);
}

// ------------------------------------------------------------------
// Manual trades (Buy / Sell buttons)
// ------------------------------------------------------------------

/**
 * Execute a manual paper trade.
 * @param {number} direction - +1 = buy, -1 = sell
 */
export function trade(direction) {
  const qty = +document.getElementById('qty').value;
  if (!qty || qty <= 0) return;
  const t    = TICKERS.find(x => x.sym === state.active);
  const last = state.data[t.sym][state.data[t.sym].length - 1].c;
  const cost = qty * last;
  const pos  = state.portfolio.positions[t.sym] || { shares: 0, avg: 0 };

  if (direction > 0) {
    if (cost > state.portfolio.cash) { alert('Not enough paper cash.'); return; }
    const newShares = pos.shares + qty;
    pos.avg    = (pos.avg * pos.shares + last * qty) / newShares;
    pos.shares = newShares;
    state.portfolio.cash -= cost;
  } else {
    if (qty > pos.shares) { alert('Not enough shares to sell.'); return; }
    pos.shares -= qty;
    state.portfolio.cash += cost;
    if (pos.shares === 0) pos.avg = 0;
  }

  state.portfolio.positions[t.sym] = pos;
  savePortfolio();
  renderPortfolio();
}

// ------------------------------------------------------------------
// Buy / Sell button tooltips (update on qty change or hover)
// ------------------------------------------------------------------

export function updateTradeTooltips() {
  const qtyEl = document.getElementById('qty');
  if (!qtyEl) return;
  const qty = +qtyEl.value || 0;
  const t   = TICKERS.find(x => x.sym === state.active);
  if (!t || !state.data[t.sym] || state.data[t.sym].length === 0) return;
  const last = state.data[t.sym][state.data[t.sym].length - 1].c;
  const ccy  = t.ccy === 'USD' ? '$' : 'R ';
  const pos  = state.portfolio.positions[t.sym] || { shares: 0, avg: 0 };
  const cash = state.portfolio.cash;
  const cost = qty * last;

  const buyBtn = document.getElementById('btn-buy');
  if (buyBtn) {
    if (qty <= 0) {
      buyBtn.dataset.tip = 'Enter a quantity above 0.';
    } else if (cost > cash) {
      buyBtn.dataset.tip =
        'BUY ' + qty + ' x ' + t.sym + ' @ ' + ccy + last.toFixed(2) +
        '\nCost: ' + ccy + cost.toFixed(2) +
        '\nCash available: R ' + cash.toFixed(2) +
        '\nNot enough cash for this trade.';
    } else {
      const newShares = pos.shares + qty;
      const newAvg    = newShares > 0 ? (pos.avg * pos.shares + last * qty) / newShares : 0;
      buyBtn.dataset.tip =
        'BUY ' + qty + ' x ' + t.sym + ' @ ' + ccy + last.toFixed(2) +
        '\nCost: ' + ccy + cost.toFixed(2) +
        '\nCash after: R ' + (cash - cost).toFixed(2) +
        '\nNew position: ' + newShares + ' shares @ avg ' + ccy + newAvg.toFixed(2);
    }
  }

  const sellBtn = document.getElementById('btn-sell');
  if (sellBtn) {
    if (qty <= 0) {
      sellBtn.dataset.tip = 'Enter a quantity above 0.';
    } else if (pos.shares < qty) {
      sellBtn.dataset.tip = 'You hold ' + pos.shares + ' shares of ' + t.sym + '. Cannot sell ' + qty + '.';
    } else {
      const proceeds = qty * last;
      const pl       = (last - pos.avg) * qty;
      const plPct    = pos.avg > 0 ? ((last - pos.avg) / pos.avg) * 100 : 0;
      sellBtn.dataset.tip =
        'SELL ' + qty + ' x ' + t.sym + ' @ ' + ccy + last.toFixed(2) +
        '\nProceeds: ' + ccy + proceeds.toFixed(2) +
        '\nP/L on these shares: ' + (pl >= 0 ? '+' : '') + ccy + pl.toFixed(2) +
          ' (' + (plPct >= 0 ? '+' : '') + plPct.toFixed(1) + '%)' +
        '\nRemaining: ' + (pos.shares - qty) + ' shares';
    }
  }
}

// ------------------------------------------------------------------
// Price alerts
// ------------------------------------------------------------------

export function addAlert() {
  const price = +document.getElementById('alert-price').value;
  const dir   = document.getElementById('alert-dir').value;
  if (!price) return;
  state.alerts.push({ sym: state.active, price, dir, fired: false });
  saveAlerts();
  document.getElementById('alert-price').value = '';
  renderAlerts();
  if ('Notification' in window && Notification.permission === 'default') {
    Notification.requestPermission();
  }
}

export function renderAlerts() {
  const ul = document.getElementById('alert-list');
  if (!ul) return;
  ul.innerHTML = '';
  state.alerts.forEach((a, i) => {
    const li = document.createElement('li');
    li.innerHTML =
      '<span style="color:var(--gold);font-weight:600">' + a.sym + '</span> ' +
      a.dir + ' ' + a.price.toFixed(2) +
      (a.fired ? ' <span style="color:var(--green)">(triggered)</span>' : '');
    const x = document.createElement('button');
    x.textContent = 'x';
    x.onclick = () => { state.alerts.splice(i, 1); saveAlerts(); renderAlerts(); };
    li.appendChild(x);
    ul.appendChild(li);
  });
}

export function checkAlerts() {
  for (const a of state.alerts) {
    if (a.fired) continue;
    const last = state.data[a.sym] && state.data[a.sym][state.data[a.sym].length - 1].c;
    if (last == null) continue;
    if ((a.dir === 'above' && last >= a.price) || (a.dir === 'below' && last <= a.price)) {
      a.fired = true;
      const msg = a.sym + ' ' + a.dir + ' ' + a.price.toFixed(2) + ' (now ' + last.toFixed(2) + ')';
      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification('FJC Trading Lab alert', { body: msg });
      } else {
        console.log('Alert:', msg);
      }
    }
  }
  saveAlerts();
}
