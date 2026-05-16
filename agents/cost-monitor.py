#!/usr/bin/env python3
"""
OpenClaw Cost Monitor — Daily Audit + Telegram Alert

Scans all cron jobs, estimates daily cost by model, writes audit log,
and sends Telegram alert if threshold exceeded.

Usage:
  python3 agents/cost-monitor.py --audit      # write daily log, check threshold
  python3 agents/cost-monitor.py --report     # print current estimate

Requirements:
  - TELEG...@REDACTED... token (read from env or .env file)
  - TELEGRAM_CHAT_ID (read from env or .env file)
  - OpenClaw session log directory (default: ~/.openclaw/logs/)

 ENV CONFIG:
  DAILY_COST_THRESHOLD_USD=5.00    # alert if exceeds this
  OPENCLAW_LOG_DIR=~/.openclaw/logs/
  MODEL_COSTS_JSON='{"claude-haiku-4-5": 0.0008, "claude-sonnet-4-6": 0.015}'
"""

import json
import os
import re
import sys
from datetime import datetime, timezone
from pathlib import Path

# ---------- CONFIG ----------
CRONTAB_FILE = Path.home() / ".openclaw" / "crontab.snapshot"
DAILY_LOG_DIR = Path.home() / ".openclaw" / "cost-audit"
DAILY_LOG_DIR.mkdir(parents=True, exist_ok=True)

# Default model costs (input + output per 1K tokens, USD)
# Override via MODEL_COSTS_JSON env var
DEFAULT_MODEL_COSTS = {
    "claude-haiku-4-5": 0.0008,       # ~$0.80 / 1M tokens
    "claude-sonnet-4-6": 0.0150,      # ~$15.00 / 1M tokens
    "claude-opus-4": 0.0750,          # ~$75.00 / 1M tokens
    "gpt-4o": 0.00500,
    "gpt-4o-mini": 0.000150,
}

DAILY_THRESHOLD = float(os.environ.get("DAILY_COST_THRESHOLD_USD", "5.00"))

# ---------- CRON PARSING ----------

def parse_crontab() -> list:
    """Parse current user's crontab into structured entries."""
    import subprocess
    try:
        result = subprocess.run(["crontab", "-l"], capture_output=True, text=True, timeout=10)
        lines = result.stdout.split("\n")
    except FileNotFoundError:
        return []

    entries = []
    for line in lines:
        line = line.strip()
        if not line or line.startswith("#"):
            continue
        # Parse 5-part cron expression
        parts = line.split(None, 5)
        if len(parts) < 6:
            continue
        schedule = " ".join(parts[:5])
        command = parts[5]

        # Detect model references
        model = None
        for m in DEFAULT_MODEL_COSTS:
            if m in command or m.replace("-", "_") in command:
                model = m
                break

        # Estimate invocations per day
        invocations = estimate_daily_invocations(schedule)

        entries.append({
            "schedule": schedule,
            "command": command[:80] + ("..." if len(command) > 80 else ""),
            "model": model,
            "invocations_per_day": invocations,
            "explicit_model": model is not None,
        })
    return entries

def estimate_daily_invocations(schedule: str) -> int:
    """Rough estimate of how many times a cron fires per day."""
    # Very simple heuristic
    if "*/1 " in schedule or schedule.startswith("* "):
        # Every minute
        if "sleep 30" in schedule or "sleep30" in schedule:
            return 2 * 60 * 24  # Every 30s
        return 60 * 24
    if "*/2 " in schedule:
        return 30 * 24
    if "*/5 " in schedule:
        return 12 * 24
    if "*/10 " in schedule:
        return 6 * 24
    if "*/15 " in schedule:
        return 4 * 24
    if "*/30 " in schedule:
        return 2 * 24
    if "0 " in schedule and "* * *" in schedule:
        return 24  # Hourly at :00
    if "0 0" in schedule:
        return 1  # Daily at midnight
    return 1  # Unknown — assume daily

# ---------- COST ESTIMATION ----------

def estimate_daily_cost(entries: list) -> dict:
    """Estimate total daily cost from cron schedule + model costs."""
    model_costs = {**DEFAULT_MODEL_COSTS}
    env_costs = os.environ.get("MODEL_COSTS_JSON")
    if env_costs:
        try:
            model_costs.update(json.loads(env_costs))
        except json.JSONDecodeError:
            pass

    total = 0.0
    per_model = {}
    no_model = []

    for entry in entries:
        model = entry["model"]
        invocations = entry["invocations_per_day"]

        if not model:
            # Assume minimum cost if no model specified (Haiku as conservative default)
            cost = invocations * 0.0008  # Haiku rate
            no_model.append(entry["command"])
        else:
            rate = model_costs.get(model, 0.0008)
            cost = invocations * rate
            per_model[model] = per_model.get(model, 0.0) + cost

        total += cost

    return {
        "total_usd": round(total, 4),
        "per_model": {k: round(v, 4) for k, v in per_model.items()},
        "unlabeled_commands": no_model,
        "threshold_usd": DAILY_THRESHOLD,
        "over_threshold": total > DAILY_THRESHOLD,
    }

# ---------- LOGGING ----------

def write_daily_log(report: dict):
    """Write cost report to daily log file."""
    today = datetime.now(timezone.utc).strftime("%Y-%m-%d")
    log_file = DAILY_LOG_DIR / f"cost-{today}.json"

    log_entry = {
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "report": report,
    }

    # Append to daily log
    if log_file.exists():
        try:
            with log_file.open("r") as f:
                existing = json.load(f)
        except json.JSONDecodeError:
            existing = []
    else:
        existing = []

    existing.append(log_entry)

    with log_file.open("w") as f:
        json.dump(existing, f, indent=2)

    # Also write summary to human-readable log
    summary_file = DAILY_LOG_DIR / f"cost-{today}.log"
    with summary_file.open("a") as f:
        f.write(f"[{log_entry['timestamp']}] Daily cost estimate: ${report['total_usd']}\n")
        if report["over_threshold"]:
            f.write(f"  ⚠️ OVER THRESHOLD (${report['threshold_usd']})\n")
        for model, cost in report["per_model"].items():
            f.write(f"  {model}: ${cost}\n")
        if report["unlabeled_commands"]:
            f.write(f"  ⚠️ Unlabeled commands (model not detected): {len(report['unlabeled_commands'])}\n")
        f.write("\n")

# ---------- TELEGRAM ALERT ----------

def send_telegram_alert(report: dict) -> bool:
    """Send Telegram alert if over threshold. Returns True if sent."""
    token = os.environ.get("TELEGRAM_BOT_TOKEN")
    chat_id = os.environ.get("TELEGRAM_CHAT_ID")

    if not token or not chat_id:
        return False

    if not report["over_threshold"]:
        return False

    message = f"""🚨 OpenClaw Daily Cost Alert

Estimated daily cost: ${report['total_usd']}
Threshold: ${report['threshold_usd']}

Per model:
"""
    for model, cost in report["per_model"].items():
        message += f"  {model}: ${cost}\n"

    if report["unlabeled_commands"]:
        message += f"\n⚠️ {len(report['unlabeled_commands'])} commands without explicit model"

    try:
        import urllib.request
        import urllib.parse
        url = f"https://api.telegram.org/bot{token}/sendMessage"
        data = urllib.parse.urlencode({
            "chat_id": chat_id,
            "text": message,
        }).encode()
        req = urllib.request.Request(url, data=data)
        urllib.request.urlopen(req, timeout=10)
        return True
    except Exception as e:
        print(f"Telegram alert failed: {e}", file=sys.stderr)
        return False

# ---------- MAIN ----------

def main():
    entries = parse_crontab()
    report = estimate_daily_cost(entries)

    print(f"Estimated daily cost: ${report['total_usd']}")
    print(f"Threshold: ${report['threshold_usd']}")
    print()

    if report["per_model"]:
        print("Per model:")
        for model, cost in report["per_model"].items():
            print(f"  {model}: ${cost}")

    if report["unlabeled_commands"]:
        print(f"\n⚠️ Commands without explicit model: {len(report['unlabeled_commands'])}")
        for cmd in report["unlabeled_commands"][:5]:
            print(f"  - {cmd}")

    if report["over_threshold"]:
        print(f"\n⚠️ OVER THRESHOLD by ${round(report['total_usd'] - report['threshold_usd'], 2)}")

    write_daily_log(report)

    if report["over_threshold"]:
        sent = send_telegram_alert(report)
        if sent:
            print("\n✓ Telegram alert sent")
        else:
            print("\n⚠️ Telegram alert NOT sent (check TELEGRAM_BOT_TOKEN and TELEGRAM_CHAT_ID)")

if __name__ == "__main__":
    main()
