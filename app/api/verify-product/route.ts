import { NextRequest, NextResponse } from 'next/server';
import { getItem, saveItem } from '@/lib/store';
import { verifyProduct, getVerificationStatus } from '@/lib/verify';
import { recordMismatch } from '@/lib/trust';
import type { VerificationRecord } from '@/lib/types';

export async function POST(req: NextRequest) {
  if (!process.env.GEMINI_API_KEY) {
    return NextResponse.json(
      { error: 'GEMINI_API_KEY not configured' },
      { status: 503 },
    );
  }

  try {
    const { itemId } = await req.json() as { itemId: string };
    const item = getItem(itemId);
    if (!item) return NextResponse.json({ error: 'Item not found' }, { status: 404 });
    if (item.photos.length === 0) {
      return NextResponse.json({ error: 'No photos to verify' }, { status: 400 });
    }

    // Call Gemini for identity check
    const result = await verifyProduct({
      photos: item.photos,
      title: item.title,
      brand: item.brand,
      category: item.category,
      referenceImage: item.referenceImage,
    });

    const status = getVerificationStatus(result);
    const existing = item.verification;

    // Track consecutive failures (resets to 0 on pass/needs_review)
    const consecutiveFailures =
      status === 'fail'
        ? (existing?.consecutiveFailures ?? 0) + 1
        : 0;

    const flaggedForReview = consecutiveFailures >= 2;
    const wasAlreadyFlagged = existing?.flaggedForReview ?? false;

    // Apply trust penalty exactly once when newly flagged
    if (flaggedForReview && !wasAlreadyFlagged) {
      recordMismatch('user-current');
    }

    const record: VerificationRecord = {
      status,
      result,
      consecutiveFailures,
      flaggedForReview,
      identityVerified: status === 'pass',
      verifiedAt: new Date().toISOString(),
    };

    item.verification = record;
    saveItem(item);

    return NextResponse.json({
      status,
      result,
      consecutiveFailures,
      flaggedForReview,
    });
  } catch (err) {
    console.error('[verify-product] error:', err);
    return NextResponse.json({ error: 'Verification failed', detail: String(err) }, { status: 500 });
  }
}
