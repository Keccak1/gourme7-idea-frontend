import type { FC } from 'react';
import { Key, FileText, Trash2, List, PenLine } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  ToolCard,
  truncateString,
  type BaseToolDisplayProps,
  type MemoryToolArgs,
  toolColors,
} from './shared';

interface MemoryToolDisplayProps extends BaseToolDisplayProps {
  args: MemoryToolArgs;
}

// Action icons mapping
const actionIcons: Record<MemoryToolArgs['action'], FC<{ className?: string }>> = {
  read: ({ className }) => <FileText className={className} />,
  write: ({ className }) => <PenLine className={className} />,
  delete: ({ className }) => <Trash2 className={className} />,
  list: ({ className }) => <List className={className} />,
};

// Action descriptions
const actionLabels: Record<MemoryToolArgs['action'], string> = {
  read: 'Reading',
  write: 'Storing',
  delete: 'Deleting',
  list: 'Listing',
};

/**
 * MemoryToolDisplay - Displays memory tool calls
 * Shows key, action, and content for memory operations
 */
export const MemoryToolDisplay: FC<MemoryToolDisplayProps> = ({
  args,
  state = 'pending',
  result,
  isError,
}) => {
  const { action, key, content, prefix } = args;
  const colors = toolColors.memory;
  const ActionIcon = actionIcons[action] || actionIcons.read;

  // Generate descriptive title
  const getTitle = () => {
    const actionLabel = actionLabels[action] || action;
    if (key) {
      return `${actionLabel} memory: ${key}`;
    }
    if (prefix) {
      return `${actionLabel} memories with prefix: ${prefix}`;
    }
    return `${actionLabel} memory`;
  };

  return (
    <ToolCard
      toolType="memory"
      title={getTitle()}
      state={state}
      isError={isError}
      result={result}
    >
      <div className="space-y-1">
        {/* Action with icon */}
        <div className="flex items-center gap-2 text-xs">
          <ActionIcon className={cn('h-3 w-3', colors.icon)} />
          <span className="text-muted-foreground">Action:</span>
          <span className={cn(
            'font-medium px-1.5 py-0.5 rounded',
            action === 'delete' ? 'bg-red-500/20 text-red-400' : 'bg-purple-500/20 text-purple-400'
          )}>
            {action}
          </span>
        </div>

        {/* Key if present */}
        {key && (
          <div className="flex items-center gap-2 text-xs">
            <Key className={cn('h-3 w-3', colors.icon)} />
            <span className="text-muted-foreground">Key:</span>
            <span className="font-mono text-foreground">{key}</span>
          </div>
        )}

        {/* Prefix if present (for list action) */}
        {prefix && (
          <div className="flex items-center gap-2 text-xs">
            <Key className={cn('h-3 w-3', colors.icon)} />
            <span className="text-muted-foreground">Prefix:</span>
            <span className="font-mono text-foreground">{prefix}</span>
          </div>
        )}

        {/* Content preview for write action */}
        {action === 'write' && content && (
          <div className="mt-2 p-2 rounded bg-purple-500/10 border border-purple-500/20">
            <div className="flex items-start gap-2">
              <FileText className={cn('h-3 w-3 mt-0.5 shrink-0', colors.icon)} />
              <div className="text-xs">
                <span className="text-muted-foreground block mb-1">Content:</span>
                <span className="text-foreground font-mono break-all">
                  {truncateString(content, 150)}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
    </ToolCard>
  );
};

export default MemoryToolDisplay;
