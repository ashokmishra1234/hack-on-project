'use client';

import { useCallback, useState } from 'react';
import Link from 'next/link';
import HealthCard from '@/components/HealthCard';
import type { Item, Buyer } from '@/lib/types';
import type { TrustRecord } from '@/lib/trust';

// ─── Step definitions ─────────────────────────────────────────────────────────

const STEPS = [
  { n: 1, icon: '🔒', label: 'Escrow'   },
  { n: 2, icon: '🚚', label: 'Pickup'   },
  { n: 3, icon: '📦', label: 'Delivery' },
  { n: 4, icon: '🔍', label: 'Review'   },
] as const;

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatINR(n: number) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency', currency: 'INR', maximumFractionDigits: 0,
  }).format(n);
}

// ─── Step progress bar ────────────────────────────────────────────────────────

function StepBar({ current }: { current: number }) {
  return (
    <div className="flex items-center w-full">
      {STEPS.map((s, i) => (
        <div key={s.n} className="flex items-center flex-1 last:flex-none">
          {/* Circle */}
          <div className="flex flex-col items-center gap-1 shrink-0">
            <div
              className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold transition-all"
              style={{
                background: s.n < current
                  ? '#4ade80'
                  : s.n === current
                    ? 'var(--accent)'
                    : 'var(--surface-raised)',
                color: s.n <= current ? '#fff' : 'var(--muted)',
              }}
            >
              {s.n < current ? '✓' : s.icon}
            </div>
            <span
              className="text-[10px] font-semibold whitespace-nowrap"
              style={{ color: s.n === current ? 'var(--accent)' : 'var(--muted)' }}
            >
              {s.label}
            </span>
          </div>
          {/* Connector */}
          {i < STEPS.length - 1 && (
            <div
              className="flex-1 h-0.5 mx-1 mt-[-14px] transition-all"
              style={{ background: s.n < current ? '#4ade80' : 'var(--border)' }}
            />
          )}
        </div>
      ))}
    </div>
  );
}

// ─── Individual steps ─────────────────────────────────────────────────────────

function StepCard({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="rounded-2xl border p-5 flex flex-col gap-4"
      style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}
    >
      {children}
    </div>
  );
}

function NextButton({
  label, onClick, disabled,
}: { label: string; onClick: () => void; disabled?: boolean }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="w-full text-sm font-bold py-3 rounded-full transition-opacity active:opacity-80"
      style={{
        background: disabled ? 'var(--surface-raised)' : 'var(--accent)',
        color: disabled ? 'var(--muted)' : '#fff',
        cursor: disabled ? 'not-allowed' : 'pointer',
      }}
    >
      {label}
    </button>
  );
}

// Step 1 ── Escrow payment
function PaymentStep({ amount, onNext }: { amount: number; onNext: () => void }) {
  return (
    <StepCard>
      <div className="flex items-center gap-3">
        <div
          className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl shrink-0"
          style={{ background: 'var(--surface-raised)' }}
        >🔒</div>
        <div>
          <p className="text-sm font-bold" style={{ color: 'var(--foreground)' }}>Funds secured in escrow</p>
          <p className="text-xs" style={{ color: 'var(--muted)' }}>Amazon Pay holds the funds until you confirm receipt</p>
        </div>
      </div>

      <div
        className="rounded-xl px-4 py-3 flex items-center justify-between"
        style={{ background: 'var(--surface-raised)' }}
      >
        <span className="text-xs" style={{ color: 'var(--muted)' }}>Amount in escrow</span>
        <span className="text-lg font-black" style={{ color: 'var(--foreground)' }}>{formatINR(amount)}</span>
      </div>

      <div className="flex flex-col gap-1.5">
        {[
          'Seller cannot withdraw until you accept',
          'Automatic refund if dispute is filed',
          'Bridge guarantee covers any mismatch',
        ].map((t) => (
          <p key={t} className="text-xs flex gap-2" style={{ color: 'var(--muted)' }}>
            <span style={{ color: '#4ade80' }}>✓</span> {t}
          </p>
        ))}
      </div>

      <NextButton label="Confirm Payment →" onClick={onNext} />
    </StepCard>
  );
}

// Step 2 ── Agent pickup
function PickupStep({ buyer, onNext }: { buyer: Buyer | null; onNext: () => void }) {
  return (
    <StepCard>
      <div className="flex items-center gap-3">
        <div
          className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl shrink-0"
          style={{ background: 'var(--surface-raised)' }}
        >🚚</div>
        <div>
          <p className="text-sm font-bold" style={{ color: 'var(--foreground)' }}>Agent pickup in progress</p>
          <p className="text-xs" style={{ color: 'var(--muted)' }}>Same-trip logistics — one vehicle, zero extra mileage</p>
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <div
          className="rounded-xl px-4 py-3 flex flex-col gap-1"
          style={{ background: 'var(--surface-raised)' }}
        >
          <p className="text-xs" style={{ color: 'var(--muted)' }}>Pickup from</p>
          <p className="text-sm font-semibold" style={{ color: 'var(--foreground)' }}>Seller · Bengaluru</p>
        </div>
        <div className="flex items-center justify-center py-1" style={{ color: 'var(--muted)' }}>
          ↓
        </div>
        <div
          className="rounded-xl px-4 py-3 flex flex-col gap-1"
          style={{ background: 'var(--surface-raised)' }}
        >
          <p className="text-xs" style={{ color: 'var(--muted)' }}>Deliver to</p>
          <p className="text-sm font-semibold" style={{ color: 'var(--foreground)' }}>
            {buyer ? `${buyer.name} · ${buyer.location.city}` : 'Nearby buyer'}
          </p>
        </div>
      </div>

      <NextButton label="Confirm Pickup →" onClick={onNext} />
    </StepCard>
  );
}

// Step 3 ── Delivery
function DeliveryStep({ buyer, onNext }: { buyer: Buyer | null; onNext: () => void }) {
  return (
    <StepCard>
      <div className="flex items-center gap-3">
        <div
          className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl shrink-0"
          style={{ background: 'var(--surface-raised)' }}
        >📦</div>
        <div>
          <p className="text-sm font-bold" style={{ color: 'var(--foreground)' }}>
            Delivered to {buyer?.name ?? 'buyer'}
          </p>
          <p className="text-xs" style={{ color: 'var(--muted)' }}>
            Item handed off · buyer has 24 h to review
          </p>
        </div>
      </div>

      <div
        className="rounded-xl px-4 py-3 flex flex-col gap-2"
        style={{ background: 'rgba(74,222,128,0.06)', border: '1px solid rgba(74,222,128,0.2)' }}
      >
        <p className="text-xs font-semibold" style={{ color: '#4ade80' }}>Delivery confirmed</p>
        <p className="text-xs" style={{ color: 'var(--muted)' }}>
          The buyer will now inspect the item against its Health Card. Funds stay in escrow until they confirm.
        </p>
      </div>

      <NextButton label="Buyer Reviews Item →" onClick={onNext} />
    </StepCard>
  );
}

// Step 4 ── Buyer review (shows HealthCard)
function ReviewStep({
  item,
  trustRecord,
  onAccept,
  onDispute,
  processing,
}: {
  item: Item;
  trustRecord: TrustRecord;
  onAccept: () => void;
  onDispute: () => void;
  processing: boolean;
}) {
  return (
    <div className="flex flex-col gap-4">
      <div
        className="rounded-2xl border p-4"
        style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}
      >
        <p className="text-xs font-semibold uppercase tracking-widest mb-1" style={{ color: 'var(--accent)' }}>
          Buyer receives
        </p>
        <p className="text-sm font-bold mb-3" style={{ color: 'var(--foreground)' }}>
          Review the Health Card — does the item match?
        </p>

        <HealthCard item={item} trustRecord={trustRecord} />
      </div>

      <div className="flex flex-col gap-2">
        <button
          onClick={onAccept}
          disabled={processing}
          className="w-full text-sm font-bold py-3.5 rounded-full transition-opacity active:opacity-80"
          style={{
            background: processing ? 'var(--surface-raised)' : '#4ade80',
            color: processing ? 'var(--muted)' : '#052e16',
            cursor: processing ? 'not-allowed' : 'pointer',
          }}
        >
          {processing ? '…' : '✓ Accept — Item matches, release funds'}
        </button>

        <button
          onClick={onDispute}
          disabled={processing}
          className="w-full text-sm font-semibold py-3 rounded-full border transition-colors"
          style={{
            borderColor: processing ? 'var(--border)' : 'rgba(248,113,113,0.4)',
            color: processing ? 'var(--muted)' : '#f87171',
            background: processing ? 'var(--surface-raised)' : 'rgba(248,113,113,0.06)',
            cursor: processing ? 'not-allowed' : 'pointer',
          }}
        >
          ✗ Dispute — Item doesn't match grade
        </button>
      </div>

      <p className="text-xs text-center" style={{ color: 'var(--muted)' }}>
        Dispute triggers the Bridge Guarantee — full refund processed automatically.
      </p>
    </div>
  );
}

// Step 5 ── Completion
function CompletionStep({
  outcome,
  oldScore,
  newScore,
  delta,
  credits,
  co2KgAvoided,
  newItemId,
  buyerCity,
}: {
  outcome: 'accept' | 'dispute';
  oldScore: number;
  newScore: number;
  delta: number;
  credits: number;
  co2KgAvoided: number;
  newItemId: string | null;
  buyerCity: string | null;
}) {
  const accepted = outcome === 'accept';

  return (
    <div className="flex flex-col items-center gap-6 py-6 text-center">
      <div
        className="w-20 h-20 rounded-2xl flex items-center justify-center text-4xl"
        style={{ background: 'var(--surface)' }}
      >
        {accepted ? '🎉' : '⚠'}
      </div>

      <div className="flex flex-col gap-1.5">
        <h2 className="text-xl font-bold" style={{ color: 'var(--foreground)' }}>
          {accepted ? 'Deal complete!' : 'Dispute filed'}
        </h2>
        <p className="text-sm" style={{ color: 'var(--muted)' }}>
          {accepted
            ? 'Funds released to seller. Thank you for using The Bridge.'
            : 'Refund is being processed. Bridge Guarantee activated.'}
        </p>
      </div>

      {/* Trust score change */}
      <div
        className="w-full rounded-2xl border p-5 flex flex-col gap-3"
        style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}
      >
        <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: 'var(--muted)' }}>
          Seller trust score
        </p>

        <div className="flex items-center justify-center gap-4">
          <div className="text-center">
            <p className="text-3xl font-black" style={{ color: 'var(--muted)' }}>{oldScore}</p>
            <p className="text-xs" style={{ color: 'var(--muted)' }}>before</p>
          </div>

          <div className="flex flex-col items-center">
            <span className="text-xl" style={{ color: delta > 0 ? '#4ade80' : delta < 0 ? '#f87171' : 'var(--muted)' }}>
              →
            </span>
            <span
              className="text-sm font-bold"
              style={{ color: delta > 0 ? '#4ade80' : delta < 0 ? '#f87171' : 'var(--muted)' }}
            >
              {delta > 0 ? `+${delta}` : delta === 0 ? '±0' : delta}
            </span>
          </div>

          <div className="text-center">
            <p
              className="text-3xl font-black"
              style={{ color: delta > 0 ? '#4ade80' : delta < 0 ? '#f87171' : 'var(--foreground)' }}
            >
              {newScore}
            </p>
            <p className="text-xs" style={{ color: 'var(--muted)' }}>after</p>
          </div>
        </div>

        <div
          className="w-full rounded-full h-2 overflow-hidden"
          style={{ background: 'var(--surface-raised)' }}
        >
          <div
            className="h-full rounded-full transition-all"
            style={{
              width: `${newScore}%`,
              background: newScore >= 80 ? '#4ade80' : newScore >= 60 ? 'var(--accent)' : '#f87171',
            }}
          />
        </div>

        <p className="text-xs" style={{ color: 'var(--muted)' }}>
          {accepted
            ? 'Score raised: successful transaction recorded on your ledger.'
            : delta < 0
              ? 'Score lowered: dispute recorded. Keep your grades accurate to maintain trust.'
              : 'Score unchanged. Dispute resolved.'}
        </p>
      </div>

      {/* Green Credits (on accept only) */}
      {accepted && credits > 0 && (
        <div
          className="w-full rounded-2xl border p-5 flex flex-col gap-3 text-left"
          style={{ background: 'var(--surface)', borderColor: 'rgba(74,222,128,0.25)' }}
        >
          <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: '#4ade80' }}>
            Green Credits earned
          </p>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-3xl">🌱</span>
              <span className="text-3xl font-black" style={{ color: '#4ade80' }}>
                +{credits}
              </span>
            </div>
            <div className="text-right">
              <p className="text-lg font-bold" style={{ color: 'var(--foreground)' }}>
                {co2KgAvoided.toFixed(1)} kg
              </p>
              <p className="text-xs" style={{ color: 'var(--muted)' }}>CO₂ avoided</p>
            </div>
          </div>

          <p className="text-xs" style={{ color: 'var(--muted)' }}>
            {buyerCity
              ? `This item went to ${buyerCity} — one less product in landfill.`
              : 'This item gets a second life — one less product in landfill.'}
          </p>
        </div>
      )}

      {/* The Loop notice */}
      {accepted && newItemId && (
        <div
          className="w-full rounded-2xl border p-4 flex flex-col gap-2 text-left"
          style={{ background: 'rgba(74,222,128,0.04)', borderColor: 'rgba(74,222,128,0.2)' }}
        >
          <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: '#4ade80' }}>
            ♻ The loop continues
          </p>
          <p className="text-xs" style={{ color: 'var(--muted)' }}>
            This product is now pre-enrolled for its next second life. The buyer can re-sell it in one tap — no photos needed.
          </p>
        </div>
      )}

      <div className="flex flex-col gap-2 w-full">
        <Link
          href="/"
          className="w-full text-sm font-bold py-3 rounded-full text-center transition-opacity"
          style={{ background: 'var(--accent)', color: '#fff' }}
        >
          Back to My Items
        </Link>
        <Link
          href="/dashboard"
          className="w-full text-sm font-semibold py-3 rounded-full text-center border transition-opacity"
          style={{ borderColor: 'var(--border)', color: 'var(--muted)' }}
        >
          View impact dashboard →
        </Link>
      </div>
    </div>
  );
}

// ─── Main export ──────────────────────────────────────────────────────────────

export default function EscrowStepper({
  item,
  trustRecord,
  buyer,
}: {
  item: Item;
  trustRecord: TrustRecord;
  buyer: Buyer | null;
}) {
  const [step, setStep] = useState<1 | 2 | 3 | 4 | 5>(1);
  const [outcome, setOutcome] = useState<'accept' | 'dispute' | null>(null);
  const [newScore, setNewScore] = useState<number | null>(null);
  const [delta, setDelta] = useState<number | null>(null);
  const [credits, setCredits] = useState(0);
  const [co2KgAvoided, setCo2KgAvoided] = useState(0);
  const [newItemId, setNewItemId] = useState<string | null>(null);
  const [buyerCity, setBuyerCity] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const escrowAmount = item.assessment?.price ?? item.originalPrice;

  const handleComplete = useCallback(async (o: 'accept' | 'dispute') => {
    setProcessing(true);
    setError(null);
    try {
      const res = await fetch(`/api/items/${item.id}/escrow`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ outcome: o }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Escrow completion failed');
      setOutcome(o);
      setNewScore(data.newScore);
      setDelta(data.delta);
      setCredits(data.credits ?? 0);
      setCo2KgAvoided(data.co2KgAvoided ?? 0);
      setNewItemId(data.newItemId ?? null);
      setBuyerCity(data.buyerCity ?? null);
      setStep(5);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Something went wrong');
    } finally {
      setProcessing(false);
    }
  }, [item.id]);

  return (
    <div className="flex flex-col gap-6 max-w-lg mx-auto w-full">
      {/* Page header */}
      <div>
        <p className="text-xs font-semibold uppercase tracking-widest mb-0.5" style={{ color: 'var(--accent)' }}>
          Escrow & Handoff
        </p>
        <h1 className="text-lg font-bold" style={{ color: 'var(--foreground)' }}>
          {item.title}
        </h1>
      </div>

      {/* Step bar (hidden on completion) */}
      {step < 5 && (
        <div
          className="rounded-2xl border p-4"
          style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}
        >
          <StepBar current={step} />
        </div>
      )}

      {/* Step content */}
      {step === 1 && (
        <PaymentStep amount={escrowAmount} onNext={() => setStep(2)} />
      )}
      {step === 2 && (
        <PickupStep buyer={buyer} onNext={() => setStep(3)} />
      )}
      {step === 3 && (
        <DeliveryStep buyer={buyer} onNext={() => setStep(4)} />
      )}
      {step === 4 && (
        <ReviewStep
          item={item}
          trustRecord={trustRecord}
          onAccept={() => handleComplete('accept')}
          onDispute={() => handleComplete('dispute')}
          processing={processing}
        />
      )}
      {step === 5 && outcome && newScore !== null && delta !== null && (
        <CompletionStep
          outcome={outcome}
          oldScore={trustRecord.score}
          newScore={newScore}
          delta={delta}
          credits={credits}
          co2KgAvoided={co2KgAvoided}
          newItemId={newItemId}
          buyerCity={buyerCity}
        />
      )}

      {/* API error */}
      {error && (
        <div
          className="text-sm px-4 py-3 rounded-xl"
          style={{ background: 'rgba(239,68,68,0.08)', color: '#f87171', border: '1px solid rgba(239,68,68,0.25)' }}
        >
          ⚠ {error}
        </div>
      )}
    </div>
  );
}
