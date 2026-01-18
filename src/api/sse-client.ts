/**
 * SSE Client for Gourmet7 Backend Streaming
 *
 * Handles Server-Sent Events from backend /sessions/:id/stream endpoint.
 * Supports automatic reconnection with exponential backoff.
 */

// ============================================================================
// Types - matching backend StreamEvent schema
// ============================================================================

export interface ToolCallPart {
  type: 'tool-call';
  toolCallId: string;
  toolName: string;
  args: Record<string, unknown>;
}

export interface ToolResultPart {
  type: 'tool-result';
  toolCallId: string;
  toolName: string;
  result: unknown;
  isError?: boolean;
}

export type StreamEvent =
  | {
      type: 'message_start';
      message: { id: string; role: 'user' | 'assistant' | 'tool' | 'system' };
    }
  | { type: 'text_delta'; delta: string }
  | { type: 'tool_call'; toolCall: ToolCallPart }
  | { type: 'tool_result'; toolResult: ToolResultPart }
  | { type: 'message_stop'; finishReason?: 'stop' | 'tool_calls' | 'error' }
  | { type: 'error'; error: string }
  | {
      type: 'approval_required';
      approval: {
        id: string;
        toolCall: ToolCallPart;
        summary: string;
        expiresAt: string;
      };
    }
  | {
      type: 'session_renamed';
      sessionId: string;
      name: string;
    };

// ============================================================================
// SSE Connection State
// ============================================================================

export type SSEConnectionState =
  | 'disconnected'
  | 'connecting'
  | 'connected'
  | 'reconnecting'
  | 'error';

export interface SSEClientOptions {
  /** Base URL for the API (defaults to VITE_API_URL or localhost:3000) */
  baseUrl?: string;
  /** Maximum number of reconnection attempts (default: 5) */
  maxReconnectAttempts?: number;
  /** Initial reconnection delay in ms (default: 1000) */
  initialReconnectDelay?: number;
  /** Maximum reconnection delay in ms (default: 30000) */
  maxReconnectDelay?: number;
  /** Callback when connection state changes */
  onStateChange?: (state: SSEConnectionState) => void;
  /** Callback for each stream event */
  onEvent?: (event: StreamEvent) => void;
  /** Callback when an error occurs */
  onError?: (error: Error) => void;
  /** Callback when connection is established */
  onConnect?: () => void;
  /** Callback when connection is closed */
  onDisconnect?: () => void;
}

// ============================================================================
// SSE Client Class
// ============================================================================

export class SSEClient {
  private eventSource: EventSource | null = null;
  private sessionId: string | null = null;
  private state: SSEConnectionState = 'disconnected';
  private reconnectAttempts = 0;
  private reconnectTimeout: ReturnType<typeof setTimeout> | null = null;
  private isManualClose = false;

  private readonly baseUrl: string;
  private readonly maxReconnectAttempts: number;
  private readonly initialReconnectDelay: number;
  private readonly maxReconnectDelay: number;
  private readonly onStateChange?: (state: SSEConnectionState) => void;
  private readonly onEvent?: (event: StreamEvent) => void;
  private readonly onError?: (error: Error) => void;
  private readonly onConnect?: () => void;
  private readonly onDisconnect?: () => void;

  constructor(options: SSEClientOptions = {}) {
    this.baseUrl = options.baseUrl || import.meta.env.VITE_API_URL || 'http://localhost:3000';
    this.maxReconnectAttempts = options.maxReconnectAttempts ?? 5;
    this.initialReconnectDelay = options.initialReconnectDelay ?? 1000;
    this.maxReconnectDelay = options.maxReconnectDelay ?? 30000;
    this.onStateChange = options.onStateChange;
    this.onEvent = options.onEvent;
    this.onError = options.onError;
    this.onConnect = options.onConnect;
    this.onDisconnect = options.onDisconnect;
  }

  /**
   * Get current connection state
   */
  getState(): SSEConnectionState {
    return this.state;
  }

  /**
   * Get current session ID
   */
  getSessionId(): string | null {
    return this.sessionId;
  }

  /**
   * Connect to SSE stream for a session
   */
  connect(sessionId: string): void {
    // If already connected to this session, do nothing
    if (this.sessionId === sessionId && this.state === 'connected') {
      return;
    }

    // Close existing connection if any
    this.close();

    this.sessionId = sessionId;
    this.isManualClose = false;
    this.reconnectAttempts = 0;

    this.establishConnection();
  }

  /**
   * Close the SSE connection
   */
  close(): void {
    this.isManualClose = true;

    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }

    if (this.eventSource) {
      this.eventSource.close();
      this.eventSource = null;
    }

    this.sessionId = null;
    this.setState('disconnected');
    this.onDisconnect?.();
  }

  /**
   * Establish SSE connection
   */
  private establishConnection(): void {
    if (!this.sessionId) return;

    const url = `${this.baseUrl}/sessions/${this.sessionId}/stream`;

    this.setState(this.reconnectAttempts > 0 ? 'reconnecting' : 'connecting');

    try {
      this.eventSource = new EventSource(url);

      this.eventSource.onopen = () => {
        this.reconnectAttempts = 0;
        this.setState('connected');
        this.onConnect?.();
      };

      this.eventSource.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data) as StreamEvent;
          this.onEvent?.(data);
        } catch (error) {
          console.error('[SSE] Failed to parse event:', event.data, error);
          this.onError?.(new Error(`Failed to parse SSE event: ${event.data}`));
        }
      };

      this.eventSource.onerror = (event) => {
        console.error('[SSE] Connection error:', event);

        // EventSource will automatically try to reconnect, but we handle it manually
        // for better control
        this.eventSource?.close();
        this.eventSource = null;

        if (!this.isManualClose) {
          this.handleReconnect();
        }
      };
    } catch (error) {
      console.error('[SSE] Failed to create EventSource:', error);
      this.setState('error');
      this.onError?.(error instanceof Error ? error : new Error('Failed to create EventSource'));

      if (!this.isManualClose) {
        this.handleReconnect();
      }
    }
  }

  /**
   * Handle reconnection with exponential backoff
   */
  private handleReconnect(): void {
    if (this.isManualClose) return;

    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('[SSE] Max reconnection attempts reached');
      this.setState('error');
      this.onError?.(new Error('Max reconnection attempts reached'));
      this.onDisconnect?.();
      return;
    }

    this.reconnectAttempts++;
    const delay = Math.min(
      this.initialReconnectDelay * Math.pow(2, this.reconnectAttempts - 1),
      this.maxReconnectDelay
    );

    console.log(
      `[SSE] Reconnecting in ${delay}ms (attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts})`
    );

    this.setState('reconnecting');

    this.reconnectTimeout = setTimeout(() => {
      this.establishConnection();
    }, delay);
  }

  /**
   * Set connection state and notify listener
   */
  private setState(state: SSEConnectionState): void {
    if (this.state !== state) {
      this.state = state;
      this.onStateChange?.(state);
    }
  }
}

// ============================================================================
// Factory function for creating SSE client
// ============================================================================

/**
 * Create a new SSE client instance
 */
export function createSSEClient(options?: SSEClientOptions): SSEClient {
  return new SSEClient(options);
}
