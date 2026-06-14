import { NextRequest, NextResponse } from 'next/server';
import { getItem, getBuyers, saveItem } from '@/lib/store';
import { recordDeal } from '@/lib/trust';
import { awardCredits } from '@/lib/green';
import type { GreenAction } from '@/lib/green';
import type { Item, RouteDecision } from '@/lib/types';

function routeToAction(routePath: string): GreenAction {
  switch (routePath) {
    case 'ship_direct': return 'resell';
    case 'refurbish':
    case 'repair':      return 'buy_refurbished';
    case 'donate':      return 'donate';
    case 'recycle':     return 'recycle';
    default:            return 'resell';
  }
}

function buildDescription(item: Item, action: GreenAction): string {
  const name = item.title.split('—')[0].trim();
  switch (action) {
    case 'resell':          return `Sold ${name} directly to buyer`;
    case 'buy_refurbished': return `${name} routed for refurbishment`;
    case 'donate':          return `Donated ${name} to local NGO`;
    case 'recycle':         return `Recycled ${name} responsibly`;
    default:                return `${name} given a second life`;
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const item = getItem(id);
    if (!item) return NextResponse.json({ error: 'Item not found' }, { status: 404 });
    if (!item.assessment) return NextResponse.json({ error: 'Item not assessed' }, { status: 400 });

    const { route } = await req.json() as { route: RouteDecision };
    if (!route?.path) return NextResponse.json({ error: 'route required' }, { status: 400 });

    // Save route decision
    item.route = route;
    saveItem(item);

    // Record deal
    const { record, delta } = recordDeal('user-current', 'accept');

    // Award green credits
    const action = routeToAction(route.path);
    const co2KgAvoided = route.cost.carbonKgSaved;
    const { entry } = awardCredits({
      userId: 'user-current',
      itemId: item.id,
      action,
      co2KgAvoided,
      description: buildDescription(item, action),
    });

    let newItemId: string | null = null;
    let buyerCity: string | null = null;

    // The Loop: pre-enroll for buyer on ship_direct
    if (route.path === 'ship_direct' && item.assessment.matchedBuyerId) {
      const buyers = getBuyers();
      const buyer = buyers.find((b) => b.id === item.assessment!.matchedBuyerId);
      buyerCity = buyer?.location.city ?? null;

      const loopItem: Item = {
        id: `${item.id}-r2`,
        title: item.title,
        category: item.category,
        brand: item.brand,
        originalPrice: item.assessment.price,
        ageMonths: item.ageMonths,
        location: buyer?.location ?? item.location,
        ownerId: item.assessment.matchedBuyerId,
        photos: item.photos,
        assessment: item.assessment,
      };
      saveItem(loopItem);
      newItemId = loopItem.id;
    }

    return NextResponse.json({
      ok: true,
      credits: entry.credits,
      co2KgAvoided,
      newScore: record.score,
      delta,
      buyerCity,
      newItemId,
    });
  } catch (err) {
    console.error('[accept-all] error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
