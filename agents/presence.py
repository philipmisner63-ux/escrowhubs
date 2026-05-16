#!/usr/bin/env python3
"""
Agent Presence Registry — v0.1

Human-readable status board for Philip.
Shows who's active, what they're working on, and when they were last seen.

Usage:
  python3 agents/presence.py              # full JSON
  python3 agents/presence.py --board      # human-readable board
  python3 agents/presence.py --check      # exit 1 if collisions detected

Agents update their own entry in presence.json at session start.
"""

import json
import sys
from pathlib import Path
from datetime import datetime, timezone

PRESENCE_FILE = Path(__file__).resolve().parent / "presence.json"

def load_presence() -> dict:
    if not PRESENCE_FILE.exists():
        return {}
    try:
        return json.loads(PRESENCE_FILE.read_text(encoding="utf-8"))
    except json.JSONDecodeError:
        return {}

def render_board(data: dict):
    print("═" * 50)
    print("👥 Agent Presence Board")
    print("═" * 50)
    print()
    
    now = datetime.now(timezone.utc)
    
    for agent_id, info in sorted(data.items()):
        status = info.get("status", "unknown")
        working_on = info.get("working_on") or "—"
        since = info.get("since")
        last_seen = info.get("last_seen")
        
        # Status emoji
        emoji = {
            "active": "🔴",
            "idle": "🟢",
            "offline": "⚫",
            "unknown": "❓"
        }.get(status, "❓")
        
        # Format since
        since_str = "—"
        if since:
            try:
                dt = datetime.fromisoformat(since.replace("Z", "+00:00"))
                delta = now - dt
                hours = delta.total_seconds() / 3600
                if hours < 1:
                    since_str = f"{int(delta.total_seconds() / 60)}m ago"
                else:
                    since_str = f"{int(hours)}h ago"
            except:
                since_str = since
        
        print(f"{emoji} {agent_id:10s} → {status:8s} | {working_on}")
        if since_str != "—":
            print(f"           since: {since_str}")
        print()
    
    print("═" * 50)
    print(f"Checked: {now.strftime('%Y-%m-%d %H:%M UTC')}")

def check_collisions(data: dict) -> list:
    """Detect multiple agents working on the same thing."""
    active = {k: v for k, v in data.items() if v.get("status") == "active"}
    tasks = {}
    for agent_id, info in active.items():
        task = info.get("working_on")
        if task:
            tasks.setdefault(task, []).append(agent_id)
    
    collisions = [(task, agents) for task, agents in tasks.items() if len(agents) > 1]
    return collisions

def main():
    data = load_presence()
    
    if len(sys.argv) > 1 and sys.argv[1] == "--board":
        render_board(data)
        return
    
    if len(sys.argv) > 1 and sys.argv[1] == "--check":
        collisions = check_collisions(data)
        if collisions:
            print("❌ COLLISIONS DETECTED:")
            for task, agents in collisions:
                print(f"  {task}: {', '.join(agents)}")
            sys.exit(1)
        else:
            print("✓ No collisions. All agents working on distinct tasks.")
            sys.exit(0)
    
    # Default: print JSON
    print(json.dumps(data, indent=2))

if __name__ == "__main__":
    main()
