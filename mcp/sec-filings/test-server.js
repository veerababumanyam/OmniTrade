#!/usr/bin/env node

/**
 * Simple test script to verify the MCP server starts correctly.
 * This does NOT test the MCP protocol - just that the server can initialize.
 */

import { spawn } from 'child_process';

console.log('Starting SEC Filings MCP server test...');

// Set test environment
const env = {
  ...process.env,
  USER_AGENT: 'OmniTrade test@example.com'
};

// Start the server
const server = spawn('node', ['dist/index.js'], {
  cwd: process.cwd(),
  env: env,
  stdio: ['pipe', 'pipe', 'inherit']
});

let output = '';
let errorOutput = '';

server.stdout.on('data', (data) => {
  output += data.toString();
});

server.stderr.on('data', (data) => {
  errorOutput += data.toString();
});

// Wait a bit for server to start
setTimeout(() => {
  console.log('\n=== Test Results ===');

  if (errorOutput.includes('SEC Filings MCP server running')) {
    console.log('✅ Server started successfully');
    console.log('✅ Server logs:', errorOutput.trim());
  } else {
    console.log('❌ Server may not have started correctly');
    if (errorOutput) {
      console.log('Server error output:', errorOutput);
    }
  }

  if (output) {
    console.log('\nServer stdout:', output);
  }

  // Clean shutdown
  server.stdin.end();
  setTimeout(() => {
    server.kill();
    process.exit(0);
  }, 100);
}, 2000);

server.on('error', (err) => {
  console.error('❌ Failed to start server:', err);
  process.exit(1);
});
