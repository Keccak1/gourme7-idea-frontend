import { useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bot, MessageSquare, Shield, Zap, Loader2 } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useLastSessionData } from '@/hooks/useLastSession';
import { useAgentControllerFindOne } from '@/api/endpoints/agents/agents';
import { useSessionControllerGetSession } from '@/api/endpoints/sessions/sessions';

export function WelcomePage() {
  const navigate = useNavigate();
  const lastSession = useLastSessionData();

  // Validate that the last session's agent still exists
  const {
    data: agentData,
    isLoading: isLoadingAgent,
    isError: isAgentError,
  } = useAgentControllerFindOne(lastSession?.agentId ?? '', {
    query: {
      enabled: !!lastSession?.agentId,
      retry: false,
    },
  });

  // Validate that the last session still exists
  const {
    data: sessionData,
    isLoading: isLoadingSession,
    isError: isSessionError,
  } = useSessionControllerGetSession(lastSession?.sessionId ?? '', {
    query: {
      enabled: !!lastSession?.sessionId && !!agentData,
      retry: false,
    },
  });

  // Compute redirect state without using setState
  const isRedirecting = useMemo(() => {
    if (!lastSession) return false;
    if (isAgentError || isSessionError) return false;
    if (!agentData || !sessionData) return true; // Still loading or no data yet
    return true;
  }, [lastSession, isAgentError, isSessionError, agentData, sessionData]);

  // Handle redirect when both agent and session are validated
  useEffect(() => {
    if (!lastSession || !agentData || !sessionData) return;
    if (isAgentError || isSessionError) return;

    // Both exist - redirect
    navigate(`/agents/${lastSession.agentId}/sessions/${lastSession.sessionId}`, { replace: true });
  }, [lastSession, agentData, sessionData, isAgentError, isSessionError, navigate]);

  // Show loading while checking if we should redirect
  if (isRedirecting && (isLoadingAgent || isLoadingSession)) {
    return (
      <div className="flex items-center justify-center min-h-full p-8">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          <p className="text-sm text-muted-foreground">Restoring last session...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center min-h-full p-8">
      <div className="max-w-2xl w-full space-y-8">
        {/* Hero */}
        <div className="text-center space-y-4">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
            <Bot className="h-8 w-8 text-primary" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight">Welcome to Gourme7</h1>
          <p className="text-lg text-muted-foreground">
            Your AI-powered DeFi agent for autonomous blockchain operations
          </p>
        </div>

        {/* Features */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="pb-2">
              <MessageSquare className="h-8 w-8 text-primary mb-2" />
              <CardTitle className="text-lg">Natural Language</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Interact with DeFi protocols using simple conversations
              </CardDescription>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <Shield className="h-8 w-8 text-primary mb-2" />
              <CardTitle className="text-lg">Permission Control</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Full control over agent actions with approval workflows
              </CardDescription>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <Zap className="h-8 w-8 text-primary mb-2" />
              <CardTitle className="text-lg">Automated Tasks</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>Schedule recurring operations and monitoring tasks</CardDescription>
            </CardContent>
          </Card>
        </div>

        {/* Getting Started */}
        <Card>
          <CardHeader>
            <CardTitle>Getting Started</CardTitle>
            <CardDescription>
              Select an agent from the sidebar to start a conversation, or create a new agent to
              begin.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-muted-foreground">
            <p>1. Click on an agent in the sidebar to see its sessions</p>
            <p>2. Click the + button next to an agent to create a new session</p>
            <p>3. Select a session to open the chat interface</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
