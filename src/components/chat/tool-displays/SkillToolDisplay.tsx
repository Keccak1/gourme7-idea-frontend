import type { FC } from 'react';
import { Sparkles, Download, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  ToolCard,
  type BaseToolDisplayProps,
  type SkillToolArgs,
  toolColors,
} from './shared';

interface SkillToolDisplayProps extends BaseToolDisplayProps {
  args: SkillToolArgs;
}

// Format skill name for display
const formatSkillName = (skillName: string): string => {
  return skillName
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};

/**
 * SkillToolDisplay - Displays skill loading operations
 * Shows animated loading indicator and skill name
 */
export const SkillToolDisplay: FC<SkillToolDisplayProps> = ({
  args,
  state = 'pending',
  result,
  isError,
}) => {
  const { skillName } = args;
  const colors = toolColors.skill;
  const isLoading = state === 'running' || state === 'pending';
  const formattedName = formatSkillName(skillName);

  return (
    <ToolCard
      toolType="skill"
      title={`Loading: ${formattedName}`}
      state={state}
      isError={isError}
      result={result}
    >
      <div className="space-y-2">
        {/* Skill loading animation */}
        <div className={cn(
          'flex items-center gap-3 p-3 rounded-lg',
          'bg-gradient-to-r from-amber-500/5 to-amber-500/10',
          'border border-amber-500/20'
        )}>
          {/* Animated icon */}
          <div className={cn(
            'relative flex items-center justify-center',
            'w-10 h-10 rounded-lg',
            'bg-amber-500/20'
          )}>
            {isLoading ? (
              <>
                <Sparkles className={cn('h-5 w-5', colors.icon, 'animate-pulse')} />
                <div className="absolute inset-0 rounded-lg border-2 border-amber-500/30 animate-ping" />
              </>
            ) : (
              <Sparkles className={cn('h-5 w-5', colors.icon)} />
            )}
          </div>

          {/* Skill info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-medium text-foreground">{formattedName}</span>
              {isLoading && (
                <Loader2 className="h-3 w-3 text-amber-500 animate-spin" />
              )}
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              {isLoading ? 'Loading skill capabilities...' : 'Skill loaded successfully'}
            </p>
          </div>

          {/* Download indicator */}
          <Download className={cn(
            'h-4 w-4 shrink-0',
            isLoading ? 'text-amber-500 animate-bounce' : 'text-green-500'
          )} />
        </div>

        {/* Loading steps (visible during loading) */}
        {isLoading && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground pl-1">
            <div className="flex gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse delay-100" />
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse delay-200" />
            </div>
            <span>Reading skill documentation and handlers</span>
          </div>
        )}
      </div>
    </ToolCard>
  );
};

export default SkillToolDisplay;
