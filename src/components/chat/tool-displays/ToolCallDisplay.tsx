import { useState, type FC } from 'react';
import {
  ChevronDown,
  ChevronRight,
  Wrench,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

// Import specialized tool displays
import { ReadToolDisplay } from './ReadToolDisplay';
import { WriteToolDisplay } from './WriteToolDisplay';
import { MemoryToolDisplay } from './MemoryToolDisplay';
import { ScheduleToolDisplay } from './ScheduleToolDisplay';
import { SkillToolDisplay } from './SkillToolDisplay';

// Import shared types and utilities
import {
  type BaseToolDisplayProps,
  type ToolCallState,
  type ToolType,
  type ReadToolArgs,
  type WriteToolArgs,
  type MemoryToolArgs,
  type ScheduleToolArgs,
  type SkillToolArgs,
  StateIndicator,
  formatValue,
  truncateString,
} from './shared';

// Re-export types for consumers
export type { ToolCallState, ToolType } from './shared';

export interface ToolCallDisplayProps {
  toolCallId: string;
  toolName: string;
  args: Record<string, unknown>;
  state?: ToolCallState;
  result?: unknown;
  isError?: boolean;
}

/**
 * Detect tool type from tool name
 * Returns the specific tool type or undefined for unknown tools
 */
const detectToolType = (toolName: string): ToolType | undefined => {
  const name = toolName.toLowerCase();

  // Exact matches for our 5 universal tools
  if (name === 'read') return 'read';
  if (name === 'write') return 'write';
  if (name === 'memory') return 'memory';
  if (name === 'schedule') return 'schedule';
  if (name === 'skill') return 'skill';

  // Fallback pattern matching for variations
  if (name.startsWith('read_') || name.endsWith('_read')) return 'read';
  if (name.startsWith('write_') || name.endsWith('_write')) return 'write';
  if (name.startsWith('memory_') || name.endsWith('_memory')) return 'memory';
  if (name.startsWith('schedule_') || name.endsWith('_schedule')) return 'schedule';
  if (name.startsWith('skill_') || name.endsWith('_skill')) return 'skill';

  return undefined;
};

/**
 * Type guard for ReadToolArgs
 */
const isReadToolArgs = (args: Record<string, unknown>): args is ReadToolArgs => {
  return typeof args.source === 'string';
};

/**
 * Type guard for WriteToolArgs
 */
const isWriteToolArgs = (args: Record<string, unknown>): args is WriteToolArgs => {
  return typeof args.target === 'string' && typeof args.action === 'string';
};

/**
 * Type guard for MemoryToolArgs
 */
const isMemoryToolArgs = (args: Record<string, unknown>): args is MemoryToolArgs => {
  return typeof args.action === 'string' &&
    ['read', 'write', 'delete', 'list'].includes(args.action as string);
};

/**
 * Type guard for ScheduleToolArgs
 */
const isScheduleToolArgs = (args: Record<string, unknown>): args is ScheduleToolArgs => {
  return typeof args.action === 'string' &&
    ['create', 'list', 'delete', 'pause', 'resume'].includes(args.action as string);
};

/**
 * Type guard for SkillToolArgs
 */
const isSkillToolArgs = (args: Record<string, unknown>): args is SkillToolArgs => {
  return args.action === 'load' && typeof args.skillName === 'string';
};

/**
 * Fallback display for unknown tool types
 * Shows generic tool information without "unknown:" prefix
 */
const UnknownToolDisplay: FC<BaseToolDisplayProps> = ({
  toolName,
  args,
  state = 'pending',
  result,
  isError,
}) => {
  const entries = Object.entries(args);
  const shouldCollapse = entries.length > 3;
  const [isOpen, setIsOpen] = useState(!shouldCollapse);

  return (
    <div
      className={cn(
        'rounded-lg border p-3 my-2',
        'bg-gray-500/10',
        'border-gray-500/30',
        'transition-all duration-200'
      )}
    >
      {/* Header with tool name (no "unknown:" prefix) */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <Wrench className="h-4 w-4 text-gray-500" />
          <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
            {toolName}
          </span>
        </div>
        <StateIndicator state={state} isError={isError} />
      </div>

      {/* Arguments */}
      <div className="mt-2">
        {entries.length === 0 ? (
          <span className="text-muted-foreground text-xs italic">No arguments</span>
        ) : (
          <Collapsible open={isOpen} onOpenChange={setIsOpen}>
            <CollapsibleTrigger className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors">
              {isOpen ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
              <span>
                {entries.length} argument{entries.length !== 1 ? 's' : ''}
              </span>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <div className="mt-2 space-y-1 pl-4 border-l-2 border-muted">
                {entries.map(([key, value]) => (
                  <div key={key} className="flex items-start gap-2 text-xs font-mono">
                    <span className="text-muted-foreground">{key}:</span>
                    <span className="text-foreground break-all">
                      {truncateString(formatValue(value), 100)}
                    </span>
                  </div>
                ))}
              </div>
            </CollapsibleContent>
          </Collapsible>
        )}
      </div>

      {/* Result (if available) */}
      {result !== undefined && (
        <div
          className={cn(
            'mt-2 pt-2 border-t border-dashed',
            isError ? 'border-red-500/30' : 'border-muted'
          )}
        >
          <div className="flex items-center gap-2 text-xs">
            <span
              className={cn(
                'font-medium',
                isError ? 'text-red-500' : 'text-green-600 dark:text-green-400'
              )}
            >
              {isError ? 'Error:' : 'Result:'}
            </span>
            <span className={cn(isError ? 'text-red-400' : 'text-muted-foreground')}>
              {truncateString(formatValue(result), 100)}
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

/**
 * Main ToolCallDisplay component - Router
 *
 * Routes tool calls to specialized display components based on tool type.
 * Each tool type has a dedicated display component optimized for its data.
 */
export const ToolCallDisplay: FC<ToolCallDisplayProps> = (props) => {
  const { toolName, args, toolCallId, state = 'pending', result, isError } = props;

  // Detect tool type
  const toolType = detectToolType(toolName);

  // Route to specialized display based on tool type and args validation
  switch (toolType) {
    case 'read':
      if (isReadToolArgs(args)) {
        return (
          <ReadToolDisplay
            toolCallId={toolCallId}
            toolName={toolName}
            args={args}
            state={state}
            result={result}
            isError={isError}
          />
        );
      }
      break;

    case 'write':
      if (isWriteToolArgs(args)) {
        return (
          <WriteToolDisplay
            toolCallId={toolCallId}
            toolName={toolName}
            args={args}
            state={state}
            result={result}
            isError={isError}
          />
        );
      }
      break;

    case 'memory':
      if (isMemoryToolArgs(args)) {
        return (
          <MemoryToolDisplay
            toolCallId={toolCallId}
            toolName={toolName}
            args={args}
            state={state}
            result={result}
            isError={isError}
          />
        );
      }
      break;

    case 'schedule':
      if (isScheduleToolArgs(args)) {
        return (
          <ScheduleToolDisplay
            toolCallId={toolCallId}
            toolName={toolName}
            args={args}
            state={state}
            result={result}
            isError={isError}
          />
        );
      }
      break;

    case 'skill':
      if (isSkillToolArgs(args)) {
        return (
          <SkillToolDisplay
            toolCallId={toolCallId}
            toolName={toolName}
            args={args}
            state={state}
            result={result}
            isError={isError}
          />
        );
      }
      break;
  }

  // Fallback to unknown tool display
  return (
    <UnknownToolDisplay
      toolCallId={toolCallId}
      toolName={toolName}
      args={args}
      state={state}
      result={result}
      isError={isError}
    />
  );
};

export default ToolCallDisplay;
