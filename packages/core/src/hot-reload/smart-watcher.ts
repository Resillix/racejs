/*
 * smart-watcher.ts — A robust, dependency-aware file watching system for Node.js/TypeScript
 *
 * Features
 *  - Cross-platform watching via @parcel/watcher (preferred) or fs.watch with intelligent fallbacks to polling
 *  - Recursive initial scan with ignore filters (glob-like with * and **)
 *  - Event debouncing + batching to avoid change storms
 *  - Optional content hashing (fast SHA-1) vs mtime+size checks
 *  - Dependency graph tracking (provide a dependency resolver) with reverse edges
 *  - Affected-node expansion + topological ordering for safe rebuild/reload
 *  - Priority ordering: deletions → additions → modifications
 *  - Stable, typed event API
 */

import fs from 'node:fs';
import fsp from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';
import { EventEmitter } from 'node:events';
import {
  hasParcelWatcher,
  createWatcherBackend,
  type WatchBackend,
  type WatcherBackend,
} from './watcher-backend.js';

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

class TypedEmitter<Events> extends EventEmitter {
  override on<K extends keyof Events & string>(
    event: K,
    listener: Events[K] extends (...args: any[]) => any ? Events[K] : never
  ): this {
    return super.on(event, listener as any);
  }
  override emit<K extends keyof Events & string>(
    event: K,
    ...args: Parameters<Events[K] extends (...a: any[]) => any ? Events[K] : never>
  ): boolean {
    return super.emit(event, ...(args as any));
  }
}

function makeIgnore(pats: (string | RegExp)[] = [], includeDotfiles = false) {
  const regs = pats.map((p) => (typeof p === 'string' ? globToRegExp(p, includeDotfiles) : p));
  return (p: Path) => regs.some((r) => r.test(normalizePath(p)));
}

function globToRegExp(glob: string, includeDotfiles: boolean): RegExp {
  const escaped = glob.replace(/[.+^${}()|[\]\\]/g, '\\$&').replace(/\\\\/g, '/');
  const re = escaped.replace(/\*\*/g, '(?:(?:[^/]+/)*?)').replace(/\*/g, '[^/]*');
  const prefix = includeDotfiles ? '' : '(?!\\.)';
  return new RegExp('^' + re.replace(/\^/, prefix) + '$');
}

function normalizePath(p: string): string {
  return p.split(path.sep).join('/');
}

export class SmartWatcher extends TypedEmitter<WatcherEvents> {
  private opts: Required<Omit<SmartWatcherOptions, 'resolveDependencies' | 'ignore'>> & {
    resolveDependencies?: SmartWatcherOptions['resolveDependencies'];
    ignore: (string | RegExp)[];
  };
  private ignoreFn: (p: Path) => boolean;

  private files = new Map<Path, StatMeta>();
  private dirs = new Set<Path>();
  private reverseDeps = new Map<Path, Set<Path>>();

  private watchers = new Map<Path, fs.FSWatcher>();
  private watcherBackend: WatcherBackend | null = null;
  private backendSubscriptions = new Map<Path, { unsubscribe: () => Promise<void> }>();
  private debouncers = new Map<Path, NodeJS.Timeout>();
  private eventQueue: Change[] = [];
  private batchTimer: NodeJS.Timeout | null = null;
  private ready = false;
  // note: reserved for future shutdown coordination
  // private closing = false;
  private pollTimer: NodeJS.Timeout | null = null;
  private activeBackend: WatchBackend = 'native';

  constructor(options: SmartWatcherOptions) {
    super();
    const {
      roots,
      ignore = ['**/.git/**', '**/node_modules/**'],
      hashMode = 'mtime',
      debounceMs = 75,
      batchMs = 120,
      pollFallbackMs = 0,
      resolveDependencies,
      followSymlinks = false,
      includeDotfiles = false,
    } = options;

    this.opts = {
      roots,
      ignore: Array.isArray(ignore) ? ignore : [ignore],
      hashMode,
      debounceMs,
      batchMs,
      pollFallbackMs,
      resolveDependencies,
      followSymlinks,
      includeDotfiles,
    };

    this.ignoreFn = makeIgnore(this.opts.ignore, this.opts.includeDotfiles);

    // Initialize watcher backend (prefers @parcel/watcher if available)
    try {
      this.watcherBackend = createWatcherBackend(pollFallbackMs > 0);
      this.activeBackend = this.watcherBackend.getBackend();
    } catch (e) {
      // Fallback to fs.watch if backend creation fails
      this.watcherBackend = null;
      this.activeBackend = 'native';
    }
  }

  async start(): Promise<void> {
    for (const r of this.opts.roots) {
      const abs = path.resolve(r);
      await this.scanDir(abs);
    }

    for (const d of this.dirs) {
      this.watchDir(d);
    }

    if (this.opts.pollFallbackMs > 0) {
      this.pollTimer = setInterval(
        () => this.pollSweep().catch((e) => this.emit('error', e)),
        this.opts.pollFallbackMs
      );
      // Hint: Node timers have unref in runtime, but types may vary across versions
      (this.pollTimer as any).unref?.();
    }

    this.ready = true;
    this.emit('ready');
  }

  async close(): Promise<void> {
    // Close backend subscriptions
    for (const [, sub] of this.backendSubscriptions) {
      try {
        await sub.unsubscribe();
      } catch {}
    }
    this.backendSubscriptions.clear();

    // Close fs.watch watchers (fallback)
    for (const [, w] of this.watchers) {
      try {
        w.close();
      } catch {}
    }
    this.watchers.clear();

    if (this.pollTimer) clearInterval(this.pollTimer);
    for (const [, t] of this.debouncers) clearTimeout(t);
    if (this.batchTimer) clearTimeout(this.batchTimer);
  }

  /**
   * Get information about the watcher backend being used
   */
  static getBackendInfo(): { backend: WatchBackend; hasParcel: boolean } {
    return {
      backend: hasParcelWatcher() ? 'parcel' : 'native',
      hasParcel: hasParcelWatcher(),
    };
  }

  /**
   * Get the active backend for this instance
   */
  getActiveBackend(): WatchBackend {
    return this.activeBackend;
  }

  private async scanDir(dir: Path): Promise<void> {
    const absDir = path.resolve(dir);
    if (this.ignoreFn(absDir)) return;

    try {
      const entries = await fsp.readdir(absDir, { withFileTypes: true });
      this.dirs.add(absDir);

      for (const ent of entries) {
        const full = path.join(absDir, ent.name);
        if (this.ignoreFn(full)) continue;

        try {
          const st = await fsp.lstat(full);
          if (st.isSymbolicLink() && !this.opts.followSymlinks) continue;

          if (st.isDirectory()) {
            await this.scanDir(full);
          } else {
            await this.record(full, st, 'scan');
          }
        } catch (e) {
          this.emit('error', e);
        }
      }
    } catch (e) {
      this.emit('error', e);
    }
  }

  private async record(p: Path, st: fs.Stats, _phase: 'scan' | 'event' | 'poll'): Promise<void> {
    const kind: FileKind = st.isDirectory()
      ? 'dir'
      : st.isFile()
        ? 'file'
        : st.isSymbolicLink()
          ? 'symlink'
          : 'other';
    const meta: StatMeta = {
      kind,
      size: st.size,
      mtimeMs: st.mtimeMs,
    };

    if (kind === 'file' && this.opts.hashMode === 'content') {
      try {
        const h = await this.hashOf(p);
        meta.hash = h;
      } catch {
        // keep hash undefined; meta type allows optional
      }
    }

    const key = path.resolve(p);
    const old = this.files.get(key);

    if (!old) {
      this.files.set(key, meta);
      if (this.ready && kind !== 'dir') this.queue({ type: 'added', file: key });
    } else {
      const changed = this.metaChanged(old, meta);
      if (changed) {
        this.files.set(key, meta);
        if (this.ready && kind !== 'dir') this.queue({ type: 'modified', file: key });
      }
    }
  }

  private metaChanged(a: StatMeta, b: StatMeta): boolean {
    if (a.kind !== b.kind) return true;
    if (this.opts.hashMode === 'content') return a.hash !== b.hash || a.size !== b.size;
    return a.mtimeMs !== b.mtimeMs || a.size !== b.size;
  }

  private async removePath(p: Path): Promise<void> {
    const key = path.resolve(p);
    const had = this.files.get(key);
    if (had) {
      this.files.delete(key);
      if (this.ready && had.kind !== 'dir') this.queue({ type: 'deleted', file: key });
    }
    if (this.dirs.has(key)) this.dirs.delete(key);
  }

  private async hashOf(file: Path): Promise<string> {
    return new Promise((resolve, reject) => {
      const h = crypto.createHash('sha1');
      const s = fs.createReadStream(file);
      s.on('error', reject);
      s.on('data', (d) => h.update(d));
      s.on('end', () => resolve(h.digest('hex')));
    });
  }

  private watchDir(dir: Path) {
    if (this.watchers.has(dir) || this.backendSubscriptions.has(dir)) return;

    // Try using watcher backend first (supports @parcel/watcher)
    if (this.watcherBackend && this.activeBackend === 'parcel') {
      this.watchDirWithBackend(dir);
      return;
    }

    // Fallback to fs.watch
    try {
      const watcher = fs.watch(dir, { recursive: false }, (_eventType, filename) => {
        if (!filename) return;
        const full = path.join(dir, filename.toString());
        if (this.ignoreFn(full)) return;

        this.debounce(full, async () => {
          try {
            const st = await fsp.lstat(full);
            await this.record(full, st, 'event');
          } catch (e: any) {
            // If file is gone
            if (e && (e.code === 'ENOENT' || e.code === 'ENOTDIR')) {
              await this.removePath(full);
            } else {
              this.emit('error', e);
            }
          }
        });
      });

      watcher.on('error', (e) => this.emit('error', e));
      this.watchers.set(dir, watcher);
    } catch (e) {
      this.emit('error', e);
    }
  }

  private watchDirWithBackend(dir: Path) {
    if (!this.watcherBackend) return;

    this.watcherBackend
      .subscribe(
        dir,
        (err, events) => {
          if (err) {
            this.emit('error', err);
            return;
          }

          for (const event of events) {
            if (this.ignoreFn(event.path)) continue;

            this.debounce(event.path, async () => {
              try {
                if (event.type === 'delete') {
                  await this.removePath(event.path);
                } else {
                  const st = await fsp.lstat(event.path);
                  await this.record(event.path, st, 'event');
                }
              } catch (e: any) {
                if (e && (e.code === 'ENOENT' || e.code === 'ENOTDIR')) {
                  await this.removePath(event.path);
                } else {
                  this.emit('error', e);
                }
              }
            });
          }
        },
        { ignore: this.opts.ignore.filter((p): p is string => typeof p === 'string') }
      )
      .then((subscription) => {
        this.backendSubscriptions.set(dir, subscription);
      })
      .catch((e) => {
        this.emit('error', e);
      });
  }

  private debounce(p: Path, fn: () => void) {
    const key = path.resolve(p);
    const ms = this.opts.debounceMs;
    const t = this.debouncers.get(key);
    if (t) clearTimeout(t);
    this.debouncers.set(
      key,
      setTimeout(() => {
        this.debouncers.delete(key);
        fn();
      }, ms)
    );
  }

  private async pollSweep(): Promise<void> {
    const candidates = Array.from(this.dirs);
    for (const d of candidates) {
      if (this.ignoreFn(d)) continue;
      try {
        const entries = await fsp.readdir(d, { withFileTypes: true });
        for (const ent of entries) {
          const full = path.join(d, ent.name);
          if (this.ignoreFn(full)) continue;
          try {
            const st = await fsp.lstat(full);
            await this.record(full, st, 'poll');
          } catch (e: any) {
            if (e && (e.code === 'ENOENT' || e.code === 'ENOTDIR')) {
              await this.removePath(full);
            }
          }
        }
      } catch {
        // ignore missing dir
      }
    }
  }

  private queue(c: Change) {
    this.eventQueue.push(c);
    this.emit('change', c);
    if (!this.batchTimer) {
      this.batchTimer = setTimeout(() => this.flushBatch(), this.opts.batchMs);
    }
  }

  private async flushBatch() {
    const items = this.eventQueue.splice(0, this.eventQueue.length);
    if (this.batchTimer) clearTimeout(this.batchTimer);
    this.batchTimer = null;
    if (items.length === 0) return;

    const latest = new Map<Path, ChangeType>();
    for (const it of items) {
      const prev = latest.get(it.file);
      if (!prev) latest.set(it.file, it.type);
      else {
        const next = collapse(prev, it.type);
        if (next === null) latest.delete(it.file);
        else latest.set(it.file, next);
      }
    }
    const condensed: Change[] = Array.from(latest, ([file, type]) => ({ file, type }));

    const affected = new Set<Path>(condensed.map((c) => c.file));
    if (this.opts.resolveDependencies) {
      await this.ensureReverseGraphFor(Array.from(affected));
      const extra = this.expandDependents(Array.from(affected));
      for (const e of extra) affected.add(e);
    }

    const byType = { deleted: [] as Change[], added: [] as Change[], modified: [] as Change[] };
    for (const c of condensed) byType[c.type].push(c);

    const ordered: Change[] = [];
    for (const t of ['deleted', 'added', 'modified'] as const) {
      const list = byType[t];
      const sorted = this.topoOrder(list.map((c) => c.file));
      for (const f of sorted) ordered.push({ type: t, file: f });
    }

    const batch: Batch = {
      changes: ordered,
      affected,
      summary() {
        const counts = { added: 0, modified: 0, deleted: 0 } as Record<ChangeType, number>;
        for (const c of ordered) counts[c.type]++;
        return `Δ files: +${counts.added} ~${counts.modified} -${counts.deleted}`;
      },
    };

    this.emit('batch', batch);
  }

  private async ensureReverseGraphFor(files: Path[]) {
    if (!this.opts.resolveDependencies) return;
    const resolveDeps = this.opts.resolveDependencies;

    for (const f of files) {
      try {
        const deps = await resolveDeps(f);
        const key = path.resolve(f);
        for (const d of deps) {
          const dep = path.resolve(d);
          if (!this.reverseDeps.has(dep)) this.reverseDeps.set(dep, new Set());
          this.reverseDeps.get(dep)!.add(key);
        }
      } catch (e) {
        this.emit('error', e);
      }
    }
  }

  private expandDependents(seeds: Path[]): Set<Path> {
    const out = new Set<Path>();
    const stack = seeds.map((s) => path.resolve(s));
    while (stack.length) {
      const cur = stack.pop()!;
      if (out.has(cur)) continue;
      out.add(cur);
      const parents = this.reverseDeps.get(cur);
      if (parents) for (const p of parents) stack.push(p);
    }
    return out;
  }

  private topoOrder(files: Path[]): Path[] {
    if (!this.opts.resolveDependencies) return Array.from(new Set(files));

    const affected = new Set(files.map((f) => path.resolve(f)));
    const incoming = new Map<Path, number>();
    const outgoing = new Map<Path, Set<Path>>();

    const getParents = (f: Path) => this.reverseDeps.get(path.resolve(f)) || new Set<Path>();

    for (const f of affected) {
      const parents = getParents(f);
      for (const p of parents) {
        if (!affected.has(p)) continue;
        if (!outgoing.has(p)) outgoing.set(p, new Set());
        outgoing.get(p)!.add(f);
        incoming.set(f, (incoming.get(f) || 0) + 1);
      }
      if (!incoming.has(f)) incoming.set(f, 0);
    }

    const q: Path[] = [];
    for (const [f, deg] of incoming) if (deg === 0) q.push(f);
    const out: Path[] = [];
    while (q.length) {
      const n = q.shift()!;
      out.push(n);
      for (const m of outgoing.get(n) || []) {
        const d = (incoming.get(m) || 0) - 1;
        incoming.set(m, d);
        if (d === 0) q.push(m);
      }
    }

    if (out.length !== affected.size) {
      for (const f of affected) if (!out.includes(f)) out.push(f);
    }

    const requested = new Set(files.map((f) => path.resolve(f)));
    return out.filter((f) => requested.has(f));
  }
}

function collapse(prev: ChangeType, next: ChangeType): ChangeType | null {
  if (prev === next) return prev;
  if (prev === 'added' && next === 'deleted') return null;
  if (prev === 'deleted' && next === 'added') return 'modified';
  if (prev === 'added' && next === 'modified') return 'added';
  if (prev === 'modified' && next === 'deleted') return 'deleted';
  if (prev === 'deleted' && next === 'modified') return 'added';
  return next;
}

export async function parseImports(file: Path): Promise<Path[]> {
  try {
    const text = await fsp.readFile(file, 'utf8');
    const dir = path.dirname(file);
    const re = /(?:import|require)\s*(?:[^"']*?)["']([^'"\n]+)["']/g;
    const out: Path[] = [];
    let m: RegExpExecArray | null;
    while ((m = re.exec(text))) {
      const spec: string | undefined = m?.[1];
      if (typeof spec === 'string' && (spec.startsWith('.') || spec.startsWith('..'))) {
        const resolved = tryResolveModule(dir, spec as string);
        if (resolved) out.push(resolved);
      }
    }
    return out;
  } catch {
    return [];
  }
}

function tryResolveModule(fromDir: Path, spec: string): Path | null {
  const tryPaths = [
    path.resolve(fromDir, spec),
    path.resolve(fromDir, spec + '.ts'),
    path.resolve(fromDir, spec + '.tsx'),
    path.resolve(fromDir, spec + '.js'),
    path.resolve(fromDir, spec + '.jsx'),
    path.resolve(fromDir, spec, 'index.ts'),
    path.resolve(fromDir, spec, 'index.tsx'),
    path.resolve(fromDir, spec, 'index.js'),
    path.resolve(fromDir, spec, 'index.jsx'),
  ];
  for (const p of tryPaths) {
    try {
      const s = fs.statSync(p);
      if (s.isFile()) return p;
    } catch {}
  }
  return null;
}
