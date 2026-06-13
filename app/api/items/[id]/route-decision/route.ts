import { NextRequest, NextResponse } from 'next/server';
import { getItem, saveItem } from '@/lib/store';
import type { RouteDecision } from '@/lib/types';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const item = getItem(id);
    if (!item) return NextResponse.json({ error: 'Item not found' }, { status: 404 });

    const body = await req.json();
    const route = body.route as RouteDecision;
    if (!route?.path) {
      return NextResponse.json({ error: 'route.path is required' }, { status: 400 });
    }

    item.route = route;
    saveItem(item);

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('[route-decision] error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
