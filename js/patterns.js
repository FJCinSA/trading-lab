// ============================================================
// FJC Trading Lab — Candlestick Patterns & Action Markers
// ============================================================
// Pure functions. No imports, no side effects.
// Each function takes a candles array and returns a parallel
// array of annotations (null = no pattern at that index).
// ============================================================

/**
 * Detect single-candle and multi-candle reversal patterns.
 * Returns a parallel array: null | { e: emoji, label: string }
 *
 * Patterns detected:
 *   Doji          — body < 10% of range; indecision candle
 *   Hammer        — long lower wick, small body, closes near top; bullish reversal hint
 *   Shooting Star — long upper wick, small body, closes near bottom; bearish reversal hint
 *   Morning Star  — 3-candle bullish reversal: red candle → small body → strong green close
 *   Evening Star  — 3-candle bearish reversal: green candle → small body → strong red close
 */
export function detectPatterns(candles) {
  const tags = candles.map(() => null);
  for (let i = 0; i < candles.length; i++) {
    const c = candles[i];
    const body  = Math.abs(c.c - c.o);
    const range = c.h - c.l;
    if (range === 0) continue;
    const upper = c.h - Math.max(c.o, c.c);
    const lower = Math.min(c.o, c.c) - c.l;

    // Doji: body is less than 10% of the full high-to-low range
    if (body / range < 0.1) { tags[i] = { e: '⚫', label: 'Doji' }; continue; }

    // Hammer: long lower wick (>2× body), tiny upper wick, bullish colour
    if (lower > body * 2 && upper < body * 0.5 && c.c >= c.o) {
      tags[i] = { e: '🔨', label: 'Hammer' }; continue;
    }

    // Shooting Star: long upper wick (>2× body), tiny lower wick, bearish colour
    if (upper > body * 2 && lower < body * 0.5 && c.c <= c.o) {
      tags[i] = { e: '⭐', label: 'Shooting Star' }; continue;
    }

    if (i >= 2) {
      const a = candles[i - 2], b = candles[i - 1];

      // Morning Star: red, small middle, green closing above midpoint of day 1
      if (
        a.c < a.o &&
        Math.abs(b.c - b.o) < (a.h - a.l) * 0.3 &&
        c.c > c.o &&
        c.c > (a.o + a.c) / 2
      ) {
        tags[i] = { e: '🌟', label: 'Morning Star' }; continue;
      }

      // Evening Star: green, small middle, red closing below midpoint of day 1
      if (
        a.c > a.o &&
        Math.abs(b.c - b.o) < (a.h - a.l) * 0.3 &&
        c.c < c.o &&
        c.c < (a.o + a.c) / 2
      ) {
        tags[i] = { e: '💫', label: 'Evening Star' }; continue;
      }
    }
  }
  return tags;
}

/**
 * Detect significant price-action events that warrant a marker below the candle.
 * Returns a parallel array: null | { e: emoji, label: string }
 *
 * Events detected:
 *   Golden Cross — MA50 crosses above MA200 (long-term bullish signal)
 *   Death Cross  — MA50 crosses below MA200 (long-term caution signal)
 *   RSI > 70     — momentum crossed into overbought territory
 *   RSI < 30     — momentum crossed into oversold territory
 */
export function detectActions(candles, ma50, ma200, rsiArr) {
  const out = candles.map(() => null);
  for (let i = 1; i < candles.length; i++) {
    const m50  = ma50[i],   m50p  = ma50[i - 1];
    const m200 = ma200[i],  m200p = ma200[i - 1];
    const r    = rsiArr[i], rp    = rsiArr[i - 1];

    if (m50 != null && m200 != null && m50p != null && m200p != null) {
      if (m50p <= m200p && m50 > m200) {
        out[i] = { e: '🟢', label: 'Golden cross - long-term entry signal' }; continue;
      }
      if (m50p >= m200p && m50 < m200) {
        out[i] = { e: '⚠️', label: 'Death cross - long-term caution' }; continue;
      }
    }

    if (r != null && rp != null) {
      if (r >= 70 && rp < 70) {
        out[i] = { e: '🔴', label: 'RSI crossed above 70 - consider taking profit' }; continue;
      }
      if (r <= 30 && rp > 30) {
        out[i] = { e: '💚', label: 'RSI crossed below 30 - watch for bounce' }; continue;
      }
    }
  }
  return out;
}
