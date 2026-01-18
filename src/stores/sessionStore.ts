import { create } from 'zustand';

/**
 * Session name store
 *
 * Stores dynamically updated session names received via SSE.
 * Used to update sidebar session names in real-time without refetching.
 */

interface SessionNameState {
  // Map of sessionId -> name
  sessionNames: Map<string, string>;

  // Actions
  setSessionName: (sessionId: string, name: string) => void;
  getSessionName: (sessionId: string) => string | undefined;
  clearSessionName: (sessionId: string) => void;
  clearAll: () => void;
}

export const useSessionStore = create<SessionNameState>((set, get) => ({
  sessionNames: new Map(),

  setSessionName: (sessionId: string, name: string) => {
    set((state) => {
      const newMap = new Map(state.sessionNames);
      newMap.set(sessionId, name);
      return { sessionNames: newMap };
    });
  },

  getSessionName: (sessionId: string) => {
    return get().sessionNames.get(sessionId);
  },

  clearSessionName: (sessionId: string) => {
    set((state) => {
      const newMap = new Map(state.sessionNames);
      newMap.delete(sessionId);
      return { sessionNames: newMap };
    });
  },

  clearAll: () => {
    set({ sessionNames: new Map() });
  },
}));

/**
 * Hook to get session name from store
 * Falls back to undefined if not set
 */
export function useSessionName(sessionId: string): string | undefined {
  return useSessionStore((state) => state.sessionNames.get(sessionId));
}

/**
 * Current agent name store
 *
 * Stores the name of the currently active agent in the chat.
 * Used by components to display dynamic agent name instead of hardcoded values.
 */

interface CurrentAgentState {
  currentAgentName: string | null;
  setCurrentAgentName: (name: string | null) => void;
}

export const useCurrentAgentStore = create<CurrentAgentState>((set) => ({
  currentAgentName: null,

  setCurrentAgentName: (name: string | null) => {
    set({ currentAgentName: name });
  },
}));

/**
 * Hook to get current agent name from store
 * Returns the agent name or null if not set
 */
export function useCurrentAgentName(): string | null {
  return useCurrentAgentStore((state) => state.currentAgentName);
}
