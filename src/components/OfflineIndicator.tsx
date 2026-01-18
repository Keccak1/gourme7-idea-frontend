import { useState, useEffect } from 'react';
import { WifiOff } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * Banner component that displays when the user is offline.
 * Uses navigator.onLine and online/offline event listeners.
 */
export function OfflineIndicator() {
  const [isOffline, setIsOffline] = useState(!navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (!isOffline) {
    return null;
  }

  return (
    <div
      className={cn(
        'fixed top-0 left-0 right-0 z-[100]',
        'flex items-center justify-center gap-2',
        'px-4 py-2',
        'bg-destructive text-destructive-foreground',
        'text-sm font-medium',
        'shadow-md',
        'animate-in slide-in-from-top duration-300'
      )}
    >
      <WifiOff className="h-4 w-4" />
      <span>You are offline. Some features may not be available.</span>
    </div>
  );
}

export default OfflineIndicator;
