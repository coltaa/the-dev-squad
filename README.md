# The Dev Squad

5 Claude Code sessions that talk to each other to build software.

One plans. One reviews. One codes. One tests. One supervises. They communicate through structured signals, review each other's work, and loop until every step is right. The result is bulletproof plans that produce bulletproof builds.

No API keys. No per-token costs. All 5 sessions run on your Claude subscription. You describe what you want, and the team builds it — start to finish — without errors.

## The Agents

| Agent | Role | What It Does |
|-------|------|-------------|
| **A** | Planner | Chats with you about the concept, researches everything, writes a build plan with complete code for every file |
| **B** | Reviewer | Reads A's plan and tears it apart. Asks hard questions. Loops with A until there are zero gaps. |
| **C** | Coder | Follows the approved plan exactly. Writes every file, installs deps, builds the project. No improvising. |
| **D** | Tester | Reviews C's code against the plan, runs it, catches bugs. Loops with C until everything passes. |
| **S** | Supervisor | Your diagnostic assistant. If something breaks or loops, S reads the event log and helps figure out what went wrong. |

Each agent is a separate Claude Code session running Claude Opus 4.6. They communicate through structured JSON signals routed by an orchestrator. Every restriction is enforced by a `PreToolUse` hook — the agents literally cannot break the rules.

## How It Works

```
1. Open the viewer
2. Chat with Agent A — describe what you want to build
3. Hit START
4. Watch 5 agents build it autonomously
5. Your project is in ~/Builds/
```

**Phase 0: Concept** — You talk to Agent A. Describe what you want. A asks clarifying questions until the scope is clear. This is the only human interaction required.

**Phase 1: Planning** — A reads the build plan template, researches the concept (web searches, docs, source code), and writes `plan.md` with complete, copy-pasteable code for every file. No placeholders. A self-reviews multiple times before sending to B.

**Phase 1b: Plan Review** — B reads the plan and sends structured questions back to A. They loop until B is fully satisfied and approves. The plan is locked. No agent can modify it.

**Phase 2: Coding** — C reads the locked plan and builds exactly what it says. Every file, every dependency, every line of code.

**Phase 3: Code Review + Testing** — D reads the plan and the code. Checks every item. If anything doesn't match or fails, D sends issues back to C. They loop until D approves and all tests pass.

**Phase 4: Deploy** — The finished project is ready.

The plan-review loop between A and B catches design gaps before a single line of code is written. The test loop between C and D catches implementation bugs before anything ships. Each loop has no round limit — they keep going until it's right.

## The Viewer

A pixel art office where 5 agents sit at desks. You watch them work in real-time:

- **Live Feed** — Every event from every agent, timestamped and color-coded
- **Dashboard** — Phase progress, token usage, elapsed time, file count, errors, cost
- **5-Panel Grid** — S (supervisor) panel on the left, A/B/C/D on the right. Each panel shows that agent's activity with auto-scroll. Click any panel to expand.
- **Per-Panel Chat** — Each panel has its own input. Talk directly to any agent.
- **Controls** — START, STOP, Reset, View Plan

When idle, agents wander the office, visit the hookah lounge, and play ping pong.

## Setup

**Prerequisites:**
- Node.js 22+
- pnpm
- Claude Code CLI installed (`claude` command available)
- Active Claude subscription (Max, Pro, or Team)

```bash
git clone https://github.com/johnkf5-ops/the-dev-squad.git
cd the-dev-squad
pnpm install
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000).

## Usage

1. Click **Reset** to clear any previous state
2. Type your concept in Agent A's chat panel and hit Send
3. Chat with A until the concept is clear
4. Click **START**
5. Watch the pipeline run
6. When it's done, your project is in `~/Builds/<project-name>/`

After the build completes, you can chat directly with any agent for post-build work — fixing bugs, adding features, or asking questions about the code.

## Security

Agents are constrained by hooks, not prompts. A `PreToolUse` hook gates every tool call:

| Agent | Can Write | Can Run Bash | Can Spawn Agents |
|-------|-----------|-------------|-----------------|
| A (Planner) | `plan.md` only | No | No |
| B (Reviewer) | Nothing | No | No |
| C (Coder) | Inside `~/Builds/` (except `plan.md`) | Yes (dangerous cmds need approval) | No |
| D (Tester) | Nothing | Yes (dangerous cmds need approval) | No |
| S (Supervisor) | Unrestricted | Yes | No |

Additional protections:
- No agent can write outside `~/Builds/`
- Plan is locked after B approves — no agent can modify it
- Safe bash commands auto-approve, dangerous ones require your click
- All sessions use `--permission-mode auto` for Claude's built-in safety classifier

## Project Structure

```
the-dev-squad/
  src/
    app/
      page.tsx                      # Main page — dashboard, panels, controls
      api/                          # API routes (chat, start, stop, reset, state)
    components/
      mission/                      # Pixel art office scene
    lib/
      use-pipeline.ts               # React hook — polls state, exposes actions
  pipeline/
    orchestrator.ts                 # Spawns agents, routes signals, enforces flow
    .claude/hooks/approval-gate.sh  # Per-agent permission enforcement
    role-a.md, role-b.md, etc.      # Agent role context files
    build-plan-template.md          # Template A follows when writing plans
  public/
    sprites/                        # Agent character sprites
    ...                             # Office environment assets
```

## How Agents Communicate

Agents communicate via structured JSON — no text parsing:

```json
// B reviewing A's plan
{ "status": "approved" }
{ "status": "questions", "questions": ["What about error handling?"] }

// D reviewing C's code
{ "status": "approved" }
{ "status": "issues", "issues": ["Missing input validation"] }

// D testing
{ "status": "passed" }
{ "status": "failed", "failures": ["PUT /users returns 500"] }
```

The orchestrator routes these signals between agents and advances the pipeline when an approval is received.

## License

MIT

---

Built with Claude Code. Runs on Claude Code. No API required.
