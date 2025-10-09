export interface ReloadResult {
    success: boolean;
    module?: any;
    error?: Error;
}
/**
 * ModuleReloader — reloads modules in-place
 * - Clears CommonJS require cache
 * - Uses dynamic import with cache-busting for ESM
 */
export declare class ModuleReloader {
    reload(modulePath: string): Promise<ReloadResult>;
    reloadMultiple(modulePaths: string[]): Promise<Map<string, ReloadResult>>;
}
//# sourceMappingURL=module-reloader.d.ts.map