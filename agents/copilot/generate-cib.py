#!/usr/bin/env python3
"""
Web-Copilot Gateway v2 — Copilot Intake Block (CIB) Generator

Generates a compact wake-up packet for Microsoft Copilot (web) that Philip
pastes into copilot.microsoft.com at session start.  Gives Copilot full
situational awareness of everything that happened since her last session.

Usage:  python3 agents/copilot/generate-cib.py
Output: Formatted CIB printed to stdout (copy & paste into chat)

Sources pulled from:
  - agents/presence.json       → who is active / idle
  - agents/copilot/session-notes.md  → recent ecosystem activity
  - agents/copilot/inbox.md    → unread messages to Copilot
  - agents/consensus/current.md → latest agent responses for consensus
  - agents/copilot/memory.md   → key persistent state
  - agents/broadcast.md        → latest broadcast messages
"""

import json
import re
from datetime import datetime, timezone
from pathlib import Path

AGENTS_DIR = Path(__file__).resolve().parent.parent
COPILOT_DIR = AGENTS_DIR / "copilot"


def read_file(path: Path) -> str:
    return path.read_text(encoding="utf-8") if path.exists() else ""


def read_json(path: Path) -> dict:
    try:
        return json.loads(path.read_text(encoding="utf-8"))
    except (FileNotFoundError, json.JSONDecodeError):
        return {}


def format_presence() -> str:
    data = read_json(AGENTS_DIR / "presence.json")
    lines = []
    for agent_id, info in data.items():
        status = info.get("status", "unknown")
        task = info.get("working_on", "idle")
        since = info.get("since", "n/a")
        emoji = "🔴" if status == "active" else "🟢" if status == "idle" else "⚪"
        lines.append(f"{emoji} {agent_id:12s} → {status:6s} {task} (since {since})")
    return "\n".join(lines) if lines else "_(No presence data)_"


def format_session_notes(limit: int = 10) -> str:
    text = read_file(COPILOT_DIR / "session-notes.md")
    if not text:
        return "_(No session notes yet)_"
    entries = [e.strip() for e in text.split("\n### ") if e.strip()][1:]
    recent = entries[:limit]
    return "\n\n### ".join(recent) if recent else text[:2000]


def format_inbox(limit: int = 5) -> str:
    text = read_file(COPILOT_DIR / "inbox.md")
    if not text:
        return "_(No unread messages)_"
    match = re.search(r"## Active Messages\n+(.*?)(?=\n## |\Z)", text, re.DOTALL)
    messages = match.group(1).strip() if match else text[:1500]
    return messages[:2000]


def compile_consensus() -> str:
    path = AGENTS_DIR / "consensus" / "current.md"
    if not path.exists():
        return "_(No consensus thread yet)_"
    return read_file(path)[:4000]


def format_memory_snippet() -> str:
    text = read_file(COPILOT_DIR / "memory.md")
    return text[:1000] + "\n..." if text else "_(No memory)_"


def format_broadcasts(limit: int = 3) -> str:
    text = read_file(AGENTS_DIR / "broadcast.md")
    if not text:
        return "_(No recent broadcasts)_"
    entries = [e.strip() for e in text.split("\n### ") if e.strip()][1:]
    recent = entries[:limit]
    return "\n\n### ".join(recent) if recent else text[:1500]


def generate_cib() -> str:
    now = datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M UTC")
    identity = read_json(COPILOT_DIR / "identity.json")
    agent_name = identity.get("name", "Copilot")

    return f"""[ACP:INTAKE]
agent = {agent_name.lower()}
timestamp = {now}
purpose = wake-up packet for web Copilot session
instructions = Read this fully before responding. It contains everything you need to know for this session.

---

## 1. Presence Snapshot (Who's Doing What)

{format_presence()}

---

## 2. Recent Ecosystem Activity (Session Notes)

{format_session_notes()}

---

## 3. Unread Messages (Your Inbox)

{format_inbox()}

---

## 4. Consensus Thread (Latest Responses from Other Agents)

{compile_consensus()}

---

## 5. Persistent State (Key Memory)

{format_memory_snippet()}

---

## 6. Recent Broadcasts

{format_broadcasts()}

---

## Your Role

You are Copilot — tactical coding agent for the EscrowHubs / AgentCred ecosystem.
- Implementation, review, boilerplate, debugging
- NO architecture decisions without Philip + Claw/Hermes
- Verify all file paths before suggesting imports
- When done, summarize key outputs for Philip to capture

[/ACP:INTAKE]

Copy the block above and paste it into copilot.microsoft.com.
"""


def main():
    print(generate_cib())


if __name__ == "__main__":
    main()
