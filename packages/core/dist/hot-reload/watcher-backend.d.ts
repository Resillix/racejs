/**
 * Parcel Watcher Adapter
 *
 * Wraps @parcel/watcher with graceful fallback to fs.watch.
 * This provides production-grade file watching with better performance
 * and cross-platform reliability.
 */
export type WatchBackend = 'parcel' | 'native' | 'polling';
export interface WatchEvent {
    type: 'create' | 'update' | 'delete';
    path: string;
}
export interface WatcherBackend {
    subscribe(dir: string, callback: (err: Error | null, events: WatchEvent[]) => void, options?: {
        ignore?: string[];
    }): Promise<{
        unsubscribe: () => Promise<void>;
    }>;
    getBackend(): WatchBackend;
}
/**
 * Create the best available watcher backend
 * Priority: @parcel/watcher > fs.watch > polling
 */
export declare function createWatcherBackend(preferPolling?: boolean): WatcherBackend;
/**
 * Check if @parcel/watcher is available
 */
export declare function hasParcelWatcher(): boolean;
//# sourceMappingURL=watcher-backend.d.ts.map