import { NavLink, useNavigate, useParams } from 'react-router-dom';
import { MessageSquare, AlertCircle, CheckCircle, Clock, Trash2, CalendarClock } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { DeleteSessionDialog } from '@/components/session/DeleteSessionDialog';
import type { Session } from '@/types/api';
import { useSessionName } from '@/stores/sessionStore';

interface SessionItemProps {
  session: Session;
  agentId: string;
}

const statusIcons = {
  ACTIVE: Clock,
  WAITING_APPROVAL: AlertCircle,
  COMPLETED: CheckCircle,
  ERROR: AlertCircle,
};

const statusColors = {
  ACTIVE: 'text-blue-500',
  WAITING_APPROVAL: 'text-yellow-500',
  COMPLETED: 'text-green-500',
  ERROR: 'text-red-500',
};

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;

  return date.toLocaleDateString();
}

export function SessionItem({ session, agentId }: SessionItemProps) {
  const StatusIcon = statusIcons[session.status];
  const navigate = useNavigate();
  const params = useParams<{ sessionId?: string }>();

  // Get session name from store (real-time updates) or fall back to session data or ID
  const storeSessionName = useSessionName(session.id);
  const displayName = storeSessionName || session.name || `Session ${session.id.slice(0, 8)}...`;

  // Check if this is the currently active session
  const isCurrentSession = params.sessionId === session.id;

  const handleSessionDeleted = () => {
    // If we're viewing the deleted session, navigate to welcome page
    if (isCurrentSession) {
      navigate('/');
    }
  };

  return (
    <div className="group flex items-center ml-4">
      <NavLink
        to={`/agents/${agentId}/sessions/${session.id}`}
        className={({ isActive }) =>
          cn(
            'flex-1 flex items-center gap-2 px-3 py-2 rounded-md text-sm transition-colors',
            'hover:bg-accent hover:text-accent-foreground',
            isActive && 'bg-accent text-accent-foreground font-medium'
          )
        }
      >
        <MessageSquare className="h-4 w-4 flex-shrink-0 text-muted-foreground" />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <span className="truncate text-xs" title={displayName}>{displayName}</span>
            <StatusIcon className={cn('h-3 w-3 flex-shrink-0', statusColors[session.status])} />
            {session.isScheduled && (
              <span title="Scheduled session">
                <CalendarClock className="h-3 w-3 flex-shrink-0 text-blue-500" />
              </span>
            )}
          </div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span>{session.messageCount} msgs</span>
            <span className="text-muted-foreground/50">|</span>
            <span>{formatDate(session.createdAt)}</span>
          </div>
        </div>
      </NavLink>

      <DeleteSessionDialog session={session} agentId={agentId} onDeleted={handleSessionDeleted}>
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6 mr-1 opacity-0 group-hover:opacity-100 hover:opacity-100 hover:text-destructive flex-shrink-0"
          onClick={(e) => e.stopPropagation()}
          title="Delete Session"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </Button>
      </DeleteSessionDialog>
    </div>
  );
}
