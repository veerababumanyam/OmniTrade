#!/usr/bin/env node
/**
 * FMP Data Hub — CLI Sync Entry Point
 *
 * Usage:
 *   npx tsx src/sync.ts AAPL                    # Full sync (differential on repeat)
 *   npx tsx src/sync.ts AAPL MSFT NVDA          # Multi-ticker
 *   npx tsx src/sync.ts AAPL --force            # Force refresh all categories
 *   npx tsx src/sync.ts AAPL --category=quote   # Single category only
 *   npx tsx src/sync.ts --status AAPL           # Show sync status
 *   npx tsx src/sync.ts AAPL --verbose          # Verbose output
 */

import * as dotenv from 'dotenv';
dotenv.config({ path: '../../.env' });

import { FMPClient } from './fmp-client.js';
import { RedisCache } from './redis-cache.js';
import { PGStore } from './pg-store.js';
import { CATEGORIES, getCategoryByKey } from './categories.js';
import { CLIOptions, SyncResult, SyncSummary, CategoryConfig } from './types.js';

// ── Parse CLI Arguments ───────────────────────────────
function parseArgs(argv: string[]): CLIOptions {
  const args = argv.slice(2);
  const options: CLIOptions = {
    symbols: [],
    force: false,
    showStatus: false,
    verbose: false,
  };

  for (const arg of args) {
    if (arg === '--force') {
      options.force = true;
    } else if (arg === '--status') {
      options.showStatus = true;
    } else if (arg === '--verbose') {
      options.verbose = true;
    } else if (arg.startsWith('--category=')) {
      options.category = arg.split('=')[1];
    } else if (!arg.startsWith('-')) {
      options.symbols.push(arg.toUpperCase());
    }
  }

  return options;
}

// ── Show Sync Status ──────────────────────────────────
async function showStatus(pgStore: PGStore, symbols: string[]): Promise<void> {
  for (const symbol of symbols) {
    const metadata = await pgStore.getSyncStatus(symbol);
    console.log(`\n📊 Sync Status for ${symbol}`);
    console.log('─'.repeat(90));
    console.log(
      'Category'.padEnd(28) +
      'Last Synced'.padEnd(24) +
      'Syncs'.padEnd(8) +
      'TTL'.padEnd(10) +
      'Status'
    );
    console.log('─'.repeat(90));

    if (metadata.length === 0) {
      console.log('  No data synced yet. Run: npx tsx src/sync.ts ' + symbol);
      continue;
    }

    for (const meta of metadata) {
      const age = meta.lastSyncedAt
        ? Math.round((Date.now() - new Date(meta.lastSyncedAt).getTime()) / 1000)
        : null;
      const stale = age !== null && age >= meta.ttlSeconds;
      const status = meta.lastError
        ? `❌ ${meta.lastError.substring(0, 30)}`
        : stale
          ? '🔄 Stale'
          : '✅ Fresh';
      const ageStr = age !== null ? formatDuration(age) + ' ago' : 'Never';
      const ttlStr = formatDuration(meta.ttlSeconds);

      console.log(
        meta.category.padEnd(28) +
        ageStr.padEnd(24) +
        String(meta.syncCount).padEnd(8) +
        ttlStr.padEnd(10) +
        status
      );
    }

    // Show categories not yet synced
    const syncedKeys = new Set(metadata.map((m) => m.category));
    const missing = CATEGORIES.filter((c) => !syncedKeys.has(c.key));
    if (missing.length > 0) {
      console.log(`\n  ⚠️  ${missing.length} categories not yet synced: ${missing.map((c) => c.key).join(', ')}`);
    }
  }
}

// ── Sync a Single Symbol ──────────────────────────────
async function syncSymbol(
  symbol: string,
  fmp: FMPClient,
  redis: RedisCache,
  pgStore: PGStore,
  options: CLIOptions
): Promise<SyncSummary> {
  const startTime = Date.now();
  const results: SyncResult[] = [];

  // Determine which categories to sync
  let categoriesToSync: CategoryConfig[];
  if (options.category) {
    const cat = getCategoryByKey(options.category);
    if (!cat) {
      console.error(`❌ Unknown category: ${options.category}`);
      console.error(`   Available: ${CATEGORIES.map((c) => c.key).join(', ')}`);
      process.exit(1);
    }
    categoriesToSync = [cat];
  } else {
    categoriesToSync = CATEGORIES;
  }

  console.log(`\n🔄 Syncing ${symbol} — ${categoriesToSync.length} categories${options.force ? ' (FORCE)' : ''}`);
  console.log('─'.repeat(70));

  for (const category of categoriesToSync) {
    const catStart = Date.now();

    try {
      // Check if we can skip (not stale AND not forced)
      if (!options.force) {
        // Check Redis first
        const cached = await redis.get(symbol, category.key);
        if (cached) {
          results.push({
            symbol,
            category: category.key,
            status: 'cached',
            durationMs: Date.now() - catStart,
          });
          if (options.verbose) console.log(`  ⚡ ${category.key.padEnd(28)} cached (Redis)`);
          continue;
        }

        // Check PostgreSQL staleness
        const stale = await pgStore.isStale(symbol, category.key, category.ttlSeconds);
        if (!stale) {
          // Data exists and is fresh — load from DB and populate Redis
          const stored = await pgStore.getData(symbol, category.key);
          if (stored) {
            await redis.set(symbol, category.key, stored.data, category.ttlSeconds);
            results.push({
              symbol,
              category: category.key,
              status: 'cached',
              durationMs: Date.now() - catStart,
            });
            if (options.verbose) console.log(`  💾 ${category.key.padEnd(28)} cached (PostgreSQL → Redis)`);
            continue;
          }
        }
      } else {
        // Force mode: clear Redis cache
        await redis.del(symbol, category.key);
      }

      // Fetch from FMP
      if (options.verbose) process.stdout.write(`  🌐 ${category.key.padEnd(28)} fetching...`);
      const data = await fmp.fetch(category, symbol);

      // Determine record count
      const recordCount = Array.isArray(data) ? data.length : 1;

      // Store in PostgreSQL (with hash-based diff)
      const updated = await pgStore.upsert(symbol, category.key, data, category.ttlSeconds);

      // Store in Redis cache
      await redis.set(symbol, category.key, data, category.ttlSeconds);

      const durationMs = Date.now() - catStart;
      results.push({
        symbol,
        category: category.key,
        status: 'fetched',
        dataHash: PGStore.hashData(data),
        recordCount,
        durationMs,
      });

      if (options.verbose) {
        process.stdout.write(`\r  ✅ ${category.key.padEnd(28)} ${recordCount} records, ${durationMs}ms${updated ? '' : ' (unchanged)'}\n`);
      } else {
        console.log(`  ✅ ${category.key.padEnd(28)} ${recordCount} records ${durationMs}ms${updated ? '' : ' (=)'}`);
      }
    } catch (error) {
      const errMsg = error instanceof Error ? error.message : String(error);
      const durationMs = Date.now() - catStart;

      await pgStore.recordError(symbol, category.key, errMsg, category.ttlSeconds);

      results.push({
        symbol,
        category: category.key,
        status: 'error',
        error: errMsg,
        durationMs,
      });

      console.error(`  ❌ ${category.key.padEnd(28)} ${errMsg}`);
    }
  }

  const totalDurationMs = Date.now() - startTime;
  const summary: SyncSummary = {
    symbol,
    totalCategories: categoriesToSync.length,
    fetched: results.filter((r) => r.status === 'fetched').length,
    cached: results.filter((r) => r.status === 'cached').length,
    skipped: results.filter((r) => r.status === 'skipped').length,
    errors: results.filter((r) => r.status === 'error').length,
    totalDurationMs,
    results,
  };

  console.log('─'.repeat(70));
  console.log(
    `📊 ${symbol}: ${summary.fetched} fetched, ${summary.cached} cached, ${summary.errors} errors — ${(totalDurationMs / 1000).toFixed(1)}s total`
  );

  return summary;
}

// ── Utility: Format Duration ──────────────────────────
function formatDuration(seconds: number): string {
  if (seconds < 60) return `${seconds}s`;
  if (seconds < 3600) return `${Math.round(seconds / 60)}m`;
  if (seconds < 86400) return `${Math.round(seconds / 3600)}h`;
  return `${Math.round(seconds / 86400)}d`;
}

// ── Main ──────────────────────────────────────────────
async function main(): Promise<void> {
  const options = parseArgs(process.argv);

  if (options.symbols.length === 0) {
    console.log(`
╔══════════════════════════════════════════════════════════╗
║            FMP Data Hub — OmniTrade                      ║
║  Comprehensive financial data ingestion from FMP API     ║
╚══════════════════════════════════════════════════════════╝

Usage:
  npx tsx src/sync.ts <SYMBOLS...> [options]

Options:
  --force              Force refresh all categories (bypass cache)
  --category=<key>     Sync only a specific category
  --status             Show sync status instead of syncing
  --verbose            Verbose output

Examples:
  npx tsx src/sync.ts AAPL                    # Sync Apple
  npx tsx src/sync.ts AAPL MSFT NVDA          # Sync multiple
  npx tsx src/sync.ts AAPL --force            # Force refresh
  npx tsx src/sync.ts AAPL --category=quote   # Only quote data
  npx tsx src/sync.ts --status AAPL           # Check freshness

Categories (${CATEGORIES.length}):
  ${CATEGORIES.map((c) => c.key).join(', ')}
`);
    process.exit(0);
  }

  // Load API key
  const apiKey = process.env.FMP_API_KEY;
  if (!apiKey) {
    console.error('❌ FMP_API_KEY environment variable is required');
    console.error('   Set it in .env or: FMP_API_KEY=xxx npx tsx src/sync.ts AAPL');
    process.exit(1);
  }

  // Initialize connections
  const fmp = new FMPClient(apiKey);
  const redis = new RedisCache();
  const pgStore = new PGStore();

  try {
    await redis.connect();
    await pgStore.connect();

    if (options.showStatus) {
      await showStatus(pgStore, options.symbols);
    } else {
      const summaries: SyncSummary[] = [];
      for (const symbol of options.symbols) {
        const summary = await syncSymbol(symbol, fmp, redis, pgStore, options);
        summaries.push(summary);
      }

      // Print grand total if multiple symbols
      if (summaries.length > 1) {
        const totalFetched = summaries.reduce((s, r) => s + r.fetched, 0);
        const totalCached = summaries.reduce((s, r) => s + r.cached, 0);
        const totalErrors = summaries.reduce((s, r) => s + r.errors, 0);
        const totalTime = summaries.reduce((s, r) => s + r.totalDurationMs, 0);

        console.log(`\n${'═'.repeat(70)}`);
        console.log(
          `🏁 Total: ${summaries.length} symbols, ${totalFetched} fetched, ${totalCached} cached, ${totalErrors} errors — ${(totalTime / 1000).toFixed(1)}s`
        );
        console.log(`   FMP API calls made: ${fmp.totalRequests}`);
      }
    }
  } finally {
    await redis.close();
    await pgStore.close();
  }
}

main().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
