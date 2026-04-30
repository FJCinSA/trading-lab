// ============================================================
// FJC Trading Lab — Curriculum Modules (Pillar 7)
// ============================================================
// Structured lessons that use the live lab as the classroom.
// Each lesson combines a plain-English concept explanation,
// step-by-step lab instructions, and a practical exercise.
//
// Architecture note: lessons are defined as data objects with
// HTML-formatted body text (trusted content, not user input).
// This makes it trivial to later load premium lessons from a
// server with a license check — swap the LESSONS array for
// an async fetch, everything else stays the same.
//
// Progress is persisted to localStorage under LS_CURRICULUM.
// ============================================================

import { LS_CURRICULUM } from './config.js';

// ------------------------------------------------------------------
// Lesson definitions
// ------------------------------------------------------------------

export const LESSONS = [
  // ---- LESSON 1 ----
  {
    id: 'candlesticks',
    number: 1,
    title: 'Reading a Candlestick',
    tagline: 'The basic unit of market information',
    duration: '~5 min',
    sections: [
      {
        heading: 'The Concept',
        body: `
<p>Every bar on your chart is one <b>candlestick</b> representing a single trading day. It
encodes five pieces of information:</p>
<ul>
  <li><b>O — Open:</b> the price when trading began that morning</li>
  <li><b>H — High:</b> the highest price reached during the day</li>
  <li><b>L — Low:</b> the lowest price reached during the day</li>
  <li><b>C — Close:</b> the price when trading ended that afternoon</li>
  <li><b>V — Volume:</b> how many shares changed hands that day</li>
</ul>
<p>The <b>body</b> of the candle runs from Open to Close. If the close is <em>higher</em> than
the open, the candle is green — the price went up that day. If the close is <em>lower</em>,
it is red — the price fell.</p>
<p>The thin lines above and below the body are called <b>wicks</b> (or shadows). They show
the full range the price explored during the day before it settled at the close. A long
lower wick means sellers pushed the price down hard, but buyers fought back and recovered
most of the loss before the close. That is often a sign of buying pressure.</p>
<p>One candle is one day of a battle between buyers and sellers. The body and wicks tell
you who was winning and by how much.</p>`
      },
      {
        heading: 'In the Lab',
        body: `
<ol>
  <li>Open the lab and make sure you are on any ticker — TDY is a good start.</li>
  <li>Set the timeframe to <b>90D</b> so you have a reasonable number of candles visible.</li>
  <li><b>Hover your mouse over any candle.</b> A tooltip appears showing the exact O, H, L, C
      values, the volume for that day, and how that volume compares to the recent average.</li>
  <li>Find a <b>green candle</b> and hover over it. Confirm that the Close is higher than the Open.</li>
  <li>Find a <b>red candle</b> and hover. Confirm Close is lower than Open.</li>
  <li>Find a candle with an unusually <b>long wick</b>. Notice where the open and close sit
      relative to the total day's range.</li>
</ol>`
      },
      {
        heading: 'What to Watch For',
        body: `
<ul>
  <li>A candle where the body is very small but the wicks are long on both sides is called a
      <b>Doji</b> — it means indecision. Neither buyers nor sellers won that day. Look for the ⚫
      marker on the chart when patterns are enabled.</li>
  <li>A candle with a very small body at the top and a long lower wick is a <b>Hammer</b> — buyers
      absorbed a big sell-off and closed near the top. Often appears near bottoms. Look for 🔨.</li>
  <li>Volume tells you how <em>meaningful</em> a candle is. A big green candle on low volume is a
      weak signal. The same candle on twice the average volume is a strong one.</li>
</ul>`
      },
      {
        heading: 'The Exercise',
        body: `
<p>Set the timeframe to <b>1Y</b> on TDY. Find three candles that you consider notable —
one that shows strong buying, one that shows strong selling, and one that shows indecision.
Hover over each and note the OHLCV values.</p>
<p>If you want to go further: make a paper <b>BUY</b> trade on a day with a strong hammer
candle, and write your reasoning in the journal. This is the first entry in your decision
record.</p>`
      }
    ]
  },

  // ---- LESSON 2 ----
  {
    id: 'moving-averages',
    number: 2,
    title: 'MA50 & MA200 — The Two Lines That Matter',
    tagline: 'Smoothing out the noise to find the trend',
    duration: '~7 min',
    sections: [
      {
        heading: 'The Concept',
        body: `
<p>A <b>moving average</b> is simply the average closing price over the last N days, recalculated
every day as a new candle arrives. It smooths out the daily noise and shows you the underlying
trend direction.</p>
<p>The <b>MA50</b> (50-day moving average) tracks the short-term trend — roughly the last
2.5 months of trading. It reacts relatively quickly to price changes.</p>
<p>The <b>MA200</b> (200-day moving average) tracks the long-term trend — roughly the last
10 months. It moves slowly and is considered the most important line on any professional chart.
If a stock is trading <em>above</em> its MA200, it is in a long-term uptrend. Below it, a
long-term downtrend.</p>
<p>Two events matter above everything else:</p>
<ul>
  <li><b>Golden Cross:</b> The MA50 crosses <em>above</em> the MA200. Historically associated
      with further upside. Look for the 🟢 marker on the chart.</li>
  <li><b>Death Cross:</b> The MA50 crosses <em>below</em> the MA200. Historically associated
      with further downside. Look for the 💀 marker.</li>
</ul>
<p class="curriculum-callout">⚠️ <b>Critical honesty:</b> Moving averages are <em>lagging</em>
indicators. A Golden Cross only appears after the price has already risen enough to lift MA50
above MA200. It confirms a trend that is already underway — it does not predict a new one. Anyone
selling you a moving-average strategy as a reliable "signal" is either confused or dishonest.
Used correctly, moving averages give you <em>context</em>, not certainty.</p>`
      },
      {
        heading: 'In the Lab',
        body: `
<ol>
  <li>Make sure the <b>MA50</b> and <b>MA200</b> toggles are both <b>ON</b> (highlighted) in the
      indicator toolbar.</li>
  <li>Set the timeframe to <b>1Y</b> or <b>2Y</b> to see enough history for the lines to separate.</li>
  <li>The <b>gold line</b> is MA50. The <b>blue line</b> is MA200.</li>
  <li>Find a point where the two lines cross. Check: is there a 🟢 or 💀 marker below the candle?
      Hover over that candle to see the exact date.</li>
  <li>Now look at what the price did in the <em>30 days after</em> that cross. Did the trend
      continue, or reverse?</li>
  <li>Switch to <b>SPY</b> (if you have live data loaded) and find the Death Cross that occurred
      in early 2022. Then find the Golden Cross recovery. What was the gap between them?</li>
</ol>`
      },
      {
        heading: 'What to Watch For',
        body: `
<ul>
  <li>The <b>distance</b> between MA50 and MA200 matters. A wide gap means a strong trend.
      A narrowing gap means the trend is weakening and a cross may be coming.</li>
  <li><b>Price bouncing off MA200</b> is one of the most reliable observations in technical
      analysis. When price falls to MA200 and then recovers, many professional traders treat
      MA200 as a support level.</li>
  <li>In <b>Replay Mode</b> you can watch a cross developing in real time — the lines narrowing
      day by day before the event. This is what it felt like to be a trader watching that happen.</li>
</ul>`
      },
      {
        heading: 'The Exercise',
        body: `
<p>Enable the <b>Historical Analogs</b> feature on any ticker (click "Find analogs"). The lab
will search history for setups where the price was in the same position relative to MA50 and
MA200 as today. Read the distribution of outcomes shown.</p>
<p>Notice that the median return is close to zero and the win rate is close to 50% for most
setups. This is the honest answer to "what happens next."</p>
<p>Use the journal to write down what you observe: "I found [X] analog matches. The median
30-day return was [Y]%. This tells me..."</p>`
      }
    ]
  },

  // ---- LESSON 3 ----
  {
    id: 'rsi',
    number: 3,
    title: 'RSI — Is This Stock Overextended?',
    tagline: 'Measuring momentum on a 0–100 scale',
    duration: '~6 min',
    sections: [
      {
        heading: 'The Concept',
        body: `
<p>The <b>RSI</b> (Relative Strength Index) measures <em>momentum</em> — how fast and how
far price has moved recently, expressed as a number between 0 and 100. It does not measure
the direction of a trend; it measures the speed of the move.</p>
<p>The standard interpretation:</p>
<ul>
  <li><b>RSI above 70:</b> The stock is <em>potentially overbought</em> — it has moved up
      fast recently relative to its own history. This can precede a pullback.</li>
  <li><b>RSI below 30:</b> The stock is <em>potentially oversold</em> — it has moved down
      fast recently. This can precede a bounce.</li>
  <li><b>RSI between 30 and 70:</b> The neutral zone. No extreme reading. Most days look
      like this.</li>
</ul>
<p class="curriculum-callout">⚠️ <b>Critical honesty:</b> RSI describes the current state;
it does not predict what comes next. A stock can stay above 70 for weeks during a strong
bull run. An RSI extreme is a <em>flag worth investigating</em>, not a command to act.
Anyone telling you "RSI crossed 70, sell immediately" is giving you a rule that fails more
than half the time.</p>
<p>RSI is most useful when combined with other context: trend direction (MA200), volume, and
candlestick patterns. Alone, it is a weak signal. In combination, it adds meaningful
information.</p>`
      },
      {
        heading: 'In the Lab',
        body: `
<ol>
  <li>The RSI chart appears at the <b>bottom of the chart area</b>. It shows a line between
      0 and 100, with dashed reference lines at 70 and 30.</li>
  <li>Set the timeframe to <b>1Y</b> and look for points where RSI crosses above 70 or
      below 30. These are marked with 🔴 (overbought) or 💚 (oversold) action markers below
      the corresponding candle.</li>
  <li>When you hover over a candle, the tooltip shows the current RSI value in
      <span style="color:#5aa8ff">blue</span> if below 50 or <span style="color:#e0524d">red</span>
      if approaching extreme levels.</li>
  <li>Find one moment where RSI went below 30. Look at the 5 candles that followed.
      Did the price bounce? Or did it keep falling?</li>
  <li>Now find one moment where RSI went above 70. What happened next?</li>
</ol>`
      },
      {
        heading: 'What to Watch For',
        body: `
<ul>
  <li><b>RSI divergence:</b> Price makes a new high but RSI makes a lower high. This means
      the upward move has <em>less momentum</em> behind it than the previous one. A potential
      warning sign.</li>
  <li><b>RSI in a strong trend:</b> In a bull run, RSI often stays between 50 and 80 for months.
      In a bear market, it stays between 20 and 50. The "overbought" and "oversold" thresholds
      become less useful — adjust your expectations to the trend.</li>
  <li>Use the <b>Historical Analogs</b> feature. RSI bucket (low/medium/high) is one of the
      three factors the analog engine uses to find matching setups in history.</li>
</ul>`
      },
      {
        heading: 'The Exercise',
        body: `
<p>Switch to <b>META</b> (if you have live data). Set timeframe to <b>2Y</b>. The 2022 crash
will be visible. Watch how RSI behaved during the decline — it repeatedly dipped below 30 and
bounced, only to fall further each time.</p>
<p>This is the lesson: an oversold RSI in a broken trend is not a buy signal. It is a
description of how bad the selling pressure is. Context from the trend (MA200 position) is
everything.</p>
<p>Journal entry prompt: "I found RSI below 30 in [ticker] on [date]. The MA200 was [above/
below] price. My conclusion about the significance of this reading is..."</p>`
      }
    ]
  },

  // ---- LESSON 4 ----
  {
    id: 'volume',
    number: 4,
    title: 'Volume — The Story Behind the Move',
    tagline: 'Price tells you what happened. Volume tells you whether to believe it.',
    duration: '~6 min',
    sections: [
      {
        heading: 'The Concept',
        body: `
<p><b>Volume</b> is the number of shares that changed hands on a given day. A trade happens
when a buyer and a seller agree on a price. Every share bought must be sold by someone else.
High volume means many traders are making decisions. Low volume means few are.</p>
<p>Volume validates or undermines price moves:</p>
<ul>
  <li><b>Big price move + high volume:</b> Conviction. Many traders believe in this move.
      It is more likely to continue.</li>
  <li><b>Big price move + low volume:</b> Weak. Few traders are behind it. It may not hold.</li>
  <li><b>Price flat + high volume:</b> A battle is underway. Buyers and sellers are fighting
      hard and neither is winning yet. Watch for the next move.</li>
  <li><b>Falling price + rising volume:</b> Real distribution. Professional money is selling
      and retail buyers are absorbing it. This is often seen at market tops before a decline.</li>
</ul>
<p>Volume is the most overlooked indicator by beginners. Most people stare at the price line
and ignore the bars at the bottom. The bars at the bottom are often the more honest signal.</p>
<p class="curriculum-callout">The lab highlights <b>volume spikes</b> (days where volume is
more than 1.5× the recent average) in <span style="color:#c9a84c">gold</span>. These are the
days worth studying. Something happened that day — institutional money moved, news was released,
or a technical level was broken. The candle body tells you the direction; the gold bar tells you
the conviction.</p>`
      },
      {
        heading: 'In the Lab',
        body: `
<ol>
  <li>Look at the <b>volume chart</b> — the bar chart below the main price chart.</li>
  <li>The bars are green when price closed up, red when price closed down.</li>
  <li><b>Gold bars</b> are volume spikes — more than 1.5× the recent average volume.
      These are the most important bars on the volume chart.</li>
  <li>Find three gold volume bars and hover over the corresponding candles in the main
      chart. For each one: what did price do on that day? What happened the next 3 days?</li>
  <li>Now specifically look for a <b>gold bar on a down day</b>. This is often a capitulation
      event — panic selling. Find one and check whether price recovered or continued falling
      in the following week.</li>
</ol>`
      },
      {
        heading: 'What to Watch For',
        body: `
<ul>
  <li><b>Volume climax:</b> An unusually large volume spike at the end of a long move down —
      often the final panic sellers. After this, price sometimes stabilises. But not always.
      Context matters.</li>
  <li><b>Low volume rallies:</b> A price moving up on declining volume is a warning sign.
      There is not enough buying conviction to sustain the move.</li>
  <li><b>Breakouts on volume:</b> When price breaks above a resistance level on high volume,
      the break is more likely to hold. A breakout on low volume often fails and reverses.</li>
</ul>`
      },
      {
        heading: 'The Exercise',
        body: `
<p>Switch to <b>SPY</b> and load the <b>COVID-19 Crash</b> via Famous Crashes. Step through
February and March 2020 day by day using the Replay controls.</p>
<p>Pay attention only to volume. Don't try to predict direction. Just observe: on which days
did volume spike gold? Were they up days or down days? Did the gold days cluster at the
bottom of the crash, or were they spread throughout?</p>
<p>The highest volume day of the entire COVID crash occurred near the final bottom on
March 23, 2020. This is the textbook volume climax — maximum fear, maximum volume,
near-maximum price impact. Recognising this pattern in real time is one of the hardest
skills in trading.</p>
<p>Journal entry: "The volume pattern I noticed during the COVID crash was..."</p>`
      }
    ]
  },

  // ---- LESSON 5 ----
  {
    id: 'crash-study',
    number: 5,
    title: 'Your First Crash Study — COVID 2020',
    tagline: 'Navigating the fastest market crash in history with no hindsight',
    duration: '~15 min',
    sections: [
      {
        heading: 'Before You Start',
        body: `
<p>This lesson is different. You will not read about a crash — you will <em>live through it</em>
using the Replay Mode.</p>
<p>The rules:</p>
<ul>
  <li>You start on <b>January 15, 2020</b> with R100,000 in paper money.</li>
  <li>You advance one day at a time. You see only what a trader on that day would have seen.</li>
  <li>Use the chart tools — MA50, MA200, RSI, volume — to make decisions.</li>
  <li>Use the journal to write a reason for every trade you make.</li>
  <li><b>No looking ahead.</b> No scrolling forward. Trust only the data on the screen.</li>
</ul>
<p>The goal is not to make money. The goal is to understand what it felt like to trade in
real time — the uncertainty, the false bottoms, the moments of recovery that reversed, and
the final bottom that looked exactly like all the other false ones.</p>
<p class="curriculum-callout">This is why Replay Mode exists. Paper trading on live charts
is easy — you know the recent outcome. Replay Mode removes that knowledge. It is the closest
thing to real trading experience you can get without risking actual capital.</p>`
      },
      {
        heading: 'The Setup',
        body: `
<ol>
  <li>Scroll down to the <b>Famous Crashes</b> section and click <b>COVID-19 Crash</b>.</li>
  <li>Wait for SPY data to load. The context panel will appear above the chart — read it.</li>
  <li>The chart is now positioned at <b>January 15, 2020</b>. SPY is near all-time highs.
      Everything looks fine.</li>
  <li>Note the RSI, the position relative to MA200, and the recent volume pattern. This is
      your baseline.</li>
  <li>Decide: do you buy, hold cash, or wait? Write your reasoning in the journal before
      you do anything.</li>
</ol>`
      },
      {
        heading: 'Key Dates to Reach',
        body: `
<p>Step forward day by day using the ▶ button. When you reach each of these dates, pause and
assess before continuing:</p>
<ul>
  <li><b>February 12, 2020:</b> SPY all-time high. The virus is mentioned in news but markets
      are dismissing it. What does your chart say?</li>
  <li><b>February 24, 2020:</b> The first significant down day. Italy announces community
      spread. Volume is elevated. Do you sell? Or "buy the dip"?</li>
  <li><b>March 4, 2020:</b> A 4.6% bounce. Is this the recovery? Or a dead-cat bounce?
      What does RSI say? What does MA200 say?</li>
  <li><b>March 12, 2020:</b> Circuit breakers fire. SPY falls 10% in one session. RSI is deep
      below 30. Volume is gold. Do you buy the oversold reading?</li>
  <li><b>March 23, 2020:</b> The actual bottom. But you don't know it is the bottom.
      What does the chart look like right now?</li>
</ul>`
      },
      {
        heading: 'The Reflection',
        body: `
<p>After you have stepped through to April, compare your portfolio to buy-and-hold performance
(visible in the portfolio section).</p>
<p>Most people who attempt this exercise discover one of two things:</p>
<ol>
  <li>They sold somewhere between February 24 and March 12 — a reasonable decision — but then
      failed to buy back in time, and underperformed buy-and-hold.</li>
  <li>They bought every dip ("RSI is oversold!") and were repeatedly burned as the market
      continued lower, ending up worse than if they had done nothing.</li>
</ol>
<p>Neither outcome means you made a mistake. It means you understand, now from experience
rather than reading, why market timing is genuinely hard — and why most professional fund
managers underperform a simple index fund over 10 years.</p>
<p class="curriculum-callout">Write a journal entry titled "What COVID 2020 taught me about
my decision-making." This will be valuable when the AI Review analyses your patterns in
Lesson 6.</p>`
      }
    ]
  },

  // ---- LESSON 6 ----
  {
    id: 'decision-journal',
    number: 6,
    title: 'The Decision Journal',
    tagline: 'The habit that separates learning traders from everyone else',
    duration: '~8 min',
    sections: [
      {
        heading: 'Why Most Traders Never Improve',
        body: `
<p>Most people who trade paper money for months make the same mistakes repeatedly without
knowing it. They remember the good trades. They forget or rationalise the bad ones. After a
year, they feel experienced — but their win rate is the same as month one.</p>
<p>The problem is not intelligence or effort. The problem is the absence of a written record
of reasoning. Without a record, your brain rewrites history to protect your self-image.
"I knew it was going to bounce" — but you didn't write that down before the bounce. You
thought it when you saw the bounce happen.</p>
<p>The <b>Decision Journal</b> in this lab is not a P&L log. Anyone can add up profits and
losses. This is a <em>reasoning log</em>. Every trade records not just what you did but
<em>why you believed it was the right thing to do</em> at that moment.</p>
<p>Over time, patterns emerge. You discover that you consistently buy when RSI is oversold
regardless of trend context — and it costs you. You discover that your losing trades have
shorter, vaguer reasons than your winning trades. These discoveries cannot be made without
a written record.</p>`
      },
      {
        heading: 'What a Good Reason Looks Like',
        body: `
<p>When you click Buy or Sell, the lab asks for a reason. Here is the difference between
a useful entry and a useless one:</p>
<p><b>Useless:</b> "It looked like it was going up."<br>
<b>Useless:</b> "I had a feeling."<br>
<b>Useless:</b> "It dropped, so I bought the dip."</p>
<p><b>Useful:</b> "RSI has crossed below 30 for only the third time in 12 months, price
is sitting on the MA200 which has held as support twice before, and today's volume spike
suggests capitulation selling. I am buying a half position."</p>
<p>The difference: the useful entry names the specific evidence, names the specific
indicators, and names the specific historical context. If you cannot name these things,
you do not have a thesis — you have a guess. There is nothing wrong with acknowledging
a guess in the journal. "No clear signal, buying a small position out of curiosity" is
an honest entry that will teach you something about your impulsive trading.</p>
<p class="curriculum-callout">The quality of your reasons is a leading indicator of your
performance. As your reasons get more specific and evidence-based, your decisions will
improve before your win rate improves. The journal tracks the leading indicator, not
the lagging one.</p>`
      },
      {
        heading: 'Using the AI Review',
        body: `
<ol>
  <li>After you have at least <b>5–10 journal entries</b>, click the <b>AI Review</b>
      button in the Decision Journal section.</li>
  <li>The AI reads your last 14 days of entries and provides four things:
      <b>(1)</b> what it notices about your trading patterns,
      <b>(2)</b> one specific strength it can identify,
      <b>(3)</b> one thing to try differently, and
      <b>(4)</b> a question to help you think more deeply about your approach.</li>
  <li>The AI is not telling you what to trade. It is acting as a mirror — reflecting
      your own decision patterns back at you in a form you can examine.</li>
  <li>Read the feedback slowly. Disagree with it if you have good reason. Write a
      response in the journal if something surprises you.</li>
</ol>
<p>The AI Review is most valuable when you have <em>consistent</em> entries — same format,
honest reasons, regular frequency. Entries like "bought because gut feeling" five times in
a row will generate a very honest and useful AI response.</p>`
      },
      {
        heading: 'The Exercise and a Challenge',
        body: `
<p>For the next <b>five lab sessions</b>, commit to the following discipline:</p>
<ol>
  <li>Before making any trade, write at least two sentences of reasoning that reference a
      specific indicator and a specific historical context from the chart.</li>
  <li>After each session, read back your entries from that session. Were the reasons
      specific? Were they accurate descriptions of what the chart showed?</li>
  <li>After five sessions, click AI Review and read the feedback with an open mind.</li>
</ol>
<p>This is the entire programme in one practice. The chart tools, the pattern markers, the
historical analogs, the crash studies — they all feed into this final habit. The journal
is where all the learning becomes permanent.</p>
<p class="curriculum-callout"><b>The bigger picture:</b> Every professional trader who has
written honestly about their craft — Paul Tudor Jones, Ray Dalio, Jesse Livermore — kept
detailed trading notes. The notes are not a memory aid. They are the mechanism by which
experience becomes wisdom rather than just the passage of time.</p>`
      }
    ]
  }
];

// ------------------------------------------------------------------
// Progress helpers
// ------------------------------------------------------------------

function loadProgress() {
  try { return JSON.parse(localStorage.getItem(LS_CURRICULUM)) || []; }
  catch (e) { return []; }
}

function saveProgress(completed) {
  localStorage.setItem(LS_CURRICULUM, JSON.stringify(completed));
}

export function markComplete(id) {
  const completed = loadProgress();
  if (!completed.includes(id)) completed.push(id);
  saveProgress(completed);
  renderCurriculum(); // refresh the card
}

export function getLessonProgress() {
  const completed = loadProgress();
  return { completed: completed.length, total: LESSONS.length, ids: completed };
}

// ------------------------------------------------------------------
// Render the curriculum card (progress bar + lesson list)
// ------------------------------------------------------------------

export function renderCurriculum() {
  const container = document.getElementById('curriculum-list');
  const progressEl = document.getElementById('curriculum-progress');
  if (!container) return;

  const { completed: done, total, ids } = getLessonProgress();

  if (progressEl) {
    const pct = Math.round((done / total) * 100);
    progressEl.innerHTML =
      '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:6px">' +
        '<span style="font-size:12px;color:var(--muted)">' + done + ' of ' + total + ' lessons complete</span>' +
        (done === total ? '<span style="font-size:11px;color:var(--green);font-weight:700">✓ All complete</span>' : '') +
      '</div>' +
      '<div style="background:var(--panel-2);border-radius:4px;height:6px;overflow:hidden">' +
        '<div style="background:var(--gold);height:6px;width:' + pct + '%;border-radius:4px;transition:width .4s"></div>' +
      '</div>';
  }

  container.innerHTML = '';
  for (const lesson of LESSONS) {
    const isComplete = ids.includes(lesson.id);
    const card = document.createElement('div');
    card.className = 'lesson-card' + (isComplete ? ' lesson-complete' : '');
    card.innerHTML =
      '<div class="lesson-card-row">' +
        '<span class="lesson-num">' + lesson.number + '</span>' +
        '<div style="flex:1;min-width:0">' +
          '<div class="lesson-title">' + lesson.title + '</div>' +
          '<div class="lesson-tagline">' + lesson.tagline + '</div>' +
        '</div>' +
        '<div style="text-align:right;flex-shrink:0">' +
          '<div style="font-size:10px;color:var(--muted)">' + lesson.duration + '</div>' +
          (isComplete ? '<div style="font-size:11px;color:var(--green);font-weight:700;margin-top:2px">✓ Done</div>' : '') +
        '</div>' +
      '</div>';
    card.onclick = () => openLesson(lesson);
    container.appendChild(card);
  }
}

// ------------------------------------------------------------------
// Open a lesson in the modal
// ------------------------------------------------------------------

export function openLesson(lesson) {
  const modal    = document.getElementById('lesson-modal');
  const titleEl  = document.getElementById('lesson-modal-title');
  const metaEl   = document.getElementById('lesson-modal-meta');
  const bodyEl   = document.getElementById('lesson-modal-body');
  const doneBtn  = document.getElementById('lesson-modal-done');
  const closeBtn = document.getElementById('lesson-modal-close');
  if (!modal || !titleEl || !bodyEl) return;

  // Populate header
  titleEl.textContent = 'Lesson ' + lesson.number + ': ' + lesson.title;
  if (metaEl) metaEl.textContent = lesson.tagline + '  ·  ' + lesson.duration;

  // Populate body — sections with headings and HTML content
  bodyEl.innerHTML = lesson.sections.map(s =>
    '<h3 class="lesson-section-heading">' + s.heading + '</h3>' +
    '<div class="lesson-section-body">' + s.body + '</div>'
  ).join('');

  // Done button state
  const { ids } = getLessonProgress();
  const isComplete = ids.includes(lesson.id);
  if (doneBtn) {
    doneBtn.textContent = isComplete ? '✓ Complete' : 'Mark as Complete';
    doneBtn.classList.toggle('lesson-done-active', isComplete);
    doneBtn.onclick = () => {
      markComplete(lesson.id);
      doneBtn.textContent = '✓ Complete';
      doneBtn.classList.add('lesson-done-active');
    };
  }

  if (closeBtn) closeBtn.onclick = closeLesson;

  // Close on backdrop click
  modal.onclick = (e) => { if (e.target === modal) closeLesson(); };

  // Scroll to top of body
  bodyEl.scrollTop = 0;

  modal.style.display = 'flex';
  document.body.style.overflow = 'hidden'; // prevent background scroll
}

export function closeLesson() {
  const modal = document.getElementById('lesson-modal');
  if (modal) modal.style.display = 'none';
  document.body.style.overflow = '';
}
