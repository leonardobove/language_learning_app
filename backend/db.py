import sqlite3
import json
from datetime import datetime
from backend.config import DB_PATH


def get_connection():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA journal_mode=WAL")
    conn.execute("PRAGMA foreign_keys=ON")
    return conn


def init_db():
    conn = get_connection()
    c = conn.cursor()

    c.execute("""
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            avatar_color TEXT NOT NULL DEFAULT '#f5a623',
            created_at TEXT NOT NULL DEFAULT (datetime('now'))
        )
    """)

    c.execute("""
        CREATE TABLE IF NOT EXISTS sessions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL REFERENCES users(id),
            language TEXT NOT NULL,
            level TEXT NOT NULL DEFAULT 'beginner',
            started_at TEXT NOT NULL DEFAULT (datetime('now')),
            ended_at TEXT
        )
    """)

    c.execute("""
        CREATE TABLE IF NOT EXISTS messages (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            session_id INTEGER NOT NULL REFERENCES sessions(id),
            role TEXT NOT NULL,
            content TEXT NOT NULL,
            created_at TEXT NOT NULL DEFAULT (datetime('now'))
        )
    """)

    c.execute("""
        CREATE TABLE IF NOT EXISTS memory (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL REFERENCES users(id),
            language TEXT NOT NULL,
            summary TEXT NOT NULL,
            updated_at TEXT NOT NULL DEFAULT (datetime('now')),
            UNIQUE(user_id, language)
        )
    """)

    conn.commit()
    conn.close()


# --- Users ---

def create_user(name: str, avatar_color: str = "#f5a623") -> dict:
    conn = get_connection()
    c = conn.cursor()
    c.execute(
        "INSERT INTO users (name, avatar_color) VALUES (?, ?)",
        (name, avatar_color),
    )
    conn.commit()
    user_id = c.lastrowid
    conn.close()
    return get_user(user_id)


def get_user(user_id: int) -> dict | None:
    conn = get_connection()
    c = conn.cursor()
    c.execute("SELECT * FROM users WHERE id = ?", (user_id,))
    row = c.fetchone()
    conn.close()
    return dict(row) if row else None


def list_users() -> list[dict]:
    conn = get_connection()
    c = conn.cursor()
    c.execute("SELECT * FROM users ORDER BY name")
    rows = c.fetchall()
    conn.close()
    return [dict(r) for r in rows]


def get_user_memory(user_id: int) -> list[dict]:
    conn = get_connection()
    c = conn.cursor()
    c.execute("SELECT * FROM memory WHERE user_id = ?", (user_id,))
    rows = c.fetchall()
    conn.close()
    return [dict(r) for r in rows]


# --- Sessions ---

def create_session(user_id: int, language: str, level: str = "beginner") -> dict:
    conn = get_connection()
    c = conn.cursor()
    c.execute(
        "INSERT INTO sessions (user_id, language, level) VALUES (?, ?, ?)",
        (user_id, language, level),
    )
    conn.commit()
    session_id = c.lastrowid
    conn.close()
    return get_session(session_id)


def get_session(session_id: int) -> dict | None:
    conn = get_connection()
    c = conn.cursor()
    c.execute("SELECT * FROM sessions WHERE id = ?", (session_id,))
    row = c.fetchone()
    conn.close()
    return dict(row) if row else None


def end_session(session_id: int):
    conn = get_connection()
    conn.execute(
        "UPDATE sessions SET ended_at = datetime('now') WHERE id = ?",
        (session_id,),
    )
    conn.commit()
    conn.close()


def get_sessions_for_user(user_id: int) -> list[dict]:
    conn = get_connection()
    c = conn.cursor()
    c.execute(
        "SELECT * FROM sessions WHERE user_id = ? ORDER BY started_at DESC",
        (user_id,),
    )
    rows = c.fetchall()
    conn.close()
    return [dict(r) for r in rows]


# --- Messages ---

def add_message(session_id: int, role: str, content: str) -> dict:
    conn = get_connection()
    c = conn.cursor()
    c.execute(
        "INSERT INTO messages (session_id, role, content) VALUES (?, ?, ?)",
        (session_id, role, content),
    )
    conn.commit()
    msg_id = c.lastrowid
    c.execute("SELECT * FROM messages WHERE id = ?", (msg_id,))
    row = c.fetchone()
    conn.close()
    return dict(row)


def get_messages(session_id: int) -> list[dict]:
    conn = get_connection()
    c = conn.cursor()
    c.execute(
        "SELECT * FROM messages WHERE session_id = ? ORDER BY created_at",
        (session_id,),
    )
    rows = c.fetchall()
    conn.close()
    return [dict(r) for r in rows]


# --- Memory ---

def upsert_memory(user_id: int, language: str, summary: str):
    conn = get_connection()
    conn.execute(
        """
        INSERT INTO memory (user_id, language, summary, updated_at)
        VALUES (?, ?, ?, datetime('now'))
        ON CONFLICT(user_id, language) DO UPDATE SET
            summary = excluded.summary,
            updated_at = excluded.updated_at
        """,
        (user_id, language, summary),
    )
    conn.commit()
    conn.close()


def get_memory(user_id: int, language: str) -> str | None:
    conn = get_connection()
    c = conn.cursor()
    c.execute(
        "SELECT summary FROM memory WHERE user_id = ? AND language = ?",
        (user_id, language),
    )
    row = c.fetchone()
    conn.close()
    return row["summary"] if row else None
