# Hot Reload Error Handling Demo

This example demonstrates RaceJS's **Next.js-style error handling** during hot reload.

## Features

- ✅ **Detailed Error Messages** - Like Next.js, errors show full details
- ✅ **Syntax Error Detection** - Special handling for syntax errors with helpful tips
- ✅ **Stack Traces** - Filtered to show only relevant code (no node_modules)
- ✅ **File Context** - Shows which files caused the error
- ✅ **Graceful Recovery** - Server keeps running with previous working code
- ✅ **Auto-Retry** - Fix the error and save to automatically retry

## What You'll See

### When Code Has Errors

```
================================================================================
❌ Hot Reload Failed
================================================================================

📁 Files:
   routes/users.js

🔴 Error 1:
   Failed to reload /path/to/routes/users.js: Unexpected token '}'

📍 Stack Trace:
   at file:///path/to/routes/users.js:5:3
   at ModuleJob.run (node:internal/modules/esm/module_job:194:25)

💡 This looks like a syntax error. Check your code for:
   - Missing brackets, braces, or parentheses
   - Incorrect comma or semicolon placement
   - Typos in variable or function names

================================================================================
Fix the error(s) above and save to retry hot reload.
================================================================================
```

### When Code Is Fixed

```
♻️  Reloading: users.js
✅ Reloaded in 15ms
```

## Try It Yourself

### 1. Start the Server

```bash
node index.js
```

### 2. Manual Test - Introduce an Error

Edit `routes/users.js` and introduce a syntax error:

```javascript
// Missing closing brace - will cause error
app.get('/users', (req, res) => {
  res.json({ users: [] })
}  // <- Missing closing brace for the route function
```

**Save the file** and watch the terminal show the detailed error!

### 3. Fix the Error

Add the missing brace:

```javascript
app.get('/users', (req, res) => {
  res.json({ users: [] });
}); // <- Now it's correct
```

**Save again** and see it reload successfully!

### 4. Automated Test

Run the automated error handling test:

```bash
# In another terminal (while server is running)
node test-error-handling.js
```

This will automatically:

1. Create a file with syntax error
2. Show the detailed error output
3. Create a file with runtime error
4. Show the error output
5. Create a valid file
6. Show successful reload
7. Clean up

## Error Types Demonstrated

### 1. Syntax Errors

- Missing brackets/braces
- Incorrect punctuation
- Invalid JavaScript syntax

### 2. Runtime Errors

- Reference errors (undefined variables)
- Type errors
- Import/require errors

### 3. Module Loading Errors

- Missing dependencies
- Circular dependencies
- Path resolution issues

## Comparison with Other Tools

| Feature                 | RaceJS | Next.js | Nodemon     | Vite |
| ----------------------- | ------ | ------- | ----------- | ---- |
| Detailed error messages | ✅     | ✅      | ❌          | ✅   |
| Stack traces            | ✅     | ✅      | ❌          | ✅   |
| Syntax error detection  | ✅     | ✅      | ❌          | ✅   |
| Server keeps running    | ✅     | ✅      | ❌          | ✅   |
| Auto-retry on fix       | ✅     | ✅      | ⚠️ Restarts | ✅   |

## Benefits

1. **Faster Development** - See errors immediately without manual restart
2. **Better DX** - Clear error messages help you fix issues quickly
3. **No Downtime** - Server stays up even when code has errors
4. **Professional** - Error handling matches modern frameworks like Next.js

## Tips

- Errors are automatically caught - no try/catch needed
- Previous working code stays active until errors are fixed
- Multiple errors are shown together for batch changes
- Stack traces are filtered to show your code, not node_modules

---

**This is the Next.js-level DX you deserve for Node.js APIs!** 🚀
