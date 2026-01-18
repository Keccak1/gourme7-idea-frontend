import { QueryClient } from '@tanstack/react-query';
import { ApiError } from './axios-instance';

/**
 * Exponential backoff delay function
 * Returns delay in ms: 1000, 2000, 4000, etc. capped at 30s
 */
function exponentialBackoff(attemptIndex: number): number {
  return Math.min(1000 * 2 ** attemptIndex, 30000);
}

/**
 * Determine if an error should trigger a retry
 * Don't retry on 4xx errors (client errors) except for rate limiting (429)
 */
function shouldRetry(failureCount: number, error: unknown): boolean {
  // Max 3 retries
  if (failureCount >= 3) return false;

  // Check if it's an ApiError with status
  if (error instanceof ApiError) {
    // Don't retry auth errors or client errors (except rate limiting)
    if (error.type === 'auth') return false;
    if (error.status >= 400 && error.status < 500 && error.status !== 429) return false;
    // Retry network errors and server errors
    return true;
  }

  // Retry unknown errors (could be network issues)
  return true;
}

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60, // 1 minute
      retry: shouldRetry,
      retryDelay: exponentialBackoff,
      refetchOnWindowFocus: false,
    },
    mutations: {
      retry: 0, // Don't retry mutations by default
    },
  },
});

export default queryClient;
