#!/usr/bin/env node

/**
 * Quick start script for the Polygon.io MCP server
 * This script loads environment variables and starts the server
 */

import { config } from 'dotenv';
import { spawn } from 'child_process';

// Load environment variables from .env file
config();

// Verify API key is set
if (!process.env.POLYGON_API_KEY) {
  console.error('ERROR: POLYGON_API_KEY is not set in .env file');
  console.error('1. Copy .env.example to .env');
  console.error('2. Add your Polygon.io API key to the .env file');
  console.error('Get your API key from: https://polygon.io/');
  process.exit(1);
}

// Start the MCP server
console.error('Starting Polygon.io Market Data MCP Server...');
console.error('API Key:', process.env.POLYGON_API_KEY.substring(0, 10) + '...');

// Spawn the Node process with the built JavaScript
const serverProcess = spawn('node', ['dist/index.js'], {
  stdio: 'inherit',
  env: { ...process.env },
});

serverProcess.on('error', (error) => {
  console.error('Failed to start server:', error);
  process.exit(1);
});

serverProcess.on('exit', (code) => {
  console.error(`Server exited with code ${code}`);
  process.exit(code);
});
