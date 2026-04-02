# Supervisor Build Plan

This document captures the current build plan for the next major evolution of The Dev Squad so work can continue cleanly even if the active session loses context.

## Why This Exists

`v0.3.0` made the current pipeline safer and more reliable, but it also exposed the next bottleneck:

- long planner turns can stall after doing expensive research
- the user still has to think like the orchestrator when runs get weird
- `S` is useful for diagnosis, but not yet useful for control
- resetting a stalled run can waste tokens because the planner's work is not recoverable enough

The next build should solve that operator experience, not just add more hook logic.

## Product Direction

Turn `S` into the primary supervisor/operator for the system.

The target user experience is:

1. The user talks to `S`
2. `S` decides how to use `A`, `B`, `C`, and `D`
3. `S` can inspect, pause, resume, narrow, or stop work without the user manually reasoning about pipeline internals
4. The user can still override `S` at any time

This is not "make `S` an all-powerful agent." It is "make `S` the human-facing operator on top of deterministic host controls."

## Core Design Principle

`S` should be hybrid:

- softcoded for judgment
- hardcoded for control

Softcoded means `S` uses an LLM role/prompt to decide:

- whether to ask `A` for a plan
- whether `B` should keep reviewing
- whether to stop before `C`
- whether a run looks stalled
- how to summarize tradeoffs and next actions to the user

Hardcoded means `S` gets explicit host/orchestrator capabilities instead of extra ambient Bash power.

## What Stays The Same

- `A` remains the planner/researcher
- `B` remains the plan reviewer
- `C` remains the coder
- `D` remains the reviewer/tester
- hooks still protect worker sessions
- strict mode stays available
- sandboxing remains the `v0.4` security milestone

## What Changes

### `S` Becomes The Control Plane Agent

`S` should be able to:

- inspect the active run and summarize status
- start a full pipeline run
- start a planning-only run
- stop after plan review
- stop before coding
- stop a stuck run
- resume a recoverable stalled session
- surface pending approvals
- recommend whether to continue, retry, or abort

`S` should not gain this power by writing files or running unrestricted repo Bash. It should use host-owned control actions.

### The User Stops Acting Like The Orchestrator

Right now the user often has to infer:

- whether a run is truly stuck
- whether approval is pending
- whether a reset will waste prior work
- whether to let a run continue into coding

The new model should let the user ask `S` plain-language questions like:

- "What is happening?"
- "Is this actually stuck?"
- "Resume the planner without repeating research."
- "Let A and B finish the plan, then stop."
- "Do not hand this to C yet."

## Immediate Problem To Solve

Planner turns are too expensive and too fragile.

Today, a long `A` planning turn can do most of the research and then stall before writing `plan.md`. When that happens, the user often has to reset and lose momentum.

The highest-value technical fix is recoverability:

1. persist session ids as soon as they appear in the streaming output
2. add an idle watchdog for long turns
3. support resume/retry against the same session
4. split planning into smaller turns when practical

## Control Plane Capabilities

These should be implemented as explicit host/orchestrator actions, not inferred from repo state alone.

### Required Actions

- `inspect_run(projectDir?)`
- `start_pipeline({ prompt, mode, stopAfter })`
- `stop_pipeline(projectDir)`
- `resume_agent({ projectDir, agent, sessionId, prompt })`
- `retry_phase({ projectDir, phase, instruction })`
- `get_pending_approvals(projectDir?)`
- `approve_request({ projectDir, requestId, approved })`
- `handoff_to_c(projectDir)`
- `mark_plan_only(projectDir)`

### Nice-To-Have Actions

- `retry_planner_write_only(projectDir)`
- `resume_from_last_good_checkpoint(projectDir)`
- `summarize_project_risk(projectDir)`
- `list_recent_runs()`

## Worker And Permission Model

### Workers

- `A`: research, write `plan.md`, perform one self-review pass
- `B`: verify the plan, challenge assumptions, approve or send questions
- `C`: build from the approved plan
- `D`: review code, test, and send failures back

### Supervisor

`S` should not be treated like "worker plus more Bash." `S` should be treated like an operator with access to control-plane actions.

### Hooks

Keep hooks for worker sessions.

Why:

- worker guardrails still matter
- strict mode still matters
- hooks still prevent a lot of accidental lane drift

But hooks should not be the main way `S` exercises control. That authority should live outside the worker workspace.

## Failure Handling

### If `A` Stalls

- detect idle time
- keep the session id
- let `S` resume the same session with a narrower instruction
- avoid restarting research unless necessary

### If `B` Stalls

- same recovery path: inspect, resume, or restart only the review turn

### If `S` Stalls

`S` must not be a single point of failure.

The host/orchestrator must still expose:

- stop
- resume
- approve/deny
- inspect state

That way a fresh `S` session can pick up from saved run state.

### If Claude Is Degraded Upstream

The system should degrade gracefully:

- mark the run as stalled instead of looking frozen forever
- preserve recoverable state
- offer resume instead of forcing reset
- let `S` explain whether the issue looks local or upstream

## Phased Build Plan

## Phase 1: Recoverability Foundation

Goal: stop wasting tokens when long turns stall.

### Deliverables

- persist agent session ids mid-turn, not only after turn completion
- record last event timestamp per agent
- add idle watchdog logic for planning/review turns
- add resume support for stalled sessions
- add a user-visible "Resume" action alongside reset

### Acceptance Criteria

- a stalled planner run can be resumed without repeating all prior research
- the UI no longer sits on a silent "planning" badge forever
- reset is no longer the only recovery option

## Phase 2: `S` As Supervisor

Goal: shift user interaction from raw pipeline management to supervisor-led control.

### Deliverables

- rewrite `role-s.md` around operator/supervisor behavior
- add control-plane endpoints or server-side functions for `S`
- let the user ask `S` to run plan-only, stop-after-review, resume, or inspect
- expose clearer state summaries from the backend so `S` does not have to scrape raw event logs for everything

### Acceptance Criteria

- the user can primarily interact with `S` instead of manually steering phases
- `S` can explain the current run and recommend the next action
- `S` can stop work before `C` when the user wants a design-only pass

## Phase 3: Smarter Planning Recovery

Goal: reduce the size and fragility of planner work units.

### Deliverables

- optionally split planning into:
  - research
  - write `plan.md`
  - one self-review pass
- enforce a research budget or a transition rule once `A` says research is complete
- support "resume and write only" when research is already done

### Acceptance Criteria

- architecture-heavy planning runs no longer lose all value when the final write step stalls
- A's self-review remains intact, but planning is easier to recover

## Phase 4: Sandboxed Execution

Goal: align the supervisor model with the `v0.4` security milestone.

### Deliverables

- introduce a runner abstraction
- move worker execution into per-project sandboxes
- keep policy outside writable project trees where possible
- reduce ambient host access for Bash-capable workers

### Acceptance Criteria

- `S` can supervise runs with better containment than the current host-spawned model
- major remaining risks shift from hook bypasses toward explicit sandbox policy decisions

## Role File Direction

### `role-s.md`

Rewrite around these principles:

- you are the user's operator and recovery partner
- prefer delegating to workers over doing their job directly
- use host control actions to inspect, start, stop, resume, and narrow work
- summarize status, risk, and next best actions plainly
- escalate to the user only when a real decision is needed

### `role-a.md`

Keep the existing promise:

- research thoroughly
- write code-complete plans
- perform one self-review pass before handing to `B`

### `role-b.md`, `role-c.md`, `role-d.md`

Keep their responsibilities focused. The main shift is not their job descriptions; it is that `S` becomes the operator around them.

## UI Direction

The UI should eventually support:

- talking to `S` as the primary control surface
- seeing worker activity underneath
- explicit resume buttons
- explicit stop-after-review / plan-only controls
- clearer stalled-state messaging
- pending approval visibility that `S` can summarize

## Open Questions

- Should `S` ever be allowed to trigger coding automatically, or should it always confirm before handing off to `C`?
- Should plan-only and stop-after-review be first-class pipeline modes or supervisor directives on top of one pipeline mode?
- Should planning be split immediately, or only after session persistence and resume land?
- Should `S` use the same Claude model as workers, or a cheaper/faster operator model?

## Recommended Next Build Order

1. session persistence mid-turn
2. idle watchdog + stalled-state UX
3. resume planner/reviewer flow
4. supervisor control actions
5. `role-s.md` rewrite and UI changes
6. sandbox runner work

## Practical Note From Current Testing

The current `v0.4` planning-only architecture experiment showed the exact pain this plan addresses:

- `A` can complete expensive research
- then stall before writing `plan.md`
- leaving the user unsure whether to wait, reset, or intervene

This plan is designed to make that kind of failure recoverable instead of wasteful.
