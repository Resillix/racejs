/**
 * Error Storage - Persistence Layer for Aggregated Errors
 *
 * Provides storage interface and implementations for error persistence:
 * - MemoryErrorStorage (default, fast, volatile)
 * - FileErrorStorage (persistent, simple)
 * - Can be extended with Redis, SQLite, etc.
 *
 * Pattern: Strategy Pattern - different storage backends
 */
import * as fs from 'fs';
import * as path from 'path';
/**
 * In-memory error storage (default)
 *
 * Features:
 * - Fast (no I/O)
 * - Volatile (lost on restart)
 * - LRU eviction when limit reached
 * - Thread-safe (single-process)
 */
export class MemoryErrorStorage {
    errors = new Map();
    maxErrors;
    /**
     * Create new memory storage
     *
     * @param maxErrors - Maximum errors to store (default: 1000)
     */
    constructor(maxErrors = 1000) {
        this.maxErrors = maxErrors;
    }
    /**
     * Store error in memory
     */
    async store(error) {
        // If at capacity, remove oldest error (FIFO)
        if (this.errors.size >= this.maxErrors) {
            const firstKey = this.errors.keys().next().value;
            if (firstKey) {
                this.errors.delete(firstKey);
            }
        }
        this.errors.set(error.hash, error);
    }
    /**
     * Find error by hash
     */
    async find(hash) {
        return this.errors.get(hash) || null;
    }
    /**
     * List all errors with optional filtering
     */
    async list(filter) {
        let errors = Array.from(this.errors.values());
        if (!filter) {
            return errors;
        }
        // Apply filters
        if (filter.status) {
            errors = errors.filter((e) => e.status === filter.status);
        }
        if (filter.severity) {
            errors = errors.filter((e) => e.severity === filter.severity);
        }
        if (filter.route) {
            const route = filter.route;
            errors = errors.filter((e) => e.routes.has(route));
        }
        if (filter.type) {
            errors = errors.filter((e) => e.type === filter.type);
        }
        if (filter.fromDate !== undefined) {
            const fromDate = filter.fromDate;
            errors = errors.filter((e) => e.firstSeen >= fromDate);
        }
        if (filter.toDate !== undefined) {
            const toDate = filter.toDate;
            errors = errors.filter((e) => e.lastSeen <= toDate);
        }
        if (filter.minCount !== undefined) {
            const minCount = filter.minCount;
            errors = errors.filter((e) => e.count >= minCount);
        }
        if (filter.search) {
            const searchLower = filter.search.toLowerCase();
            errors = errors.filter((e) => e.message.toLowerCase().includes(searchLower) ||
                e.stack.toLowerCase().includes(searchLower));
        }
        return errors;
    }
    /**
     * Update an error
     */
    async update(hash, updates) {
        const error = this.errors.get(hash);
        if (error) {
            this.errors.set(hash, { ...error, ...updates });
        }
    }
    /**
     * Delete an error
     */
    async delete(hash) {
        this.errors.delete(hash);
    }
    /**
     * Clear all errors
     */
    async clear() {
        this.errors.clear();
    }
    /**
     * Get error count
     */
    async count() {
        return this.errors.size;
    }
    /**
     * Get all errors (for export)
     */
    getAll() {
        return Array.from(this.errors.values());
    }
}
/**
 * File-based error storage (persistent)
 *
 * Features:
 * - Persistent (survives restart)
 * - Simple (JSON file)
 * - Slower than memory
 * - Good for development
 */
export class FileErrorStorage {
    filePath;
    cache = new Map();
    isDirty = false;
    saveInterval = null;
    /**
     * Create new file storage
     *
     * @param filePath - Path to JSON file (default: .racejs/errors.json)
     */
    constructor(filePath) {
        this.filePath = filePath || path.join(process.cwd(), '.racejs', 'errors.json');
        this.loadFromFile();
        // Auto-save every 30 seconds if dirty
        this.saveInterval = setInterval(() => {
            if (this.isDirty) {
                this.saveToFile();
            }
        }, 30000);
    }
    /**
     * Load errors from file on startup
     */
    loadFromFile() {
        try {
            if (fs.existsSync(this.filePath)) {
                const data = fs.readFileSync(this.filePath, 'utf8');
                const errors = JSON.parse(data);
                for (const error of errors) {
                    // Reconstruct Map objects
                    error.routes = new Map(Object.entries(error.routes));
                    this.cache.set(error.hash, error);
                }
            }
        }
        catch (error) {
            console.error('Failed to load errors from file:', error);
        }
    }
    /**
     * Save errors to file
     */
    saveToFile() {
        try {
            const dir = path.dirname(this.filePath);
            if (!fs.existsSync(dir)) {
                fs.mkdirSync(dir, { recursive: true });
            }
            const errors = Array.from(this.cache.values()).map((error) => ({
                ...error,
                routes: Object.fromEntries(error.routes),
            }));
            fs.writeFileSync(this.filePath, JSON.stringify(errors, null, 2), 'utf8');
            this.isDirty = false;
        }
        catch (error) {
            console.error('Failed to save errors to file:', error);
        }
    }
    /**
     * Store error
     */
    async store(error) {
        this.cache.set(error.hash, error);
        this.isDirty = true;
    }
    /**
     * Find error
     */
    async find(hash) {
        return this.cache.get(hash) || null;
    }
    /**
     * List errors with filtering (same as MemoryErrorStorage)
     */
    async list(filter) {
        let errors = Array.from(this.cache.values());
        if (!filter) {
            return errors;
        }
        // Apply filters (same logic as MemoryErrorStorage)
        if (filter.status) {
            errors = errors.filter((e) => e.status === filter.status);
        }
        if (filter.severity) {
            errors = errors.filter((e) => e.severity === filter.severity);
        }
        if (filter.route) {
            const route = filter.route;
            errors = errors.filter((e) => e.routes.has(route));
        }
        if (filter.type) {
            errors = errors.filter((e) => e.type === filter.type);
        }
        if (filter.fromDate !== undefined) {
            const fromDate = filter.fromDate;
            errors = errors.filter((e) => e.firstSeen >= fromDate);
        }
        if (filter.toDate !== undefined) {
            const toDate = filter.toDate;
            errors = errors.filter((e) => e.lastSeen <= toDate);
        }
        if (filter.minCount !== undefined) {
            const minCount = filter.minCount;
            errors = errors.filter((e) => e.count >= minCount);
        }
        if (filter.search) {
            const searchLower = filter.search.toLowerCase();
            errors = errors.filter((e) => e.message.toLowerCase().includes(searchLower) ||
                e.stack.toLowerCase().includes(searchLower));
        }
        return errors;
    }
    /**
     * Update error
     */
    async update(hash, updates) {
        const error = this.cache.get(hash);
        if (error) {
            this.cache.set(hash, { ...error, ...updates });
            this.isDirty = true;
        }
    }
    /**
     * Delete error
     */
    async delete(hash) {
        this.cache.delete(hash);
        this.isDirty = true;
    }
    /**
     * Clear all errors
     */
    async clear() {
        this.cache.clear();
        this.isDirty = true;
        this.saveToFile();
    }
    /**
     * Get error count
     */
    async count() {
        return this.cache.size;
    }
    /**
     * Cleanup - save and stop auto-save interval
     */
    destroy() {
        if (this.saveInterval) {
            clearInterval(this.saveInterval);
            this.saveInterval = null;
        }
        if (this.isDirty) {
            this.saveToFile();
        }
    }
}
/**
 * Create default error storage based on environment
 *
 * @param type - Storage type ('memory' or 'file')
 * @param options - Storage-specific options
 * @returns ErrorStorage instance
 */
export function createErrorStorage(type = 'memory', options) {
    switch (type) {
        case 'file':
            return new FileErrorStorage(options?.filePath);
        case 'memory':
        default:
            return new MemoryErrorStorage(options?.maxErrors);
    }
}
//# sourceMappingURL=error-storage.js.map