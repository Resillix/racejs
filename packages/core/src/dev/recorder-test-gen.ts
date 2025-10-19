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
export class TestGenerator {
  private logger: DevLogger;

  constructor(logger: DevLogger) {
    this.logger = logger.child({ component: 'TestGenerator' });
  }

  /**
   * Generate tests from multiple requests
   */
  async generateTestSuite(
    requests: RecordedRequest[],
    options: TestGenerationOptions
  ): Promise<GeneratedTest> {
    this.logger.debug('Generating test suite', {
      requestCount: requests.length,
      framework: options.framework,
    });

    switch (options.framework) {
      case 'vitest':
        return this.generateVitestSuite(requests, options);

      case 'jest':
        return this.generateJestSuite(requests, options);

      case 'postman':
        return this.generatePostmanCollection(requests, options);

      case 'har':
        return this.generateHARFile(requests, options);

      default:
        throw new Error(`Unsupported test framework: ${options.framework}`);
    }
  }

  /**
   * Generate single test case
   */
  async generateSingleTest(
    request: RecordedRequest,
    options: TestGenerationOptions
  ): Promise<GeneratedTest> {
    return this.generateTestSuite([request], options);
  }

  /**
   * Generate Vitest test suite
   */
  private async generateVitestSuite(
    requests: RecordedRequest[],
    options: TestGenerationOptions
  ): Promise<GeneratedTest> {
    const imports = [
      "import { describe, it, expect, beforeAll } from 'vitest';",
      "import { request } from 'supertest';",
      "import { app } from '../src/app'; // Adjust import path",
    ];

    const setupCode = options.config?.timeout
      ? `\nbeforeAll(() => {\n  // Set custom timeout: ${options.config.timeout}ms\n});`
      : '';

    const testCases = requests.map((req) => this.generateVitestTestCase(req, options));
    const groupedTests = this.groupTestsByRoute(testCases);

    let content = imports.join('\n') + '\n' + setupCode + '\n\n';

    for (const [route, tests] of Object.entries(groupedTests)) {
      content += `describe('${route}', () => {\n`;
      content += tests.map((test) => this.indentCode(test, 2)).join('\n\n');
      content += '\n});\n\n';
    }

    return {
      framework: 'vitest',
      content,
      filename: this.generateTestFilename(requests, 'vitest', options),
      meta: {
        testCount: requests.length,
        estimatedTime: requests.reduce((sum, req) => sum + (req.duration || 100), 0),
        dependencies: ['vitest', 'supertest'],
      },
    };
  }

  /**
   * Generate Jest test suite
   */
  private async generateJestSuite(
    requests: RecordedRequest[],
    options: TestGenerationOptions
  ): Promise<GeneratedTest> {
    const imports = [
      "const request = require('supertest');",
      "const app = require('../src/app'); // Adjust import path",
    ];

    const setupCode = options.config?.timeout
      ? `\nbeforeAll(() => {\n  jest.setTimeout(${options.config.timeout});\n});`
      : '';

    const testCases = requests.map((req) => this.generateJestTestCase(req, options));
    const groupedTests = this.groupTestsByRoute(testCases);

    let content = imports.join('\n') + '\n' + setupCode + '\n\n';

    for (const [route, tests] of Object.entries(groupedTests)) {
      content += `describe('${route}', () => {\n`;
      content += tests.map((test) => this.indentCode(test, 2)).join('\n\n');
      content += '\n});\n\n';
    }

    return {
      framework: 'jest',
      content,
      filename: this.generateTestFilename(requests, 'jest', options),
      meta: {
        testCount: requests.length,
        estimatedTime: requests.reduce((sum, req) => sum + (req.duration || 100), 0),
        dependencies: ['jest', 'supertest'],
      },
    };
  }

  /**
   * Generate Postman collection
   */
  private async generatePostmanCollection(
    requests: RecordedRequest[],
    options: TestGenerationOptions
  ): Promise<GeneratedTest> {
    const collection = {
      info: {
        name: 'Generated API Tests',
        description: 'Auto-generated from recorded requests',
        schema: 'https://schema.getpostman.com/json/collection/v2.1.0/collection.json',
      },
      variable: options.baseUrl
        ? [
            {
              key: 'baseUrl',
              value: options.baseUrl,
              type: 'string',
            },
          ]
        : [],
      item: requests.map((req) => this.generatePostmanItem(req, options)),
    };

    return {
      framework: 'postman',
      content: JSON.stringify(collection, null, 2),
      filename: this.generateTestFilename(requests, 'postman', options),
      meta: {
        testCount: requests.length,
        dependencies: ['postman'],
      },
    };
  }

  /**
   * Generate HAR file
   */
  private async generateHARFile(
    requests: RecordedRequest[],
    options: TestGenerationOptions
  ): Promise<GeneratedTest> {
    const har = {
      log: {
        version: '1.2',
        creator: {
          name: 'RaceJS Dev Tools',
          version: '1.0.0',
        },
        entries: requests.map((req) => this.generateHAREntry(req, options)),
      },
    };

    return {
      framework: 'har',
      content: JSON.stringify(har, null, 2),
      filename: this.generateTestFilename(requests, 'har', options),
      meta: {
        testCount: requests.length,
        dependencies: [],
      },
    };
  }

  /**
   * Generate Vitest test case
   */
  private generateVitestTestCase(request: RecordedRequest, options: TestGenerationOptions): string {
    const testName = this.generateTestName(request, options);
    const expectedStatus = request.response?.statusCode || 200;

    let testCode = `it('${testName}', async () => {\n`;
    testCode += `  const response = await request(app)\n`;
    testCode += `    .${request.method.toLowerCase()}('${request.url}')`;

    // Add headers
    if (this.shouldIncludeHeaders(request, options)) {
      const headers = this.sanitizeHeaders(request.headers, options);
      if (Object.keys(headers).length > 0) {
        testCode += `\n    .set(${JSON.stringify(headers, null, 4).replace(/\n/g, '\n    ')})`;
      }
    }

    // Add body for POST/PUT/PATCH
    if (request.body && ['POST', 'PUT', 'PATCH'].includes(request.method)) {
      testCode += `\n    .send(${JSON.stringify(request.body, null, 4).replace(/\n/g, '\n    ')})`;
    }

    testCode += ';\n\n';

    // Add assertions
    if (options.includeAssertions !== false) {
      testCode += `  expect(response.status).toBe(${expectedStatus});\n`;

      if (request.response?.body) {
        testCode += `  expect(response.body).toEqual(${JSON.stringify(request.response.body, null, 2).replace(/\n/g, '\n  ')});\n`;
      }

      if (options.includeTimings && request.duration) {
        testCode += `  // Original response time: ${request.duration}ms\n`;
        testCode += `  expect(response.duration).toBeLessThan(${Math.max(request.duration * 2, 1000)});\n`;
      }
    }

    testCode += '});';

    return testCode;
  }

  /**
   * Generate Jest test case
   */
  private generateJestTestCase(request: RecordedRequest, options: TestGenerationOptions): string {
    const testName = this.generateTestName(request, options);
    const expectedStatus = request.response?.statusCode || 200;

    let testCode = `test('${testName}', async () => {\n`;
    testCode += `  const response = await request(app)\n`;
    testCode += `    .${request.method.toLowerCase()}('${request.url}')`;

    // Add headers
    if (this.shouldIncludeHeaders(request, options)) {
      const headers = this.sanitizeHeaders(request.headers, options);
      if (Object.keys(headers).length > 0) {
        testCode += `\n    .set(${JSON.stringify(headers, null, 4).replace(/\n/g, '\n    ')})`;
      }
    }

    // Add body for POST/PUT/PATCH
    if (request.body && ['POST', 'PUT', 'PATCH'].includes(request.method)) {
      testCode += `\n    .send(${JSON.stringify(request.body, null, 4).replace(/\n/g, '\n    ')})`;
    }

    testCode += ';\n\n';

    // Add assertions
    if (options.includeAssertions !== false) {
      testCode += `  expect(response.status).toBe(${expectedStatus});\n`;

      if (request.response?.body) {
        testCode += `  expect(response.body).toEqual(${JSON.stringify(request.response.body, null, 2).replace(/\n/g, '\n  ')});\n`;
      }

      if (options.includeTimings && request.duration) {
        testCode += `  // Original response time: ${request.duration}ms\n`;
        testCode += `  expect(response).toHaveProperty('duration');\n`;
      }
    }

    testCode += '});';

    return testCode;
  }

  /**
   * Generate Postman collection item
   */
  private generatePostmanItem(request: RecordedRequest, options: TestGenerationOptions) {
    const item: any = {
      name: this.generateTestName(request, options),
      request: {
        method: request.method,
        header: Object.entries(this.sanitizeHeaders(request.headers, options)).map(
          ([key, value]) => ({
            key,
            value: String(value),
            type: 'text',
          })
        ),
        url: {
          raw: options.baseUrl ? `{{baseUrl}}${request.url}` : `http://localhost${request.url}`,
          host: options.baseUrl ? ['{{baseUrl}}'] : ['localhost'],
          path: request.url.split('/').filter(Boolean),
          query: Object.entries(request.query || {}).map(([key, value]) => ({
            key,
            value: String(value),
          })),
        },
      },
    };

    // Add body for POST/PUT/PATCH
    if (request.body && ['POST', 'PUT', 'PATCH'].includes(request.method)) {
      item.request.body = {
        mode: 'raw',
        raw: JSON.stringify(request.body, null, 2),
        options: {
          raw: {
            language: 'json',
          },
        },
      };
    }

    // Add test script
    if (options.includeAssertions !== false && request.response) {
      const tests = [
        `pm.test("Status code is ${request.response.statusCode}", function () {`,
        `    pm.response.to.have.status(${request.response.statusCode});`,
        '});',
      ];

      if (request.response.body) {
        tests.push(
          '',
          'pm.test("Response body is correct", function () {',
          `    const expectedBody = ${JSON.stringify(request.response.body, null, 4).replace(/\n/g, '\n    ')};`,
          '    pm.response.to.have.jsonBody(expectedBody);',
          '});'
        );
      }

      if (options.includeTimings && request.duration) {
        tests.push(
          '',
          `pm.test("Response time is less than ${Math.max(request.duration * 2, 1000)}ms", function () {`,
          `    pm.expect(pm.response.responseTime).to.be.below(${Math.max(request.duration * 2, 1000)});`,
          '});'
        );
      }

      item.event = [
        {
          listen: 'test',
          script: {
            exec: tests,
            type: 'text/javascript',
          },
        },
      ];
    }

    return item;
  }

  /**
   * Generate HAR entry
   */
  private generateHAREntry(request: RecordedRequest, options: TestGenerationOptions) {
    const startedDateTime = new Date(request.timestamp).toISOString();

    return {
      startedDateTime,
      time: request.duration || 0,
      request: {
        method: request.method,
        url: options.baseUrl
          ? `${options.baseUrl}${request.url}`
          : `http://localhost${request.url}`,
        httpVersion: 'HTTP/1.1',
        headers: Object.entries(this.sanitizeHeaders(request.headers, options)).map(
          ([name, value]) => ({ name, value: String(value) })
        ),
        queryString: Object.entries(request.query || {}).map(([name, value]) => ({
          name,
          value: String(value),
        })),
        postData:
          request.body && ['POST', 'PUT', 'PATCH'].includes(request.method)
            ? {
                mimeType: 'application/json',
                text: JSON.stringify(request.body),
              }
            : undefined,
        headersSize: -1,
        bodySize: -1,
      },
      response: request.response
        ? {
            status: request.response.statusCode,
            statusText: 'OK',
            httpVersion: 'HTTP/1.1',
            headers: Object.entries(request.response.headers as Record<string, string>).map(
              ([name, value]) => ({ name, value: String(value) })
            ),
            content: {
              size: -1,
              mimeType: 'application/json',
              text: request.response.body ? JSON.stringify(request.response.body) : '',
            },
            redirectURL: '',
            headersSize: -1,
            bodySize: -1,
          }
        : {
            status: 0,
            statusText: '',
            httpVersion: 'HTTP/1.1',
            headers: [],
            content: { size: 0, mimeType: 'text/plain', text: '' },
            redirectURL: '',
            headersSize: -1,
            bodySize: -1,
          },
      cache: {},
      timings: {
        blocked: -1,
        dns: -1,
        connect: -1,
        send: 0,
        wait: request.duration || 0,
        receive: 0,
        ssl: -1,
      },
    };
  }

  /**
   * Generate test name from request
   */
  private generateTestName(request: RecordedRequest, options: TestGenerationOptions): string {
    switch (options.namingPattern) {
      case 'descriptive':
        return this.generateDescriptiveTestName(request);

      case 'sequential':
        return `Test ${request.id}`;

      case 'grouped':
        return `${request.method} ${request.url.split('/').pop() || 'root'}`;

      default:
        return `should handle ${request.method} ${request.url}`;
    }
  }

  /**
   * Generate descriptive test name
   */
  private generateDescriptiveTestName(request: RecordedRequest): string {
    const method = request.method.toLowerCase();
    const path = request.url;
    const status = request.response?.statusCode;

    // Extract meaningful parts from path
    const pathParts = path.split('/').filter(Boolean);
    const resource = pathParts[pathParts.length - 1] || 'root';

    let name = `should ${method} ${resource}`;

    if (status) {
      if (status >= 200 && status < 300) {
        name += ' successfully';
      } else if (status >= 400) {
        name += ' and handle error';
      }
    }

    return name;
  }

  /**
   * Group test cases by route
   */
  private groupTestsByRoute(testCases: string[]): Record<string, string[]> {
    const groups: Record<string, string[]> = {};

    // For now, group all tests under a single 'API Tests' group
    // In the future, could parse the test content to extract routes
    groups['API Tests'] = testCases;

    return groups;
  }

  /**
   * Generate test filename
   */
  private generateTestFilename(
    _requests: RecordedRequest[],
    framework: string,
    _options: TestGenerationOptions
  ): string {
    const timestamp = new Date().toISOString().slice(0, 10);

    switch (framework) {
      case 'vitest':
        return `api-tests-${timestamp}.test.ts`;

      case 'jest':
        return `api-tests-${timestamp}.test.js`;

      case 'postman':
        return `api-collection-${timestamp}.json`;

      case 'har':
        return `api-requests-${timestamp}.har`;

      default:
        return `generated-tests-${timestamp}.txt`;
    }
  }

  /**
   * Check if headers should be included in test
   */
  private shouldIncludeHeaders(request: RecordedRequest, options: TestGenerationOptions): boolean {
    if (options.config?.skipAuth) {
      return false;
    }

    // Include headers if they seem important (not just browser defaults)
    const importantHeaders = Object.keys(request.headers).filter(
      (key) =>
        !['user-agent', 'accept', 'accept-encoding', 'connection', 'cache-control'].includes(
          key.toLowerCase()
        )
    );

    return importantHeaders.length > 0;
  }

  /**
   * Sanitize headers for test generation
   */
  private sanitizeHeaders(
    headers: Record<string, any>,
    options: TestGenerationOptions
  ): Record<string, string> {
    const sanitized: Record<string, string> = {};

    // Sensitive headers to skip
    const sensitiveHeaders = ['authorization', 'cookie', 'set-cookie', 'x-api-key', 'x-auth-token'];

    // Browser-specific headers to skip
    const browserHeaders = [
      'user-agent',
      'accept',
      'accept-encoding',
      'accept-language',
      'connection',
      'cache-control',
      'upgrade-insecure-requests',
    ];

    const skipHeaders = options.config?.skipAuth
      ? [...sensitiveHeaders, ...browserHeaders]
      : browserHeaders;

    for (const [key, value] of Object.entries(headers)) {
      if (!skipHeaders.includes(key.toLowerCase()) && value != null) {
        sanitized[key] = Array.isArray(value) ? value.join(', ') : String(value);
      }
    }

    // Add custom headers if specified
    if (options.config?.headers) {
      Object.assign(sanitized, options.config.headers);
    }

    return sanitized;
  }

  /**
   * Indent code by specified number of spaces
   */
  private indentCode(code: string, spaces: number): string {
    const indent = ' '.repeat(spaces);
    return code
      .split('\n')
      .map((line) => (line ? indent + line : line))
      .join('\n');
  }
}

/**
 * Create a test generator instance
 */
export function createTestGenerator(logger: DevLogger): TestGenerator {
  return new TestGenerator(logger);
}
