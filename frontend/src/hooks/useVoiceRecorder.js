import { useState, useRef, useCallback } from "react";

const LANGUAGE_CODES = {
  Spanish: "es-ES",
  French: "fr-FR",
  German: "de-DE",
  Dutch: "nl-NL",
  English: "en-US",
};

/**
 * Voice recorder using the browser Web Speech API.
 * Calls onResult(text) directly — no server transcription needed.
 * Works on Chrome, Edge, Safari (iOS 14.5+), and Android Chrome.
 */
export default function useVoiceRecorder({ onResult, language = "English" }) {
  const [recording, setRecording] = useState(false);
  const [error, setError] = useState(null);
  const recognitionRef = useRef(null);

  const startRecording = useCallback(() => {
    setError(null);

    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setError(
        "Speech recognition is not supported in this browser. Please use Chrome or Safari."
      );
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = LANGUAGE_CODES[language] || "en-US";
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;
    // Keep listening until the user manually stops (single utterance mode)
    recognition.continuous = false;
    recognitionRef.current = recognition;

    recognition.onstart = () => setRecording(true);

    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      if (transcript.trim() && onResult) {
        onResult(transcript.trim());
      }
    };

    recognition.onerror = (event) => {
      if (event.error !== "aborted") {
        setError("Microphone error: " + event.error);
      }
      setRecording(false);
    };

    recognition.onend = () => setRecording(false);

    try {
      recognition.start();
    } catch (e) {
      setError("Could not start microphone: " + e.message);
    }
  }, [onResult, language]);

  const stopRecording = useCallback(() => {
    recognitionRef.current?.stop();
    setRecording(false);
  }, []);

  const toggleRecording = useCallback(() => {
    if (recording) {
      stopRecording();
    } else {
      startRecording();
    }
  }, [recording, startRecording, stopRecording]);

  return { recording, error, startRecording, stopRecording, toggleRecording };
}
