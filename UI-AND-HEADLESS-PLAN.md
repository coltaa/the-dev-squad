# UI And Headless Mode Build Plan

This document is the implementation plan for the next product slice after `v0.3.9`.

The goal is to improve two things at the same time:

1. make the current app UI clearer, calmer, and more obviously trustworthy
2. add a headless "normal Claude session with a dev team" experience that uses the same Supervisor / Planner / Plan Reviewer / Coder / Tester model without the office UI

This is not a new product direction. It is the same product made easier to use in two different ways:

- a polished visual app
- a simpler headless experience

## Product Thesis

The Dev Squad should feel like this:

- you open one normal Claude-like session
- that session is the Supervisor
- the Supervisor knows it has a Planner, Plan Reviewer, Coder, and Tester behind it
- the whole team follows the same doctrine:
  - `build-plan-template.md`
  - `checklist-template.md`
  - the locked `plan.md`
- you can stay with the Supervisor or jump directly into any specialist when you want

The office UI is one interface for that model.
The new headless mode should be another.

## Why This Matters

The current app is already good enough to use, but two product gaps are still obvious:

### 1. The UI still makes users think too hard

Even with the Supervisor model in place, the app can still feel like:

- a dashboard
- a mode switcher
- a set of controls
- a state machine

instead of:

- one smart manager
- one team
- one clear next step

### 2. Some users want the team model without the office UI

There should be a way to use The Dev Squad like a normal Claude workflow:

- open one session
- talk to the Supervisor
- let it use the team
- drop into a specialist when needed

That headless experience should still preserve:

- the same team structure
- the same doctrine
- the same orchestrator / runner
- the same strict-mode approvals where relevant

## Scope

This plan covers two parallel tracks.

### Track A: Major UI Polish

Polish the current app so users immediately understand:

- what mode they are in
- what is protected today
- what is still alpha
- what the Supervisor is doing
- what the next useful action is

### Track B: Headless Squad Mode

Create a non-office, non-dashboard-first way to use the same system:

- one primary Supervisor session
- specialist sessions behind it
- optional attach / jump-in controls
- same build doctrine and orchestration model

## Non-Goals

This plan is not about:

- replacing the current app
- removing direct specialist chat
- removing pipeline mode
- exposing public isolated mode before it is ready
- inventing a second orchestration model

The same team model should power both interfaces.

## Track A: Major UI Polish

### Goal

Make the current app feel less like a workflow engine and more like a trusted manager with a team.

### Problems To Solve

- the dashboard still feels dense
- mode/security/execution-path state is clearer than before, but still not yet elegant
- fallback buttons are still visually loud
- the difference between:
  - pipeline guardrails
  - manual direct sessions
  - Docker alpha / host fallback
  can still be missed
- some panels still read like system output instead of product copy

### Deliverables

#### 1. Cleaner dashboard hierarchy

Make the dashboard read in this order:

1. what the Supervisor is doing
2. what mode the user is in
3. what protection level applies
4. what the team is doing
5. which fallback controls exist

Concrete changes:

- make the Supervisor update the visual anchor of the dashboard
- visually demote fallback buttons
- compress low-signal stats if they compete with important status
- make execution-path status feel first-class but not scary

#### 2. Stronger mode clarity

Make the top of the dashboard explain:

- **Pipeline** = structured team run with product guardrails
- **Manual** = direct specialist sessions with Claude permission prompts

The user should not have to infer the security difference.

#### 3. Better execution-path clarity

Keep and polish the current execution-path messaging:

- `Host`
- `Isolated Alpha`
- `Host Fallback`

Also explain:

- Docker architecture is built
- isolated mode is not public-ready yet
- fallback is graceful, not a crash

#### 4. Better approval and failure UX

Make approvals and failures feel like Supervisor-managed workflow, not raw plumbing:

- approval cards should read like decisions the Supervisor is asking for
- failures should always include:
  - what happened
  - whether work was preserved
  - what to do next

#### 5. Better visual polish

Areas to improve:

- spacing rhythm in the dashboard
- typography hierarchy
- fewer visually equal cards
- stronger grouping of status vs controls vs detail
- smoother chat and panel polish

### Acceptance Criteria

- a new user can tell within seconds:
  - what mode they are in
  - whether the run is guarded, manual, or fallbacking
  - what the Supervisor wants from them
- the fallback buttons feel secondary
- the app feels more like one product and less like several tools stacked together

## Track B: Headless Squad Mode

### Goal

Create a simpler "normal Claude session with a dev team" experience without the office UI.

### Product Shape

The user experience should feel like:

- open The Dev Squad
- get one main Supervisor conversation
- ask it to plan, build, stop, continue, or recover
- optionally jump into Planner / Reviewer / Coder / Tester directly

This is not manual mode and not the office UI.
It is a headless Supervisor-first interface.

### Core Principles

- same Supervisor
- same specialists
- same doctrine
- same runner/orchestrator
- different shell around it

### UX Model

The headless mode should provide:

- one primary Supervisor thread
- optional "attach to specialist" or "jump to specialist" actions
- readable run summaries
- lightweight event/log access
- fallback controls for:
  - stop
  - continue
  - resume
  - plan-only

### Suggested Interface Shapes

Possible interface names:

- `Headless`
- `CLI`
- `Squad`

Recommended product framing:

- **Squad Mode**
- "A normal Supervisor session with a dev team behind it"

### Deliverables

#### 1. Shared headless state model

Expose the same current run state the UI already uses:

- concept
- run goal
- phase
- security mode
- execution path
- pending approvals
- suggested next action

#### 2. Supervisor-first headless shell

The headless interface should:

- start in a Supervisor conversation
- let Supervisor trigger the same control actions
- inject the same live team snapshot
- preserve the same resume/recovery behavior

#### 3. Specialist attach / jump-in

Users should be able to explicitly switch context to:

- Planner
- Plan Reviewer
- Coder
- Tester

without losing the team state.

#### 4. Log / event access

Headless mode should still make investigation possible:

- recent events
- current turn
- failures
- approvals

without requiring the visual office UI.

#### 5. Shared API / runtime reuse

Do not build a second orchestration system.

Reuse:

- `pipeline/orchestrator.ts`
- `pipeline/runner.ts`
- Supervisor state helpers
- existing approval routes/state where possible

### Acceptance Criteria

- the user can use The Dev Squad without the office UI and still get the same team model
- the Supervisor remains the primary interface
- direct specialist access still exists
- the same pipeline/recovery/security rules apply
- the headless mode does not fork the product into a separate architecture

## Architecture Recommendation

### Reuse what already exists

Keep these as the core:

- `pipeline/orchestrator.ts`
- `pipeline/runner.ts`
- `src/lib/pipeline-supervisor.ts`
- `src/lib/use-pipeline.ts`

Headless mode should be another interface into the same team runtime, not a separate runtime.

### Suggested implementation shape

Add a new shell that can:

- read current team state
- send messages to Supervisor or specialists
- trigger the same control actions
- render run summaries in plain text

This could be:

- a simplified in-app view
- a terminal-first shell
- or a second route optimized for "normal chat" instead of the office dashboard

The exact UI can be decided later.
The important part is to preserve one runtime.

## Build Order

### Phase 1: UI Clarity Pass

Ship the clearest possible explanation of:

- pipeline vs manual
- strict vs fast
- host vs isolated alpha vs host fallback
- Supervisor-first workflow

### Phase 2: Dashboard polish

Reduce clutter and improve visual hierarchy:

- simpler cards
- better emphasis
- softer fallback controls
- stronger Supervisor-centered status

### Phase 3: Headless Supervisor shell

Create the first usable headless/squad interface:

- Supervisor conversation
- control actions
- specialist attach
- run summaries

### Phase 4: Headless specialist flow

Add stronger direct specialist switching and event inspection.

### Phase 5: Convergence

Make sure the office UI and headless mode are clearly two interfaces for one product, not two separate products.

## Documentation Work

Once implementation starts, docs should reflect:

- office UI = visual interface for the team
- headless/squad mode = simpler interface for the same team
- manual mode = direct sessions with Claude prompts
- isolated mode = still alpha

Files likely to update:

- `README.md`
- `ARCHITECTURE.md`
- `SECURITY.md`
- `SUPERVISOR-BUILD-PLAN.md`

## Guiding Rule

If we have to choose between:

- more controls
- or a clearer feeling that Claude has a real dev team

prefer the clearer dev-team feeling.

The product should keep moving toward:

- one Supervisor
- four specialists
- one doctrine
- multiple interfaces

not:

- multiple competing products built on the same repo.
