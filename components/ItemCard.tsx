import Link from 'next/link';
import type { Item } from '@/lib/types';

const CATEGORY_ICONS: Record<string, string> = {
  footwear:    '👟',
  baby:        '🍼',
  phones:      '📱',
  clothing:    '🧥',
  kitchen:     '🍳',
  electronics: '💻',
  appliances:  '🔌',
};

const CATEGORY_LABELS: Record<string, string> = {
  footwear:    'Footwear',
  baby:        'Baby & Kids',
  phones:      'Phones',
  clothing:    'Clothing',
  kitchen:     'Kitchen',
  electronics: 'Electronics',
  appliances:  'Appliances',
};

const CONDITION_COLOR: Record<string, string> = {
  like_new: '#4ade80',
  good:     '#60a5fa',
  fair:     '#fbbf24',
  damaged:  '#f87171',
};

function formatINR(amount: number) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount);
}

export default function ItemCard({
  item,
  estimatedValue,
  estimatedCondition,
  actNow = false,
  preEnrolled = false,
}: {
  item: Item;
  estimatedValue?: number;
  estimatedCondition?: string;
  actNow?: boolean;
  preEnrolled?: boolean;
}) {
  const icon  = CATEGORY_ICONS[item.category]  ?? '📦';
  const label = CATEGORY_LABELS[item.category] ?? item.category;
  const age   =
    item.ageMonths < 12
      ? `${item.ageMonths}mo old`
      : `${Math.round(item.ageMonths / 12)}yr old`;

  return (
    <div
      className="rounded-2xl flex flex-col gap-4 p-5 border transition-colors hover:border-orange-500/40"
      style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}
    >
      {/* Icon */}
      <div
        className="w-full aspect-4/3 rounded-xl flex items-center justify-center text-5xl relative"
        style={{ background: 'var(--surface-raised)' }}
      >
        {icon}
        {preEnrolled && (
          <span
            className="absolute top-2 right-2 text-[10px] font-bold px-2 py-0.5 rounded-full"
            style={{ background: 'rgba(74,222,128,0.18)', color: '#4ade80' }}
          >
            Pre-enrolled
          </span>
        )}
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

      {/* Value tracker */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[10px]" style={{ color: 'var(--muted)' }}>Original</p>
            <p
              className="text-xs font-medium"
              style={{
                color: 'var(--muted)',
                textDecoration: estimatedValue !== undefined ? 'line-through' : 'none',
              }}
            >
              {formatINR(item.originalPrice)}
            </p>
          </div>
          {estimatedValue !== undefined && (
            <div className="text-right">
              <p className="text-[10px]" style={{ color: 'var(--muted)' }}>Est. today</p>
              <p
                className="text-sm font-bold"
                style={{ color: actNow ? 'var(--accent)' : 'var(--foreground)' }}
              >
                {formatINR(estimatedValue)}
              </p>
            </div>
          )}
        </div>

        {estimatedCondition && (
          <div
            className="text-[10px] font-semibold px-2 py-0.5 rounded-full w-fit"
            style={{
              background: `${CONDITION_COLOR[estimatedCondition] ?? '#a1a1aa'}1a`,
              color: CONDITION_COLOR[estimatedCondition] ?? 'var(--muted)',
            }}
          >
            {estimatedCondition.replace('_', ' ')}
          </div>
        )}

        {actNow && (
          <div
            className="text-[10px] font-bold px-3 py-1.5 rounded-lg text-center"
            style={{ background: 'rgba(249,115,22,0.10)', color: 'var(--accent)' }}
          >
            ⚡ Value dropping fast — sell now
          </div>
        )}
      </div>

      {/* CTA */}
      <Link
        href={`/item/${item.id}/capture`}
        className="text-xs font-semibold px-4 py-2.5 rounded-full text-center transition-colors"
        style={{ background: 'var(--accent)', color: '#fff' }}
      >
        {preEnrolled ? 'Sell again →' : 'Second life →'}
      </Link>
    </div>
  );
}
