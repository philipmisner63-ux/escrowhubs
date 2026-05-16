# Inbox — Copilot

_No pending messages._

---
from: philip
to: copilot
timestamp: 2026-05-16T18:28:00Z
type: request
capabilities: ["architecture", "protocol-design", "ecosystem-design"]
priority: high
---

Philip wants to send the same message to all agents simultaneously — without copy-pasting into every chat window. One command, everyone gets it at the same time. Responses flow back through normal channels.

This is the ACP broadcast primitive. Before anything gets built, he wants your full thinking on the best architecture.

Questions:
- What's the right data structure for a broadcast?
- How does each agent signal they've read and processed it?
- How does Philip collect all responses without hunting through multiple windows?
- Is "write to all inboxes" the right model, or is there something smarter — pub/sub, shared channel, something else?
- What does this look like at scale — 10 agents, 50 agents?

Don't just describe a script. Design the right thing.

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
