import type { FC } from 'react';
import { Target, Zap, AlertTriangle, Shield } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  ToolCard,
  ParamsDisplay,
  type BaseToolDisplayProps,
  type WriteToolArgs,
  toolColors,
} from './shared';

interface WriteToolDisplayProps extends BaseToolDisplayProps {
  args: WriteToolArgs;
}

// High-risk actions that require extra attention
const HIGH_RISK_ACTIONS = [
  'transfer',
  'swap',
  'withdraw',
  'approve',
  'revoke',
  'execute',
  'send',
];

// Check if action is high-risk
const isHighRiskAction = (action: string): boolean => {
  const lowerAction = action.toLowerCase();
  return HIGH_RISK_ACTIONS.some((risk) => lowerAction.includes(risk));
};

// Risk level badge
const RiskBadge: FC<{ isHighRisk: boolean }> = ({ isHighRisk }) => {
  if (isHighRisk) {
    return (
      <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-red-500/20 border border-red-500/30">
        <AlertTriangle className="h-3 w-3 text-red-500" />
        <span className="text-xs font-medium text-red-500">High Risk</span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-green-500/20 border border-green-500/30">
      <Shield className="h-3 w-3 text-green-500" />
      <span className="text-xs font-medium text-green-500">Safe</span>
    </div>
  );
};

/**
 * WriteToolDisplay - Displays write tool calls with risk indicator
 * Shows target, action, and risk level for state-changing operations
 */
export const WriteToolDisplay: FC<WriteToolDisplayProps> = ({
  args,
  state = 'pending',
  result,
  isError,
}) => {
  const { target, action, params } = args;
  const colors = toolColors.write;
  const highRisk = isHighRiskAction(action);

  // Generate descriptive title
  const getTitle = () => {
    return `${action} on ${target}`;
  };

  return (
    <ToolCard
      toolType="write"
      title={getTitle()}
      state={state}
      isError={isError}
      result={result}
    >
      <div className="space-y-2">
        {/* Risk indicator at the top */}
        <div className="flex items-center justify-between">
          <RiskBadge isHighRisk={highRisk} />
        </div>

        {/* Target and action info */}
        <div className="space-y-1">
          {/* Target */}
          <div className="flex items-center gap-2 text-xs">
            <Target className={cn('h-3 w-3', colors.icon)} />
            <span className="text-muted-foreground">Target:</span>
            <span className="font-medium text-foreground">{target}</span>
          </div>

          {/* Action */}
          <div className="flex items-center gap-2 text-xs">
            <Zap className={cn('h-3 w-3', highRisk ? 'text-red-500' : colors.icon)} />
            <span className="text-muted-foreground">Action:</span>
            <span className={cn(
              'font-medium',
              highRisk ? 'text-red-500' : 'text-foreground'
            )}>
              {action}
            </span>
          </div>
        </div>

        {/* High risk warning */}
        {highRisk && state === 'running' && (
          <div className="flex items-start gap-2 p-2 rounded bg-red-500/10 border border-red-500/20">
            <AlertTriangle className="h-4 w-4 text-red-500 shrink-0 mt-0.5" />
            <p className="text-xs text-red-400">
              This action will modify blockchain state. Ensure you have reviewed the parameters.
            </p>
          </div>
        )}

        {/* Additional params */}
        <ParamsDisplay params={params} />
      </div>
    </ToolCard>
  );
};

export default WriteToolDisplay;
