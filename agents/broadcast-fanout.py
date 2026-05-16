#!/usr/bin/env python3
"""
ACP Broadcast Fan-Out Script

When Philip wants to ask ALL agents the same question, he writes it to
/agents/broadcast.md. This script distributes the question to every
agent's personal inbox.md.

Usage:
  python3 agents/broadcast-fanout.py
  # or add to pre-commit hook alongside generate-instructions.py

What it does:
  1. Reads /agents/broadcast.md
  2. Parses pending broadcast questions
  3. Checks /agents/broadcast-seen.json to avoid duplicates
  4. Appends unseen broadcasts to each agent's inbox.md
  5. Updates broadcast-seen.json with acknowledgements
"""

import json
import re
import sys
from pathlib import Path
from datetime import datetime, timezone

REPO_ROOT = Path(__file__).resolve().parent.parent
BROADCAST_FILE = REPO_ROOT / "agents" / "broadcast.md"
SEEN_FILE = REPO_ROOT / "agents" / "broadcast-seen.json"
AGENTS_DIR = REPO_ROOT / "agents"

def read_file(path: Path) -> str:
    if not path.exists():
        return ""
    return path.read_text(encoding="utf-8")

def read_json(path: Path) -> dict:
    if not path.exists():
        return {}
    try:
        return json.loads(path.read_text(encoding="utf-8"))
    except json.JSONDecodeError:
        return {}

def get_agent_dirs() -> list:
    """Find all agent directories under /agents/"""
    agents = []
    if AGENTS_DIR.exists():
        for d in AGENTS_DIR.iterdir():
            if d.is_dir() and d.name not in ["schema"] and not d.name.startswith("."):
                if (d / "inbox.md").exists():
                    agents.append(d.name)
    return agents

def parse_broadcasts(text: str) -> list:
    """Parse broadcast.md into individual messages."""
    # Split on ### lines that look like broadcast headers
    pattern = r'###\s*\[.*?\]\s*#(\d+)\s*—\s*\[(.*?)\]\s*\n\*\*From:\*\*\s*(.*?)\n\*\*Topic:\*\*\s*(.*?)\n\n(.*?)(?=###|\Z)'
    matches = re.findall(pattern, text, re.DOTALL)
    broadcasts = []
    for num, status, sender, topic, body in matches:
        broadcasts.append({
            "id": f"BROADCAST-{num}",
            "number": num,
            "status": status.strip(),
            "sender": sender.strip(),
            "topic": topic.strip(),
            "body": body.strip(),
        })
    return broadcasts

def fanout_broadcast(broadcast: dict, agents: list, seen: dict) -> dict:
    """Distribute broadcast to all agents who haven't seen it."""
    bid = broadcast["id"]
    now = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")
    
    # Track new acks
    new_acks = {}
    
    for agent in agents:
        seen_by = seen.get(bid, [])
        if agent in seen_by:
            continue  # Already seen
        
        inbox_path = AGENTS_DIR / agent / "inbox.md"
        
        msg = f"""
---
from: philip
via: broadcast
broadcast_id: {bid}
timestamp: {now}
type: question
capabilities: ["all"]
priority: normal
---

**📢 BROADCAST #{broadcast['number']} — {broadcast['topic']}**

{broadcast['body']}

---
*Reply in your outbox.md with [ACP:to=philip] or [ACP:to=all]*
"""
        # Append to agent's inbox
        with inbox_path.open("a", encoding="utf-8") as f:
            f.write(msg)
        
        # Mark as seen
        if bid not in seen:
            seen[bid] = []
        seen[bid].append(agent)
        new_acks[agent] = bid
        
        print(f"  → {agent}: {bid}")
    
    return new_acks

def write_seen(seen: dict):
    SEEN_FILE.write_text(json.dumps(seen, indent=2), encoding="utf-8")

def main():
    print("ACP Broadcast Fan-Out")
    print("=" * 40)
    
    if not BROADCAST_FILE.exists():
        print("No broadcast file found.")
        sys.exit(0)
    
    text = read_file(BROADCAST_FILE)
    broadcasts = parse_broadcasts(text)
    
    if not broadcasts:
        print("No broadcast messages found.")
        sys.exit(0)
    
    agents = get_agent_dirs()
    print(f"Active agents: {', '.join(agents)}")
    print(f"Broadcasts: {len(broadcasts)}")
    print()
    
    seen = read_json(SEEN_FILE)
    total_routed = 0
    
    for bc in broadcasts:
        if bc["status"] == "CLOSED":
            print(f"⏭ Skipping {bc['id']} (status: CLOSED)")
            continue
        
        print(f"Fanning out {bc['id']} — {bc['topic']}...")
        acks = fanout_broadcast(bc, agents, seen)
        total_routed += len(acks)
    
    write_seen(seen)
    
    print()
    print(f"✓ Total messages routed: {total_routed}")
    print(f"✓ Seen state saved: {SEEN_FILE}")
    
    if total_routed > 0:
        print()
        print("Agents will see broadcasts in their inbox.md on next session.")
        print("For real-time agents, run this script after editing broadcast.md.")

if __name__ == "__main__":
    main()
