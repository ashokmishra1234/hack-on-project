import Link from 'next/link';
import type { Item } from '@/lib/types';

const CATEGORY_ICONS: Record<string, string> = {
  footwear: '👟',
  baby: '🍼',
  phones: '📱',
  clothing: '🧥',
  kitchen: '🍳',
  electronics: '💻',
  appliances: '🔌',
};

const CATEGORY_LABELS: Record<string, string> = {
  footwear: 'Footwear',
  baby: 'Baby & Kids',
  phones: 'Phones',
  clothing: 'Clothing',
  kitchen: 'Kitchen',
  electronics: 'Electronics',
  appliances: 'Appliances',
};

function formatINR(amount: number) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount);
}

export default function ItemCard({ item }: { item: Item }) {
  const icon = CATEGORY_ICONS[item.category] ?? '📦';
  const label = CATEGORY_LABELS[item.category] ?? item.category;
  const age =
    item.ageMonths < 12
      ? `${item.ageMonths}mo old`
      : `${Math.round(item.ageMonths / 12)}yr old`;

  return (
    <div
      className="rounded-2xl flex flex-col gap-4 p-5 border transition-colors hover:border-orange-500/40"
      style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}
    >
      {/* Icon / photo placeholder */}
      <div
        className="w-full aspect-[4/3] rounded-xl flex items-center justify-center text-5xl"
        style={{ background: 'var(--surface-raised)' }}
      >
        {icon}
      </div>

      {/* Meta */}
      <div className="flex-1 flex flex-col gap-1">
        <span
          className="text-xs font-semibold uppercase tracking-widest"
          style={{ color: 'var(--accent)' }}
        >
          {label}
        </span>
        <h2
          className="text-sm font-semibold leading-snug"
          style={{ color: 'var(--foreground)' }}
        >
          {item.title}
        </h2>
        <p className="text-xs" style={{ color: 'var(--muted)' }}>
          {item.brand} · {age}
        </p>
      </div>

      {/* Price row */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs" style={{ color: 'var(--muted)' }}>
            Original price
          </p>
          <p className="text-sm font-bold" style={{ color: 'var(--foreground)' }}>
            {formatINR(item.originalPrice)}
          </p>
        </div>

        <Link
          href={`/item/${item.id}/capture`}
          className="text-xs font-semibold px-4 py-2 rounded-full transition-colors"
          style={{ background: 'var(--accent)', color: '#fff' }}
        >
          Second life →
        </Link>
      </div>
    </div>
  );
}
