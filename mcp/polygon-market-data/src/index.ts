#!/usr/bin/env node

/**
 * MCP Server for Polygon.io Market Data
 *
 * This server provides tools to access real-time and historical market data
 * from Polygon.io REST API v3.
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  Tool,
} from '@modelcontextprotocol/sdk/types.js';

// Get API key from environment
const POLYGON_API_KEY = process.env.POLYGON_API_KEY;

if (!POLYGON_API_KEY) {
  console.error('ERROR: POLYGON_API_KEY environment variable is required');
  console.error('Get your API key from: https://polygon.io/');
  process.exit(1);
}

// Polygon.io REST API v3 base URL
const POLYGON_BASE_URL = 'https://api.polygon.io/v3';

/**
 * Type definitions for Polygon.io API responses
 */

interface QuoteResponse {
  status: string;
  request_id: string;
  results?: {
    ticker: string;
    day: {
      c: number; // close
      h: number; // high
      l: number; // low
      o: number; // open
      v: number; // volume
      vw: number; // vwap
    };
    lastQuote: {
      p: number; // price
      s: number; // size
      t: number; // timestamp (unix ms)
    };
    min: {
      c: number;
      h: number;
      l: number;
      o: number;
      v: number;
      vw: number;
    };
    prevDay: {
      c: number;
      h: number;
      l: number;
      o: number;
      v: number;
      vw: number;
    };
  };
}

interface AggregatesResponse {
  status: string;
  request_id: string;
  results?: {
    ticker: string;
    queryCount: number;
    resultsCount: number;
    adjusted: boolean;
    results: Array<{
      o: number; // open
      h: number; // high
      l: number; // low
      c: number; // close
      v: number; // volume
      vw: number; // vwap
      t: number; // timestamp (unix ms)
      n: number; // number of items in aggregate
    }>;
  };
}

interface SymbolResponse {
  status: string;
  request_id: string;
  next_url: string | null;
  results?: Array<{
    ticker: string;
    name: string;
    market: string;
    locale: string;
    type: string;
    currency_name: string;
    cik: string | null;
    composite_figi: string | null;
    share_class_figi: string | null;
    last_updated_utc: string;
  }>;
}

interface TradesResponse {
  status: string;
  request_id: string;
  next_url: string | null;
  results?: Array<{
    T: string; // ticker symbol
    t: number; // timestamp (unix ms)
    p: number; // price
    s: number; // size
    x: number; // exchange ID
    c: number; // conditions
    i: number; // trade ID
  }>;
}

/**
 * Helper function to make authenticated requests to Polygon.io
 */
async function polygonFetch<T>(endpoint: string): Promise<T> {
  const url = `${POLYGON_BASE_URL}${endpoint}${endpoint.includes('?') ? '&' : '?'}apiKey=${POLYGON_API_KEY}`;

  const response = await fetch(url);

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(
      `Polygon.io API error: ${response.status} ${response.statusText}\n${errorText}`
    );
  }

  const data = await response.json();

  // Check for API-level errors
  if (data.status === 'ERROR' || data.error) {
    throw new Error(`Polygon.io API error: ${data.error || 'Unknown error'}`);
  }

  return data as T;
}

/**
 * Tool definitions
 */
const TOOLS: Tool[] = [
  {
    name: 'get_quote',
    description:
      'Get the latest quote for a stock ticker. Returns current price, bid/ask, daily OHLCV, and previous day data.',
    inputSchema: {
      type: 'object',
      properties: {
        symbol: {
          type: 'string',
          description: 'Stock ticker symbol (e.g., AAPL, MSFT, GOOGL)',
        },
      },
      required: ['symbol'],
    },
  },
  {
    name: 'get_aggregates',
    description:
      'Get OHLCV aggregate bars for a ticker over a given time range. Useful for historical price data and technical analysis.',
    inputSchema: {
      type: 'object',
      properties: {
        symbol: {
          type: 'string',
          description: 'Stock ticker symbol (e.g., AAPL, MSFT, GOOGL)',
        },
        timespan: {
          type: 'string',
          enum: ['minute', 'hour', 'day', 'week', 'month', 'quarter', 'year'],
          description:
            'Size of the time window for each aggregate bar. Default: day',
        },
        from: {
          type: 'string',
          description:
            'Start date for aggregates (format: YYYY-MM-DD or Unix timestamp in ms)',
        },
        to: {
          type: 'string',
          description:
            'End date for aggregates (format: YYYY-MM-DD or Unix timestamp in ms)',
        },
        multiplier: {
          type: 'number',
          description:
            'Number of timespans per aggregate bar (e.g., timespan=minute, multiplier=5 = 5-minute bars)',
        },
        adjusted: {
          type: 'boolean',
          description:
            'Whether to adjust for stock splits. Default: true for US equities',
        },
      },
      required: ['symbol', 'timespan', 'from', 'to'],
    },
  },
  {
    name: 'list_symbols',
    description:
      'Search for and list ticker symbols. Can filter by ticker type and market.',
    inputSchema: {
      type: 'object',
      properties: {
        ticker_type: {
          type: 'string',
          enum: [
            'CS',
            'ETP',
            'ADRC',
            'ETF',
            'ADR',
            'NYRS',
            'UNIT',
            'RIGHT',
            'STRUCT',
            'BOND',
            'FUND',
            'INDEX',
            'OPTION',
            'CRYPTO',
            'FOREX',
          ],
          description:
            'Type of ticker (CS=Common Stock, ETF=Exchange Traded Fund, etc.)',
        },
        market: {
          type: 'string',
          enum: ['stocks', 'crypto', 'fx'],
          description: 'Market to query',
        },
        search: {
          type: 'string',
          description: 'Search term to filter results (searches ticker and company name)',
        },
        limit: {
          type: 'number',
          description: 'Limit number of results (default: 10, max: 1000)',
        },
      },
    },
  },
  {
    name: 'get_trades',
    description:
      'Get recent trades for a ticker. Returns individual trade data with price, size, and timestamp.',
    inputSchema: {
      type: 'object',
      properties: {
        symbol: {
          type: 'string',
          description: 'Stock ticker symbol (e.g., AAPL, MSFT, GOOGL)',
        },
        timestamp: {
          type: 'string',
          description:
            'Query trade data for this timestamp or date (format: YYYY-MM-DD or Unix timestamp in ms)',
        },
        limit: {
          type: 'number',
          description:
            'Limit number of results (default: 10, max: 50000). WARNING: Large limits may result in slow responses.',
        },
      },
      required: ['symbol'],
    },
  },
];

/**
 * Create MCP server
 */
const server = new Server(
  {
    name: 'polygon-market-data',
    version: '1.0.0',
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

/**
 * Handle tool listing
 */
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: TOOLS,
  };
});

/**
 * Handle tool execution
 */
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    switch (name) {
      case 'get_quote': {
        const { symbol } = args as { symbol: string };

        if (!symbol || typeof symbol !== 'string') {
          throw new Error('Symbol is required and must be a string');
        }

        const upperSymbol = symbol.toUpperCase();
        const data = await polygonFetch<QuoteResponse>(
          `/quotes/${upperSymbol}/latest`
        );

        if (!data.results) {
          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify(
                  {
                    error: 'No quote data found for symbol',
                    symbol: upperSymbol,
                  },
                  null,
                  2
                ),
              },
            ],
          };
        }

        // Format the response for better readability
        const quote = data.results;
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(
                {
                  symbol: quote.ticker,
                  last_price: quote.lastQuote.p,
                  last_size: quote.lastQuote.s,
                  last_timestamp: new Date(quote.lastQuote.t).toISOString(),
                  day: {
                    open: quote.day.o,
                    high: quote.day.h,
                    low: quote.day.l,
                    close: quote.day.c,
                    volume: quote.day.v,
                    vwap: quote.day.vw,
                  },
                  previous_day: {
                    open: quote.prevDay.o,
                    high: quote.prevDay.h,
                    low: quote.prevDay.l,
                    close: quote.prevDay.c,
                    volume: quote.prevDay.v,
                    vwap: quote.prevDay.vw,
                  },
                },
                null,
                2
              ),
            },
          ],
        };
      }

      case 'get_aggregates': {
        const {
          symbol,
          timespan,
          from,
          to,
          multiplier = 1,
          adjusted = true,
        } = args as {
          symbol: string;
          timespan: string;
          from: string;
          to: string;
          multiplier?: number;
          adjusted?: boolean;
        };

        if (!symbol || typeof symbol !== 'string') {
          throw new Error('Symbol is required and must be a string');
        }
        if (!timespan || typeof timespan !== 'string') {
          throw new Error('Timespan is required and must be a string');
        }
        if (!from || typeof from !== 'string') {
          throw new Error('From date is required');
        }
        if (!to || typeof to !== 'string') {
          throw new Error('To date is required');
        }

        const upperSymbol = symbol.toUpperCase();
        const data = await polygonFetch<AggregatesResponse>(
          `/aggregated/ticker/${upperSymbol}/range/${multiplier}/${timespan}/${from}/${to}?adjusted=${adjusted}`
        );

        if (!data.results) {
          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify(
                  {
                    error: 'No aggregate data found for symbol and date range',
                    symbol: upperSymbol,
                    timespan,
                    from,
                    to,
                  },
                  null,
                  2
                ),
              },
            ],
          };
        }

        // Format the response
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(
                {
                  symbol: data.results.ticker,
                  timespan,
                  from,
                  to,
                  multiplier,
                  adjusted: data.results.adjusted,
                  bars: data.results.results.map((bar) => ({
                    timestamp: new Date(bar.t).toISOString(),
                    open: bar.o,
                    high: bar.h,
                    low: bar.l,
                    close: bar.c,
                    volume: bar.v,
                    vwap: bar.vw,
                    trades: bar.n,
                  })),
                },
                null,
                2
              ),
            },
          ],
        };
      }

      case 'list_symbols': {
        const { ticker_type, market, search, limit = 10 } = args as {
          ticker_type?: string;
          market?: string;
          search?: string;
          limit?: number;
        };

        // Build query parameters
        const params = new URLSearchParams();
        if (ticker_type) params.append('type', ticker_type);
        if (market) params.append('market', market);
        if (search) params.append('search', search);
        if (limit) params.append('limit', Math.min(limit, 1000).toString());
        params.append('active', 'true');
        params.append('sort', 'ticker');

        const queryString = params.toString();
        const data = await polygonFetch<SymbolResponse>(
          `/reference/tickers${queryString ? '?' + queryString : ''}`
        );

        if (!data.results || data.results.length === 0) {
          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify(
                  {
                    message: 'No symbols found matching criteria',
                    filters: { ticker_type, market, search, limit },
                  },
                  null,
                  2
                ),
              },
            ],
          };
        }

        // Format the response
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(
                {
                  count: data.results.length,
                  symbols: data.results.map((sym) => ({
                    ticker: sym.ticker,
                    name: sym.name,
                    market: sym.market,
                    type: sym.type,
                    currency: sym.currency_name,
                    last_updated: sym.last_updated_utc,
                  })),
                },
                null,
                2
              ),
            },
          ],
        };
      }

      case 'get_trades': {
        const { symbol, timestamp, limit = 10 } = args as {
          symbol: string;
          timestamp?: string;
          limit?: number;
        };

        if (!symbol || typeof symbol !== 'string') {
          throw new Error('Symbol is required and must be a string');
        }

        const upperSymbol = symbol.toUpperCase();

        // Build query parameters
        const params = new URLSearchParams();
        if (limit) params.append('limit', Math.min(limit, 50000).toString());

        // Determine the endpoint path
        let path: string;
        if (timestamp) {
          path = `/trades/${upperSymbol}/${timestamp}?${params.toString()}`;
        } else {
          path = `/trades/${upperSymbol}?${params.toString()}`;
        }

        const data = await polygonFetch<TradesResponse>(path);

        if (!data.results || data.results.length === 0) {
          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify(
                  {
                    message: 'No trades found for symbol',
                    symbol: upperSymbol,
                    timestamp,
                  },
                  null,
                  2
                ),
              },
            ],
          };
        }

        // Format the response
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(
                {
                  symbol: upperSymbol,
                  count: data.results.length,
                  trades: data.results.map((trade) => ({
                    timestamp: new Date(trade.t).toISOString(),
                    price: trade.p,
                    size: trade.s,
                    exchange: trade.x,
                    conditions: trade.c,
                    trade_id: trade.i,
                  })),
                },
                null,
                2
              ),
            },
          ],
        };
      }

      default:
        throw new Error(`Unknown tool: ${name}`);
    }
  } catch (error) {
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(
            {
              error: error instanceof Error ? error.message : 'Unknown error',
              tool: name,
              arguments: args,
            },
            null,
            2
          ),
        },
      ],
      isError: true,
    };
  }
});

/**
 * Start the server
 */
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('Polygon.io Market Data MCP Server running on stdio');
}

main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
