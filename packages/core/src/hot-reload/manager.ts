/**
 * HotReloadManager (skeleton) — wires SmartWatcher and lays the groundwork
 * for dependency-aware module reloads and route hot swapping.
 */
import { EventEmitter } from 'node:events';
import path from 'node:path';
import { SmartWatcher, type SmartWatcherOptions, parseImports } from './smart-watcher.js';
import { ModuleReloader } from './module-reloader.js';
import { RouteSwapper, type RouteUpdate } from './route-swapper.js';
import type { Router } from '../router.js';

export interface HotReloadOptions {
  enabled?: boolean;
  roots?: string[];
  debounceMs?: number;
  batchMs?: number;
  pollFallbackMs?: number;
  ignore?: (string | RegExp)[];
}

export interface ReloadEvents {
  started: () => void;
  reloading: (info: { files: string[] }) => void;
  reloaded: (info: { files: string[]; duration: number }) => void;
  'reload-error': (info: { files: string[]; errors: Error[]; duration: number }) => void;
  stopped: () => void;
}

export class HotReloadManager extends EventEmitter {
  private watcher: SmartWatcher | undefined;
  private options: Required<Omit<HotReloadOptions, 'ignore'>> & { ignore: (string | RegExp)[] };
  private reloader = new ModuleReloader();
  private swapper = new RouteSwapper();
  private router: Router | undefined;

  constructor(opts: HotReloadOptions = {}) {
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
  setRouter(router: Router): void {
    this.router = router;
  }

  start(): void {
    if (!this.options.enabled || this.watcher) return;

    this.watcher = new SmartWatcher({
      roots: this.options.roots,
      debounceMs: this.options.debounceMs,
      batchMs: this.options.batchMs,
      pollFallbackMs: this.options.pollFallbackMs,
      ignore: this.options.ignore,
      hashMode: 'mtime',
      resolveDependencies: parseImports,
    } satisfies SmartWatcherOptions);

    this.watcher.on('ready', () => {
      this.emit('started');
    });

    this.watcher.on('batch', async (batch) => {
      const files = batch.changes.map((c) => c.file);
      this.emit('reloading', { files });
      const start = Date.now();

      const errors: Error[] = [];

      // Always wrap in try-catch to ensure watcher continues after errors
      try {
        const results = await this.reloader.reloadMultiple(files);
        const updates: RouteUpdate[] = [];

        for (const [, res] of results) {
          if (!res.success) {
            if (res.error) errors.push(res.error);
            // Don't break - continue trying other files
            continue;
          }
          const mod = res.module;
          if (!mod) continue;

          // Convention: export const routes = [{ method, path, handlers }]
          const routeDefs = (mod.routes || mod.default?.routes) as RouteUpdate[] | undefined;
          if (Array.isArray(routeDefs)) updates.push(...routeDefs);
        }

        // Only swap routes if we have valid updates and no errors
        if (this.router && updates.length && errors.length === 0) {
          try {
            this.swapper.swapRoutes(this.router, updates);
          } catch (swapError) {
            errors.push(swapError as Error);
          }
        }
      } catch (e) {
        // Catch any unexpected errors to prevent watcher from stopping
        errors.push(e as Error);
      }

      const duration = Date.now() - start;

      // Always emit result - success or error
      if (errors.length > 0) {
        this.emit('reload-error', { files, errors, duration });
      } else {
        this.emit('reloaded', { files, duration });
      }

      // Watcher continues regardless of errors - ready for next change
    });

    this.watcher.on('error', (e) =>
      this.emit('reload-error', { files: [], errors: [e as Error], duration: 0 })
    );

    void this.watcher.start();
  }

  /**
   * Get the active watcher backend
   */
  getActiveBackend(): string | undefined {
    return this.watcher?.getActiveBackend();
  }

  async stop(): Promise<void> {
    if (!this.watcher) return;
    await this.watcher.close();
    this.watcher = undefined;
    this.emit('stopped');
  }
}
