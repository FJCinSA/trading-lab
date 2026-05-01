// ============================================================
// FJC Trading Lab — Market Events Timeline
// ============================================================
// A curated list of major macro events, crises, and turning
// points. Rendered as small flag markers on the price chart
// so the learner can see what drove price action in context.
//
// Categories:
//   'crash'  — market crash / acute crisis         → red flag
//   'macro'  — central bank / policy event         → blue flag
//   'geo'    — geopolitical event                  → orange flag
//   'corp'   — major corporate / earnings shock    → purple flag
//   'rates'  — rate decision / yield curve move    → teal flag
// ============================================================

export const MARKET_EVENTS = [

  // ── 2000–2002: Dot-com collapse ─────────────────────────────────
  { date: '2000-03-10', label: 'Nasdaq peak', detail: 'Nasdaq Composite tops at 5,048. The dot-com bubble reaches its peak. QQQ at $118.', category: 'crash' },
  { date: '2001-09-11', label: '9/11 attacks', detail: 'Terrorist attacks on the World Trade Center. US markets close for 4 days — the longest closure since 1933. S&P -11.6% on reopening.', category: 'geo' },
  { date: '2002-07-19', label: 'WorldCom files', detail: 'WorldCom files for bankruptcy — the largest in US history at the time ($107bn). Follows Enron (Dec 2001) and Tyco scandals.', category: 'corp' },

  // ── 2003–2007: The long recovery and credit bubble ───────────────
  { date: '2003-03-20', label: 'Iraq War begins', detail: 'US invasion of Iraq. Markets initially fell on the uncertainty, then rallied sharply once the initial campaign succeeded quickly.', category: 'geo' },
  { date: '2004-06-30', label: 'Fed hikes begin', detail: 'First Fed rate hike after 12 months at 1%. Greenspan begins a steady campaign of 25bp hikes at every meeting — 17 consecutive increases to 5.25%.', category: 'rates' },
  { date: '2006-06-29', label: 'Fed pause 5.25%', detail: 'Federal Reserve pauses rate hikes at 5.25% after 17 consecutive increases. The housing market is already cooling.', category: 'rates' },
  { date: '2007-06-22', label: 'Bear Stearns hedge funds', detail: 'Two Bear Stearns hedge funds collapse — the first visible crack in the subprime mortgage market. Most analysts call it "contained."', category: 'crash' },
  { date: '2007-10-09', label: 'S&P 500 peak', detail: 'S&P 500 reaches its pre-GFC all-time high of 1,576. The GFC has technically already begun — but no one knows it yet.', category: 'crash' },

  // ── 2008–2009: Global Financial Crisis ───────────────────────────
  { date: '2008-03-14', label: 'Bear Stearns rescued', detail: 'JP Morgan rescues Bear Stearns at $2/share (later raised to $10) with Fed backing. First major Wall Street firm to fail.', category: 'crash' },
  { date: '2008-07-11', label: 'IndyMac seized', detail: 'Federal regulators seize IndyMac Bank in the second-largest bank failure in US history. Bank runs begin.', category: 'crash' },
  { date: '2008-09-07', label: 'Fannie/Freddie seized', detail: 'US government places Fannie Mae and Freddie Mac into conservatorship — a $5 trillion implicit bailout. The largest government rescue in history.', category: 'crash' },
  { date: '2008-09-15', label: 'Lehman fails', detail: 'Lehman Brothers files for bankruptcy — $639 billion in assets. The single event that turns a financial crisis into a global catastrophe. Markets in freefall.', category: 'crash' },
  { date: '2008-10-03', label: 'TARP signed', detail: '$700 billion Troubled Asset Relief Program signed into law. The biggest financial bailout in US history. Markets continue falling despite it.', category: 'macro' },
  { date: '2009-03-06', label: 'Market bottom', detail: 'S&P 500 bottoms at 666. Down 57% from its October 2007 peak. The Fed has cut rates to zero and begun quantitative easing.', category: 'crash' },
  { date: '2009-03-18', label: 'QE1 launched', detail: 'Federal Reserve announces $1.15 trillion in asset purchases (QE1). Markets begin to recover. This is the "whatever it takes" moment.', category: 'macro' },

  // ── 2010–2012: Recovery and European crisis ───────────────────────
  { date: '2010-05-06', label: 'Flash Crash', detail: 'Dow falls 998 points (9%) in 36 minutes, then recovers almost completely. Individual stocks trade at $0.01. Algorithmic cascade failure.', category: 'crash' },
  { date: '2010-05-09', label: 'Greek bailout 1', detail: 'EU and IMF agree €110 billion bailout for Greece. First of three Greek bailouts. European sovereign debt crisis begins.', category: 'macro' },
  { date: '2011-08-05', label: 'US credit downgrade', detail: "S&P strips the US of its AAA credit rating for the first time in history. S&P 500 falls 6.7% on Monday open. 'Risk-off' panic.", category: 'crash' },
  { date: '2012-07-26', label: '"Whatever it takes"', detail: 'ECB President Mario Draghi says the ECB will do "whatever it takes" to preserve the euro. Three words that end the European sovereign debt crisis. Markets soar.', category: 'macro' },

  // ── 2013: Taper Tantrum ──────────────────────────────────────────
  { date: '2013-05-22', label: 'Taper Tantrum', detail: 'Fed Chair Bernanke suggests the Fed may begin tapering QE. 10-year Treasury yield spikes from 1.6% to 3%. Emerging markets sell off sharply.', category: 'rates' },

  // ── 2014–2016: Oil crash, China, Nene ────────────────────────────
  { date: '2014-06-20', label: 'Oil peak $107', detail: 'Brent crude peaks near $115. Over the next 18 months it falls 70% — driven by US shale supply and Saudi refusal to cut output. Energy stocks collapse.', category: 'macro' },
  { date: '2015-08-24', label: 'China Black Monday', detail: 'Chinese markets fall 8.5% overnight on growth fears. The Dow opens -1,000 points. Global markets suffer their worst day in years. VIX spikes to 53.', category: 'crash' },
  { date: '2015-12-09', label: 'Nenegate', detail: 'President Zuma fires Finance Minister Nhlanhla Nene. The rand falls 10% overnight. SOL.JO drops 20% over the following weeks.', category: 'geo' },
  { date: '2016-06-23', label: 'Brexit vote', detail: 'UK votes to leave the European Union. The pound falls to its lowest level since 1985. Global markets fall sharply, then recover within a week.', category: 'geo' },

  // ── 2017–2019 ────────────────────────────────────────────────────
  { date: '2018-02-05', label: 'VIX spike', detail: 'XIV (inverse volatility ETF) is liquidated overnight after a 96% loss. Short-vol strategies collapse. S&P falls 10% in 2 weeks — the first correction in 2 years.', category: 'crash' },
  { date: '2018-12-24', label: 'Christmas Eve low', detail: 'S&P 500 falls to its worst Christmas Eve performance ever. Fed rate hike fears + trade war + government shutdown. Down 20% from September peak.', category: 'crash' },
  { date: '2019-08-14', label: 'Yield curve inverts', detail: '2-year Treasury yield exceeds 10-year for the first time since 2007 — a historically reliable recession indicator. Markets fall 3% on the day.', category: 'rates' },

  // ── 2020: COVID ──────────────────────────────────────────────────
  { date: '2020-01-21', label: 'First US COVID case', detail: 'First confirmed US COVID-19 case reported. Markets barely react — it\'s "just like SARS," say analysts.', category: 'geo' },
  { date: '2020-02-19', label: 'S&P 500 peak', detail: 'S&P 500 makes its pre-COVID all-time high at 3,393. COVID is spreading globally but markets are at record highs. The denial phase.', category: 'crash' },
  { date: '2020-03-12', label: 'Pandemic declared', detail: 'WHO declares COVID-19 a pandemic. S&P falls 9.5% — its worst day since 1987. Circuit breakers trigger. Liquidity evaporates everywhere.', category: 'crash' },
  { date: '2020-03-16', label: 'Fed cuts to zero', detail: 'Emergency Fed rate cut to 0%-0.25% and $700bn QE announced on a Sunday evening. Second emergency cut in 12 days. S&P still falls 12% on Monday.', category: 'macro' },
  { date: '2020-03-23', label: 'COVID bottom', detail: 'S&P 500 bottoms at 2,237 — down 34% in 33 days. The fastest major crash in history. The Fed announces unlimited QE the same morning.', category: 'crash' },
  { date: '2020-04-20', label: 'Oil goes negative', detail: 'WTI crude oil futures trade at −$37/barrel for the first time in history. Storage capacity is full. Lockdowns have destroyed demand overnight.', category: 'macro' },

  // ── 2021: Meme stocks and peak speculation ────────────────────────
  { date: '2021-01-27', label: 'GameStop squeeze', detail: 'GameStop (GME) rises 1,700% in two weeks driven by Reddit retail traders squeezing short sellers. Robinhood halts trading. The establishment vs the internet.', category: 'corp' },
  { date: '2021-11-03', label: 'Fed taper begins', detail: 'Fed announces it will begin tapering bond purchases at $15bn/month. Markets initially unimpressed — but this is the beginning of the end for zero-rate valuations.', category: 'rates' },

  // ── 2022: Rate hike cycle ─────────────────────────────────────────
  { date: '2022-01-05', label: 'QQQ peak', detail: 'Nasdaq 100 makes its all-time high. Three days later, the Fed signals more aggressive tightening. Tech stocks begin a 9-month bear market.', category: 'crash' },
  { date: '2022-03-16', label: 'First 2022 rate hike', detail: 'Fed raises rates for the first time since 2018 — 25bp to 0.25%-0.50%. The beginning of the most aggressive hiking cycle in 40 years.', category: 'rates' },
  { date: '2022-05-04', label: 'Fed hikes 50bp', detail: '50bp rate hike — the largest since 2000. Powell signals more to come. Nasdaq falls 5% the next day as the market reprices all future earnings.', category: 'rates' },
  { date: '2022-06-13', label: 'Crypto crash', detail: 'Bitcoin falls below $23,000. Celsius Network freezes withdrawals. The crypto bear market accelerates. Terra/Luna ($40bn) had already collapsed in May.', category: 'crash' },
  { date: '2022-09-28', label: 'UK pension crisis', detail: 'UK government announces unfunded tax cuts. Pound collapses. UK pension funds face margin calls on LDI strategies. Bank of England forced into emergency bond purchases.', category: 'macro' },

  // ── 2023: Banking crisis and recovery ────────────────────────────
  { date: '2023-03-10', label: 'SVB fails', detail: 'Silicon Valley Bank fails — the second-largest US bank failure in history. $42bn withdrawn in a single day. Contagion spreads to Signature Bank and Credit Suisse.', category: 'crash' },
  { date: '2023-03-19', label: 'UBS buys Credit Suisse', detail: 'Credit Suisse — 166 years old — is taken over by UBS in a government-brokered emergency sale for $3.2bn. AT1 bondholders wiped out.', category: 'crash' },
  { date: '2023-07-26', label: 'Fed final hike', detail: 'Fed raises rates to 5.25%-5.50% — the highest level in 22 years. Markets begin pricing in a soft landing scenario.', category: 'rates' },

  // ── 2024 ─────────────────────────────────────────────────────────
  { date: '2024-07-31', label: 'BoJ hikes to 0.25%', detail: 'Bank of Japan raises rates to 0.25% — the trigger for the yen carry trade unwind. The Nikkei falls 12% the following Monday. VIX spikes to 65.', category: 'rates' },
  { date: '2024-08-05', label: 'Yen carry panic', detail: 'Global market meltdown. Nikkei -12% (worst day since 1987). S&P -3%. VIX at 65. Forced deleveraging across every asset class. Recovers in 2 weeks.', category: 'crash' },
  { date: '2024-09-18', label: 'Fed cuts 50bp', detail: 'Federal Reserve begins cutting rates with an aggressive 50bp cut to 4.75%-5.00%. First cut since March 2020. Markets initially rally, then pause.', category: 'rates' }
];

// ── Category colours (CSS variable names) ──────────────────────────
export const EVENT_COLOURS = {
  crash: '#e0524d',   // var(--red)
  macro: '#5aa8ff',   // var(--blue)
  geo:   '#c9a84c',   // var(--gold)
  corp:  '#b08bff',   // var(--purple)
  rates: '#26a96c'    // var(--green)
};
