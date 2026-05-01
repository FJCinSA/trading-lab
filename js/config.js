// ============================================================
// FJC Trading Lab — Configuration
// ============================================================
// SINGLE SOURCE OF TRUTH for all instruments and constants.
//
// TO ADD A NEW TICKER: append one object to the TICKERS array.
// Everything else (synthetic data, live fetch, edge tables,
// autopilot, analogs) automatically iterates over this array.
//
// Fields:
//   sym    — internal ID used as state key and display label
//   name   — full company name (shown in tabs and AI prompts)
//   exch   — exchange name (NYSE / JSE / NASDAQ)
//   ccy    — 'USD' or 'ZAR' (drives priceToZar conversion)
//   yahoo  — Yahoo Finance symbol (used by the proxy worker)
//   start  — synthetic data seed price
//   vol    — daily volatility fraction (0.018 = 1.8% typical move)
//   drift  — daily drift fraction (positive = long-term upward bias)
// ============================================================

export const TICKERS = [

  // ── US EQUITIES ──────────────────────────────────────────────────────────────
  {
    sym:'TDY', name:'Teledyne Technologies', exch:'NYSE', ccy:'USD', yahoo:'TDY', cat:'equity',
    start:580, vol:0.018, drift: 0.0015,
    desc:'A steady, acquisitive defence & technology conglomerate. Low drama, high consistency. Teaches how patient compounding in quality industrials beats chasing momentum. Watch how it barely flinches during tech selloffs.'
  },
  {
    sym:'TSLA', name:'Tesla', exch:'NYSE', ccy:'USD', yahoo:'TSLA', cat:'equity',
    start:250, vol:0.038, drift: 0.0000,
    desc:'The textbook momentum/narrative stock. 3–5× more volatile than the S&P 500. Teaches position sizing, stop-loss discipline, and how sentiment can drive price far beyond fundamentals — in both directions. Compare to BRK to see value vs growth in action.'
  },
  {
    sym:'MNST', name:'Monster Beverage', exch:'NASDAQ', ccy:'USD', yahoo:'MNST', cat:'equity',
    start:58, vol:0.020, drift: 0.0008,
    desc:'One of the greatest long-term compounders on the Nasdaq — turned $10k into $40M over 20 years. Teaches how consumer brand moats create durable pricing power. A reminder that multi-baggers often hide in boring sectors.'
  },
  {
    sym:'BRK', name:'Berkshire Hathaway B', exch:'NYSE', ccy:'USD', yahoo:'BRK-B', cat:'equity',
    start:375, vol:0.012, drift: 0.0004,
    desc:"Warren Buffett's holding company — the gold standard of value investing. Low volatility, no dividend, no hype. Compare directly to TSLA: same period, very different ride. Teaches patience, intrinsic value, and why boring can be beautiful."
  },
  {
    sym:'META', name:'Meta Platforms', exch:'NASDAQ', ccy:'USD', yahoo:'META', cat:'equity',
    start:450, vol:0.028, drift: 0.0004,
    desc:'Dropped 75% in 2022 then tripled back. Teaches how even dominant platforms face existential narratives — and how market overreaction creates opportunity. Study the 2022 crash scenario to see what a full sentiment capitulation looks like.'
  },

  // ── US INDEXES & BENCHMARKS ──────────────────────────────────────────────────
  {
    sym:'SPY', name:'S&P 500 ETF', exch:'NYSE', ccy:'USD', yahoo:'SPY', cat:'index',
    start:450, vol:0.011, drift: 0.0003,
    desc:'The benchmark everything is measured against. 500 largest US companies, market-cap weighted — so Apple and Nvidia move it more than hundreds of others. Use it as your baseline: if your stock underperforms SPY over a year, the index would have been the better trade.'
  },
  {
    sym:'QQQ', name:'Nasdaq 100 ETF', exch:'NASDAQ', ccy:'USD', yahoo:'QQQ', cat:'index',
    start:380, vol:0.016, drift: 0.0004,
    desc:"The tech-heavy twin of SPY — top 100 non-financial Nasdaq stocks. When rates rise, QQQ falls harder than SPY because growth stocks are long-duration assets. Teaches interest rate sensitivity and the 'discount rate kills growth stocks' lesson from 2022."
  },
  {
    sym:'DIA', name:'Dow Jones 30 ETF', exch:'NYSE', ccy:'USD', yahoo:'DIA', cat:'index',
    start:390, vol:0.009, drift: 0.0002,
    desc:'The oldest index in the world (1896) — just 30 blue-chip stocks, price-weighted. Lower volatility than SPY. Teaches index construction differences: why Goldman Sachs moves the Dow more than Apple, even though Apple is worth 10× more.'
  },
  {
    sym:'IWM', name:'Russell 2000 ETF', exch:'NYSE', ccy:'USD', yahoo:'IWM', cat:'index',
    start:200, vol:0.016, drift: 0.0002,
    desc:'2000 small-cap US companies. Often leads the market at turning points — small caps rally first when risk appetite returns, and fall first when it leaves. Watch IWM vs SPY divergence: when small caps lag big caps for months, it signals caution.'
  },
  {
    sym:'TLT', name:'20yr Treasury Bond ETF', exch:'NYSE', ccy:'USD', yahoo:'TLT', cat:'index',
    start:90, vol:0.012, drift:-0.0001,
    desc:"US government long bonds. When the Fed raises rates, TLT falls — sometimes dramatically. The essential instrument for teaching the inverse bond-price/yield relationship. In a crisis, TLT often spikes as investors flee to safety. The 2022 TLT crash (-40%) was historic."
  },

  // ── GLOBAL INDEXES (ETFs) ────────────────────────────────────────────────────
  {
    sym:'EWG', name:'Germany DAX ETF', exch:'NYSE', ccy:'USD', yahoo:'EWG', cat:'global',
    start:35, vol:0.014, drift: 0.0001,
    desc:"Europe's industrial heart. Germany's economy runs on manufacturing exports — cars (BMW, Mercedes), chemicals (BASF), industrials (Siemens). Teaches how European equities are sensitive to energy prices, China demand, and EUR/USD moves. The Ukraine war hit EWG hard in 2022."
  },
  {
    sym:'EWJ', name:'Japan Nikkei ETF', exch:'NYSE', ccy:'USD', yahoo:'EWJ', cat:'global',
    start:70, vol:0.013, drift: 0.0001,
    desc:"Three lessons in one instrument: (1) Deflation — Japan's 30-year stagnation after the 1989 bubble is the definitive case study. (2) Demographics — an ageing population suppresses growth. (3) The carry trade — borrowing cheap yen to buy higher-yielding assets drives global flows. When the carry trade unwinds, everything sells."
  },
  {
    sym:'EEM', name:'Emerging Markets ETF', exch:'NYSE', ccy:'USD', yahoo:'EEM', cat:'global',
    start:40, vol:0.018, drift: 0.0001,
    desc:'A basket of 24 developing-world markets — China, India, Brazil, Taiwan, South Africa. The risk-on/off barometer: when global investors feel brave they pile in; when the dollar strengthens or US rates rise, money floods out. Teaches currency risk, political risk, and why EM assets are not for the faint-hearted.'
  },

  // ── SOUTH AFRICAN (JSE) ──────────────────────────────────────────────────────
  {
    sym:'SOL', name:'Sasol', exch:'JSE', ccy:'ZAR', yahoo:'SOL.JO', cat:'jse',
    start:120, vol:0.030, drift:-0.0005,
    desc:'South African energy and chemicals giant — a proxy for oil price, ZAR strength, and domestic load-shedding risk all at once. Teaches how a commodity-linked stock can be crushed by multiple headwinds simultaneously. Studying its decade-long decline is a masterclass in structural risk.'
  },
  {
    sym:'NPN', name:'Naspers', exch:'JSE', ccy:'ZAR', yahoo:'NPN.JO', cat:'jse',
    start:3200, vol:0.025, drift: 0.0002,
    desc:"Africa's largest company by market cap — yet most of its value comes from a 26% stake in Chinese tech giant Tencent. Teaches the concept of a 'holding company discount': Naspers trades below the sum of its parts because of governance, liquidity, and SA-country risk. When Tencent sneezes, Naspers catches pneumonia."
  },
  {
    sym:'ABG', name:'Absa Group', exch:'JSE', ccy:'ZAR', yahoo:'ABG.JO', cat:'jse',
    start:185, vol:0.022, drift: 0.0002,
    desc:'One of the big four South African banks. Teaches how financial stocks are leveraged plays on the domestic economy — rate cycles, credit defaults, and consumer health all show up in the share price. Compare to TLT: both are rate-sensitive, but a SA bank adds political and currency risk on top.'
  },

  // ── COMMODITIES ──────────────────────────────────────────────────────────────
  {
    sym:'GOLD', name:'Gold Futures', exch:'CME', ccy:'USD', yahoo:'GC=F', cat:'commodity',
    start:2000, vol:0.010, drift: 0.0003,
    desc:"The world's oldest store of value. Rises when real interest rates fall, when inflation spikes, or when geopolitical fear surges. Falls when the dollar strengthens. Teaches the concept of a 'safe haven' — and why it sometimes fails as one. Every portfolio has a gold question; this is where you learn the answer."
  },
  {
    sym:'COPPER', name:'Copper Futures', exch:'CME', ccy:'USD', yahoo:'HG=F', cat:'commodity',
    start:4.2, vol:0.020, drift: 0.0001,
    desc:'"Dr. Copper" has a PhD in economics. Because copper goes into everything built — homes, cars, power grids, factories — its price is a leading indicator of global growth. Rising copper = the world is building. Falling copper = slowdown ahead. Watch copper before you trade EEM or EWG.'
  },
  {
    sym:'OIL', name:'Crude Oil WTI', exch:'CME', ccy:'USD', yahoo:'CL=F', cat:'commodity',
    start:80, vol:0.025, drift: 0.0000,
    desc:'Geopolitics in price form. Every supply shock, OPEC decision, and recession fear shows up here. Teaches mean reversion (oil always comes back to a supply/demand equilibrium), supply shocks (1973, 1990, 2022), and demand destruction (COVID sent it briefly negative). High volatility; respect your stop losses.'
  },

  // ── CRYPTO ───────────────────────────────────────────────────────────────────
  {
    sym:'BTC', name:'Bitcoin', exch:'CRYPTO', ccy:'USD', yahoo:'BTC-USD', cat:'crypto',
    start:45000, vol:0.055, drift: 0.0005,
    desc:'"Digital gold" — a fixed-supply, decentralised asset. 5× more volatile than the S&P. Teaches: position sizing under extreme volatility, the 4-year halving cycle, and how a new asset class gets priced by narrative before fundamentals. Also teaches what a 70-80% drawdown feels like — essential medicine for every trader.'
  },
  {
    sym:'ETH', name:'Ethereum', exch:'CRYPTO', ccy:'USD', yahoo:'ETH-USD', cat:'crypto',
    start:2500, vol:0.065, drift: 0.0003,
    desc:"The world's programmable money layer — a platform for smart contracts, DeFi, and NFTs. Higher volatility than Bitcoin, higher beta to risk appetite. Teaches the difference between a 'store of value' (BTC) and a 'utility token' (ETH): ETH's price reflects actual usage of its network. When crypto risk-off hits, ETH typically falls harder and faster."
  },

  // ── FOREX ────────────────────────────────────────────────────────────────────
  {
    sym:'EURUSD', name:'Euro / US Dollar', exch:'FX', ccy:'USD', yahoo:'EURUSD=X', cat:'forex',
    start:1.09, vol:0.005, drift: 0.0000,
    desc:'The most traded currency pair on earth — $1.1 trillion per day. Moves on ECB vs Fed policy divergence, Eurozone economic data, and risk sentiment. Teaches forex basics: pips, spread, interest rate differentials, and why currency moves affect everything you own. A stronger dollar crushes EM assets and commodity prices.'
  },
  {
    sym:'USDJPY', name:'US Dollar / Japanese Yen', exch:'FX', ccy:'USD', yahoo:'USDJPY=X', cat:'forex',
    start:150, vol:0.005, drift: 0.0001,
    desc:"The carry trade instrument. For decades, traders borrowed cheap yen (near-zero rates) to buy higher-yielding assets globally — funding countless equity bull runs. When the Bank of Japan raises rates, the carry trade unwinds violently: yen surges, everything else sells. The August 2024 yen squeeze is the must-study example."
  },
  {
    sym:'USDZAR', name:'US Dollar / South African Rand', exch:'FX', ccy:'USD', yahoo:'ZAR=X', cat:'forex',
    start:18.5, vol:0.012, drift: 0.0001,
    desc:"The ZAR is one of the world's most volatile emerging market currencies — and the most liquid in Africa. It is a barometer of global risk appetite: when investors flee to safety, the ZAR weakens sharply. Locally, it reacts to load-shedding, political news, and commodity prices. Every South African investor must understand ZAR risk."
  },
];

// Default Cloudflare Worker proxy URLs — baked in so the app works on any
// computer without manual configuration. Users can still override these in
// Settings; the override is stored in localStorage and takes precedence.
export const DEFAULT_YAHOO_PROXY  = 'https://yahoo-proxy.fjcspeel.workers.dev/';
export const DEFAULT_CLAUDE_PROXY = 'https://trading-proxy.fjcspeel.workers.dev/';

// localStorage keys — versioned so a schema change doesn't corrupt old data
export const LS_PORTFOLIO   = 'fjc-trading-portfolio-v1';
export const LS_ALERTS      = 'fjc-trading-alerts-v1';
export const LS_PROXY       = 'fjc-trading-proxy-v1';
export const LS_SR          = 'fjc-trading-sr-v1';
export const LS_PILOT       = 'fjc-trading-pilot-v1';
export const LS_YAHOO_PROXY = 'fjc-trading-yahoo-proxy-v1';
export const LS_FX          = 'fjc-trading-fx-v1';
export const LS_JOURNAL     = 'fjc-trading-journal-v1';
export const LS_CURRICULUM  = 'fjc-trading-curriculum-v1';

// Autopilot envelope protection — disengage when portfolio drawdown exceeds this %
export const ENVELOPE_DRAWDOWN_PCT = 15;

// Historical analog / edge look-forward window (trading days)
export const HIST_FORWARD_DAYS = 30;

// Timeframe steps shared by chart wheel handler, bindControls, and jumpToCrash
export const TF_STEPS = [30, 90, 180, 365, 730];
