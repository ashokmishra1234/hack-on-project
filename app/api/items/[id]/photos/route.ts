import { NextRequest, NextResponse } from 'next/server';
import { getItem, saveItem } from '@/lib/store';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const item = getItem(id);
    if (!item) {
      return NextResponse.json({ error: 'Item not found' }, { status: 404 });
    }

    const body = await req.json();
    const photos: string[] = Array.isArray(body.photos) ? body.photos : [];

    item.photos = photos;
    saveItem(item);

    return NextResponse.json({ ok: true, photoCount: photos.length });
  } catch (err) {
    console.error('[photos] save error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
