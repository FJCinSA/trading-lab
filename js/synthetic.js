// ============================================================
// FJC Trading Lab — Synthetic Data Engine
// ============================================================
// Generates deterministic, seeded pseudo-random candlestick data
// for when no Yahoo Finance proxy is configured.
//
// The seed is derived from the ticker symbol, so each ticker always
// produces the same fictional history across all browsers and sessions.
// This means two users studying the same ticker on synthetic data see
// identical charts — useful for shared learning without real data.
// ============================================================

/**
 * Mulberry32 — a fast, high-quality 32-bit PRNG.
 * Deterministic: same seed always produces the same sequence.
 * @param {number} a - seed
 * @returns {function(): number} - returns floats in [0, 1)
 */
export function mulberry32(a) {
  return function () {
    let t = (a += 0x6D2B79F5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Generate n synthetic OHLCV candles for a ticker config object.
 * Skips Saturdays and Sundays so the date sequence matches a real
 * trading calendar (weekdays only).
 *
 * @param {{ sym: string, start: number, vol: number, drift: number }} t
 * @param {number} n - number of calendar days to attempt (actual trading days fewer)
 * @returns {{ d: string, o: number, h: number, l: number, c: number, v: number }[]}
 */
export function genCandles(t, n = 1500) {
  // Seed from ticker symbol characters so each sym gives a unique sequence
  let seed = 0;
  for (const ch of t.sym) seed = (seed * 31 + ch.charCodeAt(0)) & 0xffffffff;
  const rng = mulberry32(seed);

  const out = [];
  let price = t.start;
  const today = new Date();

  for (let i = n - 1; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(today.getDate() - i);
    if (date.getDay() === 0 || date.getDay() === 6) continue; // skip weekends

    const r    = (rng() - 0.5) * 2;
    const move = price * (t.drift + t.vol * r);
    const open = price;
    const close = price + move;
    const high  = Math.max(open, close) + Math.abs(price * t.vol * rng() * 0.6);
    const low   = Math.min(open, close) - Math.abs(price * t.vol * rng() * 0.6);
    const volume = Math.floor(500000 + rng() * 2000000 * (1 + Math.abs(r)));

    out.push({
      d: date.toISOString().slice(0, 10),
      o: open,
      h: high,
      l: low,
      c: close,
      v: volume
    });
    price = close;
  }
  return out;
}
