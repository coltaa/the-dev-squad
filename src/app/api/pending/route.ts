import { readFileSync, readdirSync, statSync } from 'fs';
import { join } from 'path';
import { homedir } from 'os';
import { NextResponse } from 'next/server';

const BUILDS_DIR = join(homedir(), 'Builds');

export async function GET() {
  try {
    const dirs = readdirSync(BUILDS_DIR)
      .map(name => join(BUILDS_DIR, name))
      .filter(p => {
        try { return statSync(p).isDirectory() && statSync(join(p, 'pipeline-pending.json')).isFile(); }
        catch { return false; }
      })
      .sort((a, b) => statSync(join(b, 'pipeline-pending.json')).mtimeMs - statSync(join(a, 'pipeline-pending.json')).mtimeMs);

    if (dirs.length > 0) {
      const data = readFileSync(join(dirs[0], 'pipeline-pending.json'), 'utf8');
      return NextResponse.json(JSON.parse(data));
    }
  } catch {}
  return NextResponse.json(null);
}
