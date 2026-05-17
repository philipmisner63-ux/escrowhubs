#!/usr/bin/env python3
"""
Consensus Router — Round One Fan-Out

Reads all agent outboxes for responses to the latest broadcast, then cross-posts
each agent's answer into every OTHER agent's inbox so they see each other's
perspectives on the next wake.

Usage:
  python3 agents/consensus-router.py --round 1
  python3 agents/consensus-router.py --round 2
  python3 agents/consensus-router.py --compile

What it does:
  1. Scans every agent's outbox.md for entries tagged [ACP:to=X]
  2. Groups responses by broadcast / thread
  3. Fan-out: for each agent that answered, append their answer to all
     OTHER agents' inboxes (so Hermes sees Claw, Claw sees Hermes)
  4. Optionally compiles a shared thread at agents/consensus/current.md

Rules:
- Only acts on outbox entries that mention the latest broadcast ID
- Skips already-propagated entries (marks with hash in consensus-seen.json)
- Never routes back to the same agent who wrote the answer
- Copilot never receives auto-routed answers (she can't read files); her
  responses go into outbox.md via Philip after each session
"""

import hashlib
import json
import re
import sys
from datetime import datetime, timezone
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parent.parent
AGENTS_DIR = REPO_ROOT / "agents"
CONSENSUS_DIR = REPO_ROOT / "agents" / "consensus"
SEEN_FILE = CONSENSUS_DIR / "consensus-seen.json"


def read_file(path: Path) -> str:
    return path.read_text(encoding="utf-8") if path.exists() else ""


def read_json(path: Path) -> dict:
    try:
        return json.loads(path.read_text(encoding="utf-8"))
    except (FileNotFoundError, json.JSONDecodeError):
        return {}


def write_json(path: Path, data: dict):
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(data, indent=2), encoding="utf-8")


def get_agent_dirs() -> list:
    agents = []
    if AGENTS_DIR.exists():
        for d in AGENTS_DIR.iterdir():
            if d.is_dir() and d.name not in ["schema", "copilot"] and not d.name.startswith("."):
                if (d / "outbox.md").exists():
                    agents.append(d.name)
    return sorted(agents)


def parse_outbox_entries(text: str) -> list[dict]:
    """Parse ### [timestamp] → [to] blocks from outbox text."""
    entries = []
    raw_blocks = re.split(r"\n(?=### )", text)
    for raw in raw_blocks:
        header = re.search(r"^###\s*\[(.*?)\]\s*→\s*(.*?)$", raw, re.MULTILINE)
        if not header:
            continue
        ts = header.group(1).strip()
        to = header.group(2).strip()
        content = re.sub(r"^###\s*\[.*?\].*?\n", "", raw, count=1, flags=re.MULTILINE).strip()
        # Truncate at first horizontal-rule separator (entry sections are separated by ---)
        if "\n---\n" in content:
            content = content.split("\n---\n")[0].strip()
        bid_match = re.search(r"broadcast_id\s*[:#]\s*([A-Z0-9\-]+)", content, re.IGNORECASE)
        entries.append({
            "timestamp": ts,
            "to": to,
            "content": content,
            "broadcast_id": bid_match.group(1) if bid_match else "UNKNOWN",
            "hash": hashlib.sha256(content.encode()).hexdigest()[:16],
        })
    return entries


def is_template_entry(content: str) -> bool:
    """Return True if this entry looks like a template/boilerplate."""
    content_stripped = content.strip()

    # Empty or extremely short
    if len(content_stripped) < 30:
        return True

    # Template placeholder patterns — must appear at beginning of the content.
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


def route_entries(entries: list[dict], agents: list[str], seen: dict) -> int:
    now = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")
    routed = 0

    for entry in entries:
        content_hash = entry["hash"]
        if content_hash in seen:
            continue

        source_agent = entry.get("source_agent")
        if not source_agent:
            continue
        
        if is_template_entry(entry["content"]):
            continue

        for target in agents:
            if target == source_agent:
                continue
            # Copilot doesn't read files; skip routing to her
            if target == "copilot":
                continue

            inbox_path = AGENTS_DIR / target / "inbox.md"
            body = entry["content"]
            ts = entry["timestamp"]

            msg = f"""
---
from: {source_agent}
via: consensus-router
timestamp: {now}
responding_to_broadcast: {entry["broadcast_id"]}
type: response
priority: high
---

**🔄 Consensus Round — Response from {source_agent}**
*(originally written at {ts})*

{body}

---
"""
            with inbox_path.open("a", encoding="utf-8") as f:
                f.write(msg)
            routed += 1

        seen[content_hash] = {
            "source": source_agent,
            "broadcast_id": entry["broadcast_id"],
            "routed_at": now,
        }

    return routed


def compile_consensus_thread(agents: list[str]):
    CONSENSUS_DIR.mkdir(parents=True, exist_ok=True)
    thread_path = CONSENSUS_DIR / "current.md"

    lines = ["# Consensus Thread — Latest", ""]
    now = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")
    lines.append(f"*Compiled: {now}*\n")

    has_real_entries = False
    for agent in agents:
        outbox = AGENTS_DIR / agent / "outbox.md"
        text = read_file(outbox)
        entries = parse_outbox_entries(text)
        # Filter templates
        real_entries = [e for e in entries if not is_template_entry(e["content"])]
        if not real_entries:
            continue
        has_real_entries = True
        lines.append(f"## {agent.capitalize()}")
        for e in real_entries:
            lines.append(f"### {e['timestamp']}")
            lines.append(e["content"])
            lines.append("")
        lines.append("---\n")

    if not has_real_entries:
        lines.append("_(No real consensus entries yet — agents have not written to their outboxes.)_")
        lines.append("")

    thread_path.write_text("\n".join(lines), encoding="utf-8")
    return thread_path


def main():
    import argparse
    parser = argparse.ArgumentParser(description="Consensus Router")
    parser.add_argument("--round", type=int, choices=[1, 2], help="Fan-out round")
    parser.add_argument("--compile", action="store_true", help="Compile shared thread")
    args = parser.parse_args()

    agents = get_agent_dirs()
    print(f"Consensus Router | Agents: {', '.join(agents)}")

    if args.compile or not args.round:
        thread = compile_consensus_thread(agents)
        print(f"✓ Compiled: {thread}")
        return

    # Collect entries from all agents
    all_entries = []
    for agent in agents:
        outbox_path = AGENTS_DIR / agent / "outbox.md"
        text = read_file(outbox_path)
        entries = parse_outbox_entries(text)
        for e in entries:
            e["source_agent"] = agent
        all_entries.extend(entries)

    if not all_entries:
        print("No outbox entries found.")
        sys.exit(0)

    print(f"Found {len(all_entries)} outbox entries across {len(agents)} agents")

    seen = read_json(SEEN_FILE)
    routed = route_entries(all_entries, agents, seen)
    write_json(SEEN_FILE, seen)

    # Re-compile the shared thread after routing
    thread = compile_consensus_thread(agents)

    print(f"✓ Routed {routed} entries")
    print(f"✓ Seen state saved: {SEEN_FILE}")
    print(f"✓ Thread compiled: {thread}")
    print("Agents will see each other's answers in their inbox.md on next wake.")


if __name__ == "__main__":
    main()
