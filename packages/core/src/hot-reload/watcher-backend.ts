/**
 * Parcel Watcher Adapter
 *
 * Wraps @parcel/watcher with graceful fallback to fs.watch.
 * This provides production-grade file watching with better performance
 * and cross-platform reliability.
 */

import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';

export type WatchBackend = 'parcel' | 'native' | 'polling';

export interface WatchEvent {
  type: 'create' | 'update' | 'delete';
  path: string;
}

export interface WatcherBackend {
  subscribe(
    dir: string,
    callback: (err: Error | null, events: WatchEvent[]) => void,
    options?: { ignore?: string[] }
  ): Promise<{ unsubscribe: () => Promise<void> }>;
  getBackend(): WatchBackend;
}

// Type definitions for @parcel/watcher (optional dependency)
interface ParcelEvent {
  type: 'create' | 'update' | 'delete';
  path: string;
}

interface ParcelOptions {
  ignore?: string[];
}

interface ParcelWatcherModule {
  subscribe(
    dir: string,
    callback: (err: Error | null, events: ParcelEvent[]) => void,
    options?: ParcelOptions
  ): Promise<{ unsubscribe: () => Promise<void> }>;
}

/**
 * Try to load @parcel/watcher (optional dependency)
 */
function loadParcelWatcher(): ParcelWatcherModule | null {
  try {
    // In ESM context, we need to use createRequire to load CommonJS modules
    const require = createRequire(import.meta.url);
    return require('@parcel/watcher') as ParcelWatcherModule;
  } catch {
    return null;
  }
}

/**
 * Parcel Watcher Backend (preferred - native, fast, reliable)
 */
class ParcelWatcherBackend implements WatcherBackend {
  private parcel: ParcelWatcherModule;

  constructor(parcel: ParcelWatcherModule) {
    this.parcel = parcel;
  }

  async subscribe(
    dir: string,
    callback: (err: Error | null, events: WatchEvent[]) => void,
    options?: { ignore?: string[] }
  ): Promise<{ unsubscribe: () => Promise<void> }> {
    const opts: ParcelOptions | undefined = options?.ignore
      ? { ignore: options.ignore }
      : undefined;

    const subscription = await this.parcel.subscribe(
      dir,
      (err: Error | null, events: ParcelEvent[]) => {
        if (err) {
          callback(err, []);
          return;
        }

        const mapped: WatchEvent[] = events.map((e) => ({
          type: e.type as 'create' | 'update' | 'delete',
          path: e.path,
        }));

        callback(null, mapped);
      },
      opts
    );

    return {
      unsubscribe: async () => {
        await subscription.unsubscribe();
      },
    };
  }

  getBackend(): WatchBackend {
    return 'parcel';
  }
}

/**
 * Native fs.watch Backend (fallback - reliable on most platforms)
 */
class NativeWatcherBackend implements WatcherBackend {
  async subscribe(
    dir: string,
    callback: (err: Error | null, events: WatchEvent[]) => void,
    options?: { ignore?: string[] }
  ): Promise<{ unsubscribe: () => Promise<void> }> {
    const watcher = fs.watch(dir, { recursive: true }, (eventType, filename) => {
      if (!filename) return;

      const fullPath = path.join(dir, filename);

      // Check if ignored
      if (
        options?.ignore?.some((pattern) => {
          const regex = new RegExp(pattern.replace(/\*/g, '.*'));
          return regex.test(fullPath);
        })
      ) {
        return;
      }

      // Map fs.watch events to our format
      let type: 'create' | 'update' | 'delete' = 'update';

      try {
        const exists = fs.existsSync(fullPath);
        type = exists ? (eventType === 'rename' ? 'create' : 'update') : 'delete';
      } catch {
        type = 'delete';
      }

      callback(null, [{ type, path: fullPath }]);
    });

    watcher.on('error', (err) => {
      callback(err, []);
    });

    return {
      unsubscribe: async () => {
        watcher.close();
      },
    };
  }

  getBackend(): WatchBackend {
    return 'native';
  }
}

/**
 * Polling Backend (last resort - works everywhere but slower)
 */
class PollingWatcherBackend implements WatcherBackend {
  private intervals = new Map<string, NodeJS.Timeout>();

  async subscribe(
    dir: string,
    callback: (err: Error | null, events: WatchEvent[]) => void,
    _options?: { ignore?: string[] }
  ): Promise<{ unsubscribe: () => Promise<void> }> {
    const pollInterval = 1000; // 1 second
    const snapshot = new Map<string, number>();

    // Initial scan
    await this.scanDirectory(dir, snapshot);

    const timer = setInterval(async () => {
      try {
        const newSnapshot = new Map<string, number>();
        await this.scanDirectory(dir, newSnapshot);

        const events: WatchEvent[] = [];

        // Detect changes and deletions
        for (const [file, mtime] of snapshot) {
          if (!newSnapshot.has(file)) {
            events.push({ type: 'delete', path: file });
          } else if (newSnapshot.get(file) !== mtime) {
            events.push({ type: 'update', path: file });
          }
        }

        // Detect new files
        for (const [file] of newSnapshot) {
          if (!snapshot.has(file)) {
            events.push({ type: 'create', path: file });
          }
        }

        if (events.length > 0) {
          callback(null, events);
        }

        snapshot.clear();
        newSnapshot.forEach((mtime, file) => snapshot.set(file, mtime));
      } catch (err) {
        callback(err as Error, []);
      }
    }, pollInterval);

    this.intervals.set(dir, timer);

    return {
      unsubscribe: async () => {
        const timer = this.intervals.get(dir);
        if (timer) {
          clearInterval(timer);
          this.intervals.delete(dir);
        }
      },
    };
  }

  private async scanDirectory(dir: string, snapshot: Map<string, number>): Promise<void> {
    try {
      const entries = await fs.promises.readdir(dir, { withFileTypes: true });

      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);

        if (entry.isDirectory()) {
          await this.scanDirectory(fullPath, snapshot);
        } else if (entry.isFile()) {
          const stats = await fs.promises.stat(fullPath);
          snapshot.set(fullPath, stats.mtimeMs);
        }
      }
    } catch {
      // Ignore errors (directory might not exist or be accessible)
    }
  }

  getBackend(): WatchBackend {
    return 'polling';
  }
}

/**
 * Create the best available watcher backend
 * Priority: @parcel/watcher > fs.watch > polling
 */
export function createWatcherBackend(preferPolling = false): WatcherBackend {
  if (!preferPolling) {
    const parcel = loadParcelWatcher();
    if (parcel) {
      return new ParcelWatcherBackend(parcel);
    }

    // Try native fs.watch
    try {
      // Test if fs.watch works (use a known path that definitely exists)
      const testPath = process.cwd();
      const testWatcher = fs.watch(testPath);
      testWatcher.close();
      return new NativeWatcherBackend();
    } catch {
      // Fall through to polling
    }
  }

  return new PollingWatcherBackend();
}

/**
 * Check if @parcel/watcher is available
 */
export function hasParcelWatcher(): boolean {
  return loadParcelWatcher() !== null;
}
