import { useState, useCallback, useEffect, useRef } from 'react';
import SpeechRecognition, {
  useSpeechRecognition,
} from 'react-speech-recognition';

interface UseSpeechInputReturn {
  /** Current transcript from speech recognition */
  transcript: string;
  /** Whether the microphone is currently listening */
  isListening: boolean;
  /** Start listening for speech */
  startListening: () => void;
  /** Stop listening for speech */
  stopListening: () => void;
  /** Whether speech recognition is supported in current browser */
  isSupported: boolean;
  /** Error message if something went wrong, null otherwise */
  error: string | null;
  /** Reset the transcript to empty string */
  resetTranscript: () => void;
}

/**
 * Checks if we're running in Chromium (not Chrome) which doesn't support
 * Web Speech API properly despite reporting it as available.
 *
 * In Chromium, the SpeechRecognition API exists but the actual speech
 * recognition service (which relies on Google's servers) is not available.
 */
function isChromiumWithoutSpeechSupport(): boolean {
  if (typeof navigator === 'undefined') return false;

  const ua = navigator.userAgent;

  // Check if it's Chromium-based
  const isChromiumBased = /Chrome\//.test(ua);
  if (!isChromiumBased) return false;

  // Check if it's actual Google Chrome (not Chromium)
  // Chrome has "Google" in vendor, Chromium doesn't
  const isGoogleChrome = navigator.vendor === 'Google Inc.';

  // Additional check: Chrome has specific branding
  // @ts-expect-error - userAgentData is experimental
  const brands = navigator.userAgentData?.brands || [];
  const hasGoogleChromeBrand = brands.some(
    (brand: { brand: string }) =>
      brand.brand === 'Google Chrome' || brand.brand === 'Chromium'
  );

  // If it's Chromium-based but NOT Google Chrome, it likely won't work
  // Exception: Edge also works (uses Microsoft's implementation)
  const isEdge = /Edg\//.test(ua);

  if (isEdge) return false; // Edge works
  if (isGoogleChrome) return false; // Chrome works

  // Check for Chromium specifically
  if (hasGoogleChromeBrand) {
    const chromiumBrand = brands.find(
      (brand: { brand: string }) => brand.brand === 'Chromium'
    );
    const chromeBrand = brands.find(
      (brand: { brand: string }) => brand.brand === 'Google Chrome'
    );
    // If we have Chromium brand but not Google Chrome brand, it's Chromium
    if (chromiumBrand && !chromeBrand) return true;
  }

  // Fallback: If we can't determine, check if vendor is empty (Chromium)
  if (!navigator.vendor || navigator.vendor === '') return true;

  return false;
}

/**
 * Hook for speech-to-text input using Web Speech API.
 *
 * Browser support:
 * - Chrome, Edge, Safari: Full support via Web Speech API
 * - Firefox: Not supported (displays error message)
 * - Chromium: Not supported (API exists but doesn't work)
 *
 * Uses `react-speech-recognition` library which wraps the native
 * SpeechRecognition API with React-friendly interface.
 *
 * @example
 * ```tsx
 * const { transcript, isListening, startListening, stopListening, isSupported } = useSpeechInput();
 *
 * if (!isSupported) {
 *   return <span>Speech recognition not supported</span>;
 * }
 *
 * return (
 *   <button onClick={isListening ? stopListening : startListening}>
 *     {isListening ? 'Stop' : 'Start'}
 *   </button>
 * );
 * ```
 */
export function useSpeechInput(): UseSpeechInputReturn {
  const [error, setError] = useState<string | null>(null);
  const abortedRef = useRef(false);
  const listeningStartTimeRef = useRef<number | null>(null);
  const hasReceivedTranscriptRef = useRef(false);

  const {
    transcript,
    listening,
    resetTranscript,
    browserSupportsSpeechRecognition,
    isMicrophoneAvailable,
  } = useSpeechRecognition();

  // Check if running in Chromium (which doesn't really support speech recognition)
  const isChromiumOnly = isChromiumWithoutSpeechSupport();

  // Check for browser support - exclude Chromium without proper support
  const isSupported = browserSupportsSpeechRecognition && !isChromiumOnly;

  // Track when we receive transcript
  useEffect(() => {
    if (transcript) {
      hasReceivedTranscriptRef.current = true;
    }
  }, [transcript]);

  // Detect when listening stops without any transcript (Chromium issue)
  const prevListeningRef = useRef(listening);
  useEffect(() => {
    // Detect transition from listening -> not listening
    if (prevListeningRef.current && !listening) {
      const wasListeningFor = listeningStartTimeRef.current
        ? Date.now() - listeningStartTimeRef.current
        : 0;

      // If user listened for more than 2 seconds but got no transcript,
      // it's likely a Chromium/unsupported browser issue
      if (
        wasListeningFor > 2000 &&
        !hasReceivedTranscriptRef.current &&
        !abortedRef.current
      ) {
        console.warn(
          '[useSpeechInput] No transcript received after listening. This may indicate an unsupported browser (e.g., Chromium).'
        );
        setError(
          'Rozpoznawanie mowy nie dziala w tej przegladarce. Uzyj Google Chrome lub Microsoft Edge.'
        );
      }

      listeningStartTimeRef.current = null;
    }
    prevListeningRef.current = listening;
  }, [listening]);

  // Start listening with continuous mode for longer utterances
  const startListening = useCallback(() => {
    if (!browserSupportsSpeechRecognition) {
      setError(
        'Rozpoznawanie mowy nie jest wspierane w tej przegladarce (Firefox). Uzyj Google Chrome lub Microsoft Edge.'
      );
      return;
    }

    if (isChromiumOnly) {
      setError(
        'Rozpoznawanie mowy nie dziala w Chromium. Uzyj Google Chrome lub Microsoft Edge.'
      );
      return;
    }

    if (!isMicrophoneAvailable) {
      setError('Mikrofon nie jest dostepny. Sprawdz uprawnienia przegladarki.');
      return;
    }

    setError(null);
    abortedRef.current = false;
    hasReceivedTranscriptRef.current = false;
    listeningStartTimeRef.current = Date.now();
    resetTranscript();

    SpeechRecognition.startListening({
      continuous: true,
      language: 'pl-PL',
    }).catch((err) => {
      // Don't show error if user manually stopped
      if (abortedRef.current) {
        return;
      }
      const message =
        err instanceof Error ? err.message : 'Nieznany blad rozpoznawania mowy';
      setError(message);
    });
  }, [
    browserSupportsSpeechRecognition,
    isChromiumOnly,
    isMicrophoneAvailable,
    resetTranscript,
  ]);

  // Stop listening
  const stopListening = useCallback(() => {
    abortedRef.current = true;
    SpeechRecognition.stopListening();
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      SpeechRecognition.abortListening();
    };
  }, []);

  return {
    transcript,
    isListening: listening,
    startListening,
    stopListening,
    isSupported,
    error,
    resetTranscript,
  };
}

export type { UseSpeechInputReturn };
