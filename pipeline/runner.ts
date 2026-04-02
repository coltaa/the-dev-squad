import { spawn as nodeSpawn, type ChildProcessWithoutNullStreams } from 'node:child_process';

export type PipelineAgentId = 'A' | 'B' | 'C' | 'D' | 'S';

export interface RunnerOptions {
  prompt: string;
  projectDir: string;
  model: string;
  roleFile?: string;
  systemPrompt?: string;
  resume?: string;
  jsonSchema?: Record<string, unknown>;
  effort?: string;
  pipelineAgent?: PipelineAgentId;
  securityMode?: 'fast' | 'strict';
  extraEnv?: NodeJS.ProcessEnv;
}

export type RunnerChild = Pick<
  ChildProcessWithoutNullStreams,
  'stdout' | 'stderr' | 'on' | 'kill'
>;

export interface Runner {
  spawn(opts: RunnerOptions): RunnerChild;
  cleanup(projectDir: string): Promise<void>;
  isAvailable(): boolean;
}

function hasValue(value: string | undefined): value is string {
  return typeof value === 'string' && value.length > 0;
}

export function buildClaudeArgs(opts: RunnerOptions): string[] {
  if (!hasValue(opts.roleFile) && !hasValue(opts.systemPrompt)) {
    throw new Error('RunnerOptions requires either roleFile or systemPrompt');
  }

  const args: string[] = [
    '-p', opts.prompt,
    '--permission-mode', 'auto',
    '--model', opts.model,
    '--output-format', 'stream-json',
    '--verbose',
  ];

  if (hasValue(opts.roleFile)) {
    args.push('--system-prompt-file', opts.roleFile);
  } else if (hasValue(opts.systemPrompt)) {
    args.push('--system-prompt', opts.systemPrompt);
  }

  if (hasValue(opts.effort)) {
    args.push('--effort', opts.effort);
  }

  if (hasValue(opts.resume)) {
    args.push('--resume', opts.resume);
  }

  if (opts.jsonSchema) {
    args.push('--json-schema', JSON.stringify(opts.jsonSchema));
  }

  return args;
}

export function buildRunnerEnv(opts: RunnerOptions): NodeJS.ProcessEnv {
  const env: NodeJS.ProcessEnv = {
    ...process.env,
    ...opts.extraEnv,
    // Reset Claude's working directory after each Bash command so a `cd`
    // does not persist into later Write/Edit tool calls.
    CLAUDE_BASH_MAINTAIN_PROJECT_WORKING_DIR: '1',
  };

  if (hasValue(opts.pipelineAgent)) {
    env.PIPELINE_AGENT = opts.pipelineAgent;
  }

  if (hasValue(opts.securityMode)) {
    env.PIPELINE_SECURITY_MODE = opts.securityMode;
  }

  return env;
}

export class HostRunner implements Runner {
  spawn(opts: RunnerOptions): RunnerChild {
    return nodeSpawn('claude', buildClaudeArgs(opts), {
      cwd: opts.projectDir,
      stdio: ['pipe', 'pipe', 'pipe'],
      env: buildRunnerEnv(opts),
    });
  }

  async cleanup(_projectDir: string): Promise<void> {
    // Phase 1 host runner has no external resources to clean up.
    void _projectDir;
  }

  isAvailable(): boolean {
    return true;
  }
}

export function createRunner(mode: string = process.env.PIPELINE_RUNNER || 'host'): Runner {
  const requested = mode.toLowerCase();

  if (requested === 'docker') {
    throw new Error('PIPELINE_RUNNER=docker is not implemented yet. Start with PIPELINE_RUNNER=host or auto.');
  }

  return new HostRunner();
}
