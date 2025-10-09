/**
 * HotReloadManager (skeleton) — wires SmartWatcher and lays the groundwork
 * for dependency-aware module reloads and route hot swapping.
 */
import { EventEmitter } from 'node:events';
import path from 'node:path';
import { SmartWatcher, parseImports } from './smart-watcher.js';
import { ModuleReloader } from './module-reloader.js';
import { RouteSwapper } from './route-swapper.js';
export class HotReloadManager extends EventEmitter {
    watcher;
    options;
    reloader = new ModuleReloader();
    swapper = new RouteSwapper();
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
            try {
                const results = await this.reloader.reloadMultiple(files);
                const updates = [];
                for (const [, res] of results) {
                    if (!res.success) {
                        if (res.error)
                            errors.push(res.error);
                        break;
                    }
                    const mod = res.module;
                    if (!mod)
                        continue;
                    // Convention: export const routes = [{ method, path, handlers }]
                    const routeDefs = (mod.routes || mod.default?.routes);
                    if (Array.isArray(routeDefs))
                        updates.push(...routeDefs);
                }
                if (this.router && updates.length) {
                    this.swapper.swapRoutes(this.router, updates);
                }
            }
            catch (e) {
                errors.push(e);
            }
            const duration = Date.now() - start;
            if (errors.length)
                this.emit('reload-error', { files, errors, duration });
            else
                this.emit('reloaded', { files, duration });
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