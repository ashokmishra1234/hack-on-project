import type { Item } from '@/lib/types';
import ShopActions from '@/components/ShopActions';

const CONDITION_STYLES: Record<string, { label: string; bg: string; color: string }> = {
  like_new: { label: 'Like New',  bg: 'rgba(74,222,128,0.12)',  color: '#4ade80' },
  good:     { label: 'Good',      bg: 'rgba(249,115,22,0.12)',  color: 'var(--accent)' },
  fair:     { label: 'Fair',      bg: 'rgba(234,179,8,0.12)',   color: '#eab308' },
  damaged:  { label: 'Damaged',   bg: 'rgba(239,68,68,0.12)',   color: '#ef4444' },
};

const CATEGORY_ICONS: Record<string, string> = {
  electronics: '🎧',
  phones:      '📱',
  clothing:    '👕',
  footwear:    '👟',
  kitchen:     '🍳',
  appliances:  '🏠',
  baby:        '🍼',
};

// Chips shown as reasons why the item was recommended
const REASON_STYLES: Record<string, { bg: string; color: string }> = {
  'on your wishlist': { bg: 'rgba(249,115,22,0.15)', color: 'var(--accent)' },
  'brand you know':   { bg: 'rgba(139,92,246,0.15)', color: '#a78bfa' },
  'your size':        { bg: 'rgba(59,130,246,0.15)', color: '#60a5fa' },
  'great price':      { bg: 'rgba(74,222,128,0.12)', color: '#4ade80' },
  'like new':         { bg: 'rgba(74,222,128,0.12)', color: '#4ade80' },
  'right nearby':     { bg: 'rgba(74,222,128,0.12)', color: '#4ade80' },
};

function formatDistance(km: number): string {
  if (km < 2) return '< 2 km away';
  if (km < 50) return `${Math.round(km)} km away`;
  return `${Math.round(km)} km`;
}

export default function ShopItemCard({
  item,
  distanceKm,
  reasons = [],
  activeBuyerId,
  isWishlisted = false,
  isNotified = false,
}: {
  item: Item;
  distanceKm: number | null;
  reasons?: string[];
  activeBuyerId?: string;
  isWishlisted?: boolean;
  isNotified?: boolean;
}) {
  const assessment = item.assessment;
  const grade      = assessment?.grade;
  const condition  = grade?.condition ?? 'good';
  const badge      = CONDITION_STYLES[condition] ?? CONDITION_STYLES.good;
  const icon       = CATEGORY_ICONS[item.category] ?? '📦';

  const resalePrice  = assessment?.price ?? 0;
  const savingAmount = item.originalPrice - resalePrice;
  const savingPct    = Math.round((savingAmount / item.originalPrice) * 100);
  const isNearby     = distanceKm !== null && distanceKm < 50;

  return (
    <div
      className="rounded-2xl overflow-hidden flex flex-col"
      style={{
        background: 'var(--surface)',
        border: `1px solid ${reasons.length > 0 ? 'rgba(249,115,22,0.25)' : 'var(--border)'}`,
      }}
    >
      {/* Photo / icon area */}
      <div
        className="aspect-4/3 flex items-center justify-center relative"
        style={{ background: 'var(--surface-raised)' }}
      >
        {item.photos.length > 0 ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={item.photos[0]}
            alt={item.title}
            className="w-full h-full object-cover"
          />
        ) : (
          <span className="text-5xl">{icon}</span>
        )}

        {/* Condition badge */}
        <span
          className="absolute top-2 left-2 text-xs font-bold px-2 py-0.5 rounded-full"
          style={{ background: badge.bg, color: badge.color, border: `1px solid ${badge.color}40` }}
        >
          {badge.label}
        </span>

        {/* Distance chip */}
        {distanceKm !== null && (
          <span
            className="absolute top-2 right-2 text-xs font-semibold px-2 py-0.5 rounded-full"
            style={{
              background: isNearby ? 'rgba(74,222,128,0.15)' : 'rgba(0,0,0,0.55)',
              color:      isNearby ? '#4ade80'                : 'var(--muted)',
              border:     isNearby ? '1px solid rgba(74,222,128,0.3)' : '1px solid rgba(255,255,255,0.08)',
            }}
          >
            {formatDistance(distanceKm)}
          </span>
        )}
      </div>

      {/* Info */}
      <div className="p-4 flex flex-col gap-2.5 flex-1">
        {/* Reason chips */}
        {reasons.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {reasons.map((reason) => {
              const style = REASON_STYLES[reason] ?? { bg: 'var(--surface-raised)', color: 'var(--muted)' };
              return (
                <span
                  key={reason}
                  className="text-xs font-semibold px-2 py-0.5 rounded-full"
                  style={{ background: style.bg, color: style.color }}
                >
                  {reason}
                </span>
              );
            })}
          </div>
        )}

        {/* Title + brand */}
        <div>
          <p className="text-sm font-semibold leading-snug" style={{ color: 'var(--foreground)' }}>
            {item.title}
          </p>
          <p className="text-xs mt-0.5" style={{ color: 'var(--muted)' }}>
            {item.brand}
            {item.ageMonths > 0 && (
              <span>
                {' · '}
                {item.ageMonths < 12
                  ? `${item.ageMonths}mo old`
                  : `${Math.round(item.ageMonths / 12)}yr old`}
              </span>
            )}
          </p>
        </div>

        {/* Grade summary */}
        {grade?.summary && (
          <p
            className="text-xs leading-relaxed line-clamp-2"
            style={{ color: 'var(--muted)' }}
          >
            {grade.summary}
          </p>
        )}

        {/* Price row */}
        <div className="mt-auto">
          <div className="flex items-baseline gap-2 flex-wrap">
            <span className="text-lg font-black" style={{ color: 'var(--foreground)' }}>
              ₹{resalePrice.toLocaleString('en-IN')}
            </span>
            <span className="text-xs line-through" style={{ color: 'var(--muted)' }}>
              ₹{item.originalPrice.toLocaleString('en-IN')}
            </span>
            {savingPct > 0 && (
              <span
                className="text-xs font-bold px-1.5 py-0.5 rounded-full"
                style={{ background: 'rgba(74,222,128,0.12)', color: '#4ade80' }}
              >
                {savingPct}% off
              </span>
            )}
          </div>
          <p className="text-xs mt-0.5" style={{ color: 'var(--muted)' }}>
            Save ₹{savingAmount.toLocaleString('en-IN')} vs retail
          </p>
        </div>

        {/* Route label */}
        {item.route?.path === 'list_hold' && (
          <div
            className="text-xs px-2.5 py-1.5 rounded-lg"
            style={{ background: 'var(--surface-raised)', color: 'var(--muted)' }}
          >
            Waiting for a nearby buyer
          </div>
        )}
        {item.route?.path === 'ship_direct' && distanceKm !== null && distanceKm < 50 && (
          <div
            className="text-xs px-2.5 py-1.5 rounded-lg"
            style={{
              background: 'rgba(74,222,128,0.08)',
              color: '#4ade80',
              border: '1px solid rgba(74,222,128,0.2)',
            }}
          >
            Direct ship · {item.route.cost.carbonKgSaved.toFixed(0)} kg CO₂ saved
          </div>
        )}

        {/* Buyer actions (wishlist + notify) */}
        {activeBuyerId && resalePrice > 0 && (
          <ShopActions
            buyerId={activeBuyerId}
            category={item.category}
            itemPrice={resalePrice}
            initialWishlisted={isWishlisted}
            initialNotified={isNotified}
          />
        )}
      </div>
    </div>
  );
}
