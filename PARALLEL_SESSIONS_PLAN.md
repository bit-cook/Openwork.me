# Parallel Session Execution - Implementation Plan

## Problem Summary

The current architecture uses a **singleton `OpenCodeAdapter`** that prevents parallel task execution:

1. **Single PTY process** - Only one CLI process runs at a time
2. **Shared instance state** - `currentTaskId`, `currentSessionId`, `messages` get overwritten
3. **Listener accumulation** - Event listeners stack up without proper cleanup
4. **No task isolation** - Events from one task leak to another

## Solution: Per-Task Adapter Architecture

Following industry-standard patterns (process manager, worker pool), we'll create a **TaskManager** that manages multiple independent adapter instances.

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                    Electron Main Process                         │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │                    TaskManager                           │   │
│  │  ┌──────────────────────────────────────────────────┐   │   │
│  │  │  activeTasks: Map<taskId, ManagedTask>           │   │   │
│  │  │                                                   │   │   │
│  │  │  ManagedTask {                                   │   │   │
│  │  │    taskId: string                                │   │   │
│  │  │    adapter: OpenCodeAdapter (unique instance)    │   │   │
│  │  │    cleanup: () => void                           │   │   │
│  │  │  }                                               │   │   │
│  │  └──────────────────────────────────────────────────┘   │   │
│  │                                                          │   │
│  │  Methods:                                                │   │
│  │  - startTask(taskId, config, callbacks) → Task          │   │
│  │  - cancelTask(taskId) → void                            │   │
│  │  - sendResponse(taskId, response) → void                │   │
│  │  - getTask(taskId) → ManagedTask | undefined            │   │
│  │  - hasActiveTask(taskId) → boolean                      │   │
│  └─────────────────────────────────────────────────────────┘   │
│                              │                                   │
│              ┌───────────────┼───────────────┐                  │
│              ▼               ▼               ▼                  │
│  ┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐   │
│  │ OpenCodeAdapter │ │ OpenCodeAdapter │ │ OpenCodeAdapter │   │
│  │   (Task A)      │ │   (Task B)      │ │   (Task C)      │   │
│  │                 │ │                 │ │                 │   │
│  │ - ptyProcess    │ │ - ptyProcess    │ │ - ptyProcess    │   │
│  │ - streamParser  │ │ - streamParser  │ │ - streamParser  │   │
│  │ - sessionId     │ │ - sessionId     │ │ - sessionId     │   │
│  │ - taskId        │ │ - taskId        │ │ - taskId        │   │
│  └────────┬────────┘ └────────┬────────┘ └────────┬────────┘   │
│           │                   │                   │             │
│           ▼                   ▼                   ▼             │
│  ┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐   │
│  │  PTY Process A  │ │  PTY Process B  │ │  PTY Process C  │   │
│  │  (opencode run) │ │  (opencode run) │ │  (opencode run) │   │
│  └─────────────────┘ └─────────────────┘ └─────────────────┘   │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## Implementation Steps

### Phase 1: Create TaskManager (`src/main/opencode/task-manager.ts`)

```typescript
interface ManagedTask {
  taskId: string;
  adapter: OpenCodeAdapter;
  cleanup: () => void;
  createdAt: Date;
}

interface TaskCallbacks {
  onMessage: (message: OpenCodeMessage) => void;
  onProgress: (progress: { stage: string; message?: string }) => void;
  onPermissionRequest: (request: PermissionRequest) => void;
  onComplete: (result: TaskResult) => void;
  onError: (error: Error) => void;
  onDebug?: (log: { type: string; message: string; data?: unknown }) => void;
  onPlaywriterError?: (error: { message: string; type: string }) => void;
}

class TaskManager {
  private activeTasks: Map<string, ManagedTask> = new Map();

  async startTask(taskId: string, config: TaskConfig, callbacks: TaskCallbacks): Promise<Task>;
  async cancelTask(taskId: string): Promise<void>;
  async sendResponse(taskId: string, response: string): Promise<void>;
  getTask(taskId: string): ManagedTask | undefined;
  hasActiveTask(taskId: string): boolean;
  getActiveTaskCount(): number;
  dispose(): void; // Cleanup all tasks on app quit
}
```

**Key responsibilities:**
- Create new `OpenCodeAdapter` instance per task
- Wire up event listeners with proper scoping
- Track all active tasks
- Handle cleanup on completion/cancel/error
- Route responses to correct task's PTY

### Phase 2: Refactor OpenCodeAdapter

**Changes to `adapter.ts`:**

1. **Constructor accepts taskId:**
```typescript
constructor(taskId: string) {
  super();
  this.taskId = taskId;
  this.streamParser = new StreamParser();
  this.setupStreamParsing();
}
```

2. **Add dispose method:**
```typescript
dispose(): void {
  if (this.ptyProcess) {
    this.ptyProcess.kill();
    this.ptyProcess = null;
  }
  this.removeAllListeners();
  this.streamParser.reset();
}
```

3. **Remove singleton pattern:**
```typescript
// DELETE these lines:
// let adapterInstance: OpenCodeAdapter | null = null;
// export function getOpenCodeAdapter(): OpenCodeAdapter { ... }

// KEEP factory function for TaskManager:
export function createAdapter(taskId: string): OpenCodeAdapter {
  return new OpenCodeAdapter(taskId);
}
```

4. **Include taskId in events (for debugging):**
```typescript
this.emit('message', message); // Already scoped by instance
```

### Phase 3: Update IPC Handlers (`handlers.ts`)

**Before (singleton):**
```typescript
export function registerIPCHandlers(): void {
  const adapter = getOpenCodeAdapter(); // Single instance

  handle('task:start', async (event, config) => {
    // Attaches listeners to shared adapter
    adapter.on('message', onMessage);
    // ...
  });
}
```

**After (TaskManager):**
```typescript
import { TaskManager } from '../opencode/task-manager';

let taskManager: TaskManager | null = null;

export function registerIPCHandlers(): void {
  taskManager = new TaskManager();

  handle('task:start', async (event, config) => {
    const taskId = createTaskId();
    const callbacks = { onMessage, onProgress, ... };

    // TaskManager creates isolated adapter
    const task = await taskManager.startTask(taskId, config, callbacks);
    return task;
  });

  handle('task:cancel', async (event, taskId) => {
    await taskManager?.cancelTask(taskId);
  });

  handle('permission:respond', async (event, response) => {
    // Route to correct task
    await taskManager?.sendResponse(response.taskId, message);
  });
}
```

### Phase 4: Update Permission Response Routing

**Current issue:** `permission:respond` uses the singleton adapter, which may be wrong task.

**Fix:** Include `taskId` in permission response and route to correct adapter.

**Changes to preload (`preload/index.ts`):**
```typescript
respondToPermission: (response: PermissionResponse): Promise<void> =>
  ipcRenderer.invoke('permission:respond', response),
```
(No change needed - already passes full response with taskId context)

**Changes to IPC handler:**
```typescript
handle('permission:respond', async (_event, response: PermissionResponse) => {
  const parsedResponse = validate(permissionResponseSchema, response);
  const taskId = parsedResponse.requestId.split('_')[1]; // Extract taskId from requestId
  // OR: Add explicit taskId to PermissionResponse type

  const message = parsedResponse.decision === 'allow'
    ? (parsedResponse.selectedOptions?.join(', ') || parsedResponse.message || 'yes')
    : 'no';

  await taskManager?.sendResponse(taskId, sanitizeString(message, 'response', 1024));
});
```

### Phase 5: Handle App Lifecycle

**On app quit:**
```typescript
app.on('before-quit', () => {
  taskManager?.dispose(); // Kill all PTY processes
});
```

---

## File Changes Summary

| File | Changes |
|------|---------|
| `src/main/opencode/task-manager.ts` | **NEW** - TaskManager class |
| `src/main/opencode/adapter.ts` | Refactor: taskId in constructor, dispose(), remove singleton |
| `src/main/ipc/handlers.ts` | Use TaskManager instead of singleton |
| `src/main/index.ts` | Dispose TaskManager on quit |
| `packages/shared/src/types/permission.ts` | Add taskId to PermissionResponse (optional) |

---

## Testing Plan

1. **Basic parallel execution:**
   - Start Task A
   - While A is running, start Task B
   - Verify both complete independently

2. **Data isolation:**
   - Start two tasks with different prompts
   - Verify messages don't cross between tasks

3. **Permission handling:**
   - Start Task A, trigger permission request
   - Start Task B, trigger permission request
   - Respond to Task B first
   - Verify responses go to correct tasks

4. **Cancellation:**
   - Start Tasks A and B
   - Cancel Task A
   - Verify Task B continues unaffected

5. **Error handling:**
   - Start Task A, simulate error
   - Verify cleanup occurs
   - Start Task B, verify it works

---

## Optional Future Enhancements

1. **Max concurrent tasks limit** - Prevent resource exhaustion
2. **Task queue** - Queue tasks when limit reached
3. **UI for multiple tasks** - Show all active tasks in sidebar
4. **Task priorities** - Higher priority tasks preempt lower ones

---

## Implementation Order

1. Create `task-manager.ts` with full implementation
2. Modify `adapter.ts` to support per-task instances
3. Update `handlers.ts` to use TaskManager
4. Update `index.ts` for cleanup
5. Test thoroughly
6. (Optional) Update UI for multi-task visibility
