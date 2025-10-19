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
export interface SyntaxError {
    line: number;
    column: number;
    message: string;
    snippet: string | undefined;
    hint: string | undefined;
}
export interface ValidationResult {
    valid: boolean;
    errors: SyntaxError[];
    filePath: string;
}
/**
 * Validates JavaScript syntax without executing the code
 */
export declare class SyntaxValidator {
    /**
     * Validate a single file by attempting to parse it
     * Note: Only catches the FIRST syntax error due to V8 parser limitations
     */
    validateFile(filePath: string): Promise<ValidationResult>;
    /**
     * Validate multiple files in parallel
     */
    validateFiles(filePaths: string[]): Promise<Map<string, ValidationResult>>;
}
//# sourceMappingURL=syntax-validator.d.ts.map