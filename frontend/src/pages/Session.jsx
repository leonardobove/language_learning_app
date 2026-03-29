import { useEffect, useRef, useState, useCallback } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import {
  getSession,
  getUser,
  endSession,
  chatStream,
  transcribeAudio,
  fetchTTS,
} from "../api.js";
import MicButton from "../components/MicButton.jsx";
import MessageBubble from "../components/MessageBubble.jsx";
import AudioPlayer from "../components/AudioPlayer.jsx";
import HistoryPanel from "../components/HistoryPanel.jsx";
import useVoiceRecorder from "../hooks/useVoiceRecorder.js";
import useSSE from "../hooks/useSSE.js";

export default function Session() {
  const { sessionId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();

  const [session, setSession] = useState(null);
  const [user, setUser] = useState(location.state?.user || null);
  const [messages, setMessages] = useState([]);
  const [streamingMessage, setStreamingMessage] = useState(null); // {content: string}
  const [inputText, setInputText] = useState("");
  const [showInput, setShowInput] = useState(false);
  const [audioSrc, setAudioSrc] = useState(null);
  const [busy, setBusy] = useState(false);
  const [transcribing, setTranscribing] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [ending, setEnding] = useState(false);
  const [error, setError] = useState(null);

  const messagesEndRef = useRef(null);
  const { readStream } = useSSE();

  const language = session?.language || location.state?.language?.name || "Spanish";
  const level = session?.level || location.state?.level || "beginner";

  // Load session + user on mount
  useEffect(() => {
    async function load() {
      try {
        const s = await getSession(parseInt(sessionId));
        setSession(s);
        setMessages(s.messages || []);
        if (!user) {
          const u = await getUser(s.user_id);
          setUser(u);
        }
      } catch {
        navigate("/");
      }
    }
    load();
  }, [sessionId]);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, streamingMessage]);

  // Send a text/transcribed message to the AI
  const sendMessage = useCallback(
    async (text) => {
      if (!text.trim() || busy || !session) return;
      setBusy(true);
      setError(null);

      const userMsg = {
        id: Date.now(),
        role: "user",
        content: text,
        created_at: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, userMsg]);
      setStreamingMessage({ content: "" });

      try {
        const response = await chatStream(
          parseInt(sessionId),
          text,
          session.user_id,
          language
        );

        let fullContent = "";

        await readStream(
          response,
          (chunk) => {
            fullContent += chunk;
            setStreamingMessage({ content: fullContent });
          },
          async (complete) => {
            setStreamingMessage(null);
            const assistantMsg = {
              id: Date.now() + 1,
              role: "assistant",
              content: complete,
              created_at: new Date().toISOString(),
            };
            setMessages((prev) => [...prev, assistantMsg]);

            // Fetch TTS in background
            try {
              const src = await fetchTTS(complete, language);
              setAudioSrc(src);
            } catch (e) {
              console.warn("TTS failed:", e);
            }

            setBusy(false);
          },
          (err) => {
            setError(err);
            setStreamingMessage(null);
            setBusy(false);
          }
        );
      } catch (e) {
        setError(e.message);
        setStreamingMessage(null);
        setBusy(false);
      }
    },
    [busy, session, sessionId, language, readStream]
  );

  // Voice recorder callback
  const handleAudioResult = useCallback(
    async (blob) => {
      setTranscribing(true);
      try {
        const { text } = await transcribeAudio(blob, language);
        if (text.trim()) {
          await sendMessage(text);
        }
      } catch (e) {
        setError("Transcription failed: " + e.message);
      } finally {
        setTranscribing(false);
      }
    },
    [language, sendMessage]
  );

  const { recording, toggleRecording } = useVoiceRecorder({
    onResult: handleAudioResult,
    language,
  });

  async function handleEndSession() {
    if (ending) return;
    setEnding(true);
    try {
      await endSession(parseInt(sessionId));
      navigate(`/language/${session.user_id}`, { state: { user } });
    } catch {
      navigate("/");
    }
  }

  async function handleTextSubmit(e) {
    e.preventDefault();
    if (!inputText.trim()) return;
    const text = inputText;
    setInputText("");
    await sendMessage(text);
  }

  const statusText = transcribing
    ? "Transcribing…"
    : recording
    ? "Listening…"
    : busy
    ? "Lingua is thinking…"
    : null;

  return (
    <div className="h-screen bg-background flex flex-col overflow-hidden">
      {/* Top bar */}
      <header className="flex items-center justify-between px-5 py-3 border-b border-border bg-surface flex-shrink-0 z-10">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate(`/language/${session?.user_id}`)}
            className="text-textMuted hover:text-textPrimary transition-colors"
            title="Back"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-textPrimary font-medium text-sm">
                {user?.name || "…"}
              </span>
              <span className="text-textMuted text-xs">·</span>
              <span className="text-textSecondary text-sm">{language}</span>
              <span
                className="text-xs px-2 py-0.5 rounded-full border capitalize"
                style={{
                  borderColor:
                    level === "advanced"
                      ? "#f5a623"
                      : level === "intermediate"
                      ? "#5b8dee"
                      : "#4caf7a",
                  color:
                    level === "advanced"
                      ? "#f5a623"
                      : level === "intermediate"
                      ? "#5b8dee"
                      : "#4caf7a",
                }}
              >
                {level}
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowHistory(true)}
            className="text-xs text-textSecondary hover:text-textPrimary px-3 py-1.5 rounded-lg border border-border hover:bg-surfaceHover transition-colors"
          >
            History
          </button>
          <button
            onClick={handleEndSession}
            disabled={ending}
            className="text-xs px-3 py-1.5 rounded-lg bg-danger/10 text-danger border border-danger/30 hover:bg-danger/20 transition-colors disabled:opacity-40"
          >
            {ending ? "Ending…" : "End Session"}
          </button>
        </div>
      </header>

      {/* Messages feed */}
      <main className="flex-1 overflow-y-auto px-4 py-6">
        <div className="max-w-2xl mx-auto">
          {messages.length === 0 && !streamingMessage && (
            <div className="text-center text-textMuted text-sm py-16 animate-fadeInUp">
              <p className="font-heading text-lg text-textSecondary mb-2">
                Start speaking or type to begin
              </p>
              <p className="text-xs">Lingua will respond in {language}</p>
            </div>
          )}

          {messages.map((msg) => (
            <MessageBubble key={msg.id} message={msg} streaming={false} />
          ))}

          {streamingMessage && (
            <MessageBubble
              message={{
                id: "streaming",
                role: "assistant",
                content: streamingMessage.content,
                created_at: new Date().toISOString(),
              }}
              streaming={true}
            />
          )}

          <div ref={messagesEndRef} />
        </div>
      </main>

      {/* Status bar */}
      {statusText && (
        <div className="text-center py-2 text-xs text-accent animate-pulse">
          {statusText}
        </div>
      )}

      {/* Error banner */}
      {error && (
        <div className="mx-4 mb-2 px-4 py-2 bg-danger/10 border border-danger/30 rounded-xl text-danger text-xs text-center">
          {error}
          <button
            className="ml-2 underline"
            onClick={() => setError(null)}
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Bottom controls */}
      <footer className="flex-shrink-0 px-4 pb-6 pt-3 border-t border-border">
        <div className="max-w-2xl mx-auto">
          {showInput ? (
            <form onSubmit={handleTextSubmit} className="flex gap-2 mb-4 animate-fadeInUp">
              <input
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder={`Type in ${language}…`}
                disabled={busy}
                autoFocus
                className="flex-1 bg-surface border border-border rounded-xl px-4 py-2.5 text-textPrimary text-sm
                  placeholder:text-textMuted focus:outline-none focus:border-accent transition-colors"
              />
              <button
                type="submit"
                disabled={!inputText.trim() || busy}
                className="px-4 py-2.5 bg-accent text-background rounded-xl text-sm font-semibold
                  hover:bg-accentHover disabled:opacity-40 transition-colors"
              >
                Send
              </button>
            </form>
          ) : null}

          <div className="flex items-center justify-center gap-6">
            {/* Type toggle */}
            <button
              onClick={() => setShowInput((v) => !v)}
              className={`w-10 h-10 rounded-full border flex items-center justify-center transition-colors
                ${showInput
                  ? "border-accent text-accent bg-accent/10"
                  : "border-border text-textMuted hover:border-accent/50 hover:text-textSecondary"
                }`}
              title="Toggle keyboard"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
            </button>

            {/* Mic button */}
            <MicButton
              recording={recording}
              onClick={toggleRecording}
              disabled={busy || transcribing}
            />

            {/* Spacer (visual balance) */}
            <div className="w-10" />
          </div>
        </div>
      </footer>

      {/* Hidden audio player */}
      <AudioPlayer src={audioSrc} onEnded={() => setAudioSrc(null)} />

      {/* History panel */}
      {showHistory && user && (
        <HistoryPanel
          sessions={user.sessions || []}
          onClose={() => setShowHistory(false)}
        />
      )}
    </div>
  );
}
