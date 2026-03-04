# Financial News MCP Server - Project Structure

## Overview

This MCP server provides real-time financial news, sentiment analysis, analyst ratings, and earnings calendar data for AI agents and trading systems.

## Directory Structure

```
financial-news/
├── src/
│   └── index.ts              # Main MCP server implementation
├── dist/                     # Compiled JavaScript (generated)
├── node_modules/             # Dependencies (generated)
├── .env.example              # Environment variables template
├── .gitignore                # Git ignore rules
├── package.json              # Project metadata and scripts
├── tsconfig.json             # TypeScript configuration
├── setup.sh                  # Setup script for Linux/Mac
├── test-server.js            # Server initialization test
├── mcp-config-example.json   # MCP client configuration example
└── README.md                 # Documentation
```

## File Descriptions

### Core Files

- **`src/index.ts`** (16 KB)
  - Main MCP server implementation
  - Tool definitions and handlers
  - API clients for NewsAPI.org and Alpha Vantage
  - Sentiment analysis logic
  - Web scraping fallbacks for Yahoo Finance
  - Error handling and rate limiting

- **`package.json`**
  - Dependencies: `@modelcontextprotocol/sdk`, `axios`, `cheerio`, `dotenv`
  - Build tools: `typescript`, `tsx`
  - Scripts: build, start, dev, watch, test

- **`tsconfig.json`**
  - Target: ES2022
  - Module system: ES2022
  - Strict mode enabled
  - Source maps enabled

### Configuration Files

- **`.env.example`**
  - Template for API keys
  - Required: `NEWS_API_KEY`, `ALPHA_VANTAGE_API_KEY`

- **`mcp-config-example.json`**
  - Example Claude Desktop MCP configuration
  - Shows environment variable setup

### Utility Files

- **`setup.sh`**
  - Automated setup script (Linux/Mac)
  - Creates .env file
  - Installs dependencies
  - Builds project

- **`test-server.js`**
  - Validates server initialization
  - Tests tool registration
  - No API keys required for basic test

## MCP Tools

### 1. get_news_headlines
**Purpose**: Get recent news for a stock symbol

**Implementation**:
- Primary: Alpha Vantage News API (stock-specific)
- Fallback: NewsAPI.org (general search)

**Parameters**:
- `symbol` (required): Stock symbol
- `limit` (optional): Result count (default: 10)

**Returns**: Array of news headlines with sentiment tags

### 2. get_news_sentiment
**Purpose**: Aggregate sentiment analysis for a symbol

**Implementation**:
- Fetches 100 recent articles
- Keyword-based sentiment scoring
- Calculates bullish/bearish/neutral classification

**Parameters**:
- `symbol` (required): Stock symbol
- `days` (optional): Lookback period (default: 7, max: 30)

**Returns**: Sentiment score, classification, breakdown

### 3. search_news
**Purpose**: General financial news search

**Implementation**:
- NewsAPI.org query endpoint
- Full-text search across financial news

**Parameters**:
- `query` (required): Search query
- `limit` (optional): Result count (default: 10)

**Returns**: Relevant articles with sentiment tags

### 4. get_analyst_ratings
**Purpose**: Recent analyst upgrades/downgrades

**Implementation**:
- Currently: Placeholder/mock data
- Production: Requires paid API (Bloomberg, FactSet, etc.)

**Parameters**:
- `symbol` (required): Stock symbol

**Returns**: Analyst ratings with price targets

### 5. get_earnings_calendar
**Purpose**: Upcoming earnings dates and estimates

**Implementation**:
- Currently: Placeholder/mock data
- Production: Requires paid API (EarningsWhispers, Estimize, etc.)

**Parameters**:
- `symbol` (required): Stock symbol

**Returns**: Earnings dates, EPS estimates, revenue estimates

## API Integration

### NewsAPI.org
- **Endpoint**: `https://newsapi.org/v2/everything`
- **Rate Limit**: 100 requests/day (free tier)
- **Usage**: General news search, historical queries
- **Auth**: API key in query string

### Alpha Vantage
- **Endpoint**: `https://www.alphavantage.co/query`
- **Function**: `NEWS_SENTIMENT`
- **Rate Limit**: 25 requests/day (free tier)
- **Usage**: Stock-specific news, built-in sentiment
- **Auth**: API key in query string

### Yahoo Finance (Fallback)
- **Method**: Web scraping with Cheerio
- **Rate Limit**: Unknown (respect rate limits)
- **Usage**: Analyst ratings, earnings calendar
- **Auth**: None (user-agent only)

## Sentiment Analysis

### Method
- Keyword-based analysis on title + description
- Positive/negative word dictionaries
- Aggregate scoring across multiple articles

### Positive Indicators
surge, rally, gain, growth, profit, beat, strong, bullish, upgrade, outperform, buy, rises, soars, jumps, advances, record, breakthrough, expansion, dividend, momentum

### Negative Indicators
plunge, fall, drop, loss, miss, weak, bearish, downgrade, sell, declines, slumps, tumbles, cuts, layoff, concern, risk, warning, recession, inflation, debt, lawsuit

### Scoring
- Score = (positive - negative) / total
- Bullish: score > 0.2
- Bearish: score < -0.2
- Neutral: otherwise

## Environment Variables

### Required
- `NEWS_API_KEY`: NewsAPI.org key
- `ALPHA_VANTAGE_API_KEY`: Alpha Vantage key

### Optional
- None currently

## Build Process

### Development
```bash
npm run dev      # Run with tsx (hot reload)
npm run watch    # Watch mode
```

### Production
```bash
npm run build    # Compile TypeScript
npm start        # Run compiled code
```

## Integration with OmniTrade

### Current Status
- Standalone MCP server
- Can be integrated with Claude Desktop
- Ready for OmniTrade AI agent consumption

### Future Enhancements
1. Add more data sources (Bloomberg, Refinitiv)
2. Implement proper analyst ratings API
3. Add earnings calendar API
4. Enhance sentiment analysis with ML models
5. Add caching layer for rate limit management
6. Implement request queuing

## Rate Limiting Strategy

### Current
- No built-in rate limiting
- Relies on external API limits
- Errors on rate limit exceeded

### Recommended
- Implement request queue
- Add response caching (TTL: 5-15 minutes)
- Track usage per API key
- Fallback on rate limit errors

## Error Handling

### Implemented
- Try-catch on all API calls
- Graceful fallback between APIs
- Error messages returned to MCP client
- No server crashes on API errors

### Error Types
- Missing API keys
- Rate limit exceeded
- Network timeouts (10s)
- Invalid symbols/queries

## Security Considerations

### Current
- API keys in environment variables
- No hardcoded credentials
- Read-only operations
- No database writes

### Recommendations
- Add input validation/sanitization
- Implement request signing
- Add API key rotation
- Use secrets manager in production
- Add request logging/audit trail

## Performance

### Current
- Timeout: 10 seconds per request
- No caching
- No request batching
- Synchronous execution

### Optimization Targets
- Add Redis caching layer
- Implement request batching
- Add background refresh for common queries
- Use connection pooling for HTTP requests

## Testing

### Manual Testing
```bash
npm test          # Run initialization test
npm run dev       # Interactive testing
```

### Test Coverage Areas
- Server initialization
- Tool registration
- API connectivity
- Error handling
- Sentiment analysis accuracy

## Dependencies

### Runtime
- `@modelcontextprotocol/sdk` ^1.0.4 - MCP framework
- `axios` ^1.7.9 - HTTP client
- `cheerio` ^1.0.0 - HTML parsing
- `dotenv` ^16.4.7 - Environment variables

### Development
- `typescript` ^5.7.2 - TypeScript compiler
- `tsx` ^4.19.2 - TypeScript executor
- `@types/node` ^22.10.2 - Node.js types

## Version History

- **1.0.0** (2026-03-04): Initial release
  - 5 MCP tools
  - 2 API integrations
  - Sentiment analysis
  - Basic error handling
