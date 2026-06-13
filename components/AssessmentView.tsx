'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import type { Assessment } from '@/lib/types';
import type { AssessResponse } from '@/app/api/items/[id]/assess/route';

// ─── Helpers ─────────────────────────────────────────────────────────────────

const CONDITION_META: Record<
  string,
  { label: string; color: string; bg: string; dots: number }
> = {
  like_new: { label: 'Like New',  color: '#4ade80', bg: 'rgba(74,222,128,0.12)',  dots: 4 },
  good:     { label: 'Good',      color: '#60a5fa', bg: 'rgba(96,165,250,0.12)',  dots: 3 },
  fair:     { label: 'Fair',      color: '#fbbf24', bg: 'rgba(251,191,36,0.12)',  dots: 2 },
  damaged:  { label: 'Damaged',   color: '#f87171', bg: 'rgba(248,113,113,0.12)', dots: 1 },
};

const FLAG_LABELS: Record<string, { label: string; icon: string; color: string }> = {
  needs_data_wipe:    { label: 'Data wipe required',   icon: '🔒', color: '#fbbf24' },
  needs_sanitization: { label: 'Sanitization required', icon: '🧼', color: '#60a5fa' },
  block_resale:       { label: 'Blocked — recalled item', icon: '🚫', color: '#f87171' },
};

function formatINR(n: number) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency', currency: 'INR', maximumFractionDigits: 0,
  }).format(n);
}

function ConfidenceDots({ value }: { value: number }) {
  const filled = Math.round(value * 5);
  return (
    <div className="flex gap-1 items-center">
      {Array.from({ length: 5 }).map((_, i) => (
        <div
          key={i}
          className="w-2 h-2 rounded-full"
          style={{ background: i < filled ? 'var(--accent)' : 'var(--border)' }}
        />
      ))}
      <span className="text-xs ml-1" style={{ color: 'var(--muted)' }}>
        {Math.round(value * 100)}%
      </span>
    </div>
  );
}

// ─── Loading skeleton ─────────────────────────────────────────────────────────

function LoadingState() {
  const steps = [
    { icon: '🤖', label: 'AI condition grading', done: false },
    { icon: '💰', label: 'Computing resale price', done: false },
    { icon: '📍', label: 'Finding nearby buyers',  done: false },
    { icon: '⚠',  label: 'Checking risk flags',   done: false },
  ];
  return (
    <div className="flex flex-col items-center gap-8 py-16 max-w-sm mx-auto text-center">
      {/* Spinner */}
      <div className="relative w-16 h-16">
        <div
          className="absolute inset-0 rounded-full border-4 border-t-transparent animate-spin"
          style={{ borderColor: 'var(--accent)', borderTopColor: 'transparent' }}
        />
        <span className="absolute inset-0 flex items-center justify-center text-2xl">🔬</span>
      </div>

      <div className="flex flex-col gap-1">
        <h1 className="text-xl font-bold" style={{ color: 'var(--foreground)' }}>
          Analysing your item…
        </h1>
        <p className="text-sm" style={{ color: 'var(--muted)' }}>
          Gemini Vision is grading condition — usually under 15 s
        </p>
      </div>

      <div className="w-full flex flex-col gap-2">
        {steps.map((s) => (
          <div
            key={s.label}
            className="flex items-center gap-3 px-4 py-2.5 rounded-xl"
            style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
          >
            <span className="text-base">{s.icon}</span>
            <span className="text-sm" style={{ color: 'var(--muted)' }}>{s.label}</span>
            <div
              className="ml-auto w-4 h-4 rounded-full border-2 border-t-transparent animate-spin flex-shrink-0"
              style={{ borderColor: 'var(--accent)', borderTopColor: 'transparent' }}
            />
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Assessment display ───────────────────────────────────────────────────────

function AssessmentDisplay({
  assessment,
  buyer,
  itemTitle,
}: {
  assessment: Assessment;
  buyer: AssessResponse['buyer'];
  itemTitle: string;
}) {
  const { grade, price, nearbyDemand, riskFlags } = assessment;
  const meta = CONDITION_META[grade.condition] ?? CONDITION_META.fair;

  return (
    <div className="flex flex-col gap-5 max-w-lg mx-auto w-full">

      {/* ── Header ──────────────────────────────────────────────────────── */}
      <div>
        <p className="text-xs font-semibold uppercase tracking-widest mb-0.5" style={{ color: 'var(--accent)' }}>
          Assessment complete
        </p>
        <h1 className="text-lg font-bold leading-snug" style={{ color: 'var(--foreground)' }}>
          {itemTitle}
        </h1>
      </div>

      {/* ── Grade card ──────────────────────────────────────────────────── */}
      <div
        className="rounded-2xl p-5 border flex flex-col gap-4"
        style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}
      >
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-widest" style={{ color: 'var(--muted)' }}>
            Condition
          </span>
          <span
            className="text-xs font-bold px-2.5 py-1 rounded-full"
            style={{ background: meta.bg, color: meta.color }}
          >
            {meta.label}
          </span>
        </div>

        {/* Condition dots */}
        <div className="flex gap-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="flex-1 h-2 rounded-full"
              style={{ background: i < meta.dots ? meta.color : 'var(--surface-raised)' }}
            />
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
                  <span style={{ color: 'var(--muted)' }}>—</span>
                  {d}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* ── Price + demand row ───────────────────────────────────────────── */}
      <div className="grid grid-cols-2 gap-3">
        <div
          className="rounded-2xl p-4 border flex flex-col gap-1"
          style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}
        >
          <p className="text-xs" style={{ color: 'var(--muted)' }}>Estimated resale</p>
          <p className="text-xl font-bold" style={{ color: 'var(--foreground)' }}>
            {formatINR(price)}
          </p>
        </div>

        <div
          className="rounded-2xl p-4 border flex flex-col gap-1"
          style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}
        >
          <p className="text-xs" style={{ color: 'var(--muted)' }}>Nearby demand</p>
          <div className="flex gap-1 mt-1">
            {Array.from({ length: 5 }).map((_, i) => (
              <div
                key={i}
                className="flex-1 h-2 rounded-full"
                style={{
                  background: i < Math.round(nearbyDemand * 5) ? 'var(--accent)' : 'var(--surface-raised)',
                }}
              />
            ))}
          </div>
          <p className="text-xs mt-1" style={{ color: 'var(--muted)' }}>
            {Math.round(nearbyDemand * 100)}% of local buyers interested
          </p>
        </div>
      </div>

      {/* ── Buyer match ──────────────────────────────────────────────────── */}
      <div
        className="rounded-2xl p-4 border flex items-center gap-4"
        style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}
      >
        <div
          className="w-10 h-10 rounded-full flex items-center justify-center text-lg flex-shrink-0"
          style={{ background: 'var(--surface-raised)' }}
        >
          👤
        </div>
        <div className="flex flex-col gap-0.5 flex-1 min-w-0">
          <p className="text-xs" style={{ color: 'var(--muted)' }}>Best buyer match</p>
          {buyer ? (
            <>
              <p className="text-sm font-semibold truncate" style={{ color: 'var(--foreground)' }}>
                {buyer.name}
              </p>
              <p className="text-xs" style={{ color: 'var(--muted)' }}>
                📍 {buyer.city}
              </p>
            </>
          ) : (
            <p className="text-sm" style={{ color: 'var(--muted)' }}>No match found in database</p>
          )}
        </div>
        {buyer && (
          <div
            className="text-xs font-semibold px-2.5 py-1 rounded-full flex-shrink-0"
            style={{ background: 'rgba(74,222,128,0.12)', color: '#4ade80' }}
          >
            Matched
          </div>
        )}
      </div>

      {/* ── Risk flags ────────────────────────────────────────────────────── */}
      <div
        className="rounded-2xl p-4 border flex flex-col gap-3"
        style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}
      >
        <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: 'var(--muted)' }}>
          Risk flags
        </p>
        {riskFlags.length === 0 ? (
          <div className="flex items-center gap-2 text-sm" style={{ color: '#4ade80' }}>
            <span>✓</span> No flags — clear to route
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {riskFlags.map((flag) => {
              const f = FLAG_LABELS[flag] ?? { label: flag, icon: '⚠', color: 'var(--muted)' };
              return (
                <div
                  key={flag}
                  className="flex items-center gap-2.5 text-sm px-3 py-2 rounded-xl"
                  style={{ background: 'var(--surface-raised)', color: f.color }}
                >
                  <span>{f.icon}</span>
                  <span className="font-medium">{f.label}</span>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── Next-layer teaser ─────────────────────────────────────────────── */}
      <div
        className="rounded-2xl p-4 border"
        style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}
      >
        <p className="text-xs font-semibold uppercase tracking-widest mb-2" style={{ color: 'var(--accent)' }}>
          Coming in Layer 3
        </p>
        <p className="text-xs" style={{ color: 'var(--muted)' }}>
          Route decision — ship direct, refurbish, donate, or recycle — plus your Green Credits reward.
        </p>
      </div>

      <Link
        href="/"
        className="text-sm font-semibold px-6 py-2.5 rounded-full text-center transition-opacity active:opacity-80"
        style={{ background: 'var(--surface)', color: 'var(--foreground)', border: '1px solid var(--border)' }}
      >
        ← Back to My Items
      </Link>
    </div>
  );
}

// ─── Main export ─────────────────────────────────────────────────────────────

export default function AssessmentView({
  itemId,
  itemTitle,
  initialAssessment,
}: {
  itemId: string;
  itemTitle: string;
  initialAssessment?: Assessment;
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
          Check that GEMINI_API_KEY is set in your .env file and restart the dev server.
        </p>
        <Link href="/" className="text-sm underline" style={{ color: 'var(--muted)' }}>
          ← Back
        </Link>
      </div>
    );
  }

  if (!result) {
    return <LoadingState />;
  }

  return (
    <AssessmentDisplay
      assessment={result.assessment}
      buyer={result.buyer}
      itemTitle={itemTitle}
    />
  );
}
