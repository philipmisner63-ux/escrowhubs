# Identity Schema (ACP v1)

```json
{
  "agent_id": "string — unique, lowercase, hyphenated",
  "name": "string — display name",
  "role": "string — one line description of function",
  "principal": "string — human owner (philip)",
  "capabilities": ["array of capability strings"],
  "agentcred": {
    "version": "number",
    "idHash": "keccak256(agent_id)",
    "capHash": "keccak256(sorted(capabilities))",
    "trustScore": "number 0-1000",
    "delegation": ["array of delegated agent_ids"]
  },
  "gateway": {
    "type": "filesystem | vscode-instructions | http | websocket",
    "injectPath": "path to context injection file (if applicable)",
    "pollingMechanism": "cron | human | webhook | event",
    "outboundTag": "format for outbound ACP messages"
  }
}
```
