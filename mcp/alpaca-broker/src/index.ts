#!/usr/bin/env node

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  Tool,
} from "@modelcontextprotocol/sdk/types.js";
import axios, { AxiosInstance } from "axios";

// Types for Alpaca API responses
interface AlpacaAccount {
  id: string;
  account_number: string;
  status: string;
  crypto_status: string;
  currency: string;
  buying_power: string;
  regt_buying_power: string;
  daytrading_buying_power: string;
  non_marginable_buying_power: string;
  cash: string;
  portfolio_value: string;
  accumulated_profitloss: string;
  accumulated_profitloss_today: string;
  multiplier: string;
  initial_margin: string;
  maintenance_margin: string;
  last_equity: string;
  last_maintenance_margin: string;
  long_market_value: string;
  short_market_value: string;
  equity: string;
  created_at: string;
  updated_at: string;
  trade_suspended_by_user: boolean;
  trading_blocked: boolean;
  transfers_blocked: boolean;
  account_blocked: boolean;
  deleted_at: string | null;
  shorting_enabled: boolean;
  options_trading_level: number;
}

interface AlpacaPosition {
  asset_id: string;
  symbol: string;
  exchange: string;
  asset_class: string;
  asset_marginable: boolean;
  avg_entry_price: string;
  qty: string;
  side: string;
  market_value: string;
  cost_basis: string;
  unrealized_pl: string;
  unrealized_plpc: string;
  unrealized_intraday_pl: string;
  unrealized_intraday_plpc: string;
  current_price: string;
  lastday_price: string;
  change_today: string;
}

interface AlpacaOrder {
  id: string;
  client_order_id: string;
  created_at: string;
  updated_at: string;
  submitted_at: string;
  filled_at: string | null;
  expired_at: string | null;
  canceled_at: string | null;
  failed_at: string | null;
  replaced_at: string | null;
  replaced_by: string | null;
  replaces: string | null;
  asset_id: string;
  symbol: string;
  asset_class: string;
  notional: string | null;
  order_class: string;
  order_type: string;
  type: string;
  side: string;
  time_in_force: string;
  limit_price: string | null;
  stop_price: string | null;
  filled_qty: string;
  filled_avg_price: string | null;
  status: string;
  extended_hours: boolean;
  legs: any[] | null;
  trail_percent: string | null;
  trail_price: string | null;
  hwm: string | null;
  qty: string;
}

interface PlaceOrderParams {
  symbol: string;
  qty: number;
  side: "buy" | "sell";
  order_type: "market" | "limit" | "stop" | "stop_limit" | "trailing_stop";
  time_in_force: "day" | "gtc" | "opg" | "ioc" | "cls";
  limit_price?: number;
  stop_price?: number;
  trail_percent?: number;
  trail_price?: number;
}

interface PortfolioHistoryParams {
  period?: "1M" | "3M" | "6M" | "12M" | "1A" | "all";
  timeframe?: "1Min" | "5Min" | "15Min" | "1H" | "1D";
  date_end?: string; // YYYY-MM-DD
}

interface PortfolioHistory {
  timestamp: number[];
  equity: string[];
  profit_loss: string[];
  profit_loss_pct: string[];
  basis: string[];
  timeframe: string;
}

// Alpaca API Client
class AlpacaClient {
  private client: AxiosInstance;

  constructor() {
    const apiKey = process.env.ALPACA_API_KEY;
    const secretKey = process.env.ALPACA_SECRET_KEY;
    const baseUrl = process.env.ALPACA_BASE_URL || "https://paper-api.alpaca.markets";

    if (!apiKey || !secretKey) {
      throw new Error(
        "ALPACA_API_KEY and ALPACA_SECRET_KEY environment variables are required"
      );
    }

    // Verify paper trading URL
    if (!baseUrl.includes("paper-api")) {
      console.warn(
        "⚠️  WARNING: Using non-paper trading URL. This is highly discouraged for testing!"
      );
    }

    this.client = axios.create({
      baseURL: `${baseUrl}/v2`,
      auth: {
        username: apiKey,
        password: secretKey,
      },
      headers: {
        "Content-Type": "application/json",
      },
    });
  }

  async getAccount(): Promise<AlpacaAccount> {
    const response = await this.client.get<AlpacaAccount>("/account");
    return response.data;
  }

  async getPositions(): Promise<AlpacaPosition[]> {
    const response = await this.client.get<AlpacaPosition[]>("/positions");
    return response.data;
  }

  async placeOrder(params: PlaceOrderParams): Promise<AlpacaOrder> {
    const orderPayload: any = {
      symbol: params.symbol,
      qty: params.qty,
      side: params.side,
      type: params.order_type,
      time_in_force: params.time_in_force,
    };

    // Add optional parameters based on order type
    if (params.limit_price !== undefined) {
      orderPayload.limit_price = params.limit_price;
    }
    if (params.stop_price !== undefined) {
      orderPayload.stop_price = params.stop_price;
    }
    if (params.trail_percent !== undefined) {
      orderPayload.trail_percent = params.trail_percent;
    }
    if (params.trail_price !== undefined) {
      orderPayload.trail_price = params.trail_price;
    }

    const response = await this.client.post<AlpacaOrder>("/orders", orderPayload);
    return response.data;
  }

  async getOrder(orderId: string): Promise<AlpacaOrder> {
    const response = await this.client.get<AlpacaOrder>(`/orders/${orderId}`);
    return response.data;
  }

  async cancelOrder(orderId: string): Promise<void> {
    await this.client.delete(`/orders/${orderId}`);
  }

  async getPortfolioHistory(params?: PortfolioHistoryParams): Promise<PortfolioHistory> {
    const queryParams: any = {};
    if (params?.period) queryParams.period = params.period;
    if (params?.timeframe) queryParams.timeframe = params.timeframe;
    if (params?.date_end) queryParams.date_end = params.date_end;

    const response = await this.client.get<PortfolioHistory>("/account/portfolio/history", {
      params: queryParams,
    });
    return response.data;
  }
}

// Define MCP Tools
const TOOLS: Tool[] = [
  {
    name: "get_account",
    description:
      "Get detailed account information including buying power, portfolio value, cash, and margin status. Returns current account metrics for the paper trading account.",
    inputSchema: {
      type: "object",
      properties: {},
      required: [],
    },
  },
  {
    name: "get_positions",
    description:
      "List all currently open positions in the paper trading account. Returns position details including symbol, quantity, average entry price, current price, unrealized P&L, and percentage changes.",
    inputSchema: {
      type: "object",
      properties: {},
      required: [],
    },
  },
  {
    name: "place_order",
    description:
      "Submit a new order to the paper trading account. Supports market, limit, stop, stop-limit, and trailing stop orders. All orders are subject to paper trading rules and risk management.",
    inputSchema: {
      type: "object",
      properties: {
        symbol: {
          type: "string",
          description: "Stock or crypto symbol (e.g., 'AAPL', 'BTCUSD')",
        },
        qty: {
          type: "number",
          description: "Number of shares or crypto amount to trade",
        },
        side: {
          type: "string",
          enum: ["buy", "sell"],
          description: "Order side (buy or sell)",
        },
        order_type: {
          type: "string",
          enum: ["market", "limit", "stop", "stop_limit", "trailing_stop"],
          description: "Order type",
        },
        time_in_force: {
          type: "string",
          enum: ["day", "gtc", "opg", "ioc", "cls"],
          description:
            "Time in force: day (valid for rest of day), gtc (good until cancelled), opg (market open), ioc (immediate or cancel), cls (market close)",
        },
        limit_price: {
          type: "number",
          description: "Limit price (required for limit and stop_limit orders)",
        },
        stop_price: {
          type: "number",
          description: "Stop price (required for stop and stop_limit orders)",
        },
        trail_percent: {
          type: "number",
          description: "Trail percent for trailing stop orders (e.g., 1.5 for 1.5%)",
        },
        trail_price: {
          type: "number",
          description: "Trail price offset for trailing stop orders",
        },
      },
      required: ["symbol", "qty", "side", "order_type", "time_in_force"],
    },
  },
  {
    name: "cancel_order",
    description:
      "Cancel a pending order in the paper trading account. Only works for orders that have not been filled or expired.",
    inputSchema: {
      type: "object",
      properties: {
        order_id: {
          type: "string",
          description: "The Alpaca order ID to cancel",
        },
      },
      required: ["order_id"],
    },
  },
  {
    name: "get_order",
    description:
      "Get detailed information about a specific order including its status, fill details, timestamps, and execution information.",
    inputSchema: {
      type: "object",
      properties: {
        order_id: {
          type: "string",
          description: "The Alpaca order ID to look up",
        },
      },
      required: ["order_id"],
    },
  },
  {
    name: "get_portfolio_history",
    description:
      "Get historical portfolio performance data including equity curves, profit/loss, and P&L percentage over time. Useful for analyzing paper trading performance.",
    inputSchema: {
      type: "object",
      properties: {
        period: {
          type: "string",
          enum: ["1M", "3M", "6M", "12M", "1A", "all"],
          description:
            "Time period for history: 1M (1 month), 3M (3 months), 6M (6 months), 12M (12 months), 1A (1 year), all (all available)",
        },
        timeframe: {
          type: "string",
          enum: ["1Min", "5Min", "15Min", "1H", "1D"],
          description:
            "Resolution of data points: 1Min, 5Min, 15Min, 1H (1 hour), 1D (1 day)",
        },
        date_end: {
          type: "string",
          description: "End date in YYYY-MM-DD format (optional)",
        },
      },
      required: [],
    },
  },
];

// Helper to format currency
function formatCurrency(value: string): string {
  const num = parseFloat(value);
  if (isNaN(num)) return value;
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(num);
}

// Helper to format percentage
function formatPercentage(value: string): string {
  const num = parseFloat(value);
  if (isNaN(num)) return value;
  const sign = num >= 0 ? "+" : "";
  return `${sign}${num.toFixed(2)}%`;
}

// MCP Server Setup
async function main() {
  let alpacaClient: AlpacaClient;

  try {
    alpacaClient = new AlpacaClient();
    console.error("✅ Alpaca MCP server initialized with paper trading credentials");
  } catch (error) {
    console.error("❌ Failed to initialize Alpaca client:", error);
    process.exit(1);
  }

  const server = new Server(
    {
      name: "@omnitrade/mcp-alpaca-broker",
      version: "1.0.0",
    },
    {
      capabilities: {
        tools: {},
      },
    }
  );

  // List available tools
  server.setRequestHandler(ListToolsRequestSchema, async () => {
    return { tools: TOOLS };
  });

  // Handle tool calls
  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;

    if (!args) {
      throw new Error("No arguments provided");
    }

    try {
      let result: any;

      switch (name) {
        case "get_account": {
          const account = await alpacaClient.getAccount();
          result = {
            success: true,
            account: {
              id: account.account_number,
              status: account.status,
              buying_power: formatCurrency(account.buying_power),
              cash: formatCurrency(account.cash),
              portfolio_value: formatCurrency(account.portfolio_value),
              equity: formatCurrency(account.equity),
              last_equity: formatCurrency(account.last_equity),
              accumulated_profitloss: formatCurrency(account.accumulated_profitloss),
              accumulated_profitloss_today: formatCurrency(account.accumulated_profitloss_today),
              long_market_value: formatCurrency(account.long_market_value),
              short_market_value: formatCurrency(account.short_market_value),
              multiplier: account.multiplier,
              trading_blocked: account.trading_blocked,
              account_blocked: account.account_blocked,
              created_at: account.created_at,
              updated_at: account.updated_at,
            },
          };
          break;
        }

        case "get_positions": {
          const positions = await alpacaClient.getPositions();
          if (positions.length === 0) {
            result = {
              success: true,
              message: "No open positions",
              positions: [],
            };
          } else {
            result = {
              success: true,
              count: positions.length,
              positions: positions.map((pos) => ({
                symbol: pos.symbol,
                side: pos.side,
                qty: pos.qty,
                avg_entry_price: formatCurrency(pos.avg_entry_price),
                current_price: formatCurrency(pos.current_price),
                market_value: formatCurrency(pos.market_value),
                cost_basis: formatCurrency(pos.cost_basis),
                unrealized_pl: formatCurrency(pos.unrealized_pl),
                unrealized_pl_pct: formatPercentage(pos.unrealized_plpc),
                unrealized_intraday_pl: formatCurrency(pos.unrealized_intraday_pl),
                unrealized_intraday_pl_pct: formatPercentage(pos.unrealized_intraday_plpc),
                change_today: formatPercentage(pos.change_today),
                exchange: pos.exchange,
              })),
            };
          }
          break;
        }

        case "place_order": {
          const orderParams: PlaceOrderParams = {
            symbol: args.symbol as string,
            qty: args.qty as number,
            side: args.side as "buy" | "sell",
            order_type: args.order_type as any,
            time_in_force: args.time_in_force as any,
          };

          if (args.limit_price !== undefined) {
            orderParams.limit_price = args.limit_price as number;
          }
          if (args.stop_price !== undefined) {
            orderParams.stop_price = args.stop_price as number;
          }
          if (args.trail_percent !== undefined) {
            orderParams.trail_percent = args.trail_percent as number;
          }
          if (args.trail_price !== undefined) {
            orderParams.trail_price = args.trail_price as number;
          }

          // Validate order type requirements
          if (orderParams.order_type === "limit" || orderParams.order_type === "stop_limit") {
            if (!orderParams.limit_price) {
              throw new Error("limit_price is required for limit and stop_limit orders");
            }
          }
          if (orderParams.order_type === "stop" || orderParams.order_type === "stop_limit") {
            if (!orderParams.stop_price) {
              throw new Error("stop_price is required for stop and stop_limit orders");
            }
          }
          if (orderParams.order_type === "trailing_stop") {
            if (!orderParams.trail_percent && !orderParams.trail_price) {
              throw new Error("trail_percent or trail_price is required for trailing stop orders");
            }
          }

          const order = await alpacaClient.placeOrder(orderParams);
          result = {
            success: true,
            order: {
              id: order.id,
              client_order_id: order.client_order_id,
              symbol: order.symbol,
              side: order.side,
              type: order.order_type,
              qty: order.qty,
              status: order.status,
              created_at: order.created_at,
              limit_price: order.limit_price ? formatCurrency(order.limit_price) : null,
              stop_price: order.stop_price ? formatCurrency(order.stop_price) : null,
              filled_qty: order.filled_qty,
              filled_avg_price: order.filled_avg_price
                ? formatCurrency(order.filled_avg_price)
                : null,
            },
          };
          break;
        }

        case "cancel_order": {
          await alpacaClient.cancelOrder(args.order_id as string);
          result = {
            success: true,
            message: `Order ${args.order_id} has been cancelled`,
          };
          break;
        }

        case "get_order": {
          const order = await alpacaClient.getOrder(args.order_id as string);
          result = {
            success: true,
            order: {
              id: order.id,
              client_order_id: order.client_order_id,
              symbol: order.symbol,
              side: order.side,
              type: order.order_type,
              qty: order.qty,
              status: order.status,
              created_at: order.created_at,
              submitted_at: order.submitted_at,
              filled_at: order.filled_at,
              canceled_at: order.canceled_at,
              limit_price: order.limit_price ? formatCurrency(order.limit_price) : null,
              stop_price: order.stop_price ? formatCurrency(order.stop_price) : null,
              filled_qty: order.filled_qty,
              filled_avg_price: order.filled_avg_price
                ? formatCurrency(order.filled_avg_price)
                : null,
            },
          };
          break;
        }

        case "get_portfolio_history": {
          const params: PortfolioHistoryParams = {};
          if (args.period) params.period = args.period as any;
          if (args.timeframe) params.timeframe = args.timeframe as any;
          if (args.date_end) params.date_end = args.date_end as string;

          const history = await alpacaClient.getPortfolioHistory(params);

          // Calculate some summary statistics
          const equityValues = history.equity.map(e => parseFloat(e));
          const profitLossValues = history.profit_loss.map(p => parseFloat(p));
          const startEquity = equityValues[0];
          const endEquity = equityValues[equityValues.length - 1];
          const totalReturn = ((endEquity - startEquity) / startEquity) * 100;

          result = {
            success: true,
            summary: {
              timeframe: history.timeframe,
              data_points: history.timestamp.length,
              start_equity: formatCurrency(startEquity.toString()),
              end_equity: formatCurrency(endEquity.toString()),
              total_profit_loss: formatCurrency(String(profitLossValues[profitLossValues.length - 1])),
              total_return_pct: formatPercentage(totalReturn.toString()),
            },
            history: {
              timestamps: history.timestamp,
              equity: history.equity,
              profit_loss: history.profit_loss,
              profit_loss_pct: history.profit_loss_pct,
            },
          };
          break;
        }

        default:
          throw new Error(`Unknown tool: ${name}`);
      }

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(result, null, 2),
          },
        ],
      };
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const errorMsg = error.response?.data?.message || error.message;
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(
                {
                  success: false,
                  error: errorMsg,
                  status: error.response?.status,
                  details: error.response?.data,
                },
                null,
                2
              ),
            },
          ],
          isError: true,
        };
      }

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(
              {
                success: false,
                error: error instanceof Error ? error.message : String(error),
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

  // Start server
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("🚀 Alpaca MCP server running on stdio");
}

main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
