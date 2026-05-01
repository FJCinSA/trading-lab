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

  // ── Group 1: The classics ────────────────────────────────────────
  {
    id: 'gfc-2008',
    name: 'GFC 2008',
    ticker: 'SPY',
    subtitle: 'Oct 2007 – Mar 2009  ·  −57%',
    magnitude: '-57%',
    duration: '17 months',
    startDate: '2007-10-01',
    endDate:   '2009-03-31',    // trough: S&P 500 bottom
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
    endDate:   '2002-10-31',    // trough: Nasdaq 100 bottom
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
    endDate:   '2020-04-15',    // ~3 weeks past March 23 bottom
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
    endDate:   '2022-11-30',    // trough: META bottomed ~Nov 2022
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
    endDate:   '2024-09-15',    // ~6 weeks covering the panic + full recovery
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
    endDate:   '2016-06-30',    // covers the Nene-firing shock + partial recovery
    fetchStart: '2012-01-01',   // 4 years warmup for SOL.JO
    fetchEnd:   '2018-12-31',   // covers event + 3 years aftermath
    context: [
      "It's the evening of Wednesday December 9, 2015 in South Africa. President Jacob Zuma has just fired Finance Minister Nhlanhla Nene — a respected figure who had been holding the budget line — and replaced him with a political unknown.",
      "The rand goes into freefall. The dollar buys R17, then R18, touching R17.90 in days. This is one of the most dramatic single-night currency collapses in South Africa's democratic history. The JSE opens in chaos the next morning.",
      "Sasol (SOL.JO), priced in rand but with dollar-linked oil revenues, becomes the proxy instrument for watching this ZAR crisis play out on a daily chart. On some days it gains while rand costs fall; on others, market panic crushes everything.",
      "Warning signs: The rand had already been weakening for months. Commodity prices (oil) had been falling since mid-2014. Eskom load-shedding was intensifying. None of these individually screamed 'sell' — but together, in hindsight, the pressure was building.",
      "Key question: How many trading sessions before the chart gives you a clear signal? Watch the volume spike on December 10 and the pattern that follows over the next two weeks."
    ]
  },

  // ── Group 2: Flash events ─────────────────────────────────────────
  {
    id: 'flash-crash-2010',
    name: 'Flash Crash 2010',
    ticker: 'SPY',
    subtitle: 'May 6, 2010  ·  −9% in minutes',
    magnitude: '-9%',
    duration: '~3 weeks to recover',
    startDate: '2010-04-01',
    endDate:   '2010-05-25',
    fetchStart: '2008-01-01',
    fetchEnd:   '2012-12-31',
    context: [
      "It's May 6, 2010, 2:32 pm Eastern Time. On a normal Thursday afternoon, a mutual fund firm executes a single algorithmic sell order for $4.1 billion worth of futures contracts — not a rogue trader, not a crisis, just a routine hedge, executed too fast.",
      "In 36 minutes, the Dow Jones falls 998 points — 9% — and rebounds almost completely. Individual stocks briefly trade at one cent. Accenture falls from $40 to $0.01. Sotheby's trades at $99,999. The market has a seizure.",
      "No fundamental news drives it. No company fails. No bank is in trouble. The entire event is a feedback loop between automated trading systems amplifying each other's panic — a glimpse into what markets had become.",
      "Warning signs: Greek debt crisis was already in headlines. Markets had been skittish. But the flash crash itself had no warning — it happened in the time it takes to eat lunch.",
      "Key question: What do you do when the chart shows a 9% crash and then fully recovers in the same afternoon? Is that a buy signal, a warning, or noise? And — more importantly — what do the days after tell you?"
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
    endDate:   '2024-09-15',
    fetchStart: '2022-01-01',
    fetchEnd:   null,
    context: [
      "It's July 15, 2024. The Bank of Japan has just raised interest rates for only the second time in 17 years — a tiny 0.25% move. To most observers, it's a non-event. No one talks about it.",
      "But for years, traders worldwide had been borrowing cheaply in yen and investing in higher-yield US assets — the 'yen carry trade.' When Japan raised rates, the cost of that trade changed overnight. Suddenly everyone needed to close the same position at once.",
      "What followed was a 3-day global meltdown. The Nikkei fell 12% in a single day — its worst session since 1987. The VIX spiked to 65. Circuit breakers fired. Forced liquidations everywhere. Everything sold together.",
      "Warning signs: The yen had been weakening for two years. US tech valuations were stretched. The Berkshire cash pile had quietly been growing to record levels. In hindsight, the setup was fragile — but no one rang a bell.",
      "Key question: Is this panic or prophecy? The market recovered in two weeks. How many people sold at the bottom?"
    ]
  },

  // ── Group 3: Slow burns ────────────────────────────────────────────
  {
    id: 'dotcom-2000',
    name: 'Dot-com Crash',
    ticker: 'QQQ',
    subtitle: 'Mar 2000 – Oct 2002  ·  −83%',
    magnitude: '-83%',
    duration: '31 months',
    startDate: '2000-01-03',
    endDate:   '2002-10-31',
    fetchStart: null,
    fetchEnd:   '2004-12-31',
    context: [
      "It's January 2000. The internet has changed everything. Companies with no revenue and no profits are worth billions. Every cab driver has stock tips. The Nasdaq has tripled in two years.",
      "Amazon, Webvan, pets.com — they're all going to be trillion-dollar companies. The 'new economy' has abolished old valuation rules. The QQQ Nasdaq 100 ETF has just made its all-time high at $118.",
      "But look at the chart. RSI has been above 70 for months. The price is 120% above its 200-day moving average. Volume on down days is quietly starting to exceed volume on up days. The distribution is beginning — but no one is watching.",
      "Warning signs: P/E ratios of 200x. Companies with no revenue at billion-dollar valuations. The Fed had raised rates six times in 1999-2000. Margin debt had reached record levels. Each of these, alone, was explainable. Together, they were a bonfire.",
      "Your mission: Step through the 2000–2002 dot-com crash day-by-day. No hindsight. What does a death cross look like when you don't know how far it will fall? When do the 'buy the dip' moments stop working?",
      "Key question: How many times do you buy the dip before you stop? Note that QQQ took 15 years to return to its 2000 high."
    ]
  },
  {
    id: 'european-debt-2011',
    name: 'European Debt Crisis',
    ticker: 'SPY',
    subtitle: 'Jul – Oct 2011  ·  −19%',
    magnitude: '-19%',
    duration: '3 months',
    startDate: '2011-07-01',
    endDate:   '2011-10-04',
    fetchStart: '2009-01-01',
    fetchEnd:   '2014-12-31',
    context: [
      "It's July 2011. The GFC is 'over' — markets have recovered, banks have been bailed out, the Fed has printed trillions. But in Europe, a slow-motion sovereign debt crisis is unfolding. Greece has already been bailed out once. Now Italy and Spain are in the crosshairs.",
      "The S&P 500 is near its post-GFC highs. Then in late July, the US debt ceiling debate reaches a crisis point. Washington cannot agree on a budget. S&P threatens to downgrade US government debt — something that has literally never happened.",
      "On August 5, 2011, S&P strips the US of its AAA credit rating for the first time in history. Global markets open Monday in freefall. The S&P 500 falls 6.7% in a single day. The VIX spikes to 48.",
      "Warning signs: Weak economic data had been accumulating for months. European bank stocks had been quietly falling since early 2011 — they knew something. The yield spread between Italian and German bonds had been widening for weeks.",
      "Key question: A −19% decline that fully recovered within months — or a premonition of the next big crisis? This is where reading the macro context alongside the chart becomes essential."
    ]
  },
  {
    id: 'rate-hike-2022',
    name: 'Rate Hike Bear 2022',
    ticker: 'QQQ',
    subtitle: 'Jan – Oct 2022  ·  −35%',
    magnitude: '-35%',
    duration: '9 months',
    startDate: '2022-01-01',
    endDate:   '2022-10-13',
    fetchStart: '2019-01-01',
    fetchEnd:   '2024-06-30',
    context: [
      "It's January 2022. The Nasdaq 100 hit its all-time high on November 19, 2021. The Fed is still calling inflation 'transitory.' Interest rates are near zero. Speculative tech stocks, SPACs, crypto, and NFTs are all at peak mania.",
      "Then the Fed blinks. By March 2022, Jerome Powell admits inflation is not transitory and begins the most aggressive rate hiking cycle since Paul Volcker in the 1980s. Seven consecutive rate hikes. From 0% to 4.5% in nine months.",
      "When the risk-free rate rises, the present value of future tech earnings collapses mathematically. Unprofitable growth companies that were priced for perfection at zero rates are suddenly worth a fraction of that. The QQQ falls 35%. Individual stocks fall 70-90%.",
      "Warning signs: Inflation had been rising for a year. Supply chains were visibly broken. The Fed was behind the curve — a fact that bond markets had been signalling for months. Tech earnings multiples were at historically extreme levels.",
      "What worked: Value stocks, energy, healthcare — sectors with real earnings now rather than promised earnings later. What failed: everything that needed cheap money to justify its valuation.",
      "Key question: The death cross appears in February 2022. Could you have trusted it enough to hold cash for 9 months while tech companies you 'believed in' fell 70%?"
    ]
  },

  // ── Group 4: Single-stock implosions ──────────────────────────────
  {
    id: 'meta-2022',
    name: 'META 2022 Crash',
    ticker: 'META',
    subtitle: 'Sep 2021 – Nov 2022  ·  −77%',
    magnitude: '-77%',
    duration: '14 months',
    startDate: '2021-07-01',
    endDate:   '2022-11-30',
    fetchStart: '2018-01-01',
    fetchEnd:   '2024-12-31',
    context: [
      "It's July 2021. Meta Platforms (formerly Facebook) has just reported record revenues — $29 billion in a quarter. Mark Zuckerberg has declared he's building the metaverse. The stock has tripled in four years.",
      "One year and four months later, it will be down 77% — destroying $700 billion in market cap. It is one of the largest single-stock destructions of value in US market history. A company with real revenues, real profits, and 3 billion users — worth less than a third of its peak.",
      "What happened: Apple's App Tracking Transparency (ATT) in iOS 14 destroyed Meta's advertising data pipeline. Then Zuckerberg bet $36 billion on the metaverse. Both at once. Rising interest rates crushed the valuation multiple on top of that.",
      "Warning signs: The death cross fires in January 2022. RSI stays below 40 for months — a sign of sustained distribution, not normal volatility. Volume on down days repeatedly exceeds volume on up days. Every relief rally fails.",
      "What the charts showed: Each bear market rally lasted 3-6 weeks and failed at a lower high. The MA50 acted as resistance, not support. Anyone who 'bought the dip' three times had a 70% loss before the bottom.",
      "Key question: Could technical analysis have warned you before the earnings disappointments became public knowledge? Compare the chart pattern in Q3 2021 to what the fundamentals were saying at the same time."
    ]
  },
  {
    id: 'svb-2023',
    name: 'SVB Banking Crisis',
    ticker: 'SPY',
    subtitle: 'Mar 2023  ·  −7%  ·  3 banks fail',
    magnitude: '-7%',
    duration: '3 weeks',
    startDate: '2023-03-01',
    endDate:   '2023-04-01',
    fetchStart: '2021-01-01',
    fetchEnd:   null,
    context: [
      "It's March 8, 2023. Silicon Valley Bank — the 16th largest bank in the US, holding $209 billion in assets and the deposits of half of all US venture-backed startups — announces it has sold its entire bond portfolio at a $1.8 billion loss.",
      "The announcement triggers an immediate bank run. Within 48 hours, $42 billion had been withdrawn. SVB fails on March 10 — the second-largest bank failure in US history. Within days, Signature Bank and Silvergate also collapse.",
      "The Federal Reserve, Treasury, and FDIC announce emergency measures on Sunday March 12. All deposits — including uninsured deposits above $250,000 — will be guaranteed. The contagion stops. But the damage is done: Credit Suisse, weakened for years, is forced into a weekend rescue merger with UBS.",
      "Warning signs: SVB's bond portfolio was locked into low-rate 2021 bonds. As rates rose through 2022, the mark-to-market loss was visible in their public filings. The bank had no CFO for 8 months. Concentration risk: 97% of deposits were uninsured (above $250k). All of this was public — but few checked.",
      "Key question: A −7% S&P decline that recovers in weeks. But individual bank stocks fell 80-90%. This crisis illustrates why sector concentration matters and why 'too niche to fail' is a dangerous assumption."
    ]
  },

  // ── Group 5: South African ────────────────────────────────────────
  {
    id: 'usdzar-2015',
    name: 'Nenegate (Dec 2015)',
    ticker: 'SOL',
    subtitle: 'Dec 2015  ·  ZAR −25%  ·  SOL −40%',
    magnitude: '-40%',
    duration: '~8 weeks',
    startDate: '2015-11-01',
    endDate:   '2016-06-30',
    fetchStart: '2012-01-01',
    fetchEnd:   '2018-12-31',
    context: [
      "It's the evening of Wednesday December 9, 2015 in South Africa. President Jacob Zuma has just fired Finance Minister Nhlanhla Nene — a respected figure who had been holding the budget line — and replaced him with a political unknown, David van Rooyen.",
      "The rand goes into freefall. The dollar buys R17, then R18, touching R17.90 in days. This is one of the most dramatic single-night currency collapses in South Africa's democratic history. The JSE opens in chaos the next morning.",
      "Sasol (SOL.JO), priced in rand but with dollar-linked oil revenues, becomes the proxy instrument for watching this ZAR crisis play out on a daily chart. On some days it gains while rand costs fall; on others, market panic crushes everything.",
      "Zuma reversed course four days later, appointing Pravin Gordhan as Finance Minister instead. The rand partially recovered. But the damage was lasting — Zuma's economic credibility never recovered, and the structural rot in South Africa's state-owned enterprises had been publicly exposed.",
      "Warning signs: The rand had already been weakening for months. Commodity prices (oil) had been falling since mid-2014. Eskom load-shedding was intensifying. Political risk was rising with the Gupta relationship increasingly visible. None of these individually screamed 'sell' — but together, in hindsight, the pressure was building.",
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

  // Date milestone bar — pinned key dates so the user always knows where onset and bottom are
  const milestones = [
    { label: '▼ Crash onset', date: scenario.startDate, color: 'var(--red)'   },
    { label: '▲ Crash bottom', date: scenario.endDate || '—', color: 'var(--green)' }
  ];
  const milestonesHtml =
    '<div id="crash-milestones" style="display:flex;gap:12px;flex-wrap:wrap;margin:10px 0 6px">' +
    milestones.map(m =>
      '<span style="display:inline-flex;align-items:center;gap:6px;font-size:12px;font-weight:700;' +
      'background:var(--panel-2);border:1px solid var(--line);border-radius:6px;padding:4px 10px">' +
      '<span style="color:' + m.color + '">' + _esc(m.label) + '</span>' +
      '<span style="color:var(--cream);font-variant-numeric:tabular-nums">' + _esc(m.date) + '</span>' +
      '</span>'
    ).join('') +
    '</div>';

  body.innerHTML = milestonesHtml + scenario.context
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
