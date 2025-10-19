/**
 * @fileoverview ErrorSolutionEngine - Pattern-based solution finder
 *
 * Matches errors against a database of known patterns and provides
 * solution suggestions with code examples and helpful links.
 *
 * @module dev/error/error-solutions
 */
import type { Solution, SolutionPattern } from './types.js';
/**
 * Error solution engine
 *
 * Matches errors against known patterns and provides solutions.
 *
 * @example
 * ```typescript
 * const engine = new ErrorSolutionEngine();
 * const solutions = engine.find(new Error("Cannot read property 'x' of undefined"));
 * console.log(solutions[0].title); // "Accessing Property of Undefined/Null"
 * ```
 */
export declare class ErrorSolutionEngine {
    private patterns;
    /**
     * Creates a new ErrorSolutionEngine
     *
     * @param customPatterns - Optional custom patterns to add
     */
    constructor(customPatterns?: SolutionPattern[]);
    /**
     * Find solution suggestions for an error
     *
     * @param error - Error to find solutions for
     * @returns Array of matching solutions
     */
    find(error: Error): Solution[];
    /**
     * Check if error matches a pattern
     *
     * @param error - Error to match
     * @param pattern - Pattern to match against
     * @returns True if match found
     */
    private matchPattern;
    /**
     * Calculate confidence score for a match
     *
     * @param error - Error that matched
     * @param pattern - Pattern that matched
     * @returns Confidence score (0-1)
     */
    private scoreMatch;
    /**
     * Add a custom solution pattern
     *
     * @param pattern - Pattern to add
     */
    addPattern(pattern: SolutionPattern): void;
    /**
     * Remove a pattern by ID
     *
     * @param id - Pattern ID
     */
    removePattern(id: string): void;
    /**
     * List all patterns
     *
     * @returns Array of patterns
     */
    listPatterns(): SolutionPattern[];
    /**
     * Get pattern by ID
     *
     * @param id - Pattern ID
     * @returns Pattern or undefined
     */
    getPattern(id: string): SolutionPattern | undefined;
    /**
     * Learn from feedback (placeholder for future ML integration)
     *
     * @param errorHash - Error hash
     * @param solutionId - Solution ID that was helpful/not helpful
     * @param helpful - Whether the solution was helpful
     */
    learnFromFeedback(errorHash: string, solutionId: string, helpful: boolean): void;
}
//# sourceMappingURL=error-solutions.d.ts.map