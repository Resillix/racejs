/**
 * Storage Implementations for Request Recorder
 *
 * Multiple storage backends using Strategy pattern:
 * - MemoryStorage: Fast development storage (default)
 * - FileStorage: Simple, backup-friendly
 */

import { RecordedRequest, RecorderStorage } from './recorder.js';
import type { DevLogger } from './logger.js';

/**
 * Storage configuration interface
 */
export interface StorageConfig {
  /** Storage type */
  type: 'memory' | 'file';

  /** Storage-specific options */
  options?: {
    /** File storage directory */
    directory?: string;

    /** Maximum number of requests to store */
    maxRequests?: number;
  };
}

/**
 * Storage query interface for advanced filtering
 */
export interface StorageQuery {
  /** Filter by HTTP method */
  method?: string;

  /** Filter by URL pattern */
  urlPattern?: string;

  /** Filter by status code */
  statusCode?: number;

  /** Filter by time range */
  timeRange?: {
    start: number;
    end: number;
  };

  /** Limit number of results */
  limit?: number;

  /** Offset for pagination */
  offset?: number;

  /** Sort by field */
  sortBy?: 'timestamp' | 'duration' | 'statusCode';

  /** Sort direction */
  sortOrder?: 'asc' | 'desc';
}

/**
 * Enhanced storage interface with querying capabilities
 */
export interface AdvancedRecorderStorage extends RecorderStorage {
  /** Query requests with filters */
  query(query: StorageQuery): Promise<RecordedRequest[]>;

  /** Count total requests with optional query */
  count(query?: Partial<StorageQuery>): Promise<number>;

  /** Get storage statistics */
  getStats(): Promise<{
    totalRequests: number;
    oldestRequest?: number | undefined;
    newestRequest?: number | undefined;
    storageSize?: number | undefined;
  }>;

  /** Close/cleanup storage */
  close(): Promise<void>;
}

/**
 * Memory Storage - Default implementation
 * Fast but not persistent, good for development
 */
export class MemoryStorage implements AdvancedRecorderStorage {
  private requests = new Map<string, RecordedRequest>();
  private maxRequests: number;
  private logger: DevLogger;

  constructor(config: StorageConfig, logger: DevLogger) {
    this.maxRequests = config.options?.maxRequests || 1000;
    this.logger = logger.child({ component: 'MemoryStorage' });

    this.logger.debug('Memory storage initialized', { maxRequests: this.maxRequests });
  }

  async store(request: RecordedRequest): Promise<void> {
    // Implement LRU eviction if needed
    if (this.requests.size >= this.maxRequests) {
      const oldestKey = this.requests.keys().next().value;
      if (oldestKey) {
        this.requests.delete(oldestKey);
        this.logger.debug('Evicted oldest request', { requestId: oldestKey });
      }
    }

    this.requests.set(request.id, request);
    this.logger.debug('Stored request', { requestId: request.id });
  }

  async get(id: string): Promise<RecordedRequest | null> {
    return this.requests.get(id) || null;
  }

  async getAll(): Promise<RecordedRequest[]> {
    return Array.from(this.requests.values());
  }

  async getRecent(limit: number): Promise<RecordedRequest[]> {
    const requests = Array.from(this.requests.values());
    return requests.sort((a, b) => b.timestamp - a.timestamp).slice(0, limit);
  }

  async clear(): Promise<void> {
    this.requests.clear();
    this.logger.debug('Cleared all requests');
  }

  async delete(id: string): Promise<boolean> {
    const deleted = this.requests.delete(id);
    if (deleted) {
      this.logger.debug('Deleted request', { requestId: id });
    }
    return deleted;
  }

  async count(query?: Partial<StorageQuery>): Promise<number> {
    if (!query) return this.requests.size;
    const results = await this.query(query as StorageQuery);
    return results.length;
  }

  async query(query: StorageQuery): Promise<RecordedRequest[]> {
    let results = Array.from(this.requests.values());

    // Apply filters
    if (query.method) {
      results = results.filter((r) => r.method === query.method);
    }

    if (query.urlPattern) {
      const regex = new RegExp(query.urlPattern);
      results = results.filter((r) => regex.test(r.url));
    }

    if (query.statusCode) {
      results = results.filter((r) => r.response?.statusCode === query.statusCode);
    }

    if (query.timeRange) {
      results = results.filter(
        (r) => r.timestamp >= query.timeRange!.start && r.timestamp <= query.timeRange!.end
      );
    }

    // Sort results
    if (query.sortBy) {
      results.sort((a, b) => {
        let aVal: number, bVal: number;

        switch (query.sortBy) {
          case 'timestamp':
            aVal = a.timestamp;
            bVal = b.timestamp;
            break;
          case 'duration':
            aVal = a.duration || 0;
            bVal = b.duration || 0;
            break;
          case 'statusCode':
            aVal = a.response?.statusCode || 0;
            bVal = b.response?.statusCode || 0;
            break;
          default:
            aVal = a.timestamp;
            bVal = b.timestamp;
        }

        const multiplier = query.sortOrder === 'desc' ? -1 : 1;
        return (aVal - bVal) * multiplier;
      });
    }

    // Apply pagination
    const offset = query.offset || 0;
    const limit = query.limit || results.length;
    return results.slice(offset, offset + limit);
  }

  async getStats() {
    const requests = Array.from(this.requests.values());
    const timestamps = requests.map((r) => r.timestamp).sort((a, b) => a - b);

    return {
      totalRequests: this.requests.size,
      oldestRequest: timestamps.length > 0 ? timestamps[0] : undefined,
      newestRequest: timestamps.length > 0 ? timestamps[timestamps.length - 1] : undefined,
    };
  }

  async close(): Promise<void> {
    // Nothing to close for memory storage
  }
}

/**
 * File Storage - Simple JSON file persistence
 * Good for small projects and easy debugging
 */
export class FileStorage implements AdvancedRecorderStorage {
  private filePath: string;
  private requests = new Map<string, RecordedRequest>();
  private logger: DevLogger;
  private maxRequests: number;
  private writeScheduled = false;

  constructor(config: StorageConfig, logger: DevLogger) {
    this.logger = logger.child({ component: 'FileStorage' });
    this.maxRequests = config.options?.maxRequests || 5000;

    const directory = config.options?.directory || './dev-requests';
    this.filePath = `${directory}/requests.json`;

    this.logger.debug('File storage initialized', {
      filePath: this.filePath,
      maxRequests: this.maxRequests,
    });

    // Load existing requests
    this.loadFromFile().catch((err) => {
      this.logger.error('Failed to load requests from file', { error: err.message });
    });
  }

  private async loadFromFile(): Promise<void> {
    try {
      const fs = await import('node:fs/promises');
      const content = await fs.readFile(this.filePath, 'utf-8');
      const data = JSON.parse(content) as RecordedRequest[];

      for (const request of data) {
        this.requests.set(request.id, request);
      }

      this.logger.debug('Loaded requests from file', { count: data.length });
    } catch (error: any) {
      if (error.code !== 'ENOENT') {
        throw error;
      }
      // File doesn't exist yet, that's fine
    }
  }

  private async saveToFile(): Promise<void> {
    if (this.writeScheduled) return;

    this.writeScheduled = true;

    // Debounce writes
    await new Promise((resolve) => setTimeout(resolve, 100));

    try {
      const fs = await import('node:fs/promises');
      const path = await import('node:path');

      // Ensure directory exists
      await fs.mkdir(path.dirname(this.filePath), { recursive: true });

      const data = Array.from(this.requests.values());
      await fs.writeFile(this.filePath, JSON.stringify(data, null, 2));

      this.logger.debug('Saved requests to file', { count: data.length });
    } catch (error: any) {
      this.logger.error('Failed to save requests to file', { error: error.message });
    } finally {
      this.writeScheduled = false;
    }
  }

  async store(request: RecordedRequest): Promise<void> {
    // Implement LRU eviction
    if (this.requests.size >= this.maxRequests) {
      const oldestKey = this.requests.keys().next().value;
      if (oldestKey) {
        this.requests.delete(oldestKey);
      }
    }

    this.requests.set(request.id, request);
    this.logger.debug('Stored request', { requestId: request.id });

    // Schedule save (debounced)
    this.saveToFile();
  }

  async get(id: string): Promise<RecordedRequest | null> {
    return this.requests.get(id) || null;
  }

  async getAll(): Promise<RecordedRequest[]> {
    return Array.from(this.requests.values());
  }

  async getRecent(limit: number): Promise<RecordedRequest[]> {
    const requests = Array.from(this.requests.values());
    return requests.sort((a, b) => b.timestamp - a.timestamp).slice(0, limit);
  }

  async clear(): Promise<void> {
    this.requests.clear();
    this.logger.debug('Cleared all requests');
    this.saveToFile();
  }

  async delete(id: string): Promise<boolean> {
    const deleted = this.requests.delete(id);
    if (deleted) {
      this.logger.debug('Deleted request', { requestId: id });
      this.saveToFile(); // Save immediately on delete
    }
    return deleted;
  }

  async count(query?: Partial<StorageQuery>): Promise<number> {
    if (!query) return this.requests.size;
    const results = await this.query(query as StorageQuery);
    return results.length;
  }

  async query(query: StorageQuery): Promise<RecordedRequest[]> {
    // Reuse memory storage query logic
    const memoryStorage = new MemoryStorage({ type: 'memory' }, this.logger);
    for (const request of this.requests.values()) {
      await memoryStorage.store(request);
    }
    return memoryStorage.query(query);
  }

  async getStats() {
    const fs = await import('node:fs/promises');
    let storageSize = 0;

    try {
      const stats = await fs.stat(this.filePath);
      storageSize = stats.size;
    } catch {
      // File doesn't exist yet
    }

    const requests = Array.from(this.requests.values());
    const timestamps = requests.map((r) => r.timestamp).sort((a, b) => a - b);

    return {
      totalRequests: this.requests.size,
      oldestRequest: timestamps.length > 0 ? timestamps[0] : undefined,
      newestRequest: timestamps.length > 0 ? timestamps[timestamps.length - 1] : undefined,
      storageSize,
    };
  }

  async close(): Promise<void> {
    await this.saveToFile();
  }
}

/**
 * Storage Factory - Creates appropriate storage instance
 */
export function createStorage(config: StorageConfig, logger: DevLogger): AdvancedRecorderStorage {
  switch (config.type) {
    case 'memory':
      return new MemoryStorage(config, logger);

    case 'file':
      return new FileStorage(config, logger);

    default:
      logger.warn('Unknown storage type, falling back to memory', { type: config.type });
      return new MemoryStorage(config, logger);
  }
}
