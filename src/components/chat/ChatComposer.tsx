import type { FC } from 'react';
import { ComposerPrimitive, ThreadPrimitive } from '@assistant-ui/react';
import { SendHorizontal, Square } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useCurrentAgentName } from '@/stores/sessionStore';
import { MicrophoneButton } from './MicrophoneButton';

/**
 * Chat composer component with input field and send/stop buttons
 */
export const ChatComposer: FC = () => {
  const agentName = useCurrentAgentName();

  return (
    <div className="sticky bottom-0 w-full bg-gradient-to-t from-background via-background to-transparent pt-6 pb-4">
      <div className="max-w-3xl mx-auto px-4">
        <ComposerPrimitive.Root className="relative flex items-end gap-2 rounded-xl border border-input bg-background shadow-sm transition-all duration-300 focus-within:border-primary/50 focus-within:shadow-[0_0_0_3px_rgba(var(--primary-rgb,59,130,246),0.1)] focus-within:ring-0">
          <ComposerPrimitive.Input
            rows={1}
            autoFocus
            placeholder="Send a message..."
            className={cn(
              'flex-1 resize-none border-0 bg-transparent',
              'px-4 py-3 text-sm',
              'placeholder:text-muted-foreground',
              'focus:outline-none focus:ring-0',
              'max-h-32 min-h-[44px]',
              'scrollbar-thin scrollbar-thumb-muted scrollbar-track-transparent'
            )}
          />

          {/* Microphone button for speech-to-text */}
          <MicrophoneButton className="mb-1.5" />

          {/* Send button (shown when not running) */}
          <ThreadPrimitive.If running={false}>
            <ComposerPrimitive.Send asChild>
              <button
                className={cn(
                  'flex-shrink-0 inline-flex items-center justify-center',
                  'h-9 w-9 mr-1.5 mb-1.5 rounded-lg',
                  'bg-primary text-primary-foreground',
                  'hover:bg-primary/90 hover:scale-105',
                  'active:scale-95',
                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                  'disabled:opacity-50 disabled:pointer-events-none',
                  'transition-all duration-200'
                )}
              >
                <SendHorizontal className="h-4 w-4" />
                <span className="sr-only">Send message</span>
              </button>
            </ComposerPrimitive.Send>
          </ThreadPrimitive.If>

          {/* Stop button (shown when running) */}
          <ThreadPrimitive.If running>
            <ComposerPrimitive.Cancel asChild>
              <button
                className={cn(
                  'flex-shrink-0 inline-flex items-center justify-center',
                  'h-9 w-9 mr-1.5 mb-1.5 rounded-lg',
                  'bg-destructive text-destructive-foreground',
                  'hover:bg-destructive/90 hover:scale-105',
                  'active:scale-95',
                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                  'transition-all duration-200'
                )}
              >
                <Square className="h-4 w-4 fill-current" />
                <span className="sr-only">Stop generation</span>
              </button>
            </ComposerPrimitive.Cancel>
          </ThreadPrimitive.If>
        </ComposerPrimitive.Root>

        {/* Disclaimer text */}
        <p className="mt-2 text-center text-xs text-muted-foreground">
          {agentName ?? 'Agent'} may make mistakes. Please verify important information.
        </p>
      </div>
    </div>
  );
};

export default ChatComposer;
