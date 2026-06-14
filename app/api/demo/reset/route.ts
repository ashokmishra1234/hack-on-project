import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const DATA = path.join(process.cwd(), 'data');

export async function POST() {
  try {
    // Restore items from seed (removes all photos, assessments, and loop items)
    const seed = fs.readFileSync(path.join(DATA, 'items.seed.json'), 'utf-8');
    fs.writeFileSync(path.join(DATA, 'items.json'), seed, 'utf-8');

    // Reset trust score to initial demo state
    const trustSeed = {
      'user-current': {
        userId: 'user-current',
        score: 85,
        totalDeals: 3,
        acceptedDeals: 3,
        disputeCount: 0,
        lastUpdated: new Date().toISOString(),
      },
    };
    fs.writeFileSync(
      path.join(DATA, 'trust.json'),
      JSON.stringify(trustSeed, null, 2),
      'utf-8',
    );

    // Clear green credits ledger
    fs.writeFileSync(path.join(DATA, 'green.json'), '{}', 'utf-8');

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('[reset] error:', err);
    return NextResponse.json({ error: 'Reset failed' }, { status: 500 });
  }
}
