import { rmSync, existsSync, readdirSync, readFileSync, writeFileSync, statSync } from 'fs';
import { join } from 'path';
import { homedir } from 'os';
import { NextResponse } from 'next/server';

const BUILDS_DIR = join(homedir(), 'Builds');
const STAGING_DIR = join(BUILDS_DIR, '.staging');

export async function POST() {
  try {
    // Clear staging
    if (existsSync(STAGING_DIR)) {
      rmSync(STAGING_DIR, { recursive: true, force: true });
    }

    // Reset any active project (non-concept, non-complete) back to concept phase
    try {
      const dirs = readdirSync(BUILDS_DIR)
        .filter(name => name !== '.staging')
        .map(name => join(BUILDS_DIR, name))
        .filter(p => {
          try { return statSync(p).isDirectory() && statSync(join(p, 'pipeline-events.json')).isFile(); }
          catch { return false; }
        });

      for (const dir of dirs) {
        try {
          const eventsFile = join(dir, 'pipeline-events.json');
          const state = JSON.parse(readFileSync(eventsFile, 'utf8'));
          if (state.currentPhase && state.currentPhase !== 'concept' && !state.buildComplete) {
            state.currentPhase = 'concept';
            state.activeAgent = '';
            state.agentStatus = { A: 'idle', B: 'idle', C: 'idle', D: 'idle', S: 'idle' };
            writeFileSync(eventsFile, JSON.stringify(state, null, 2));
          }
        } catch {}
      }
    } catch {}

    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json({ ok: false, error: String(err) }, { status: 500 });
  }
}
