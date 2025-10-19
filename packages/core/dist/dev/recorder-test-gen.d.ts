/**
 * Test Generation Module
 *
 * Automated test generation from recorded requests:
 * - Vitest/Jest unit tests
 * - Postman collections
 * - HAR files for external tools
 */
import type { RecordedRequest } from './recorder.js';
import type { DevLogger } from './logger.js';
export interface TestGenerationOptions {
    /** Test framework to target */
    framework: 'vitest' | 'jest' | 'postman' | 'har';
    /** Include response assertions */
    includeAssertions?: boolean;
    /** Include timing assertions */
    includeTimings?: boolean;
    /** Test file naming pattern */
    namingPattern?: 'descriptive' | 'sequential' | 'grouped';
    /** Base URL for generated tests */
    baseUrl?: string;
    /** Additional test configuration */
    config?: {
        /** Timeout for tests */
        timeout?: number;
        /** Skip authentication headers */
        skipAuth?: boolean;
        /** Custom headers to include */
        headers?: Record<string, string>;
    };
}
export interface GeneratedTest {
    /** Test framework used */
    framework: string;
    /** Generated test content */
    content: string;
    /** Suggested filename */
    filename: string;
    /** Test metadata */
    meta: {
        /** Number of test cases */
        testCount: number;
        /** Estimated execution time */
        estimatedTime?: number;
        /** Dependencies required */
        dependencies?: string[];
    };
}
/**
 * Test Generation Engine
 *
 * Single Responsibility: Generate automated tests from recorded requests
 */
export declare class TestGenerator {
    private logger;
    constructor(logger: DevLogger);
    /**
     * Generate tests from multiple requests
     */
    generateTestSuite(requests: RecordedRequest[], options: TestGenerationOptions): Promise<GeneratedTest>;
    /**
     * Generate single test case
     */
    generateSingleTest(request: RecordedRequest, options: TestGenerationOptions): Promise<GeneratedTest>;
    /**
     * Generate Vitest test suite
     */
    private generateVitestSuite;
    /**
     * Generate Jest test suite
     */
    private generateJestSuite;
    /**
     * Generate Postman collection
     */
    private generatePostmanCollection;
    /**
     * Generate HAR file
     */
    private generateHARFile;
    /**
     * Generate Vitest test case
     */
    private generateVitestTestCase;
    /**
     * Generate Jest test case
     */
    private generateJestTestCase;
    /**
     * Generate Postman collection item
     */
    private generatePostmanItem;
    /**
     * Generate HAR entry
     */
    private generateHAREntry;
    /**
     * Generate test name from request
     */
    private generateTestName;
    /**
     * Generate descriptive test name
     */
    private generateDescriptiveTestName;
    /**
     * Group test cases by route
     */
    private groupTestsByRoute;
    /**
     * Generate test filename
     */
    private generateTestFilename;
    /**
     * Check if headers should be included in test
     */
    private shouldIncludeHeaders;
    /**
     * Sanitize headers for test generation
     */
    private sanitizeHeaders;
    /**
     * Indent code by specified number of spaces
     */
    private indentCode;
}
/**
 * Create a test generator instance
 */
export declare function createTestGenerator(logger: DevLogger): TestGenerator;
//# sourceMappingURL=recorder-test-gen.d.ts.map