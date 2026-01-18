import { type FC, useEffect, useRef, useCallback } from 'react';
import { ThreadPrimitive } from '@assistant-ui/react';
import { ArrowDown, MessageSquare } from 'lucide-react';
import { cn } from '@/lib/utils';
import { UserMessage, AssistantMessage, EditComposer } from './MessageBubble';
import { ChatComposer } from './ChatComposer';
import { useScrollRestoration } from '@/hooks/useScrollRestoration';

/**
 * Welcome message shown when thread is empty
 */
const ThreadWelcome: FC = () => {
  return (
    <div className="flex flex-col items-center justify-center h-full px-4 py-8">
      <div className="flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
        <MessageSquare className="w-8 h-8 text-primary" />
      </div>
      <h2 className="text-xl font-semibold mb-2">Start a conversation</h2>
      <p className="text-center text-muted-foreground max-w-md mb-6">
        Send a message to your AI agent. It can help you with DeFi operations, portfolio analysis,
        and more.
      </p>

      {/* Suggestion chips */}
      <div className="flex flex-wrap items-center justify-center gap-2 max-w-lg">
        <ThreadPrimitive.Suggestion
          prompt="What can you help me with?"
          method="replace"
          autoSend
          className={cn(
            'inline-flex items-center px-4 py-2 rounded-full',
            'border border-border bg-background',
            'text-sm font-medium',
            'hover:bg-accent hover:text-accent-foreground',
            'cursor-pointer transition-colors'
          )}
        >
          What can you help me with?
        </ThreadPrimitive.Suggestion>

        <ThreadPrimitive.Suggestion
          prompt="Show me my portfolio balance"
          method="replace"
          autoSend
          className={cn(
            'inline-flex items-center px-4 py-2 rounded-full',
            'border border-border bg-background',
            'text-sm font-medium',
            'hover:bg-accent hover:text-accent-foreground',
            'cursor-pointer transition-colors'
          )}
        >
          Show my portfolio
        </ThreadPrimitive.Suggestion>

        <ThreadPrimitive.Suggestion
          prompt="What DeFi protocols do you support?"
          method="replace"
          autoSend
          className={cn(
            'inline-flex items-center px-4 py-2 rounded-full',
            'border border-border bg-background',
            'text-sm font-medium',
            'hover:bg-accent hover:text-accent-foreground',
            'cursor-pointer transition-colors'
          )}
        >
          Supported protocols
        </ThreadPrimitive.Suggestion>
      </div>
    </div>
  );
};

/**
 * Scroll to bottom button
 */
const ScrollToBottomButton: FC = () => {
  return (
    <ThreadPrimitive.ScrollToBottom asChild>
      <button
        className={cn(
          'absolute bottom-24 right-4',
          'inline-flex items-center justify-center',
          'h-10 w-10 rounded-full',
          'border border-border bg-background shadow-lg',
          'hover:bg-accent',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
          'disabled:hidden',
          'transition-all'
        )}
      >
        <ArrowDown className="h-4 w-4" />
        <span className="sr-only">Scroll to bottom</span>
      </button>
    </ThreadPrimitive.ScrollToBottom>
  );
};

/**
 * Main chat thread component
 */
export const ChatThread: FC = () => {
  const viewportRef = useRef<HTMLDivElement>(null);
  const { saveScrollPosition, restoreScrollPosition } = useScrollRestoration();
  const hasRestoredRef = useRef(false);

  // Handle scroll events to save position
  const handleScroll = useCallback(() => {
    const viewport = viewportRef.current;
    if (viewport) {
      saveScrollPosition(viewport.scrollTop);
    }
  }, [saveScrollPosition]);

  // Restore scroll position on mount
  useEffect(() => {
    if (hasRestoredRef.current) return;

    // Wait for content to render before restoring
    const timeoutId = setTimeout(() => {
      restoreScrollPosition(viewportRef.current);
      hasRestoredRef.current = true;
    }, 100);

    return () => clearTimeout(timeoutId);
  }, [restoreScrollPosition]);

  // Attach scroll listener to viewport
  useEffect(() => {
    const viewport = viewportRef.current;
    if (!viewport) return;

    viewport.addEventListener('scroll', handleScroll, { passive: true });
    return () => viewport.removeEventListener('scroll', handleScroll);
  }, [handleScroll]);

  return (
    <ThreadPrimitive.Root
      className="flex flex-col h-full overflow-hidden relative"
      style={{ ['--thread-max-width' as string]: '48rem' }}
    >
      <ThreadPrimitive.Viewport ref={viewportRef} className="flex-1 overflow-y-auto scroll-smooth">
        {/* Empty state */}
        <ThreadPrimitive.Empty>
          <ThreadWelcome />
        </ThreadPrimitive.Empty>

        {/* Messages */}
        <ThreadPrimitive.Messages
          components={{
            UserMessage,
            AssistantMessage,
            EditComposer,
          }}
        />

        {/* Spacer for scroll */}
        <ThreadPrimitive.If empty={false}>
          <div className="min-h-8 flex-grow" />
        </ThreadPrimitive.If>
      </ThreadPrimitive.Viewport>

      {/* Scroll to bottom button */}
      <ScrollToBottomButton />

      {/* Composer */}
      <ChatComposer />
    </ThreadPrimitive.Root>
  );
};

export default ChatThread;
