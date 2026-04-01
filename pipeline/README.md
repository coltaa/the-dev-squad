# AiDevTeam

5 Claude Code sessions that talk to each other.

One plans. One reviews. One codes. One tests. One supervises. They communicate through structured signals, review each other's work, and loop until every step is right. The result is a build pipeline that produces bulletproof plans that produce bulletproof builds.

No API keys. No per-token costs. All 5 sessions run on your Claude subscription. You describe what you want, and the team builds it — start to finish — without errors.

## The Agents

5 separate Claude Code sessions, each with a single job:

| Agent | Role | What It Does | Restrictions |
|-------|------|-------------|-------------|
| **A** | Planner | Chats with you about the concept, researches everything, writes a bulletproof plan with complete code for every file | Can only write `plan.md`. No bash, no spawning agents. |
| **B** | Reviewer | Reads A's plan and tears it apart. Asks hard questions. Loops with A until there are zero gaps. | Cannot write anything. Read-only. |
| **C** | Coder | Follows the approved plan exactly. Writes every file, installs deps, builds the project. No improvising. | Can write inside `~/Builds/` only. Cannot touch `plan.md`. |
| **D** | Tester | Reviews C's code against the plan, runs it, catches bugs. Loops with C until everything passes. | Cannot write anything. Can run commands to test. |
| **S** | Supervisor | Your diagnostic assistant. If something breaks or loops, S reads the event log and helps you figure out what went wrong. | Unrestricted. Not part of the pipeline — available on demand. |

Every restriction is enforced by a `PreToolUse` hook — not by prompts. The agents literally cannot break the rules. The prompt tells them their job. The hook is the law.

## How It Works

```
You: "Build a weather app with animated rain, city search, dark theme"

  ┌─────────┐     ┌─────────┐     ┌─────────┐     ┌─────────┐
  │    A     │ ──> │    B     │     │    C     │ ──> │    D     │
  │ Planner  │ <── │ Reviewer │     │  Coder   │ <── │ Tester   │
  └─────────┘     └─────────┘     └─────────┘     └─────────┘
       │                                ^               │
       └────────────────────────────────┘               │
       <────────────────────────────────────────────────┘

  -> App opens in your browser. Done.
```

**Phase 0: Concept** — You chat with Agent A in the viewer. Describe what you want. A asks clarifying questions until the scope is clear. This is the only human interaction required.

**Phase 1: Planning** — A reads the build plan template, researches the concept (web searches, docs, source code), and writes `plan.md` with complete, copy-pasteable code for every file. No placeholders, no "implement this later." A self-reviews multiple times before sending to B.

**Phase 1b: Plan Review** — B reads the plan and sends structured questions back to A. They loop — B asks, A answers with verified information and updates the plan — until B is fully satisfied and approves. The plan is now locked. No agent can modify it.

**Phase 2: Coding** — C reads the locked plan and builds exactly what it says. Every file, every dependency, every line of code. No improvising.

**Phase 3: Code Review + Testing** — D reads the plan and the code. Checks every item. If anything doesn't match or fails, D sends issues back to C. C fixes, D re-reviews. They loop until D approves and all tests pass.

**Phase 4: Deploy** — The finished project is ready. App opens in your browser.

The pipeline is designed so errors get caught before they compound. The plan-review loop between A and B catches design gaps before a single line of code is written. The test loop between C and D catches implementation bugs before anything ships. Each loop has no round limit — they keep going until it's right.

## Quick Start

### Prerequisites

- Node.js 22+
- pnpm
- Claude Code CLI installed (`claude` command available in your terminal)
- Active Claude subscription (Max, Pro, or Team)

### Setup

Clone both repos into the same parent directory:

```bash
# The pipeline backend (orchestrator, hooks, role files)
git clone https://github.com/johnkf5-ops/AiDevTeam.git buildui

# The pixel art viewer UI
git clone https://github.com/johnkf5-ops/aidevteam-viewer.git
```

Your directory should look like:

```
Projects/
  buildui/              <-- This repo
  aidevteam-viewer/     <-- The viewer
```

### Run

```bash
# Start the viewer
cd aidevteam-viewer
pnpm install
pnpm dev

# Open http://localhost:3000
```

That's it. The viewer spawns the orchestrator automatically when you hit START. You don't need to run anything else.

### Use

1. Open `http://localhost:3000`
2. Click **Reset** to clear any previous state
3. Type your concept in Agent A's chat panel and hit Send
4. Chat with A until the concept is clear
5. Click **START**
6. Watch the pipeline run — all 5 agents visible in real-time
7. When it's done, your project is in `~/Builds/<project-name>/`

After the build completes, you can chat directly with any agent for post-build work — fixing bugs, adding features, or asking questions about the code.

## The Viewer

A pixel art office where 5 agents sit at desks. Speech bubbles show their latest output. When idle, they wander around, visit the hookah lounge, play ping pong, and have conversations with each other.

Below the office scene:

- **Live Feed** — Every event from every agent, timestamped and color-coded
- **Dashboard** — Phase progress bar, token usage, elapsed time, file count, errors, cost
- **5-Panel Grid** — S (supervisor) panel on the left, A/B/C/D panels on the right. Each panel shows that agent's activity with auto-scroll. Each has its own chat input. Click any A-D panel to expand into a full scrollable modal.
- **Controls** — START, STOP, Reset, View Plan

There's also a simple fallback viewer if you prefer:

```bash
cd buildui
npx tsx viewer.ts
# Open http://localhost:3456
```

## How Builds Are Stored

All builds go to `~/Builds/`. Each build gets its own directory:

```
~/Builds/
  .staging/                     # Temporary — Phase 0 chat lives here until START
  build-a-weather-app/
    plan.md                     # The approved, locked plan
    pipeline-events.json        # Full event log (every tool call, message, status change)
    checklist.md                # Pipeline checklist
    .claude/hooks/              # Copied permission hooks
    ...                         # The actual built project files
```

When you chat with A during Phase 0, everything goes to `.staging/`. When you hit START, staging moves to a real project directory and the orchestrator takes over.

## Security Model

> LLMs ignore prompt instructions. A planner told "only write plan.md" will write code files. A reviewer told "don't modify anything" will edit the plan.

AiDevTeam does not rely on prompts for safety. A `PreToolUse` hook (`approval-gate.sh`) gates every single tool call for every agent. The hook reads the `PIPELINE_AGENT` environment variable and enforces per-agent rules:

- **Filesystem jail** — No agent can write outside `~/Builds/`
- **Plan lock** — After B approves, no agent can modify `plan.md`
- **Role enforcement** — B and D physically cannot write files. A can only write `plan.md`. C can write anything except `plan.md`.
- **Agent tool blocked** — No agent can spawn sub-agents (prevents recursive chaos)
- **Bash tiering** — Safe commands (npm install, node app.js) auto-approve. Dangerous commands (rm, sudo, curl|sh) require your approval via the UI.

The pipeline also uses `--permission-mode auto` which adds Claude's built-in AI safety classifier on top of the hook.

## File Structure

```
AiDevTeam/
  .claude/
    settings.json                # Hook configuration
    hooks/
      approval-gate.sh           # Per-agent permission enforcement
  orchestrator.ts                # Spawns agents, routes signals, enforces flow
  viewer.ts                      # Simple HTML fallback viewer (port 3456)
  role-a.md                      # Planner context
  role-a-phase0.md               # Phase 0 concept discussion context
  role-b.md                      # Reviewer context
  role-c.md                      # Coder context
  role-d.md                      # Tester context
  role-s.md                      # Supervisor context
  build-plan-template.md         # The template A follows when writing plans
  checklist-template.md          # Pipeline checklist copied to each build
  pipelinebuildarchitecture.md   # Full architecture specification
```

## How Agents Communicate

Agents don't parse free-text responses. They communicate via structured JSON schemas enforced by the orchestrator:

```json
// B reviewing A's plan
{ "status": "approved" }
{ "status": "questions", "questions": ["What about error handling?", "..."] }

// D reviewing C's code
{ "status": "approved" }
{ "status": "issues", "issues": ["Missing input validation on POST /users", "..."] }

// D testing C's code
{ "status": "passed" }
{ "status": "failed", "failures": ["PUT /users returns 500 on empty body", "..."] }
```

The orchestrator routes these signals between agents and advances the pipeline phase when an approval signal is received.

## Key Design Decisions

**Scripts enforce, markdown suggests.** Every multi-agent system that relies on prompts to constrain agent behavior will eventually have an agent ignore those constraints. Hooks can't be ignored.

**No --resume across directories.** Claude sessions are scoped to the working directory they were created in. Phase 0 chat happens in `.staging/`, but the orchestrator runs from the real project dir. Instead of trying to resume sessions across directories, the orchestrator injects the Phase 0 conversation as context in the planning prompt.

**Structured signals, not text parsing.** Agents return JSON with explicit status fields. The orchestrator uses `isPositiveSignal()` to normalize approval variants. No regex, no "look for the word approved."

**The orchestrator is the supervisor.** The orchestrator is deterministic code that enforces the pipeline flow. It's not an LLM — it can't be confused, distracted, or convinced to skip steps. Agent S exists as a diagnostic tool for the human, not as a manager for the other agents.

## License

MIT

---

Built with Claude Code. Runs on Claude Code. No API required.
