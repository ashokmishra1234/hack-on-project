import type { Item } from '@/lib/types';
import type { TrustRecord } from '@/lib/trust';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatINR(n: number) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency', currency: 'INR', maximumFractionDigits: 0,
  }).format(n);
}

function estimatePurchaseDate(ageMonths: number): string {
  const d = new Date();
  d.setMonth(d.getMonth() - ageMonths);
  return d.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' });
}

function trustStars(score: number): number {
  if (score >= 90) return 5;
  if (score >= 80) return 4;
  if (score >= 70) return 3;
  if (score >= 60) return 2;
  return 1;
}

const CONDITION_META: Record<string, { label: string; color: string; bg: string; dots: number }> = {
  like_new: { label: 'Like New', color: '#4ade80', bg: 'rgba(74,222,128,0.12)',  dots: 4 },
  good:     { label: 'Good',     color: '#60a5fa', bg: 'rgba(96,165,250,0.12)',  dots: 3 },
  fair:     { label: 'Fair',     color: '#fbbf24', bg: 'rgba(251,191,36,0.12)',  dots: 2 },
  damaged:  { label: 'Damaged',  color: '#f87171', bg: 'rgba(248,113,113,0.12)', dots: 1 },
};

// ─── Sub-sections ─────────────────────────────────────────────────────────────

function Row({ label, value, valueColor }: { label: string; value: string; valueColor?: string }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <span className="text-xs" style={{ color: 'var(--muted)' }}>{label}</span>
      <span className="text-xs font-semibold text-right" style={{ color: valueColor ?? 'var(--foreground)' }}>
        {value}
      </span>
    </div>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[10px] font-bold uppercase tracking-widest mb-2" style={{ color: 'var(--muted)' }}>
      {children}
    </p>
  );
}

function Divider() {
  return <div className="h-px w-full my-3" style={{ background: 'var(--border)' }} />;
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function HealthCard({
  item,
  trustRecord,
}: {
  item: Item;
  trustRecord: TrustRecord;
}) {
  const assessment = item.assessment;
  const grade = assessment?.grade;
  const riskFlags = assessment?.riskFlags ?? [];
  const condMeta = grade ? (CONDITION_META[grade.condition] ?? CONDITION_META.fair) : CONDITION_META.fair;
  const isInWarranty = item.ageMonths < 12;
  const stars = trustStars(trustRecord.score);
  const isTrusted = trustRecord.score >= 75;

  const verifiedSteps: { label: string; applicable: boolean }[] = [
    { label: 'Recall-checked',     applicable: true },
    { label: 'Data wipe',          applicable: riskFlags.includes('needs_data_wipe') },
    { label: 'Sanitized',          applicable: riskFlags.includes('needs_sanitization') },
  ];

  return (
    <div
      className="rounded-2xl border w-full overflow-hidden"
      style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}
    >
      {/* ── Card header ──────────────────────────────────────────────────── */}
      <div
        className="px-5 py-4 flex items-center justify-between"
        style={{ background: 'var(--surface-raised)', borderBottom: '1px solid var(--border)' }}
      >
        <div className="flex items-center gap-2">
          <span className="text-lg">🛡</span>
          <div>
            <p className="text-xs font-bold uppercase tracking-widest" style={{ color: 'var(--accent)' }}>
              Product Health Card
            </p>
            <p className="text-[10px]" style={{ color: 'var(--muted)' }}>
              Verified by The Bridge
            </p>
          </div>
        </div>
        <div
          className="flex items-center gap-1 text-[10px] font-bold px-2 py-1 rounded-full"
          style={{ background: 'rgba(74,222,128,0.12)', color: '#4ade80' }}
        >
          ✓ Verified
        </div>
      </div>

      {/* ── Body ─────────────────────────────────────────────────────────── */}
      <div className="px-5 py-4 flex flex-col gap-0">

        {/* Item identity */}
        <div className="mb-3">
          <p className="text-[10px] font-bold uppercase tracking-widest mb-0.5" style={{ color: 'var(--accent)' }}>
            {item.category} · {item.brand}
          </p>
          <p className="text-sm font-bold leading-snug" style={{ color: 'var(--foreground)' }}>
            {item.title}
          </p>
        </div>

        {/* Condition */}
        {grade && (
          <>
            <SectionTitle>Condition</SectionTitle>
            <div className="flex items-center justify-between mb-2">
              <div className="flex gap-1.5">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div
                    key={i}
                    className="w-6 h-1.5 rounded-full"
                    style={{ background: i < condMeta.dots ? condMeta.color : 'var(--surface-raised)' }}
                  />
                ))}
              </div>
              <span
                className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                style={{ background: condMeta.bg, color: condMeta.color }}
              >
                {condMeta.label}
              </span>
            </div>
            <p className="text-xs leading-relaxed mb-1" style={{ color: 'var(--foreground)' }}>
              {grade.summary}
            </p>
            {grade.defects.length > 0 && (
              <div className="flex flex-col gap-0.5 mt-1">
                {grade.defects.map((d, i) => (
                  <p key={i} className="text-xs flex gap-1.5" style={{ color: 'var(--muted)' }}>
                    <span>—</span>{d}
                  </p>
                ))}
              </div>
            )}
            <Divider />
          </>
        )}

        {/* History */}
        <SectionTitle>History</SectionTitle>
        <div className="flex flex-col gap-1 mb-1">
          <Row label="Est. purchased" value={estimatePurchaseDate(item.ageMonths)} />
          <Row label="Age" value={
            item.ageMonths < 12
              ? `${item.ageMonths} months`
              : `${(item.ageMonths / 12).toFixed(1)} years`
          } />
          <Row label="Original price" value={formatINR(item.originalPrice)} />
        </div>
        <Divider />

        {/* Warranty */}
        <SectionTitle>Warranty</SectionTitle>
        <div
          className="flex items-center gap-2 text-xs font-semibold px-2.5 py-1.5 rounded-lg w-fit mb-1"
          style={{
            background: isInWarranty ? 'rgba(74,222,128,0.10)' : 'var(--surface-raised)',
            color: isInWarranty ? '#4ade80' : 'var(--muted)',
          }}
        >
          <span>{isInWarranty ? '✓' : '✗'}</span>
          <span>{isInWarranty ? 'In warranty' : 'Out of warranty'}</span>
        </div>
        <Divider />

        {/* Verified steps */}
        <SectionTitle>Verified steps</SectionTitle>
        <div className="flex flex-col gap-1 mb-1">
          {verifiedSteps.map((s) => (
            <div key={s.label} className="flex items-center gap-2 text-xs">
              <span style={{ color: s.applicable ? '#4ade80' : 'var(--muted)' }}>
                {s.applicable ? '✓' : '—'}
              </span>
              <span style={{ color: s.applicable ? 'var(--foreground)' : 'var(--muted)' }}>
                {s.label} {s.applicable ? '✓' : '(not required)'}
              </span>
            </div>
          ))}
        </div>
        <Divider />

        {/* Seller trust */}
        <SectionTitle>Seller</SectionTitle>
        <div className="flex items-center justify-between">
          <div className="flex flex-col gap-0.5">
            <p className="text-xs font-semibold" style={{ color: 'var(--foreground)' }}>Arjun V.</p>
            <div className="flex gap-0.5">
              {Array.from({ length: 5 }).map((_, i) => (
                <span key={i} className="text-xs" style={{ color: i < stars ? '#fbbf24' : 'var(--border)' }}>
                  ★
                </span>
              ))}
            </div>
            <p className="text-[10px]" style={{ color: 'var(--muted)' }}>
              Trust Score: {trustRecord.score}/100 · {trustRecord.totalDeals} deals
            </p>
          </div>
          {isTrusted && (
            <div
              className="flex items-center gap-1 text-[10px] font-bold px-2.5 py-1 rounded-full"
              style={{ background: 'rgba(249,115,22,0.12)', color: 'var(--accent)' }}
            >
              🏆 Trusted Seller
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
