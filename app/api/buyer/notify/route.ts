import { NextRequest, NextResponse } from 'next/server';
import { getExtendedBuyer, saveExtendedBuyer } from '@/lib/buyer';
import type { NotifyEntry } from '@/lib/buyer';

export async function POST(req: NextRequest) {
  try {
    const { buyerId, category, maxPrice, action } = await req.json() as {
      buyerId: string;
      category: string;
      maxPrice?: number;
      action: 'add' | 'remove';
    };

    const buyer = getExtendedBuyer(buyerId);
    if (!buyer) return NextResponse.json({ error: 'Buyer not found' }, { status: 404 });

    const current: NotifyEntry[] = buyer.notifyList ?? [];
    let updated: NotifyEntry[];

    if (action === 'remove') {
      updated = current.filter((e) => e.category !== category);
    } else {
      // Upsert: update maxPrice if category already exists
      const exists = current.find((e) => e.category === category);
      if (exists) {
        updated = current.map((e) =>
          e.category === category ? { ...e, maxPrice: maxPrice ?? e.maxPrice } : e,
        );
      } else {
        updated = [...current, { category, maxPrice: maxPrice ?? 0 }];
      }
    }

    const updatedBuyer = { ...buyer, notifyList: updated };
    saveExtendedBuyer(updatedBuyer);

    return NextResponse.json({ ok: true, notifyList: updated });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
