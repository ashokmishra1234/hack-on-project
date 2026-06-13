import { NextRequest, NextResponse } from 'next/server';
import { getItem, saveItem, getBuyers } from '@/lib/store';
import { gradePhotos } from '@/lib/grader';
import { computePrice } from '@/lib/pricing';
import { matchBuyer } from '@/lib/matching';
import { getRiskFlags } from '@/lib/risk';
import { computeRoute } from '@/lib/router';
import type { Assessment, RouteDecision } from '@/lib/types';

export type AssessResponse = {
  assessment: Assessment;
  route: RouteDecision;
  buyer: { id: string; name: string; city: string } | null;
};

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const item = getItem(id);
    if (!item) return NextResponse.json({ error: 'Item not found' }, { status: 404 });

    const buyers = getBuyers();

    // ── Return cached result if already graded ───────────────────────────────
    if (item.assessment) {
      const route = computeRoute(item, item.assessment, buyers); // always recompute (pure fn)
      const buyer = item.assessment.matchedBuyerId
        ? (buyers.find((b) => b.id === item.assessment!.matchedBuyerId) ?? null)
        : null;
      return NextResponse.json({
        assessment: item.assessment,
        route,
        buyer: buyer ? { id: buyer.id, name: buyer.name, city: buyer.location.city } : null,
      } satisfies AssessResponse);
    }

    if (item.photos.length === 0) {
      return NextResponse.json({ error: 'No photos to grade' }, { status: 400 });
    }

    // ── 1. AI grading ────────────────────────────────────────────────────────
    const grade = await gradePhotos(item.photos);

    // ── 2. Buyer matching + demand score ─────────────────────────────────────
    const { matchedBuyerId, nearbyDemand } = matchBuyer(item, buyers);

    // ── 3. Resale price ──────────────────────────────────────────────────────
    const price = computePrice(item.originalPrice, grade.condition, nearbyDemand);

    // ── 4. Risk flags ────────────────────────────────────────────────────────
    const riskFlags = getRiskFlags(item);

    // ── 5. Assemble & persist assessment ─────────────────────────────────────
    const assessment: Assessment = { grade, price, matchedBuyerId, nearbyDemand, riskFlags };
    item.assessment = assessment;
    saveItem(item);

    // ── 6. Compute route (not saved until user confirms) ──────────────────────
    const route = computeRoute(item, assessment, buyers);

    const matchedBuyer = matchedBuyerId
      ? (buyers.find((b) => b.id === matchedBuyerId) ?? null)
      : null;

    return NextResponse.json({
      assessment,
      route,
      buyer: matchedBuyer
        ? { id: matchedBuyer.id, name: matchedBuyer.name, city: matchedBuyer.location.city }
        : null,
    } satisfies AssessResponse);
  } catch (err) {
    console.error('[assess] error:', err);
    return NextResponse.json({ error: 'Assessment failed', detail: String(err) }, { status: 500 });
  }
}
