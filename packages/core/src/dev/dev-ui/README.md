## DevTools UI - Modular Structure

This directory contains the modular components of the RaceJS DevTools browser interface.

### 📁 Directory Structure

```
dev-ui/
├── index.ts                 # Main entry point - assembles all components
├── components/              # UI Components
│   ├── header.ts           # Top header with logo and status
│   ├── navigation.ts       # Sidebar navigation
│   ├── dashboard.ts        # Dashboard tab (overview)
│   ├── requests.ts         # Requests tab (recording & replay)
│   ├── performance.ts      # Performance tab (profiler)
│   └── errors.ts           # Errors tab (error tracking)
├── styles/                  # CSS Modules
│   ├── base.ts             # Base styles, variables, reset
│   ├── layout.ts           # Grid, flexbox, spacing
│   └── components.ts       # Component-specific styles
└── scripts/                 # JavaScript/Client-side Logic
    ├── websocket.ts        # WebSocket client
    └── ui.ts               # UI interactions, tab navigation
```

### 🎯 Design Principles

1. **Single Responsibility** - Each file has one clear purpose
2. **Modularity** - Easy to add/remove features
3. **Scalability** - Simple to extend with new tabs/components
4. **Maintainability** - Changes are localized to specific files

### 🔧 How It Works

#### 1. Entry Point (`index.ts`)

The main file that imports and assembles all components:

```typescript
import { generateBaseStyles } from './styles/base.js';
import { generateDashboard } from './components/dashboard.js';
// ... imports all modules

export function generateDevToolsUI(): string {
  return `<!DOCTYPE html>...`; // Assembled HTML
}
```

#### 2. Components (`components/`)

Each component returns its HTML structure:

```typescript
// dashboard.ts
export function generateDashboard(): string {
  return `
    <h2>Dashboard</h2>
    <div class="grid">...</div>
  `;
}
```

#### 3. Styles (`styles/`)

CSS modules return their styles as strings:

```typescript
// base.ts
export function generateBaseStyles(): string {
  return `
    :root { --primary: #0066ff; }
    body { font-family: ...; }
  `;
}
```

#### 4. Scripts (`scripts/`)

Client-side JavaScript for interactivity:

```typescript
// websocket.ts
export function generateWebSocketClient(): string {
  return `
    let ws = new WebSocket(...);
    // WebSocket logic
  `;
}
```

### ➕ Adding a New Tab

To add a new tab (e.g., "Database"):

1. **Create component** (`components/database.ts`):

```typescript
export function generateDatabaseTab(): string {
  return `<h2>Database Inspector</h2>...`;
}
```

2. **Add navigation item** (`components/navigation.ts`):

```typescript
<div class="nav-item" data-tab="database">
  🗄️ Database
</div>
```

3. **Import in index** (`index.ts`):

```typescript
import { generateDatabaseTab } from './components/database.js';

// In the HTML:
<div id="database" class="tab-content">
  ${generateDatabaseTab()}
</div>
```

4. **Add tab switching logic** (`scripts/ui.ts`):

```typescript
case 'database':
  loadDatabaseData();
  break;
```

### 🎨 Styling

#### Adding New Styles

**Component-specific styles** → `styles/components.ts`:

```typescript
.my-component {
  background: var(--bg-card);
  padding: 1rem;
}
```

**Layout utilities** → `styles/layout.ts`:

```typescript
.flex-column {
  display: flex;
  flex-direction: column;
}
```

**Global variables** → `styles/base.ts`:

```typescript
:root {
  --my-color: #ff0000;
}
```

### 📡 WebSocket Events

The WebSocket client (`scripts/websocket.ts`) handles real-time updates:

```typescript
function handleMessage(message) {
  switch (message.type) {
    case 'request-recorded':
      handleRequestRecorded(message.data);
      break;
    case 'error-tracked':
      handleErrorTracked(message.data);
      break;
    // Add new event handlers here
  }
}
```

### 🚀 Performance Considerations

1. **Lazy Loading** - Tab content only loads when accessed
2. **Minimal JavaScript** - No heavy frameworks (vanilla JS)
3. **CSS Variables** - Fast theme switching
4. **Efficient Updates** - Only update changed elements

### 🔄 Migration from Single File

The original `devtools-ui.ts` (~2400 lines) has been split into:

- **Components**: 6 files (~100-200 lines each)
- **Styles**: 3 files (~150-300 lines each)
- **Scripts**: 2 files (~150-200 lines each)

**Benefits:**

- ✅ Easier to navigate and understand
- ✅ Faster development (parallel work on different tabs)
- ✅ Better testing (unit test individual components)
- ✅ Cleaner git diffs (changes isolated to specific files)

### 📝 Example: Adding a Feature

**Task:** Add request filtering by date

1. **Update UI** (`components/requests.ts`):

```typescript
<div class="filter-group">
  <label>Date Range</label>
  <input type="date" id="filter-date-start">
  <input type="date" id="filter-date-end">
</div>
```

2. **Add logic** (`scripts/ui.ts`):

```typescript
function filterRequests() {
  const dateStart = document.getElementById('filter-date-start').value;
  const dateEnd = document.getElementById('filter-date-end').value;
  sendMessage({ type: 'get-requests', filters: { dateStart, dateEnd } });
}
```

3. **Done!** No need to touch other files.

### 🧪 Testing

Each module can be tested independently:

```typescript
import { generateDashboard } from './components/dashboard.js';

test('dashboard renders correctly', () => {
  const html = generateDashboard();
  expect(html).toContain('<h2>Dashboard</h2>');
});
```

### 🔮 Future Enhancements

Potential additions to this modular structure:

- **Themes** (`styles/themes/`) - Dark/light theme variants
- **Charts** (`components/charts/`) - Reusable chart components
- **Modals** (`components/modals/`) - Shared modal dialogs
- **Utils** (`scripts/utils.ts`) - Shared helper functions
- **Types** (`types.ts`) - TypeScript interfaces

### 📚 Related Files

- **Server**: `devtools-server.ts` - WebSocket server
- **Handler**: `devtools-handler.ts` - Message processing
- **Protocol**: `devtools-protocol.ts` - Message types

---

**Maintained by:** RaceJS Core Team
**Last Updated:** October 2025
