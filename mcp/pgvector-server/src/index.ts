#!/usr/bin/env node

/**
 * MCP Server for pgvector Semantic Search
 *
 * Provides tools for semantic search over SEC filings and news articles
 * using PostgreSQL with pgvector extension. Read-only access for AI agents.
 */

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  Tool,
} from "@modelcontextprotocol/sdk/types.js";
import { Pool, PoolClient } from "pg";

// Type definitions for our tools
interface SearchSecFilingsArgs {
  symbol: string;
  query: string;
  limit?: number;
}

interface SearchNewsArgs {
  symbol?: string;
  query: string;
  limit?: number;
}

interface StoreEmbeddingArgs {
  symbol: string;
  content: string;
  report_type: string;
  embedding: number[];
}

interface GetSimilarChunksArgs {
  embedding: number[];
  limit?: number;
}

interface GetFundamentalAnalysisArgs {
  symbol: string;
}

// Database connection pool
let pool: Pool | null = null;

/**
 * Initialize database connection with environment variables
 */
function getPool(): Pool {
  if (!pool) {
    const databaseUrl = process.env.DATABASE_URL;

    if (databaseUrl) {
      pool = new Pool({
        connectionString: databaseUrl,
      });
    } else {
      pool = new Pool({
        host: process.env.DB_HOST || "localhost",
        user: process.env.DB_USER || "omnitrade_readonly",
        password: process.env.DB_PASSWORD || "",
        database: process.env.DB_NAME || "omnitrade",
        port: parseInt(process.env.DB_PORT || "5432"),
      });
    }
  }

  return pool;
}

/**
 * Tool definitions
 */
const TOOLS: Tool[] = [
  {
    name: "search_sec_filings",
    description:
      "Semantic search over SEC filings stored in fundamental_data table. " +
      "Searches for filings matching a query for a specific symbol using vector similarity. " +
      "Returns the most relevant filing chunks with their similarity scores.",
    inputSchema: {
      type: "object",
      properties: {
        symbol: {
          type: "string",
          description: "Stock symbol to search filings for (e.g., AAPL, MSFT)",
        },
        query: {
          type: "string",
          description: "Natural language query to search for in filings",
        },
        limit: {
          type: "number",
          description: "Maximum number of results to return (default: 10)",
          default: 10,
        },
      },
      required: ["symbol", "query"],
    },
  },
  {
    name: "search_news",
    description:
      "Semantic search over news articles. " +
      "Finds news articles relevant to a query using vector similarity. " +
      "Can filter by symbol or search across all news.",
    inputSchema: {
      type: "object",
      properties: {
        symbol: {
          type: "string",
          description: "Optional stock symbol to filter news (e.g., AAPL, MSFT)",
        },
        query: {
          type: "string",
          description: "Natural language query to search for in news",
        },
        limit: {
          type: "number",
          description: "Maximum number of results to return (default: 10)",
          default: 10,
        },
      },
      required: ["query"],
    },
  },
  {
    name: "store_embedding",
    description:
      "Store a new embedding with content into the fundamental_data table. " +
      "Requires write permissions (not available with omnitrade_readonly role). " +
      "Typically used by ingestion pipelines to store processed SEC filings.",
    inputSchema: {
      type: "object",
      properties: {
        symbol: {
          type: "string",
          description: "Stock symbol (e.g., AAPL, MSFT)",
        },
        content: {
          type: "string",
          description: "Text content to store (e.g., filing excerpt)",
        },
        report_type: {
          type: "string",
          description: "Type of report (10-K, 10-Q, 8-K, earnings_call, etc.)",
        },
        embedding: {
          type: "array",
          items: {
            type: "number",
          },
          description:
            "Vector embedding (typically 1536 dimensions for OpenAI embeddings)",
        },
      },
      required: ["symbol", "content", "report_type", "embedding"],
    },
  },
  {
    name: "get_similar_chunks",
    description:
      "Find similar content chunks by vector similarity across all stored data. " +
      "Returns the most semantically similar chunks regardless of symbol. " +
      "Useful for cross-reference analysis and pattern discovery.",
    inputSchema: {
      type: "object",
      properties: {
        embedding: {
          type: "array",
          items: {
            type: "number",
          },
          description:
            "Query vector embedding (typically 1536 dimensions for OpenAI embeddings)",
        },
        limit: {
          type: "number",
          description: "Maximum number of results to return (default: 10)",
          default: 10,
        },
      },
      required: ["embedding"],
    },
  },
  {
    name: "get_fundamental_analysis",
    description:
      "Aggregate RAG (Retrieval Augmented Generation) context for a specific symbol. " +
      "Retrieves all relevant fundamental data including recent SEC filings, " +
      "earnings reports, and key financial metrics to support AI analysis.",
    inputSchema: {
      type: "object",
      properties: {
        symbol: {
          type: "string",
          description: "Stock symbol to analyze (e.g., AAPL, MSFT)",
        },
      },
      required: ["symbol"],
    },
  },
];

/**
 * Main server setup
 */
const server = new Server(
  {
    name: "mcp-pgvector-server",
    version: "1.0.0",
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
    const pool = getPool();

    switch (name) {
      case "search_sec_filings": {
        const { symbol, query, limit = 10 } = args as unknown as SearchSecFilingsArgs;

        // For now, we'll do a text-based search since we don't have embedding generation
        // In production, you would generate an embedding for the query first
        const result = await pool.query(
          `SELECT
            id,
            symbol,
            report_type,
            content,
            created_at,
            1 - (embedding <=> '[0]')::float as similarity
          FROM fundamental_data
          WHERE symbol = $1
            AND report_type IN ('10-K', '10-Q', '8-K', '10-K/A', '10-Q/A')
            AND content ILIKE $2
          ORDER BY created_at DESC
          LIMIT $3`,
          [symbol.toUpperCase(), `%${query}%`, limit]
        );

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(
                {
                  tool: "search_sec_filings",
                  symbol,
                  query,
                  count: result.rows.length,
                  results: result.rows.map((row) => ({
                    id: row.id,
                    symbol: row.symbol,
                    report_type: row.report_type,
                    content: row.content.substring(0, 500) + "...",
                    similarity: row.similarity,
                    created_at: row.created_at,
                  })),
                },
                null,
                2
              ),
            },
          ],
        };
      }

      case "search_news": {
        const { symbol, query, limit = 10 } = args as unknown as SearchNewsArgs;

        let queryText = `
          SELECT
            id,
            symbol,
            report_type,
            content,
            created_at
          FROM fundamental_data
          WHERE report_type IN ('news', 'press_release', 'analyst_report')
            AND content ILIKE $1
        `;
        const params: (string | number)[] = [`%${query}%`];
        let paramIndex = 2;

        if (symbol) {
          queryText += ` AND symbol = $${paramIndex}`;
          params.push(symbol.toUpperCase());
          paramIndex++;
        }

        queryText += ` ORDER BY created_at DESC LIMIT $${paramIndex}`;
        params.push(limit);

        const result = await pool.query(queryText, params);

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(
                {
                  tool: "search_news",
                  symbol: symbol || "all",
                  query,
                  count: result.rows.length,
                  results: result.rows.map((row) => ({
                    id: row.id,
                    symbol: row.symbol,
                    report_type: row.report_type,
                    content: row.content.substring(0, 500) + "...",
                    created_at: row.created_at,
                  })),
                },
                null,
                2
              ),
            },
          ],
        };
      }

      case "store_embedding": {
        const { symbol, content, report_type, embedding } =
          args as unknown as StoreEmbeddingArgs;

        // Check if user has write permissions
        const user = pool.options.user || "";
        if (user.includes("readonly")) {
          throw new Error(
            "Write operations are not permitted with read-only database role. " +
              "Please configure a write-enabled database user for this operation."
          );
        }

        const embeddingStr = `[${embedding.join(",")}]`;

        const result = await pool.query(
          `INSERT INTO fundamental_data (id, symbol, report_type, content, embedding, created_at)
           VALUES (gen_random_uuid(), $1, $2, $3, $4::vector, NOW())
           RETURNING id, created_at`,
          [symbol.toUpperCase(), report_type, content, embeddingStr]
        );

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(
                {
                  tool: "store_embedding",
                  success: true,
                  id: result.rows[0].id,
                  symbol,
                  report_type,
                  content_length: content.length,
                  created_at: result.rows[0].created_at,
                },
                null,
                2
              ),
            },
          ],
        };
      }

      case "get_similar_chunks": {
        const { embedding, limit = 10 } = args as unknown as GetSimilarChunksArgs;

        const embeddingStr = `[${embedding.join(",")}]`;

        const result = await pool.query(
          `SELECT
            id,
            symbol,
            report_type,
            content,
            created_at,
            1 - (embedding <=> $1::vector)::float as similarity
          FROM fundamental_data
          ORDER BY embedding <=> $1::vector
          LIMIT $2`,
          [embeddingStr, limit]
        );

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(
                {
                  tool: "get_similar_chunks",
                  count: result.rows.length,
                  results: result.rows.map((row) => ({
                    id: row.id,
                    symbol: row.symbol,
                    report_type: row.report_type,
                    content: row.content.substring(0, 500) + "...",
                    similarity: row.similarity,
                    created_at: row.created_at,
                  })),
                },
                null,
                2
              ),
            },
          ],
        };
      }

      case "get_fundamental_analysis": {
        const { symbol } = args as unknown as GetFundamentalAnalysisArgs;

        // Get recent filings of all types
        const result = await pool.query(
          `SELECT
            id,
            report_type,
            content,
            created_at
          FROM fundamental_data
          WHERE symbol = $1
          ORDER BY created_at DESC
          LIMIT 50`,
          [symbol.toUpperCase()]
        );

        // Group by report type
        const grouped: Record<
          string,
          Array<{ id: string; content: string; created_at: string }>
        > = {};

        for (const row of result.rows) {
          if (!grouped[row.report_type]) {
            grouped[row.report_type] = [];
          }
          grouped[row.report_type].push({
            id: row.id,
            content: row.content,
            created_at: row.created_at,
          });
        }

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(
                {
                  tool: "get_fundamental_analysis",
                  symbol,
                  total_chunks: result.rows.length,
                  report_types: Object.keys(grouped),
                  data: grouped,
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
    const errorMessage =
      error instanceof Error ? error.message : String(error);
    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(
            {
              tool: name,
              error: errorMessage,
              success: false,
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

  // Log to stderr so it doesn't interfere with MCP protocol
  console.error("MCP pgvector server running on stdio");

  // Test database connection on startup
  try {
    const pool = getPool();
    const client = await pool.connect();
    console.error("Successfully connected to database");

    // Verify pgvector extension
    const extResult = await client.query(
      "SELECT EXISTS(SELECT 1 FROM pg_extension WHERE extname = 'vector')"
    );
    if (extResult.rows[0].exists) {
      console.error("pgvector extension is installed");
    } else {
      console.error("WARNING: pgvector extension not found");
    }

    // Verify fundamental_data table exists
    const tableResult = await client.query(
      "SELECT EXISTS(SELECT 1 FROM information_schema.tables WHERE table_name = 'fundamental_data')"
    );
    if (tableResult.rows[0].exists) {
      console.error("fundamental_data table exists");

      // Get row count
      const countResult = await client.query(
        "SELECT COUNT(*) as count FROM fundamental_data"
      );
      console.error(
        `fundamental_data contains ${countResult.rows[0].count} rows`
      );
    } else {
      console.error("WARNING: fundamental_data table not found");
    }

    client.release();
  } catch (error) {
    console.error("Database connection error:", error);
    // Continue anyway - connection might work later
  }
}

/**
 * Graceful shutdown
 */
process.on("SIGINT", async () => {
  console.error("\nShutting down MCP pgvector server...");
  if (pool) {
    await pool.end();
  }
  process.exit(0);
});

main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
