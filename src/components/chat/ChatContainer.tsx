import type { FC } from 'react';
import { useMemo } from 'react';
import { AssistantRuntimeProvider } from '@assistant-ui/react';
import { useGourmet7Runtime, type BackendMessage } from '@/hooks/useGourmet7Runtime';
import { ChatThread } from './ChatThread';
import { ConnectionIndicator } from './ConnectionIndicator';
import type { ToolCallPart } from '@/api/sse-client';

interface ChatContainerProps {
  sessionId: string;
  initialMessages?: BackendMessage[];
  onError?: (error: Error) => void;
  onApprovalRequired?: (approval: {
    id: string;
    toolCall: ToolCallPart;
    summary: string;
    expiresAt: string;
  }) => void;
}

/**
 * Main chat container that sets up the assistant-ui runtime
 * and provides it to child components
 */
export const ChatContainer: FC<ChatContainerProps> = ({
  sessionId,
  initialMessages = [],
  onError,
  onApprovalRequired,
}) => {
  // Memoize initial messages to prevent unnecessary re-renders
  const memoizedInitialMessages = useMemo(
    () => initialMessages,
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [JSON.stringify(initialMessages)]
  );

  const { runtime, connectionState, isStreaming, reconnect } = useGourmet7Runtime({
    sessionId,
    initialMessages: memoizedInitialMessages,
    onError,
    onApprovalRequired,
  });

  return (
    <AssistantRuntimeProvider runtime={runtime}>
      <div className="flex flex-col h-full relative">
        {/* Connection indicator */}
        <ConnectionIndicator
          state={connectionState}
          isStreaming={isStreaming}
          onReconnect={reconnect}
        />

        {/* Chat thread */}
        <ChatThread />
      </div>
    </AssistantRuntimeProvider>
  );
};

export default ChatContainer;
