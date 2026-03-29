import { useEffect, useState } from "react";
import { getSession } from "../api.js";

export default function HistoryPanel({ sessions, onClose }) {
  const [expandedId, setExpandedId] = useState(null);
  const [sessionData, setSessionData] = useState({});
  const [loading, setLoading] = useState(false);

  async function loadSession(id) {
    if (sessionData[id]) {
      setExpandedId(expandedId === id ? null : id);
      return;
    }
    setLoading(true);
    try {
      const data = await getSession(id);
      setSessionData((prev) => ({ ...prev, [id]: data }));
      setExpandedId(id);
    } catch (e) {
      console.error("Failed to load session", e);
    } finally {
      setLoading(false);
    }
  }

  const formatDate = (iso) => {
    if (!iso) return "";
    return new Date(iso).toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div
      className="fixed inset-0 z-40 flex"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />

      {/* Panel */}
      <div className="relative ml-auto w-full max-w-sm h-full bg-surface border-l border-border shadow-2xl overflow-y-auto flex flex-col animate-fadeInRight">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border sticky top-0 bg-surface z-10">
          <h2 className="font-heading text-lg text-textPrimary">Session History</h2>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-textSecondary hover:text-textPrimary hover:bg-surfaceHover transition-colors"
            aria-label="Close history"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Sessions list */}
        <div className="flex-1 px-4 py-3 space-y-2">
          {sessions.length === 0 && (
            <p className="text-textMuted text-sm text-center py-8">No past sessions yet.</p>
          )}

          {sessions.map((session) => (
            <div key={session.id} className="rounded-xl border border-border overflow-hidden">
              <button
                onClick={() => loadSession(session.id)}
                className="w-full px-4 py-3 flex items-center justify-between hover:bg-surfaceHover transition-colors text-left"
              >
                <div>
                  <div className="text-sm font-medium text-textPrimary">{session.language}</div>
                  <div className="text-xs text-textMuted mt-0.5">{formatDate(session.started_at)}</div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs px-2 py-0.5 rounded-full bg-surfaceHover border border-border text-textSecondary capitalize">
                    {session.level}
                  </span>
                  <svg
                    className={`w-4 h-4 text-textMuted transition-transform ${
                      expandedId === session.id ? "rotate-180" : ""
                    }`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </button>

              {expandedId === session.id && sessionData[session.id] && (
                <div className="border-t border-border px-4 py-3 space-y-2 max-h-64 overflow-y-auto bg-background">
                  {(sessionData[session.id].messages || []).map((msg) => (
                    <div
                      key={msg.id}
                      className={`text-xs ${
                        msg.role === "user" ? "text-right" : "text-left"
                      }`}
                    >
                      <span
                        className={`inline-block px-3 py-1.5 rounded-xl max-w-[85%] ${
                          msg.role === "user"
                            ? "bg-surfaceHover text-textSecondary"
                            : "bg-surface text-textPrimary border border-border"
                        }`}
                      >
                        {msg.content}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
