# Quick Start Guide - Polygon.io MCP Server

Get up and running with the Polygon.io MCP server in 5 minutes.

## 1. Install Dependencies

```bash
cd C:/Users/admin/Desktop/OmniTrade/mcp/polygon-market-data
npm install
```

## 2. Get Your API Key

1. Go to [Polygon.io](https://polygon.io/)
2. Sign up for a free account
3. Get your API key from the dashboard
4. Copy the API key

## 3. Configure Environment

Create a `.env` file:

```bash
cp .env.example .env
```

Edit `.env` and add your API key:

```bash
POLYGON_API_KEY=your_actual_api_key_here
```

## 4. Build the Server

```bash
npm run build
```

## 5. Test the Server

Start the server:

```bash
npm start
```

The server should start and display:
```
Polygon.io Market Data MCP Server running on stdio
```

## 6. Configure Claude Code

Add to `~/.config/claude-code/config.json`:

**Windows (Git Bash/WSL):**
```json
{
  "mcpServers": {
    "polygon-market-data": {
      "command": "node",
      "args": ["C:/Users/admin/Desktop/OmniTrade/mcp/polygon-market-data/dist/index.js"],
      "env": {
        "POLYGON_API_KEY": "your_api_key_here"
      }
    }
  }
}
```

**Windows (PowerShell):**
```json
{
  "mcpServers": {
    "polygon-market-data": {
      "command": "node",
      "args": ["C:\\Users\\admin\\Desktop\\OmniTrade\\mcp\\polygon-market-data\\dist\\index.js"],
      "env": {
        "POLYGON_API_KEY": "your_api_key_here"
      }
    }
  }
}
```

## 7. Restart Claude Code

Close and restart Claude Code to load the new MCP server.

## 8. Verify It Works

In Claude Code, try:

```
Get the latest quote for Apple stock (AAPL)
```

Or:

```
Get daily aggregates for MSFT from 2024-01-01 to 2024-01-31
```

## Common Issues

### Issue: "POLYGON_API_KEY not set"
**Solution:** Make sure you created the `.env` file and added your API key.

### Issue: "Module not found"
**Solution:** Run `npm install` to install dependencies.

### Issue: "Server not connecting"
**Solution:**
1. Make sure you built the server: `npm run build`
2. Check the path in your Claude Code config
3. Verify the `dist/index.js` file exists

### Issue: "API rate limit exceeded"
**Solution:** The free tier allows 5 calls/minute. Upgrade to a paid tier for higher limits.

## Next Steps

- Read [README.md](./README.md) for detailed documentation
- Check [EXAMPLES.md](./EXAMPLES.md) for usage examples
- See [INTEGRATION.md](./INTEGRATION.md) for OmniTrade integration

## Available Commands

```bash
# Install dependencies
npm install

# Build TypeScript to JavaScript
npm run build

# Start the server
npm start

# Start with environment file
npm run start:env

# Build and start in one command
npm run dev

# Watch mode (rebuilds on changes)
npm run watch
```

## API Key Safety

**IMPORTANT:** Never commit your `.env` file to git!

The `.gitignore` file is already configured to exclude:
- `.env`
- `node_modules/`
- `dist/`

## Support

For Polygon.io API issues: https://polygon.io/docs
For MCP server issues: See OmniTrade documentation
