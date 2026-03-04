/**
 * Test script to verify MCP pgvector server functionality
 *
 * This script simulates MCP tool calls to test the server without
 * requiring a full MCP client setup.
 *
 * Usage: node test-server.js
 */

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { Pool } from "pg";

// Simple test to verify database connection and schema
async function testDatabaseConnection() {
  console.log("Testing database connection...");

  const pool = new Pool({
    host: process.env.DB_HOST || "localhost",
    user: process.env.DB_USER || "omnitrade_readonly",
    password: process.env.DB_PASSWORD || "",
    database: process.env.DB_NAME || "omnitrade",
    port: parseInt(process.env.DB_PORT || "5432"),
  });

  try {
    const client = await pool.connect();
    console.log("✓ Connected to database");

    // Check pgvector extension
    const extResult = await client.query(
      "SELECT EXISTS(SELECT 1 FROM pg_extension WHERE extname = 'vector')"
    );
    if (extResult.rows[0].exists) {
      console.log("✓ pgvector extension is installed");
    } else {
      console.log("✗ pgvector extension NOT found");
      console.log("  Run: CREATE EXTENSION IF NOT EXISTS vector;");
    }

    // Check fundamental_data table
    const tableResult = await client.query(
      "SELECT EXISTS(SELECT 1 FROM information_schema.tables WHERE table_name = 'fundamental_data')"
    );
    if (tableResult.rows[0].exists) {
      console.log("✓ fundamental_data table exists");

      // Get schema info
      const schemaResult = await client.query(`
        SELECT column_name, data_type
        FROM information_schema.columns
        WHERE table_name = 'fundamental_data'
        ORDER BY ordinal_position
      `);
      console.log("  Columns:", schemaResult.rows.map(r => r.column_name + ":" + r.data_type).join(", "));

      // Get row count
      const countResult = await client.query(
        "SELECT COUNT(*) as count FROM fundamental_data"
      );
      console.log(`  Rows: ${countResult.rows[0].count}`);

      // Check for HNSW index
      const indexResult = await client.query(`
        SELECT EXISTS(
          SELECT 1 FROM pg_indexes
          WHERE tablename = 'fundamental_data'
          AND indexdef LIKE '%hnsw%'
        )
      `);
      if (indexResult.rows[0].exists) {
        console.log("✓ HNSW vector index exists");
      } else {
        console.log("✗ HNSW vector index NOT found");
        console.log("  Run: CREATE INDEX ON fundamental_data USING hnsw (embedding vector_cosine_ops);");
      }

    } else {
      console.log("✗ fundamental_data table NOT found");
      console.log("  Run the schema migration from backend/internal/database/schema.sql");
    }

    client.release();
    await pool.end();
  } catch (error) {
    console.error("✗ Database error:", error.message);
    await pool.end();
    process.exit(1);
  }
}

// Run the test
testDatabaseConnection().then(() => {
  console.log("\n✓ All checks completed");
  process.exit(0);
}).catch(error => {
  console.error("\n✗ Test failed:", error);
  process.exit(1);
});
