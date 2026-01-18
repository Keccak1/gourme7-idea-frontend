import type { FC } from 'react';
import { Database, Search, Code } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  ToolCard,
  ParamsDisplay,
  ResultDisplay,
  type BaseToolDisplayProps,
  type ReadToolArgs,
  toolColors,
} from './shared';
import { PythonOutputDisplay, isPythonExecutionResult } from './PythonOutputDisplay';

interface ReadToolDisplayProps extends BaseToolDisplayProps {
  args: ReadToolArgs;
}

/**
 * ReadToolDisplay - Displays read tool calls
 * Shows source and query information for data fetching operations
 */
export const ReadToolDisplay: FC<ReadToolDisplayProps> = ({
  args,
  state = 'pending',
  result,
  isError,
}) => {
  const { source, query, params } = args;
  const colors = toolColors.read;

  // Check if this is a Python execution result
  const isPythonSource = source === 'python';
  // Result from read tool is wrapped: { success: boolean, data: ... }
  const resultData = result && typeof result === 'object' && 'data' in (result as Record<string, unknown>)
    ? (result as Record<string, unknown>).data
    : result;
  const hasPythonResult = isPythonSource && resultData && isPythonExecutionResult(resultData);

  // Generate descriptive title based on source and query
  const getTitle = () => {
    if (isPythonSource) {
      return 'Running Python code';
    }
    if (query) {
      return `Reading: ${source}`;
    }
    return `Fetching from ${source}`;
  };

  // Get the appropriate icon
  const SourceIcon = isPythonSource ? Code : Database;

  return (
    <ToolCard
      toolType="read"
      title={getTitle()}
      state={state}
      isError={isError}
      // Don't pass result to ToolCard if it's Python - we'll render it ourselves
      result={hasPythonResult ? undefined : result}
    >
      <div className="space-y-1">
        {/* Source with icon */}
        <div className="flex items-center gap-2 text-xs">
          <SourceIcon className={cn('h-3 w-3', colors.icon)} />
          <span className="text-muted-foreground">Source:</span>
          <span className="font-medium text-foreground">{source}</span>
        </div>

        {/* Query if present */}
        {query && (
          <div className="flex items-center gap-2 text-xs">
            <Search className={cn('h-3 w-3', colors.icon)} />
            <span className="text-muted-foreground">Query:</span>
            <span className="font-mono text-foreground">{query}</span>
          </div>
        )}

        {/* Additional params (hide code for Python as it's usually long) */}
        {!isPythonSource && <ParamsDisplay params={params} />}
        {isPythonSource && params && 'code' in params && (
          <ParamsDisplay params={{ timeout: params.timeout, packages: params.packages }} />
        )}
      </div>

      {/* Python-specific result display */}
      {hasPythonResult && resultData !== undefined && isPythonExecutionResult(resultData) ? (
        <PythonOutputDisplay result={resultData} isError={isError} />
      ) : null}

      {/* Handle Python error case where result doesn't match expected format */}
      {isPythonSource && result !== undefined && !hasPythonResult && (
        <ResultDisplay result={result} isError={isError} />
      )}
    </ToolCard>
  );
};

export default ReadToolDisplay;
