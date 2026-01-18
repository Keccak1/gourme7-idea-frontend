import type { FC } from 'react';
import { Clock, Play, Pause, Trash2, List, Plus, MessageSquare, Hash } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  ToolCard,
  truncateString,
  type BaseToolDisplayProps,
  type ScheduleToolArgs,
  toolColors,
} from './shared';

interface ScheduleToolDisplayProps extends BaseToolDisplayProps {
  args: ScheduleToolArgs;
}

// Action icons mapping
const actionIcons: Record<ScheduleToolArgs['action'], FC<{ className?: string }>> = {
  create: ({ className }) => <Plus className={className} />,
  list: ({ className }) => <List className={className} />,
  delete: ({ className }) => <Trash2 className={className} />,
  pause: ({ className }) => <Pause className={className} />,
  resume: ({ className }) => <Play className={className} />,
};

// Action labels
const actionLabels: Record<ScheduleToolArgs['action'], string> = {
  create: 'Creating schedule',
  list: 'Listing schedules',
  delete: 'Deleting schedule',
  pause: 'Pausing schedule',
  resume: 'Resuming schedule',
};

// Parse and format cron expression for readability
const formatCron = (cron: string): string => {
  // Common cron patterns
  const patterns: Record<string, string> = {
    '* * * * *': 'Every minute',
    '*/5 * * * *': 'Every 5 minutes',
    '*/15 * * * *': 'Every 15 minutes',
    '*/30 * * * *': 'Every 30 minutes',
    '0 * * * *': 'Every hour',
    '0 */2 * * *': 'Every 2 hours',
    '0 */6 * * *': 'Every 6 hours',
    '0 */12 * * *': 'Every 12 hours',
    '0 0 * * *': 'Daily at midnight',
    '0 12 * * *': 'Daily at noon',
    '0 0 * * 0': 'Weekly on Sunday',
    '0 0 * * 1': 'Weekly on Monday',
    '0 0 1 * *': 'Monthly on 1st',
  };

  return patterns[cron] || cron;
};

/**
 * ScheduleToolDisplay - Displays schedule tool calls
 * Shows cron expression, prompt, and schedule management operations
 */
export const ScheduleToolDisplay: FC<ScheduleToolDisplayProps> = ({
  args,
  state = 'pending',
  result,
  isError,
}) => {
  const { action, cron, prompt, maxRuns, id } = args;
  const colors = toolColors.schedule;
  const ActionIcon = actionIcons[action] || actionIcons.list;

  // Generate descriptive title
  const getTitle = () => {
    const label = actionLabels[action] || action;
    if (id) {
      return `${label} #${id}`;
    }
    return label;
  };

  return (
    <ToolCard
      toolType="schedule"
      title={getTitle()}
      state={state}
      isError={isError}
      result={result}
    >
      <div className="space-y-2">
        {/* Action badge */}
        <div className="flex items-center gap-2 text-xs">
          <ActionIcon className={cn('h-3 w-3', colors.icon)} />
          <span className={cn(
            'font-medium px-1.5 py-0.5 rounded',
            action === 'delete' ? 'bg-red-500/20 text-red-400' :
            action === 'pause' ? 'bg-yellow-500/20 text-yellow-400' :
            action === 'resume' ? 'bg-green-500/20 text-green-400' :
            'bg-green-500/20 text-green-400'
          )}>
            {action}
          </span>
        </div>

        {/* Schedule ID if present */}
        {id && (
          <div className="flex items-center gap-2 text-xs">
            <Hash className={cn('h-3 w-3', colors.icon)} />
            <span className="text-muted-foreground">ID:</span>
            <span className="font-mono text-foreground">{id}</span>
          </div>
        )}

        {/* Cron expression for create action */}
        {cron && (
          <div className="flex items-start gap-2 text-xs">
            <Clock className={cn('h-3 w-3 mt-0.5', colors.icon)} />
            <div>
              <span className="text-muted-foreground">Schedule:</span>
              <div className="mt-0.5">
                <span className="font-mono text-foreground bg-green-500/10 px-1.5 py-0.5 rounded">
                  {cron}
                </span>
                <span className="text-muted-foreground ml-2">
                  ({formatCron(cron)})
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Prompt for create action */}
        {prompt && (
          <div className="mt-2 p-2 rounded bg-green-500/10 border border-green-500/20">
            <div className="flex items-start gap-2">
              <MessageSquare className={cn('h-3 w-3 mt-0.5 shrink-0', colors.icon)} />
              <div className="text-xs">
                <span className="text-muted-foreground block mb-1">Prompt:</span>
                <span className="text-foreground italic">
                  "{truncateString(prompt, 150)}"
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Max runs if specified */}
        {maxRuns !== undefined && (
          <div className="flex items-center gap-2 text-xs">
            <Hash className={cn('h-3 w-3', colors.icon)} />
            <span className="text-muted-foreground">Max runs:</span>
            <span className="font-medium text-foreground">{maxRuns}</span>
          </div>
        )}
      </div>
    </ToolCard>
  );
};

export default ScheduleToolDisplay;
