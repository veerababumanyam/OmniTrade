# Financial News MCP Server - Quick Start Guide

## 5-Minute Setup

### 1. Get API Keys

**NewsAPI.org** (Free: 100 requests/day)
- Go to: https://newsapi.org/register
- Sign up with email
- Copy API key from dashboard

**Alpha Vantage** (Free: 25 requests/day)
- Go to: https://www.alphavantage.co/support/#api-key
- Click "Get Your Free API Key Today"
- Copy key from confirmation

### 2. Configure Environment

```bash
cd C:\Users\admin\Desktop\OmniTrade\mcp\financial-news

# Create .env file
cp .env.example .env

# Edit .env and add your keys
# NEWS_API_KEY=your_key_here
# ALPHA_VANTAGE_API_KEY=your_key_here
```

### 3. Install and Build

```bash
npm install
npm run build
```

### 4. Test Server

```bash
npm test
```

You should see:
```
✓ Server initialized successfully
Available tools:
  - get_news_headlines
  - get_news_sentiment
  - search_news
  - get_analyst_ratings
  - get_earnings_calendar

✓ MCP server is ready to use!
```

### 5. Run Server

```bash
npm start
```

Or for development:
```bash
npm run dev
```

## Tool Usage Examples

### Get News Headlines

```json
{
  "name": "get_news_headlines",
  "arguments": {
    "symbol": "AAPL",
    "limit": 10
  }
}
```

**Response:**
```json
[
  {
    "title": "Apple Reports Record Q4 Earnings",
    "description": "Apple exceeded analyst expectations...",
    "url": "https://example.com/article",
    "source": "Bloomberg",
    "publishedAt": "2026-03-04T10:30:00Z",
    "sentiment": "positive"
  }
]
```

### Get Sentiment Analysis

```json
{
  "name": "get_news_sentiment",
  "arguments": {
    "symbol": "NVDA",
    "days": 7
  }
}
```

**Response:**
```json
{
  "symbol": "NVDA",
  "days": 7,
  "articleCount": 45,
  "averageScore": 0.42,
  "sentiment": "bullish",
  "breakdown": {
    "positive": 28,
    "negative": 8,
    "neutral": 9
  },
  "recentHeadlines": [...]
}
```

### Search General News

```json
{
  "name": "search_news",
  "arguments": {
    "query": "Federal Reserve interest rates",
    "limit": 10
  }
}
```

### Get Analyst Ratings

```json
{
  "name": "get_analyst_ratings",
  "arguments": {
    "symbol": "MSFT"
  }
}
```

### Get Earnings Calendar

```json
{
  "name": "get_earnings_calendar",
  "arguments": {
    "symbol": "GOOGL"
  }
}
```

## Common Use Cases

### 1. Stock Research Pipeline
```
1. get_news_headlines(symbol) → Recent news
2. get_news_sentiment(symbol) → Overall sentiment
3. get_analyst_ratings(symbol) → Expert opinions
4. get_earnings_calendar(symbol) → Upcoming catalysts
```

### 2. Market Sentiment Monitoring
```
1. search_news("technology stocks") → Sector trends
2. search_news("inflation") → Macro news
3. search_news("Fed rate hike") → Policy updates
```

### 3. Earnings Preparation
```
1. get_earnings_calendar(symbol) → Earnings date
2. get_news_sentiment(symbol, days=30) → Pre-earnings sentiment
3. get_analyst_ratings(symbol) → Recent rating changes
```

## Integration with Claude Desktop

Add to your Claude Desktop config (Windows: `%APPDATA%\Claude\claude_desktop_config.json`):

```json
{
  "mcpServers": {
    "financial-news": {
      "command": "node",
      "args": [
        "C:\\Users\\admin\\Desktop\\OmniTrade\\mcp\\financial-news\\dist\\index.js"
      ],
      "env": {
        "NEWS_API_KEY": "your_news_api_key",
        "ALPHA_VANTAGE_API_KEY": "your_alpha_vantage_key"
      }
    }
  }
}
```

Restart Claude Desktop. Tools will be available in chat.

## Troubleshooting

### "API Key Not Set"
- Check `.env` file exists
- Verify keys are correct (no extra spaces)
- Restart server after updating `.env`

### "Rate Limit Exceeded"
- NewsAPI: 100 requests/day
- Alpha Vantage: 25 requests/day
- Wait 24 hours or upgrade to paid tier

### Empty Results
- Try alternative symbol format (AAPL vs Apple Inc)
- Check symbol is valid
- Verify API keys are working

### Build Errors
```bash
# Clean and rebuild
rm -rf node_modules dist
npm install
npm run build
```

## Rate Limit Management

### Daily Quotas
- NewsAPI: 100 requests/day
- Alpha Vantage: 25 requests/day

### Best Practices
1. Cache results for 5-15 minutes
2. Batch requests when possible
3. Use sentiment analysis (groups multiple articles)
4. Prioritize Alpha Vantage for stock-specific news

### Upgrade Options
- NewsAPI: $449/month for 10,000 requests/day
- Alpha Vantage: Free tier sufficient for most use cases

## Next Steps

1. **Production Deployment**: Consider paid API tiers for higher rate limits
2. **Enhanced Sentiment**: Integrate OpenAI/GPT-4 for better sentiment analysis
3. **Real-time Updates**: Implement WebSocket for live news feeds
4. **Custom Sources**: Add company-specific news sources (press releases, SEC filings)
5. **Monitoring**: Add logging and alerting for API usage

## Support

- Documentation: See `README.md`
- Project Structure: See `PROJECT_STRUCTURE.md`
- Issues: Open an issue in the OmniTrade repository

## API Documentation

- NewsAPI: https://newsapi.org/docs
- Alpha Vantage: https://www.alphavantage.co/documentation/
- MCP SDK: https://modelcontextprotocol.io/
