import type { PendingApproval } from '@/lib/pipeline-approval';

interface PipelineEventLike {
  time: string;
  agent: string;
  phase: string;
  type: string;
  text: string;
}

interface RuntimeLike {
  activeTurn?: {
    agent?: string;
    phase?: string;
    status?: string;
    lastEventAt?: string;
    promptSummary?: string;
    autoResumeCount?: number;
  } | null;
}

interface PipelineStateLike {
  concept?: string;
  currentPhase?: string;
  securityMode?: string;
  runGoal?: string;
  stopAfterPhase?: string;
  pipelineStatus?: string;
  activeAgent?: string;
  buildComplete?: boolean;
  agentStatus?: Record<string, string>;
  runtime?: RuntimeLike;
  events?: PipelineEventLike[];
}

export interface SupervisorRecommendation {
  title: string;
  detail: string;
  actionLabel?: string;
  chatCommand?: string;
  severity: 'neutral' | 'info' | 'warning' | 'success';
}

function formatAgentStatuses(agentStatus: Record<string, string> | undefined): string {
  if (!agentStatus) return 'A=idle, B=idle, C=idle, D=idle, S=idle';
  return ['A', 'B', 'C', 'D', 'S']
    .map((agent) => `${agent}=${agentStatus[agent] || 'idle'}`)
    .join(', ');
}

function formatRecentEvents(events: PipelineEventLike[] | undefined, limit: number = 8): string {
  if (!events || events.length === 0) return '- No events yet';
  return events
    .slice(-limit)
    .map((event) => `- [${event.agent} | ${event.phase} | ${event.type}] ${event.text}`)
    .join('\n');
}

function findLatestEvent(
  events: PipelineEventLike[] | undefined,
  types: string[]
): PipelineEventLike | null {
  if (!events || events.length === 0) return null;
  for (let i = events.length - 1; i >= 0; i -= 1) {
    if (types.includes(events[i].type)) return events[i];
  }
  return null;
}

export function getSupervisorRecommendation(
  state: PipelineStateLike,
  pendingApproval: PendingApproval | null
): SupervisorRecommendation {
  const activeTurn = state.runtime?.activeTurn;
  const latestFailure = findLatestEvent(state.events, ['failure', 'permission_denied', 'issue']);

  if (pendingApproval?.approved === null) {
    return {
      title: `Approval needed for ${pendingApproval.agent}`,
      detail: `${pendingApproval.tool} is waiting on a decision: ${pendingApproval.description}`,
      actionLabel: 'Review approval card',
      severity: 'warning',
    };
  }

  if (
    state.pipelineStatus === 'paused' &&
    state.currentPhase === 'plan-review' &&
    state.buildComplete !== true
  ) {
    return {
      title: 'Plan approved, waiting on you',
      detail: 'B approved the plan and the run paused cleanly before coding. Continue when you want C to start building.',
      actionLabel: 'Continue build',
      chatCommand: 'continue build',
      severity: 'info',
    };
  }

  if (
    activeTurn?.status === 'stalled' &&
    (activeTurn.agent === 'A' || activeTurn.agent === 'B') &&
    (activeTurn.phase === 'planning' || activeTurn.phase === 'plan-review')
  ) {
    return {
      title: `Recoverable ${activeTurn.agent} stall`,
      detail: activeTurn.promptSummary
        ? `The ${activeTurn.phase} turn looks stalled. Resume it from the saved session instead of resetting the run.`
        : 'A planning/review turn looks stalled. Resume it from the saved session instead of resetting the run.',
      actionLabel: 'Resume stalled run',
      chatCommand: 'resume stalled run',
      severity: 'warning',
    };
  }

  if (
    state.pipelineStatus === 'running' &&
    state.runGoal === 'full-build' &&
    (state.currentPhase === 'planning' || state.currentPhase === 'plan-review')
  ) {
    return {
      title: 'Run is moving normally',
      detail: 'The team is still before coding. If you want to pause after B approves the plan, ask S to stop after review.',
      actionLabel: 'Stop after review',
      chatCommand: 'stop after review',
      severity: 'info',
    };
  }

  if (state.buildComplete) {
    return {
      title: 'Build complete',
      detail: 'The team finished successfully. Inspect the output or ask a specialist for follow-up changes.',
      actionLabel: 'Review output',
      severity: 'success',
    };
  }

  if (state.pipelineStatus === 'idle' && state.concept) {
    return {
      title: 'Concept captured',
      detail: 'The idea is staged and ready. Tell S to start planning or start the full build when you are ready.',
      actionLabel: 'Start planning',
      chatCommand: 'start planning',
      severity: 'info',
    };
  }

  if (state.pipelineStatus === 'failed' || (latestFailure && state.pipelineStatus !== 'idle')) {
    return {
      title: 'Something needs attention',
      detail: latestFailure?.text || 'The last run surfaced an issue. Ask S what happened or stop/reset the run if it is wedged.',
      actionLabel: 'Ask S what happened',
      chatCommand: 'What went wrong, and what should we do next?',
      severity: 'warning',
    };
  }

  return {
    title: 'Tell S what to build',
    detail: 'No run is active yet. Describe the build to S, then start planning when the concept looks right.',
    actionLabel: 'Describe concept',
    severity: 'neutral',
  };
}

export function buildSupervisorSnapshot(
  state: PipelineStateLike,
  pendingApproval: PendingApproval | null
): string {
  const activeTurn = state.runtime?.activeTurn;
  const recommendation = getSupervisorRecommendation(state, pendingApproval);

  return [
    '[LIVE TEAM SNAPSHOT]',
    `Concept: ${state.concept || '(not set yet)'}`,
    `Phase: ${state.currentPhase || 'concept'}`,
    `Pipeline status: ${state.pipelineStatus || 'idle'}`,
    `Security mode: ${state.securityMode || 'fast'}`,
    `Run goal: ${state.runGoal || 'full-build'}`,
    `Stop after phase: ${state.stopAfterPhase || 'none'}`,
    `Active agent: ${state.activeAgent || 'none'}`,
    `Build complete: ${state.buildComplete ? 'yes' : 'no'}`,
    `Agent statuses: ${formatAgentStatuses(state.agentStatus)}`,
    activeTurn
      ? `Active turn: ${activeTurn.agent || '?'} / ${activeTurn.phase || '?'} / ${activeTurn.status || 'running'} / idle prompt "${activeTurn.promptSummary || ''}" / auto-resumes ${activeTurn.autoResumeCount || 0}`
      : 'Active turn: none',
    pendingApproval?.approved === null
      ? `Pending approval: ${pendingApproval.agent} ${pendingApproval.tool} — ${pendingApproval.description}`
      : 'Pending approval: none',
    'Recent events:',
    formatRecentEvents(state.events),
    'Recommended supervisor action:',
    `- ${recommendation.title}: ${recommendation.detail}${recommendation.chatCommand ? ` (try: "${recommendation.chatCommand}")` : ''}`,
    '[END SNAPSHOT]',
  ].join('\n');
}
