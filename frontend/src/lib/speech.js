import { useCallback, useEffect, useRef, useState } from 'react';

// Speaks AI questions aloud. Supported in every modern browser (Chrome, Edge,
// Safari, Firefox) - unlike SpeechRecognition below, this side rarely needs a fallback.
export function useTextToSpeech() {
  const supported = typeof window !== 'undefined' && 'speechSynthesis' in window;
  const [isSpeaking, setIsSpeaking] = useState(false);

  const speak = useCallback(
    (text, { onEnd } = {}) => {
      if (!supported || !text) {
        onEnd?.();
        return;
      }
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 1;
      utterance.onstart = () => setIsSpeaking(true);
      utterance.onend = () => {
        setIsSpeaking(false);
        onEnd?.();
      };
      utterance.onerror = () => {
        setIsSpeaking(false);
        onEnd?.();
      };
      window.speechSynthesis.speak(utterance);
    },
    [supported]
  );

  const cancel = useCallback(() => {
    if (supported) window.speechSynthesis.cancel();
    setIsSpeaking(false);
  }, [supported]);

  useEffect(() => () => { if (supported) window.speechSynthesis.cancel(); }, [supported]);

  return { supported, isSpeaking, speak, cancel };
}

const SpeechRecognitionImpl =
  typeof window !== 'undefined' ? window.SpeechRecognition || window.webkitSpeechRecognition : null;

const SILENCE_WARNING_MS = 5000;
const SILENCE_GRACE_MS = 3000;

// Captures spoken answers as text. NOT supported in Firefox and spotty in older
// Safari - callers must check `supported` and fall back to a typed-answer input when
// false (the recommended, silent auto-fallback rather than blocking the feature).
//
// Auto-submits on silence: after SILENCE_WARNING_MS with no new speech, surfaces
// `isSilenceWarning` (render an "Are you still there?" prompt); after SILENCE_GRACE_MS
// more with still nothing, finalizes automatically with whatever was captured so far -
// silence never blocks the interview indefinitely.
export function useSpeechToText(onFinalize) {
  const supported = !!SpeechRecognitionImpl;
  const [isListening, setIsListening] = useState(false);
  const [isSilenceWarning, setIsSilenceWarning] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [permissionDenied, setPermissionDenied] = useState(false);

  const recognitionRef = useRef(null);
  const transcriptRef = useRef('');
  const warningTimerRef = useRef(null);
  const graceTimerRef = useRef(null);
  const manualStopRef = useRef(false);
  const onFinalizeRef = useRef(onFinalize);
  onFinalizeRef.current = onFinalize;

  const clearTimers = () => {
    clearTimeout(warningTimerRef.current);
    clearTimeout(graceTimerRef.current);
  };

  const finalize = () => {
    clearTimers();
    manualStopRef.current = true;
    setIsSilenceWarning(false);
    setIsListening(false);
    try {
      recognitionRef.current?.stop();
    } catch {
      // already stopped
    }
    onFinalizeRef.current?.(transcriptRef.current.trim());
  };

  // Stops the mic without treating whatever was captured as a real answer - used when
  // the student switches to typing mid-listen, so we don't double-submit.
  const cancel = () => {
    clearTimers();
    manualStopRef.current = true;
    setIsSilenceWarning(false);
    setIsListening(false);
    try {
      recognitionRef.current?.stop();
    } catch {
      // already stopped
    }
  };

  const armSilenceTimer = () => {
    clearTimers();
    setIsSilenceWarning(false);
    warningTimerRef.current = setTimeout(() => {
      setIsSilenceWarning(true);
      graceTimerRef.current = setTimeout(finalize, SILENCE_GRACE_MS);
    }, SILENCE_WARNING_MS);
  };

  const start = useCallback(() => {
    if (!supported) return;
    transcriptRef.current = '';
    setTranscript('');
    setIsSilenceWarning(false);
    setPermissionDenied(false);
    manualStopRef.current = false;

    const recognition = new SpeechRecognitionImpl();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';

    recognition.onresult = (event) => {
      let finalChunk = '';
      let interim = '';
      for (let i = event.resultIndex; i < event.results.length; i += 1) {
        const res = event.results[i];
        if (res.isFinal) finalChunk += res[0].transcript;
        else interim += res[0].transcript;
      }
      if (finalChunk) transcriptRef.current = `${transcriptRef.current} ${finalChunk}`.trim();
      setTranscript(`${transcriptRef.current} ${interim}`.trim());
      armSilenceTimer();
    };

    recognition.onend = () => {
      if (!manualStopRef.current) {
        // Browser auto-stopped (e.g. a brief network hiccup) while we still want to
        // keep listening for this answer - restart transparently.
        try {
          recognition.start();
          return;
        } catch {
          // fall through to marking not-listening
        }
      }
      setIsListening(false);
    };

    recognition.onerror = (event) => {
      if (event.error === 'no-speech' || event.error === 'aborted') return; // benign, onend handles it
      if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
        setPermissionDenied(true);
      }
      manualStopRef.current = true;
      clearTimers();
      setIsListening(false);
    };

    recognitionRef.current = recognition;
    try {
      recognition.start();
      setIsListening(true);
      armSilenceTimer();
    } catch {
      setIsListening(false);
    }
  }, [supported]);

  const stop = useCallback(() => finalize(), []);
  const cancelListening = useCallback(() => cancel(), []);

  useEffect(
    () => () => {
      manualStopRef.current = true;
      clearTimers();
      try {
        recognitionRef.current?.stop();
      } catch {
        // already stopped
      }
    },
    []
  );

  return {
    supported,
    isListening,
    isSilenceWarning,
    permissionDenied,
    transcript,
    start,
    stop,
    cancel: cancelListening,
  };
}
