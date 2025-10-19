/**
 * File-based Storage for RaceJS DevTools
 *
 * Stores all dev mode data in .racejs/ directory:
 * - .racejs/requests/       - Recorded HTTP requests
 * - .racejs/errors/         - Error logs
 * - .racejs/performance/    - Performance metrics
 * - .racejs/config.json     - Configuration
 *
 * Benefits:
 * - Persists across server restarts
 * - Fast lookups using file IDs
 * - Automatic cleanup of old data
 * - No memory bloat
 */
import { promises as fs } from 'node:fs';
import { join } from 'node:path';
import { existsSync } from 'node:fs';
/**
 * File-based storage implementation
 * Stores each request as a separate JSON file for fast access
 */
export class FileStorage {
    baseDir;
    requestsDir;
    indexFile;
    config;
    logger;
    cleanupInterval;
    index = new Map();
    initialized = false;
    constructor(config, logger) {
        this.config = {
            baseDir: config.baseDir || join(process.cwd(), '.racejs'),
            maxRequests: config.maxRequests || 1000,
            maxAge: config.maxAge || 24 * 60 * 60 * 1000, // 24 hours
            compress: config.compress || false,
            cleanupInterval: config.cleanupInterval || 5 * 60 * 1000, // 5 minutes
        };
        this.baseDir = this.config.baseDir;
        this.requestsDir = join(this.baseDir, 'requests');
        this.indexFile = join(this.baseDir, 'index.json');
        this.logger = logger.child({ component: 'FileStorage' });
    }
    /**
     * Initialize storage directories
     */
    async initialize() {
        if (this.initialized)
            return;
        try {
            // Create directories
            await this.ensureDir(this.baseDir);
            await this.ensureDir(this.requestsDir);
            // Load index
            await this.loadIndex();
            // Start cleanup interval
            this.cleanupInterval = setInterval(() => {
                this.cleanup().catch((err) => {
                    this.logger.error('Cleanup failed', { error: err.message });
                });
            }, this.config.cleanupInterval);
            this.initialized = true;
            this.logger.info('File storage initialized', {
                baseDir: this.baseDir,
                requestCount: this.index.size,
            });
        }
        catch (error) {
            this.logger.error('Failed to initialize storage', {
                error: error instanceof Error ? error.message : String(error),
            });
            throw error;
        }
    }
    /**
     * Store a request
     */
    async store(request) {
        if (!this.initialized)
            await this.initialize();
        try {
            // Ensure directories exist (in case they were deleted)
            await this.ensureDir(this.baseDir);
            await this.ensureDir(this.requestsDir);
            const filename = `${request.id}.json`;
            const filepath = join(this.requestsDir, filename);
            // Write request to file
            await fs.writeFile(filepath, JSON.stringify(request, null, 2), 'utf-8');
            // Update index
            this.index.set(request.id, {
                timestamp: request.timestamp,
                file: filename,
            });
            // Enforce max requests limit
            if (this.index.size > this.config.maxRequests) {
                await this.evictOldest();
            }
            // Persist index periodically
            await this.saveIndex();
            this.logger.debug('Stored request', { id: request.id, file: filename });
        }
        catch (error) {
            this.logger.error('Failed to store request', {
                id: request.id,
                error: error instanceof Error ? error.message : String(error),
            });
        }
    }
    /**
     * Get a request by ID
     */
    async get(id) {
        if (!this.initialized)
            await this.initialize();
        const entry = this.index.get(id);
        if (!entry)
            return null;
        try {
            const filepath = join(this.requestsDir, entry.file);
            const content = await fs.readFile(filepath, 'utf-8');
            return JSON.parse(content);
        }
        catch (error) {
            this.logger.error('Failed to read request', {
                id,
                error: error instanceof Error ? error.message : String(error),
            });
            // Remove from index if file doesn't exist
            this.index.delete(id);
            await this.saveIndex();
            return null;
        }
    }
    /**
     * Get all requests
     */
    async getAll() {
        if (!this.initialized)
            await this.initialize();
        const requests = [];
        for (const [id] of this.index) {
            const request = await this.get(id);
            if (request) {
                requests.push(request);
            }
        }
        return requests;
    }
    /**
     * Get recent requests
     */
    async getRecent(limit) {
        if (!this.initialized)
            await this.initialize();
        // Sort by timestamp descending
        const sorted = Array.from(this.index.entries())
            .sort((a, b) => b[1].timestamp - a[1].timestamp)
            .slice(0, limit);
        const requests = [];
        for (const [id] of sorted) {
            const request = await this.get(id);
            if (request) {
                requests.push(request);
            }
        }
        return requests;
    }
    /**
     * Clear all requests
     */
    async clear() {
        if (!this.initialized)
            await this.initialize();
        try {
            // Delete all request files
            for (const [, entry] of this.index) {
                const filepath = join(this.requestsDir, entry.file);
                try {
                    await fs.unlink(filepath);
                }
                catch {
                    // Ignore errors
                }
            }
            // Clear index
            this.index.clear();
            await this.saveIndex();
            this.logger.info('Cleared all requests');
        }
        catch (error) {
            this.logger.error('Failed to clear requests', {
                error: error instanceof Error ? error.message : String(error),
            });
        }
    }
    /**
     * Delete a specific request
     */
    async delete(id) {
        if (!this.initialized)
            await this.initialize();
        const entry = this.index.get(id);
        if (!entry)
            return false;
        try {
            const filepath = join(this.requestsDir, entry.file);
            await fs.unlink(filepath);
            this.index.delete(id);
            await this.saveIndex();
            this.logger.debug('Deleted request', { id });
            return true;
        }
        catch (error) {
            this.logger.error('Failed to delete request', {
                id,
                error: error instanceof Error ? error.message : String(error),
            });
            return false;
        }
    }
    /**
     * Get request count
     */
    count() {
        return this.index.size;
    }
    /**
     * Get storage statistics
     */
    async getStats() {
        if (!this.initialized)
            await this.initialize();
        let totalSize = 0;
        let oldestRequest = null;
        let newestRequest = null;
        for (const [, entry] of this.index) {
            if (!oldestRequest || entry.timestamp < oldestRequest) {
                oldestRequest = entry.timestamp;
            }
            if (!newestRequest || entry.timestamp > newestRequest) {
                newestRequest = entry.timestamp;
            }
            try {
                const filepath = join(this.requestsDir, entry.file);
                const stats = await fs.stat(filepath);
                totalSize += stats.size;
            }
            catch {
                // Ignore errors
            }
        }
        return {
            totalRequests: this.index.size,
            totalSize,
            oldestRequest,
            newestRequest,
        };
    }
    /**
     * Cleanup old requests
     */
    async cleanup() {
        const now = Date.now();
        const toDelete = [];
        for (const [id, entry] of this.index) {
            if (now - entry.timestamp > this.config.maxAge) {
                toDelete.push(id);
            }
        }
        if (toDelete.length > 0) {
            this.logger.info('Cleaning up old requests', { count: toDelete.length });
            for (const id of toDelete) {
                await this.delete(id);
            }
        }
    }
    /**
     * Evict oldest request (FIFO)
     */
    async evictOldest() {
        let oldestId = null;
        let oldestTimestamp = Infinity;
        for (const [id, entry] of this.index) {
            if (entry.timestamp < oldestTimestamp) {
                oldestTimestamp = entry.timestamp;
                oldestId = id;
            }
        }
        if (oldestId) {
            await this.delete(oldestId);
            this.logger.debug('Evicted oldest request', { id: oldestId });
        }
    }
    /**
     * Load index from file
     */
    async loadIndex() {
        try {
            if (existsSync(this.indexFile)) {
                const content = await fs.readFile(this.indexFile, 'utf-8');
                const data = JSON.parse(content);
                this.index = new Map(Object.entries(data));
                this.logger.debug('Loaded index', { count: this.index.size });
            }
        }
        catch (error) {
            this.logger.warn('Failed to load index, starting fresh', {
                error: error instanceof Error ? error.message : String(error),
            });
            this.index.clear();
        }
    }
    /**
     * Save index to file
     */
    async saveIndex() {
        try {
            const data = Object.fromEntries(this.index);
            await fs.writeFile(this.indexFile, JSON.stringify(data, null, 2), 'utf-8');
        }
        catch (error) {
            this.logger.error('Failed to save index', {
                error: error instanceof Error ? error.message : String(error),
            });
        }
    }
    /**
     * Ensure directory exists
     */
    async ensureDir(dir) {
        if (!existsSync(dir)) {
            await fs.mkdir(dir, { recursive: true });
        }
    }
    /**
     * Cleanup and close storage
     */
    async close() {
        if (this.cleanupInterval) {
            clearInterval(this.cleanupInterval);
        }
        await this.saveIndex();
        this.logger.info('File storage closed');
    }
    /**
     * Destroy storage (for testing)
     */
    async destroy() {
        await this.close();
        try {
            // Delete all files
            await fs.rm(this.baseDir, { recursive: true, force: true });
            this.logger.info('Storage destroyed');
        }
        catch (error) {
            this.logger.error('Failed to destroy storage', {
                error: error instanceof Error ? error.message : String(error),
            });
        }
    }
}
//# sourceMappingURL=file-storage.js.map