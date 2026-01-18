import type { FC } from 'react';
import { RefreshCw, Wifi, WifiOff, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { SSEConnectionState } from '@/hooks/useGourmet7Runtime';

interface ConnectionIndicatorProps {
  state: SSEConnectionState;
  isStreaming: boolean;
  onReconnect: () => void;
}

/**
 * Connection indicator that shows the current SSE connection state
 * and provides a reconnect button when disconnected
 */
export const ConnectionIndicator: FC<ConnectionIndicatorProps> = ({
  state,
  isStreaming,
  onReconnect,
}) => {
  // Don't show indicator when connected and not streaming
  if (state === 'connected' && !isStreaming) {
    return null;
  }

  const getStatusConfig = () => {
    switch (state) {
      case 'connected':
        if (isStreaming) {
          return {
            icon: <Loader2 className="h-3 w-3 animate-spin" />,
            text: 'Receiving...',
            className: 'bg-blue-500/10 text-blue-600 border-blue-500/20',
          };
        }
        return {
          icon: <Wifi className="h-3 w-3" />,
          text: 'Connected',
          className: 'bg-green-500/10 text-green-600 border-green-500/20',
        };

      case 'connecting':
        return {
          icon: <Loader2 className="h-3 w-3 animate-spin" />,
          text: 'Connecting...',
          className: 'bg-yellow-500/10 text-yellow-600 border-yellow-500/20',
        };

      case 'reconnecting':
        return {
          icon: <RefreshCw className="h-3 w-3 animate-spin" />,
          text: 'Reconnecting...',
          className: 'bg-yellow-500/10 text-yellow-600 border-yellow-500/20',
        };

      case 'disconnected':
        return {
          icon: <WifiOff className="h-3 w-3" />,
          text: 'Disconnected',
          className: 'bg-muted text-muted-foreground border-border',
          showReconnect: true,
        };

      case 'error':
        return {
          icon: <WifiOff className="h-3 w-3" />,
          text: 'Connection error',
          className: 'bg-destructive/10 text-destructive border-destructive/20',
          showReconnect: true,
        };

      default:
        return null;
    }
  };

  const config = getStatusConfig();

  if (!config) {
    return null;
  }

  return (
    <div
      className={cn(
        'flex items-center justify-center gap-2 px-3 py-1.5',
        'border-b text-xs font-medium',
        'transition-colors duration-200',
        config.className
      )}
    >
      {config.icon}
      <span>{config.text}</span>

      {config.showReconnect && (
        <button
          onClick={onReconnect}
          className={cn(
            'ml-2 inline-flex items-center gap-1 px-2 py-0.5 rounded',
            'text-xs font-medium',
            'bg-background hover:bg-accent',
            'border border-border',
            'transition-colors'
          )}
        >
          <RefreshCw className="h-3 w-3" />
          Reconnect
        </button>
      )}
    </div>
  );
};

export default ConnectionIndicator;
