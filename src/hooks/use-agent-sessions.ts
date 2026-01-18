import { useQuery } from '@tanstack/react-query';
import { customInstance } from '@/api/axios-instance';
import type { SessionsResponse } from '@/types/api';

interface UseAgentSessionsOptions {
  page?: number;
  pageSize?: number;
  status?: 'ACTIVE' | 'WAITING_APPROVAL' | 'COMPLETED' | 'ERROR';
  enabled?: boolean;
}

/**
 * Hook to fetch sessions for a specific agent
 * Uses the /agents/:agentId/sessions endpoint
 */
export function useAgentSessions(
  agentId: string | undefined,
  options: UseAgentSessionsOptions = {}
) {
  const { page = 1, pageSize = 50, status, enabled = true } = options;

  return useQuery({
    queryKey: ['agents', agentId, 'sessions', { page, pageSize, status }],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (page) params.append('page', page.toString());
      if (pageSize) params.append('pageSize', pageSize.toString());
      if (status) params.append('status', status);

      const queryString = params.toString();
      const url = `/agents/${agentId}/sessions${queryString ? `?${queryString}` : ''}`;

      const response = await customInstance<{ data: SessionsResponse; status: number }>(url, {
        method: 'GET',
      });

      return response.data;
    },
    enabled: !!agentId && enabled,
    staleTime: 30_000, // 30 seconds
  });
}
