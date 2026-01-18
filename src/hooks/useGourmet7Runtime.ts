import { useState, useCallback, useEffect, useRef } from 'react';
import {
  useExternalStoreRuntime,
  type ThreadMessageLike,
  type AppendMessage,
} from '@assistant-ui/react';
import { sessionControllerSendMessage } from '@/api/endpoints/sessions/sessions';
import {
  SSEClient,
  type StreamEvent,
  type SSEConnectionState,
  type ToolCallPart,
  type ToolResultPart,
} from '@/api/sse-client';
import { useSessionStore } from '@/stores/sessionStore';

// Backend message format (Vercel AI SDK style)
interface BackendMessagePart {
  type: 'text' | 'tool-call' | 'tool-result' | 'image' | 'file';
  text?: string;
  toolCallId?: string;
  toolName?: string;
  args?: Record<string, unknown>;
  result?: unknown;
  isError?: boolean;
}

interface BackendMessage {
  id: string;
  role: 'user' | 'assistant' | 'tool' | 'system';
  parts: BackendMessagePart[];
  createdAt?: string;
}

// JSON value type that matches assistant-ui's expectations
type JSONValue = string | number | boolean | null | JSONValue[] | { [key: string]: JSONValue };
type JSONObject = { [key: string]: JSONValue };

// Internal message type for state management
interface InternalMessage {
  id: string;
  role: 'user' | 'assistant';
  content: Array<
    | { type: 'text'; text: string }
    | { type: 'tool-call'; toolCallId: string; toolName: string; args: JSONObject; result?: JSONValue; isError?: boolean }
  >;
  createdAt?: Date;
}

// Streaming state for tracking current message being built
interface StreamingState {
  messageId: string | null;
  role: 'assistant' | null;
  text: string;
  toolCalls: ToolCallPart[];
  toolResults: ToolResultPart[];
}

// Convert backend message to internal format
const convertBackendMessage = (message: BackendMessage): InternalMessage => {
  const content: InternalMessage['content'] = [];

  for (const part of message.parts) {
    switch (part.type) {
      case 'text':
        if (part.text) {
          content.push({ type: 'text', text: part.text });
        }
        break;
      case 'tool-call':
        if (part.toolCallId && part.toolName) {
          content.push({
            type: 'tool-call',
            toolCallId: part.toolCallId,
            toolName: part.toolName,
            args: (part.args ?? {}) as JSONObject,
          });
        }
        break;
      // Tool results are handled separately in assistant-ui
      default:
        break;
    }
  }

  // Map 'tool' role to 'assistant' for assistant-ui compatibility
  // Tool results are typically part of assistant messages in assistant-ui
  const role = message.role === 'tool' || message.role === 'system' ? 'assistant' : message.role;

  return {
    id: message.id,
    role,
    content,
    createdAt: message.createdAt ? new Date(message.createdAt) : undefined,
  };
};

// Convert internal message to ThreadMessageLike for assistant-ui
const convertToThreadMessage = (message: InternalMessage): ThreadMessageLike => {
  return {
    id: message.id,
    role: message.role,
    content: message.content,
    createdAt: message.createdAt,
  };
};

// Create initial streaming state
const createInitialStreamingState = (): StreamingState => ({
  messageId: null,
  role: null,
  text: '',
  toolCalls: [],
  toolResults: [],
});

interface UseGourmet7RuntimeProps {
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

export function useGourmet7Runtime({
  sessionId,
  initialMessages = [],
  onError,
  onApprovalRequired,
}: UseGourmet7RuntimeProps) {
  const [messages, setMessages] = useState<InternalMessage[]>(() =>
    initialMessages.map(convertBackendMessage)
  );
  const [isRunning, setIsRunning] = useState(false);
  const [connectionState, setConnectionState] = useState<SSEConnectionState>('disconnected');
  const [isStreaming, setIsStreaming] = useState(false);

  // SSE client ref to persist across renders
  const sseClientRef = useRef<SSEClient | null>(null);

  // Current streaming message state
  const streamingStateRef = useRef<StreamingState>(createInitialStreamingState());

  // Sync messages when initialMessages change (e.g., session loaded from server)
  // This is valid use case: syncing external data source with local state
  useEffect(() => {
    if (initialMessages.length > 0) {
      // Use queueMicrotask to avoid synchronous state update warning
      queueMicrotask(() => {
        setMessages(initialMessages.map(convertBackendMessage));
      });
    }
  }, [initialMessages]);

  // Handle SSE events
  const handleSSEEvent = useCallback(
    (event: StreamEvent) => {
      const streaming = streamingStateRef.current;

      switch (event.type) {
        case 'message_start': {
          // Start a new message
          streamingStateRef.current = {
            messageId: event.message.id,
            role: event.message.role === 'assistant' ? 'assistant' : null,
            text: '',
            toolCalls: [],
            toolResults: [],
          };
          setIsStreaming(true);

          // Add placeholder message
          if (event.message.role === 'assistant') {
            setMessages((current) => [
              ...current,
              {
                id: event.message.id,
                role: 'assistant',
                content: [{ type: 'text', text: '' }],
                createdAt: new Date(),
              },
            ]);
          }
          break;
        }

        case 'text_delta': {
          // Append delta to current text
          streaming.text += event.delta;

          // Update the current message in state
          if (streaming.messageId) {
            setMessages((current) => {
              const lastIndex = current.findIndex((m) => m.id === streaming.messageId);
              if (lastIndex >= 0) {
                const updated = [...current];
                updated[lastIndex] = {
                  ...updated[lastIndex],
                  content: [{ type: 'text', text: streaming.text }],
                } as InternalMessage;
                return updated;
              }
              return current;
            });
          }
          break;
        }

        case 'tool_call': {
          // Add tool call to current message
          streaming.toolCalls.push(event.toolCall);

          // Update message content with tool calls
          if (streaming.messageId) {
            setMessages((current) => {
              const idx = current.findIndex((m) => m.id === streaming.messageId);
              if (idx >= 0) {
                const updated = [...current];
                const content: InternalMessage['content'] = [];

                if (streaming.text) {
                  content.push({ type: 'text', text: streaming.text });
                }

                for (const tc of streaming.toolCalls) {
                  content.push({
                    type: 'tool-call',
                    toolCallId: tc.toolCallId,
                    toolName: tc.toolName,
                    args: tc.args as JSONObject,
                  });
                }

                updated[idx] = {
                  ...updated[idx],
                  content,
                } as InternalMessage;
                return updated;
              }
              return current;
            });
          }
          break;
        }

        case 'tool_result': {
          // Store tool result for current streaming state
          streaming.toolResults.push(event.toolResult);

          // Update the corresponding tool call with its result
          // This makes assistant-ui recognize the tool call as "complete"
          setMessages((current) => {
            return current.map((message) => {
              // Find message containing the tool call with matching toolCallId
              const hasMatchingToolCall = message.content.some(
                (part) =>
                  part.type === 'tool-call' &&
                  part.toolCallId === event.toolResult.toolCallId
              );

              if (!hasMatchingToolCall) return message;

              // Update the tool call with its result
              return {
                ...message,
                content: message.content.map((part) => {
                  if (
                    part.type === 'tool-call' &&
                    part.toolCallId === event.toolResult.toolCallId
                  ) {
                    return {
                      ...part,
                      result: event.toolResult.result as JSONValue,
                      isError: event.toolResult.isError,
                    };
                  }
                  return part;
                }),
              };
            });
          });
          break;
        }

        case 'message_stop': {
          // Message is complete
          setIsStreaming(false);

          // Check if this is an error finish - mark incomplete tool calls as errored
          const isErrorFinish = event.finishReason === 'error';

          // Finalize the message
          if (streaming.messageId) {
            // Get tool call IDs that have results
            const completedToolCallIds = new Set(
              streaming.toolResults.map((tr) => tr.toolCallId)
            );

            setMessages((current) => {
              const idx = current.findIndex((m) => m.id === streaming.messageId);
              if (idx >= 0) {
                const updated = [...current];
                const content: InternalMessage['content'] = [];

                if (streaming.text) {
                  content.push({ type: 'text', text: streaming.text });
                }

                for (const tc of streaming.toolCalls) {
                  // Find matching result if exists
                  const matchingResult = streaming.toolResults.find(
                    (tr) => tr.toolCallId === tc.toolCallId
                  );

                  content.push({
                    type: 'tool-call',
                    toolCallId: tc.toolCallId,
                    toolName: tc.toolName,
                    args: tc.args as JSONObject,
                    // Include result if available
                    ...(matchingResult && {
                      result: matchingResult.result as JSONValue,
                      isError: matchingResult.isError,
                    }),
                    // If error finish and no result, mark as error
                    ...(isErrorFinish && !completedToolCallIds.has(tc.toolCallId) && {
                      result: 'Tool execution interrupted' as JSONValue,
                      isError: true,
                    }),
                  });
                }

                updated[idx] = {
                  ...updated[idx],
                  content: content.length > 0 ? content : [{ type: 'text', text: '' }],
                } as InternalMessage;
                return updated;
              }
              return current;
            });
          }

          // Only set isRunning to false if not waiting for tool results
          // finishReason 'tool_calls' means backend will process tools and send results
          if (event.finishReason !== 'tool_calls') {
            setIsRunning(false);
          }

          // Reset streaming state
          streamingStateRef.current = createInitialStreamingState();
          break;
        }

        case 'error': {
          setIsStreaming(false);
          setIsRunning(false);
          onError?.(new Error(event.error));

          // Reset streaming state
          streamingStateRef.current = createInitialStreamingState();
          break;
        }

        case 'approval_required': {
          // Notify about approval required
          setIsStreaming(false);
          // Keep isRunning true - we're waiting for approval
          onApprovalRequired?.(event.approval);
          break;
        }

        case 'session_renamed': {
          // Update session name in store
          useSessionStore.getState().setSessionName(event.sessionId, event.name);
          break;
        }
      }
    },
    [onError, onApprovalRequired]
  );

  // Initialize SSE client and connect
  useEffect(() => {
    const client = new SSEClient({
      onStateChange: setConnectionState,
      onEvent: handleSSEEvent,
      onError: (error) => {
        console.error('[useGourmet7Runtime] SSE error:', error);
        onError?.(error);
      },
      onConnect: () => {
        console.log('[useGourmet7Runtime] SSE connected');
      },
      onDisconnect: () => {
        console.log('[useGourmet7Runtime] SSE disconnected');
      },
    });

    sseClientRef.current = client;

    // Connect to the session stream
    client.connect(sessionId);

    // Cleanup on unmount or sessionId change
    return () => {
      client.close();
      sseClientRef.current = null;
    };
  }, [sessionId, handleSSEEvent, onError]);

  // Handle sending new message
  const onNew = useCallback(
    async (message: AppendMessage) => {
      // Extract text content
      const textContent = message.content.find((c) => c.type === 'text');
      if (!textContent || textContent.type !== 'text') {
        throw new Error('Only text content is supported');
      }

      const userMessageContent = textContent.text;

      // Create optimistic user message
      const userMessage: InternalMessage = {
        id: `user-${Date.now()}`,
        role: 'user',
        content: [{ type: 'text', text: userMessageContent }],
        createdAt: new Date(),
      };

      // Add user message to state
      setMessages((current) => [...current, userMessage]);
      setIsRunning(true);

      try {
        // Send message to backend
        // The response will come via SSE stream
        await sessionControllerSendMessage(sessionId, {
          content: userMessageContent,
        });

        // Note: isRunning will be set to false when we receive message_stop via SSE
      } catch (error) {
        const err = error instanceof Error ? error : new Error('Failed to send message');
        onError?.(err);

        // Remove optimistic user message on error
        setMessages((current) => current.filter((m) => m.id !== userMessage.id));
        setIsRunning(false);
      }
    },
    [sessionId, onError]
  );

  // Create runtime with convertMessage function
  const runtime = useExternalStoreRuntime({
    isRunning,
    messages,
    convertMessage: convertToThreadMessage,
    onNew,
  });

  // Manual reconnect function
  const reconnect = useCallback(() => {
    sseClientRef.current?.connect(sessionId);
  }, [sessionId]);

  // Disconnect function
  const disconnect = useCallback(() => {
    sseClientRef.current?.close();
  }, []);

  // Return runtime and additional utilities
  return {
    runtime,
    messages,
    isRunning,
    // SSE connection state
    connectionState,
    isStreaming,
    // SSE control methods
    reconnect,
    disconnect,
    // Method to update messages (useful for manual updates)
    setMessages,
    // Method to add a single message
    addMessage: useCallback((message: BackendMessage) => {
      setMessages((current) => [...current, convertBackendMessage(message)]);
    }, []),
    // Method to update the last assistant message (for manual streaming)
    updateLastAssistantMessage: useCallback((text: string) => {
      setMessages((current) => {
        const lastIndex = current.length - 1;
        if (lastIndex >= 0 && current[lastIndex]?.role === 'assistant') {
          const updated = [...current];
          updated[lastIndex] = {
            ...updated[lastIndex],
            content: [{ type: 'text', text }],
          } as InternalMessage;
          return updated;
        }
        return current;
      });
    }, []),
    // Method to set running state
    setIsRunning,
  };
}

export type { BackendMessage, BackendMessagePart, SSEConnectionState };
