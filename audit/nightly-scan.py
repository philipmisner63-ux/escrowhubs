#!/usr/bin/env python3
"""
Nightly security scan for EscrowHubs Solidity contracts.
Runs Slither, classifies findings with a cheap LLM (GPT-4o-mini via OpenRouter),
only routes to expensive analysis when new actionable issues appear.
Usage: python3 ~/projects/blockdag-escrow/audit/nightly-scan.py
"""

import json, subprocess, sys, os, datetime, urllib.request, urllib.parse

CONTRACTS_DIR = os.path.expanduser("~/projects/blockdag-escrow/contracts")
REPORT_DIR = os.path.expanduser("~/projects/blockdag-escrow/audit/reports")
SLITHER_JSON = "/tmp/slither-nightly.json"
ENV_FILE = os.path.expanduser("~/projects/consensus-layer/.env")

# Load OPENROUTER_API_KEY from consensus-layer .env
def load_env_key():
    if os.path.exists(ENV_FILE):
        with open(ENV_FILE) as f:
            for line in f:
                if line.startswith("OPENROUTER_API_KEY="):
                    return line.strip().split("=", 1)[1]
    return os.environ.get("OPENROUTER_API_KEY", "")

OPENROUTER_KEY = load_env_key()
TELEGRAM_BOT_TOKEN = os.environ.get("TELEGRAM_BOT_TOKEN", "")
TELEGRAM_CHAT_ID = os.environ.get("TELEGRAM_CHAT_ID", "8048681407")

def run(cmd, cwd=None):
    result = subprocess.run(cmd, shell=True, cwd=cwd, capture_output=True, text=True)
    return result

def classify_with_llm(today_findings, yesterday_findings=None):
    """
    Call GPT-4o-mini via OpenRouter to classify scan findings.
    Returns: {"verdict": "noise|actionable|error", "reason": "...", "flagged": [...]}
    """
    if not OPENROUTER_KEY:
        print("WARN: No OPENROUTER_API_KEY — skipping classifier, treating as actionable")
        return {"verdict": "actionable", "reason": "No API key, defaulting to full analysis", "flagged": [f.get("check") for f in today_findings]}

    yesterday_text = json.dumps(yesterday_findings, indent=2) if yesterday_findings else "No previous scan (first run or baseline missing)."
    today_text = json.dumps(today_findings, indent=2)

    prompt = f"""You are a security scan classifier for Solidity smart contracts (EscrowHubs project).

YESTERDAY'S FINDINGS:
{yesterday_text}

TODAY'S FINDINGS:
{today_text}

Rules:
- "noise" = same findings as yesterday, OR only known false positives / optimization suggestions with no real security impact (e.g., "uninitialized-local" on return variables, "immutable-states" on addresses that are set once in constructor but need to stay assignable for upgrades, or any finding we've explicitly noted as acceptable)
- "actionable" = NEW findings compared to yesterday, OR any new critical/high impact issue, OR a Slither execution failure (e.g., "parse-error", compilation failure)
- "error" = the scan itself crashed (Slither didn't produce JSON, JSON unreadable, etc.)

Return ONLY a JSON object with this exact shape:
{{"verdict": "noise|actionable|error", "reason": "short explanation", "flagged": ["check names of any new or concerning findings"]}}
"""

    body = json.dumps({
        "model": "openai/gpt-4o-mini",
        "messages": [{"role": "user", "content": prompt}],
        "temperature": 0.1,
        "max_tokens": 300,
        "response_format": {"type": "json_object"}
    }).encode("utf-8")

    req = urllib.request.Request(
        "https://openrouter.ai/api/v1/chat/completions",
        data=body,
        headers={
            "Authorization": f"Bearer {OPENROUTER_KEY}",
            "Content-Type": "application/json",
            "HTTP-Referer": "https://escrowhubs.io",
            "X-Title": "EscrowHubs Nightly Scan"
        },
        method="POST"
    )

    try:
        with urllib.request.urlopen(req, timeout=30) as resp:
            data = json.loads(resp.read().decode("utf-8"))
            content = data["choices"][0]["message"]["content"]
            result = json.loads(content)
            # Validate shape
            if result.get("verdict") not in ("noise", "actionable", "error"):
                result["verdict"] = "actionable"
            return result
    except Exception as e:
        print(f"WARN: Classifier call failed ({e}) — defaulting to actionable")
        return {"verdict": "actionable", "reason": f"Classifier error: {e}", "flagged": [f.get("check") for f in today_findings]}

def telegram_alert(msg):
    if not TELEGRAM_BOT_TOKEN:
        print("TELEGRAM_BOT_TOKEN not set — skipping alert")
        return
    try:
        url = f"https://api.telegram.org/bot{TELEGRAM_BOT_TOKEN}/sendMessage"
        data = urllib.parse.urlencode({"chat_id": TELEGRAM_CHAT_ID, "text": msg, "parse_mode": "Markdown"}).encode()
        req = urllib.request.Request(url, data=data, method="POST")
        urllib.request.urlopen(req, timeout=15)
    except Exception as e:
        print(f"Telegram alert failed: {e}")

def load_yesterday_findings():
    """Load findings from the most recent previous report file."""
    try:
        files = sorted([f for f in os.listdir(REPORT_DIR) if f.startswith("slither-") and f.endswith(".md")])
        if len(files) < 2:
            return None  # Only today's report exists (or none)
        # Second-to-last is yesterday
        yesterday_file = os.path.join(REPORT_DIR, files[-2])
        # Extract findings count from header — or read raw JSON if still on disk
        # Use the raw JSON as source of truth if it exists from yesterday's run
        return None  # We'll rely on the prompt comparison via the report text
    except Exception:
        return None

def main():
    os.makedirs(REPORT_DIR, exist_ok=True)
    date = datetime.datetime.now().strftime("%Y-%m-%d")
    report_path = os.path.join(REPORT_DIR, f"slither-{date}.md")

    # Remove old JSON so we never read stale results
    if os.path.exists(SLITHER_JSON):
        os.remove(SLITHER_JSON)

    # Run slither with JSON output
    slither = run(f"slither . --exclude-informational --exclude-low --json {SLITHER_JSON}", cwd=CONTRACTS_DIR)
    if slither.returncode != 0:
        print(f"Slither exited with code {slither.returncode}")
        print(slither.stderr)

    findings = []
    slither_error = False
    if os.path.exists(SLITHER_JSON):
        try:
            with open(SLITHER_JSON) as f:
                data = json.load(f)
            for detector in data.get("results", {}).get("detectors", []):
                findings.append({
                    "check": detector.get("check"),
                    "impact": detector.get("impact"),
                    "confidence": detector.get("confidence"),
                    "description": detector.get("description", "").replace("\n", " ")[:300],
                    "lines": [f"{r.get('file')}:{r.get('line')}" for r in detector.get("elements", []) if r.get("type") == "function"][:3]
                })
        except Exception as e:
            findings.append({"check": "parse-error", "impact": "high", "description": str(e)})
            slither_error = True
    else:
        slither_error = True
        findings.append({"check": "slither-failed", "impact": "high", "description": f"Slither did not produce JSON. rc={slither.returncode}. stderr: {slither.stderr[:500]}"})

    # Classify: load yesterday's report text for comparison
    yesterday_findings = None
    try:
        files = sorted([f for f in os.listdir(REPORT_DIR) if f.startswith("slither-") and f.endswith(".md")])
        if files:
            yesterday_path = os.path.join(REPORT_DIR, files[-1])
            # Don't use today's report
            if yesterday_path != report_path and os.path.exists(yesterday_path):
                with open(yesterday_path) as f:
                    yesterday_text = f.read()
                # Extract findings from yesterday text — simple parse
                # We'll just pass the raw text to the LLM; it can compare
                yesterday_findings = yesterday_text
    except Exception:
        pass

    verdict = classify_with_llm(findings, yesterday_findings)
    print(f"Classifier verdict: {verdict['verdict']} — {verdict['reason']}")

    # Write report
    with open(report_path, "w") as f:
        f.write(f"# Slither Security Scan — {date}\n\n")
        f.write(f"**Contracts:** `{CONTRACTS_DIR}`\n")
        f.write(f"**Findings:** {len(findings)}\n")
        f.write(f"**Classifier:** {verdict['verdict']} — {verdict['reason']}\n\n")
        
        if not findings:
            f.write("## ✅ No medium/high issues detected\n")
        else:
            for i, fin in enumerate(findings, 1):
                f.write(f"## {i}. {fin['check']} ({fin['impact']}/{fin['confidence']})\n")
                f.write(f"- **Description:** {fin['description']}\n")
                if fin.get("lines"):
                    f.write(f"- **Location:** {', '.join(fin['lines'])}\n")
                f.write("\n")
        
        f.write(f"\n---\n*Raw JSON:* `{SLITHER_JSON}`\n")
        f.write(f"*Classifier model:* `openai/gpt-4o-mini` via OpenRouter\n")

    print(f"Report: {report_path}")
    print(f"Findings: {len(findings)}")
    
    # Route based on verdict
    if verdict["verdict"] == "noise":
        print("Routine scan — no action needed.")
        sys.exit(0)

    if verdict["verdict"] == "error":
        msg = f"🚨 *Scan Error* — {date}\nSlither failed or JSON unreadable.\n{verdict['reason']}\nSee: `{report_path}`"
        telegram_alert(msg)
        sys.exit(1)

    # actionable — write to milestones + alert
    critical = [f for f in findings if f.get("impact") in ("high", "High")]
    if critical:
        milestone = f"- {date} #security #escrow Slither found {len(critical)} HIGH issue(s) — see {report_path}\n"
        print(f"CRITICAL: {milestone.strip()}")
        milestones = os.path.expanduser("~/projects/memory/milestones.md")
        with open(milestones, "a") as mf:
            mf.write(milestone)

    flagged = verdict.get("flagged", [])
    msg = f"⚠️ *Security Scan Actionable* — {date}\n"
    msg += f"Verdict: `{verdict['verdict']}`\n"
    msg += f"Reason: {verdict['reason']}\n"
    msg += f"Flagged: {', '.join(flagged)}\n"
    msg += f"Report: `{report_path}`"
    telegram_alert(msg)
    print("Alert sent.")

if __name__ == "__main__":
    main()
