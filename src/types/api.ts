// Temporary API types until Orval regeneration
// These types are based on backend schema

export interface Agent {
  id: string;
  name: string;
  ownerId: string;
  walletAddress?: string | null;
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
  createdAt: string;
  updatedAt: string;
  _count?: {
    sessions: number;
    notes: number;
    scheduledRuns: number;
  };
}

export interface Session {
  id: string;
  agentId: string;
  name?: string | null;
  status: 'ACTIVE' | 'WAITING_APPROVAL' | 'COMPLETED' | 'ERROR';
  messageCount: number;
  toolCallCount: number;
  createdAt: string;
  updatedAt: string;
  endedAt?: string | null;
  isScheduled?: boolean;
  scheduleId?: string | null;
  scheduledPrompt?: string | null;
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: {
    total: number;
    page: number;
    pageSize: number;
  };
}

export type AgentsResponse = PaginatedResponse<Agent>;
export type SessionsResponse = PaginatedResponse<Session>;
