import type { FC } from 'react';
import { useEffect, useRef } from 'react';
import { Mic, MicOff } from 'lucide-react';
import { useComposerRuntime } from '@assistant-ui/react';
import { useSpeechInput } from '@/hooks/useSpeechInput';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

interface MicrophoneButtonProps {
  className?: string;
}

/**
 * Microphone button for speech-to-text input.
 * Integrates with ChatComposer to append transcribed text to the input field.
 *
 * States:
 * - idle: Gray, inactive
 * - listening: Pulsing red animation
 * - disabled: When speech recognition is not supported
 */
export const MicrophoneButton: FC<MicrophoneButtonProps> = ({ className }) => {
  const composerRuntime = useComposerRuntime();
  const { toast } = useToast();
  const {
    transcript,
    isListening,
    startListening,
    stopListening,
    isSupported,
    error,
    resetTranscript,
  } = useSpeechInput();

  // Track previous transcript to detect changes
  const prevTranscriptRef = useRef('');
  // Track previous error to show toast only once
  const prevErrorRef = useRef<string | null>(null);

  // Show toast when error occurs
  useEffect(() => {
    if (error && error !== prevErrorRef.current) {
      toast({
        title: 'Rozpoznawanie mowy',
        description: error,
        variant: 'destructive',
      });
    }
    prevErrorRef.current = error;
  }, [error, toast]);

  // Append new transcript content to the composer
  useEffect(() => {
    if (transcript && transcript !== prevTranscriptRef.current) {
      const newContent = transcript.slice(prevTranscriptRef.current.length);
      if (newContent) {
        const currentState = composerRuntime.getState();
        const currentText = currentState.text;
        // Append with space if there's existing text
        const separator = currentText && !currentText.endsWith(' ') ? ' ' : '';
        const newText = currentText + separator + newContent;
        composerRuntime.setText(newText);
      }
      prevTranscriptRef.current = transcript;
    }
  }, [transcript, composerRuntime]);

  // Reset prev transcript when starting new listening session
  useEffect(() => {
    if (isListening) {
      prevTranscriptRef.current = '';
    }
  }, [isListening]);

  const handleClick = () => {
    if (isListening) {
      stopListening();
      resetTranscript();
    } else {
      startListening();
    }
  };

  // Determine tooltip text
  const getTooltipText = (): string => {
    if (!isSupported) {
      return 'Rozpoznawanie mowy niedostepne w tej przegladarce. Uzyj Google Chrome.';
    }
    if (error) {
      return error;
    }
    if (isListening) {
      return 'Kliknij, aby zatrzymac nagrywanie';
    }
    return 'Kliknij, aby mowic';
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={!isSupported}
      title={getTooltipText()}
      aria-label={isListening ? 'Zatrzymaj nagrywanie' : 'Rozpocznij nagrywanie glosu'}
      className={cn(
        'flex-shrink-0 inline-flex items-center justify-center',
        'h-9 w-9 rounded-lg',
        'transition-all duration-200',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
        // Idle state
        !isListening &&
          isSupported && [
            'text-muted-foreground',
            'hover:text-foreground hover:bg-accent',
            'active:scale-95',
          ],
        // Listening state - pulsing red
        isListening && [
          'bg-red-500 text-white',
          'hover:bg-red-600',
          'active:scale-95',
          'animate-pulse-red',
        ],
        // Disabled state
        !isSupported && ['opacity-50 cursor-not-allowed text-muted-foreground'],
        className
      )}
    >
      {isListening ? <Mic className="h-4 w-4" /> : <MicOff className="h-4 w-4" />}
      <span className="sr-only">
        {isListening ? 'Nagrywanie w toku' : 'Mikrofon wylaczony'}
      </span>
    </button>
  );
};

export default MicrophoneButton;
