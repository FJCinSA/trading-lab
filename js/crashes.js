// ============================================================
// FJC Trading Lab — Famous Crashes Case Study Library (Pillar 6)
// ============================================================
// Defines the famous market crash scenarios and the UI for
// activating them. Each scenario pre-loads a ticker's full
// historical data (range=max via Yahoo) and positions Replay
// Mode at the crash onset, so the learner can step through
// history day-by-day with no knowledge of what comes next.
//
// This module is a leaf — it has no imports from other lab modules.
// All orchestration (data fetch, replay entry) is handled by
// main.js via the onActivate callback passed to renderCrashes().
// ============================================================

// ------------------------------------------------------------------
// Scenario definitions
// ------------------------------------------------------------------
// Fields:
//   id         — unique identifier (kebab-case)
//   name       — display name
//   ticker     — must match a sym in config.js TICKERS
//   subtitle   — date range + magnitude shown on the card
//   startDate  — ISO date string — replay is positioned here
//   context    — array of paragraphs shown in the context panel
// ------------------------------------------------------------------

export const CRASH_SCENARIOS = [
  {
    id: 'gfc-2008',
    name: 'GFC 2008',
    ticker: 'SPY',
    subtitle: 'Oct 2007 – Mar 2009  ·  −57%',
    magnitude: '-57%',
    duration: '17 months',
    startDate: '2007-10-01',
    fetchStart: '2005-01-01',   // 3 years of warmup for MA200
    fetchEnd:   '2011-12-31',   // covers crash + early recovery
    context: [
      "It's October 2007. US house prices have been falling for a year but the stock market just hit an all-time high. Everyone knows there are problems in the subprime mortgage market — but the consensus is that the financial system can absorb it.",
      "Lehman Brothers is still standing. Bear Stearns is still standing. The Federal Reserve has just cut rates. Most analysts are calling for a \"soft landing.\" The S&P 500 closes at 1,576.",
      "Your mission: You have R100,000 in paper money. Step through 2007–2009 day-by-day, making decisions based only on what was known at the time. Use the AI coach to explain what each pattern means. Use the journal to record your reasoning.",
      "Key question: On what day do you decide to sell? Watch for the death cross — it arrives in December 2007. Will you trust it?"
    ]
  },
  {
    id: 'dotcom-2000',
    name: 'Dot-com Crash',
    ticker: 'QQQ',
    subtitle: 'Mar 2000 – Oct 2002  ·  −83%',
    magnitude: '-83%',
    duration: '31 months',
    startDate: '2000-01-03',
    fetchStart: null,           // QQQ started Mar 1999 — fetch from inception
    fetchEnd:   '2004-12-31',   // covers full crash (Oct 2002 trough) + recovery
    context: [
      "It's January 2000. The internet has changed everything. Companies with no revenue and no profits are worth billions. Every cab driver has stock tips. The Nasdaq has tripled in two years.",
      "Amazon, Webvan, pets.com — they're all going to be trillion-dollar companies. The \"new economy\" has abolished old valuation rules. The QQQ Nasdaq 100 ETF has just made its all-time high at $118.",
      "Your mission: Step through the 2000–2002 dot-com crash day-by-day. No hindsight. What does a death cross look like when you don't know how far it will fall? When do the 'buy the dip' moments stop working?",
      "Key question: How many times do you buy the dip before you stop? Note that QQQ took 15 years to return to its 2000 high."
    ]
  },
  {
    id: 'covid-2020',
    name: 'COVID-19 Crash',
    ticker: 'SPY',
    subtitle: 'Feb – Mar 2020  ·  −34% in 33 days',
    magnitude: '-34%',
    duration: '33 days',
    startDate: '2020-01-15',
    fetchStart: '2017-01-01',   // 3 years of warmup
    fetchEnd:   '2022-12-31',   // covers crash + full V-shaped recovery
    context: [
      "It's January 15, 2020. The WHO has confirmed human-to-human transmission of a new virus in Wuhan, China. The markets have barely noticed — the S&P 500 is near all-time highs. Chinese New Year is in a week.",
      "\"It's just like SARS\" says every commentator. Most analysts expect China to contain it within weeks. Markets are up. Tech earnings are strong. Everything is fine.",
      "This is the fastest major market crash in history — −34% in 33 calendar days. The circuit breakers triggered four times in a single month. The VIX reached 85, higher than in 2008.",
      "Key question: Do you buy on March 23 — the exact bottom — or do you wait for confirmation that never comes in time?"
    ]
  },
  {
    id: 'meta-2022',
    name: 'META 2022 Crash',
    ticker: 'META',
    subtitle: 'Sep 2021 – Nov 2022  ·  −77%',
    magnitude: '-77%',
    duration: '14 months',
    startDate: '2021-07-01',
    fetchStart: '2018-01-01',   // META listed 2012; 3 years warmup
    fetchEnd:   '2024-12-31',   // covers crash (Nov 2022 trough) + recovery
    context: [
      "It's July 2021. Meta Platforms (formerly Facebook) has just reported record revenues — $29 billion in a quarter. Mark Zuckerberg has declared he's building the metaverse. The stock has tripled in four years.",
      "One year and four months later, it will be down 77% — destroying $700 billion in market cap. It's one of the largest single-stock destructions of value in US market history.",
      "Your mission: Follow Meta from peak to trough. This is not a macro crash — it's a single company's self-inflicted implosion in a rising interest rate environment. Watch the RSI signals. Watch the death cross. Watch the volume on down days vs up days.",
      "Key question: Could technical analysis have warned you before the earnings disappointments became public knowledge?"
    ]
  },
  {
    id: 'yen-carry-2024',
    name: 'Yen Carry Unwind',
    ticker: 'SPY',
    subtitle: 'Aug 2024  ·  −10% in 3 days',
    magnitude: '-10%',
    duration: '~2 weeks',
    startDate: '2024-07-15',
    fetchStart: '2022-01-01',   // 2.5 years warmup
    fetchEnd:   null,           // fetch up to today (recent event)
    context: [
      "It's July 15, 2024. The Bank of Japan has just raised interest rates for only the second time in 17 years — a tiny 0.25% move. To most observers, it's a non-event. No one talks about it.",
      "But for years, traders worldwide have been borrowing cheaply in yen and investing in higher-yield US assets — the 'yen carry trade.' When Japan raised rates, the cost of that trade changed overnight. Suddenly everyone needed to close the same position at once.",
      "What followed was a 3-day global meltdown. The Nikkei fell 12% in a single day — its worst session since 1987. The VIX spiked to 65. Circuit breakers fired. Forced liquidations everywhere. Everything sold together.",
      "Key question: Is this panic or prophecy? The market recovered in two weeks. How many people sold at the bottom?"
    ]
  },
  {
    id: 'usdzar-2015',
    name: 'USDZAR Dec 2015',
    ticker: 'SOL',
    subtitle: 'Dec 2015  ·  ZAR −25%  ·  SOL −40%',
    magnitude: '-40%',
    duration: '~8 weeks',
    startDate: '2015-11-01',
    fetchStart: '2012-01-01',   // 4 years warmup for SOL.JO
    fetchEnd:   '2018-12-31',   // covers event + 3 years aftermath
    context: [
      "It's the evening of Wednesday December 9, 2015 in South Africa. President Jacob Zuma has just fired Finance Minister Nhlanhla Nene — a respected figure who had been holding the budget line — and replaced him with a political unknown.",
      "The rand goes into freefall. The dollar buys R17, then R18, touching R17.90 in days. This is one of the most dramatic single-night currency collapses in South Africa's democratic history. The JSE opens in chaos the next morning.",
      "Sasol (SOL.JO), priced in rand but with dollar-linked oil revenues, becomes the proxy instrument for watching this ZAR crisis play out on a daily chart. On some days it gains while rand costs fall; on others, market panic crushes everything.",
      "Key question: How many trading sessions before the chart gives you a clear signal? Watch the volume spike on December 10 and the pattern that follows over the next two weeks."
    ]
  }
];

// ------------------------------------------------------------------
// Render the Famous Crashes card
// ------------------------------------------------------------------

/**
 * Render the list of crash scenario cards inside #crashes-list.
 * Called once during init() and rebuilt whenever needed.
 *
 * @param {function(object):void} onActivate  called with the scenario object when user clicks
 */
export function renderCrashes(onActivate) {
  const container = document.getElementById('crashes-list');
  if (!container) return;

  container.innerHTML = '';

  for (const s of CRASH_SCENARIOS) {
    const card = document.createElement('div');
    card.className = 'crash-card';
    card.innerHTML =
      '<div class="crash-card-header">' +
        '<span class="crash-name">' + _esc(s.name) + '</span>' +
        '<span class="crash-ticker-badge">' + _esc(s.ticker) + '</span>' +
      '</div>' +
      '<div class="crash-subtitle">' + _esc(s.subtitle) + '</div>';
    card.onclick = () => onActivate(s);
    container.appendChild(card);
  }
}

// ------------------------------------------------------------------
// Context panel — shown above the chart when a scenario is active
// ------------------------------------------------------------------

/**
 * Show the crash context panel with the scenario's setting-the-scene narrative.
 * Hides automatically when #crash-context-close is clicked.
 *
 * @param {object} scenario  one entry from CRASH_SCENARIOS
 */
export function showCrashContext(scenario) {
  const panel = document.getElementById('crash-context-panel');
  const title = document.getElementById('crash-context-title');
  const body  = document.getElementById('crash-context-body');
  if (!panel || !title || !body) return;

  title.textContent = scenario.name + ' — ' + scenario.subtitle;
  body.innerHTML = scenario.context
    .map(p => '<p style="margin:0 0 10px 0">' + _esc(p) + '</p>')
    .join('');

  panel.style.display = '';

  const closeBtn = document.getElementById('crash-context-close');
  if (closeBtn) closeBtn.onclick = hideCrashContext;
}

/**
 * Hide the crash context panel.
 */
export function hideCrashContext() {
  const panel = document.getElementById('crash-context-panel');
  if (panel) panel.style.display = 'none';
}

// ------------------------------------------------------------------
// XSS prevention helper
// ------------------------------------------------------------------

function _esc(s) {
  return String(s)
    .replace(/&/g,  '&amp;')
    .replace(/</g,  '&lt;')
    .replace(/>/g,  '&gt;')
    .replace(/"/g,  '&quot;');
}
