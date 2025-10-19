/**
 * Storage Implementations for Request Recorder
 *
 * Multiple storage backends using Strategy pattern:
 * - MemoryStorage: Fast development storage (default)
 * - FileStorage: Simple, backup-friendly
 */
/**
 * Memory Storage - Default implementation
 * Fast but not persistent, good for development
 */
export class MemoryStorage {
    requests = new Map();
    maxRequests;
    logger;
    constructor(config, logger) {
        this.maxRequests = config.options?.maxRequests || 1000;
        this.logger = logger.child({ component: 'MemoryStorage' });
        this.logger.debug('Memory storage initialized', { maxRequests: this.maxRequests });
    }
    async store(request) {
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
    async get(id) {
        return this.requests.get(id) || null;
    }
    async getAll() {
        return Array.from(this.requests.values());
    }
    async getRecent(limit) {
        const requests = Array.from(this.requests.values());
        return requests.sort((a, b) => b.timestamp - a.timestamp).slice(0, limit);
    }
    async clear() {
        this.requests.clear();
        this.logger.debug('Cleared all requests');
    }
    async delete(id) {
        const deleted = this.requests.delete(id);
        if (deleted) {
            this.logger.debug('Deleted request', { requestId: id });
        }
        return deleted;
    }
    async count(query) {
        if (!query)
            return this.requests.size;
        const results = await this.query(query);
        return results.length;
    }
    async query(query) {
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
            results = results.filter((r) => r.timestamp >= query.timeRange.start && r.timestamp <= query.timeRange.end);
        }
        // Sort results
        if (query.sortBy) {
            results.sort((a, b) => {
                let aVal, bVal;
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
    async close() {
        // Nothing to close for memory storage
    }
}
/**
 * File Storage - Simple JSON file persistence
 * Good for small projects and easy debugging
 */
export class FileStorage {
    filePath;
    requests = new Map();
    logger;
    maxRequests;
    writeScheduled = false;
    constructor(config, logger) {
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
    async loadFromFile() {
        try {
            const fs = await import('node:fs/promises');
            const content = await fs.readFile(this.filePath, 'utf-8');
            const data = JSON.parse(content);
            for (const request of data) {
                this.requests.set(request.id, request);
            }
            this.logger.debug('Loaded requests from file', { count: data.length });
        }
        catch (error) {
            if (error.code !== 'ENOENT') {
                throw error;
            }
            // File doesn't exist yet, that's fine
        }
    }
    async saveToFile() {
        if (this.writeScheduled)
            return;
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
        }
        catch (error) {
            this.logger.error('Failed to save requests to file', { error: error.message });
        }
        finally {
            this.writeScheduled = false;
        }
    }
    async store(request) {
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
    async get(id) {
        return this.requests.get(id) || null;
    }
    async getAll() {
        return Array.from(this.requests.values());
    }
    async getRecent(limit) {
        const requests = Array.from(this.requests.values());
        return requests.sort((a, b) => b.timestamp - a.timestamp).slice(0, limit);
    }
    async clear() {
        this.requests.clear();
        this.logger.debug('Cleared all requests');
        this.saveToFile();
    }
    async delete(id) {
        const deleted = this.requests.delete(id);
        if (deleted) {
            this.logger.debug('Deleted request', { requestId: id });
            this.saveToFile(); // Save immediately on delete
        }
        return deleted;
    }
    async count(query) {
        if (!query)
            return this.requests.size;
        const results = await this.query(query);
        return results.length;
    }
    async query(query) {
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
        }
        catch {
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
    async close() {
        await this.saveToFile();
    }
}
/**
 * Storage Factory - Creates appropriate storage instance
 */
export function createStorage(config, logger) {
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
//# sourceMappingURL=recorder-storage.js.map