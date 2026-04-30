// ============================================================
// FJC Trading Lab — AI Candle Analysis & Morning Briefing
// ============================================================
// Sends chart context to Claude via the user's Cloudflare Worker
// proxy. The proxy holds the Anthropic API key — it never appears
// in the browser or in this source file.
//
// Three modes:
//   'analyse'        — 4-bullet read on the active ticker's latest candle
//   'briefing'       — plain-English morning summary of all four tickers
//   'journal-review' — review last 14 days of journal entries for patterns
//
// Every prompt is written for a complete novice (Dr Francois Coetzee,
// 63-year-old anaesthesiologist learning markets). Technical terms are
// defined inline the first time they appear. No jargon. Warm tone.
// ============================================================

import { TICKERS }                   from './config.js';
import { state }                     from './state.js';
import { sma, bollinger, rsi }       from './indicators.js';
import { detectPatterns }            from './patterns.js';
import { getJournalEntries }         from './journal.js';

export async function askClaude(kind) {
  const out = document.getElementById('ai-out');
  if (!state.proxy) {
    out.classList.remove('empty');
    out.style.color = 'var(--red)';
    out.textContent = 'Add your Cloudflare proxy URL at the top of the page first.';
    return;
  }
  out.classList.remove('empty');
  out.style.color = 'var(--cream)';
  out.textContent = 'Thinking...';

  // Build the prompt — wrapped in try/catch so any indicator bug surfaces visibly
  let prompt;
  try {
    const t       = TICKERS.find(x => x.sym === state.active);
    const candles = state.data[state.active].slice(-30);
    const allC    = state.data[state.active].map(c => c.c);
    const ma50L   = sma(allC, 50).pop();
    const ma200L  = sma(allC, 200).pop();
    const rsiL    = rsi(allC, 14).pop();
    const last    = candles[candles.length - 1];

    // Recent pattern markers — so the AI can teach what's visible on screen
    const recentPatterns = (function () {
      const tags = detectPatterns(candles);
      const acc  = [];
      const from = Math.max(0, candles.length - 10);
      for (let i = from; i < candles.length; i++) {
        if (!tags[i]) continue;
        const daysAgo = candles.length - 1 - i;
        const when = daysAgo === 0 ? 'today'
                   : daysAgo === 1 ? 'yesterday'
                   : (daysAgo + ' trading days ago');
        acc.push(when + ' = ' + tags[i].label + ' (' + tags[i].e + ')');
      }
      return acc.length ? acc.join('; ') : 'none in the last 10 candles';
    })();

    // Bollinger Band position for richer context
    const bbContext = (function () {
      try {
        const bb   = bollinger(allC, 20, 2);
        const upL  = bb.up[bb.up.length - 1];
        const midL = bb.ma[bb.ma.length - 1];
        const dnL  = bb.dn[bb.dn.length - 1];
        if (upL == null || midL == null || dnL == null) {
          return 'Bollinger Bands not yet calculable (need at least 20 candles).';
        }
        const close = last.c;
        let zone;
        if      (close >= upL) zone = 'AT or ABOVE the upper Bollinger Band — stretched above its recent average, historically a tense zone';
        else if (close <= dnL) zone = 'AT or BELOW the lower Bollinger Band — stretched below its recent average, often a coiled-spring zone';
        else if (close > midL) zone = 'between the middle band and the upper band — slightly above its recent average';
        else                   zone = 'between the middle band and the lower band — slightly below its recent average';
        return 'Bollinger Bands (20-day, 2 standard deviations): upper ' + upL.toFixed(2) +
               ', middle ' + midL.toFixed(2) + ', lower ' + dnL.toFixed(2) +
               '. Today close (' + close.toFixed(2) + ') is ' + zone;
      } catch (e) {
        return 'Bollinger context skipped (calculation error).';
      }
    })();

    if (kind === 'journal-review') {
      // ---- Journal review mode ----
      const entries = getJournalEntries(14);

      if (entries.length === 0) {
        out.textContent =
          'Your Decision Journal is empty for the last 14 days. ' +
          'Make a few manual trades — and record your reasoning each time — then come back for a review.';
        return;
      }

      // Format entries as a readable list for the prompt
      const entryLines = entries.map((e, i) => {
        const src = e.source === 'autopilot' ? '[PILOT]' : '[MANUAL]';
        const why = e.reasoning
          ? 'Reason: "' + e.reasoning + '"'
          : e.autopilotContext
            ? 'Pilot logic: "' + e.autopilotContext + '"'
            : 'No reason recorded.';
        return (i + 1) + '. ' + e.date + ' | ' + src + ' | ' + e.type + ' ' +
               e.qty + ' x ' + e.ticker + ' @ ' +
               (e.ccy === 'USD' ? '$' : 'R') + Number(e.price).toFixed(2) +
               ' | ' + why;
      }).join('\n');

      prompt =
        'You are a patient, warm trading mentor reviewing the recent decisions of Dr Francois Coetzee, ' +
        'a 63-year-old doctor who is LEARNING to trade for the first time. ' +
        'He has been recording his trade reasoning in a Decision Journal. ' +
        'Your job is NOT to evaluate whether his trades made money — that is not the point. ' +
        'Your job is to look at the PATTERNS in HOW he thinks and makes decisions, ' +
        'and help him become more self-aware and disciplined as a learner. ' +
        '\n\n' +
        'Here are his last 14 days of journal entries:\n\n' +
        entryLines +
        '\n\n' +
        'Write a warm, personal review in plain English. Structure it as follows:\n' +
        '(1) **What I notice** — 2-3 observations about patterns in his reasoning. ' +
        'Be specific: quote his actual words when relevant. Patterns to look for: ' +
        'Does he buy on fear or on analysis? Does he give reasons or just act? ' +
        'Does he follow the autopilot logic or override it? Does he sell too early or too late? ' +
        'Does he repeat the same reasoning? Is there emotional language ("I think it will rocket")?\n' +
        '(2) **One strength to build on** — something he is already doing well in his decision-making.\n' +
        '(3) **One thing to try differently** — one specific, concrete habit change for his next trade.\n' +
        '(4) **A question to sit with** — one open-ended question about his trading psychology ' +
        'that only he can answer, designed to deepen his self-awareness.\n' +
        '\n' +
        'Keep the tone warm and honest — like a good teacher who sees both strengths and blind spots. ' +
        'No jargon. No P/L commentary. This is about the quality of his thinking, not the results.\n' +
        'End with: "Learning tool only — speak to your financial advisor before any real money decisions."';

    } else if (kind === 'analyse') {
      prompt =
        'You are a patient teacher writing to Dr Francois Coetzee, a 63-year-old doctor learning to read stock charts for the FIRST TIME. ' +
        'Treat him as a complete novice. Assume he does NOT know what MA50, MA200, RSI, "pulled back", "constructive", "momentum", or "consolidation" mean. ' +
        'Whenever you use a technical term, translate it in plain English the same sentence — for example: ' +
        '"MA50 (the average closing price over the last 50 trading days — a smooth line that shows where the stock has been trending recently)", ' +
        '"MA200 (the same idea but over 200 days — the long-term anchor; price above it = healthy uptrend, below = downtrend)", ' +
        '"RSI (a 0-100 momentum gauge: under 30 = beaten down and possibly oversold, over 70 = bid up hard and possibly overbought, 40-60 = neutral)". ' +
        'Use everyday analogies where they help (weather, traffic, body temperature). Avoid hedge-fund jargon entirely. No "constructive", no "drifted", no "consolidation". Just plain English a non-trader could read. ' +
        'Stock: ' + t.sym + ' (' + t.name + '), exchange ' + t.exch + ', currency ' + t.ccy + '. ' +
        'Today: close ' + last.c.toFixed(2) + ', MA50 ' + (ma50L ? ma50L.toFixed(2) : 'n/a') +
          ', MA200 ' + (ma200L ? ma200L.toFixed(2) : 'n/a') + ', RSI(14) ' + (rsiL ? rsiL.toFixed(0) : 'n/a') + '. ' +
        bbContext + '. ' +
        'Recent candlestick patterns visible on the chart: ' + recentPatterns + '. ' +
        'If any pattern shows up above, briefly explain what that pattern means in plain English when you mention it ' +
        '(e.g. "Hammer = a single candle with a long lower wick and small body, often a bullish reversal hint"). ' +
        'Last 30 candles (date,O,H,L,C,V): ' +
          candles.map(c => [c.d, c.o.toFixed(2), c.h.toFixed(2), c.l.toFixed(2), c.c.toFixed(2), c.v].join(',')).join(' | ') + '. ' +
        'Write FOUR short bullet points titled exactly: ' +
        '(1) **Trend** — is the stock going up, down, or sideways over the past few months, in plain words? Mention the Bollinger position when relevant. ' +
        '(2) **Momentum** — is buying/selling pressure strong, fading, or balanced? Translate the RSI number into "hot / cold / normal". ' +
        '(3) **Volume & Patterns** — are people trading heavily or quietly? Mention any visible candlestick patterns and explain them in plain words. ' +
        '(4) **What to watch tomorrow** — ONE specific price level or behaviour, explained so a non-trader can spot it. ' +
        'Each bullet: 2-3 sentences max. Define every technical term the first time. Warm, patient tone — you are teaching, not reporting. ' +
        'End with this exact line on its own: "Reminder: this is a learning tool, not advice. Speak to your financial advisor before any real trade."';
    } else {
      const summary = TICKERS.map(tt => {
        const cl   = state.data[tt.sym].map(c => c.c);
        const lc   = cl[cl.length - 1];
        const m200 = sma(cl, 200).pop();
        const r    = rsi(cl, 14).pop();
        return tt.sym + ': ' + lc.toFixed(2) + ' ' + tt.ccy +
               ', MA200 ' + (m200 ? m200.toFixed(2) : 'n/a') +
               ', RSI ' + (r ? r.toFixed(0) : 'n/a');
      }).join(' || ');

      prompt =
        'You are giving Dr Francois Coetzee — a 63-year-old doctor LEARNING to read stock charts — a plain-English morning briefing on four stocks: ' +
        'TDY (Teledyne Technologies), TSLA (Tesla), SOL (Sasol, JSE), and MNST (Monster Beverage). ' +
        'Treat him as a beginner. When you mention MA200 or RSI, define them briefly the first time: ' +
        'MA200 = average closing price over the last 200 days (the long-term trend line); ' +
        'RSI = a 0-100 momentum gauge (under 30 = oversold/beaten down, over 70 = overbought/heated up, around 50 = neutral). ' +
        'No jargon, no hype. Use everyday language a non-trader could read. ' +
        'Snapshot today: ' + summary + '. ' +
        'Format: a short opening sentence ("Good morning, Francois — here is the lay of the land today...") ' +
        'then ONE plain-English line per ticker covering: is it in a long-term uptrend (price above its 200-day average) or downtrend, ' +
        'what the momentum gauge is saying, and ONE thing to watch. ' +
        'Close with one short sentence reminding him why the 200-day average matters more than daily news noise — ' +
        'something like: "remember, the long-term trend tells you the weather; daily moves are just the wind." ' +
        'End with: "Learning tool only — talk to your financial advisor before any real trade."';
    }
  } catch (buildErr) {
    out.style.color = 'var(--red)';
    out.textContent = 'Could not prepare the AI request: ' + (buildErr && buildErr.message || buildErr);
    return;
  }

  try {
    const resp = await fetch(state.proxy, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model:      'claude-sonnet-4-6',
        max_tokens: kind === 'journal-review' ? 900 : 600,
        messages:   [{ role: 'user', content: prompt }]
      })
    });
    if (!resp.ok) {
      const text = await resp.text();
      out.textContent = 'Proxy error ' + resp.status + ': ' + text.slice(0, 400);
      return;
    }
    const data = await resp.json();
    const text = (data && data.content && data.content[0] && data.content[0].text) ||
                 JSON.stringify(data, null, 2);
    out.textContent = text;
  } catch (e) {
    out.textContent = 'Network or proxy error: ' + e.message;
  }
}
