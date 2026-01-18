import { useState, type FC, type ReactNode } from 'react';
import {
  Loader2,
  ChevronDown,
  ChevronRight,
  Check,
  X,
  BookOpen,
  Send,
  Brain,
  Calendar,
  Sparkles,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

// Tool call state types
export type ToolCallState = 'pending' | 'running' | 'completed' | 'error';

// Tool types matching backend
export type ToolType = 'read' | 'write' | 'memory' | 'schedule' | 'skill';

// Base props for all tool displays
export interface BaseToolDisplayProps {
  toolCallId: string;
  toolName: string;
  args: Record<string, unknown>;
  state?: ToolCallState;
  result?: unknown;
  isError?: boolean;
}

// Read tool args
export interface ReadToolArgs extends Record<string, unknown> {
  source: string;
  query?: string;
  params?: Record<string, unknown>;
}

// Write tool args
export interface WriteToolArgs extends Record<string, unknown> {
  target: string;
  action: string;
  params?: Record<string, unknown>;
}

// Memory tool args
export interface MemoryToolArgs extends Record<string, unknown> {
  action: 'read' | 'write' | 'delete' | 'list';
  key?: string;
  content?: string;
  prefix?: string;
}

// Schedule tool args
export interface ScheduleToolArgs extends Record<string, unknown> {
  action: 'create' | 'list' | 'delete' | 'pause' | 'resume';
  cron?: string;
  prompt?: string;
  maxRuns?: number;
  id?: string;
}

// Skill tool args
export interface SkillToolArgs extends Record<string, unknown> {
  action: 'load';
  skillName: string;
}

// Tool icons configuration
export const toolIcons: Record<ToolType, FC<{ className?: string }>> = {
  read: ({ className }) => <BookOpen className={className} />,
  write: ({ className }) => <Send className={className} />,
  memory: ({ className }) => <Brain className={className} />,
  schedule: ({ className }) => <Calendar className={className} />,
  skill: ({ className }) => <Sparkles className={className} />,
};

// Tool colors configuration
export const toolColors: Record<ToolType, {
  bg: string;
  border: string;
  text: string;
  icon: string;
  accent: string;
}> = {
  read: {
    bg: 'bg-blue-500/10',
    border: 'border-blue-500/30',
    text: 'text-blue-600 dark:text-blue-400',
    icon: 'text-blue-500',
    accent: 'bg-blue-500',
  },
  write: {
    bg: 'bg-orange-500/10',
    border: 'border-orange-500/30',
    text: 'text-orange-600 dark:text-orange-400',
    icon: 'text-orange-500',
    accent: 'bg-orange-500',
  },
  memory: {
    bg: 'bg-purple-500/10',
    border: 'border-purple-500/30',
    text: 'text-purple-600 dark:text-purple-400',
    icon: 'text-purple-500',
    accent: 'bg-purple-500',
  },
  schedule: {
    bg: 'bg-green-500/10',
    border: 'border-green-500/30',
    text: 'text-green-600 dark:text-green-400',
    icon: 'text-green-500',
    accent: 'bg-green-500',
  },
  skill: {
    bg: 'bg-amber-500/10',
    border: 'border-amber-500/30',
    text: 'text-amber-600 dark:text-amber-400',
    icon: 'text-amber-500',
    accent: 'bg-amber-500',
  },
};

// Tool display names (without "unknown:" prefix)
export const toolDisplayNames: Record<ToolType, string> = {
  read: 'Read',
  write: 'Write',
  memory: 'Memory',
  schedule: 'Schedule',
  skill: 'Skill',
};

// State indicator component
export const StateIndicator: FC<{ state: ToolCallState; isError?: boolean }> = ({ state, isError }) => {
  if (isError || state === 'error') {
    return <X className="h-4 w-4 text-red-500 animate-message-appear" />;
  }

  switch (state) {
    case 'pending':
      return (
        <div className="h-4 w-4 rounded-full border-2 border-muted-foreground/50 animate-pulse" />
      );
    case 'running':
      return <Loader2 className="h-4 w-4 text-primary animate-spin" />;
    case 'completed':
      return <Check className="h-4 w-4 text-green-500 animate-message-appear" />;
    default:
      return null;
  }
};

// Format value for display
export const formatValue = (value: unknown): string => {
  if (value === null) return 'null';
  if (value === undefined) return 'undefined';
  if (typeof value === 'string') return value;
  if (typeof value === 'number' || typeof value === 'boolean') return String(value);
  if (typeof value === 'bigint') return `${value.toString()}n`;
  if (Array.isArray(value)) return JSON.stringify(value);
  if (typeof value === 'object') return JSON.stringify(value);
  return String(value);
};

// Truncate long strings
export const truncateString = (str: string, maxLength: number): string => {
  if (str.length <= maxLength) return str;
  return str.substring(0, maxLength) + '...';
};

// Format result for display
export const formatResult = (result: unknown): string => {
  if (result === null) return 'null';
  if (result === undefined) return 'undefined';
  if (typeof result === 'string') return result;
  try {
    return JSON.stringify(result, null, 2);
  } catch {
    return String(result);
  }
};

// Base card wrapper for tool displays
export const ToolCard: FC<{
  toolType: ToolType;
  title: string;
  state: ToolCallState;
  isError?: boolean;
  children: ReactNode;
  result?: unknown;
}> = ({ toolType, title, state, isError, children, result }) => {
  const colors = toolColors[toolType];
  const Icon = toolIcons[toolType];
  const hasResult = result !== undefined;
  const isRunning = state === 'running';
  const isCompleted = state === 'completed';

  return (
    <div
      className={cn(
        'rounded-lg border p-3 my-2',
        colors.bg,
        colors.border,
        'transition-all duration-300 ease-out',
        // Running state - glow effect
        isRunning && 'animate-tool-glow',
        // Completed state - left accent border
        isCompleted && !isError && 'border-l-4 border-l-green-500',
        // Error state - red left border
        isError && 'border-l-4 border-l-red-500'
      )}
      style={isRunning ? { '--glow-color': getGlowColor(toolType) } as React.CSSProperties : undefined}
    >
      {/* Header with tool name and state */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <Icon className={cn('h-4 w-4 transition-transform duration-200', colors.icon, isRunning && 'scale-110')} />
          <span className={cn('text-sm font-medium', colors.text)}>{title}</span>
        </div>
        <StateIndicator state={state} isError={isError} />
      </div>

      {/* Tool-specific content */}
      <div className="mt-2">{children}</div>

      {/* Result (if available) */}
      {hasResult && <ResultDisplay result={result} isError={isError} />}
    </div>
  );
};

// Helper function to get glow color based on tool type
const getGlowColor = (toolType: ToolType): string => {
  const glowColors: Record<ToolType, string> = {
    read: 'rgba(59, 130, 246, 0.5)',      // blue-500
    write: 'rgba(249, 115, 22, 0.5)',     // orange-500
    memory: 'rgba(168, 85, 247, 0.5)',    // purple-500
    schedule: 'rgba(34, 197, 94, 0.5)',   // green-500
    skill: 'rgba(245, 158, 11, 0.5)',     // amber-500
  };
  return glowColors[toolType];
};

// Result display component with collapsible behavior
export const ResultDisplay: FC<{ result: unknown; isError?: boolean }> = ({ result, isError }) => {
  const formattedResult = formatResult(result);
  const isLongResult = formattedResult.length > 200;
  const [isOpen, setIsOpen] = useState(!isLongResult);

  return (
    <div
      className={cn(
        'mt-2 pt-2 border-t border-dashed',
        isError ? 'border-red-500/30' : 'border-muted'
      )}
    >
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {isError ? (
              <X className="h-3 w-3 text-red-500" />
            ) : (
              <Check className="h-3 w-3 text-green-500" />
            )}
            <span
              className={cn(
                'text-xs font-medium',
                isError ? 'text-red-500' : 'text-green-600 dark:text-green-400'
              )}
            >
              {isError ? 'Error' : 'Result'}:
            </span>
            {!isLongResult && (
              <span className={cn('text-xs', isError ? 'text-red-400' : 'text-muted-foreground')}>
                {truncateString(formattedResult, 50)}
              </span>
            )}
          </div>
          {isLongResult && (
            <CollapsibleTrigger className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors">
              {isOpen ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
              <span>{isOpen ? 'Hide' : 'Show full result'}</span>
            </CollapsibleTrigger>
          )}
        </div>
        {isLongResult && (
          <CollapsibleContent>
            <pre
              className={cn(
                'mt-2 p-2 rounded text-xs font-mono overflow-x-auto max-h-48 overflow-y-auto',
                isError ? 'bg-red-500/10 text-red-300' : 'bg-muted text-muted-foreground'
              )}
            >
              {formattedResult}
            </pre>
          </CollapsibleContent>
        )}
      </Collapsible>
    </div>
  );
};

// Key-value display row
export const InfoRow: FC<{
  label: string;
  value: string | ReactNode;
  className?: string;
  mono?: boolean;
}> = ({ label, value, className, mono = false }) => (
  <div className={cn('flex items-start gap-2 text-xs', className)}>
    <span className="text-muted-foreground shrink-0">{label}:</span>
    <span className={cn('text-foreground break-all', mono && 'font-mono')}>
      {value}
    </span>
  </div>
);

// Collapsible params display
export const ParamsDisplay: FC<{ params?: Record<string, unknown> }> = ({ params }) => {
  const [isOpen, setIsOpen] = useState(false);

  if (!params || Object.keys(params).length === 0) {
    return null;
  }

  const entries = Object.entries(params);

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <CollapsibleTrigger className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors mt-1">
        {isOpen ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
        <span>
          {entries.length} param{entries.length !== 1 ? 's' : ''}
        </span>
      </CollapsibleTrigger>
      <CollapsibleContent>
        <div className="mt-1 space-y-1 pl-4 border-l-2 border-muted">
          {entries.map(([key, value]) => (
            <InfoRow
              key={key}
              label={key}
              value={truncateString(formatValue(value), 80)}
              mono
            />
          ))}
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
};
