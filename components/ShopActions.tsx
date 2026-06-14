'use client';

import { useState } from 'react';

type Props = {
  buyerId: string;
  category: string;
  itemPrice: number;
  initialWishlisted: boolean;
  initialNotified: boolean;
};

export default function ShopActions({
  buyerId,
  category,
  itemPrice,
  initialWishlisted,
  initialNotified,
}: Props) {
  const [wishlisted, setWishlisted] = useState(initialWishlisted);
  const [notified, setNotified]     = useState(initialNotified);
  const [loading, setLoading]       = useState<'wish' | 'notify' | null>(null);

  async function toggleWishlist() {
    setLoading('wish');
    const action = wishlisted ? 'remove' : 'add';
    try {
      const res = await fetch('/api/buyer/wishlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ buyerId, category, action }),
      });
      if (res.ok) setWishlisted(!wishlisted);
    } finally {
      setLoading(null);
    }
  }

  async function toggleNotify() {
    setLoading('notify');
    const action = notified ? 'remove' : 'add';
    try {
      const res = await fetch('/api/buyer/notify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ buyerId, category, maxPrice: itemPrice, action }),
      });
      if (res.ok) setNotified(!notified);
    } finally {
      setLoading(null);
    }
  }

  return (
    <div className="flex gap-2 mt-1">
      <button
        onClick={toggleWishlist}
        disabled={loading === 'wish'}
        className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-semibold transition-all"
        style={{
          background: wishlisted ? 'rgba(249,115,22,0.15)' : 'var(--surface-raised)',
          color:      wishlisted ? 'var(--accent)'          : 'var(--muted)',
          border:     `1px solid ${wishlisted ? 'rgba(249,115,22,0.35)' : 'var(--border)'}`,
          opacity: loading === 'wish' ? 0.6 : 1,
        }}
        title={wishlisted ? `Remove ${category} from wishlist` : `Add ${category} to wishlist`}
      >
        {wishlisted ? '♥' : '♡'}
        {wishlisted ? ' Saved' : ' Save'}
      </button>

      <button
        onClick={toggleNotify}
        disabled={loading === 'notify'}
        className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-semibold transition-all"
        style={{
          background: notified ? 'rgba(234,179,8,0.12)' : 'var(--surface-raised)',
          color:      notified ? '#eab308'               : 'var(--muted)',
          border:     `1px solid ${notified ? 'rgba(234,179,8,0.3)' : 'var(--border)'}`,
          opacity: loading === 'notify' ? 0.6 : 1,
        }}
        title={notified ? `Stop notifications for ${category}` : `Notify me when ${category} items appear nearby`}
      >
        {notified ? '🔔' : '🔕'}
        {notified ? ' Notified' : ' Notify'}
      </button>
    </div>
  );
}
