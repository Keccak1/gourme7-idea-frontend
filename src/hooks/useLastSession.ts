import { useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';

const STORAGE_KEY = 'gourme7_last_session';
const SESSION_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

interface LastSessionData {
  agentId: string;
  sessionId: string;
  timestamp: number;
}

/**
 * Hook to manage last visited session persistence in localStorage.
 * Automatically saves the current session when navigating to a session page.
 * Returns the last session if it's still valid (not expired).
 */
export function useLastSession() {
  const { agentId, sessionId } = useParams<{ agentId?: string; sessionId?: string }>();

  // Get last session from localStorage
  const getLastSession = useCallback((): LastSessionData | null => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (!stored) return null;

      const data: LastSessionData = JSON.parse(stored);

      // Check if session data has expired
      if (Date.now() - data.timestamp > SESSION_TTL_MS) {
        localStorage.removeItem(STORAGE_KEY);
        return null;
      }

      // Validate data structure
      if (!data.agentId || !data.sessionId) {
        localStorage.removeItem(STORAGE_KEY);
        return null;
      }

      return data;
    } catch {
      localStorage.removeItem(STORAGE_KEY);
      return null;
    }
  }, []);

  // Save current session to localStorage
  const saveLastSession = useCallback((agentId: string, sessionId: string) => {
    try {
      const data: LastSessionData = {
        agentId,
        sessionId,
        timestamp: Date.now(),
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch (error) {
      console.error('Failed to save last session:', error);
    }
  }, []);

  // Clear last session from localStorage
  const clearLastSession = useCallback(() => {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch (error) {
      console.error('Failed to clear last session:', error);
    }
  }, []);

  // Auto-save current session when agentId and sessionId change
  useEffect(() => {
    if (agentId && sessionId) {
      saveLastSession(agentId, sessionId);
    }
  }, [agentId, sessionId, saveLastSession]);

  return {
    lastSession: getLastSession(),
    saveLastSession,
    clearLastSession,
  };
}

/**
 * Hook to get last session without auto-save behavior.
 * Useful for components that just need to read the last session.
 */
export function useLastSessionData(): LastSessionData | null {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return null;

    const data: LastSessionData = JSON.parse(stored);

    // Check if session data has expired
    if (Date.now() - data.timestamp > SESSION_TTL_MS) {
      localStorage.removeItem(STORAGE_KEY);
      return null;
    }

    // Validate data structure
    if (!data.agentId || !data.sessionId) {
      localStorage.removeItem(STORAGE_KEY);
      return null;
    }

    return data;
  } catch {
    return null;
  }
}

/**
 * Clear last session from localStorage (useful when session/agent is deleted)
 */
export function clearLastSessionStorage(targetAgentId?: string, targetSessionId?: string) {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return;

    const data: LastSessionData = JSON.parse(stored);

    // If specific agent/session provided, only clear if it matches
    if (targetAgentId && data.agentId !== targetAgentId) return;
    if (targetSessionId && data.sessionId !== targetSessionId) return;

    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // Ignore errors
  }
}
