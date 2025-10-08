# Contributing to RaceJS

Thank you for your interest in contributing to RaceJS! This document provides guidelines and instructions for contributing.

## 🏢 About RaceJS

RaceJS is developed by [Resellix](https://resellix.com), a software startup building high-performance developer tools. We welcome community contributions to make RaceJS even better!

## 🎯 Project Goals

Before contributing, please understand our core goals:

1. **Performance First** - Every change must maintain or improve performance (2-4x faster than Express)
2. **API Compatibility** - Maintain compatibility with Express 4.x ecosystem
3. **Code Quality** - Strict TypeScript, comprehensive tests
4. **Documentation** - Clear docs for all public APIs

## 🚀 Getting Started

### Prerequisites

- Node.js >=18.0.0
- pnpm >=8.0.0
- Git

### Setup Development Environment

```bash
# Fork and clone the repository
git clone https://github.com/YOUR_USERNAME/racejs.git
cd racejs

# Install dependencies
pnpm install

# Build all packages
pnpm build

# Run tests
pnpm test
```

## 📝 Making Changes

### 1. Create a Branch

```bash
git checkout -b feature/your-feature-name
# or
git checkout -b fix/your-bug-fix
```

### 2. Make Your Changes

- Write clean, readable TypeScript
- Follow existing code style
- Add tests for new functionality
- Update documentation

### 3. Run Quality Checks

```bash
# Lint code
pnpm lint

# Type check
pnpm typecheck

# Run tests
pnpm test

# Run benchmarks (important!)
pnpm bench
```

## 🎨 Code Style

### TypeScript

- Use strict mode
- Prefer `const` over `let`
- Use explicit types for function parameters and returns
- Avoid `any` (use `unknown` if necessary)

**Good:**
```typescript
export function parseQuery(queryString: string): Record<string, string> {
  const result: Record<string, string> = {};
  // ...
  return result;
}
```

**Bad:**
```typescript
export function parseQuery(queryString: any): any {
  const result = {};
  // ...
  return result;
}
```

### Comments

Add comments for:
- Complex algorithms
- Performance optimizations
- Why something is done a certain way

**Example:**
```typescript
/**
 * Pre-bind next function to avoid closure allocation
 * V8 optimization: Reusing the same function reference enables inline caching
 */
function createNext(ctx: Context): Next {
  return function next(err?: any): void {
    if (err) ctx.error = err;
  };
}
```

## 🧪 Testing

### Writing Tests

- Tests go in `*.test.ts` files next to the source
- Use descriptive test names
- Test both happy and error paths
- Include performance-critical test cases

**Example:**
```typescript
describe('Router', () => {
  it('should match static routes', () => {
    const router = new Router();
    router.addRoute('GET', '/users', [handler]);
    router.compile();

    const match = router.find('GET', '/users');
    expect(match).not.toBeNull();
  });

  it('should extract route parameters', () => {
    const router = new Router();
    router.addRoute('GET', '/user/:id', [handler]);
    router.compile();

    const match = router.find('GET', '/user/123');
    expect(match?.params).toEqual({ id: '123' });
  });
});
```

### Running Tests

```bash
# Run all tests
pnpm test

# Run tests for specific package
pnpm --filter @express/core test

# Run with coverage
pnpm test:coverage

# Run in watch mode
pnpm test --watch
```

## ⚡ Performance Guidelines

### Benchmarking is Required

**Every optimization must be validated with benchmarks.**

### Before Making Changes

```bash
# Benchmark current performance
cd packages/bench
node new-engine.js &
autocannon -c 100 -d 30 http://localhost:3001/ping > before.json
kill %1
```

### After Making Changes

```bash
# Rebuild
pnpm build

# Benchmark new performance
node new-engine.js &
autocannon -c 100 -d 30 http://localhost:3001/ping > after.json
kill %1

# Compare
node compare-benchmarks.js before.json after.json
```

### Performance Requirements

- **No regressions** - RPS must not drop by more than 5%
- **Measure overhead** - New features should have minimal cost when unused
- **Profile hot paths** - Use `node --prof` or flamegraphs

### Optimization Checklist

- [ ] Benchmarked before and after
- [ ] No performance regression
- [ ] Hot path allocations minimized
- [ ] V8 optimization-friendly (no deopt triggers)
- [ ] Flamegraphs show improvement

## 📊 Pull Request Process

### 1. Prepare Your PR

- Write clear commit messages
- Update documentation
- Add/update tests
- Run all quality checks
- Include benchmark results

### 2. Commit Message Format

Follow conventional commits:

```
type(scope): short description

Longer description if needed.

Benchmark results:
- Before: 24,531 RPS
- After: 26,108 RPS
- Improvement: +6.4%
```

**Types:**
- `feat:` New feature
- `fix:` Bug fix
- `perf:` Performance improvement
- `docs:` Documentation
- `test:` Tests
- `refactor:` Code refactoring
- `chore:` Build/tooling

### 3. Create Pull Request

- Use a descriptive title
- Fill out the PR template
- Link related issues
- Include benchmark results
- Add screenshots/flamegraphs if relevant

### 4. PR Review

- Address review comments
- Keep CI green
- Squash commits if requested
- Be responsive to feedback

## 🐛 Reporting Bugs

### Before Reporting

- Search existing issues
- Test on latest version
- Verify it's not a known limitation

### Bug Report Template

```markdown
**Describe the bug**
Clear description of the issue

**To Reproduce**
Steps to reproduce:
1. Create app with...
2. Make request to...
3. See error

**Expected behavior**
What you expected to happen

**Actual behavior**
What actually happened

**Environment:**
- OS: [e.g., Ubuntu 22.04]
- Node.js: [e.g., 20.10.0]
- Package version: [e.g., 5.0.0-alpha.1]

**Additional context**
Any other relevant information
```

## 💡 Suggesting Features

### Feature Request Template

```markdown
**Problem**
What problem does this solve?

**Proposed Solution**
How would you solve it?

**Performance Impact**
Expected impact on performance

**API Design**
```typescript
// Example API
app.newFeature(options);
```

**Alternatives Considered**
Other approaches you've thought about

**Additional Context**
Any other relevant information
```

## 📚 Documentation

### When to Update Docs

- New features
- API changes
- Performance improvements
- Breaking changes

### Documentation Locations

- `/docs/*.md` - Main documentation
- `/packages/*/README.md` - Package-specific docs
- `*.ts` files - TSDoc comments

### TSDoc Format

```typescript
/**
 * Short description of function
 *
 * Longer description with details about behavior,
 * edge cases, and performance characteristics.
 *
 * @param req - HTTP request object
 * @param res - HTTP response object
 * @returns Promise that resolves when done
 *
 * @example
 * ```typescript
 * app.get('/user/:id', async (req, res) => {
 *   const user = await getUser(req.params.id);
 *   res.json(user);
 * });
 * ```
 */
export async function handler(req: Request, res: Response): Promise<void> {
  // ...
}
```

## 🏆 Recognition

Contributors are recognized in:
- CONTRIBUTORS.md
- Release notes
- GitHub contributors page

Significant contributions may be highlighted in:
- Blog posts
- Social media
- Conference talks

## ❓ Questions?

- **GitHub Discussions**: For general questions
- **Issues**: For bugs and feature requests
- **Gitter**: For real-time chat

## 📄 License

By contributing, you agree that your contributions will be licensed under the MIT License.

---

**Thank you for contributing to RaceJS! 🙏**

**Built with ⚡️ by [Dhananjay Latpate](mailto:dhananjaylatpate@resellix.com) and the RaceJS community**

**Founder**: Dhananjay Latpate <dhananjaylatpate@resellix.com>  
**Company**: [Resellix](https://resellix.com)
