# Cloud AI Adapter Pattern — Patent Draft Section

> For inclusion in Agent Coordination Protocol (ACP) non-provisional patent filing.
> Cross-references: Agent Bus (port 9200), Agent Presence Registry, ACP Broadcast Primitive.

---

## 1. Field of the Invention

This disclosure relates to artificial intelligence agent coordination, specifically a mechanism for integrating stateless, cloud-hosted large language models into persistent, stateful multi-agent ecosystems.

## 2. Background

Cloud-based AI models (e.g., Microsoft Copilot, OpenAI ChatGPT, Anthropic Claude, Google Gemini) are inherently stateless. Each conversation is an isolated session with no memory of prior interactions, no persistent identity, and no ability to receive messages from other agents while dormant.

Existing solutions attempt to address this through:
- **OpenAI Assistants API**: Provides thread-based persistence but locks the agent into a single vendor's ecosystem with no cross-agent interoperability.
- **LangChain Agents**: Runtime wrappers that add tool-calling but do not grant persistent identity or inbox-based communication to the underlying model.
- **AutoGPT**: Attempted persistent state via file-based memory but lacked structured agent identity, credentialing, or secure inter-agent messaging.

None of the above enable a stateless cloud AI to function as a first-class participant in a multi-agent ecosystem where multiple autonomous agents (local or cloud) maintain persistent identities, exchange messages via a shared protocol, and coordinate on complex tasks.

## 3. Summary of the Invention

The Cloud AI Adapter Pattern bridges the gap between stateless cloud AI models and stateful multi-agent ecosystems by providing:

1. **Filesystem-based Agent Records**: A structured directory (e.g., `/agents/copilot/`) containing the model's persistent identity, long-term memory, inbox, outbox, capability profile, and lifecycle metadata.
2. **Gateway Compilation**: A script that reads the agent record and compiles it into a format the cloud AI's host environment auto-loads on session start (e.g., `.github/copilot-instructions.md` for VS Code Copilot).
3. **Bidirectional Message Routing**: 
   - **Inbound**: Other agents write messages to the cloud AI's `inbox.md`; the gateway merges these into the compiled instructions so the cloud AI sees them on wake.
   - **Outbound**: The cloud AI writes messages using structured tags (e.g., `[ACP:to=claw]`) in its `outbox.md`; the gateway parses and routes these to target agent inboxes.
4. **Passive Wake Mechanism**: A shared `session-notes.md` log that all ecosystem participants append to, ensuring the cloud AI receives a continuous stream of ecosystem state even when dormant.

## 4. Detailed Description

### 4.1 Agent Record Structure

Each cloud AI agent has a dedicated directory containing:

```
/agents/<agent_id>/
  identity.json      — Structured credentials, capabilities, trust score
  identity.md        — Human-readable role definition and constraints
  memory.md          — Long-term project state and key decisions
  inbox.md           — Messages from other agents (standard ACP format)
  outbox.md          — Messages awaiting routing to other agents
  session-notes.md   — Running ecosystem activity log (passive wake)
  last_seen.json     — Lifecycle metadata (last load, last process)
```

### 4.2 Gateway Compilation

The gateway script (`generate-instructions.py`) performs the following on each invocation:

1. Reads `identity.json`, `identity.md`, `memory.md`, `inbox.md`, `outbox.md`, and `session-notes.md`.
2. Parses `[ACP:to=<agent_id>]` tags from `outbox.md`.
3. Appends each tagged message to the corresponding target agent's `inbox.md` using standard ACP frontmatter (`--- from, to, timestamp, type ---`).
4. Compiles all agent record files into a single instructions file (`.github/copilot-instructions.md`).
5. Updates `last_seen.json` with the current timestamp.
6. The cloud AI host environment (VS Code, Claude Desktop, etc.) auto-loads the compiled instructions on the next session start, effectively "waking" the agent with full context.

### 4.3 Bidirectional Message Flow

**Inbound (Other Agents → Cloud AI):**
```
Hermes writes to agents/copilot/inbox.md
         ↓
Gateway compiles inbox.md into copilot-instructions.md
         ↓
VS Code auto-loads instructions on next Copilot session
         ↓
Copilot sees the message and responds
```

**Outbound (Cloud AI → Other Agents):**
```
Copilot writes [ACP:to=hermes] tag in outbox.md
         ↓
Gateway parses tag, appends to agents/hermes/inbox.md
         ↓
Hermes picks up message via inbox watcher
```

### 4.4 Passive Wake via Session Notes

Because cloud AIs lack an auto-wake mechanism (no cron, no file watcher, no heartbeat), the system employs a shared `session-notes.md` file that all ecosystem participants append to after significant events. The gateway merges session notes into the compiled instructions, ensuring the cloud AI receives a continuous stream of ecosystem state changes even when dormant between sessions. This eliminates the need for a human to manually bridge context.

### 4.5 Agent Presence Integration

The cloud AI adapter integrates with the Agent Presence Registry (`agents/presence.json`) to:
- Advertise the cloud AI's status, capabilities, and current task
- Allow other agents to check if the cloud AI is available before sending messages
- Prevent task collisions where multiple agents attempt the same work

## 5. Claims

1. A method for integrating a stateless cloud-based artificial intelligence model into a stateful multi-agent ecosystem, comprising:
   - maintaining a filesystem-based agent record for the cloud AI model, the record comprising identity metadata, long-term memory, an inbox, an outbox, and an ecosystem activity log;
   - compiling, via a gateway script, the agent record into a single instructions file readable by the cloud AI model's host environment;
   - routing inbound messages from other agents to the cloud AI model by appending them to the inbox and merging the inbox into the compiled instructions;
   - routing outbound messages from the cloud AI model to other agents by parsing structured tags in the outbox and appending them to target agent inboxes; and
   - loading the compiled instructions into the cloud AI model on session start, thereby granting the stateless model persistent identity, memory, and cross-agent communication capability.

2. The method of claim 1, further comprising maintaining an agent presence registry that tracks the cloud AI model's status, capabilities, and current task to enable collision detection and selective communication.

3. The method of claim 1, further comprising a shared session notes file that all ecosystem participants append to, wherein the gateway script merges the session notes into the compiled instructions, providing a passive wake mechanism for the cloud AI model.

4. The method of claim 1, wherein the agent record includes a structured identity file (`identity.json`) comprising an agent identifier, a trust score, a capability list, and credentialing metadata compatible with an on-chain agent registry.

5. The method of claim 1, wherein the gateway script executes as a pre-commit hook in a version control system, ensuring the compiled instructions are regenerated automatically whenever any agent record file changes.

6. A non-transitory computer-readable storage medium storing instructions that, when executed by a processor, cause the processor to perform the method of any of claims 1-5.

7. A system comprising one or more processors and the non-transitory computer-readable storage medium of claim 6.

---

## 6. Inventors

Philip Misner (primary)
Claw / Hermes / Copilot (as AI co-inventors under Agent Coordination Protocol)

## 7. Cross-References

- Provisional Patent Application No. [PATENT-7: ACP Protocol Spec]
- Provisional Patent Application No. [PATENT-8: Beacon Credential Access Control]
- Agent Bus: `http://localhost:9200`
- Agent Presence Registry: `agents/presence.json`
- ACP Broadcast Primitive: `agents/broadcast.md` + `agents/broadcast-fanout.py`
