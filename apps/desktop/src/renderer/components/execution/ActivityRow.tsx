import { useState, memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronRight, ChevronDown, CheckCircle2, FileText, Search, Terminal, Brain, Globe } from 'lucide-react';
import { cn } from '@/lib/utils';
import { springs } from '../../lib/animations';
import loadingSymbol from '/assets/loading-symbol.svg';

// Normalize tool name to PascalCase for consistent matching
function normalizeToolName(tool: string): string {
  if (!tool) return tool;
  // Handle common variations: bash -> Bash, webfetch -> WebFetch
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
  Bash: Terminal,
  Task: Brain,
  WebFetch: Globe,
  WebSearch: Globe,
};

export interface ActivityRowProps {
  id: string;
  tool: string;
  input: unknown;
  output?: string;
  status: 'running' | 'complete';
}

/**
 * Generate smart summary based on tool and input
 */
function getSummary(tool: string, input: unknown): string {
  const inp = input as Record<string, unknown>;

  switch (tool) {
    case 'Read': {
      const filePath = inp?.file_path as string;
      if (filePath) {
        const basename = filePath.split('/').pop() || filePath;
        return `Reading \`${basename}\``;
      }
      return 'Reading file';
    }

    case 'Write': {
      const filePath = inp?.file_path as string;
      if (filePath) {
        const basename = filePath.split('/').pop() || filePath;
        return `Writing \`${basename}\``;
      }
      return 'Writing file';
    }

    case 'Edit': {
      const filePath = inp?.file_path as string;
      if (filePath) {
        const basename = filePath.split('/').pop() || filePath;
        return `Editing \`${basename}\``;
      }
      return 'Editing file';
    }

    case 'Glob': {
      const pattern = inp?.pattern as string;
      return pattern ? `Finding files matching \`${pattern}\`` : 'Finding files';
    }

    case 'Grep': {
      const pattern = inp?.pattern as string;
      return pattern ? `Searching for \`${pattern}\`` : 'Searching code';
    }

    case 'WebFetch': {
      const url = inp?.url as string;
      if (url) {
        try {
          const hostname = new URL(url).hostname;
          return `Navigating to \`${hostname}\``;
        } catch {
          return `Fetching ${url}`;
        }
      }
      return 'Fetching web page';
    }

    case 'WebSearch': {
      const query = inp?.query as string;
      return query ? `Searching web for \`${query}\`` : 'Searching web';
    }

    case 'Bash': {
      const description = inp?.description as string;
      if (description) return description;
      const command = inp?.command as string;
      if (command) {
        const shortCmd = command.length > 40 ? command.slice(0, 40) + '...' : command;
        return `Running \`${shortCmd}\``;
      }
      return 'Running command';
    }

    case 'Task': {
      const description = inp?.description as string;
      return description || 'Running agent';
    }

    default:
      return tool;
  }
}

/**
 * Format tool input for expanded view
 */
function formatInput(tool: string, input: unknown): string {
  const inp = input as Record<string, unknown>;

  switch (tool) {
    case 'Read':
    case 'Write':
    case 'Edit':
      return inp?.file_path as string || '';

    case 'Glob':
      return inp?.pattern as string || '';

    case 'Grep':
      return `Pattern: ${inp?.pattern || ''}\nPath: ${inp?.path || '.'}`;

    case 'WebFetch':
      return inp?.url as string || '';

    case 'Bash':
      return inp?.command as string || '';

    default:
      return JSON.stringify(input, null, 2);
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

  // Normalize tool name for consistent matching (handles bash -> Bash, etc.)
  const normalizedTool = normalizeToolName(tool);
  const Icon = TOOL_ICONS[normalizedTool] || Terminal;
  const summary = getSummary(normalizedTool, input);
  const details = formatInput(normalizedTool, input);

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={springs.gentle}
      className="w-full"
    >
      {/* Collapsed row */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className={cn(
          'w-full flex items-center gap-2 px-3 py-2 rounded-lg',
          'bg-muted/50 hover:bg-muted transition-colors',
          'text-left text-sm text-muted-foreground'
        )}
      >
        {/* Expand/collapse chevron */}
        {isExpanded ? (
          <ChevronDown className="h-4 w-4 shrink-0" />
        ) : (
          <ChevronRight className="h-4 w-4 shrink-0" />
        )}

        {/* Tool icon */}
        <Icon className="h-4 w-4 shrink-0" />

        {/* Summary text */}
        <span className="flex-1 truncate font-medium">{summary}</span>

        {/* Status indicator */}
        {status === 'running' ? (
          <SpinningIcon className="h-4 w-4 shrink-0" />
        ) : (
          <CheckCircle2 className="h-4 w-4 shrink-0 text-green-600" />
        )}
      </button>

      {/* Expanded details */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="mt-1 ml-6 p-3 rounded-lg bg-muted/30 border border-border">
              {/* Input details */}
              {details && (
                <div className="mb-2">
                  <p className="text-xs text-muted-foreground mb-1 font-medium">Input:</p>
                  <pre className="text-xs font-mono whitespace-pre-wrap break-all text-foreground">
                    {details}
                  </pre>
                </div>
              )}

              {/* Output (if complete and has output) */}
              {status === 'complete' && output && (
                <div>
                  <p className="text-xs text-muted-foreground mb-1 font-medium">Output:</p>
                  <pre className="text-xs font-mono whitespace-pre-wrap break-all text-foreground max-h-48 overflow-y-auto">
                    {output.length > 1000 ? output.slice(0, 1000) + '...' : output}
                  </pre>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
});
