import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Calendar,
  Trash2,
  Pause,
  Play,
  RefreshCw,
  AlertCircle,
  Clock,
  MessageSquare,
  History,
} from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  useScheduleControllerFindAll,
  useScheduleControllerDelete,
  useScheduleControllerPause,
  useScheduleControllerResume,
  getScheduleControllerFindAllQueryKey,
} from '@/api/endpoints/schedules/schedules';
import type { ScheduleListResponseDto, ScheduleResponseDto } from '@/api/schemas';
import { toast } from '@/hooks/use-toast';
import { ExecutionHistoryPanel } from '@/components/schedules/ExecutionHistoryPanel';

/**
 * Convert cron expression to human-readable format
 */
function cronToHuman(cron: string): string {
  const parts = cron.split(' ');
  if (parts.length < 5) return cron;

  const [minute, hour, dayOfMonth, month, dayOfWeek] = parts;

  // Every minute
  if (minute === '*' && hour === '*') return 'Every minute';

  // Every hour
  if (minute !== '*' && hour === '*' && dayOfMonth === '*') {
    return `Every hour at :${minute.padStart(2, '0')}`;
  }

  // Daily at specific time
  if (dayOfMonth === '*' && month === '*' && dayOfWeek === '*') {
    return `Daily at ${hour}:${minute.padStart(2, '0')}`;
  }

  // Every N hours
  if (hour.startsWith('*/')) {
    const interval = hour.substring(2);
    return `Every ${interval}h`;
  }

  // Weekly
  if (dayOfWeek !== '*' && dayOfMonth === '*') {
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const dayName = days[parseInt(dayOfWeek)] || dayOfWeek;
    return `Every ${dayName} at ${hour}:${minute.padStart(2, '0')}`;
  }

  // Monthly
  if (dayOfMonth !== '*' && month === '*') {
    return `Monthly on day ${dayOfMonth} at ${hour}:${minute.padStart(2, '0')}`;
  }

  return cron;
}

/**
 * Format date to relative time or short date
 */
function formatDate(dateStr: string | undefined | null): string {
  if (!dateStr) return '-';

  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = date.getTime() - now.getTime();
  const diffMins = Math.round(diffMs / 60000);
  const diffHours = Math.round(diffMs / 3600000);
  const diffDays = Math.round(diffMs / 86400000);

  // Past
  if (diffMs < 0) {
    if (Math.abs(diffMins) < 60) return `${Math.abs(diffMins)}m ago`;
    if (Math.abs(diffHours) < 24) return `${Math.abs(diffHours)}h ago`;
    if (Math.abs(diffDays) < 7) return `${Math.abs(diffDays)}d ago`;
    return date.toLocaleDateString();
  }

  // Future
  if (diffMins < 60) return `in ${diffMins}m`;
  if (diffHours < 24) return `in ${diffHours}h`;
  if (diffDays < 7) return `in ${diffDays}d`;
  return date.toLocaleDateString();
}

/**
 * Truncate prompt text
 */
function truncatePrompt(prompt: string, maxLength: number = 30): string {
  if (prompt.length <= maxLength) return prompt;
  return prompt.substring(0, maxLength) + '...';
}

// Status badge component
function StatusBadge({ status }: { status: string }) {
  const statusConfig: Record<string, { className: string; icon: string }> = {
    ACTIVE: { className: 'bg-green-500/10 text-green-600', icon: '●' },
    PAUSED: { className: 'bg-gray-500/10 text-gray-500', icon: '○' },
    COMPLETED: { className: 'bg-blue-500/10 text-blue-600', icon: '✓' },
    ERROR: { className: 'bg-red-500/10 text-red-600', icon: '!' },
  };

  const config = statusConfig[status] || statusConfig.ACTIVE;

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ${config.className}`}
    >
      <span>{config.icon}</span>
      {status.charAt(0) + status.slice(1).toLowerCase()}
    </span>
  );
}

// Schedules Table Component
function SchedulesTable({
  schedules,
  onDelete,
  onPause,
  onResume,
  isPausing,
  isResuming,
  expandedSchedule,
  onToggleExpand,
}: {
  schedules: ScheduleResponseDto[];
  onDelete: (schedule: ScheduleResponseDto) => void;
  onPause: (schedule: ScheduleResponseDto) => void;
  onResume: (schedule: ScheduleResponseDto) => void;
  isPausing: boolean;
  isResuming: boolean;
  expandedSchedule: string | null;
  onToggleExpand: (scheduleId: string) => void;
}) {
  return (
    <div className="rounded-md border">
      <table className="w-full">
        <thead>
          <tr className="border-b bg-muted/50">
            <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">
              Agent
            </th>
            <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">
              Schedule
            </th>
            <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">
              Prompt
            </th>
            <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">
              Status
            </th>
            <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">
              Last Run
            </th>
            <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">
              Next Run
            </th>
            <th className="h-12 px-4 text-right align-middle font-medium text-muted-foreground">
              Actions
            </th>
          </tr>
        </thead>
        <tbody>
          {schedules.map((schedule) => (
            <>
              <tr key={schedule.id} className="border-b transition-colors hover:bg-muted/50">
                <td className="p-4 align-middle font-medium">{schedule.agentName}</td>
                <td className="p-4 align-middle">
                  <code
                    className="relative rounded bg-muted px-[0.3rem] py-[0.2rem] font-mono text-sm cursor-help"
                    title={`Cron: ${schedule.config.cron}\nTimezone: ${schedule.config.timezone}`}
                  >
                    {cronToHuman(schedule.config.cron)}
                  </code>
                </td>
                <td className="p-4 align-middle">
                  <span
                    className="cursor-help text-sm text-muted-foreground"
                    title={schedule.config.prompt}
                  >
                    {truncatePrompt(schedule.config.prompt)}
                  </span>
                </td>
                <td className="p-4 align-middle">
                  <StatusBadge status={schedule.status} />
                </td>
                <td className="p-4 align-middle text-sm text-muted-foreground">
                  {formatDate(schedule.lastRunAt as string | undefined)}
                </td>
                <td className="p-4 align-middle text-sm text-muted-foreground">
                  {schedule.status === 'ACTIVE'
                    ? formatDate(schedule.nextRunAt as string | undefined)
                    : '-'}
                </td>
                <td className="p-4 align-middle text-right">
                  <div className="flex justify-end gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onToggleExpand(schedule.id)}
                      title="View execution history"
                    >
                      <History className="h-4 w-4" />
                      <span className="sr-only">Execution history</span>
                    </Button>
                    <Button variant="ghost" size="sm" asChild title="View scheduled sessions">
                      <Link to={`/agents/${schedule.agentId}/sessions?scheduleId=${schedule.id}`}>
                        <MessageSquare className="h-4 w-4" />
                        <span className="sr-only">View sessions</span>
                      </Link>
                    </Button>
                    {schedule.status === 'ACTIVE' ? (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onPause(schedule)}
                        disabled={isPausing}
                        title="Pause schedule"
                      >
                        <Pause className="h-4 w-4" />
                        <span className="sr-only">Pause</span>
                      </Button>
                    ) : schedule.status === 'PAUSED' ? (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onResume(schedule)}
                        disabled={isResuming}
                        title="Resume schedule"
                      >
                        <Play className="h-4 w-4" />
                        <span className="sr-only">Resume</span>
                      </Button>
                    ) : null}
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-destructive hover:text-destructive"
                      onClick={() => onDelete(schedule)}
                      title="Delete schedule"
                    >
                      <Trash2 className="h-4 w-4" />
                      <span className="sr-only">Delete</span>
                    </Button>
                  </div>
                </td>
              </tr>
              {expandedSchedule === schedule.id && (
                <tr key={`${schedule.id}-history`}>
                  <td colSpan={7} className="p-4 pt-0">
                    <ExecutionHistoryPanel scheduleId={schedule.id} />
                  </td>
                </tr>
              )}
            </>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// Delete Confirmation Dialog
function DeleteConfirmDialog({
  schedule,
  open,
  onOpenChange,
  onConfirm,
  isPending,
}: {
  schedule: ScheduleResponseDto | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  isPending: boolean;
}) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete Schedule</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to delete this schedule for agent "{schedule?.agentName}"? This
            action cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            disabled={isPending}
          >
            {isPending ? 'Deleting...' : 'Delete'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

// Main Page Component
export function SchedulesPage() {
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [scheduleToDelete, setScheduleToDelete] = useState<ScheduleResponseDto | null>(null);
  const [expandedSchedule, setExpandedSchedule] = useState<string | null>(null);

  const handleToggleExpand = (scheduleId: string) => {
    setExpandedSchedule(expandedSchedule === scheduleId ? null : scheduleId);
  };

  const queryClient = useQueryClient();
  const { data, isLoading, isError, refetch, isFetching } = useScheduleControllerFindAll();
  const deleteMutation = useScheduleControllerDelete();
  const pauseMutation = useScheduleControllerPause();
  const resumeMutation = useScheduleControllerResume();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const schedulesResponse = (data as any)?.data as ScheduleListResponseDto | undefined;
  const schedules = schedulesResponse?.data ?? [];

  const handleDeleteClick = (schedule: ScheduleResponseDto) => {
    setScheduleToDelete(schedule);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!scheduleToDelete) return;

    try {
      const response = await deleteMutation.mutateAsync({ id: scheduleToDelete.id });

      if (response.status === 200) {
        toast({
          title: 'Schedule deleted',
          description: `Schedule for "${scheduleToDelete.agentName}" has been deleted.`,
        });
        queryClient.invalidateQueries({ queryKey: getScheduleControllerFindAllQueryKey() });
      } else {
        toast({
          variant: 'destructive',
          title: 'Error',
          description: 'Failed to delete schedule.',
        });
      }
    } catch {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to delete schedule.',
      });
    } finally {
      setDeleteDialogOpen(false);
      setScheduleToDelete(null);
    }
  };

  const handlePause = async (schedule: ScheduleResponseDto) => {
    try {
      const response = await pauseMutation.mutateAsync({ id: schedule.id });

      if (response.status === 200) {
        toast({
          title: 'Schedule paused',
          description: `Schedule for "${schedule.agentName}" has been paused.`,
        });
        queryClient.invalidateQueries({ queryKey: getScheduleControllerFindAllQueryKey() });
      } else {
        toast({
          variant: 'destructive',
          title: 'Error',
          description: 'Failed to pause schedule.',
        });
      }
    } catch {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to pause schedule.',
      });
    }
  };

  const handleResume = async (schedule: ScheduleResponseDto) => {
    try {
      const response = await resumeMutation.mutateAsync({ id: schedule.id });

      if (response.status === 200) {
        toast({
          title: 'Schedule resumed',
          description: `Schedule for "${schedule.agentName}" has been resumed.`,
        });
        queryClient.invalidateQueries({ queryKey: getScheduleControllerFindAllQueryKey() });
      } else {
        toast({
          variant: 'destructive',
          title: 'Error',
          description: 'Failed to resume schedule.',
        });
      }
    } catch {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to resume schedule.',
      });
    }
  };

  return (
    <div className="container max-w-6xl mx-auto py-8 px-4">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary/10">
                <Calendar className="h-5 w-5 text-primary" />
              </div>
              <div>
                <CardTitle>Schedules</CardTitle>
                <CardDescription>Manage your scheduled agent runs</CardDescription>
              </div>
            </div>
            {schedules.length > 0 && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Clock className="h-4 w-4" />
                {schedules.filter((s) => s.status === 'ACTIVE').length} active
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : isError ? (
            <div className="text-center py-12">
              <div className="flex items-center justify-center w-12 h-12 mx-auto mb-3 rounded-full bg-destructive/10">
                <AlertCircle className="h-6 w-6 text-destructive" />
              </div>
              <p className="text-sm font-medium text-destructive">Failed to load schedules</p>
              <p className="text-xs text-muted-foreground mt-1 mb-3">
                Make sure the backend is running
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => refetch()}
                disabled={isFetching}
                className="gap-2"
              >
                <RefreshCw className={`h-3 w-3 ${isFetching ? 'animate-spin' : ''}`} />
                {isFetching ? 'Retrying...' : 'Retry'}
              </Button>
            </div>
          ) : schedules.length > 0 ? (
            <SchedulesTable
              schedules={schedules}
              onDelete={handleDeleteClick}
              onPause={handlePause}
              onResume={handleResume}
              isPausing={pauseMutation.isPending}
              isResuming={resumeMutation.isPending}
              expandedSchedule={expandedSchedule}
              onToggleExpand={handleToggleExpand}
            />
          ) : (
            <div className="text-center py-12">
              <Calendar className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
              <p className="text-sm font-medium">No schedules yet</p>
              <p className="text-xs text-muted-foreground mt-1">
                Create a schedule using the schedule tool in agent chat
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <DeleteConfirmDialog
        schedule={scheduleToDelete}
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        onConfirm={handleDeleteConfirm}
        isPending={deleteMutation.isPending}
      />
    </div>
  );
}
