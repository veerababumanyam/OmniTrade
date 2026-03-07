/** FMP Data Hub — Type Definitions */

export interface CategoryConfig {
  key: string;
  endpoint: string;
  ttlSeconds: number;
  description: string;
  group: 'core' | 'intelligence' | 'historical' | 'events';
}

export interface SyncResult {
  symbol: string;
  category: string;
  status: 'fetched' | 'cached' | 'skipped' | 'error';
  dataHash?: string;
  recordCount?: number;
  error?: string;
  durationMs: number;
}

export interface SyncSummary {
  symbol: string;
  totalCategories: number;
  fetched: number;
  cached: number;
  skipped: number;
  errors: number;
  totalDurationMs: number;
  results: SyncResult[];
}

export interface SyncMetadata {
  symbol: string;
  category: string;
  lastSyncedAt: Date | null;
  lastDataHash: string | null;
  syncCount: number;
  ttlSeconds: number;
  lastError: string | null;
}

export interface StoredData {
  id: number;
  symbol: string;
  category: string;
  data: any;
  dataHash: string;
  fetchedAt: Date;
  updatedAt: Date;
}

export interface CLIOptions {
  symbols: string[];
  force: boolean;
  category?: string;
  showStatus: boolean;
  verbose: boolean;
}
