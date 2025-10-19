/**
 * HotReloadManager (skeleton) — wires SmartWatcher and lays the groundwork
 * for dependency-aware module reloads and route hot swapping.
 */
import { EventEmitter } from 'node:events';
import path from 'node:path';
import { SmartWatcher, parseImports } from './smart-watcher.js';
import { ModuleReloader } from './module-reloader.js';
import { RouteSwapper } from './route-swapper.js';
import { SyntaxValidator } from './syntax-validator.js';
export class HotReloadManager extends EventEmitter {
    watcher;
    options;
    reloader = new ModuleReloader();
    swapper = new RouteSwapper();
    validator = new SyntaxValidator();
    router;
    constructor(opts = {}) {
        super();
        this.options = {
            enabled: opts.enabled ?? process.env.NODE_ENV !== 'production',
            roots: opts.roots ?? [path.resolve(process.cwd(), 'src')],
            debounceMs: opts.debounceMs ?? 75,
            batchMs: opts.batchMs ?? 120,
            pollFallbackMs: opts.pollFallbackMs ?? 0,
            ignore: opts.ignore ?? ['**/.git/**', '**/node_modules/**', '**/dist/**'],
            validateSyntax: opts.validateSyntax ?? true, // Default to pre-validation
        };
    }
    /** Attach app router for route hot swapping */
    setRouter(router) {
        this.router = router;
    }
    start() {
        if (!this.options.enabled || this.watcher)
            return;
        this.watcher = new SmartWatcher({
            roots: this.options.roots,
            debounceMs: this.options.debounceMs,
            batchMs: this.options.batchMs,
            pollFallbackMs: this.options.pollFallbackMs,
            ignore: this.options.ignore,
            hashMode: 'mtime',
            resolveDependencies: parseImports,
        });
        this.watcher.on('ready', () => {
            this.emit('started');
        });
        this.watcher.on('batch', async (batch) => {
            const files = batch.changes.map((c) => c.file);
            this.emit('reloading', { files });
            const start = Date.now();
            const errors = [];
            let validationResults;
            // Always wrap in try-catch to ensure watcher continues after errors
            try {
                // Step 1: Pre-validate syntax if enabled
                if (this.options.validateSyntax) {
                    validationResults = await this.validator.validateFiles(files);
                    // Check if any files have validation errors
                    const hasValidationErrors = Array.from(validationResults.values()).some((r) => !r.valid);
                    if (hasValidationErrors) {
                        // Emit syntax-error event with detailed validation results
                        this.emit('syntax-error', { files, validationResults });
                        // Also emit reload-error for backward compatibility
                        // Convert validation errors to Error objects
                        for (const [file, result] of validationResults) {
                            if (!result.valid) {
                                result.errors.forEach((err) => {
                                    const error = new Error(err.message);
                                    error.name = 'SyntaxError';
                                    error.file = file;
                                    error.line = err.line;
                                    error.column = err.column;
                                    error.snippet = err.snippet;
                                    error.hint = err.hint;
                                    errors.push(error);
                                });
                            }
                        }
                        const duration = Date.now() - start;
                        this.emit('reload-error', { files, errors, duration, validationResults });
                        return; // Don't attempt reload if validation failed
                    }
                }
                // Step 2: Attempt to reload modules (only if validation passed)
                const results = await this.reloader.reloadMultiple(files);
                const updates = [];
                for (const [, res] of results) {
                    if (!res.success) {
                        if (res.error)
                            errors.push(res.error);
                        // Don't break - continue trying other files
                        continue;
                    }
                    const mod = res.module;
                    if (!mod)
                        continue;
                    // Convention: export const routes = [{ method, path, handlers }]
                    const routeDefs = (mod.routes || mod.default?.routes);
                    if (Array.isArray(routeDefs))
                        updates.push(...routeDefs);
                }
                // Step 3: Swap routes if we have valid updates and no errors
                if (this.router && updates.length && errors.length === 0) {
                    try {
                        this.swapper.swapRoutes(this.router, updates);
                    }
                    catch (swapError) {
                        errors.push(swapError);
                    }
                }
            }
            catch (e) {
                // Catch any unexpected errors to prevent watcher from stopping
                errors.push(e);
            }
            const duration = Date.now() - start;
            // Always emit result - success or error
            if (errors.length > 0) {
                this.emit('reload-error', { files, errors, duration, validationResults });
            }
            else {
                this.emit('reloaded', { files, duration });
            }
            // Watcher continues regardless of errors - ready for next change
        });
        this.watcher.on('error', (e) => this.emit('reload-error', { files: [], errors: [e], duration: 0 }));
        void this.watcher.start();
    }
    /**
     * Get the active watcher backend
     */
    getActiveBackend() {
        return this.watcher?.getActiveBackend();
    }
    async stop() {
        if (!this.watcher)
            return;
        await this.watcher.close();
        this.watcher = undefined;
        this.emit('stopped');
    }
}
//# sourceMappingURL=manager.js.map