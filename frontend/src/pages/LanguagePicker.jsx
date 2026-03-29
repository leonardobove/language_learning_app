import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { getUser, startSession } from "../api.js";

const LANGUAGES = [
  { name: "Spanish", flag: "🇪🇸", native: "Español" },
  { name: "French", flag: "🇫🇷", native: "Français" },
  { name: "German", flag: "🇩🇪", native: "Deutsch" },
  { name: "Dutch", flag: "🇳🇱", native: "Nederlands" },
];

const LEVELS = [
  { id: "beginner", label: "Beginner", desc: "Just starting out" },
  { id: "intermediate", label: "Intermediate", desc: "Know the basics" },
  { id: "advanced", label: "Advanced", desc: "Fluency practice" },
];

function getInitials(name) {
  return name.split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2);
}

export default function LanguagePicker() {
  const { userId } = useParams();
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [selectedLanguage, setSelectedLanguage] = useState(null);
  const [selectedLevel, setSelectedLevel] = useState("beginner");
  const [starting, setStarting] = useState(false);

  useEffect(() => {
    getUser(userId)
      .then(setUser)
      .catch(() => navigate("/"));
  }, [userId]);

  // Override level if user has memory for this language
  useEffect(() => {
    if (!user || !selectedLanguage) return;
    const mem = (user.memory || []).find((m) => m.language === selectedLanguage.name);
    // Keep selected level; memory is injected server-side
  }, [selectedLanguage, user]);

  async function handleStart() {
    if (!selectedLanguage) return;
    setStarting(true);
    try {
      const session = await startSession(
        parseInt(userId),
        selectedLanguage.name,
        selectedLevel
      );
      navigate(`/session/${session.id}`, {
        state: { user, language: selectedLanguage, level: selectedLevel },
      });
    } catch (e) {
      console.error(e);
      setStarting(false);
    }
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-6 py-12">
      {/* Back */}
      <button
        onClick={() => navigate("/")}
        className="absolute top-5 left-5 flex items-center gap-1.5 text-textSecondary hover:text-textPrimary transition-colors text-sm"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        Profiles
      </button>

      {/* User avatar */}
      <div className="mb-8 flex flex-col items-center animate-fadeInUp">
        <div
          className="w-14 h-14 rounded-full flex items-center justify-center text-lg font-bold text-background font-heading mb-3"
          style={{ backgroundColor: user.avatar_color }}
        >
          {getInitials(user.name)}
        </div>
        <p className="text-textSecondary text-sm">
          Hi, <span className="text-textPrimary font-medium">{user.name}</span>! What are we practising today?
        </p>
      </div>

      {/* Language cards */}
      <div className="w-full max-w-lg animate-fadeInUp" style={{ animationDelay: "0.1s" }}>
        <h2 className="text-textSecondary text-xs mb-4 text-center tracking-widest uppercase">
          Choose a language
        </h2>
        <div className="grid grid-cols-2 gap-3 mb-8">
          {LANGUAGES.map((lang) => {
            const hasMemory = (user.memory || []).some((m) => m.language === lang.name);
            const isSelected = selectedLanguage?.name === lang.name;
            return (
              <button
                key={lang.name}
                onClick={() => setSelectedLanguage(lang)}
                className={`
                  relative flex flex-col items-center justify-center gap-2 p-6 rounded-2xl border transition-all duration-200
                  ${isSelected
                    ? "border-accent bg-surfaceHover glow-accent scale-[1.02]"
                    : "border-border bg-surface hover:border-accent/50 hover:bg-surfaceHover hover:-translate-y-0.5"
                  }
                `}
              >
                {hasMemory && (
                  <span className="absolute top-2.5 right-2.5 w-2 h-2 rounded-full bg-accent" title="Has previous sessions" />
                )}
                <span className="text-4xl">{lang.flag}</span>
                <span className="text-textPrimary font-semibold">{lang.name}</span>
                <span className="text-textMuted text-xs">{lang.native}</span>
              </button>
            );
          })}
        </div>

        {/* Level selector */}
        {selectedLanguage && (
          <div className="animate-fadeInUp">
            <h2 className="text-textSecondary text-xs mb-3 text-center tracking-widest uppercase">
              Your level
            </h2>
            <div className="flex gap-2 mb-8">
              {LEVELS.map((lvl) => (
                <button
                  key={lvl.id}
                  onClick={() => setSelectedLevel(lvl.id)}
                  className={`
                    flex-1 py-3 px-2 rounded-xl border text-center transition-all duration-150 text-sm
                    ${selectedLevel === lvl.id
                      ? "border-accent bg-surfaceHover text-textPrimary"
                      : "border-border text-textSecondary hover:border-accent/40 hover:text-textPrimary"
                    }
                  `}
                >
                  <div className="font-medium">{lvl.label}</div>
                  <div className="text-xs text-textMuted mt-0.5">{lvl.desc}</div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Start button */}
        <button
          onClick={handleStart}
          disabled={!selectedLanguage || starting}
          className="w-full py-3.5 rounded-2xl bg-accent text-background font-semibold text-base
            hover:bg-accentHover disabled:opacity-30 transition-all duration-200
            hover:glow-accent active:scale-[0.98]"
        >
          {starting ? "Starting…" : selectedLanguage ? `Start ${selectedLanguage.name} →` : "Select a language"}
        </button>
      </div>
    </div>
  );
}
