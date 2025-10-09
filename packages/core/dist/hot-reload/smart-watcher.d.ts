import { EventEmitter } from 'node:events';
import { type WatchBackend } from './watcher-backend.js';
export type Path = string;
export interface SmartWatcherOptions {
    roots: Path[];
    ignore?: (string | RegExp)[];
    hashMode?: 'mtime' | 'content';
    debounceMs?: number;
    batchMs?: number;
    pollFallbackMs?: number;
    resolveDependencies?: (file: Path) => Promise<Path[]> | Path[];
    followSymlinks?: boolean;
    includeDotfiles?: boolean;
}
export type FileKind = 'file' | 'dir' | 'symlink' | 'other';
export interface StatMeta {
    kind: FileKind;
    size: number;
    mtimeMs: number;
    hash?: string;
}
export type ChangeType = 'added' | 'modified' | 'deleted';
export interface Change {
    type: ChangeType;
    file: Path;
}
export interface Batch {
    changes: Change[];
    affected: Set<Path>;
    summary(): string;
}
export interface WatcherEvents {
    change: (c: Change) => void;
    batch: (b: Batch) => void;
    error: (e: unknown) => void;
    ready: () => void;
}
declare class TypedEmitter<Events> extends EventEmitter {
    on<K extends keyof Events & string>(event: K, listener: Events[K] extends (...args: any[]) => any ? Events[K] : never): this;
    emit<K extends keyof Events & string>(event: K, ...args: Parameters<Events[K] extends (...a: any[]) => any ? Events[K] : never>): boolean;
}
export declare class SmartWatcher extends TypedEmitter<WatcherEvents> {
    private opts;
    private ignoreFn;
    private files;
    private dirs;
    private reverseDeps;
    private watchers;
    private watcherBackend;
    private backendSubscriptions;
    private debouncers;
    private eventQueue;
    private batchTimer;
    private ready;
    private pollTimer;
    private activeBackend;
    constructor(options: SmartWatcherOptions);
    start(): Promise<void>;
    close(): Promise<void>;
    /**
     * Get information about the watcher backend being used
     */
    static getBackendInfo(): {
        backend: WatchBackend;
        hasParcel: boolean;
    };
    /**
     * Get the active backend for this instance
     */
    getActiveBackend(): WatchBackend;
    private scanDir;
    private record;
    private metaChanged;
    private removePath;
    private hashOf;
    private watchDir;
    private watchDirWithBackend;
    private debounce;
    private pollSweep;
    private queue;
    private flushBatch;
    private ensureReverseGraphFor;
    private expandDependents;
    private topoOrder;
}
export declare function parseImports(file: Path): Promise<Path[]>;
export {};
//# sourceMappingURL=smart-watcher.d.ts.map