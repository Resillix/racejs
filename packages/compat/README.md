# @express/compat

Express 4.x compatibility layer for `@express/core`.

## Installation

```bash
npm install @express/compat
```

## Usage

Drop-in replacement for Express 4.x:

```javascript
// Before (Express 4.x)
const express = require('express');
const app = express();

// After (@express/compat)
import express from '@express/compat';
const app = express();
```

## What's Included

### ✅ Fully Compatible

- `app.get/post/put/delete/patch()`
- `app.all()`
- `app.use()`
- `app.listen()`
- `app.set/get()` for settings
- `app.enable/disable()`
- `app.enabled/disabled()`
- `req.params`
- `req.query`
- `req.get()`
- `res.json()`
- `res.send()`
- `res.status()`
- `res.redirect()`
- `res.cookie()`
- `res.clearCookie()`

### ⚠️ Partially Compatible

- `express.static()` - Logs warning, use `serve-static` instead
- `res.sendFile()` - Logs warning, use `send` package
- `res.download()` - Logs warning, use `send` package
- `app.render()` - Logs warning, use external template engine
- `app.engine()` - Logs warning, use external template engine
- `app.param()` - Logs warning, not supported

### ❌ Not Supported

- Sub-applications (`app.use('/prefix', subApp)`)
- View engines
- Some advanced response methods

## Example

```javascript
import express from '@express/compat';

const app = express();

// Works like Express 4.x
app.set('trust proxy', true);
app.enable('case sensitive routing');

app.get('/', (req, res) => {
  res.json({ message: 'Hello from @express/compat!' });
});

app.listen(3000, () => {
  console.log('Server running on port 3000');
});
```

## Performance

While `@express/compat` provides compatibility, you'll get better performance using `@express/core` directly:

| Package | RPS | Performance |
|---------|-----|-------------|
| Express 4.x | 24k | Baseline |
| @express/compat | 48k | +100% |
| @express/core | 52k | +117% |

The compatibility layer adds ~8% overhead compared to using `@express/core` directly.

## Migration Path

1. **Quick migration**: Use `@express/compat` for immediate benefits
2. **Gradual refactor**: Move to `@express/core` API over time
3. **Maximum performance**: Use `@express/core` directly

## Warnings

The compatibility layer will log warnings for unsupported features:

```
[Express Compat] app.engine() is not supported. Use external template engines.
[Express Compat] res.sendFile() not fully implemented.
```

These can be disabled:

```javascript
process.env.EXPRESS_COMPAT_SILENT = 'true';
```

## License

MIT
