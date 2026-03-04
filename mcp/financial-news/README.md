# Financial News MCP Server

A Model Context Protocol (MCP) server that provides tools for accessing financial news, sentiment analysis, analyst ratings, and earnings calendar data.

## Features

- **News Headlines**: Get recent news for any stock symbol or company
- **Sentiment Analysis**: Aggregate sentiment scoring from multiple news sources
- **General News Search**: Search for market trends and financial topics
- **Analyst Ratings**: Recent upgrades, downgrades, and ratings changes
- **Earnings Calendar**: Upcoming earnings dates and estimates

## Installation

```bash
cd C:\Users\admin\Desktop\OmniTrade\mcp\financial-news
npm install
```

## Configuration

Create a `.env` file in the server directory:

```bash
cp .env.example .env
```

Edit `.env` and add your API keys:

```env
# NewsAPI.org (Free: 100 requests/day)
# Get your key at: https://newsapi.org/register
NEWS_API_KEY=your_news_api_key_here

# Alpha Vantage (Free: 25 requests/day)
# Get your key at: https://www.alphavantage.co/support/#api-key
ALPHA_VANTAGE_API_KEY=your_alpha_vantage_key_here
```

### Getting API Keys

1. **NewsAPI.org**:
   - Visit https://newsapi.org/register
   - Sign up for a free account
   - Copy your API key from the dashboard

2. **Alpha Vantage**:
   - Visit https://www.alphavantage.co/support/#api-key
   - Click "Get Your Free API Key Today"
   - Copy the key from the confirmation page or email

## Building

```bash
npm run build
```

## Running

```bash
npm start
```

For development with hot-reload:

```bash
npm run dev
```

## MCP Tools

### get_news_headlines

Get recent news headlines for a stock symbol.

**Parameters:**
- `symbol` (string, required): Stock symbol (e.g., AAPL, GOOGL)
- `limit` (number, optional): Maximum results (default: 10)

**Returns:**
Array of news articles with title, description, URL, source, publication date, and sentiment.

### get_news_sentiment

Get aggregate sentiment analysis for a symbol.

**Parameters:**
- `symbol` (string, required): Stock symbol to analyze
- `days` (number, optional): Days to look back (default: 7, max: 30)

**Returns:**
Overall sentiment score, classification (bullish/bearish/neutral), and breakdown of positive/negative/neutral articles.

### search_news

Search for general financial news.

**Parameters:**
- `query` (string, required): Search query (e.g., "technology stocks", "inflation")
- `limit` (number, optional): Maximum results (default: 10)

**Returns:**
Array of relevant news articles with sentiment analysis.

### get_analyst_ratings

Get recent analyst ratings and changes.

**Parameters:**
- `symbol` (string, required): Stock symbol

**Returns:**
Analyst ratings including firm, action (upgrade/downgrade), rating changes, and price targets.

**Note:** This is currently a placeholder implementation. For production use, integrate a paid analyst ratings API like Bloomberg, Refinitiv, or Benzinga.

### get_earnings_calendar

Get upcoming earnings dates and estimates.

**Parameters:**
- `symbol` (string, required): Stock symbol

**Returns:**
Earnings dates, estimated EPS, estimated revenue, and fiscal quarter information.

**Note:** This is currently a placeholder implementation. For production use, integrate a paid earnings calendar API.

## Integrating with MCP Clients

Add to your MCP client configuration (e.g., Claude Desktop):

```json
{
  "mcpServers": {
    "financial-news": {
      "command": "node",
      "args": [
        "C:\\Users\\admin\\Desktop\\OmniTrade\\mcp\\financial-news\\dist\\index.js"
      ],
      "env": {
        "NEWS_API_KEY": "your_news_api_key_here",
        "ALPHA_VANTAGE_API_KEY": "your_alpha_vantage_key_here"
      }
    }
  }
}
```

## API Rate Limits

| API | Free Tier | Rate Limit |
|-----|-----------|------------|
| NewsAPI.org | Free | 100 requests/day |
| Alpha Vantage | Free | 25 requests/day |
| Yahoo Finance | Free (scraping) | Rate-limited |

## Data Sources

- **Primary**: NewsAPI.org (global news coverage)
- **Secondary**: Alpha Vantage (stock-specific news with sentiment scores)
- **Fallback**: Yahoo Finance (web scraping for analyst/earnings data)

## Sentiment Analysis

The server performs keyword-based sentiment analysis on news headlines and descriptions:

- **Positive indicators**: surge, rally, gain, growth, profit, beat, strong, bullish, upgrade
- **Negative indicators**: plunge, fall, drop, loss, miss, weak, bearish, downgrade

For more advanced sentiment analysis, consider integrating services like:
- OpenAI GPT-4 API
- Google Cloud Natural Language API
- AWS Comprehend
- Bloomberg NLP

## Production Considerations

For production use, consider upgrading to paid APIs:

1. **News & Sentiment**:
   - Bloomberg API
   - Refinitiv (LSEG)
   - Benzinga Pro
   - NewsAPI.co (paid tier)

2. **Analyst Ratings**:
   - Bloomberg
   - FactSet
   - IHS Markit
   - TipRanks API

3. **Earnings Calendar**:
   - EarningsWhispers API
   - Estimize API
   - Seeking Alpha API

## Development

```bash
# Watch mode for development
npm run watch

# Run tests (when implemented)
npm test
```

## Troubleshooting

**"NEWS_API_KEY environment variable not set"**
- Ensure your `.env` file exists and contains valid API keys
- Check that the MCP client is passing environment variables correctly

**"NewsAPI request failed"**
- Verify your API key is valid
- Check your rate limit usage
- Ensure network connectivity

**Empty results**
- Some symbols may have limited news coverage
- Try varying the symbol (e.g., "AAPL" vs "Apple Inc")
- Check if the API rate limit has been exceeded

## License

MIT

## Support

For issues or questions, please open an issue in the OmniTrade repository.
