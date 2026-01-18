const baseURL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

/**
 * Custom API error class with status code and type information
 */
export class ApiError extends Error {
  status: number;
  type: 'auth' | 'server' | 'network' | 'unknown';

  constructor(message: string, status: number, type: ApiError['type']) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.type = type;
  }
}

/**
 * Classify error based on status code
 */
function classifyError(status: number): ApiError['type'] {
  if (status === 401 || status === 403) return 'auth';
  if (status >= 500) return 'server';
  return 'unknown';
}

/**
 * Get user-friendly error message based on status code
 */
function getErrorMessage(status: number, serverMessage?: string): string {
  switch (status) {
    case 401:
      return 'Session expired. Please log in again.';
    case 403:
      return 'You do not have permission to perform this action.';
    case 404:
      return serverMessage || 'Resource not found.';
    case 500:
    case 502:
    case 503:
    case 504:
      return 'Server error. Please try again later.';
    default:
      return serverMessage || `Request failed with status ${status}`;
  }
}

/**
 * Custom fetch instance for Orval-generated API client
 * Handles base URL prefixing, response parsing, and error classification
 */
export const customInstance = async <T>(url: string, options?: RequestInit): Promise<T> => {
  const fullUrl = url.startsWith('http') ? url : `${baseURL}${url}`;

  let response: Response;

  try {
    response = await fetch(fullUrl, {
      ...options,
      headers: {
        ...options?.headers,
      },
    });
  } catch {
    // Network error (offline, DNS failure, etc.)
    throw new ApiError('Connection lost. Please check your internet connection.', 0, 'network');
  }

  if (!response.ok) {
    let serverMessage: string | undefined;
    try {
      serverMessage = await response.text();
      // Try to parse as JSON for better error messages
      const jsonError = JSON.parse(serverMessage);
      serverMessage = jsonError.message || jsonError.error || serverMessage;
    } catch {
      // Keep the text error message
    }

    const errorType = classifyError(response.status);
    const errorMessage = getErrorMessage(response.status, serverMessage);

    throw new ApiError(errorMessage, response.status, errorType);
  }

  // Handle empty responses
  const contentType = response.headers.get('content-type');
  if (contentType?.includes('application/json')) {
    const data = await response.json();
    return { data, status: response.status, headers: response.headers } as T;
  }

  return { data: undefined, status: response.status, headers: response.headers } as T;
};

export default customInstance;
