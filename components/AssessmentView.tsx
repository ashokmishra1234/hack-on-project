'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import type { Assessment, RouteDecision } from '@/lib/types';
import type { AssessResponse } from '@/app/api/items/[id]/assess/route';
import { WAREHOUSE_DISTANCE_KM, ROUTE_CARBON_PER_KM } from '@/lib/config';

// ─── Shared formatting ────────────────────────────────────────────────────────

function formatINR(n: number) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency', currency: 'INR', maximumFractionDigits: 0,
  }).format(n);
}

// ─── Metadata maps ────────────────────────────────────────────────────────────

const CONDITION_META: Record<string, { label: string; color: string; bg: string; dots: number }> = {
  like_new: { label: 'Like New', color: '#4ade80', bg: 'rgba(74,222,128,0.12)',  dots: 4 },
  good:     { label: 'Good',     color: '#60a5fa', bg: 'rgba(96,165,250,0.12)',  dots: 3 },
  fair:     { label: 'Fair',     color: '#fbbf24', bg: 'rgba(251,191,36,0.12)',  dots: 2 },
  damaged:  { label: 'Damaged',  color: '#f87171', bg: 'rgba(248,113,113,0.12)', dots: 1 },
};

const FLAG_LABELS: Record<string, { label: string; icon: string; color: string }> = {
  needs_data_wipe:    { label: 'Data wipe required',    icon: '🔒', color: '#fbbf24' },
  needs_sanitization: { label: 'Sanitization required', icon: '🧼', color: '#60a5fa' },
  block_resale:       { label: 'Blocked — recalled item', icon: '🚫', color: '#f87171' },
};

const PATH_META: Record<string, { label: string; icon: string; color: string; bg: string }> = {
  ship_direct: { label: 'Ship Direct',  icon: '🚀', color: '#4ade80', bg: 'rgba(74,222,128,0.15)'  },
  refurbish:   { label: 'Refurbish',    icon: '🔧', color: '#60a5fa', bg: 'rgba(96,165,250,0.15)'  },
  repair:      { label: 'Repair First', icon: '🔨', color: '#fbbf24', bg: 'rgba(251,191,36,0.15)'  },
  donate:      { label: 'Donate',       icon: '🤝', color: '#a78bfa', bg: 'rgba(167,139,250,0.15)' },
  recycle:     { label: 'Recycle',      icon: '♻',  color: '#34d399', bg: 'rgba(52,211,153,0.15)'  },
  list_hold:   { label: 'Hold & List',  icon: '⏸',  color: '#f97316', bg: 'rgba(249,115,22,0.15)'  },
};

// ─── Loading state ────────────────────────────────────────────────────────────

function LoadingState() {
  return (
    <div className="flex flex-col items-center gap-8 py-16 max-w-sm mx-auto text-center">
      <div className="relative w-16 h-16">
        <div
          className="absolute inset-0 rounded-full border-4 animate-spin"
          style={{ borderColor: 'var(--accent)', borderTopColor: 'transparent' }}
        />
        <span className="absolute inset-0 flex items-center justify-center text-2xl">🔬</span>
      </div>
      <div>
        <h1 className="text-xl font-bold" style={{ color: 'var(--foreground)' }}>
          Analysing your item…
        </h1>
        <p className="text-sm mt-1" style={{ color: 'var(--muted)' }}>
          Gemini Vision is grading condition — usually under 15 s
        </p>
      </div>
      <div className="w-full flex flex-col gap-2">
        {[
          { icon: '🤖', label: 'AI condition grading' },
          { icon: '💰', label: 'Computing resale price' },
          { icon: '📍', label: 'Finding nearby buyers' },
          { icon: '🗺',  label: 'Picking optimal route' },
        ].map((s) => (
          <div
            key={s.label}
            className="flex items-center gap-3 px-4 py-2.5 rounded-xl"
            style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
          >
            <span>{s.icon}</span>
            <span className="text-sm" style={{ color: 'var(--muted)' }}>{s.label}</span>
            <div
              className="ml-auto w-4 h-4 rounded-full border-2 animate-spin shrink-0"
              style={{ borderColor: 'var(--accent)', borderTopColor: 'transparent' }}
            />
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Confidence dots ──────────────────────────────────────────────────────────

function ConfidenceDots({ value }: { value: number }) {
  const filled = Math.round(value * 5);
  return (
    <div className="flex gap-1 items-center">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="w-2 h-2 rounded-full"
          style={{ background: i < filled ? 'var(--accent)' : 'var(--border)' }} />
      ))}
      <span className="text-xs ml-1" style={{ color: 'var(--muted)' }}>
        {Math.round(value * 100)}%
      </span>
    </div>
  );
}

// ─── Assessment section ───────────────────────────────────────────────────────

function AssessmentSection({
  assessment,
  buyer,
}: {
  assessment: Assessment;
  buyer: AssessResponse['buyer'];
}) {
  const { grade, price, nearbyDemand, riskFlags } = assessment;
  const meta = CONDITION_META[grade.condition] ?? CONDITION_META.fair;

  return (
    <div className="flex flex-col gap-4">
      {/* Grade card */}
      <div
        className="rounded-2xl p-5 border flex flex-col gap-4"
        style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}
      >
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-widest" style={{ color: 'var(--muted)' }}>
            Condition
          </span>
          <span className="text-xs font-bold px-2.5 py-1 rounded-full"
            style={{ background: meta.bg, color: meta.color }}>
            {meta.label}
          </span>
        </div>

        <div className="flex gap-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flex-1 h-2.5 rounded-full"
              style={{ background: i < meta.dots ? meta.color : 'var(--surface-raised)' }} />
          ))}
        </div>

        <p className="text-sm leading-relaxed" style={{ color: 'var(--foreground)' }}>
          {grade.summary}
        </p>

        <div className="flex items-center justify-between">
          <span className="text-xs" style={{ color: 'var(--muted)' }}>AI confidence</span>
          <ConfidenceDots value={grade.confidence} />
        </div>

        {grade.defects.length > 0 && (
          <div className="flex flex-col gap-1.5">
            <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: 'var(--muted)' }}>
              Noted defects
            </p>
            <ul className="flex flex-col gap-1">
              {grade.defects.map((d, i) => (
                <li key={i} className="flex items-start gap-2 text-sm" style={{ color: 'var(--foreground)' }}>
                  <span style={{ color: 'var(--muted)' }}>—</span>{d}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Price + demand */}
      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-2xl p-4 border flex flex-col gap-1"
          style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
          <p className="text-xs" style={{ color: 'var(--muted)' }}>Estimated resale</p>
          <p className="text-xl font-bold" style={{ color: 'var(--foreground)' }}>{formatINR(price)}</p>
        </div>
        <div className="rounded-2xl p-4 border flex flex-col gap-2"
          style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
          <p className="text-xs" style={{ color: 'var(--muted)' }}>Nearby demand</p>
          <div className="flex gap-1">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex-1 h-2 rounded-full"
                style={{ background: i < Math.round(nearbyDemand * 5) ? 'var(--accent)' : 'var(--surface-raised)' }} />
            ))}
          </div>
          <p className="text-xs" style={{ color: 'var(--muted)' }}>
            {Math.round(nearbyDemand * 100)}% local interest
          </p>
        </div>
      </div>

      {/* Buyer match */}
      <div className="rounded-2xl p-4 border flex items-center gap-3"
        style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
        <div className="w-10 h-10 rounded-full flex items-center justify-center text-lg flex-shrink-0"
          style={{ background: 'var(--surface-raised)' }}>👤</div>
        <div className="flex flex-col gap-0.5 flex-1 min-w-0">
          <p className="text-xs" style={{ color: 'var(--muted)' }}>Best buyer match</p>
          {buyer ? (
            <>
              <p className="text-sm font-semibold truncate" style={{ color: 'var(--foreground)' }}>{buyer.name}</p>
              <p className="text-xs" style={{ color: 'var(--muted)' }}>📍 {buyer.city}</p>
            </>
          ) : (
            <p className="text-sm" style={{ color: 'var(--muted)' }}>No match found</p>
          )}
        </div>
        {buyer && (
          <span className="text-xs font-semibold px-2.5 py-1 rounded-full shrink-0"
            style={{ background: 'rgba(74,222,128,0.12)', color: '#4ade80' }}>Matched</span>
        )}
      </div>

      {/* Risk flags */}
      <div className="rounded-2xl p-4 border flex flex-col gap-3"
        style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
        <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: 'var(--muted)' }}>
          Risk flags
        </p>
        {riskFlags.length === 0 ? (
          <p className="text-sm flex gap-2 items-center" style={{ color: '#4ade80' }}>
            <span>✓</span> No flags — clear to route
          </p>
        ) : (
          <div className="flex flex-col gap-2">
            {riskFlags.map((flag) => {
              const f = FLAG_LABELS[flag] ?? { label: flag, icon: '⚠', color: 'var(--muted)' };
              return (
                <div key={flag} className="flex items-center gap-2.5 text-sm px-3 py-2 rounded-xl"
                  style={{ background: 'var(--surface-raised)', color: f.color }}>
                  <span>{f.icon}</span>
                  <span className="font-medium">{f.label}</span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Comparison card (CENTERPIECE) ───────────────────────────────────────────

function ComparisonCard({ route }: { route: RouteDecision }) {
  const { shipDirect, warehouseAlt, carbonKgSaved } = route.cost;
  const warehouseCarbonKg = parseFloat((WAREHOUSE_DISTANCE_KM * ROUTE_CARBON_PER_KM).toFixed(1));
  const localCarbonKg     = parseFloat(Math.max(0, warehouseCarbonKg - carbonKgSaved).toFixed(1));
  const moneySaved        = warehouseAlt - shipDirect;
  const isDirectChosen    = route.path === 'ship_direct';

  return (
    <div
      className="rounded-2xl border overflow-hidden"
      style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}
    >
      {/* Header */}
      <div className="px-5 pt-5 pb-3">
        <p className="text-xs font-semibold uppercase tracking-widest mb-1" style={{ color: 'var(--muted)' }}>
          Cost comparison
        </p>
        <p className="text-sm font-medium" style={{ color: 'var(--foreground)' }}>
          Every Bridge route is checked against the warehouse alternative
        </p>
      </div>

      {/* Two-column grid */}
      <div className="grid grid-cols-2 gap-3 px-5 pb-4">

        {/* ── Ship Direct ──────────────────────────────────────────────── */}
        <div
          className="rounded-2xl p-4 flex flex-col gap-3 relative overflow-hidden"
          style={{
            background: isDirectChosen ? 'rgba(74,222,128,0.07)' : 'var(--surface-raised)',
            border: `2px solid ${isDirectChosen ? '#4ade80' : 'var(--border)'}`,
          }}
        >
          {/* Top row */}
          <div className="flex items-center justify-between">
            <span className="text-base">🚀</span>
            {isDirectChosen && (
              <span
                className="text-[10px] font-bold px-1.5 py-0.5 rounded-full"
                style={{ background: 'rgba(74,222,128,0.2)', color: '#4ade80' }}
              >
                CHOSEN
              </span>
            )}
          </div>

          <p className="text-xs font-semibold" style={{ color: isDirectChosen ? '#4ade80' : 'var(--muted)' }}>
            Ship Direct
          </p>

          {/* Big price */}
          <div>
            <p
              className="text-3xl font-black tracking-tight"
              style={{ color: isDirectChosen ? 'var(--foreground)' : 'var(--muted)' }}
            >
              {formatINR(shipDirect)}
            </p>
            <p className="text-xs mt-0.5" style={{ color: 'var(--muted)' }}>logistics</p>
          </div>

          {/* Carbon */}
          <div
            className="flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-lg w-fit"
            style={{
              background: isDirectChosen ? 'rgba(74,222,128,0.12)' : 'var(--surface)',
              color: isDirectChosen ? '#4ade80' : 'var(--muted)',
            }}
          >
            🌱 {localCarbonKg} kg CO₂
          </div>
        </div>

        {/* ── Via Warehouse ─────────────────────────────────────────────── */}
        <div
          className="rounded-2xl p-4 flex flex-col gap-3"
          style={{
            background: 'var(--surface-raised)',
            border: '2px solid var(--border)',
            opacity: 0.72,
          }}
        >
          <div className="flex items-center justify-between">
            <span className="text-base">🏭</span>
            <span
              className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full"
              style={{ background: 'rgba(248,113,113,0.15)', color: '#f87171' }}
            >
              LEGACY
            </span>
          </div>

          <p className="text-xs font-semibold" style={{ color: 'var(--muted)' }}>Via Warehouse</p>

          <div>
            <p
              className="text-3xl font-black tracking-tight"
              style={{ color: 'var(--muted)', textDecoration: 'line-through', textDecorationColor: '#f87171' }}
            >
              {formatINR(warehouseAlt)}
            </p>
            <p className="text-xs mt-0.5" style={{ color: 'var(--muted)' }}>logistics</p>
          </div>

          <div
            className="flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-lg w-fit"
            style={{ background: 'rgba(248,113,113,0.08)', color: '#f87171' }}
          >
            💨 {warehouseCarbonKg} kg CO₂
          </div>
        </div>
      </div>

      {/* ── Savings banner ───────────────────────────────────────────────── */}
      <div
        className="mx-5 mb-5 rounded-xl px-4 py-4 flex flex-col sm:flex-row items-center justify-between gap-3"
        style={{ background: 'rgba(74,222,128,0.08)', border: '1px solid rgba(74,222,128,0.2)' }}
      >
        <div className="flex items-center gap-2">
          <span className="text-xl">🎉</span>
          <div>
            <p className="text-xs font-semibold" style={{ color: 'var(--muted)' }}>Total savings</p>
            <p className="text-base font-black" style={{ color: '#4ade80' }}>
              {formatINR(moneySaved)} saved
            </p>
          </div>
        </div>
        <div
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg"
          style={{ background: 'rgba(74,222,128,0.12)' }}
        >
          <span>🌍</span>
          <p className="text-sm font-bold" style={{ color: '#4ade80' }}>
            {carbonKgSaved} kg CO₂ avoided
          </p>
        </div>
      </div>
    </div>
  );
}

// ─── Route decision section ───────────────────────────────────────────────────

function RouteSection({
  route,
  itemId,
}: {
  route: RouteDecision;
  itemId: string;
}) {
  const nav = useRouter();
  const [confirming, setConfirming] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const pathMeta = PATH_META[route.path] ?? { label: route.path, icon: '✓', color: 'var(--foreground)', bg: 'var(--surface-raised)' };

  const handleConfirm = useCallback(async () => {
    setConfirming(true);
    setErr(null);
    try {
      const res = await fetch(`/api/items/${itemId}/route-decision`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ route }),
      });
      if (!res.ok) throw new Error('Save failed');
      nav.push(`/item/${itemId}/confirm`);
    } catch {
      setErr('Could not save route — please try again.');
      setConfirming(false);
    }
  }, [itemId, route, nav]);

  return (
    <div className="flex flex-col gap-4">
      {/* Section divider */}
      <div className="flex items-center gap-3">
        <div className="flex-1 h-px" style={{ background: 'var(--border)' }} />
        <p className="text-xs font-semibold uppercase tracking-widest px-2" style={{ color: 'var(--muted)' }}>
          Route Decision
        </p>
        <div className="flex-1 h-px" style={{ background: 'var(--border)' }} />
      </div>

      {/* Path badge + reason */}
      <div
        className="rounded-2xl p-5 border flex flex-col gap-3"
        style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}
      >
        <div className="flex items-center gap-3">
          {/* Large path badge */}
          <div
            className="flex items-center gap-2.5 px-4 py-2.5 rounded-full"
            style={{ background: pathMeta.bg }}
          >
            <span className="text-xl">{pathMeta.icon}</span>
            <span className="text-base font-black tracking-tight" style={{ color: pathMeta.color }}>
              {pathMeta.label}
            </span>
          </div>
        </div>

        <p className="text-sm leading-relaxed" style={{ color: 'var(--foreground)' }}>
          {route.reason}
        </p>
      </div>

      {/* Comparison card — the centerpiece */}
      <ComparisonCard route={route} />

      {/* Error */}
      {err && (
        <div className="text-sm px-4 py-3 rounded-xl"
          style={{ background: 'rgba(239,68,68,0.08)', color: '#f87171', border: '1px solid rgba(239,68,68,0.25)' }}>
          ⚠ {err}
        </div>
      )}

      {/* Confirm button */}
      <button
        onClick={handleConfirm}
        disabled={confirming}
        className="w-full text-sm font-bold py-3.5 rounded-full transition-opacity active:opacity-80"
        style={{
          background: confirming ? 'var(--surface-raised)' : 'var(--accent)',
          color: confirming ? 'var(--muted)' : '#fff',
          cursor: confirming ? 'not-allowed' : 'pointer',
        }}
      >
        {confirming ? (
          <span className="flex items-center justify-center gap-2">
            <span className="w-4 h-4 rounded-full border-2 animate-spin inline-block"
              style={{ borderColor: 'var(--muted)', borderTopColor: 'transparent' }} />
            Confirming…
          </span>
        ) : (
          `Confirm ${pathMeta.label} →`
        )}
      </button>
    </div>
  );
}

// ─── Main export ─────────────────────────────────────────────────────────────

export default function AssessmentView({
  itemId,
  itemTitle,
}: {
  itemId: string;
  itemTitle: string;
}) {
  const [result, setResult] = useState<AssessResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch(`/api/items/${itemId}/assess`, { method: 'POST' })
      .then(async (r) => {
        const data = await r.json();
        if (!r.ok) throw new Error(data.error ?? 'Assessment failed');
        setResult(data as AssessResponse);
      })
      .catch((e: unknown) => setError(e instanceof Error ? e.message : 'Assessment failed'));
  }, [itemId]);

  if (error) {
    return (
      <div className="flex flex-col items-center gap-4 py-20 text-center max-w-sm mx-auto">
        <span className="text-4xl">⚠</span>
        <p className="text-sm font-medium" style={{ color: '#f87171' }}>{error}</p>
        <p className="text-xs" style={{ color: 'var(--muted)' }}>
          Check that <code>GEMINI_API_KEY</code> is set in your .env and restart the dev server.
        </p>
        <Link href="/" className="text-sm underline" style={{ color: 'var(--muted)' }}>← Back</Link>
      </div>
    );
  }

  if (!result) return <LoadingState />;

  return (
    <div className="flex flex-col gap-6 max-w-lg mx-auto w-full">
      {/* Page header */}
      <div>
        <p className="text-xs font-semibold uppercase tracking-widest mb-0.5" style={{ color: 'var(--accent)' }}>
          Assessment complete
        </p>
        <h1 className="text-lg font-bold leading-snug" style={{ color: 'var(--foreground)' }}>
          {itemTitle}
        </h1>
      </div>

      {/* Assessment signals */}
      <AssessmentSection assessment={result.assessment} buyer={result.buyer} />

      {/* Route decision + comparison */}
      <RouteSection route={result.route} itemId={itemId} />

      <Link
        href="/"
        className="text-sm font-semibold text-center py-2 rounded-full border transition-colors"
        style={{ borderColor: 'var(--border)', color: 'var(--muted)' }}
      >
        ← Back to My Items
      </Link>
    </div>
  );
}
