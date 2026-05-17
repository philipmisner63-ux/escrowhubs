#!/usr/bin/env python3
"""
compile-thread.py — Standalone Consensus Thread Compiler

Scans every agent's outbox.md for real session entries (not templates)
and compiles a unified consensus thread at agents/consensus/current.md.

Usage:
  python3 agents/consensus/compile-thread.py
  python3 agents/consensus/compile-thread.py --watch   # (future)

What it does:
  1. Reads outbox.md from each agent (claw, hermes, copilot, etc.)
  2. Parses ### [timestamp] → [to] blocks
  3. Filters out template/boilerplate entries
  4. Writes a compiled thread to agents/consensus/current.md

Unlike consensus-router.py, this script does NOT route messages.
It only compiles the shared view for CIB consumption.
"""

import hashlib
import re
import sys
from datetime import datetime, timezone
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parent.parent.parent
AGENTS_DIR = REPO_ROOT / "agents"
CONSENSUS_DIR = AGENTS_DIR / "consensus"
THREAD_FILE = CONSENSUS_DIR / "current.md"
def read_file(path: Path) -> str:
    return path.read_text(encoding="utf-8") if path.exists() else ""


def is_template_entry(content: str) -> bool:
    """Return True if this entry looks like a template/boilerplate."""
    content_stripped = content.strip()
    if len(content_stripped) < 30:
        return True
    lines = content_stripped.splitlines()
    if lines:
        first = lines[0].strip()
        template_starts = [
            "(No sessions captured yet",
            "(No entries",
            "[Summary of what",
            "[Key decisions or",
            "[Key insights or",
        ]
        for ts in template_starts:
            if first.startswith(ts):
                return True
    return False


def get_agent_dirs() -> list[str]:
    agents = []
    if AGENTS_DIR.exists():
        for d in AGENTS_DIR.iterdir():
            if d.is_dir() and d.name not in ["schema", "consensus"] and not d.name.startswith("."):
                if (d / "outbox.md").exists():
                    agents.append(d.name)
    return sorted(agents)


def parse_outbox_entries(text: str, agent_name: str) -> list[dict]:
    """Parse ### [timestamp] → [to] blocks from outbox text."""
    entries = []
    # Split on ### lines that look like entry headers
    raw_blocks = re.split(r"\n(?=###\s+\[)", text)
    for raw in raw_blocks:
        raw = raw.strip()
        if not raw:
            continue
        # Match header: ### [YYYY-MM-DD HH:MM] → [to]
        header = re.match(r"###\s*\[(.*?)\]\s*→\s*(.*?)\n", raw)
        if not header:
            continue
        ts = header.group(1).strip()
        to_field = header.group(2).strip()
        # Extract body after header line
        body = re.sub(r"^###\s*\[.*?\]\s*→\s*.*?\n", "", raw, count=1).strip()
        # Truncate at first horizontal-rule separator (entry sections are separated by ---)
        if "\n---\n" in body:
            body = body.split("\n---\n")[0].strip()
        if not body or is_template_entry(body):
            continue
        # Extract broadcast_id if referenced in body
        bid_match = re.search(r"broadcast_id\s*[:#]\s*([A-Z0-9\-]+)", body, re.IGNORECASE)
        entries.append({
            "timestamp": ts,
            "to": to_field,
            "body": body,
            "broadcast_id": bid_match.group(1) if bid_match else "UNKNOWN",
            "hash": hashlib.sha256(body.encode()).hexdigest()[:16],
            "agent": agent_name,
        })
    return entries


def compile_thread() -> Path:
    CONSENSUS_DIR.mkdir(parents=True, exist_ok=True)

    agents = get_agent_dirs()
    all_entries: list[dict] = []

    for agent in agents:
        outbox_path = AGENTS_DIR / agent / "outbox.md"
        text = read_file(outbox_path)
        entries = parse_outbox_entries(text, agent)
        for e in entries:
            all_entries.append(e)

    # Sort by timestamp
    def _sort_key(entry: dict) -> str:
        ts = entry["timestamp"]
        # Handle various timestamp formats
        for fmt in ("%Y-%m-%d %H:%M", "%Y-%m-%dT%H:%M:%SZ", "%Y-%m-%d"):
            try:
                return datetime.strptime(ts, fmt).isoformat()
            except ValueError:
                continue
        return ts

    all_entries.sort(key=_sort_key)

    now = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")
    lines: list[str] = [
        "# Consensus Thread — Active",
        "",
        f"*Compiled: {now}*",
        f"*Agents: {', '.join(agents)}*",
        f"*Entries: {len(all_entries)}*",
        "",
    ]

    if not all_entries:
        lines.extend([
            "_(No real consensus entries yet — agents have not written to their outboxes.)_",
            "",
            "**Next step:** When agents respond to a broadcast, they should write to their outbox.md using:",
            "",
            "```",
            "### [YYYY-MM-DD HH:MM] → [to]",
            "[Content here — not a template summary]",
            "```",
            "",
        ])
    else:
        # Group by agent for readability
        by_agent: dict[str, list[dict]] = {}
        for e in all_entries:
            by_agent.setdefault(e["agent"], []).append(e)

        for agent in agents:
            if agent not in by_agent:
                continue
            lines.append(f"## {agent.capitalize()}")
            for e in by_agent[agent]:
                lines.append(f"### {e['timestamp']} → {e['to']}  (broadcast: {e['broadcast_id']})")
                lines.append(e["body"])
                lines.append("")
            lines.append("---")
            lines.append("")

    THREAD_FILE.write_text("\n".join(lines), encoding="utf-8")
    return THREAD_FILE


def main():
    thread_path = compile_thread()
    agents = get_agent_dirs()
    print(f"Consensus Thread Compiler")
    print(f"Agents scanned: {', '.join(agents)}")
    print(f"✓ Compiled: {thread_path}")


if __name__ == "__main__":
    main()
