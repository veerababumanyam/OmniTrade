/** FMP Data Hub — PostgreSQL Persistence Layer */

import { Pool } from 'pg';
import crypto from 'crypto';
import { SyncMetadata, StoredData } from './types.js';

export class PGStore {
  private pool: Pool;

  constructor(databaseUrl?: string) {
    const connStr = databaseUrl || process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/omnitrade';
    this.pool = new Pool({ connectionString: connStr });
  }

  async connect(): Promise<void> {
    const client = await this.pool.connect();
    console.error('✅ PostgreSQL connected');
    client.release();
  }

  /**
   * Compute SHA-256 hash of data for differential comparison
   */
  static hashData(data: any): string {
    const str = JSON.stringify(data, Object.keys(data).sort());
    return crypto.createHash('sha256').update(str).digest('hex');
  }

  /**
   * Upsert data for a (symbol, category) pair.
   * Returns true if data was actually updated (hash changed), false if skipped.
   */
  async upsert(symbol: string, category: string, data: any, ttlSeconds: number): Promise<boolean> {
    const upperSymbol = symbol.toUpperCase();
    const dataHash = PGStore.hashData(data);

    // Check if existing data has the same hash (no change)
    const existing = await this.pool.query(
      'SELECT data_hash FROM fmp_ticker_data WHERE symbol = $1 AND category = $2',
      [upperSymbol, category]
    );

    if (existing.rows.length > 0 && existing.rows[0].data_hash === dataHash) {
      // Data unchanged — update sync metadata only
      await this.updateSyncMeta(upperSymbol, category, dataHash, ttlSeconds, null);
      return false;
    }

    // Upsert the data
    await this.pool.query(
      `INSERT INTO fmp_ticker_data (symbol, category, data, data_hash, fetched_at, updated_at)
       VALUES ($1, $2, $3, $4, NOW(), NOW())
       ON CONFLICT (symbol, category)
       DO UPDATE SET data = $3, data_hash = $4, fetched_at = NOW(), updated_at = NOW()`,
      [upperSymbol, category, JSON.stringify(data), dataHash]
    );

    // Update sync metadata
    await this.updateSyncMeta(upperSymbol, category, dataHash, ttlSeconds, null);
    return true;
  }

  /**
   * Update sync metadata after a fetch attempt
   */
  async updateSyncMeta(
    symbol: string,
    category: string,
    dataHash: string,
    ttlSeconds: number,
    error: string | null
  ): Promise<void> {
    await this.pool.query(
      `INSERT INTO fmp_sync_metadata (symbol, category, last_synced_at, last_data_hash, sync_count, ttl_seconds, last_error)
       VALUES ($1, $2, NOW(), $3, 1, $4, $5)
       ON CONFLICT (symbol, category)
       DO UPDATE SET last_synced_at = NOW(), last_data_hash = $3, sync_count = fmp_sync_metadata.sync_count + 1, ttl_seconds = $4, last_error = $5`,
      [symbol, category, dataHash, ttlSeconds, error]
    );
  }

  /**
   * Record a sync error for a category
   */
  async recordError(symbol: string, category: string, error: string, ttlSeconds: number): Promise<void> {
    await this.pool.query(
      `INSERT INTO fmp_sync_metadata (symbol, category, last_synced_at, last_data_hash, sync_count, ttl_seconds, last_error)
       VALUES ($1, $2, NOW(), '', 1, $3, $4)
       ON CONFLICT (symbol, category)
       DO UPDATE SET last_synced_at = NOW(), sync_count = fmp_sync_metadata.sync_count + 1, ttl_seconds = $3, last_error = $4`,
      [symbol.toUpperCase(), category, ttlSeconds, error]
    );
  }

  /**
   * Check if a category needs refresh based on TTL
   */
  async isStale(symbol: string, category: string, ttlSeconds: number): Promise<boolean> {
    const result = await this.pool.query(
      `SELECT last_synced_at FROM fmp_sync_metadata WHERE symbol = $1 AND category = $2`,
      [symbol.toUpperCase(), category]
    );

    if (result.rows.length === 0) return true; // Never synced

    const lastSynced = new Date(result.rows[0].last_synced_at);
    const ageSeconds = (Date.now() - lastSynced.getTime()) / 1000;
    return ageSeconds >= ttlSeconds;
  }

  /**
   * Get sync metadata for all categories of a symbol
   */
  async getSyncStatus(symbol: string): Promise<SyncMetadata[]> {
    const result = await this.pool.query(
      `SELECT symbol, category, last_synced_at, last_data_hash, sync_count, ttl_seconds, last_error
       FROM fmp_sync_metadata WHERE symbol = $1 ORDER BY category`,
      [symbol.toUpperCase()]
    );

    return result.rows.map((row) => ({
      symbol: row.symbol,
      category: row.category,
      lastSyncedAt: row.last_synced_at,
      lastDataHash: row.last_data_hash,
      syncCount: row.sync_count,
      ttlSeconds: row.ttl_seconds,
      lastError: row.last_error,
    }));
  }

  /**
   * Get stored data for a symbol + category
   */
  async getData(symbol: string, category: string): Promise<StoredData | null> {
    const result = await this.pool.query(
      `SELECT id, symbol, category, data, data_hash, fetched_at, updated_at
       FROM fmp_ticker_data WHERE symbol = $1 AND category = $2`,
      [symbol.toUpperCase(), category]
    );

    if (result.rows.length === 0) return null;
    const row = result.rows[0];
    return {
      id: row.id,
      symbol: row.symbol,
      category: row.category,
      data: row.data,
      dataHash: row.data_hash,
      fetchedAt: row.fetched_at,
      updatedAt: row.updated_at,
    };
  }

  /**
   * Get all stored data for a symbol
   */
  async getAllData(symbol: string): Promise<StoredData[]> {
    const result = await this.pool.query(
      `SELECT id, symbol, category, data, data_hash, fetched_at, updated_at
       FROM fmp_ticker_data WHERE symbol = $1 ORDER BY category`,
      [symbol.toUpperCase()]
    );

    return result.rows.map((row) => ({
      id: row.id,
      symbol: row.symbol,
      category: row.category,
      data: row.data,
      dataHash: row.data_hash,
      fetchedAt: row.fetched_at,
      updatedAt: row.updated_at,
    }));
  }

  async close(): Promise<void> {
    await this.pool.end();
  }
}
