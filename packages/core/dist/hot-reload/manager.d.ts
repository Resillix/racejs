/**
 * HotReloadManager (skeleton) — wires SmartWatcher and lays the groundwork
 * for dependency-aware module reloads and route hot swapping.
 */
import { EventEmitter } from 'node:events';
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
    reloading: (info: {
        files: string[];
    }) => void;
    reloaded: (info: {
        files: string[];
        duration: number;
    }) => void;
    'reload-error': (info: {
        files: string[];
        errors: Error[];
        duration: number;
    }) => void;
    stopped: () => void;
}
export declare class HotReloadManager extends EventEmitter {
    private watcher;
    private options;
    private reloader;
    private swapper;
    private router;
    constructor(opts?: HotReloadOptions);
    /** Attach app router for route hot swapping */
    setRouter(router: Router): void;
    start(): void;
    /**
     * Get the active watcher backend
     */
    getActiveBackend(): string | undefined;
    stop(): Promise<void>;
}
//# sourceMappingURL=manager.d.ts.map