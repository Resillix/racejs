/**
 * Dev Mode Configuration Types
 *
 * Central configuration for all dev mode features
 */
/**
 * Normalize dev mode options with defaults
 */
export function normalizeDevModeOptions(options) {
    // Disabled
    if (options === false)
        return null;
    // Auto-enable in development
    const isDev = process.env.NODE_ENV !== 'production';
    // Simple boolean enable
    if (options === true || options === undefined) {
        return isDev ? { enabled: true } : null;
    }
    // Object config
    if (!isDev && !options.enabled)
        return null;
    return {
        enabled: true,
        verbose: options.verbose ?? isDev,
        ...options,
    };
}
//# sourceMappingURL=types.js.map