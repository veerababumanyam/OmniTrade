# Quick Setup Guide

Get the MCP pgvector server running in 5 minutes.

## Prerequisites

- Node.js 18+ installed
- PostgreSQL 14+ with pgvector extension
- OmniTrade database with `fundamental_data` table

## Installation Steps

### 1. Install Dependencies

```bash
cd C:\Users\admin\Desktop\OmniTrade\mcp\pgvector-server
npm install
```

### 2. Build the Server

```bash
npm run build
```

### 3. Configure Database Connection

Copy the example environment file:

```bash
cp .env.example .env
```

Edit `.env` with your credentials:

```env
DB_HOST=localhost
DB_PORT=5432
DB_USER=omnitrade_readonly
DB_PASSWORD=your_password
DB_NAME=omnitrade
```

### 4. Test the Connection

```bash
npm test
```

Expected output:
```
Testing database connection...
✓ Connected to database
✓ pgvector extension is installed
✓ fundamental_data table exists
✓ All checks completed
```

### 5. Start the Server

```bash
npm start
```

The server will start on stdio and log:
```
MCP pgvector server running on stdio
```

## Claude Desktop Integration

Add to Claude Desktop config:

**Windows:** `%APPDATA%\Claude\claude_desktop_config.json`

**macOS:** `~/Library/Application Support/Claude/claude_desktop_config.json`

```json
{
  "mcpServers": {
    "pgvector": {
      "command": "node",
      "args": [
        "C:\\Users\\admin\\Desktop\\OmniTrade\\mcp\\pgvector-server\\dist\\index.js"
      ],
      "env": {
        "DB_HOST": "localhost",
        "DB_PORT": "5432",
        "DB_USER": "omnitrade_readonly",
        "DB_PASSWORD": "your_password",
        "DB_NAME": "omnitrade"
      }
    }
  }
}
```

Restart Claude Desktop. The server will be available for AI agents.

## Verify It Works

In Claude Desktop, try:

```
Search for recent SEC filings about AAPL's revenue growth
```

Claude will use the MCP server to query the database and provide results.

## Troubleshooting

### "Cannot connect to database"
- Check PostgreSQL is running
- Verify credentials in `.env`
- Ensure database exists

### "pgvector extension not found"
```sql
psql -d omnitrade -c "CREATE EXTENSION IF NOT EXISTS vector;"
```

### "fundamental_data table not found"
```bash
psql -d omnitrade -f backend/internal/database/schema.sql
```

### Build errors
```bash
rm -rf node_modules dist
npm install
npm run build
```

## Next Steps

- See `EXAMPLES.md` for usage examples
- See `README.md` for full documentation
- Configure Claude Desktop for persistent access

## Support

For issues or questions:
- Check the OmniTrade documentation in `/docs`
- Review the technical specification
- Check database logs for errors
