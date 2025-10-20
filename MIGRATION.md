# Migration Guide: v0.x to v1.0

This guide helps you migrate from `agent-cli-sdk` or `agent-cli-sdk-three` v0.x to v1.0.

## Overview of Changes

Version 1.0 introduces several architectural improvements while maintaining backward compatibility for most common use cases:

- **New**: `AgentClient` orchestration layer
- **New**: Unified `Session` class for multi-turn conversations
- **New**: Dependency injection pattern for adapters
- **Improved**: Better TypeScript support and type inference
- **Enhanced**: Session management and tracking
- **Added**: CodexAdapter for OpenAI Codex CLI support

## Quick Start

### Before (v0.x)

```typescript
import { createClaudeAdapter } from "@sourceborn/agent-cli-sdk";

const claude = createClaudeAdapter();
const result = await claude.execute("Create a function");
```

### After (v1.0) - Recommended

```typescript
import { AgentClient, createClaudeAdapter } from "@sourceborn/agent-cli-sdk-three";

const client = new AgentClient({ adapter: createClaudeAdapter() });
const result = await client.execute("Create a function");
```

### After (v1.0) - Advanced

```typescript
import { AgentClient, createClaudeAdapter } from "@sourceborn/agent-cli-sdk-three";

const claude = createClaudeAdapter({
  workingDir: "/my/project",
  verbose: true,
});

const client = new AgentClient({ adapter: claude });
const result = await client.execute("Create a function");
```

## Migration Scenarios

### 1. Basic Execution (No Changes Required)

If you're using the factory pattern directly, **no changes are required**:

```typescript
// v1.x - Still works in v2.0!
import { createClaudeAdapter } from "@sourceborn/agent-cli-sdk";

const claude = createClaudeAdapter();
const result = await claude.execute("prompt");
```

The factory functions and adapters remain fully compatible.

### 2. Migrating to AgentClient (Recommended)

For better session management and unified API:

**Before:**

```typescript
const claude = createClaudeAdapter();
const result1 = await claude.execute("Create a function");
const result2 = await claude.execute("Add tests", {
  sessionId: result1.sessionId,
  resume: true,
});
```

**After:**

```typescript
const client = new AgentClient({ adapter: "claude" });
const result1 = await client.execute("Create a function");
const result2 = await client.execute("Add tests", {
  sessionId: result1.sessionId,
  resume: true,
});
```

### 3. Session Mode

**Before (v1.x):**

```typescript
const claude = createClaudeAdapter();
const session = claude.createSession();

await session.send("Create a function");
await session.send("Add tests");
```

**After (v2.0):**

```typescript
const client = new AgentClient({ adapter: "claude" });
const session = client.createSession();

await session.send("Create a function");
await session.send("Add tests");
```

The `Session` API remains the same, but you now create sessions through `AgentClient`.

### 4. Multiple Adapters

**Before (v1.x):**

```typescript
const claude = createClaudeAdapter();
const result = await claude.execute("prompt");
```

**After (v2.0):**

```typescript
// Create specialized clients
const claudeClient = new AgentClient({ adapter: "claude" });
const codexClient = new AgentClient({ adapter: "codex" });

// Use different adapters for different tasks
const generated = await claudeClient.execute("Generate code");
const reviewed = await codexClient.execute("Review code");
```

### 5. Custom Configuration

**Before (v1.x):**

```typescript
const claude = createClaudeAdapter({
  cliPath: "/custom/path",
  verbose: true,
  workingDir: "/my/project",
});
```

**After (v2.0) - Option 1 (Client-level config):**

```typescript
const client = new AgentClient({
  adapter: "claude",
  workingDirectory: "/my/project",
  verbose: true,
});
```

**After (v2.0) - Option 2 (Adapter-level config):**

```typescript
const claude = createClaudeAdapter({
  cliPath: "/custom/path",
  verbose: true,
  workingDir: "/my/project",
});

const client = new AgentClient({ adapter: claude });
```

### 6. Streaming Callbacks

**Before (v1.x):**

```typescript
const result = await claude.execute("prompt", {
  onStream: (event) => console.log(event.type),
});
```

**After (v2.0):**

The API remains the same, but you can now use both `onOutput` and `onEvent`:

```typescript
const result = await client.execute("prompt", {
  onOutput: (raw) => process.stdout.write(raw), // Raw stdout
  onEvent: (event) => console.log(event.type), // Parsed events
});
```

### 7. Session Tracking

**New in v2.0:**

```typescript
const client = new AgentClient({ adapter: "claude" });

const session1 = client.createSession();
const session2 = client.createSession();

await session1.send("Task 1");
await session2.send("Task 2");

// Track active sessions
const sessions = client.listActiveSessions();
console.log(`Active sessions: ${sessions.length}`);

// Get specific session
const retrieved = client.getSession(session1.sessionId!);

// Abort session
client.abortSession(session1.sessionId!);
```

## Breaking Changes

### 1. Package Name (Optional)

If you choose to use the new package:

```bash
npm uninstall @sourceborn/agent-cli-sdk
npm install @sourceborn/agent-cli-sdk-three
```

Update imports:

```typescript
// Before
import { createClaudeAdapter } from "@sourceborn/agent-cli-sdk";

// After
import { createClaudeAdapter } from "@sourceborn/agent-cli-sdk-three";
// or
import { AgentClient } from "@sourceborn/agent-cli-sdk-three";
```

### 2. Session Management

Sessions are now managed through `AgentClient` instead of directly through adapters:

```typescript
// Before (v1.x)
const adapter = createClaudeAdapter();
const session = adapter.createSession();

// After (v2.0)
const client = new AgentClient({ adapter: "claude" });
const session = client.createSession();
```

### 3. Type Changes

Some types have been renamed for clarity:

```typescript
// Before
import type { ClaudeOptions } from "@sourceborn/agent-cli-sdk";

// After
import type { ClaudeExecutionOptions } from "@sourceborn/agent-cli-sdk-three";
```

## New Features in v2.0

### 1. Dependency Injection

Create custom adapters and inject them:

```typescript
import { BaseAdapter, AgentClient } from "@sourceborn/agent-cli-sdk-three";

class MyCustomAdapter extends BaseAdapter {
  async execute(prompt, options) {
    // Custom implementation
  }

  getCapabilities() {
    return {
      streaming: true,
      sessionManagement: false,
      toolCalling: false,
      multiModal: false,
    };
  }
}

const client = new AgentClient({ adapter: new MyCustomAdapter() });
```

### 2. Adapter Capabilities

Query adapter capabilities at runtime:

```typescript
const client = new AgentClient({ adapter: "claude" });
const capabilities = client.getCapabilities();

if (capabilities.sessionManagement) {
  const session = client.createSession();
}
```

### 3. Codex Support

New CodexAdapter for OpenAI Codex CLI:

```typescript
const client = new AgentClient({ adapter: "codex" });
const result = await client.execute("Create a function", {
  fullAuto: true,
  images: ["/path/to/screenshot.png"],
});
```

### 4. Enhanced Session Tracking

```typescript
const sessions = client.listActiveSessions();

sessions.forEach((session) => {
  console.log(`Session ${session.sessionId}:`);
  console.log(`  Messages: ${session.messageCount}`);
  console.log(`  Started: ${new Date(session.startedAt)}`);
  console.log(`  Adapter: ${session.adapter}`);
});
```

## Recommended Migration Path

### Step 1: Update Package (Optional)

```bash
npm install @sourceborn/agent-cli-sdk-three
```

### Step 2: Update Imports

```typescript
// Change imports to use new package
import { AgentClient, createClaudeAdapter } from "@sourceborn/agent-cli-sdk-three";
```

### Step 3: Wrap in AgentClient (Recommended)

```typescript
// Before
const claude = createClaudeAdapter();

// After
const client = new AgentClient({ adapter: "claude" });
// or
const claude = createClaudeAdapter();
const client = new AgentClient({ adapter: claude });
```

### Step 4: Update Session Creation

```typescript
// Before
const session = claude.createSession();

// After
const session = client.createSession();
```

### Step 5: Test and Verify

Run your test suite to ensure everything works as expected.

## Compatibility Notes

### What Still Works

- ✅ Direct adapter usage (`createClaudeAdapter()`, `adapter.execute()`)
- ✅ Factory functions
- ✅ Execution options
- ✅ Streaming callbacks
- ✅ Session resumption with `sessionId` and `resume`
- ✅ All Claude-specific options
- ✅ Error handling and custom errors

### What Changed

- ⚠️ Session creation now recommended through `AgentClient`
- ⚠️ New `onOutput` callback alongside `onEvent`
- ⚠️ Session tracking requires `AgentClient`
- ⚠️ Some type names updated for clarity

### What's New

- ✨ `AgentClient` orchestration layer
- ✨ Unified `Session` class
- ✨ Dependency injection support
- ✨ `CodexAdapter` for OpenAI Codex
- ✨ Session tracking and management
- ✨ Adapter capabilities query
- ✨ Better TypeScript inference

## Troubleshooting

### Issue: "Cannot find module 'agent-cli-sdk-three'"

**Solution:** Install the new package:

```bash
npm install @sourceborn/agent-cli-sdk-three
```

### Issue: "adapter.createSession is not a function"

**Solution:** Create sessions through `AgentClient`:

```typescript
const client = new AgentClient({ adapter: claude });
const session = client.createSession();
```

### Issue: Type errors after migration

**Solution:** Update type imports:

```typescript
import type {
  AgentClientOptions,
  ExecuteOptions,
  ClaudeExecutionOptions,
} from "@sourceborn/agent-cli-sdk-three";
```

## Support

If you encounter issues during migration:

1. Check the [README](./README.md) for updated documentation
2. Review the [examples](./examples) directory
3. Open an issue on GitHub

## Timeline

- **v1.x**: Continue to work as before
- **v2.0**: Introduces `AgentClient` and new features
- **v3.0** (future): May deprecate direct adapter usage

We recommend migrating to `AgentClient` when convenient, but there's no rush - v1.x patterns continue to work in v2.0.
