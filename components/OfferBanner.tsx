import type { ProactiveOffer } from '@/lib/buyer';

const CONDITION_LABELS: Record<string, string> = {
  like_new: 'like-new',
  good: 'good-condition',
  fair: 'fair-condition',
  damaged: 'damaged',
};

function formatKm(km: number): string {
  if (km < 1) return 'less than 1 km';
  return `${Math.round(km)} km`;
}

export default function OfferBanner({ offers }: { offers: ProactiveOffer[] }) {
  if (offers.length === 0) return null;

  return (
    <div
      className="rounded-2xl p-4 mb-6"
      style={{
        background: 'rgba(234,179,8,0.07)',
        border: '1px solid rgba(234,179,8,0.25)',
      }}
    >
      <div className="flex items-center gap-2 mb-3">
        <span className="text-lg">🔔</span>
        <span className="text-sm font-bold" style={{ color: '#eab308' }}>
          {offers.length === 1 ? 'New for you' : `${offers.length} new matches`}
        </span>
        <span
          className="text-xs px-1.5 py-0.5 rounded-full font-medium"
          style={{ background: 'rgba(234,179,8,0.15)', color: '#eab308' }}
        >
          from your notify list
        </span>
      </div>

      <div className="flex flex-col gap-2">
        {offers.map(({ item, distanceKm, saving }) => {
          const condition = item.assessment?.grade?.condition ?? 'good';
          const price     = item.assessment?.price ?? 0;
          return (
            <div
              key={item.id}
              className="flex items-start gap-3 rounded-xl p-3"
              style={{ background: 'rgba(0,0,0,0.2)' }}
            >
              <span className="text-2xl shrink-0 mt-0.5">
                {condition === 'like_new' ? '✨' : condition === 'good' ? '👍' : '📦'}
              </span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold leading-snug" style={{ color: 'var(--foreground)' }}>
                  {item.title}
                </p>
                <p className="text-xs mt-0.5" style={{ color: 'var(--muted)' }}>
                  {CONDITION_LABELS[condition] ?? condition} · {formatKm(distanceKm)} away
                </p>
              </div>
              <div className="text-right shrink-0">
                <p className="text-sm font-black" style={{ color: '#eab308' }}>
                  ₹{price.toLocaleString('en-IN')}
                </p>
                {saving > 0 && (
                  <p className="text-xs" style={{ color: 'var(--muted)' }}>
                    ₹{saving.toLocaleString('en-IN')} off
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <p className="text-xs mt-3" style={{ color: 'var(--muted)' }}>
        These items match categories and price limits you set. See them ranked in the grid below.
      </p>
    </div>
  );
}
