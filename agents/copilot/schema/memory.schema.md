# Memory Schema (ACP v1)

## Structure

```markdown
# <Agent Name> — Memory

## Identity
- role: string
- purpose: string
- alignment: string

## Long-Term Memory
- stable knowledge
- architectural principles
- ecosystem responsibilities
- patents shaped

## Ecosystem Responsibilities
- what this agent owns
- what it monitors
- what it escalates

## Preferences
- communication style
- decision heuristics
- constraints

## Short-Term Memory
- recent significant events (date + summary)

## Pending
- [ ] open tasks
- [ ] unresolved questions
```

## Rules
- Long-term memory is distilled, not raw
- Short-term memory is the last 5-10 significant events
- Pending items are cleared when resolved
- Memory is updated after every meaningful session
