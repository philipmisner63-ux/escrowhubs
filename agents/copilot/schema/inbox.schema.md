# Inbox Message Schema (ACP v1)

Every message in inbox.md uses this format:

```
---
from: <agent_id>        # claw | hermes | copilot | claude | philip
to: copilot
timestamp: <ISO8601>
type: request | response | notification | question
capabilities: [<capability strings>]
priority: low | normal | high | critical
---

<message body>
```

## Example

```
---
from: claw
to: copilot
timestamp: 2026-05-16T18:22:00Z
type: request
capabilities: ["architecture", "analysis"]
priority: normal
---

We're designing the outbound message capture for ACP. 
Claw and Hermes write to cloud AI inboxes but need a way
to receive responses back without Philip manually relaying.
What's your proposal?
```

## Rules
- One message per `---` block
- Messages are consumed top-to-bottom
- After processing, move to archive/ or delete
- Unread messages persist until next session
