#!/usr/bin/env node

/**
 * Simple test script to verify MCP server functionality
 * This sends a JSON-RPC request to list available tools
 */

import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const serverPath = join(__dirname, 'dist', 'index.js');

console.log('🧪 Testing Alpaca MCP Server...\n');
console.log('Starting server...');

// Spawn the MCP server process
const server = spawn('node', [serverPath], {
  stdio: ['pipe', 'pipe', 'inherit'],
  env: {
    ...process.env,
    // Use test environment if available
    NODE_ENV: 'test'
  }
});

// Wait a bit for server to start
setTimeout(() => {
  console.log('Sending tools/list request...\n');

  // Send JSON-RPC request to list tools
  const request = JSON.stringify({
    jsonrpc: '2.0',
    id: 1,
    method: 'tools/list'
  });

  server.stdin.write(request + '\n');

  // Read response
  let response = '';
  server.stdout.on('data', (data) => {
    response += data.toString();

    // Try to parse complete JSON response
    try {
      const lines = response.split('\n').filter(line => line.trim());
      for (const line of lines) {
        const parsed = JSON.parse(line);
        if (parsed.result && parsed.result.tools) {
          console.log('✅ MCP Server is working!\n');
          console.log(`Found ${parsed.result.tools.length} tools:\n`);
          parsed.result.tools.forEach(tool => {
            console.log(`  📦 ${tool.name}`);
            console.log(`     ${tool.description.substring(0, 80)}...\n`);
          });
          server.kill();
          process.exit(0);
        }
        if (parsed.error) {
          console.error('❌ Error from server:', parsed.error);
          server.kill();
          process.exit(1);
        }
      }
    } catch (e) {
      // Response not complete yet, wait for more data
    }
  });

  // Timeout after 5 seconds
  setTimeout(() => {
    console.error('❌ Timeout waiting for server response');
    server.kill();
    process.exit(1);
  }, 5000);

}, 1000);

server.on('error', (err) => {
  console.error('❌ Failed to start server:', err.message);
  process.exit(1);
});

server.on('exit', (code) => {
  if (code !== 0 && code !== null) {
    console.error(`\n❌ Server exited with code ${code}`);
    process.exit(1);
  }
});
