import { useState, type FC } from 'react';
import { ChevronDown, ChevronRight, Clock, AlertTriangle, Check, X, Image } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

export interface PythonExecutionResult {
  stdout: string;
  stderr: string;
  result: unknown;
  images: Array<{ format: string; data: string }>;
  executionTime: number;
  error?: {
    type: string;
    message: string;
    traceback: string;
  };
}

interface PythonOutputDisplayProps {
  result: PythonExecutionResult;
  isError?: boolean;
}

/**
 * PythonOutputDisplay - Displays Python code execution results
 *
 * Features:
 * - Base64 images displayed inline (charts from matplotlib)
 * - stdout/stderr in code blocks (collapsible if long)
 * - Execution time badge
 * - Error traceback display
 */
export const PythonOutputDisplay: FC<PythonOutputDisplayProps> = ({ result, isError }) => {
  const { stdout, stderr, result: pythonResult, images, executionTime, error } = result;

  const hasOutput = stdout.trim().length > 0;
  const hasStderr = stderr.trim().length > 0;
  const hasImages = images && images.length > 0;
  const hasResult = pythonResult !== null && pythonResult !== undefined;
  const hasError = !!error;

  const stdoutLines = stdout.trim().split('\n');
  const isLongOutput = stdoutLines.length > 10;
  const [isOutputExpanded, setIsOutputExpanded] = useState(!isLongOutput);

  const stderrLines = stderr.trim().split('\n');
  const isLongStderr = stderrLines.length > 5;
  const [isStderrExpanded, setIsStderrExpanded] = useState(!isLongStderr);

  return (
    <div className="mt-2 pt-2 border-t border-dashed border-muted space-y-3">
      {/* Header with execution time */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {hasError || isError ? (
            <X className="h-3 w-3 text-red-500" />
          ) : (
            <Check className="h-3 w-3 text-green-500" />
          )}
          <span
            className={cn(
              'text-xs font-medium',
              hasError || isError ? 'text-red-500' : 'text-green-600 dark:text-green-400'
            )}
          >
            {hasError ? 'Execution Error' : 'Executed'}
          </span>
        </div>
        <div className="flex items-center gap-1 text-xs text-muted-foreground">
          <Clock className="h-3 w-3" />
          <span>{executionTime}ms</span>
        </div>
      </div>

      {/* Images (charts) */}
      {hasImages && (
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Image className="h-3 w-3" />
            <span>{images.length} chart{images.length > 1 ? 's' : ''}</span>
          </div>
          <div className="space-y-2">
            {images.map((img, idx) => (
              <div
                key={idx}
                className="rounded-lg overflow-hidden border border-muted bg-white dark:bg-gray-900"
              >
                <img
                  src={`data:image/${img.format};base64,${img.data}`}
                  alt={`Python output chart ${idx + 1}`}
                  className="w-full max-w-full h-auto"
                  style={{ maxHeight: '500px', objectFit: 'contain' }}
                />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Python result (last expression value) */}
      {hasResult && !hasError && (
        <div className="space-y-1">
          <span className="text-xs text-muted-foreground">Result:</span>
          <pre className="p-2 rounded text-xs font-mono bg-muted text-foreground overflow-x-auto">
            {typeof pythonResult === 'string' ? pythonResult : JSON.stringify(pythonResult, null, 2)}
          </pre>
        </div>
      )}

      {/* stdout */}
      {hasOutput && (
        <div className="space-y-1">
          <Collapsible open={isOutputExpanded} onOpenChange={setIsOutputExpanded}>
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">Output:</span>
              {isLongOutput && (
                <CollapsibleTrigger className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors">
                  {isOutputExpanded ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
                  <span>{isOutputExpanded ? 'Collapse' : `Show all (${stdoutLines.length} lines)`}</span>
                </CollapsibleTrigger>
              )}
            </div>
            {isLongOutput ? (
              <>
                {!isOutputExpanded && (
                  <pre className="p-2 rounded text-xs font-mono bg-muted text-foreground overflow-x-auto max-h-32 overflow-y-auto">
                    {stdoutLines.slice(0, 5).join('\n')}
                    {'\n...'}
                  </pre>
                )}
                <CollapsibleContent>
                  <pre className="p-2 rounded text-xs font-mono bg-muted text-foreground overflow-x-auto max-h-64 overflow-y-auto">
                    {stdout}
                  </pre>
                </CollapsibleContent>
              </>
            ) : (
              <pre className="p-2 rounded text-xs font-mono bg-muted text-foreground overflow-x-auto">
                {stdout}
              </pre>
            )}
          </Collapsible>
        </div>
      )}

      {/* stderr (warnings) */}
      {hasStderr && !hasError && (
        <div className="space-y-1">
          <Collapsible open={isStderrExpanded} onOpenChange={setIsStderrExpanded}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1 text-xs text-amber-500">
                <AlertTriangle className="h-3 w-3" />
                <span>Warnings:</span>
              </div>
              {isLongStderr && (
                <CollapsibleTrigger className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors">
                  {isStderrExpanded ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
                  <span>{isStderrExpanded ? 'Collapse' : `Show all (${stderrLines.length} lines)`}</span>
                </CollapsibleTrigger>
              )}
            </div>
            {isLongStderr ? (
              <>
                {!isStderrExpanded && (
                  <pre className="p-2 rounded text-xs font-mono bg-amber-500/10 text-amber-600 dark:text-amber-400 overflow-x-auto max-h-24 overflow-y-auto">
                    {stderrLines.slice(0, 3).join('\n')}
                    {'\n...'}
                  </pre>
                )}
                <CollapsibleContent>
                  <pre className="p-2 rounded text-xs font-mono bg-amber-500/10 text-amber-600 dark:text-amber-400 overflow-x-auto max-h-48 overflow-y-auto">
                    {stderr}
                  </pre>
                </CollapsibleContent>
              </>
            ) : (
              <pre className="p-2 rounded text-xs font-mono bg-amber-500/10 text-amber-600 dark:text-amber-400 overflow-x-auto">
                {stderr}
              </pre>
            )}
          </Collapsible>
        </div>
      )}

      {/* Error display */}
      {hasError && (
        <div className="space-y-2">
          <div className="flex items-center gap-1 text-xs text-red-500">
            <X className="h-3 w-3" />
            <span className="font-medium">{error.type}: {error.message}</span>
          </div>
          {error.traceback && (
            <pre className="p-2 rounded text-xs font-mono bg-red-500/10 text-red-400 overflow-x-auto max-h-48 overflow-y-auto">
              {error.traceback}
            </pre>
          )}
        </div>
      )}
    </div>
  );
};

/**
 * Type guard to check if a result is a PythonExecutionResult
 */
export const isPythonExecutionResult = (result: unknown): result is PythonExecutionResult => {
  if (typeof result !== 'object' || result === null) return false;

  const obj = result as Record<string, unknown>;

  // Check for required fields
  return (
    typeof obj.executionTime === 'number' &&
    Array.isArray(obj.images) &&
    typeof obj.stdout === 'string' &&
    typeof obj.stderr === 'string'
  );
};

export default PythonOutputDisplay;
