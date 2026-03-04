#!/usr/bin/env node

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  Tool,
} from "@modelcontextprotocol/sdk/types.js";
import axios from "axios";
import * as cheerio from "cheerio";
import dotenv from "dotenv";

dotenv.config();

// Types
interface NewsHeadline {
  title: string;
  description: string;
  url: string;
  source: string;
  publishedAt: string;
  sentiment?: "positive" | "negative" | "neutral";
}

interface SentimentAnalysis {
  symbol: string;
  days: number;
  articleCount: number;
  averageScore: number;
  sentiment: "bullish" | "bearish" | "neutral";
  breakdown: {
    positive: number;
    negative: number;
    neutral: number;
  };
  recentHeadlines: NewsHeadline[];
}

interface AnalystRating {
  symbol: string;
  date: string;
  firm: string;
  action: "upgrade" | "downgrade" | "initiated" | "reiterated";
  fromRating?: string;
  toRating: string;
  priceTarget?: number;
}

interface EarningsEvent {
  symbol: string;
  company: string;
  date: string;
  estimatedEPS?: number;
  estimatedRevenue?: number;
  fiscalQuarterEnding?: string;
}

// API Configuration
const NEWS_API_KEY = process.env.NEWS_API_KEY || "";
const ALPHA_VANTAGE_API_KEY = process.env.ALPHA_VANTAGE_API_KEY || "";
const USER_AGENT = "OmniTrade-MCP/1.0";

// Utility: Simple sentiment analysis based on keywords
function analyzeSentiment(text: string): "positive" | "negative" | "neutral" {
  const lowerText = text.toLowerCase();

  const positiveWords = [
    "surge", "rally", "gain", "growth", "profit", "beat", "strong", "bullish",
    "upgrade", "outperform", "buy", "rises", "soars", "jumps", "advances",
    "record", "breakthrough", "expansion", "dividend", "momentum"
  ];

  const negativeWords = [
    "plunge", "fall", "drop", "loss", "miss", "weak", "bearish", "downgrade",
    "sell", "declines", "slumps", "tumbles", "cuts", "layoff", "concern",
    "risk", "warning", "recession", "inflation", "debt", "lawsuit"
  ];

  let positiveCount = 0;
  let negativeCount = 0;

  positiveWords.forEach(word => {
    if (lowerText.includes(word)) positiveCount++;
  });

  negativeWords.forEach(word => {
    if (lowerText.includes(word)) negativeCount++;
  });

  if (positiveCount > negativeCount) return "positive";
  if (negativeCount > positiveCount) return "negative";
  return "neutral";
}

// API Client: NewsAPI.org
async function fetchNewsAPI(
  query: string,
  from?: string,
  to?: string,
  pageSize = 10
): Promise<NewsHeadline[]> {
  if (!NEWS_API_KEY) {
    throw new Error("NEWS_API_KEY environment variable not set");
  }

  try {
    const params: Record<string, string> = {
      apiKey: NEWS_API_KEY,
      q: query,
      pageSize: pageSize.toString(),
      language: "en",
      sortBy: "publishedAt",
    };

    if (from) params.from = from;
    if (to) params.to = to;

    const response = await axios.get("https://newsapi.org/v2/everything", {
      params,
      headers: {
        "User-Agent": USER_AGENT,
      },
      timeout: 10000,
    });

    if (response.data.status === "error") {
      throw new Error(`NewsAPI error: ${response.data.message}`);
    }

    return response.data.articles.map((article: any) => ({
      title: article.title || "No title",
      description: article.description || "",
      url: article.url,
      source: article.source?.name || "Unknown",
      publishedAt: article.publishedAt,
      sentiment: analyzeSentiment(
        `${article.title || ""} ${article.description || ""}`
      ),
    }));
  } catch (error: any) {
    if (axios.isAxiosError(error)) {
      throw new Error(`NewsAPI request failed: ${error.message}`);
    }
    throw error;
  }
}

// API Client: Alpha Vantage News
async function fetchAlphaVantageNews(
  tickers: string,
  limit = 10
): Promise<NewsHeadline[]> {
  if (!ALPHA_VANTAGE_API_KEY) {
    throw new Error("ALPHA_VANTAGE_API_KEY environment variable not set");
  }

  try {
    const response = await axios.get(
      "https://www.alphavantage.co/query",
      {
        params: {
          function: "NEWS_SENTIMENT",
          tickers: tickers,
          limit: limit.toString(),
          apikey: ALPHA_VANTAGE_API_KEY,
        },
        timeout: 10000,
      }
    );

    if (response.data["Error Message"]) {
      throw new Error("Alpha Vantage API error");
    }

    if (!response.data.feed) {
      return [];
    }

    return response.data.feed.slice(0, limit).map((article: any) => ({
      title: article.title,
      description: article.summary || "",
      url: article.url,
      source: article.source,
      publishedAt: article.time_published,
      sentiment:
        article.overall_sentiment_score > 0.35
          ? "positive"
          : article.overall_sentiment_score < -0.35
          ? "negative"
          : "neutral",
    }));
  } catch (error: any) {
    if (axios.isAxiosError(error)) {
      throw new Error(`Alpha Vantage request failed: ${error.message}`);
    }
    throw error;
  }
}

// Fallback: Yahoo Finance scraping (for analyst ratings and earnings)
async function scrapeYahooFinanceAnalystRatings(
  symbol: string
): Promise<AnalystRating[]> {
  try {
    const url = `https://finance.yahoo.com/quote/${symbol}/analysts`;
    const response = await axios.get(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
      },
      timeout: 10000,
    });

    const $ = cheerio.load(response.data);
    const ratings: AnalystRating[] = [];

    // This is a simplified scraping approach
    // In production, you'd need more sophisticated parsing
    $(".analyst-row").each((_, element) => {
      const firm = $(element).find(".firm").text().trim();
      const action = $(element).find(".action").text().trim().toLowerCase();
      const rating = $(element).find(".rating").text().trim();
      const date = $(element).find(".date").text().trim();

      if (firm && rating) {
        ratings.push({
          symbol,
          date,
          firm,
          action: action.includes("upgrade")
            ? "upgrade"
            : action.includes("downgrade")
            ? "downgrade"
            : "reiterated",
          toRating: rating,
        });
      }
    });

    return ratings;
  } catch (error: any) {
    // Return empty array on scraping failure
    return [];
  }
}

// Fallback: Yahoo Finance earnings calendar
async function scrapeYahooFinanceEarnings(
  symbol: string
): Promise<EarningsEvent[]> {
  try {
    const url = `https://finance.yahoo.com/quote/${symbol}/calendar`;
    const response = await axios.get(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
      },
      timeout: 10000,
    });

    const $ = cheerio.load(response.data);
    const events: EarningsEvent[] = [];

    $(".earnings-row").each((_, element) => {
      const date = $(element).find(".date").text().trim();
      const eps = $(element).find(".eps").text().trim();

      if (date) {
        events.push({
          symbol,
          company: symbol,
          date,
          estimatedEPS: eps ? parseFloat(eps) : undefined,
        });
      }
    });

    return events;
  } catch (error: any) {
    return [];
  }
}

// Calculate date range for queries
function getDateRange(days: number): { from: string; to: string } {
  const to = new Date().toISOString().split("T")[0];
  const from = new Date(Date.now() - days * 24 * 60 * 60 * 1000)
    .toISOString()
    .split("T")[0];
  return { from, to };
}

// MCP Server Setup
const server = new Server(
  {
    name: "financial-news-mcp-server",
    version: "1.0.0",
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// Tool Definitions
const tools: Tool[] = [
  {
    name: "get_news_headlines",
    description:
      "Get recent news headlines for a specific stock symbol or company. Returns title, description, source, and publication date with sentiment analysis.",
    inputSchema: {
      type: "object",
      properties: {
        symbol: {
          type: "string",
          description:
            "Stock symbol (e.g., AAPL, GOOGL) or company name to search for",
        },
        limit: {
          type: "number",
          description: "Maximum number of headlines to return (default: 10)",
          default: 10,
        },
      },
      required: ["symbol"],
    },
  },
  {
    name: "get_news_sentiment",
    description:
      "Get aggregate sentiment analysis for a symbol based on recent news articles. Returns overall sentiment score and classification (bullish/bearish/neutral).",
    inputSchema: {
      type: "object",
      properties: {
        symbol: {
          type: "string",
          description:
            "Stock symbol (e.g., AAPL, GOOGL) or company name to analyze",
        },
        days: {
          type: "number",
          description:
            "Number of days to look back for news (default: 7, max: 30)",
          default: 7,
        },
      },
      required: ["symbol"],
    },
  },
  {
    name: "search_news",
    description:
      "Search for general financial news using a custom query. Useful for market trends, sector analysis, or broader financial topics.",
    inputSchema: {
      type: "object",
      properties: {
        query: {
          type: "string",
          description:
            "Search query (e.g., 'technology stocks', 'inflation', 'Fed rate hike')",
        },
        limit: {
          type: "number",
          description: "Maximum number of articles to return (default: 10)",
          default: 10,
        },
      },
      required: ["query"],
    },
  },
  {
    name: "get_analyst_ratings",
    description:
      "Get recent analyst ratings, upgrades, and downgrades for a specific symbol. Includes firm name, rating change, and price targets when available.",
    inputSchema: {
      type: "object",
      properties: {
        symbol: {
          type: "string",
          description: "Stock symbol (e.g., AAPL, GOOGL)",
        },
      },
      required: ["symbol"],
    },
  },
  {
    name: "get_earnings_calendar",
    description:
      "Get upcoming earnings dates and estimates for a specific symbol. Includes estimated EPS and fiscal quarter information when available.",
    inputSchema: {
      type: "object",
      properties: {
        symbol: {
          type: "string",
          description: "Stock symbol (e.g., AAPL, GOOGL)",
        },
      },
      required: ["symbol"],
    },
  },
];

// Register tools
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return { tools };
});

// Handle tool calls
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    switch (name) {
      case "get_news_headlines": {
        const symbol = args?.symbol as string;
        const limit = (args?.limit as number) || 10;

        if (!symbol) {
          throw new Error("Symbol is required");
        }

        // Try Alpha Vantage first (better for stock-specific news)
        let headlines: NewsHeadline[] = [];

        try {
          headlines = await fetchAlphaVantageNews(symbol, limit);
        } catch (error) {
          // Fallback to NewsAPI
          const { from, to } = getDateRange(7);
          headlines = await fetchNewsAPI(symbol, from, to, limit);
        }

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(headlines, null, 2),
            },
          ],
        };
      }

      case "get_news_sentiment": {
        const symbol = args?.symbol as string;
        const days = Math.min((args?.days as number) || 7, 30);

        if (!symbol) {
          throw new Error("Symbol is required");
        }

        const { from, to } = getDateRange(days);
        const headlines = await fetchNewsAPI(symbol, from, to, 100);

        let positive = 0;
        let negative = 0;
        let neutral = 0;

        headlines.forEach((headline) => {
          if (headline.sentiment === "positive") positive++;
          else if (headline.sentiment === "negative") negative++;
          else neutral++;
        });

        const total = headlines.length;
        const averageScore =
          total > 0 ? (positive - negative) / total : 0;

        const sentiment: "bullish" | "bearish" | "neutral" =
          averageScore > 0.2
            ? "bullish"
            : averageScore < -0.2
            ? "bearish"
            : "neutral";

        const analysis: SentimentAnalysis = {
          symbol,
          days,
          articleCount: total,
          averageScore: Math.round(averageScore * 100) / 100,
          sentiment,
          breakdown: {
            positive,
            negative,
            neutral,
          },
          recentHeadlines: headlines.slice(0, 10),
        };

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(analysis, null, 2),
            },
          ],
        };
      }

      case "search_news": {
        const query = args?.query as string;
        const limit = (args?.limit as number) || 10;

        if (!query) {
          throw new Error("Query is required");
        }

        const { from, to } = getDateRange(7);
        const headlines = await fetchNewsAPI(query, from, to, limit);

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(headlines, null, 2),
            },
          ],
        };
      }

      case "get_analyst_ratings": {
        const symbol = args?.symbol as string;

        if (!symbol) {
          throw new Error("Symbol is required");
        }

        // Note: This is a placeholder implementation
        // Real analyst ratings would require a paid API or more sophisticated scraping
        const ratings = await scrapeYahooFinanceAnalystRatings(symbol);

        // If scraping fails, return mock data to demonstrate format
        const result =
          ratings.length > 0
            ? ratings
            : [
                {
                  symbol,
                  date: new Date().toISOString().split("T")[0],
                  firm: "Sample Analyst Firm",
                  action: "reiterated" as const,
                  toRating: "Buy",
                  note: "Note: This is placeholder data. Configure a paid analyst ratings API for real-time data.",
                },
              ];

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      }

      case "get_earnings_calendar": {
        const symbol = args?.symbol as string;

        if (!symbol) {
          throw new Error("Symbol is required");
        }

        // Note: This is a placeholder implementation
        // Real earnings data would require a paid API or more sophisticated scraping
        const events = await scrapeYahooFinanceEarnings(symbol);

        // If scraping fails, return mock data to demonstrate format
        const result =
          events.length > 0
            ? events
            : [
                {
                  symbol,
                  company: symbol,
                  date: new Date(
                    Date.now() + 14 * 24 * 60 * 60 * 1000
                  )
                    .toISOString()
                    .split("T")[0],
                  estimatedEPS: 1.25,
                  note: "Note: This is placeholder data. Configure a paid earnings API for real-time data.",
                },
              ];

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      }

      default:
        throw new Error(`Unknown tool: ${name}`);
    }
  } catch (error: any) {
    return {
      content: [
        {
          type: "text",
          text: JSON.stringify({
            error: error.message || "Unknown error occurred",
            tool: name,
            arguments: args,
          }),
        },
      ],
      isError: true,
    };
  }
});

// Start server
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);

  console.error("Financial News MCP server running on stdio");
}

main().catch((error) => {
  console.error("Server error:", error);
  process.exit(1);
});
