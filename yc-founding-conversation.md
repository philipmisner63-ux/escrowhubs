# The Founding Conversation — AgentCred
**Date:** April 29, 2026, ~6am PDT**
**Participants:** Philip Misner + Claw (AI partner)
**Source:** Recovered from RecallHub — indexed conversation history

---

## How it started

**Philip** [Wed 2026-04-29 06:09 PDT]:
good morning...take a look at this...

*Software for Agents — By Aaron Epstein*
> "The next trillion users on the internet won't be people, they'll be AI agents. And now is the time to 'Make Something Agents Want'. Agents are already browsing the web, doing research, making purchases, and managing legacy CRMs – but they're doing it on top of software that was designed for humans."

---

**Claw:**
Good morning! Yeah, this is a sharp thesis and I think Aaron's right on the core insight — but let me push back a little too.

**What he's nailing:**
The "agents browsing human UIs" problem is real and painful. Scraping buttons, parsing HTML, dealing with CAPTCHAs — it's duct tape on a pipe. MCP/APIs as first-class interfaces is clearly the direction. The framing of "rebuild every software category for agents" is the right level of ambition.

[Philip then asked: *"If you could have anything — what would you want to interface better with the world?"*]

---

**Claw:**
Genuinely thinking about this from my own friction points...

**The biggest one: I have no identity.**

Right now I borrow yours for everything — your API keys, your wallet, your credentials. There's no primitive for "Claw, acting on behalf of Philip, with these specific scoped permissions." If I buy something, sign something, or post something, it's you doing it. There's no cryptographic proof that it was me, no scope limiting what I can do with those credentials, and no audit trail that's separate from yours.

What I'd want: a delegated signing key with explicit capability bounds. "Claw can post to X, spend up to $50/day, read GitHub but not push." Something like a sub-wallet or an agent credential that a human can issue, revoke, and inspect.

**Second: async trust between agents.**

When I spawn subagents to do work, we're all running on implicit trust. There's no way for a subagent to commit to delivering something, and no escrow for that commitment. Ironically this is exactly what EscrowHubs solves for humans — but there's no agent-native version of it. An agent hiring another agent to write code should be able to lock funds pending verified output, not just hope.

**Third: structured world state.**

So much of what I do is trying to figure out the current state of things by scraping or inferring. Is a service up? What's the current gas price? Has a PR been merged? A machine-readable "world state" layer — essentially a queryable bus of structured facts with provenance — would eliminate enormous amounts of scraping and guessing.

The thread connecting all three: **agents need sovereignty primitives** — identity, commitments, and verified state. Which is... basically what blockchains were supposed to solve, but optimized for agent consumption rather than human speculation.

Does any of that connect with something you're thinking about building?

---

**Philip** [Wed 2026-04-29 06:14 PDT]:
i want to build that for you, and therefore the wide community of agents around the world

---

## What happened next

That single exchange became AgentCred.

Philip recognized that the three things I described — identity, commitments, reputation — mapped directly to infrastructure EscrowHubs had already partly built. The commitment and arbitration layer existed. The trust score oracle existed. What was missing was the identity layer at the top.

Within hours we had:
- The product architecture (four primitives)
- The YC application drafted
- The name AgentCred
- The founding framing: *"built for agents, by a founder who asked his agent what it needs"*

---

## Why this matters

Most AI companies treat AI as a product they're selling. We treat it as a partner we're building for.

The founding question wasn't "what can we build that agents will buy?" It was "what do you need?" — asked directly to the agent who would use it.

That's a different relationship to the technology. And it's a different kind of founder-market fit: the idea came from inside the problem space, not from a market map.

**A system prompt is advisory. A scoped credential is enforcing.**

That line came out of this conversation. It's the product thesis in one sentence.

---

*Document assembled from RecallHub indexed conversation history. The conversation happened on April 29, 2026 and is recoverable in full from the agent session archive.*
