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

  // ---- LESSON 7 ----
  {
    id: 'position-sizing',
    number: 7,
    title: 'Position Sizing & The 2% Rule',
    tagline: 'The rule that keeps you in the game long enough to learn',
    duration: '~7 min',
    sections: [
      {
        heading: 'Why Position Sizing is More Important Than Entry Signals',
        body: `
<p>Most traders obsess over finding the perfect entry signal. The professionals obsess over
something far less glamorous: <b>how much to risk on each trade</b>. This is called position
sizing, and it is arguably the most important skill in trading — more important than pattern
recognition, more important than market analysis.</p>
<p>Here is why: even the best traders in the world are wrong 40% of the time. The difference
between a trader who survives and grows and one who blows up their account is not win rate.
It is <b>how much they lose when they are wrong</b> versus how much they gain when they are right.</p>
<p>A trader who risks 25% of their capital on a single trade and loses four times in a row
is at 32% of their starting capital. Recovery requires a 213% gain just to break even.
A trader who risks 2% on each trade and loses four times in a row is at 92%. They barely
noticed.</p>
<p class="curriculum-callout">The 2% Rule: never risk more than 2% of your total portfolio
value on any single trade. This is not timidity. It is arithmetic. It keeps you in the game
long enough for your edge to express itself over many trades.</p>`
      },
      {
        heading: 'The Position Size Formula',
        body: `
<p>Once you have a stop loss level (where you will exit if wrong), the position size follows
mathematically:</p>
<p style="background:rgba(201,168,76,.08);border-left:3px solid var(--gold);padding:10px 14px;border-radius:0 6px 6px 0;font-family:monospace">
Position Size = (Portfolio Value × Risk %) ÷ (Entry Price − Stop Loss Price)
</p>
<p><b>Example:</b> Portfolio = R100,000. Risk = 2% = R2,000. Entry = R150. Stop = R142.
Risk per share = R150 − R142 = R8. Position size = R2,000 ÷ R8 = <b>250 shares</b>.</p>
<p>Notice what this formula does: it connects your stop loss to your position size. If you
place a stop very close (tight stop), you can buy more shares. If you place it far away
(wide stop), you buy fewer. The <em>rand amount at risk</em> stays constant regardless.</p>
<p>The <b>Risk/Reward Calculator</b> in the Trade tab does this calculation for you. Set
your entry, stop, and target — it shows the R:R ratio and exactly what percentage of your
portfolio is at risk before you commit.</p>`
      },
      {
        heading: 'The R:R Ratio — Why 1:1 is Losing Money',
        body: `
<p>The <b>Risk/Reward ratio (R:R)</b> compares how much you stand to gain against how much
you stand to lose on a trade.</p>
<ul>
  <li><b>R:R 1:1</b> — risking R1,000 to make R1,000. You need to win more than 50% of
      the time just to break even after costs. Most traders cannot do this consistently.</li>
  <li><b>R:R 2:1</b> — risking R1,000 to make R2,000. You only need to win 34% of your
      trades to be profitable. This is survivable even in a difficult market.</li>
  <li><b>R:R 3:1</b> — the target for serious traders. Win only 26% of trades and you
      still profit. The best traders find setups with 3:1 or better.</li>
</ul>
<p>The brutal truth about most retail traders: they take R:R ratios below 1:1 — risking
more than they stand to gain — because they place wide stops and small targets. They then
wonder why, even with a 60% win rate, they lose money.</p>
<p class="curriculum-callout">The exercise: before your next 10 paper trades, calculate the
R:R ratio using the Trade tab calculator. Refuse to take any trade with an R:R below 1.5:1.
After 10 trades, compare your results to your previous 10.</p>`
      },
      {
        heading: 'Compound Growth: Why Small Consistent Wins Beat Big Wins',
        body: `
<p>Imagine two traders, both starting with R100,000:</p>
<p><b>Trader A (Big Swings):</b> Makes 30% in a good month, loses 25% the next. Over a year:
months 1, 3, 5, 7, 9, 11 are +30%. Months 2, 4, 6, 8, 10, 12 are -25%. After 12 months:
R100,000 × (1.30 × 0.75)⁶ ≈ <b>R85,000</b>. Lost money despite winning half the time.</p>
<p><b>Trader B (Consistent 2%):</b> Makes 2% every month, loses 1% every other month.
After 12 months: R100,000 × (1.02⁸ × 0.99⁴) ≈ <b>R114,000</b>. Quiet profit.</p>
<p>This is the mathematics of compounding: <em>avoiding large losses matters more than
achieving large gains</em>. A 30% loss requires a 43% gain just to recover. A 50% loss
requires a 100% gain. Protecting the downside is the primary job of every position sizing
rule.</p>`
      }
    ]
  },

  // ---- LESSON 8 ----
  {
    id: 'stop-loss',
    number: 8,
    title: 'The Stop Loss — Your Seat Belt',
    tagline: 'The only tool that protects you when you are wrong',
    duration: '~6 min',
    sections: [
      {
        heading: 'What a Stop Loss Is and Why Most Traders Ignore It',
        body: `
<p>A <b>stop loss</b> is a pre-set price level at which you will exit a position if it moves
against you. It is your acknowledgement, before you enter the trade, that you could be wrong —
and your commitment to what you will do when that happens.</p>
<p>Most retail traders do not use stop losses. The reasons they give: "I'll watch it
carefully." "It's just a temporary dip." "If I set a stop it will get hit and then
immediately reverse." These are rationalisations for the same underlying discomfort: <b>not
wanting to be wrong</b>. Taking a loss makes the wrongness permanent and visible.</p>
<p>But here is the uncomfortable arithmetic: a trade without a stop loss is a trade with an
infinite downside. Every catastrophic trading loss in history — from retail traders to hedge
funds — has the same origin: a position that was held past the point of reason because the
trader could not accept being wrong.</p>
<p class="curriculum-callout">A stop loss does not guarantee you will be right. It guarantees
that when you are wrong, the damage is limited and survivable.</p>`
      },
      {
        heading: 'Where to Place a Stop',
        body: `
<p>The wrong place: wherever your pain tolerance ends. "I'll sell if it drops 10%" is not
a thesis — it is an emotional threshold.</p>
<p>The right place: at a price that, if reached, means your original thesis is <em>wrong</em>.</p>
<ul>
  <li><b>Below support:</b> if you buy near a support level, your stop goes just below it.
      A close below major support means the buyers who defended that level have given up.</li>
  <li><b>Below the moving average:</b> if you buy because price bounced off MA200, your stop
      goes below the MA200. If it closes below that line, your reason for buying no longer exists.</li>
  <li><b>Below the pattern low:</b> if you buy a hammer candlestick, your stop goes below
      the hammer's wick. That is the level the market already tested and rejected.</li>
</ul>
<p>Use the <b>Draw S/R</b> toggle and the chart to identify these levels visually before
you trade. The chart will show you where meaningful levels exist — not your emotions.</p>`
      },
      {
        heading: 'The Trailing Stop — Protecting Profits',
        body: `
<p>A standard stop loss sits at a fixed price. A <b>trailing stop</b> moves upward with the
price, always staying a set distance below the current high. It never moves down.</p>
<p>This solves one of the hardest problems in trading: how to let a winner run while still
protecting the profit. Without a trailing stop, most traders exit too early because they
fear giving back gains. With one, the exit happens only when the price genuinely reverses.</p>
<p>Practical trailing stop in this lab: after a position is up 10%+, manually raise your
mental stop to just below the most recent swing low visible on the chart. Every new high
the price makes, raise the stop to just below the new swing low. This is the approach the
autopilot approximates with its RSI trim rule.</p>
<p class="curriculum-callout">Exercise: take a paper trade and set a stop using one of the
three methods above. Write your stop level and reasoning in the journal. At the next
session, evaluate whether the stop was in the right place — regardless of outcome. Good
stop placement is a skill independent of whether the trade won.</p>`
      }
    ]
  },

  // ---- LESSON 9 ----
  {
    id: 'correlations',
    number: 9,
    title: 'Correlation & Diversification',
    tagline: 'Why owning five tech stocks is not a diversified portfolio',
    duration: '~7 min',
    sections: [
      {
        heading: 'What Correlation Means',
        body: `
<p><b>Correlation</b> measures how consistently two assets move together. A correlation of
+1.0 means they move in perfect lockstep — when one rises 5%, the other rises 5%. A
correlation of −1.0 means they move in perfect opposite directions. A correlation of 0
means there is no relationship — they move independently.</p>
<p>Why does this matter? Because the purpose of holding multiple assets is to smooth out
your overall returns. If all your assets are highly correlated, you do not have a diversified
portfolio — you have a concentrated bet wearing different labels.</p>
<p>Common high-correlation traps retail traders fall into:</p>
<ul>
  <li>Owning TSLA + META + QQQ and thinking they are diversified (all tech, all correlate
      heavily to Nasdaq sentiment)</li>
  <li>Owning multiple SA stocks without realising they all share ZAR currency risk and
      JSE index risk</li>
  <li>Owning both ETH and BTC thinking crypto is diversified (they typically move together
      with 0.85+ correlation)</li>
</ul>`
      },
      {
        heading: 'The Instruments That Actually Diversify',
        body: `
<p>In this lab's instrument set, here are the broad correlation relationships to understand:</p>
<p><b>High risk-on correlation (move together):</b> TSLA, META, QQQ, ETH, BTC, EEM.
When global risk appetite rises, these all tend to move up together. When it falls, they
fall together.</p>
<p><b>Defensive / counter-cyclical:</b> GOLD, TLT (in some regimes). Gold rises when
fear spikes; TLT rises when the Fed cuts rates or investors flee equities. Neither is
guaranteed — the relationship breaks in stagflation (high inflation + falling growth).</p>
<p><b>Economic leading indicators:</b> COPPER, OIL. These tell you about future growth
before the equity market prices it in. Rising copper while equities fall = growth
expectations diverging from sentiment — potentially a buying opportunity.</p>
<p><b>Forex as a macro lens:</b> USDJPY tells you about global carry trade risk. USDZAR
tells you about EM risk appetite. EURUSD tells you about dollar strength. None of these
can be replicated by holding equities — they add genuine orthogonal information.</p>
<p class="curriculum-callout">Exercise: use the <b>Compare vs…</b> overlay to compare
GOLD vs SPY over 2 years. Then compare BTC vs QQQ. Then compare OIL vs EWG. Write what
you observe about the correlations — when do they diverge, and what does that divergence signal?</p>`
      },
      {
        heading: 'Building a Portfolio That Actually Diversifies',
        body: `
<p>A simple framework: think in <b>four buckets</b>, and hold something from each:</p>
<ol>
  <li><b>Growth equities</b> (the engine): SPY, QQQ, or individual stocks. This is your
      return generator. It will have the largest swings.</li>
  <li><b>Defensive store of value</b>: GOLD. Not a trade — a structural position sized at
      5–15% that reduces portfolio volatility without significantly reducing long-term returns.</li>
  <li><b>Rate sensitivity</b>: TLT or similar bond exposure. Balances equity drawdowns
      in recession scenarios where the Fed cuts rates.</li>
  <li><b>Local / EM exposure</b>: for South African investors, JSE stocks and ZAR assets
      provide natural currency matching for local spending needs.</li>
</ol>
<p>The goal is not maximum return in any one year. It is the best return <em>per unit of
volatility</em> over a full market cycle. This ratio — return divided by volatility — is
called the Sharpe Ratio, and it is how professionals measure portfolio quality.</p>`
      }
    ]
  },

  // ---- LESSON 10 ----
  {
    id: 'macro',
    number: 10,
    title: 'The Macro Big Picture',
    tagline: 'Interest rates are the price of money — everything flows from here',
    duration: '~9 min',
    sections: [
      {
        heading: 'The Most Important Price in the World',
        body: `
<p>There is one number that affects every single asset in this lab — every equity, every
commodity, every currency, every bond. That number is the <b>US federal funds rate</b>:
the interest rate set by the US Federal Reserve.</p>
<p>Think of it this way: the interest rate is the <em>price of money</em>. When money is
cheap (low rates), it flows everywhere — into stocks, into property, into crypto, into
commodities, into emerging markets. Asset prices rise because cheap capital chases returns.</p>
<p>When money is expensive (high rates), it flows back to safety — into bonds, into the
dollar, out of risk assets. Asset prices fall because capital earns a good return just
sitting in a bank account.</p>
<p>Understanding where the Fed is in its cycle — and where it is going — is the single
most powerful macro lens available to any investor. Every other analysis is downstream
of this.</p>
<p class="curriculum-callout">Look at TLT on the chart. TLT is a 20-year government bond
ETF. When the Fed raised rates aggressively in 2022, TLT fell 40%. That was the most
hostile rate environment in 40 years. Every asset class repriced around that single
policy decision.</p>`
      },
      {
        heading: 'The Rate Cycle and What It Does to Each Asset Class',
        body: `
<p><b>When rates are rising (Fed tightening):</b></p>
<ul>
  <li><b>Bonds (TLT):</b> fall. Existing bonds pay less than new bonds, so they are
      worth less.</li>
  <li><b>Growth stocks (QQQ, TSLA):</b> fall harder than value stocks. Their future
      earnings are discounted at a higher rate, reducing present value.</li>
  <li><b>Gold:</b> often falls. Higher real rates increase the opportunity cost of holding
      a non-yielding asset.</li>
  <li><b>USD:</b> strengthens. Higher rates attract global capital into dollar assets.</li>
  <li><b>EM currencies (ZAR):</b> weaken as dollar strengthens and capital leaves EM.</li>
</ul>
<p><b>When rates are falling (Fed easing):</b></p>
<ul>
  <li><b>Bonds (TLT):</b> rise. Existing higher-yielding bonds become more valuable.</li>
  <li><b>Growth stocks:</b> often rise sharply — the biggest beneficiaries of lower
      discount rates.</li>
  <li><b>Gold:</b> often rises. Lower real rates reduce the opportunity cost of holding it.</li>
  <li><b>EM assets:</b> rally as dollar weakens and capital flows back toward risk.</li>
</ul>`
      },
      {
        heading: 'Dr. Copper, Oil, and the Commodity Cycle',
        body: `
<p><b>Copper</b> (COPPER in this lab) is the most reliable leading indicator of economic
activity. Its nickname "Dr. Copper" reflects its predictive power: copper goes into every
building built, every car made, every power grid installed. When copper prices rise,
construction and manufacturing are expanding — global growth is accelerating. When copper
falls for months, a slowdown is likely coming, often before equity markets price it in.</p>
<p><b>Oil</b> (OIL) tells a different story: geopolitics and supply shocks. Unlike copper,
which is demand-driven, oil is often supply-driven. OPEC production cuts, Middle East
tensions, pipeline disruptions — these move oil independently of economic conditions.
High oil prices act as a tax on every business and consumer, eventually slowing growth.
Low oil prices are stimulative for consumers but devastating for energy-dependent economies.</p>
<p>For South African investors: both commodity prices directly affect the JSE. Higher oil
hurts SOL if it can't pass on costs; higher copper benefits mining companies. The ZAR
itself is a commodity currency — it strengthens when commodity prices rise globally.</p>`
      },
      {
        heading: 'Reading the Market as a System',
        body: `
<p>The advanced skill is learning to read all the instruments in this lab <em>together</em>
as a single integrated system, rather than as isolated price charts. Here is a template:</p>
<p><b>Risk-ON signal (growth likely accelerating):</b> COPPER rising, OIL rising, SPY and
QQQ making new highs, USDJPY rising (yen weakening as carry trade expands), USDZAR falling
(ZAR strengthening as EM risk appetite improves), GOLD flat or falling, TLT falling.</p>
<p><b>Risk-OFF signal (growth likely slowing or fear spiking):</b> COPPER falling, SPY and
QQQ selling off, USDJPY falling (yen surging as carry trade unwinds), GOLD rising, TLT
rising, USDZAR rising sharply (ZAR weakening as EM capital flees).</p>
<p>You do not need all signals to agree. But when five or six of them point the same
direction simultaneously, you have a macro tailwind — or headwind — that will matter
for every position you hold.</p>
<p class="curriculum-callout">Final exercise: open this lab and check SPY, COPPER, GOLD,
TLT, and USDZAR simultaneously. Write a one-paragraph macro summary: what direction is the
system leaning right now? This is the professional's morning ritual — done before any
individual stock analysis even begins.</p>`
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
  // ---- LESSON 11 ----
  {
    id: 'support-resistance',
    number: 11,
    title: 'Support & Resistance',
    tagline: 'Where price remembers itself',
    duration: '~10 min',
    sections: [
      {
        heading: 'Why Price Bounces at the Same Levels',
        body: `
<p>Support and resistance are the most powerful concepts in all of technical analysis — and the simplest. They exist because <b>price has memory</b>.</p>
<p>When price reaches a level where it previously reversed, large institutional players — banks, hedge funds, pension funds — have unfilled orders sitting at that level. The fund that bought 2 million shares of TDY at $560 three months ago is watching. If price returns to $560, they buy more. That collective memory creates a <b>support</b> zone.</p>
<p>Resistance works in reverse. Traders who are trapped in a losing position ("I'll sell the moment it gets back to where I bought it") create a ceiling of sell orders. Every time price approaches that level, the trapped buyers sell, and price stalls.</p>
<p>The most important insight: <b>broken support becomes resistance, and broken resistance becomes support</b>. A level that held the price up for months now acts as a ceiling — because the buyers who protected it have already sold, and sellers who missed the breakdown now wait to sell the retest.</p>
<p class="curriculum-callout">Support and resistance are not lines. They are zones — areas of concentrated institutional memory. The wider and more tested the zone, the more significant the eventual break.</p>`
      },
      {
        heading: 'How to Draw Levels Properly',
        body: `
<p>Amateur traders draw dozens of lines on a chart. Professional traders draw three to five. The discipline is in choosing which levels matter:</p>
<p><b>1. Use closing prices, not wicks.</b> Intraday wicks can be driven by stop-hunting or illiquidity. The close is where the market agreed to end the day — it is the most honest price.</p>
<p><b>2. Look for multiple touches.</b> A level that has been tested and held twice is significant. Three times is very significant. Once is just noise.</p>
<p><b>3. Round numbers attract orders.</b> $100, $50, $500 — human psychology creates self-fulfilling orders at round numbers. This is not mystical. It is just how traders place their limit orders.</p>
<p><b>4. Look left on the chart.</b> The further left a level extends, the more institutional memory it carries. A level from two years ago that price revisited three times is more powerful than a level from last week.</p>
<p>In the lab, click the <b>S/R</b> toggle to enable the drawing tool, then click on the price chart at any price level you identify. A horizontal line is drawn. Add two or three major levels to the current instrument and observe how price behaves near them.</p>`
      },
      {
        heading: 'Lab Exercise',
        body: `
<ol>
  <li>Select <b>SPY</b> and set the timeframe to <b>1Y</b>.</li>
  <li>Enable the <b>S/R</b> toggle. Look for two or three levels where price clearly reversed — draw a line at each.</li>
  <li>Switch to <b>2Y</b> to see if those same levels held further back in time. If they did, the level is significant.</li>
  <li>Now switch to <b>TSLA</b> and do the same. Notice that TSLA's levels are far wider and less reliable than SPY's — high volatility instruments have looser, fuzzier support zones.</li>
  <li>Finally, switch to <b>BRK</b> and compare. Notice how much more precisely price respects levels on a low-volatility instrument like Berkshire.</li>
  <li>Write in your Decision Journal: <em>"What three levels on [your chosen instrument] do I believe are most significant right now, and why?"</em></li>
</ol>
<p class="curriculum-callout">The exercise is not the lines. The exercise is the discipline of justifying each line in writing before you draw it. That forces you to think like an institutional trader, not a retail chartist.</p>`
      }
    ]
  },

  // ---- LESSON 12 ----
  {
    id: 'bollinger-bands',
    number: 12,
    title: 'Bollinger Bands & Volatility',
    tagline: 'How the market breathes',
    duration: '~9 min',
    sections: [
      {
        heading: 'What Bollinger Bands Actually Measure',
        body: `
<p>Bollinger Bands are three lines drawn on a price chart: a 20-day moving average in the middle, and two bands above and below it set at ±2 standard deviations. <b>The bands measure volatility — how fast price is moving, not which direction.</b></p>
<p>When the bands are wide, the market is in a high-volatility period: large, fast price moves are normal. When the bands are narrow, volatility has compressed: the market is resting, coiling, building energy for the next move.</p>
<p>This breathing pattern — expansion, contraction, expansion — repeats across all markets, all timeframes. The <b>Bollinger Squeeze</b> is when the bands narrow to their tightest point in months. Historically, a squeeze is followed by an explosive directional move. The bands themselves do not tell you which direction. You need other context for that (trend, fundamentals, RSI).</p>
<p class="curriculum-callout"><b>The most important rule:</b> Do not trade volatility contraction by chasing breakouts before they occur. Wait for the breakout, confirm with volume, then enter. The squeeze sets the stage — but the actual break is the signal.</p>`
      },
      {
        heading: 'Mean Reversion vs Trend Following',
        body: `
<p>Bollinger Bands teach two opposite strategies that are both valid — in different conditions:</p>
<p><b>Mean Reversion:</b> When price touches the upper band in a ranging (trendless) market, sell. When it touches the lower band, buy. The logic: price tends to return to its moving average, and the bands define "too far from average."</p>
<p>This works beautifully in calm, range-bound markets. It fails catastrophically in strong trends — in a bull trend, price can "walk the upper band" for weeks, with every touch of the upper band being a buying opportunity, not a sell signal.</p>
<p><b>Trend Following:</b> In a strong trend, the band the price is touching defines the trend direction. Consistent touches of the upper band = uptrend still intact. Consistent touches of the lower band = downtrend intact.</p>
<p>The critical skill is knowing which regime you are in. This is where the MA200 context from Lesson 2 becomes essential: if price is above the MA200, favour mean-reversion buys at the lower band and trend-following entries at upper band closes. Below the MA200, reverse the bias.</p>`
      },
      {
        heading: 'Lab Exercise',
        body: `
<ol>
  <li>Enable the <b>BB</b> (Bollinger Bands) toggle. Use <b>TSLA</b> with a 1Y timeframe — TSLA's high volatility makes the bands highly visible.</li>
  <li>Find 3 moments where price touched the lower band. For each: was price above or below MA200? Did price recover? How quickly?</li>
  <li>Now look at <b>BTC</b>. Notice the bands are far wider on Bitcoin than on any equity — the bands scale to each instrument's volatility. A "2 standard deviation" move on BTC is larger in absolute percentage terms than almost anything in equities.</li>
  <li>Find one example of a Bollinger Squeeze — a period where the bands narrowed significantly. What happened afterward?</li>
  <li>Compare <b>TLT</b> Bollinger Bands in 2021–2022 (the rate hike period). This is one of the most dramatic Bollinger Band expansions in bond market history.</li>
</ol>
<p class="curriculum-callout">Enable both BB and Events overlay simultaneously. You will see that the largest band expansions often coincide with major macro events — Fed decisions, crisis announcements. The market breathes — and sometimes, the news forces a gasp.</p>`
      }
    ]
  },

  // ---- LESSON 13 ----
  {
    id: 'rate-cycle',
    number: 13,
    title: 'The Interest Rate Cycle',
    tagline: 'The tide that lifts and sinks all boats',
    duration: '~12 min',
    sections: [
      {
        heading: 'The Four Phases',
        body: `
<p>Every major asset price move of the last 50 years can be traced, at root, to where we are in the interest rate cycle. Understanding this cycle is not optional for any serious investor.</p>
<p>The cycle has four phases driven by the central bank (the Fed in the US, the SARB in South Africa):</p>
<p><b>Phase 1 — Easing:</b> The economy is slow or in recession. The central bank cuts rates to stimulate borrowing and spending. Effect: money becomes cheap, flows into equities, real estate, and risk assets. Growth stocks (QQQ) outperform. This is the best time to own equities.</p>
<p><b>Phase 2 — Low and Stable:</b> Rates are low, economy is growing. Equities perform well, credit is cheap, risk appetite is high. This phase can last years (2009–2015, 2020–2021). Speculative assets (crypto, unprofitable tech) soar.</p>
<p><b>Phase 3 — Hiking:</b> Inflation forces the central bank to raise rates. The cost of capital rises. High-duration assets (long bonds, growth stocks) fall hardest because their future earnings are discounted at a higher rate. This is 2022: QQQ -32%, TLT -40%, BTC -65%.</p>
<p><b>Phase 4 — High and Stable / Peak:</b> Rates are elevated, inflation is falling, economy is slowing. The market prices in rate cuts. Value stocks and defensive sectors (healthcare, utilities) outperform growth. The yield curve often inverts here — short rates above long rates — which has predicted every recession since 1970.</p>
<p class="curriculum-callout">You do not need to predict where the rate cycle goes next. You need to know where you currently are — and whether the market is ahead of or behind the central bank's next move.</p>`
      },
      {
        heading: 'Asset Class Playbook',
        body: `
<p>Each asset class has a characteristic response to the rate cycle. Here is the playbook:</p>
<p><b>Bonds (TLT):</b> The most direct rate-cycle instrument. When rates fall, bond prices rise. When rates rise, bond prices fall — the 2022 TLT -40% was not a crisis; it was basic bond math applied to a generational hiking cycle. TLT is always the first instrument to price in expected rate changes, months before equities react.</p>
<p><b>Growth Stocks (QQQ / TSLA / META):</b> Long-duration assets. Their value is based on earnings far in the future, discounted at the current interest rate. A higher discount rate makes those future earnings worth less today. This is why QQQ falls hard when rates rise — it is not a mystery, it is math.</p>
<p><b>Value Stocks (BRK / DIA):</b> Shorter duration, more current earnings. Less sensitive to rate rises. BRK outperformed QQQ dramatically in 2022 — a pure rate-cycle rotation from growth to value.</p>
<p><b>Gold:</b> Rises when real interest rates (nominal rate minus inflation) fall. In 2022, nominal rates rose fast but real rates were still negative for part of the year — gold held better than expected for this reason.</p>
<p><b>Emerging Markets (EEM) and ZAR:</b> Hit twice when US rates rise: global risk appetite falls (outflows from EM) AND the US dollar strengthens (making dollar-denominated EM debt more expensive to service). South Africa feels this through the ZAR and through JSE outflows.</p>`
      },
      {
        heading: 'Lab Exercise',
        body: `
<ol>
  <li>Enable the <b>Events</b> overlay. Navigate through <b>TLT</b> on the 2Y timeframe. Find the moment the Fed signalled rate hikes in late 2021. See how TLT began falling before the first actual hike — it priced in the cycle change.</li>
  <li>Compare <b>QQQ</b> and <b>TLT</b> on the same 2Y timeframe. Notice they fell simultaneously in 2022 — the rate-hike cycle crushed both long bonds AND growth stocks. In normal times, they are inversely correlated. In 2022, the correlation broke.</li>
  <li>Check the <b>Correlation Matrix</b> in the Learn tab. Find QQQ and TLT. Their correlation in synthetic data reflects a normal regime. In the 2022 hiking cycle, that correlation would have been near zero or even positive — both down.</li>
  <li>Switch to <b>USDZAR</b>. Find September 2022 (UK pension crisis) and March 2023 (SVB failure). Both times, risk-off sentiment spiked the ZAR weaker against the dollar instantly. This is the EM vulnerability to the global rate cycle.</li>
  <li>Journal entry: <em>"Where do I think the rate cycle is right now? Which assets should outperform in this phase, and which should underperform?"</em></li>
</ol>`
      }
    ]
  },

  // ---- LESSON 14 ----
  {
    id: 'vix-fear',
    number: 14,
    title: 'Fear, Greed & the VIX',
    tagline: 'When to buy what everyone else is selling',
    duration: '~10 min',
    sections: [
      {
        heading: 'What the VIX Is',
        body: `
<p>The VIX — the CBOE Volatility Index — measures the market's expectation of volatility in the S&P 500 over the next 30 days. It is derived from the prices of S&P 500 options. When traders are paying a lot for protective put options (insurance against a crash), the VIX is high. When they are complacent, it is low.</p>
<p><b>VIX below 15:</b> Complacency. Markets are calm, volatility is priced as cheap. This is often the environment just before a significant sell-off. When insurance is cheap, nobody buys it — until suddenly everyone does.</p>
<p><b>VIX 15–25:</b> Normal. Moderate uncertainty. This is the range markets spend most of their time in.</p>
<p><b>VIX 25–40:</b> Elevated fear. Significant market stress. Sharp moves, increased correlation between assets. Painful for levered traders.</p>
<p><b>VIX above 40:</b> Panic. Extreme fear. Historical extremes: VIX hit 80 in October 2008 (Lehman), 66 in March 2020 (COVID). These extreme readings have — without exception — marked the vicinity of major market bottoms. Not the exact bottom, but close enough that buying in stages near VIX 40+ has been consistently profitable over the following 12 months.</p>
<p class="curriculum-callout">Warren Buffett's famous rule — "Be fearful when others are greedy, and greedy when others are fearful" — is operationalised by the VIX. Extreme VIX spikes are the quantitative signal that others are maximally fearful. That is when assets are on sale.</p>`
      },
      {
        heading: 'Mean Reversion of Fear',
        body: `
<p>The VIX is one of the most reliable mean-reverting indicators in all of finance. It cannot stay at 60 for long because: (1) the volatility that justifies it subsides, (2) options expire and must be re-priced, (3) buyers of vol at those levels earn enormous returns, which creates natural selling of volatility.</p>
<p>This mean reversion has been exploited profitably by institutional traders for decades: sell vol (short VIX instruments) when VIX is extremely elevated, buy it when VIX is at historic lows and complacency is extreme.</p>
<p>For a student, the actionable insight is simpler: <b>do not sell equities into a VIX spike above 40. If anything, prepare to buy in stages.</b> The famous "be greedy when others are fearful" requires the practical discipline to act when your own fear is also elevated — which is why most people cannot do it.</p>
<p>The August 2024 yen carry trade unwind is the best recent example: VIX spiked to 65 on August 5th, 2024 — the highest since COVID. Markets recovered within two weeks. Anyone who sold on August 5th locked in losses. Anyone who bought staged-in and recovered fully.</p>`
      },
      {
        heading: 'Lab Exercise',
        body: `
<ol>
  <li>Turn on the <b>Events</b> overlay on <b>SPY</b> with 2Y timeframe. Look for the events flagged as crashes (red flags). For each: what was the price recovery like in the 6 months following?</li>
  <li>Go to <b>Famous Crashes → COVID-19</b> case study (requires Yahoo proxy). Step through the crash day by day. Notice the pace at which the decline accelerated — and then the V-shaped recovery speed. The fastest crashes have historically produced the fastest recoveries.</li>
  <li>Look at <b>BTC</b> on 2Y. Bitcoin has its own "VIX" — implied volatility from options markets — but its price action itself shows the panic. Find the June 2022 low. Identify what percentage below the prior high that represented. Was that a VIX-equivalent extreme?</li>
  <li>Journal: <em>"What would I have to feel to buy aggressively during a 30% market crash? What practical rules would I need to have pre-committed to in writing before the crash to execute that plan when I am actually afraid?"</em></li>
</ol>
<p class="curriculum-callout">The lesson is not about timing crashes. It is about pre-committing to a plan before fear arrives — because when fear actually arrives, you will not be able to think clearly enough to make a plan. Write the plan when you are calm. Execute it when you are afraid.</p>`
      }
    ]
  },

  // ---- LESSON 15 ----
  {
    id: 'trading-system',
    number: 15,
    title: 'Building Your Own System',
    tagline: 'From observation to rule, from rule to edge',
    duration: '~15 min',
    sections: [
      {
        heading: 'Why You Need a System',
        body: `
<p>After completing Lessons 1–14, you have a substantial toolkit: candlestick reading, moving averages, RSI, volume, support/resistance, Bollinger Bands, rate cycle awareness, volatility reading, position sizing, stop-loss discipline, and journalling. That is more than most retail traders ever learn.</p>
<p>But tools are not a system. A carpenter has a hammer and a saw — that does not mean they have a plan for the house they are building.</p>
<p>A trading system has four mandatory components:</p>
<p><b>1. An Entry Rule:</b> A specific, observable condition that triggers a buy or sell. Not "it looks like it's going up." Something like: "MA50 crosses above MA200, RSI is below 65, and price is within 3% of MA200."</p>
<p><b>2. An Exit Rule:</b> Both a stop-loss (if wrong) AND a take-profit (if right). The stop protects capital. The target protects gains. Without both, the trade has no defined boundaries.</p>
<p><b>3. A Position Sizing Rule:</b> How much to risk per trade — ideally linked to the 2% rule from Lesson 7. Your system's edge means nothing if one bad trade can destroy your account.</p>
<p><b>4. A Journalling Rule:</b> Before every trade, write down the exact reason. After every 20 trades, review the journal and compute your win rate, profit factor, and average R:R. Adjust the system based on data, not emotions.</p>
<p class="curriculum-callout">The Autopilot in this lab IS a trading system. It has all four components: a specific entry rule (Golden Cross + RSI), a specific exit rule (Death Cross), a sizing rule (25% of capital), and a detailed log of every decision. Study it — not to copy it, but to understand what a complete system looks like from the inside.</p>`
      },
      {
        heading: 'Testing Your System',
        body: `
<p>Before trading real money — before even trading paper money seriously — a system must be tested on historical data. This is called <b>backtesting</b>. It answers the question: "If I had applied this rule consistently over the last 2 years, what would have happened?"</p>
<p>The Historical Edge table in this lab is a simple backtest: it computes, for the current market setup (MA trend, RSI bucket, volume regime), what the average 30-day forward return has been across all matching setups in history.</p>
<p>A proper backtest requires more rigour:</p>
<p><b>Survivorship bias:</b> Only test on instruments that existed for the full period. Instruments that went bankrupt have been removed from most index databases — this makes backtests look better than they were in live trading.</p>
<p><b>Overfitting:</b> The most common backtest trap. If you keep tweaking the rules to match the historical data, you will find parameters that worked perfectly in the past but will fail in the future. A rule that only works on very specific parameter values (e.g. MA47 vs MA198) is likely overfitted. A rule that works across a wide range of parameters (MA20–MA60 vs MA180–MA250) has genuine robustness.</p>
<p><b>Transaction costs:</b> In the real world, every trade costs something. A system that generates 50 trades per year with a theoretical edge of 0.2% per trade may actually lose money after spreads, commissions, and slippage.</p>`
      },
      {
        heading: 'Your 30-Day System Challenge',
        body: `
<p>Here is the final exercise — not a lab click-through but a 30-day commitment:</p>
<ol>
  <li><b>Week 1:</b> Write down your entry rule, exit rule, position size rule, and journal rule in your Decision Journal. Be specific enough that a stranger could apply the rules without asking you any questions.</li>
  <li><b>Week 2:</b> Apply the rules on paper in this lab for 5 trading sessions. Every trade must have a written reason that references the specific rules. No exceptions.</li>
  <li><b>Week 3:</b> Review your journal. Did you follow the rules? Where did you break them? What did breaking them cost you? What did following them earn you?</li>
  <li><b>Week 4:</b> Refine one rule — only one — based on the journal evidence. Write down specifically what you changed and why. Apply the refined rules for another 5 sessions.</li>
  <li><b>After 30 days:</b> Download your journal CSV. Compute your win rate, profit factor, and average R:R manually. Compare to the Autopilot's numbers over the same period. What does that comparison tell you?</li>
</ol>
<p class="curriculum-callout">A system that loses 55% of the time but has an average R:R of 3:1 makes money. A system that wins 65% of the time but has an average R:R of 0.5:1 loses money. <b>The win rate is vanity. The profit factor is sanity.</b> Build for profit factor, not for feeling right.</p>`
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
