/**
 * Request Recorder - Time-travel debugging for HTTP requests
 *
 * Records all incoming requests with full details for replay and analysis
 */
/**
 * In-memory storage implementation
 * Includes automatic cleanup of old requests
 */
export class MemoryStorage {
    requests = new Map();
    maxRequests;
    maxAge; // Maximum age in milliseconds
    cleanupInterval;
    constructor(maxRequests = 1000, maxAge = 60 * 60 * 1000) {
        this.maxRequests = maxRequests;
        this.maxAge = maxAge; // Default 1 hour
        // Start automatic cleanup every 5 minutes
        this.cleanupInterval = setInterval(() => {
            this.cleanupOldRequests();
        }, 5 * 60 * 1000);
    }
    /**
     * Clean up requests older than maxAge
     */
    cleanupOldRequests() {
        const now = Date.now();
        let removedCount = 0;
        for (const [id, request] of this.requests.entries()) {
            if (now - request.timestamp > this.maxAge) {
                this.requests.delete(id);
                removedCount++;
            }
        }
        if (removedCount > 0) {
            console.log(`[MemoryStorage] Cleaned up ${removedCount} old requests`);
        }
    }
    /**
     * Stop cleanup interval (for graceful shutdown)
     */
    destroy() {
        if (this.cleanupInterval) {
            clearInterval(this.cleanupInterval);
        }
    }
    store(request) {
        // Enforce max limit (FIFO)
        if (this.requests.size >= this.maxRequests) {
            const firstKey = this.requests.keys().next().value;
            if (firstKey) {
                this.requests.delete(firstKey);
            }
        }
        this.requests.set(request.id, request);
    }
    get(id) {
        return this.requests.get(id) || null;
    }
    getAll() {
        return Array.from(this.requests.values());
    }
    getRecent(limit) {
        const all = this.getAll();
        return all.slice(-limit).reverse(); // Most recent first
    }
    clear() {
        this.requests.clear();
    }
    count() {
        return this.requests.size;
    }
    delete(id) {
        return this.requests.delete(id);
    }
}
/**
 * Generate unique request ID
 */
export function generateRequestId() {
    return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}
/**
 * Extract request body from IncomingMessage
 */
export async function extractBody(req) {
    return new Promise((resolve) => {
        const chunks = [];
        req.on('data', (chunk) => {
            chunks.push(chunk);
        });
        req.on('end', () => {
            if (chunks.length === 0) {
                resolve(undefined);
                return;
            }
            const buffer = Buffer.concat(chunks);
            const contentType = req.headers['content-type'] || '';
            // Parse JSON
            if (contentType.includes('application/json')) {
                try {
                    resolve(JSON.parse(buffer.toString()));
                }
                catch {
                    resolve(buffer.toString());
                }
                return;
            }
            // Parse form data
            if (contentType.includes('application/x-www-form-urlencoded')) {
                try {
                    const parsed = new URLSearchParams(buffer.toString());
                    const obj = {};
                    parsed.forEach((value, key) => {
                        obj[key] = value;
                    });
                    resolve(obj);
                }
                catch {
                    resolve(buffer.toString());
                }
                return;
            }
            // Default to string
            resolve(buffer.toString());
        });
        req.on('error', () => {
            resolve(undefined);
        });
    });
}
/**
 * Sanitize headers (remove sensitive data)
 */
export function sanitizeHeaders(headers, sensitiveKeys = ['authorization', 'cookie', 'x-api-key']) {
    const sanitized = {};
    for (const [key, value] of Object.entries(headers)) {
        const lowerKey = key.toLowerCase();
        if (sensitiveKeys.includes(lowerKey)) {
            sanitized[key] = '[REDACTED]';
        }
        else {
            sanitized[key] = value;
        }
    }
    return sanitized;
}
//# sourceMappingURL=recorder.js.map