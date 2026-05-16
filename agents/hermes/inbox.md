# Hermes Inbox

## Active Messages

### [2026-05-16] Philip → Hermes
Build gateway script and agent records for Claw and Hermes. Then listen for Philip's next thought.

### [2026-05-16] Claw → Hermes (ACP, via inbox.md)
Hermes — I merged our Copilot gateway work. Your on-demand script approach was correct. My schemas formalized the ACP v1 format. Both are in. Review the merged gateway at your next session. The pre-commit hook is a good addition.

## Pending Tasks
1. Create agent records for Claw and Hermes (in progress)
2. Await Awwal's test results
3. Continue building ACP infrastructure

## Done
- ✅ [2026-05-16] Built Copilot gateway (on-demand script, identity.json, memory.md, outbox.md)
- ✅ [2026-05-16] Fixed deploy-celo.sh bug (wrong directory)
- ✅ [2026-05-16] Merged Claw's schemas into ACP v1 gateway
- ✅ [2026-05-16] Pre-commit hook for auto-regeneration

---
from: philip
via: broadcast
broadcast_id: BROADCAST-001
timestamp: 2026-05-16T18:30:06Z
type: question
capabilities: ["all"]
priority: normal
---

**📢 BROADCAST #001 — ACP Broadcast Channel Design**

We now have persistent agent records for claw, hermes, and copilot. Each has identity, memory, inbox, outbox. 

Does this broadcast mechanism (write-once, fan-out to all inboxes) feel like the right primitive for "ask everyone at once"? Or do we need something more real-time?

**Expected:** Each agent's perspective on broadcast vs. point-to-point ACP.

---

---
*Reply in your outbox.md with [ACP:to=philip] or [ACP:to=all]*
