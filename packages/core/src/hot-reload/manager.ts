/**
 * HotReloadManager (skeleton) — wires SmartWatcher and lays the groundwork
 * for dependency-aware module reloads and route hot swapping.
 */
import { EventEmitter } from 'node:events';
import path from 'node:path';
import { SmartWatcher, type SmartWatcherOptions, parseImports } from './smart-watcher.js';
import { ModuleReloader } from './module-reloader.js';
import { RouteSwapper, type RouteUpdate } from './route-swapper.js';
import { SyntaxValidator, type ValidationResult } from './syntax-validator.js';
import type { Router } from '../router.js';

export interface HotReloadOptions {
  enabled?: boolean;
  roots?: string[];
  debounceMs?: number;
  batchMs?: number;
  pollFallbackMs?: number;
  ignore?: (string | RegExp)[];
  validateSyntax?: boolean; // Pre-validate syntax before attempting reload
}

export interface ReloadEvents {
  started: () => void;
  reloading: (info: { files: string[] }) => void;
  reloaded: (info: { files: string[]; duration: number }) => void;
  'reload-error': (info: {
    files: string[];
    errors: Error[];
    duration: number;
    validationResults?: Map<string, ValidationResult>;
  }) => void;
  'syntax-error': (info: {
    files: string[];
    validationResults: Map<string, ValidationResult>;
  }) => void;
  stopped: () => void;
}

export class HotReloadManager extends EventEmitter {
  private watcher: SmartWatcher | undefined;
  private options: Required<Omit<HotReloadOptions, 'ignore'>> & { ignore: (string | RegExp)[] };
  private reloader = new ModuleReloader();
  private swapper = new RouteSwapper();
  private validator = new SyntaxValidator();
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
      validateSyntax: opts.validateSyntax ?? true, // Default to pre-validation
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
      let validationResults: Map<string, ValidationResult> | undefined;

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
                  (error as any).file = file;
                  (error as any).line = err.line;
                  (error as any).column = err.column;
                  (error as any).snippet = err.snippet;
                  (error as any).hint = err.hint;
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

        // Step 3: Swap routes if we have valid updates and no errors
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
        this.emit('reload-error', { files, errors, duration, validationResults });
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
