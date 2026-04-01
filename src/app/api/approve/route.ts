import { readFileSync, writeFileSync, readdirSync, statSync } from 'fs';
import { join } from 'path';
import { homedir } from 'os';
import { NextRequest, NextResponse } from 'next/server';

const BUILDS_DIR = join(homedir(), 'Builds');

function findLatestProject(): string | null {
  try {
    const dirs = readdirSync(BUILDS_DIR)
      .map(name => join(BUILDS_DIR, name))
      .filter(p => {
        try { return statSync(p).isDirectory() && statSync(join(p, 'pipeline-pending.json')).isFile(); }
        catch { return false; }
      })
      .sort((a, b) => statSync(join(b, 'pipeline-pending.json')).mtimeMs - statSync(join(a, 'pipeline-pending.json')).mtimeMs);
    return dirs[0] || null;
  } catch { return null; }
}

export async function POST(req: NextRequest) {
  const { approved } = await req.json();
  const projectDir = findLatestProject();
  if (!projectDir) return NextResponse.json({ success: false });

  const pendingPath = join(projectDir, 'pipeline-pending.json');
  try {
    const pending = JSON.parse(readFileSync(pendingPath, 'utf8'));
    pending.approved = !!approved;
    writeFileSync(pendingPath, JSON.stringify(pending, null, 2));
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ success: false });
  }
}
