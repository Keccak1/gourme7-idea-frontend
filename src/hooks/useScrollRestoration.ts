import { useEffect, useRef, useCallback } from 'react';
import { useParams } from 'react-router-dom';

const STORAGE_KEY_PREFIX = 'gourme7_scroll_';
const DEBOUNCE_MS = 150;
const MAX_STORED_SESSIONS = 20;

interface ScrollPosition {
  scrollTop: number;
  timestamp: number;
}

/**
 * Cleanup old entries to prevent storage bloat
 */
function cleanupOldEntries() {
  try {
    const entries: { key: string; timestamp: number }[] = [];

    // Collect all scroll position entries
    for (let i = 0; i < sessionStorage.length; i++) {
      const key = sessionStorage.key(i);
      if (key?.startsWith(STORAGE_KEY_PREFIX)) {
        const stored = sessionStorage.getItem(key);
        if (stored) {
          try {
            const position: ScrollPosition = JSON.parse(stored);
            entries.push({ key, timestamp: position.timestamp });
          } catch {
            // Invalid entry, mark for removal
            entries.push({ key, timestamp: 0 });
          }
        }
      }
    }

    // Remove oldest entries if over limit
    if (entries.length > MAX_STORED_SESSIONS) {
      entries.sort((a, b) => a.timestamp - b.timestamp);
      const toRemove = entries.slice(0, entries.length - MAX_STORED_SESSIONS);
      toRemove.forEach(({ key }) => sessionStorage.removeItem(key));
    }
  } catch {
    // Ignore cleanup errors
  }
}

/**
 * Hook to save and restore scroll position for chat sessions.
 * Uses sessionStorage to persist scroll positions per session.
 */
export function useScrollRestoration() {
  const { sessionId } = useParams<{ sessionId?: string }>();
  const scrollTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isRestoringRef = useRef(false);

  // Get storage key for current session
  const getStorageKey = useCallback(() => {
    if (!sessionId) return null;
    return `${STORAGE_KEY_PREFIX}${sessionId}`;
  }, [sessionId]);

  // Save scroll position (debounced)
  const saveScrollPosition = useCallback(
    (scrollTop: number) => {
      const key = getStorageKey();
      if (!key) return;

      // Don't save while restoring
      if (isRestoringRef.current) return;

      // Clear existing timeout
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }

      // Debounce save
      scrollTimeoutRef.current = setTimeout(() => {
        try {
          const position: ScrollPosition = {
            scrollTop,
            timestamp: Date.now(),
          };
          sessionStorage.setItem(key, JSON.stringify(position));

          // Clean up old entries
          cleanupOldEntries();
        } catch (error) {
          console.error('Failed to save scroll position:', error);
        }
      }, DEBOUNCE_MS);
    },
    [getStorageKey]
  );

  // Get saved scroll position
  const getSavedScrollPosition = useCallback((): number | null => {
    const key = getStorageKey();
    if (!key) return null;

    try {
      const stored = sessionStorage.getItem(key);
      if (!stored) return null;

      const position: ScrollPosition = JSON.parse(stored);
      return position.scrollTop;
    } catch {
      return null;
    }
  }, [getStorageKey]);

  // Restore scroll position to element
  const restoreScrollPosition = useCallback(
    (element: HTMLElement | null) => {
      if (!element) return;

      const savedPosition = getSavedScrollPosition();
      if (savedPosition === null) return;

      // Mark as restoring to prevent saving during restoration
      isRestoringRef.current = true;

      // Use requestAnimationFrame for smoother restoration
      requestAnimationFrame(() => {
        element.scrollTop = savedPosition;

        // Reset flag after a short delay
        setTimeout(() => {
          isRestoringRef.current = false;
        }, 100);
      });
    },
    [getSavedScrollPosition]
  );

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
    };
  }, []);

  return {
    saveScrollPosition,
    restoreScrollPosition,
    getSavedScrollPosition,
  };
}

/**
 * Clear scroll position for a specific session
 */
export function clearScrollPosition(sessionId: string) {
  try {
    sessionStorage.removeItem(`${STORAGE_KEY_PREFIX}${sessionId}`);
  } catch {
    // Ignore errors
  }
}
