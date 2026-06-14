import { NextRequest, NextResponse } from 'next/server';
import { getExtendedBuyer, saveExtendedBuyer } from '@/lib/buyer';

export async function POST(req: NextRequest) {
  try {
    const { buyerId, category, action } = await req.json() as {
      buyerId: string;
      category: string;
      action: 'add' | 'remove';
    };

    const buyer = getExtendedBuyer(buyerId);
    if (!buyer) return NextResponse.json({ error: 'Buyer not found' }, { status: 404 });

    const current = buyer.wishlist ?? [];
    let updated: string[];

    if (action === 'add') {
      updated = current.includes(category) ? current : [...current, category];
    } else {
      updated = current.filter((c) => c !== category);
    }

    const updatedBuyer = { ...buyer, wishlist: updated };
    saveExtendedBuyer(updatedBuyer);

    return NextResponse.json({ ok: true, wishlist: updated });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
