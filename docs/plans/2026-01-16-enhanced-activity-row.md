# Enhanced ActivityRow Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Redesign ActivityRow to match Claude's tool display style with Request/Response sections, proper JSON formatting, and grouped steps.

**Architecture:** Replace current simple ActivityRow with Claude-like design: tool name as title, dark code blocks for Request/Response, vertical timeline connector between steps, and a "Hide/Show steps" group toggle.

**Tech Stack:** React, TypeScript, Framer Motion, Tailwind CSS, lucide-react icons

---

## Task 1: Create StepGroup Component

**Files:**
- Create: `apps/desktop/src/renderer/components/execution/StepGroup.tsx`

**Step 1: Create the StepGroup wrapper component**

```tsx
import { useState, memo, ReactNode } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StepGroupProps {
  children: ReactNode;
  defaultExpanded?: boolean;
}

export const StepGroup = memo(function StepGroup({
  children,
  defaultExpanded = true,
}: StepGroupProps) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);

  return (
    <div className="w-full">
      {/* Toggle button */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className={cn(
          'flex items-center gap-2 px-3 py-2 text-sm text-muted-foreground',
          'hover:text-foreground transition-colors'
        )}
      >
        {isExpanded ? (
          <>
            <ChevronUp className="h-4 w-4" />
            <span>Hide steps</span>
          </>
        ) : (
          <>
            <ChevronDown className="h-4 w-4" />
            <span>Show steps</span>
          </>
        )}
      </button>

      {/* Steps container with timeline */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="relative pl-4 ml-2 border-l-2 border-border">
              {children}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
});
```

**Step 2: Verify the change compiles**

Run: `cd /Users/matan/Developer/Accomplish/openwork.claude-like-chat-experience && pnpm typecheck`

Expected: No errors

**Step 3: Commit**

```bash
git add apps/desktop/src/renderer/components/execution/StepGroup.tsx
git commit -m "feat: add StepGroup component for collapsible tool steps"
```

---

## Task 2: Create CodeBlock Component for Request/Response

**Files:**
- Create: `apps/desktop/src/renderer/components/execution/CodeBlock.tsx`

**Step 1: Create reusable CodeBlock component**

```tsx
import { memo } from 'react';
import { cn } from '@/lib/utils';

interface CodeBlockProps {
  label: string;
  content: string;
  className?: string;
}

export const CodeBlock = memo(function CodeBlock({
  label,
  content,
  className,
}: CodeBlockProps) {
  return (
    <div className={cn('rounded-lg overflow-hidden', className)}>
      <div className="bg-zinc-800 px-3 py-1.5 border-b border-zinc-700">
        <span className="text-xs text-zinc-400 font-medium">{label}</span>
      </div>
      <div className="bg-zinc-900 p-3 overflow-x-auto">
        <pre className="text-xs font-mono text-zinc-300 whitespace-pre-wrap break-words">
          {content}
        </pre>
      </div>
    </div>
  );
});
```

**Step 2: Verify the change compiles**

Run: `cd /Users/matan/Developer/Accomplish/openwork.claude-like-chat-experience && pnpm typecheck`

Expected: No errors

**Step 3: Commit**

```bash
git add apps/desktop/src/renderer/components/execution/CodeBlock.tsx
git commit -m "feat: add CodeBlock component for Request/Response display"
```

---

## Task 3: Redesign ActivityRow with Claude-like Layout

**Files:**
- Modify: `apps/desktop/src/renderer/components/execution/ActivityRow.tsx`

**Step 1: Update ActivityRow with new design**

Replace the entire file content:

```tsx
import { useState, memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, ChevronRight, CheckCircle2, AlertTriangle, FileText, Search, SquareTerminal, Brain, Globe, Wrench } from 'lucide-react';
import { cn } from '@/lib/utils';
import { springs } from '../../lib/animations';
import { CodeBlock } from './CodeBlock';
import loadingSymbol from '/assets/loading-symbol.svg';

// Normalize tool name to PascalCase for consistent matching
function normalizeToolName(tool: string): string {
  if (!tool) return tool;
  const lowerTool = tool.toLowerCase();
  const toolMap: Record<string, string> = {
    read: 'Read',
    write: 'Write',
    edit: 'Edit',
    glob: 'Glob',
    grep: 'Grep',
    bash: 'Bash',
    task: 'Task',
    webfetch: 'WebFetch',
    websearch: 'WebSearch',
  };
  return toolMap[lowerTool] || tool.charAt(0).toUpperCase() + tool.slice(1);
}

// Tool icon mapping
const TOOL_ICONS: Record<string, typeof FileText> = {
  Read: FileText,
  Write: FileText,
  Edit: FileText,
  Glob: Search,
  Grep: Search,
  Bash: SquareTerminal,
  Task: Brain,
  WebFetch: Globe,
  WebSearch: Globe,
};

// Human-readable tool names
const TOOL_DISPLAY_NAMES: Record<string, string> = {
  Read: 'Read File',
  Write: 'Write File',
  Edit: 'Edit File',
  Glob: 'Find Files',
  Grep: 'Search Code',
  Bash: 'Run Command',
  Task: 'Agent Task',
  WebFetch: 'Fetch URL',
  WebSearch: 'Web Search',
};

export interface ActivityRowProps {
  id: string;
  tool: string;
  input: unknown;
  output?: string;
  status: 'running' | 'complete' | 'error';
}

// Format JSON with syntax highlighting-friendly output
function formatJson(obj: unknown): string {
  if (obj === null || obj === undefined) return '';
  if (typeof obj === 'string') return obj;
  try {
    return JSON.stringify(obj, null, 2);
  } catch {
    return String(obj);
  }
}

// Spinning icon component
const SpinningIcon = ({ className }: { className?: string }) => (
  <img
    src={loadingSymbol}
    alt=""
    className={cn('animate-spin-ccw', className)}
  />
);

export const ActivityRow = memo(function ActivityRow({
  id,
  tool,
  input,
  output,
  status,
}: ActivityRowProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const normalizedTool = normalizeToolName(tool);
  const Icon = TOOL_ICONS[normalizedTool] || Wrench;
  const displayName = TOOL_DISPLAY_NAMES[normalizedTool] || normalizedTool;
  const formattedInput = formatJson(input);
  const formattedOutput = output || '';

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={springs.gentle}
      className="w-full relative"
    >
      {/* Timeline connector dot */}
      <div className="absolute -left-[21px] top-3 w-2 h-2 rounded-full bg-muted-foreground/50" />

      {/* Collapsed row - Tool name as title */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className={cn(
          'w-full flex items-center gap-2 px-3 py-2 rounded-lg',
          'hover:bg-muted/50 transition-colors',
          'text-left text-sm'
        )}
      >
        {/* Tool icon */}
        <Icon className="h-4 w-4 shrink-0 text-muted-foreground" />

        {/* Tool name */}
        <span className="flex-1 font-medium text-foreground">{displayName}</span>

        {/* Status indicator */}
        {status === 'running' ? (
          <SpinningIcon className="h-4 w-4 shrink-0" />
        ) : status === 'error' ? (
          <AlertTriangle className="h-4 w-4 shrink-0 text-amber-500" />
        ) : (
          <CheckCircle2 className="h-4 w-4 shrink-0 text-green-600" />
        )}

        {/* Expand/collapse chevron */}
        {isExpanded ? (
          <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" />
        ) : (
          <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
        )}
      </button>

      {/* Expanded details - Request/Response blocks */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="ml-6 mt-1 space-y-2 pb-2">
              {/* Request block */}
              {formattedInput && (
                <CodeBlock label="Request" content={formattedInput} />
              )}

              {/* Response block */}
              {status !== 'running' && formattedOutput && (
                <CodeBlock
                  label="Response"
                  content={formattedOutput.length > 2000
                    ? formattedOutput.slice(0, 2000) + '\n...(truncated)'
                    : formattedOutput}
                />
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
});
```

**Step 2: Verify the change compiles**

Run: `cd /Users/matan/Developer/Accomplish/openwork.claude-like-chat-experience && pnpm typecheck`

Expected: No errors

**Step 3: Commit**

```bash
git add apps/desktop/src/renderer/components/execution/ActivityRow.tsx
git commit -m "feat: redesign ActivityRow with Claude-like Request/Response layout"
```

---

## Task 4: Update Index Exports

**Files:**
- Modify: `apps/desktop/src/renderer/components/execution/index.ts`

**Step 1: Add new exports**

```typescript
export { ActivityRow } from './ActivityRow';
export type { ActivityRowProps } from './ActivityRow';
export { ThinkingRow } from './ThinkingRow';
export { StepGroup } from './StepGroup';
export { CodeBlock } from './CodeBlock';
```

**Step 2: Verify the change compiles**

Run: `cd /Users/matan/Developer/Accomplish/openwork.claude-like-chat-experience && pnpm typecheck`

Expected: No errors

**Step 3: Commit**

```bash
git add apps/desktop/src/renderer/components/execution/index.ts
git commit -m "feat: export StepGroup and CodeBlock components"
```

---

## Task 5: Integrate StepGroup into Execution.tsx

**Files:**
- Modify: `apps/desktop/src/renderer/pages/Execution.tsx`

**Step 1: Update imports**

Add `StepGroup` to the import:

```typescript
import { ActivityRow, ThinkingRow, StepGroup } from '../components/execution';
```

**Step 2: Wrap tool messages in StepGroup**

In the message rendering section, collect consecutive tool messages and wrap them:

Find the section that maps messages and replace it with logic that groups tools:

```tsx
{(() => {
  const elements: React.ReactNode[] = [];
  let toolGroup: typeof currentTask.messages = [];

  const flushToolGroup = () => {
    if (toolGroup.length > 0) {
      elements.push(
        <StepGroup key={`tools-${toolGroup[0].id}`}>
          {toolGroup.map((message, idx) => {
            const isLast = idx === toolGroup.length - 1;
            return (
              <ActivityRow
                key={message.id}
                id={message.id}
                tool={message.toolName || 'unknown'}
                input={message.toolInput}
                output={message.content}
                status={isLast && currentTask.status === 'running' ? 'running' : 'complete'}
              />
            );
          })}
        </StepGroup>
      );
      toolGroup = [];
    }
  };

  currentTask.messages.forEach((message, index, allMessages) => {
    if (message.type === 'tool') {
      toolGroup.push(message);
    } else {
      flushToolGroup();

      // Render non-tool message
      const filteredMessages = allMessages.filter(m => m.type !== 'tool');
      const filteredIndex = filteredMessages.findIndex(m => m.id === message.id);
      const isLastMessage = filteredIndex === filteredMessages.length - 1;
      const isLastAssistantMessage = message.type === 'assistant' && isLastMessage;

      let lastAssistantIndex = -1;
      for (let i = filteredMessages.length - 1; i >= 0; i--) {
        if (filteredMessages[i].type === 'assistant') {
          lastAssistantIndex = i;
          break;
        }
      }
      const isLastAssistantForContinue = filteredIndex === lastAssistantIndex;

      const showContinue = isLastAssistantForContinue && !!hasSession &&
        (currentTask.status === 'interrupted' ||
         (currentTask.status === 'completed' && isWaitingForUser(message.content)));

      elements.push(
        <MessageBubble
          key={message.id}
          message={message}
          shouldStream={isLastAssistantMessage && currentTask.status === 'running'}
          isLastMessage={isLastMessage}
          isRunning={currentTask.status === 'running'}
          showContinueButton={showContinue}
          continueLabel={currentTask.status === 'interrupted' ? 'Continue' : 'Done, Continue'}
          onContinue={handleContinue}
          isLoading={isLoading}
        />
      );
    }
  });

  flushToolGroup(); // Flush any remaining tools

  return elements;
})()}
```

**Step 3: Verify the change compiles**

Run: `cd /Users/matan/Developer/Accomplish/openwork.claude-like-chat-experience && pnpm typecheck`

Expected: No errors

**Step 4: Test manually**

Run: `cd /Users/matan/Developer/Accomplish/openwork.claude-like-chat-experience && pnpm dev`

Verify:
- Tool calls are grouped with "Hide/Show steps" toggle
- Each tool shows with timeline connector
- Expanding shows Request/Response in dark code blocks
- Multiple consecutive tools are grouped together

**Step 5: Commit**

```bash
git add apps/desktop/src/renderer/pages/Execution.tsx
git commit -m "feat: integrate StepGroup to group consecutive tool calls"
```

---

## Task 6: Final Verification

**Step 1: Run typecheck**

Run: `cd /Users/matan/Developer/Accomplish/openwork.claude-like-chat-experience && pnpm typecheck`

Expected: No errors

**Step 2: Run lint**

Run: `cd /Users/matan/Developer/Accomplish/openwork.claude-like-chat-experience && pnpm lint`

Expected: No errors

**Step 3: Manual testing**

Run: `cd /Users/matan/Developer/Accomplish/openwork.claude-like-chat-experience && pnpm dev`

Test scenarios:
1. Start a task that uses multiple tools
2. Verify tools are grouped under "Hide/Show steps"
3. Expand individual tools to see Request/Response
4. Verify timeline connector between steps
5. Toggle "Hide steps" to collapse all
6. Verify thinking indicator appears correctly

**Step 4: Commit if any fixes needed**

```bash
git add -A
git commit -m "fix: final adjustments for enhanced ActivityRow"
```
