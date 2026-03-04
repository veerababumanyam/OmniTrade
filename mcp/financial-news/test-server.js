#!/usr/bin/env node

/**
 * Quick test script to verify MCP server initialization
 * This validates the server can start and list tools without requiring actual API keys
 */

import { spawn } from "child_process";
import fs from "fs";

console.log("Testing Financial News MCP Server...\n");

// Check if dist exists
if (!fs.existsSync("dist/index.js")) {
  console.error("❌ Build not found. Run 'npm run build' first.");
  process.exit(1);
}

// Check if .env exists
if (!fs.existsSync(".env")) {
  console.warn("⚠️  .env file not found. Copy .env.example and add your API keys.");
  console.warn("Creating test .env file...\n");
  fs.writeFileSync(".env", "NEWS_API_KEY=test\nALPHA_VANTAGE_API_KEY=test\n");
}

// Start the server
const server = spawn("node", ["dist/index.js"], {
  stdio: ["pipe", "pipe", "inherit"],
});

let output = "";
let errorOutput = "";

server.stdout.on("data", (data) => {
  output += data.toString();
});

server.stderr.on("data", (data) => {
  errorOutput += data.toString();
});

// Send a list tools request
setTimeout(() => {
  const request = {
    jsonrpc: "2.0",
    id: 1,
    method: "tools/list",
  };

  server.stdin.write(JSON.stringify(request) + "\n");

  // Wait for response
  setTimeout(() => {
    server.kill();

    if (output.includes("get_news_headlines") && output.includes("get_news_sentiment")) {
      console.log("✓ Server initialized successfully\n");
      console.log("Available tools:");
      const tools = [
        "get_news_headlines",
        "get_news_sentiment",
        "search_news",
        "get_analyst_ratings",
        "get_earnings_calendar",
      ];
      tools.forEach((tool) => console.log(`  - ${tool}`));
      console.log("\n✓ MCP server is ready to use!");
      console.log("\nTo configure with Claude Desktop, add to your MCP config:");
      console.log('  See mcp-config-example.json for reference');
    } else {
      console.error("❌ Server initialization failed");
      if (errorOutput) {
        console.error("Error:", errorOutput);
      }
      process.exit(1);
    }
  }, 2000);
}, 1000);

server.on("error", (err) => {
  console.error("❌ Failed to start server:", err);
  process.exit(1);
});
