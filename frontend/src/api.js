const BASE = "/api";

async function request(path, options = {}) {
  const res = await fetch(`${BASE}${path}`, options);
  if (!res.ok) {
    const body = await res.text();
    throw new Error(body || `HTTP ${res.status}`);
  }
  return res.json();
}

// ── Users ─────────────────────────────────────────────────────────────────────

export const listUsers = () => request("/users");

export const createUser = (name, avatarColor) =>
  request("/users", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name, avatar_color: avatarColor }),
  });

export const getUser = (userId) => request(`/users/${userId}`);

// ── Sessions ──────────────────────────────────────────────────────────────────

export const startSession = (userId, language, level) =>
  request("/sessions", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ user_id: userId, language, level }),
  });

export const getSession = (sessionId) => request(`/sessions/${sessionId}`);

export const endSession = (sessionId) =>
  request(`/sessions/${sessionId}/end`, { method: "POST" });

// ── Chat ──────────────────────────────────────────────────────────────────────

/**
 * Returns a raw Response for SSE streaming.
 * Caller is responsible for reading the ReadableStream.
 */
export async function chatStream(sessionId, message, userId, language) {
  const res = await fetch(`${BASE}/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      session_id: sessionId,
      message,
      user_id: userId,
      language,
    }),
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(body || `HTTP ${res.status}`);
  }
  return res;
}

// ── Transcription ─────────────────────────────────────────────────────────────

export async function transcribeAudio(audioBlob, language = "English") {
  const form = new FormData();
  form.append("audio", audioBlob, "recording.webm");
  form.append("language", language);
  const res = await fetch(`${BASE}/transcribe`, {
    method: "POST",
    body: form,
  });
  if (!res.ok) {
    throw new Error(`Transcription failed: HTTP ${res.status}`);
  }
  return res.json();
}

// ── TTS ───────────────────────────────────────────────────────────────────────

export async function fetchTTS(text, language) {
  const res = await fetch(`${BASE}/tts`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text, language }),
  });
  if (!res.ok) {
    throw new Error(`TTS failed: HTTP ${res.status}`);
  }
  const blob = await res.blob();
  return URL.createObjectURL(blob);
}

// ── Models ────────────────────────────────────────────────────────────────────

export const listModels = () => request("/models");

export const checkHealth = () =>
  fetch("/health").then((r) => r.json());
