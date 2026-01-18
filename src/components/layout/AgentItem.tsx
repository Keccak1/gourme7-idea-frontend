import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  ChevronDown,
  ChevronRight,
  Bot,
  Plus,
  Loader2,
  Trash2,
  AlertCircle,
  RefreshCw,
} from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { SessionsListSkeleton } from '@/components/ui/skeleton';
import { SessionItem } from './SessionItem';
import { DeleteAgentDialog } from '@/components/agent/DeleteAgentDialog';
import { useAgentSessions } from '@/hooks/use-agent-sessions';
import { useSessionControllerCreateSession } from '@/api/endpoints/sessions/sessions';
import { useToast } from '@/hooks/use-toast';
import type { Agent } from '@/types/api';

interface AgentItemProps {
  agent: Agent;
  defaultExpanded?: boolean;
}

export function AgentItem({ agent, defaultExpanded }: AgentItemProps) {
  const navigate = useNavigate();
  const params = useParams<{ agentId?: string }>();
  // Expand if this is the active agent OR if defaultExpanded is true
  const [isExpanded, setIsExpanded] = useState(
    params.agentId === agent.id || defaultExpanded === true
  );
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch sessions only when expanded
  const {
    data: sessionsData,
    isLoading: isLoadingSessions,
    isError: isSessionsError,
    refetch: refetchSessions,
    isFetching: isFetchingSessions,
  } = useAgentSessions(agent.id, {
    enabled: isExpanded,
  });

  const createSession = useSessionControllerCreateSession();

  const isActiveAgent = params.agentId === agent.id;
  const sessions = sessionsData?.data ?? [];

  const handleToggle = () => {
    setIsExpanded((prev) => !prev);
  };

  const handleCreateSession = async (e: React.MouseEvent) => {
    e.stopPropagation();

    try {
      const result = await createSession.mutateAsync({
        data: { agentId: agent.id },
      });

      // Navigate to new session
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const sessionId = (result as any).data?.sessionId;
      if (sessionId) {
        // Invalidate sessions cache to refresh the list
        await queryClient.invalidateQueries({
          queryKey: ['agents', agent.id, 'sessions'],
        });

        toast({
          title: 'Session created',
          description: 'New chat session has been created.',
        });

        navigate(`/agents/${agent.id}/sessions/${sessionId}`);
        setIsExpanded(true);
      }
    } catch (error) {
      console.error('Failed to create session:', error);
      toast({
        title: 'Error',
        description: 'Failed to create session. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const handleAgentDeleted = () => {
    // Navigate to home if we're currently viewing this agent
    if (isActiveAgent) {
      navigate('/');
    }
  };

  return (
    <div className="space-y-1">
      {/* Agent header */}
      <div
        className={cn(
          'group flex items-center gap-2 px-3 py-2 rounded-md cursor-pointer transition-colors',
          'hover:bg-accent hover:text-accent-foreground',
          isActiveAgent && 'bg-accent/50'
        )}
        onClick={handleToggle}
      >
        <button
          className="p-0.5 hover:bg-muted rounded"
          onClick={(e) => {
            e.stopPropagation();
            handleToggle();
          }}
        >
          {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
        </button>

        <Bot className="h-5 w-5 text-primary flex-shrink-0" />

        <span className="flex-1 font-medium truncate">{agent.name}</span>

        <div className="flex items-center gap-1 flex-shrink-0">
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 opacity-0 group-hover:opacity-100 hover:opacity-100"
            onClick={handleCreateSession}
            disabled={createSession.isPending}
            title="New Session"
          >
            {createSession.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Plus className="h-4 w-4" />
            )}
          </Button>

          <DeleteAgentDialog agent={agent} onDeleted={handleAgentDeleted}>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 opacity-0 group-hover:opacity-100 hover:opacity-100 hover:text-destructive"
              onClick={(e) => e.stopPropagation()}
              title="Delete Agent"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </DeleteAgentDialog>
        </div>
      </div>

      {/* Sessions list */}
      {isExpanded && (
        <div className="space-y-0.5">
          {isLoadingSessions ? (
            <SessionsListSkeleton count={2} />
          ) : isSessionsError ? (
            <div className="px-3 py-3 ml-4 text-center">
              <div className="flex items-center gap-2 text-destructive text-xs mb-2">
                <AlertCircle className="h-3 w-3" />
                <span>Failed to load sessions</span>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => refetchSessions()}
                disabled={isFetchingSessions}
                className="h-6 text-xs gap-1"
              >
                <RefreshCw className={cn('h-3 w-3', isFetchingSessions && 'animate-spin')} />
                Retry
              </Button>
            </div>
          ) : sessions.length > 0 ? (
            sessions.map((session) => (
              <SessionItem key={session.id} session={session} agentId={agent.id} />
            ))
          ) : (
            <div className="px-3 py-2 ml-4 text-sm text-muted-foreground">No sessions yet</div>
          )}
        </div>
      )}
    </div>
  );
}
