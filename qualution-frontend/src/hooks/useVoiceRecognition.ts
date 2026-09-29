import { useState, useEffect, useCallback, useRef } from 'react';

export interface VoiceRecognitionState {
  isListening: boolean;
  transcript: string;
  interimTranscript: string;
  error: string | null;
  supported: boolean;
}

export const useVoiceRecognition = (onResult?: (transcript: string) => void) => {
  const [state, setState] = useState<VoiceRecognitionState>({
    isListening: false,
    transcript: '',
    interimTranscript: '',
    error: null,
    supported: false,
  });

  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    // Check if the browser supports SpeechRecognition
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      setState((s) => ({ ...s, supported: true }));
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = true;
      recognitionRef.current.interimResults = true;

      recognitionRef.current.onresult = (event: any) => {
        let currentTranscript = '';
        let currentInterim = '';

        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            currentTranscript += event.results[i][0].transcript;
          } else {
            currentInterim += event.results[i][0].transcript;
          }
        }

        setState((s) => ({
          ...s,
          transcript: currentTranscript,
          interimTranscript: currentInterim,
        }));

        if (currentTranscript && onResult) {
          onResult(currentTranscript.trim());
        }
      };

      recognitionRef.current.onerror = (event: any) => {
        setState((s) => ({ ...s, error: event.error, isListening: false }));
      };

      recognitionRef.current.onend = () => {
        setState((s) => ({ ...s, isListening: false }));
      };
    }
  }, [onResult]);

  const startListening = useCallback(() => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.start();
        setState((s) => ({ ...s, isListening: true, error: null, transcript: '', interimTranscript: '' }));
      } catch (e) {
        // Already started
      }
    }
  }, []);

  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      setState((s) => ({ ...s, isListening: false }));
    }
  }, []);

  const toggleListening = useCallback(() => {
    if (state.isListening) {
      stopListening();
    } else {
      startListening();
    }
  }, [state.isListening, startListening, stopListening]);

  return {
    ...state,
    startListening,
    stopListening,
    toggleListening,
  };
};
