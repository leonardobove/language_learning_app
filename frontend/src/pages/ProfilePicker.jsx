import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { listUsers, createUser } from "../api.js";

const AVATAR_COLORS = [
  "#f5a623", "#e05555", "#4caf7a", "#5b8dee",
  "#c06cdd", "#e8916a", "#4ecdc4", "#a78bfa",
];

function getInitials(name) {
  return name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export default function ProfilePicker() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState("");
  const [selectedColor, setSelectedColor] = useState(AVATAR_COLORS[0]);
  const [creating, setCreating] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    loadUsers();
  }, []);

  async function loadUsers() {
    try {
      const data = await listUsers();
      setUsers(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  async function handleCreate(e) {
    e.preventDefault();
    if (!newName.trim()) return;
    setCreating(true);
    try {
      await createUser(newName.trim(), selectedColor);
      setNewName("");
      setShowCreate(false);
      await loadUsers();
    } catch (e) {
      console.error(e);
    } finally {
      setCreating(false);
    }
  }

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-6 py-12">
      {/* Logo / title */}
      <div className="mb-12 text-center animate-fadeInUp">
        <h1 className="font-heading text-5xl font-bold text-gradient mb-2">Lingua</h1>
        <p className="text-textSecondary text-sm tracking-widest uppercase">
          AI Language Tutor
        </p>
      </div>

      {loading ? (
        <div className="flex gap-3">
          {[...Array(3)].map((_, i) => (
            <div
              key={i}
              className="w-32 h-40 rounded-2xl bg-surface animate-pulse"
              style={{ animationDelay: `${i * 0.1}s` }}
            />
          ))}
        </div>
      ) : (
        <div className="w-full max-w-3xl animate-fadeInUp" style={{ animationDelay: "0.1s" }}>
          <h2 className="text-textSecondary text-sm mb-6 text-center tracking-wide uppercase">
            Who's learning today?
          </h2>

          <div className="flex flex-wrap gap-4 justify-center">
            {users.map((user) => (
              <button
                key={user.id}
                onClick={() => navigate(`/language/${user.id}`)}
                className="group flex flex-col items-center gap-3 p-5 rounded-2xl border border-border bg-surface
                  hover:border-accent hover:bg-surfaceHover hover:-translate-y-1 hover:glow-accent
                  transition-all duration-200 w-32 cursor-pointer"
              >
                {/* Avatar */}
                <div
                  className="w-16 h-16 rounded-full flex items-center justify-center text-xl font-bold text-background font-heading
                    group-hover:scale-105 transition-transform duration-200"
                  style={{ backgroundColor: user.avatar_color }}
                >
                  {getInitials(user.name)}
                </div>
                <span className="text-textPrimary text-sm font-medium truncate w-full text-center">
                  {user.name}
                </span>
              </button>
            ))}

            {/* Add new user */}
            <button
              onClick={() => setShowCreate(true)}
              className="flex flex-col items-center gap-3 p-5 rounded-2xl border border-dashed border-border
                hover:border-accent hover:bg-surfaceHover hover:-translate-y-1 transition-all duration-200 w-32 cursor-pointer"
            >
              <div className="w-16 h-16 rounded-full border-2 border-dashed border-border flex items-center justify-center">
                <svg className="w-6 h-6 text-textMuted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
              </div>
              <span className="text-textMuted text-sm">Add Profile</span>
            </button>
          </div>
        </div>
      )}

      {/* Create user modal */}
      {showCreate && (
        <div
          className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center px-4"
          onClick={(e) => e.target === e.currentTarget && setShowCreate(false)}
        >
          <div className="bg-surface border border-border rounded-2xl p-6 w-full max-w-sm shadow-2xl animate-fadeInUp">
            <h3 className="font-heading text-xl mb-5 text-textPrimary">Create Profile</h3>
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="text-xs text-textSecondary mb-1.5 block">Name</label>
                <input
                  type="text"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="Your name"
                  maxLength={40}
                  autoFocus
                  className="w-full bg-background border border-border rounded-xl px-4 py-2.5 text-textPrimary
                    placeholder:text-textMuted focus:outline-none focus:border-accent transition-colors"
                />
              </div>

              <div>
                <label className="text-xs text-textSecondary mb-1.5 block">Avatar colour</label>
                <div className="flex gap-2 flex-wrap">
                  {AVATAR_COLORS.map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setSelectedColor(c)}
                      className={`w-8 h-8 rounded-full transition-transform hover:scale-110 ${
                        selectedColor === c ? "ring-2 ring-offset-2 ring-offset-surface ring-white scale-110" : ""
                      }`}
                      style={{ backgroundColor: c }}
                    />
                  ))}
                </div>
              </div>

              {/* Preview */}
              <div className="flex justify-center py-2">
                <div
                  className="w-14 h-14 rounded-full flex items-center justify-center text-lg font-bold text-background font-heading"
                  style={{ backgroundColor: selectedColor }}
                >
                  {newName ? getInitials(newName) : "?"}
                </div>
              </div>

              <div className="flex gap-3 pt-1">
                <button
                  type="button"
                  onClick={() => setShowCreate(false)}
                  className="flex-1 px-4 py-2.5 rounded-xl border border-border text-textSecondary hover:bg-surfaceHover transition-colors text-sm"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!newName.trim() || creating}
                  className="flex-1 px-4 py-2.5 rounded-xl bg-accent text-background font-semibold text-sm
                    hover:bg-accentHover disabled:opacity-40 transition-colors"
                >
                  {creating ? "Creating…" : "Create"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
