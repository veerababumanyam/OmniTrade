/** FMP Data Hub — FMP API Client with Rate Limiting & Retries */

import { CategoryConfig } from './types.js';

const FMP_BASE_URL = 'https://financialmodelingprep.com/api';

export class FMPClient {
  private apiKey: string;
  private requestCount = 0;
  private lastRequestTime = 0;
  private minIntervalMs = 200; // 5 requests/sec max

  constructor(apiKey: string) {
    if (!apiKey) throw new Error('FMP_API_KEY is required');
    this.apiKey = apiKey;
  }

  /**
   * Build the full URL for a category, substituting {symbol} and date params
   */
  buildUrl(category: CategoryConfig, symbol: string): string {
    let endpoint = category.endpoint.replace(/{symbol}/g, symbol.toUpperCase());

    // Inject date range (last 2 years) for endpoints that require it
    if (endpoint.includes('{from}') || endpoint.includes('{to}')) {
      const to = new Date();
      const from = new Date();
      from.setFullYear(from.getFullYear() - 2);
      endpoint = endpoint
        .replace(/{from}/g, from.toISOString().split('T')[0])
        .replace(/{to}/g, to.toISOString().split('T')[0]);
    }

    const separator = endpoint.includes('?') ? '&' : '?';
    return `${FMP_BASE_URL}${endpoint}${separator}apikey=${this.apiKey}`;
  }

  /**
   * Fetch data for a specific category + symbol with rate limiting and retries
   */
  async fetch(category: CategoryConfig, symbol: string): Promise<any> {
    await this.rateLimit();
    const url = this.buildUrl(category, symbol);
    return this.fetchWithRetry(url, category.key, 3);
  }

  /**
   * Rate limiter: ensures minimum interval between requests
   */
  private async rateLimit(): Promise<void> {
    const now = Date.now();
    const elapsed = now - this.lastRequestTime;
    if (elapsed < this.minIntervalMs) {
      await new Promise((resolve) => setTimeout(resolve, this.minIntervalMs - elapsed));
    }
    this.lastRequestTime = Date.now();
    this.requestCount++;
  }

  /**
   * Fetch with exponential backoff retry
   */
  private async fetchWithRetry(url: string, categoryKey: string, retries: number): Promise<any> {
    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        const response = await fetch(url);

        if (response.status === 429) {
          const waitMs = Math.pow(2, attempt) * 1000;
          console.error(`  ⏳ Rate limited on ${categoryKey}, waiting ${waitMs}ms...`);
          await new Promise((resolve) => setTimeout(resolve, waitMs));
          continue;
        }

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const data = await response.json();

        // FMP returns error messages as JSON objects with "Error Message" key
        if (data && typeof data === 'object' && !Array.isArray(data) && data['Error Message']) {
          throw new Error(`FMP API Error: ${data['Error Message']}`);
        }

        return data;
      } catch (error) {
        if (attempt === retries) {
          throw error;
        }
        const waitMs = Math.pow(2, attempt) * 500;
        console.error(`  ⚠️  Attempt ${attempt}/${retries} failed for ${categoryKey}: ${error}. Retrying in ${waitMs}ms...`);
        await new Promise((resolve) => setTimeout(resolve, waitMs));
      }
    }
  }

  get totalRequests(): number {
    return this.requestCount;
  }
}
