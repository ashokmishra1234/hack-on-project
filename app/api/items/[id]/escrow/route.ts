import { NextRequest, NextResponse } from 'next/server';
import { getItem } from '@/lib/store';
import { recordDeal } from '@/lib/trust';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const item = getItem(id);
    if (!item) return NextResponse.json({ error: 'Item not found' }, { status: 404 });

    const { outcome } = await req.json() as { outcome: 'accept' | 'dispute' };
    if (outcome !== 'accept' && outcome !== 'dispute') {
      return NextResponse.json({ error: 'outcome must be accept or dispute' }, { status: 400 });
    }

    const { record, delta } = recordDeal('user-current', outcome);

    return NextResponse.json({
      ok: true,
      outcome,
      newScore: record.score,
      delta,
      totalDeals: record.totalDeals,
    });
  } catch (err) {
    console.error('[escrow] error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
