import { pathToFileURL } from 'node:url';
/**
 * ModuleReloader — reloads modules in-place
 * - Clears CommonJS require cache
 * - Uses dynamic import with cache-busting for ESM
 */
export class ModuleReloader {
    async reload(modulePath) {
        try {
            // Clear CJS cache entry if present
            try {
                const key = require.resolve(modulePath);
                if (require.cache[key])
                    delete require.cache[key];
            }
            catch { }
            const url = pathToFileURL(modulePath).href;
            const bust = `?reload=${Date.now()}-${Math.random().toString(36).slice(2)}`;
            const mod = await import(url + bust);
            return { success: true, module: mod };
        }
        catch (err) {
            // Enhance error with module path info
            const error = err instanceof Error ? err : new Error(String(err));
            // Add file path to error message if not present
            if (!error.message.includes(modulePath)) {
                error.message = `Failed to reload ${modulePath}: ${error.message}`;
            }
            return { success: false, error };
        }
    }
    async reloadMultiple(modulePaths) {
        const results = new Map();
        // Process all files, even if some fail
        // This ensures we capture all errors and continue watching
        for (const p of modulePaths) {
            const r = await this.reload(p);
            results.set(p, r);
            // Continue processing other files even on error
        }
        return results;
    }
}
//# sourceMappingURL=module-reloader.js.map