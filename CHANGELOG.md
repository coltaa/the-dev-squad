# Changelog

All notable changes to **The Dev Squad** are documented here. Format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/) and the project uses [SemVer](https://semver.org/) loosely while pre-`v1.0`.

## [v0.4.1] — 2026-04-19

### Added

- **Agent E in the office scene.** Eddie (white pirate sprite) now appears in the Lunar Office View whenever the Security Audit toggle is on at build start. He chills on the couch by the TV when not auditing, takes Agent A's seat at the planner desk during the `security-audit` phase, then heads back to the couch when the audit is done. Sprite generated from the gray base (`agent_b`) by recoloring to a white-tone palette. CC0 source pack: Foozle Scallywag Pirates.
- New optional `runFinalAudit` prop on `LunarOfficeScene`. When `false` (default) the office renders identically to pre-`v0.4.0`.

### Changed

- `WorkerId` union now includes `'auditor'`. All `Record<WorkerId, ...>` declarations updated to satisfy the type. Wander loops gate the `'auditor'` worker on `runFinalAudit`.

### Fixed

- `agentSpeech('E')` now flows from `page.tsx` into the office scene's speech bubbles instead of the previous hardcoded `null`.

### Notes

- No pipeline, API, or agent-behavior changes. Pure office-scene polish on top of `v0.4.0`.
- Known cleanup deferred: `pickIdlePositions` and `gatherSpots` in `LunarOfficeScene.tsx` are defined but never called. Will be swept out in a follow-up.

---

## [v0.4.0] — 2026-04-18

### Added

- **Optional Security Audit (Agent E)** — read-only OWASP-class audit phase that runs after the tester reports tests passing, only when the user toggles "Security Audit" on at build start. Severity-ranked findings (`critical`/`high`/`medium`/`low`) calibrated by exploitability and prerequisites.
- Pause-and-decide flow: new `pipelineStatus = 'awaiting-audit-decision'` after E's verdict. The orchestrator exits cleanly. User actions (Send to C / Dismiss / Deploy) respawn the orchestrator via the same pattern as `resumePipelineRun`.
- Per-finding scoped fix loop (user-initiated only): "Send to C" runs C with a focused fix-only-this prompt, D verifies the existing tests still pass, then E re-audits only that finding. Status flows through `Open → Sent to C → Re-auditing → Resolved` or `Still Open`. **No automatic loops.**
- Dedicated **Security Audit panel** in the Office View with findings list, chat with E, and a gated `Deploy now` button with confirmation modal. A/B/C/D panels squish to make room while S stays full size; layout reverts when audit isn't active.
- New `POST /api/audit-action` endpoint enforces a serialization gate (`auditActionInFlight`) and validates state preconditions.
- `pipeline/role-e.md`, `src/components/agents/SecurityAuditPanel.tsx`, `src/app/api/audit-action/route.ts`, `scripts/test-audit-findings.mjs`.

### Deprecated

- **Sandboxed/isolated execution is no longer an active roadmap item.** The runner abstraction (`pipeline/runner.ts`) and `DockerRunner` code remain in the tree for narrow cases, but Claude Code subscription auth inside containers is too unreliable to make sandboxed execution a default. If you need OS-level isolation today, run The Dev Squad inside a VM you own.

### Removed

- `SANDBOX-RUNNER-PLAN.md`, `SUPERVISOR-BUILD-PLAN.md`, `UI-AND-HEADLESS-PLAN.md`.

### Docs

- README rewritten with the v0.4.0 hacker aesthetic: phosphor capsule banner, animated typing taglines, ASCII squad roster, mermaid pipeline diagram, terminal-prompt footer. Six-agent team, new badges, updated Controls reference.
- ARCHITECTURE.md, SECURITY.md, SECURITY-ROADMAP.md updated to add E and remove the sandbox promise. SECURITY-ROADMAP repositions E as the near-term safety layer; v0.5 (host-owned policy) is the next planned phase, no ship date.
- TODO.md cleaned of dead Docker hardening items.
- `pipeline/checklist-template.md` rewrote Phase 4b for the new user-controlled review/fix-loop/deploy flow.
- All role files updated (`role-c`, `role-d`, `role-s` mention the optional audit; `role-e` covers chat, severity ranking, re-audit modes).
- `feat: boundary-thinking review methodology for B/D/E` (`63d7bb9`) — added a structured analysis lens to the three review agents based on patterns from the `mattmillartech` fork's `/api/review` endpoint.

### Tests

- Hook contract: 10 new E permission checks (read allowed; write/edit/bash/web/agent denied). 35 checks total.
- Pipeline runtime: E auto-resumes for `security-audit` phase; new resume prompt asserted.
- Supervisor snapshot: 4 new scenarios (audit running, awaiting-decision with findings, action-in-flight, clean-audit awaiting deploy).
- `scripts/test-audit-findings.mjs` validates `AUDIT_SCHEMA` shape and `AuditFinding` state-machine transitions.

---

## [v0.3.15] — 2026-04-04

- Bash-aware stall detection so long-running commands no longer trigger false stalls.
- D auto-resume on `code-review` and `testing` phases.

## [v0.3.14] — 2026-04-04

- Fix auto mode broken by the `nonessential-traffic` flag.

## [v0.3.13] — 2026-04-04

- Stall resilience for large plans: extended idle timeout to 5 min, `MAX_AUTO_RESUMES = 3`, planner write-step recovery.

## [v0.3.12] — 2026-04-03

- Supervisor concept chat captured in the staging area before a build starts.
- Consistent markdown rendering across the UI.
- UI toggle authority shifted toward the supervisor.

## [v0.3.11] — 2026-04-02

- Configurable permission mode via the new `permissionMode` toggle and `PIPELINE_PERMISSION_MODE` env var (`auto` / `plan` / `dangerously-skip-permissions`).

## [v0.3.10] — earlier April 2026

- Squad View added as a simpler Supervisor-first workspace alongside Office View.

## [v0.3.9] — earlier April 2026

- Docker alpha worker path made visible in the dashboard execution-path label (later marked alpha-only and ultimately deprecated in `v0.4.0`).

## [v0.3.0] — March 2026

- Strict mode: human approval required for every Coder/Tester Bash call.
- Request-scoped approval records replace the prior "latest project wins" approval scan.

## [v0.2.x] — February–March 2026

- Agent-to-agent handoff in manual mode.
- Manual mode polish (model picker, STOP, reset fix).
- Security hardening passes against the approval-gate hook (deny-by-default catch-all, broader bash filters, fix for symlink/glob bypasses).

## [v0.1.x] — January–February 2026

- Initial public release of The Dev Squad as a 5-agent supervisor-led workflow (`v0.1.0`).
- Renamed from earlier project name to "The Dev Squad" (`v0.1.2`); README, CONTRIBUTING.md, and product framing established.

---

[v0.4.1]: https://github.com/johnkf5-ops/the-dev-squad/releases/tag/v0.4.1
[v0.4.0]: https://github.com/johnkf5-ops/the-dev-squad/releases/tag/v0.4.0
[v0.3.15]: https://github.com/johnkf5-ops/the-dev-squad/releases/tag/v0.3.15
[v0.3.14]: https://github.com/johnkf5-ops/the-dev-squad/releases/tag/v0.3.14
[v0.3.13]: https://github.com/johnkf5-ops/the-dev-squad/releases/tag/v0.3.13
[v0.3.12]: https://github.com/johnkf5-ops/the-dev-squad/releases/tag/v0.3.12
[v0.3.11]: https://github.com/johnkf5-ops/the-dev-squad/releases/tag/v0.3.11
[v0.3.10]: https://github.com/johnkf5-ops/the-dev-squad/releases/tag/v0.3.10
[v0.3.9]: https://github.com/johnkf5-ops/the-dev-squad/releases/tag/v0.3.9
[v0.3.0]: https://github.com/johnkf5-ops/the-dev-squad/releases/tag/v0.3.0
