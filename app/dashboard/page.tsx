import { getTrustRecord, isTrustedSeller } from '@/lib/trust';
import { getGreenRecord } from '@/lib/green';
import { ACTION_CREDITS } from '@/lib/green';
import ResetButton from '@/components/ResetButton';
import Link from 'next/link';

const ACTION_LABEL: Record<string, string> = {
  prevent_a_return: 'Prevented return',
  resell:           'Direct resale',
  buy_refurbished:  'Refurbished sale',
  donate:           'Donation',
  recycle:          'Recycled',
};

function StatBox({
  label,
  value,
  sub,
  accent,
}: {
  label: string;
  value: string;
  sub?: string;
  accent?: boolean;
}) {
  return (
    <div
      className="rounded-2xl border p-5 flex flex-col gap-1"
      style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}
    >
      <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: 'var(--muted)' }}>
        {label}
      </p>
      <p
        className="text-4xl font-black"
        style={{ color: accent ? 'var(--accent)' : 'var(--foreground)' }}
      >
        {value}
      </p>
      {sub && (
        <p className="text-xs" style={{ color: 'var(--muted)' }}>
          {sub}
        </p>
      )}
    </div>
  );
}

export default function DashboardPage() {
  const trust = getTrustRecord('user-current');
  const green = getGreenRecord('user-current');
  const trusted = isTrustedSeller(trust.score);

  const trees = (green.totalCo2Kg / 21).toFixed(1);
  const recent = green.entries.slice(0, 5);

  return (
    <div className="flex flex-col gap-8 max-w-2xl mx-auto w-full">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: 'var(--foreground)' }}>
            Your Impact
          </h1>
          <p className="text-sm mt-0.5" style={{ color: 'var(--muted)' }}>
            Arjun V. · {trust.totalDeals} deals completed
          </p>
        </div>
        <ResetButton />
      </div>

      {/* Top stats */}
      <div className="grid grid-cols-2 gap-4">
        <StatBox
          label="Trust Score"
          value={`${trust.score}`}
          sub={trusted ? '🏆 Trusted Seller' : `${trust.totalDeals} deals · ${trust.disputeCount} disputes`}
          accent={trusted}
        />
        <StatBox
          label="Green Credits"
          value={`${green.totalCredits}`}
          sub={green.entries.length > 0 ? `${green.entries.length} credits awarded` : 'Complete your first deal'}
          accent={false}
        />
      </div>

      {/* CO₂ card */}
      <div
        className="rounded-2xl border p-5 flex flex-col gap-3"
        style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}
      >
        <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: 'var(--muted)' }}>
          Climate Impact
        </p>
        <div className="flex items-end gap-3">
          <span className="text-5xl font-black" style={{ color: '#4ade80' }}>
            {green.totalCo2Kg.toFixed(1)}
          </span>
          <span className="text-lg font-semibold mb-1" style={{ color: 'var(--foreground)' }}>
            kg CO₂ avoided
          </span>
        </div>
        <p className="text-sm" style={{ color: 'var(--muted)' }}>
          ≈ {trees} trees absorbing carbon for a full year
        </p>
        <div
          className="w-full rounded-full h-2 overflow-hidden"
          style={{ background: 'var(--surface-raised)' }}
        >
          <div
            className="h-full rounded-full"
            style={{
              width: `${Math.min(100, (green.totalCo2Kg / 200) * 100)}%`,
              background: 'linear-gradient(to right, #4ade80, #22c55e)',
            }}
          />
        </div>
        <p className="text-[10px]" style={{ color: 'var(--muted)' }}>
          Goal: 200 kg CO₂ · {(200 - green.totalCo2Kg).toFixed(1)} kg to go
        </p>
      </div>

      {/* Credits breakdown */}
      <div
        className="rounded-2xl border p-5 flex flex-col gap-4"
        style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}
      >
        <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: 'var(--muted)' }}>
          Credits per action
        </p>
        <div className="flex flex-col gap-2">
          {(Object.entries(ACTION_CREDITS) as [string, number][]).map(([action, base]) => (
            <div key={action} className="flex items-center justify-between">
              <span className="text-sm" style={{ color: 'var(--foreground)' }}>
                {ACTION_LABEL[action] ?? action}
              </span>
              <span
                className="text-xs font-bold px-2.5 py-1 rounded-full"
                style={{ background: 'rgba(249,115,22,0.10)', color: 'var(--accent)' }}
              >
                {base}+ credits
              </span>
            </div>
          ))}
          <p className="text-xs mt-1" style={{ color: 'var(--muted)' }}>
            + 1 credit per kg CO₂ avoided
          </p>
        </div>
      </div>

      {/* Recent activity */}
      {recent.length > 0 && (
        <div
          className="rounded-2xl border p-5 flex flex-col gap-3"
          style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}
        >
          <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: 'var(--muted)' }}>
            Recent activity
          </p>
          <div className="flex flex-col gap-2">
            {recent.map((e) => (
              <div
                key={e.id}
                className="flex items-start justify-between gap-4 py-2.5 border-b last:border-0"
                style={{ borderColor: 'var(--border)' }}
              >
                <div className="flex flex-col gap-0.5">
                  <p className="text-sm" style={{ color: 'var(--foreground)' }}>
                    {e.description}
                  </p>
                  <p className="text-xs" style={{ color: 'var(--muted)' }}>
                    {new Date(e.createdAt).toLocaleDateString('en-IN', {
                      day: 'numeric', month: 'short', year: 'numeric',
                    })}
                    {' · '}
                    {e.co2KgAvoided.toFixed(1)} kg CO₂ avoided
                  </p>
                </div>
                <span
                  className="text-sm font-bold shrink-0"
                  style={{ color: '#4ade80' }}
                >
                  +{e.credits}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {recent.length === 0 && (
        <div className="text-center py-8 flex flex-col gap-2">
          <span className="text-4xl">🌱</span>
          <p className="text-sm" style={{ color: 'var(--muted)' }}>
            Complete your first deal to earn Green Credits.
          </p>
          <Link
            href="/"
            className="text-sm font-semibold mt-2 inline-block"
            style={{ color: 'var(--accent)' }}
          >
            Give an item a second life →
          </Link>
        </div>
      )}
    </div>
  );
}
