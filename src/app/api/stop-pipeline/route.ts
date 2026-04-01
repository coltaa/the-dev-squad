import { NextResponse } from 'next/server';
import { execSync } from 'child_process';

export async function POST() {
  try {
    // Kill orchestrator and any claude sessions it spawned
    // Use specific patterns that won't match the dev server
    execSync('pkill -f "tsx.*orchestrator\\.ts" 2>/dev/null || true', { encoding: 'utf8' });
    execSync('pkill -f "claude.*--output-format.*stream-json" 2>/dev/null || true', { encoding: 'utf8' });
  } catch {}
  return NextResponse.json({ success: true });
}
