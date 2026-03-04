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

// Load environment variables
dotenv.config();

// Configuration
const USER_AGENT = process.env.USER_AGENT || "OmniTrade admin@example.com";
const SEC_BASE_URL = process.env.SEC_BASE_URL || "https://www.sec.gov";
const CIK_LOOKUP_URL = `${SEC_BASE_URL}/files/edgar/data/company-ciks.json`;
const SUBMISSIONS_URL = (cik: string) =>
  `${SEC_BASE_URL}/edgar/data/${cik}/index.json`;

// File type mappings
const FILING_TYPES: Record<string, string[]> = {
  "10-K": ["10-K", "10-K405", "10-KT", "10-K405T"],
  "10-Q": ["10-Q", "10-QT"],
  "8-K": ["8-K"],
  "DEF 14A": ["DEF 14A", "DEF 14A5"],
  "S-1": ["S-1", "S-1/A", "S-1ME"],
  "13F": ["13F-HR", "13F-NT"],
};

// SEC EDGAR API client with proper headers
const secClient = axios.create({
  baseURL: SEC_BASE_URL,
  headers: {
    "User-Agent": USER_AGENT,
    "Accept-Encoding": "gzip, deflate",
    "Accept": "application/json",
  },
  timeout: 30000,
});

/**
 * Convert ticker symbol to CIK (Central Index Key)
 */
async function getCIK(symbol: string): Promise<string | null> {
  try {
    const response = await secClient.get(CIK_LOOKUP_URL);
    const data = response.data;

    // Search case-insensitively
    const ticker = symbol.toUpperCase().trim();
    for (const [cik, tickerData] of Object.entries(data)) {
      if (
        tickerData &&
        typeof tickerData === "object" &&
        "ticker" in tickerData
      ) {
        const tickerValue = (tickerData as { ticker: string }).ticker;
        if (typeof tickerValue === "string" && tickerValue.toUpperCase() === ticker) {
          return cik;
        }
      }
    }
    return null;
  } catch (error) {
    console.error(`Error fetching CIK for ${symbol}:`, error);
    return null;
  }
}

/**
 * Helper to get chat completions from LiteLLM Gateway
 */
async function getChatCompletion(systemPrompt: string, userPrompt: string): Promise<string> {
  const litellmUrl = (process.env.LITELLM_URL || "http://localhost:4000/v1/chat/completions").replace("/embeddings", "/chat/completions");
  const masterKey = process.env.LITELLM_MASTER_KEY || "sk-omnitrade-master-key";

  try {
    const response = await axios.post(
      litellmUrl,
      {
        model: "ministral3",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt }
        ],
        temperature: 0.3,
      },
      {
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${masterKey}`,
        },
      }
    );

    return response.data.choices[0].message.content;
  } catch (error) {
    console.error("Error getting chat completion:", error);
    throw error;
  }
}

/**
 * Fetch recent filings for a company
 */
interface FilingInfo {
  accessionNumber: string;
  filingType: string;
  filingDate: string;
  fileNumber: string;
  form: string;
  url: string;
  documentUrl: string;
}

async function listFilingsForCIK(
  cik: string,
  filingTypes?: string[],
  limit: number = 10
): Promise<FilingInfo[]> {
  try {
    const response = await secClient.get(SUBMISSIONS_URL(cik));
    const data = response.data;

    const filings: FilingInfo[] = [];
    const recentFilings = data.recent || data.filings?.recent || [];

    for (const filing of recentFilings) {
      if (filings.length >= limit) break;

      const form = filing.form?.toUpperCase();
      if (!form) continue;

      // Filter by filing type if specified
      if (filingTypes && filingTypes.length > 0) {
        const matches = filingTypes.some((type) =>
          FILING_TYPES[type]?.includes(form)
        );
        if (!matches && !filingTypes.includes(form)) continue;
      }

      const accessionNumber = filing.accessionNumber;
      const cleanAccession = accessionNumber.replace(/-/g, "");

      filings.push({
        accessionNumber: filing.accessionNumber,
        filingType: filing.form,
        filingDate: filing.filingDate,
        fileNumber: filing.fileNumber || "",
        form: filing.form,
        url: `${SEC_BASE_URL}/edgar/data/${cik}/${cleanAccession}.idx`,
        documentUrl: constructDocumentUrl(
          cik,
          filing.accessionNumber,
          filing.primaryDocument
        ),
      });
    }

    return filings;
  } catch (error) {
    console.error(`Error fetching filings for CIK ${cik}:`, error);
    return [];
  }
}

/**
 * Construct the URL to the primary document
 */
function constructDocumentUrl(
  cik: string,
  accessionNumber: string,
  primaryDocument?: string
): string {
  const cleanAccession = accessionNumber.replace(/-/g, "");
  const doc = primaryDocument || "primary-document.html";
  return `${SEC_BASE_URL}/edgar/data/${cik}/${cleanAccession}/${doc}`;
}

/**
 * Fetch and parse the full text of a filing
 */
interface FilingText {
  url: string;
  form: string;
  filingDate: string;
  company: string;
  cik: string;
  text: string;
  metadata: {
    accessionNumber: string;
    fileNumber: string;
    documentUrl: string;
  };
}

async function fetchFilingText(
  cik: string,
  accessionNumber: string,
  form: string
): Promise<FilingText | null> {
  try {
    // Get the submission info to find the primary document
    const submissionResponse = await secClient.get(SUBMISSIONS_URL(cik));
    const data = submissionResponse.data;

    const recentFilings = data.recent || data.filings?.recent || [];
    const filingInfo = recentFilings.find(
      (f: { accessionNumber: string }) => f.accessionNumber === accessionNumber
    );

    if (!filingInfo) {
      throw new Error(`Filing ${accessionNumber} not found`);
    }

    const documentUrl = constructDocumentUrl(
      cik,
      accessionNumber,
      filingInfo.primaryDocument
    );

    // Fetch the document
    const docResponse = await secClient.get(documentUrl);
    const html = docResponse.data;

    // Parse HTML to extract text
    const $ = cheerio.load(html);

    // Remove script and style elements
    $("script, style").remove();

    // Get text from the document
    let text = $("body").text() || $.text();

    // Clean up whitespace
    text = text
      .replace(/\s+/g, " ")
      .replace(/\n\s*\n/g, "\n\n")
      .trim();

    return {
      url: documentUrl,
      form: filingInfo.form,
      filingDate: filingInfo.filingDate,
      company: data.name || "",
      cik: cik,
      text: text,
      metadata: {
        accessionNumber: filingInfo.accessionNumber,
        fileNumber: filingInfo.fileNumber || "",
        documentUrl: documentUrl,
      },
    };
  } catch (error) {
    console.error(`Error fetching filing text:`, error);
    return null;
  }
}

/**
 * Split filing text into chunks for embedding
 */
interface TextChunk {
  chunkNumber: number;
  text: string;
  startChar: number;
  endChar: number;
  estimatedTokens: number;
}

function chunkFilingText(
  text: string,
  maxChunkSize: number = 512
): TextChunk[] {
  const chunks: TextChunk[] = [];
  const targetTokens = maxChunkSize;

  // Rough estimation: 1 token ≈ 4 characters
  const targetChunkSize = targetTokens * 4;

  // Split by paragraphs first to maintain context
  const paragraphs = text.split(/\n\s*\n/);
  let currentChunk = "";
  let charOffset = 0;
  let chunkNumber = 1;

  for (const paragraph of paragraphs) {
    const trimmedParagraph = paragraph.trim();
    if (!trimmedParagraph) continue;

    const chunkWithParagraph = currentChunk
      ? `${currentChunk}\n\n${trimmedParagraph}`
      : trimmedParagraph;

    if (chunkWithParagraph.length <= targetChunkSize) {
      currentChunk = chunkWithParagraph;
    } else {
      // Save current chunk if it exists
      if (currentChunk) {
        chunks.push({
          chunkNumber: chunkNumber++,
          text: currentChunk,
          startChar: charOffset,
          endChar: charOffset + currentChunk.length,
          estimatedTokens: Math.ceil(currentChunk.length / 4),
        });
        charOffset += currentChunk.length;
      }

      // If paragraph is too large, split it
      if (trimmedParagraph.length > targetChunkSize) {
        const sentences = trimmedParagraph.match(/[^.!?]+[.!?]+/g) || [
          trimmedParagraph,
        ];
        currentChunk = "";

        for (const sentence of sentences) {
          const chunkWithSentence = currentChunk
            ? `${currentChunk} ${sentence}`
            : sentence;

          if (chunkWithSentence.length <= targetChunkSize) {
            currentChunk = chunkWithSentence;
          } else {
            if (currentChunk) {
              chunks.push({
                chunkNumber: chunkNumber++,
                text: currentChunk,
                startChar: charOffset,
                endChar: charOffset + currentChunk.length,
                estimatedTokens: Math.ceil(currentChunk.length / 4),
              });
              charOffset += currentChunk.length;
            }
            currentChunk = sentence;
          }
        }
      } else {
        currentChunk = trimmedParagraph;
      }
    }
  }

  // Add the last chunk
  if (currentChunk) {
    chunks.push({
      chunkNumber: chunkNumber,
      text: currentChunk,
      startChar: charOffset,
      endChar: charOffset + currentChunk.length,
      estimatedTokens: Math.ceil(currentChunk.length / 4),
    });
  }

  return chunks;
}

/**
 * Search filing text for specific terms
 */
interface SearchResult {
  matchNumber: number;
  context: string;
  position: number;
  snippet: string;
}

function searchFilingText(text: string, query: string): SearchResult[] {
  const results: SearchResult[] = [];
  const queryLower = query.toLowerCase();
  const contextLength = 200; // characters

  let position = 0;
  let matchCount = 0;

  while (true) {
    const index = text.toLowerCase().indexOf(queryLower, position);
    if (index === -1) break;

    matchCount++;

    // Extract context around the match
    const start = Math.max(0, index - contextLength);
    const end = Math.min(text.length, index + query.length + contextLength);
    const context = text.substring(start, end);

    results.push({
      matchNumber: matchCount,
      context: context,
      position: index,
      snippet:
        (start > 0 ? "..." : "") +
        context +
        (end < text.length ? "..." : ""),
    });

    position = index + query.length;
  }

  return results;
}

// MCP Server setup
const server = new Server(
  {
    name: "mcp-sec-filings",
    version: "1.0.0",
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// Define available tools
const TOOLS: Tool[] = [
  {
    name: "list_filings",
    description:
      "List recent SEC filings for a stock symbol. Returns filing type, date, and URLs for accessing the full documents.",
    inputSchema: {
      type: "object",
      properties: {
        symbol: {
          type: "string",
          description: "Stock ticker symbol (e.g., AAPL, MSFT, GOOGL)",
        },
        filing_type: {
          type: "string",
          description:
            "Optional: Filter by filing type (10-K, 10-Q, 8-K, DEF 14A, S-1, 13F)",
          enum: ["10-K", "10-Q", "8-K", "DEF 14A", "S-1", "13F"],
        },
        limit: {
          type: "number",
          description: "Maximum number of filings to return (default: 10)",
          default: 10,
        },
      },
      required: ["symbol"],
    },
  },
  {
    name: "fetch_filing",
    description:
      "Fetch the full text content of a specific SEC filing. Returns the complete document text with metadata.",
    inputSchema: {
      type: "object",
      properties: {
        symbol: {
          type: "string",
          description: "Stock ticker symbol (e.g., AAPL, MSFT, GOOGL)",
        },
        filing_type: {
          type: "string",
          description:
            "Filing type to fetch (10-K or 10-Q for quarterly/annual reports)",
          enum: ["10-K", "10-Q", "8-K", "DEF 14A", "S-1", "13F"],
        },
        year: {
          type: "number",
          description:
            "Optional: Year to fetch (for 10-K) or quarter (for 10-Q, format: YYYYQ1, YYYYQ2, etc.)",
        },
        accession_number: {
          type: "string",
          description:
            "Optional: Specific accession number to fetch (overrides symbol/year lookup)",
        },
        cik: {
          type: "string",
          description:
            "Optional: SEC CIK number (overrides symbol lookup, faster)",
        },
      },
      required: ["symbol"],
    },
  },
  {
    name: "chunk_filing",
    description:
      "Split a SEC filing document into chunks for embedding or processing. Returns chunks of approximately 512 tokens each, maintaining paragraph context where possible.",
    inputSchema: {
      type: "object",
      properties: {
        filing_url: {
          type: "string",
          description: "Full URL to the SEC filing document",
        },
        max_chunk_size: {
          type: "number",
          description:
            "Target chunk size in tokens (default: 512, recommended for embeddings)",
          default: 512,
        },
        cik: {
          type: "string",
          description: "SEC CIK number (required if filing_url is not a SEC.gov URL)",
        },
        accession_number: {
          type: "string",
          description: "Accession number (required if filing_url is not a SEC.gov URL)",
        },
        form: {
          type: "string",
          description: "Filing form type (required if filing_url is not a SEC.gov URL)",
        },
      },
      required: ["filing_url"],
    },
  },
  {
    name: "search_filings",
    description:
      "Search the full text of SEC filings for specific terms or phrases. Returns all matches with surrounding context.",
    inputSchema: {
      type: "object",
      properties: {
        symbol: {
          type: "string",
          description: "Stock ticker symbol (e.g., AAPL, MSFT, GOOGL)",
        },
        query: {
          type: "string",
          description: "Search query text to find in filings",
        },
        filing_type: {
          type: "string",
          description:
            "Optional: Filter by filing type (10-K, 10-Q, 8-K, etc.)",
          enum: ["10-K", "10-Q", "8-K", "DEF 14A", "S-1", "13F"],
        },
        year: {
          type: "number",
          description: "Optional: Year to search within (for 10-K filings)",
        },
        limit_results: {
          type: "number",
          description: "Maximum number of search results per filing (default: 50)",
          default: 50,
        },
      },
      required: ["symbol", "filingType"],
    },
  },
  {
    name: "summarize_filing",
    description: "Get a concise summary of a specific SEC filing using Ministral 3.",
    inputSchema: {
      type: "object",
      properties: {
        symbol: {
          type: "string",
          description: "Stock ticker symbol (e.g., AAPL)",
        },
        filingType: {
          type: "string",
          description: "Filing type (e.g., 10-K, 10-Q, 8-K)",
          enum: ["10-K", "10-Q", "8-K"],
        },
        year: {
          type: "number",
          description: "Filing year (optional)",
        },
        accessionNumber: {
          type: "string",
          description: "Direct accession number (optional)",
        },
      },
      required: ["symbol", "filingType"],
    },
  }
];

// List tools handler
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: TOOLS,
  };
});

// Tool call handler
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  if (!args) {
    return {
      content: [
        {
          type: "text",
          text: JSON.stringify({ error: "No arguments provided" }),
        },
      ],
      isError: true,
    };
  }

  try {
    switch (name) {
      case "list_filings": {
        const symbol = String(args.symbol);
        const filingType = args.filing_type
          ? String(args.filing_type)
          : undefined;
        const limit = Number(args.limit) || 10;

        const cik = await getCIK(symbol);
        if (!cik) {
          throw new Error(
            `Could not find CIK for symbol: ${symbol}. Please verify the ticker symbol.`
          );
        }

        const filingTypes = filingType ? [filingType] : undefined;
        const filings = await listFilingsForCIK(cik, filingTypes, limit);

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(
                {
                  symbol: symbol,
                  cik: cik,
                  count: filings.length,
                  filings: filings,
                },
                null,
                2
              ),
            },
          ],
        };
      }

      case "fetch_filing": {
        const symbol = String(args.symbol);
        const filingType = args.filing_type
          ? String(args.filing_type)
          : "10-K";
        const year = args.year ? Number(args.year) : undefined;
        const accessionNumber = args.accession_number
          ? String(args.accession_number)
          : undefined;
        let cik: string | undefined = args.cik ? String(args.cik) : undefined;

        if (!cik) {
          const foundCIK = await getCIK(symbol);
          if (!foundCIK) {
            throw new Error(
              `Could not find CIK for symbol: ${symbol}. Please verify the ticker symbol.`
            );
          }
          cik = foundCIK;
        }

        let targetAccessionNumber = accessionNumber;

        if (!targetAccessionNumber) {
          // Find the most recent filing of the specified type
          const filingTypes = [filingType];
          let limit = 1;

          // If year specified, get more to search through
          if (year) {
            limit = 20;
          }

          const filings = await listFilingsForCIK(cik, filingTypes, limit);

          if (filings.length === 0) {
            throw new Error(
              `No ${filingType} filings found for ${symbol}. Please try a different filing type.`
            );
          }

          // Filter by year if specified
          let targetFiling = filings[0];
          if (year) {
            const yearFilings = filings.filter((f) =>
              f.filingDate.startsWith(year.toString())
            );
            if (yearFilings.length > 0) {
              targetFiling = yearFilings[0];
            }
          }

          targetAccessionNumber = targetFiling.accessionNumber;
        }

        const filingText = await fetchFilingText(
          cik,
          targetAccessionNumber,
          filingType
        );

        if (!filingText) {
          throw new Error(
            `Failed to fetch filing content for ${symbol} ${filingType}.`
          );
        }

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(filingText, null, 2),
            },
          ],
        };
      }

      case "chunk_filing": {
        const filingUrl = String(args.filing_url);
        const maxChunkSize = Number(args.max_chunk_size) || 512;
        const cik = args.cik ? String(args.cik) : undefined;
        const accessionNumber = args.accession_number
          ? String(args.accession_number)
          : undefined;
        const form = args.form ? String(args.form) : undefined;

        let filingText: FilingText | null = null;

        // If direct SEC URL, parse it to get components
        if (filingUrl.includes("sec.gov/edgar/data/")) {
          const urlParts = filingUrl.split("/");
          const urlCik = urlParts[urlParts.indexOf("edgar") + 2];
          const urlForm = form || "10-K";
          filingText = await fetchFilingText(urlCik, "", urlForm);
        } else if (cik && accessionNumber && form) {
          filingText = await fetchFilingText(cik, accessionNumber, form);
        } else {
          throw new Error(
            "For non-SEC URLs, must provide cik, accession_number, and form parameters"
          );
        }

        if (!filingText) {
          throw new Error("Failed to fetch filing document for chunking.");
        }

        const chunks = chunkFilingText(filingText.text, maxChunkSize);

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(
                {
                  url: filingUrl,
                  form: filingText.form,
                  company: filingText.company,
                  totalChunks: chunks.length,
                  totalCharacters: filingText.text.length,
                  estimatedTotalTokens: Math.ceil(
                    filingText.text.length / 4
                  ),
                  chunks: chunks,
                },
                null,
                2
              ),
            },
          ],
        };
      }

      case "search_filings": {
        const symbol = String(args.symbol);
        const query = String(args.query);
        const filingType = args.filing_type
          ? String(args.filing_type)
          : undefined;
        const year = args.year ? Number(args.year) : undefined;
        const limitResults = Number(args.limit_results) || 50;

        const cik = await getCIK(symbol);
        if (!cik) {
          throw new Error(
            `Could not find CIK for symbol: ${symbol}. Please verify the ticker symbol.`
          );
        }

        const filingTypes = filingType ? [filingType] : undefined;
        const filings = await listFilingsForCIK(cik, filingTypes, 10);

        if (filings.length === 0) {
          throw new Error(`No filings found for ${symbol}`);
        }

        const searchResults: Array<{
          filing: FilingInfo;
          matches: number;
          results: SearchResult[];
        }> = [];

        // Search through each filing
        for (const filing of filings) {
          // Skip if year filter doesn't match
          if (year && !filing.filingDate.startsWith(year.toString())) {
            continue;
          }

          const filingText = await fetchFilingText(
            cik,
            filing.accessionNumber,
            filing.form
          );

          if (!filingText) continue;

          const results = searchFilingText(filingText.text, query);

          if (results.length > 0) {
            searchResults.push({
              filing: filing,
              matches: results.length,
              results: results.slice(0, limitResults),
            });
          }
        }

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(
                {
                  symbol: symbol,
                  cik: cik,
                  query: query,
                  totalMatches: searchResults.reduce(
                    (sum, r) => sum + r.matches,
                    0
                  ),
                  filingsSearched: searchResults.length,
                  results: searchResults,
                },
                null,
                2
              ),
            },
          ],
        };
      }

      case "summarize_filing": {
        const { symbol, filingType, year, accessionNumber } = args as unknown as {
          symbol: string;
          filingType: string;
          year?: number;
          accessionNumber?: string;
        };

        const cik = await getCIK(symbol);
        if (!cik) {
          throw new Error(`Could not find CIK for symbol ${symbol}`);
        }

        let targetAccessionNumber = accessionNumber;
        if (!targetAccessionNumber) {
          const filings = await listFilingsForCIK(cik, [filingType], 10);
          let targetFiling = filings[0];
          if (year) {
            const yearFilings = filings.filter((f) => f.filingDate.startsWith(year.toString()));
            if (yearFilings.length > 0) targetFiling = yearFilings[0];
          }
          if (!targetFiling) throw new Error(`No ${filingType} found for ${symbol}`);
          targetAccessionNumber = targetFiling.accessionNumber;
        }

        const filingText = await fetchFilingText(cik, targetAccessionNumber, filingType);
        if (!filingText) throw new Error("Failed to fetch filing text.");

        const systemPrompt = "You are a senior financial analyst. Summarize the following SEC filing text concisely, highlighting the most important financial results, risk factors, and outlook changes. Use bullet points.";
        const summary = await getChatCompletion(systemPrompt, filingText.text.substring(0, 15000)); // Truncate for safety

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify({
                tool: "summarize_filing",
                symbol,
                filingType,
                accessionNumber: targetAccessionNumber,
                summary,
              }, null, 2),
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
              error: errorMessage,
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

// Start the server
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);

  // Log to stderr so it doesn't interfere with MCP protocol
  console.error("SEC Filings MCP server running on stdio");
  console.error(`User-Agent: ${USER_AGENT}`);
}

main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
