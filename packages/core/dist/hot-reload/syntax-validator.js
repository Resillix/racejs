/**
 * Syntax Validator - validates JavaScript/TypeScript syntax before hot reload
 *
 * This provides better developer experience by:
 * - Catching syntax errors BEFORE attempting hot reload
 * - Providing detailed error locations with helpful hints
 * - Preventing broken modules from being loaded
 *
 * IMPORTANT: Node.js's parser (used by import()) stops at the FIRST syntax error.
 * This is a limitation of V8's parser - it cannot continue parsing after encountering
 * a syntax error. Therefore, this validator will also only catch the first error.
 *
 * For comprehensive error checking (all errors at once), developers should:
 * 1. Use their editor's built-in error detection (TypeScript/ESLint)
 * 2. Run a linter separately (npm run lint)
 * 3. Use TypeScript's compiler check (tsc --noEmit)
 */
import { pathToFileURL } from 'node:url';
import fs from 'node:fs/promises';
/**
 * Common syntax error patterns and their hints
 */
const ERROR_HINTS = {
    'Unexpected token': 'Check for missing commas, brackets, or parentheses',
    'Unexpected identifier': 'Check for missing commas between object/array elements',
    'Unexpected end of input': 'Check for unclosed brackets, braces, or parentheses',
    "Unexpected token '}'": 'Check for missing semicolons or commas before this line',
    "Unexpected token ']'": 'Check for missing commas in arrays or missing opening bracket',
    "Unexpected token ')'": 'Check for extra closing parentheses or missing opening one',
    'Missing initializer': 'Variable declarations must have a value (const/let)',
    'Unexpected reserved word': 'Reserved keywords cannot be used as identifiers',
};
/**
 * Validates JavaScript syntax without executing the code
 */
export class SyntaxValidator {
    /**
     * Validate a single file by attempting to parse it
     * Note: Only catches the FIRST syntax error due to V8 parser limitations
     */
    async validateFile(filePath) {
        const errors = [];
        try {
            // Use dynamic import with a cache-busting query to check syntax
            const url = pathToFileURL(filePath).href;
            const testUrl = `${url}?validate=${Date.now()}-${Math.random().toString(36).slice(2)}`;
            try {
                await import(testUrl);
            }
            catch (importError) {
                const error = importError instanceof Error ? importError : new Error(String(importError));
                // Extract line number from error stack or message
                const lineMatch = error.stack?.match(/:(\d+):(\d+)/) || error.message.match(/:(\d+)/);
                const line = lineMatch && lineMatch[1] ? parseInt(lineMatch[1]) : 0;
                const column = lineMatch && lineMatch[2] ? parseInt(lineMatch[2]) : 0;
                // Read file to get code snippet
                let snippet;
                try {
                    const content = await fs.readFile(filePath, 'utf-8');
                    const lines = content.split('\n');
                    if (line > 0 && line <= lines.length) {
                        // Show the error line and surrounding context
                        const start = Math.max(0, line - 2);
                        const end = Math.min(lines.length, line + 1);
                        snippet = lines
                            .slice(start, end)
                            .map((l, i) => {
                            const lineNum = start + i + 1;
                            const marker = lineNum === line ? '→' : ' ';
                            return `${marker} ${lineNum.toString().padStart(3)} | ${l}`;
                        })
                            .join('\n');
                    }
                }
                catch { }
                // Find matching hint
                let hint;
                for (const [pattern, suggestion] of Object.entries(ERROR_HINTS)) {
                    if (error.message.includes(pattern)) {
                        hint = suggestion;
                        break;
                    }
                }
                errors.push({
                    line,
                    column,
                    message: error.message,
                    snippet,
                    hint,
                });
            }
        }
        catch (err) {
            const error = err instanceof Error ? err : new Error(String(err));
            errors.push({
                line: 0,
                column: 0,
                message: `Failed to validate file: ${error.message}`,
                snippet: undefined,
                hint: undefined,
            });
        }
        return {
            valid: errors.length === 0,
            errors,
            filePath,
        };
    }
    /**
     * Validate multiple files in parallel
     */
    async validateFiles(filePaths) {
        const results = new Map();
        await Promise.all(filePaths.map(async (path) => {
            const result = await this.validateFile(path);
            results.set(path, result);
        }));
        return results;
    }
}
//# sourceMappingURL=syntax-validator.js.map