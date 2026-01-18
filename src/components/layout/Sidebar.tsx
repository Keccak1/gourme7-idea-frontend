import { useParams, Link, useLocation } from 'react-router-dom';
import { Plus, Bot, X, AlertCircle, RefreshCw, Wallet, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { AgentsListSkeleton } from '@/components/ui/skeleton';
import { AgentItem } from './AgentItem';
import { CreateAgentDialog } from '@/components/agent/CreateAgentDialog';
import { useAgentControllerFindAll } from '@/api/endpoints/agents/agents';
import type { AgentsResponse } from '@/types/api';
import { cn } from '@/lib/utils';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export function Sidebar({ isOpen, onClose }: SidebarProps) {
  const { agentId: activeAgentId } = useParams<{ agentId?: string }>();
  const location = useLocation();
  const { data, isLoading, isError, refetch, isFetching } = useAgentControllerFindAll();
  const isWalletsPage = location.pathname === '/wallets';
  const isSchedulesPage = location.pathname === '/schedules';

  // Cast response data to proper type
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const agentsResponse = (data as any)?.data as AgentsResponse | undefined;
  const agents = agentsResponse?.data ?? [];

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && <div className="fixed inset-0 bg-black/50 z-40 md:hidden" onClick={onClose} />}

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed left-0 top-0 z-50 h-full w-72 bg-card border-r border-border',
          'flex flex-col transition-transform duration-300 ease-in-out',
          'md:relative md:translate-x-0',
          isOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border">
          <div className="flex items-center gap-2">
            <Bot className="h-6 w-6 text-primary" />
            <h1 className="text-lg font-semibold">Gourme7</h1>
          </div>
          <Button variant="ghost" size="icon" className="md:hidden" onClick={onClose}>
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* Agents list */}
        <ScrollArea className="flex-1 px-2 py-4">
          {isLoading ? (
            <AgentsListSkeleton count={4} />
          ) : isError ? (
            <div className="px-3 py-4 text-center">
              <div className="flex items-center justify-center w-12 h-12 mx-auto mb-3 rounded-full bg-destructive/10">
                <AlertCircle className="h-6 w-6 text-destructive" />
              </div>
              <p className="text-sm font-medium text-destructive">Failed to load agents</p>
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
                <RefreshCw className={cn('h-3 w-3', isFetching && 'animate-spin')} />
                {isFetching ? 'Retrying...' : 'Retry'}
              </Button>
            </div>
          ) : agents.length > 0 ? (
            <div className="space-y-1">
              {agents.map((agent) => (
                <AgentItem
                  key={agent.id}
                  agent={agent}
                  defaultExpanded={agent.id === activeAgentId}
                />
              ))}
            </div>
          ) : (
            <div className="px-3 py-8 text-center text-muted-foreground">
              <Bot className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="text-sm">No agents yet</p>
              <p className="text-xs mt-1">Create your first agent to get started</p>
            </div>
          )}
        </ScrollArea>

        {/* Footer */}
        <div className="p-4 border-t border-border space-y-2">
          <Link to="/wallets">
            <Button
              variant={isWalletsPage ? 'secondary' : 'ghost'}
              className="w-full justify-start gap-2"
            >
              <Wallet className="h-4 w-4" />
              Wallets
            </Button>
          </Link>
          <Link to="/schedules">
            <Button
              variant={isSchedulesPage ? 'secondary' : 'ghost'}
              className="w-full justify-start gap-2"
            >
              <Calendar className="h-4 w-4" />
              Schedules
            </Button>
          </Link>
          <CreateAgentDialog>
            <Button variant="outline" className="w-full justify-start gap-2">
              <Plus className="h-4 w-4" />
              New Agent
            </Button>
          </CreateAgentDialog>
        </div>
      </aside>
    </>
  );
}
