import { Link } from 'react-router-dom';
import { CheckCircle, XCircle, Clock, SkipForward, Loader2, ExternalLink } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { useScheduleControllerGetExecutions } from '@/api/endpoints/schedules/schedules';
import type { ExecutionResponseDto, ExecutionListResponseDto } from '@/api/schemas';

interface Props {
  scheduleId: string;
}

const statusIcons = {
  PENDING: <Clock className="h-4 w-4 text-yellow-500" />,
  RUNNING: <Loader2 className="h-4 w-4 text-blue-500 animate-spin" />,
  COMPLETED: <CheckCircle className="h-4 w-4 text-green-500" />,
  FAILED: <XCircle className="h-4 w-4 text-red-500" />,
  SKIPPED: <SkipForward className="h-4 w-4 text-gray-500" />,
};

export function ExecutionHistoryPanel({ scheduleId }: Props) {
  const { data, isLoading } = useScheduleControllerGetExecutions(scheduleId, { limit: 10 });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const executionsData = (data as any)?.data as ExecutionListResponseDto | undefined;

  if (isLoading) {
    return (
      <div className="bg-muted/50 p-4 rounded-lg mt-2">
        <div className="flex items-center justify-center text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin mr-2" />
          Loading execution history...
        </div>
      </div>
    );
  }

  if (!executionsData?.executions?.length) {
    return (
      <div className="bg-muted/50 p-4 rounded-lg mt-2">
        <div className="text-center text-muted-foreground text-sm">No executions yet</div>
      </div>
    );
  }

  return (
    <div className="bg-muted/50 p-4 rounded-lg mt-2">
      <h4 className="text-sm font-medium mb-3">Execution History ({executionsData.total} total)</h4>
      <div className="space-y-2">
        {executionsData.executions.map((exec: ExecutionResponseDto) => (
          <div key={exec.id} className="flex items-center gap-3 text-sm">
            <span className="w-8 text-muted-foreground">#{exec.runNumber}</span>
            {statusIcons[exec.status]}
            <span className="flex-1">
              {exec.startedAt && formatDistanceToNow(new Date(exec.startedAt), { addSuffix: true })}
            </span>
            {exec.status === 'FAILED' && exec.error && (
              <span className="text-red-500 text-xs truncate max-w-[200px]" title={exec.error}>
                {exec.error}
              </span>
            )}
            {exec.session && (
              <Link
                to={`/chat/${exec.session.id}`}
                className="text-blue-500 hover:underline flex items-center gap-1"
              >
                View <ExternalLink className="h-3 w-3" />
              </Link>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
