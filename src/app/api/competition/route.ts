import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const OVERRIDE_FILE = path.join(process.cwd(), 'public', 'data', 'competition_override.json');
const IPO_LIST_FILE = path.join(process.cwd(), 'public', 'data', 'ipo_list.json');

function readOverrides() {
  try {
    return JSON.parse(fs.readFileSync(OVERRIDE_FILE, 'utf-8'));
  } catch {
    return {};
  }
}

export async function GET() {
  const overrides = readOverrides();
  let ipoList = [];
  try {
    ipoList = JSON.parse(fs.readFileSync(IPO_LIST_FILE, 'utf-8'));
  } catch {
    ipoList = [];
  }
  return NextResponse.json({ ipoList, overrides });
}

export async function POST(req: NextRequest) {
  const { id, totalCompetition, competitionData } = await req.json();

  if (!id) {
    return NextResponse.json({ error: 'id required' }, { status: 400 });
  }

  const overrides = readOverrides();

  if (!totalCompetition && (!competitionData || competitionData.length === 0)) {
    // Delete override entry if both fields are empty
    delete overrides[id];
  } else {
    overrides[id] = {
      ...(totalCompetition ? { totalCompetition } : {}),
      ...(competitionData && competitionData.length > 0 ? { competitionData } : {}),
    };
  }

  fs.writeFileSync(OVERRIDE_FILE, JSON.stringify(overrides, null, 2));
  return NextResponse.json({ ok: true, overrides });
}
