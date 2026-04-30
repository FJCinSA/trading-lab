// ============================================================
// FJC Trading Lab — Technical Indicators
// ============================================================
// Pure mathematical functions. No imports, no side effects.
// All inputs are plain arrays of numbers; all outputs are arrays.
// ============================================================

/**
 * Simple Moving Average.
 * @param {number[]} arr   - input values (e.g. closing prices)
 * @param {number}   n     - window length
 * @returns {(number|null)[]} - null until enough data; value thereafter
 */
export function sma(arr, n) {
  const out = [];
  let sum = 0;
  for (let i = 0; i < arr.length; i++) {
    sum += arr[i];
    if (i >= n) sum -= arr[i - n];
    out.push(i >= n - 1 ? sum / n : null);
  }
  return out;
}

/**
 * Bollinger Bands (John Bollinger, 1980s).
 * A volatility envelope: middle band = SMA(n), upper/lower = ±k standard deviations.
 * @param {number[]} arr - closing prices
 * @param {number}   n   - window (default 20)
 * @param {number}   k   - standard deviation multiplier (default 2)
 * @returns {{ ma: (number|null)[], up: (number|null)[], dn: (number|null)[] }}
 */
export function bollinger(arr, n = 20, k = 2) {
  const ma = sma(arr, n);
  const up = [];
  const dn = [];
  for (let i = 0; i < arr.length; i++) {
    if (i < n - 1) { up.push(null); dn.push(null); continue; }
    let s = 0;
    for (let j = i - n + 1; j <= i; j++) s += (arr[j] - ma[i]) ** 2;
    const sd = Math.sqrt(s / n);
    up.push(ma[i] + k * sd);
    dn.push(ma[i] - k * sd);
  }
  return { ma, up, dn };
}

/**
 * Relative Strength Index (J. Welles Wilder, 1978).
 * A momentum oscillator scaled 0–100.
 *   < 30 = typically oversold (stock beaten down, watch for bounce)
 *   > 70 = typically overbought (stock bid up hard, watch for pullback)
 *   40–60 = neutral momentum
 * @param {number[]} closes - closing prices
 * @param {number}   n      - period (default 14, Wilder's original)
 * @returns {(number|null)[]} - null until n+1 data points available
 */
export function rsi(closes, n = 14) {
  const out = new Array(closes.length).fill(null);
  if (closes.length < n + 1) return out;
  let gain = 0, loss = 0;
  for (let i = 1; i <= n; i++) {
    const ch = closes[i] - closes[i - 1];
    if (ch >= 0) gain += ch; else loss -= ch;
  }
  let ag = gain / n, al = loss / n;
  out[n] = 100 - 100 / (1 + ag / (al || 1e-9));
  for (let i = n + 1; i < closes.length; i++) {
    const ch = closes[i] - closes[i - 1];
    const g = ch > 0 ? ch : 0;
    const l = ch < 0 ? -ch : 0;
    ag = (ag * (n - 1) + g) / n;
    al = (al * (n - 1) + l) / n;
    out[i] = 100 - 100 / (1 + ag / (al || 1e-9));
  }
  return out;
}
