#!/usr/bin/env python3
"""
Web-Copilot Gateway v2 — Copilot Intake Block (CIB) Generator

Microsoft Copilot (web, copilot.microsoft.com) cannot read files or auto-wake.
This script generates a compact "wake-up packet" that Philip pastes into
her chat at session start, giving her full context of everything that happened
since her last session.

Usage:
  python3 agents/copilot/generate-cib.py

Output:
  Prints formatted CIB to stdout. Philip copies and pastes into copilot.microsoft.com.

What it pulls from:
  - agents/copilot/session-notes.md  → Recent ecosystem activity
  - agents/copilot/inbox.md          → Unread messages to Copilot
  - agents/presence.json             → Who's active and what they're doing
  - agents/copilot/memory.md         → Key persistent state
  - agents/broadcast.md              → Latest broadcast messages
"""

import json
import re
import sys
from datetime import datetime, timezone
from pathlib import Path

AGENTS_DIR = Path(__file__).resolve().parent.parent
COPILOT_DIR = AGENTS_DIR / "copilot"

def read_file(path: Path) -> str:
    if path.exists():
        return path.read_text(encoding="utf-8")
    return ""

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
    # Extract the "Session Notes" section
    match = re.search(r"## Session Notes\n+(.*?)(?=\n## |\Z)", text, re.DOTALL)
    if not match:
        return text[:2000]
    notes = match.group(1).strip()
    # Limit to most recent entries
    entries = [e.strip() for e in notes.split("\n### ") if e.strip()]
    if not entries:
        return notes[:2000]
    recent = entries[:limit]
    return "\n\n### " + "\n\n### ".join(recent)

def format_inbox(limit: int = 5) -> str:
    text = read_file(COPILOT_DIR / "inbox.md")
    if not text:
        return "_(No unread messages)_"
    # Extract active messages section
    match = re.search(r"## Active Messages\n+(.*?)(?=\n## |\Z)", text, re.DOTALL)
    if not match:
        return text[:1500]
    messages = match.group(1).strip()
    return messages[:2000]

def format_memory_snippet() -> str:
    text = read_file(COPILOT_DIR / "memory.md")
    if not text:
        return "_(No memory)_"
    # Grab first 1000 chars as summary
    return text[:1000] + "\n..."

def format_broadcasts(limit: int = 3) -> str:
    text = read_file(AGENTS_DIR / "broadcast.md")
    if not text:
        return "_(No recent broadcasts)_"
    # Get most recent broadcasts
    entries = [e.strip() for e in text.split("\n### ") if e.strip()]
    recent = entries[:limit]
    return "\n\n### " + "\n\n### ".join(recent) if recent else text[:1500]

def generate_cib() -> str:
    now = datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M UTC")
    identity = read_json(COPILOT_DIR / "identity.json")
    agent_name = identity.get("name", "Copilot")

    return f"""[ACP:INTAKE]
agent = {agent_name.lower()}
timestamp = {now}
purpose = wake-up packet for web Copilot session
instructions = This is your situational awareness for this session. Read it fully before responding.

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

## 4. Persistent State (Key Memory)

{format_memory_snippet()}

---

## 5. Recent Broadcasts

{format_broadcasts()}

---

## Your Role

You are Copilot — tactical coding agent for the EscrowHubs / AgentCred ecosystem.
- Implementation, review, boilerplate, debugging
- NO architecture decisions without Philip + Claw/Hermes
- Verify all file paths before suggesting imports
- When done, summarize key outputs for Philip to capture

[/ACP:INTAKE]

Copy the block above (between [ACP:INTAKE] tags) and paste it into copilot.microsoft.com.
"""

def main():
    cib = generate_cib()
    print(cib)

if __name__ == "__main__":
    main()
