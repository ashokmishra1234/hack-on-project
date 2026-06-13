// Placeholder for Layer 4: escrow, trust verification, and Green Credits.

import { getItem } from '@/lib/store';
import { notFound } from 'next/navigation';
import Link from 'next/link';

const PATH_META: Record<string, { icon: string; label: string }> = {
  ship_direct: { icon: '🚀', label: 'Ship Direct' },
  refurbish:   { icon: '🔧', label: 'Refurbish'   },
  repair:      { icon: '🔨', label: 'Repair First' },
  donate:      { icon: '🤝', label: 'Donate'       },
  recycle:     { icon: '♻',  label: 'Recycle'      },
  list_hold:   { icon: '⏸',  label: 'Hold & List'  },
};

export default async function ConfirmPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const item = getItem(id);
  if (!item) notFound();

  const route = item.route;
  const meta = route ? (PATH_META[route.path] ?? { icon: '✓', label: route.path }) : null;

  return (
    <div className="flex flex-col items-center gap-8 py-16 max-w-sm mx-auto text-center">
      <div
        className="w-20 h-20 rounded-2xl flex items-center justify-center text-4xl"
        style={{ background: 'var(--surface)' }}
      >
        {meta?.icon ?? '✓'}
      </div>

      <div className="flex flex-col gap-2">
        <p
          className="text-xs font-semibold uppercase tracking-widest"
          style={{ color: 'var(--accent)' }}
        >
          Route confirmed
        </p>
        <h1 className="text-xl font-bold" style={{ color: 'var(--foreground)' }}>
          {meta?.label ?? 'Confirmed'}
        </h1>
        <p className="text-sm leading-relaxed" style={{ color: 'var(--muted)' }}>
          {route?.reason ?? 'Your route decision has been saved.'}
        </p>
      </div>

      <div
        className="w-full rounded-2xl p-5 border text-left flex flex-col gap-2"
        style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}
      >
        <p
          className="text-xs font-semibold uppercase tracking-widest"
          style={{ color: 'var(--accent)' }}
        >
          Coming in Layer 4
        </p>
        {[
          'Buyer trust verification & escrow',
          'Pickup scheduling',
          'Green Credits reward calculation',
          'Owner dashboard & ledger',
        ].map((t) => (
          <p key={t} className="text-xs flex gap-2" style={{ color: 'var(--muted)' }}>
            <span style={{ color: 'var(--border)' }}>—</span> {t}
          </p>
        ))}
      </div>

      <Link
        href="/"
        className="text-sm font-semibold px-6 py-2.5 rounded-full"
        style={{ background: 'var(--accent)', color: '#fff' }}
      >
        ← Back to My Items
      </Link>
    </div>
  );
}
