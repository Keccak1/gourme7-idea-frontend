import { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Bot, MessageSquare, AlertCircle, RefreshCw, CalendarClock } from 'lucide-react';
import { useSessionControllerGetSession } from '@/api/endpoints/sessions/sessions';
import { useAgentControllerFindOne } from '@/api/endpoints/agents/agents';
import { ChatContainer, ApprovalDialog } from '@/components/chat';
import { AgentWalletSelector } from '@/components/agent/AgentWalletSelector';
import { ChatPageSkeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import type { BackendMessage } from '@/hooks/useGourmet7Runtime';
import type { ApprovalData } from '@/components/chat/ApprovalDialog';
import { useToast } from '@/hooks/use-toast';
import { useLastSession, clearLastSessionStorage } from '@/hooks/useLastSession';
import { useCurrentAgentStore } from '@/stores/sessionStore';

// Session response type from backend
interface SessionResponse {
  sessionId: string;
  state: {
    id: string;
    agentId: string;
    status: string;
    loadedSkills: string[];
    pendingApprovalIds: string[];
    tokenUsage: {
      prompt: number;
      completion: number;
      total: number;
    };
    isScheduled: boolean;
    scheduleId: string | null;
    scheduledPrompt: string | null;
    createdAt: string;
    lastActivityAt: string;
  };
  messages: BackendMessage[];
}

// Agent response type
interface AgentResponse {
  id: string;
  name: string;
  ownerId: string;
  wallet?: {
    id: string;
    address: string;
    name: string;
    type: 'DEV' | 'PRIVY';
  } | null;
  config: {
    skills: string[];
    systemPrompt?: string;
    constraints: {
      allowedChains: string[];
      allowedProtocols: string[];
      maxTransactionUSD: number;
    };
  };
  status: 'ACTIVE' | 'PAUSED' | 'ARCHIVED';
}

export function ChatPage() {
  const { agentId, sessionId } = useParams<{
    agentId: string;
    sessionId: string;
  }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [pendingApproval, setPendingApproval] = useState<ApprovalData | null>(null);
  const hasRedirected = useRef(false);

  // Use the hook to auto-save last session
  useLastSession();

  // Get store action to set current agent name
  const setCurrentAgentName = useCurrentAgentStore((state) => state.setCurrentAgentName);

  const {
    data: sessionData,
    isLoading: isLoadingSession,
    isError: isSessionError,
    refetch: refetchSession,
    isFetching: isFetchingSession,
  } = useSessionControllerGetSession(sessionId ?? '', {
    query: {
      enabled: !!sessionId,
      refetchOnWindowFocus: false,
      retry: false, // Don't retry on 404
    },
  });

  const {
    data: agentData,
    isLoading: isLoadingAgent,
    isError: isAgentError,
    refetch: refetchAgent,
    isFetching: isFetchingAgent,
  } = useAgentControllerFindOne(agentId ?? '', {
    query: {
      enabled: !!agentId,
      refetchOnWindowFocus: false,
      retry: false, // Don't retry on 404
    },
  });

  // Handle redirect on error (agent or session not found)
  useEffect(() => {
    // Don't redirect while still loading
    if (isLoadingAgent || isLoadingSession) return;

    // Prevent multiple redirects
    if (hasRedirected.current) return;

    // Check for errors and redirect with toast
    if (isAgentError) {
      hasRedirected.current = true;
      clearLastSessionStorage(agentId, sessionId);
      toast({
        variant: 'destructive',
        title: 'Agent not found',
        description: 'The requested agent does not exist.',
      });
      navigate('/', { replace: true });
      return;
    }

    if (isSessionError) {
      hasRedirected.current = true;
      clearLastSessionStorage(agentId, sessionId);
      toast({
        variant: 'destructive',
        title: 'Session not found',
        description: 'The requested session does not exist.',
      });
      navigate('/', { replace: true });
      return;
    }
  }, [
    isAgentError,
    isSessionError,
    isLoadingAgent,
    isLoadingSession,
    agentId,
    sessionId,
    navigate,
    toast,
  ]);

  // Extract data from responses
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const session = (sessionData as any)?.data as SessionResponse | undefined;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const agent = (agentData as any)?.data as AgentResponse | undefined;

  // Update current agent name in store when agent is loaded
  useEffect(() => {
    if (agent?.name) {
      setCurrentAgentName(agent.name);
    }

    // Cleanup on unmount
    return () => {
      setCurrentAgentName(null);
    };
  }, [agent?.name, setCurrentAgentName]);

  // Memoize messages to prevent unnecessary re-renders
  const initialMessages = useMemo(() => session?.messages ?? [], [session?.messages]);

  // Error handler for chat
  const handleChatError = useCallback(
    (error: Error) => {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message || 'Failed to send message',
      });
    },
    [toast]
  );

  // Approval handler
  const handleApprovalRequired = useCallback((approval: ApprovalData) => {
    setPendingApproval(approval);
  }, []);

  // Close approval dialog
  const handleCloseApproval = useCallback(() => {
    setPendingApproval(null);
  }, []);

  // Approval approved handler
  const handleApproved = useCallback(() => {
    toast({
      title: 'Action Approved',
      description: 'The action has been approved and will continue.',
    });
  }, [toast]);

  // Approval rejected handler
  const handleRejected = useCallback(() => {
    toast({
      title: 'Action Rejected',
      description: 'The action has been rejected.',
    });
  }, [toast]);

  // Loading state
  if (isLoadingSession || isLoadingAgent) {
    return <ChatPageSkeleton />;
  }

  // Error state - show UI for retry (redirecting is handled in useEffect)
  const hasError = isSessionError || isAgentError;
  const isFetching = isFetchingSession || isFetchingAgent;

  const handleRetry = () => {
    hasRedirected.current = false; // Reset redirect flag on retry
    if (isSessionError) refetchSession();
    if (isAgentError) refetchAgent();
  };

  if (hasError) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-4 p-8">
        <div className="flex items-center justify-center w-16 h-16 rounded-full bg-destructive/10">
          <AlertCircle className="h-8 w-8 text-destructive" />
        </div>
        <h2 className="text-lg font-semibold">Unable to load chat</h2>
        <p className="text-center text-muted-foreground max-w-md">
          {isSessionError
            ? 'Failed to load session. Please check if the session exists.'
            : 'Failed to load agent. Please check if the agent exists.'}
        </p>
        <Button onClick={handleRetry} disabled={isFetching} className="gap-2">
          <RefreshCw className={isFetching ? 'h-4 w-4 animate-spin' : 'h-4 w-4'} />
          {isFetching ? 'Retrying...' : 'Try Again'}
        </Button>
      </div>
    );
  }

  // Session not found
  if (!session) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-4 p-8">
        <div className="flex items-center justify-center w-16 h-16 rounded-full bg-muted">
          <MessageSquare className="h-8 w-8 text-muted-foreground" />
        </div>
        <h2 className="text-lg font-semibold">Session not found</h2>
        <p className="text-center text-muted-foreground">
          The requested session could not be found.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex-shrink-0 flex items-center gap-3 px-4 py-3 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="flex items-center gap-2">
          <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10">
            <Bot className="h-4 w-4 text-primary" />
          </div>
          <div className="flex flex-col">
            <span className="font-medium text-sm">{agent?.name ?? 'Agent'}</span>
            <span className="text-xs text-muted-foreground">
              {session.state?.status === 'active' && 'Active'}
              {session.state?.status === 'waiting_approval' && 'Waiting for approval'}
              {session.state?.status === 'completed' && 'Completed'}
              {session.state?.status === 'error' && 'Error'}
            </span>
          </div>
        </div>

        <div className="flex-1" />

        {/* Wallet selector */}
        {agent && agentId && (
          <AgentWalletSelector
            agentId={agentId}
            agentName={agent.name}
            currentWalletId={agent.wallet?.id}
            currentWalletAddress={agent.wallet?.address}
          />
        )}

        {/* Session info */}
        <div className="flex items-center gap-4 text-xs text-muted-foreground">
          <div className="flex items-center gap-1.5">
            <MessageSquare className="h-3.5 w-3.5" />
            <span>{initialMessages.length} messages</span>
          </div>
          <div className="hidden sm:block">Session: {sessionId?.slice(0, 8)}...</div>
        </div>
      </div>

      {/* Scheduled session banner */}
      {session.state?.isScheduled && (
        <div className="flex-shrink-0 bg-blue-50 dark:bg-blue-950 border-b border-blue-200 dark:border-blue-800 px-4 py-3">
          <div className="flex items-center gap-2 text-blue-800 dark:text-blue-200">
            <CalendarClock className="h-4 w-4" />
            <span className="font-medium text-sm">Scheduled Session</span>
          </div>
          {session.state?.scheduledPrompt && (
            <p className="text-sm text-blue-600 dark:text-blue-300 mt-1 ml-6">
              Original prompt: "{session.state.scheduledPrompt}"
            </p>
          )}
        </div>
      )}

      {/* Chat area */}
      <div className="flex-1 overflow-hidden">
        <ChatContainer
          sessionId={sessionId!}
          initialMessages={initialMessages}
          onError={handleChatError}
          onApprovalRequired={handleApprovalRequired}
        />
      </div>

      {/* Approval dialog */}
      <ApprovalDialog
        approval={pendingApproval}
        onClose={handleCloseApproval}
        onApproved={handleApproved}
        onRejected={handleRejected}
      />
    </div>
  );
}
