/** FMP Data Hub — 30 Category Definitions */

import { CategoryConfig } from './types.js';

const S = (seconds: number) => seconds;
const M = (minutes: number) => minutes * 60;
const H = (hours: number) => hours * 3600;
const D = (days: number) => days * 86400;

export const CATEGORIES: CategoryConfig[] = [
  // ── Core Fundamentals (10) ──────────────────────────
  {
    key: 'profile',
    endpoint: '/v3/profile/{symbol}',
    ttlSeconds: H(24),
    description: 'Company info, CEO, sector, market cap',
    group: 'core',
  },
  {
    key: 'quote',
    endpoint: '/v3/quote/{symbol}',
    ttlSeconds: M(5),
    description: 'Real-time price, change, volume',
    group: 'core',
  },
  {
    key: 'income_statement',
    endpoint: '/v3/income-statement/{symbol}?limit=10',
    ttlSeconds: H(24),
    description: 'Income statements (10 periods)',
    group: 'core',
  },
  {
    key: 'balance_sheet',
    endpoint: '/v3/balance-sheet-statement/{symbol}?limit=10',
    ttlSeconds: H(24),
    description: 'Balance sheets (10 periods)',
    group: 'core',
  },
  {
    key: 'cash_flow',
    endpoint: '/v3/cash-flow-statement/{symbol}?limit=10',
    ttlSeconds: H(24),
    description: 'Cash flow statements (10 periods)',
    group: 'core',
  },
  {
    key: 'ratios',
    endpoint: '/v3/ratios/{symbol}?limit=10',
    ttlSeconds: H(24),
    description: 'Financial ratios',
    group: 'core',
  },
  {
    key: 'ratios_ttm',
    endpoint: '/v3/ratios-ttm/{symbol}',
    ttlSeconds: H(6),
    description: 'TTM financial ratios',
    group: 'core',
  },
  {
    key: 'key_metrics',
    endpoint: '/v3/key-metrics/{symbol}?limit=10',
    ttlSeconds: H(24),
    description: 'Key financial metrics',
    group: 'core',
  },
  {
    key: 'key_metrics_ttm',
    endpoint: '/v3/key-metrics-ttm/{symbol}',
    ttlSeconds: H(6),
    description: 'TTM key metrics',
    group: 'core',
  },
  {
    key: 'financial_growth',
    endpoint: '/v3/financial-growth/{symbol}?limit=10',
    ttlSeconds: H(24),
    description: 'Revenue/earnings growth rates',
    group: 'core',
  },

  // ── Market Intelligence (10) ────────────────────────
  {
    key: 'analyst_estimates',
    endpoint: '/v3/analyst-estimates/{symbol}?limit=4',
    ttlSeconds: H(12),
    description: 'Consensus analyst estimates',
    group: 'intelligence',
  },
  {
    key: 'price_target',
    endpoint: '/v4/price-target?symbol={symbol}',
    ttlSeconds: H(12),
    description: 'Price target consensus',
    group: 'intelligence',
  },
  {
    key: 'company_rating',
    endpoint: '/v3/rating/{symbol}',
    ttlSeconds: H(12),
    description: 'Composite company rating',
    group: 'intelligence',
  },
  {
    key: 'insider_trading',
    endpoint: '/v4/insider-trading?symbol={symbol}&limit=50',
    ttlSeconds: H(12),
    description: 'Recent insider trades',
    group: 'intelligence',
  },
  {
    key: 'institutional_holders',
    endpoint: '/v3/institutional-holder/{symbol}',
    ttlSeconds: H(24),
    description: 'Top institutional holders',
    group: 'intelligence',
  },
  {
    key: 'mutual_fund_holders',
    endpoint: '/v3/mutual-fund-holder/{symbol}',
    ttlSeconds: H(24),
    description: 'Top mutual fund holders',
    group: 'intelligence',
  },
  {
    key: 'stock_news',
    endpoint: '/v3/stock_news?tickers={symbol}&limit=20',
    ttlSeconds: H(1),
    description: 'Latest news articles',
    group: 'intelligence',
  },
  {
    key: 'stock_peers',
    endpoint: '/v4/stock_peers?symbol={symbol}',
    ttlSeconds: H(24),
    description: 'Peer companies',
    group: 'intelligence',
  },
  {
    key: 'esg_score',
    endpoint: '/v4/esg-environmental-social-governance-data?symbol={symbol}',
    ttlSeconds: D(7),
    description: 'ESG ratings',
    group: 'intelligence',
  },
  {
    key: 'dcf',
    endpoint: '/v3/discounted-cash-flow/{symbol}',
    ttlSeconds: H(12),
    description: 'DCF valuation',
    group: 'intelligence',
  },
  {
    key: 'options_chain',
    endpoint: '/v3/options/{symbol}',
    ttlSeconds: H(1),
    description: 'Full options chain',
    group: 'intelligence',
  },

  // ── Historical Time-Series (7) ──────────────────────
  {
    key: 'historical_price_daily',
    endpoint: '/v3/historical-price-full/{symbol}?from={from}&to={to}',
    ttlSeconds: H(4),
    description: 'Daily OHLCV candlesticks (last 2 years)',
    group: 'historical',
  },
  {
    key: 'historical_dividends',
    endpoint: '/v3/historical-price-full/stock_dividend/{symbol}',
    ttlSeconds: H(24),
    description: 'Full dividend payout history',
    group: 'historical',
  },
  {
    key: 'historical_splits',
    endpoint: '/v3/historical-price-full/stock_split/{symbol}',
    ttlSeconds: H(24),
    description: 'Stock split history',
    group: 'historical',
  },
  {
    key: 'historical_market_cap',
    endpoint: '/v3/historical-market-capitalization/{symbol}?limit=250',
    ttlSeconds: H(24),
    description: 'Market cap trajectory (~1yr daily)',
    group: 'historical',
  },
  {
    key: 'historical_rating',
    endpoint: '/v3/historical-rating/{symbol}?limit=100',
    ttlSeconds: H(24),
    description: 'Rating changes over time',
    group: 'historical',
  },
  {
    key: 'historical_dcf',
    endpoint: '/v3/historical-discounted-cash-flow-statement/{symbol}?limit=10',
    ttlSeconds: H(24),
    description: 'DCF valuation over time',
    group: 'historical',
  },
  {
    key: 'historical_employee_count',
    endpoint: '/v4/historical/employee_count?symbol={symbol}',
    ttlSeconds: D(7),
    description: 'Workforce size over time',
    group: 'historical',
  },
  {
    key: 'treasury_rates',
    endpoint: '/v4/treasury?from={from}&to={to}',
    ttlSeconds: D(1),
    description: 'Treasury rates (last 2 years)',
    group: 'historical',
  },
  {
    key: 'economic_gdp',
    endpoint: '/v4/economic?name=GDP&from={from}&to={to}',
    ttlSeconds: D(7),
    description: 'US GDP over time',
    group: 'historical',
  },

  // ── Calendar & Events (3) ──────────────────────────
  {
    key: 'earnings_calendar',
    endpoint: '/v3/historical/earning_calendar/{symbol}?limit=8',
    ttlSeconds: H(24),
    description: 'Past & upcoming earnings dates',
    group: 'events',
  },
  {
    key: 'earnings_surprises',
    endpoint: '/v3/earnings-surprises/{symbol}',
    ttlSeconds: H(24),
    description: 'Actual vs estimated EPS history',
    group: 'events',
  },
  {
    key: 'press_releases',
    endpoint: '/v3/press-releases/{symbol}?limit=20',
    ttlSeconds: H(6),
    description: 'Company press releases',
    group: 'events',
  },
];

export function getCategoryByKey(key: string): CategoryConfig | undefined {
  return CATEGORIES.find((c) => c.key === key);
}

export function getCategoriesByGroup(group: CategoryConfig['group']): CategoryConfig[] {
  return CATEGORIES.filter((c) => c.group === group);
}
