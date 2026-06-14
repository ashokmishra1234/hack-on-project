'use client';

import { useState, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import type { Item } from '@/lib/types';

// ─── Step definitions ────────────────────────────────────────────────────────

const STEPS = [
  {
    id: 'front',
    label: 'Front view',
    icon: '🔲',
    instruction: 'Lay the item flat on a clean surface. Photograph the full front.',
    hint: 'Fill the frame · even lighting · no harsh shadows',
    example: 'e.g. shoes: both placed side-by-side, top-down · phone: screen facing up',
  },
  {
    id: 'label',
    label: 'Label / Model',
    icon: '🏷️',
    instruction: 'Find the brand tag, serial number, or model label and photograph it close up.',
    hint: 'Text must be legible · use your torch if needed',
    example: 'e.g. shoes: inside tongue label · phone: rear SIM-tray label · jacket: care tag',
  },
  {
    id: 'damage',
    label: 'Wear & Damage',
    icon: '🔍',
    instruction: 'Show any scratches, stains, loose parts, or signs of use.',
    hint: 'Be honest — accurate grading earns you more · no damage? snap the cleanest part',
    example: 'e.g. scuff on sole, cracked corner, pilling on fabric, sticker residue',
  },
] as const;

// ─── Image helpers ────────────────────────────────────────────────────────────

type PhotoResult =
  | { ok: false; error: string }
  | { ok: true; base64: string; previewUrl: string };

async function processPhoto(file: File): Promise<PhotoResult> {
  return new Promise((resolve) => {
    const img = new window.Image();
    const previewUrl = URL.createObjectURL(file);

    img.onload = () => {
      const w = img.naturalWidth;
      const h = img.naturalHeight;

      if (Math.min(w, h) < 300) {
        URL.revokeObjectURL(previewUrl);
        resolve({
          ok: false,
          error: `Image too small (${w}×${h} px). Hold the camera closer or use a higher-resolution setting.`,
        });
        return;
      }

      const S = 200;
      const blurCanvas = document.createElement('canvas');
      blurCanvas.width = S;
      blurCanvas.height = S;
      const blurCtx = blurCanvas.getContext('2d');
      if (!blurCtx) {
        encodeAndResolve(img, w, h, previewUrl, resolve);
        return;
      }

      blurCtx.drawImage(img, 0, 0, S, S);
      const { data } = blurCtx.getImageData(0, 0, S, S);
      const n = S * S;
      let sum = 0;
      let sumSq = 0;
      for (let i = 0; i < data.length; i += 4) {
        const g = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
        sum += g;
        sumSq += g * g;
      }
      const mean = sum / n;
      const variance = sumSq / n - mean * mean;

      if (variance < 100) {
        URL.revokeObjectURL(previewUrl);
        resolve({
          ok: false,
          error: 'Photo looks blurry or too dark. Move closer, tap to focus, and try again.',
        });
        return;
      }

      encodeAndResolve(img, w, h, previewUrl, resolve);
    };

    img.onerror = () => {
      URL.revokeObjectURL(previewUrl);
      resolve({ ok: false, error: 'Could not read image. Try a different file.' });
    };

    img.src = previewUrl;
  });
}

function encodeAndResolve(
  img: HTMLImageElement,
  w: number,
  h: number,
  previewUrl: string,
  resolve: (r: PhotoResult) => void,
) {
  const MAX = 1200;
  const scale = Math.min(1, MAX / Math.max(w, h));
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(w * scale);
  canvas.height = Math.round(h * scale);
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    resolve({ ok: true, base64: img.src, previewUrl });
    return;
  }
  ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
  const base64 = canvas.toDataURL('image/jpeg', 0.82);
  resolve({ ok: true, base64, previewUrl });
}

// ─── Types ───────────────────────────────────────────────────────────────────

type SlotState = { base64: string; previewUrl: string };

type VerifyFail = {
  observedProduct: string;
  reason: string;
  consecutiveFailures: number;
  flaggedForReview: boolean;
};

// ─── Verification fail screen ─────────────────────────────────────────────────

function VerifyFailScreen({
  item,
  fail,
  onRetake,
}: {
  item: Item;
  fail: VerifyFail;
  onRetake: () => void;
}) {
  const router = useRouter();

  return (
    <div className="flex flex-col gap-5 max-w-md mx-auto w-full">
      {/* Header */}
      <div className="flex flex-col gap-0.5">
        <p
          className="text-xs font-semibold uppercase tracking-widest"
          style={{ color: 'var(--accent)' }}
        >
          {item.category} · {item.brand}
        </p>
        <h1 className="text-lg font-bold leading-snug" style={{ color: 'var(--foreground)' }}>
          {item.title}
        </h1>
      </div>

      {/* Mismatch card */}
      <div
        className="rounded-2xl border flex flex-col gap-4 overflow-hidden"
        style={{ background: 'var(--surface)', borderColor: 'rgba(248,113,113,0.35)' }}
      >
        {/* Top banner */}
        <div
          className="px-5 py-4 flex items-center gap-3"
          style={{ background: 'rgba(248,113,113,0.08)', borderBottom: '1px solid rgba(248,113,113,0.2)' }}
        >
          <span className="text-2xl shrink-0">🔍</span>
          <div>
            <p className="text-sm font-bold" style={{ color: '#f87171' }}>
              Product mismatch
            </p>
            <p className="text-xs" style={{ color: 'var(--muted)' }}>
              This doesn&apos;t look like the {item.title} from your order.
            </p>
          </div>
        </div>

        <div className="px-5 pb-5 flex flex-col gap-3">
          {/* What we saw */}
          <div
            className="rounded-xl px-4 py-3 flex flex-col gap-1"
            style={{ background: 'var(--surface-raised)' }}
          >
            <p className="text-[10px] font-semibold uppercase tracking-widest" style={{ color: 'var(--muted)' }}>
              We saw
            </p>
            <p className="text-sm font-semibold" style={{ color: 'var(--foreground)' }}>
              {fail.observedProduct}
            </p>
          </div>

          {/* What we expected */}
          <div
            className="rounded-xl px-4 py-3 flex flex-col gap-1"
            style={{ background: 'var(--surface-raised)' }}
          >
            <p className="text-[10px] font-semibold uppercase tracking-widest" style={{ color: 'var(--muted)' }}>
              We expected
            </p>
            <p className="text-sm font-semibold" style={{ color: 'var(--foreground)' }}>
              {item.brand} {item.title}
            </p>
          </div>

          {/* Reason */}
          <p className="text-xs leading-relaxed" style={{ color: 'var(--muted)' }}>
            {fail.reason}
          </p>

          {/* Attempt indicator */}
          {!fail.flaggedForReview && (
            <p className="text-xs" style={{ color: 'var(--muted)' }}>
              Attempt {fail.consecutiveFailures} of 2 — one more failure will flag this item for manual review.
            </p>
          )}
        </div>
      </div>

      {/* Flagged-for-review state */}
      {fail.flaggedForReview ? (
        <div
          className="rounded-2xl border p-5 flex flex-col gap-3"
          style={{ background: 'rgba(251,191,36,0.06)', borderColor: 'rgba(251,191,36,0.3)' }}
        >
          <div className="flex items-center gap-2">
            <span className="text-xl">🚩</span>
            <p className="text-sm font-semibold" style={{ color: '#fbbf24' }}>
              Flagged for manual review
            </p>
          </div>
          <p className="text-xs leading-relaxed" style={{ color: 'var(--muted)' }}>
            We&apos;ll have a team member check this. You&apos;ll be notified within 24 hours.
            Your trust score has been updated.
          </p>
          <button
            onClick={() => router.push('/')}
            className="w-full text-sm font-bold py-3 rounded-full mt-1"
            style={{ background: 'var(--surface-raised)', color: 'var(--foreground)' }}
          >
            Back to My Items
          </button>
        </div>
      ) : (
        /* Retake CTA */
        <div className="flex flex-col gap-3">
          <button
            onClick={onRetake}
            className="w-full text-sm font-bold py-3.5 rounded-full transition-opacity active:opacity-80"
            style={{ background: 'var(--accent)', color: '#fff' }}
          >
            ↺ Retake photos
          </button>
          <p className="text-xs text-center leading-relaxed" style={{ color: 'var(--muted)' }}>
            Make sure you&apos;re photographing the {item.brand} {item.category} from your order.
            Show the brand label clearly in the second photo.
          </p>
        </div>
      )}
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function CaptureFlow({ item }: { item: Item }) {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [slots, setSlots] = useState<(SlotState | null)[]>([null, null, null]);
  const [error, setError] = useState<string | null>(null);
  const [checking, setChecking] = useState(false);
  // 'idle' | 'saving' | 'verifying'
  const [phase, setPhase] = useState<'idle' | 'saving' | 'verifying'>('idle');
  const [verifyFail, setVerifyFail] = useState<VerifyFail | null>(null);

  const cameraRef = useRef<HTMLInputElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const currentStep = STEPS[step];
  const currentSlot = slots[step];
  const isLast = step === STEPS.length - 1;
  const canProceed = !!currentSlot;
  const busy = phase !== 'idle';

  // ── File handler ─────────────────────────────────────────────────────────────
  const handleFile = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      e.target.value = '';
      if (!file) return;

      setError(null);
      setChecking(true);

      const result = await processPhoto(file);
      setChecking(false);

      if (!result.ok) {
        setError(result.error);
        return;
      }

      setSlots((prev) => {
        const next = [...prev];
        if (next[step]?.previewUrl) URL.revokeObjectURL(next[step]!.previewUrl);
        next[step] = { base64: result.base64, previewUrl: result.previewUrl };
        return next;
      });
    },
    [step],
  );

  const handleRetake = useCallback(() => {
    setSlots((prev) => {
      const next = [...prev];
      if (next[step]?.previewUrl) URL.revokeObjectURL(next[step]!.previewUrl);
      next[step] = null;
      return next;
    });
    setError(null);
  }, [step]);

  // ── Reset all photos (after a verification failure) ──────────────────────────
  const handleRetakeAll = useCallback(() => {
    slots.forEach((s) => { if (s?.previewUrl) URL.revokeObjectURL(s.previewUrl); });
    setSlots([null, null, null]);
    setStep(0);
    setError(null);
    setVerifyFail(null);
    setPhase('idle');
  }, [slots]);

  // ── Save + verify + navigate ─────────────────────────────────────────────────
  const handleFinish = useCallback(async () => {
    setPhase('saving');
    setError(null);
    try {
      // 1. Persist photos
      const photos = slots.map((s) => s?.base64 ?? '').filter(Boolean);
      const photoRes = await fetch(`/api/items/${item.id}/photos`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ photos }),
      });
      if (!photoRes.ok) throw new Error('Photo save failed');

      // 2. Identity verification gate
      setPhase('verifying');
      const verifyRes = await fetch('/api/verify-product', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ itemId: item.id }),
      });
      const verifyData = await verifyRes.json() as {
        status: string;
        result?: { observedProduct?: string; reason?: string };
        consecutiveFailures?: number;
        flaggedForReview?: boolean;
        error?: string;
      };

      if (!verifyRes.ok) {
        // API error (e.g. missing key) — surface it but don't block
        throw new Error(verifyData.error ?? 'Verification service error');
      }

      if (verifyData.status === 'fail') {
        setVerifyFail({
          observedProduct: verifyData.result?.observedProduct ?? 'Unknown product',
          reason: verifyData.result?.reason ?? 'The photos did not match the expected product.',
          consecutiveFailures: verifyData.consecutiveFailures ?? 1,
          flaggedForReview: verifyData.flaggedForReview ?? false,
        });
        setPhase('idle');
        return;
      }

      // 3. Pass or needs_review → proceed to grading
      router.push(`/item/${item.id}/result`);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Could not complete verification — please try again.');
      setPhase('idle');
    }
  }, [item.id, slots, router]);

  // ── Verification fail screen (replaces entire capture UI) ────────────────────
  if (verifyFail) {
    return (
      <VerifyFailScreen
        item={item}
        fail={verifyFail}
        onRetake={handleRetakeAll}
      />
    );
  }

  // ── Normal capture UI ─────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col gap-5 max-w-md mx-auto w-full">

      {/* Item heading */}
      <div className="flex flex-col gap-0.5">
        <p
          className="text-xs font-semibold uppercase tracking-widest"
          style={{ color: 'var(--accent)' }}
        >
          {item.category} · {item.brand}
        </p>
        <h1
          className="text-lg font-bold leading-snug"
          style={{ color: 'var(--foreground)' }}
        >
          {item.title}
        </h1>
      </div>

      {/* Progress */}
      <div className="flex flex-col gap-2">
        <div
          className="flex justify-between text-xs font-medium"
          style={{ color: 'var(--muted)' }}
        >
          <span>Step {step + 1} of {STEPS.length}</span>
          <span>{currentStep.label}</span>
        </div>
        <div className="flex gap-1.5">
          {STEPS.map((s, i) => (
            <div
              key={s.id}
              className="h-1.5 flex-1 rounded-full transition-all duration-300"
              style={{
                background:
                  i < step ? '#4ade80' : i === step ? 'var(--accent)' : 'var(--surface-raised)',
              }}
            />
          ))}
        </div>
      </div>

      {/* Step card */}
      <div
        className="rounded-2xl p-5 flex flex-col gap-4 border"
        style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}
      >
        {/* Step header */}
        <div className="flex items-start gap-3">
          <div
            className="w-11 h-11 rounded-xl flex items-center justify-center text-2xl shrink-0 mt-0.5"
            style={{ background: 'var(--surface-raised)' }}
          >
            {currentStep.icon}
          </div>
          <div className="flex flex-col gap-0.5">
            <h2 className="text-sm font-semibold" style={{ color: 'var(--foreground)' }}>
              {currentStep.label}
            </h2>
            <p className="text-xs leading-relaxed" style={{ color: 'var(--muted)' }}>
              {currentStep.instruction}
            </p>
          </div>
        </div>

        {/* Hints */}
        <div className="flex flex-col gap-1.5">
          <div
            className="text-xs px-3 py-1.5 rounded-lg"
            style={{ background: 'var(--surface-raised)', color: 'var(--muted)' }}
          >
            💡 {currentStep.hint}
          </div>
          <div
            className="text-xs px-3 py-1.5 rounded-lg italic"
            style={{ background: 'var(--surface-raised)', color: 'var(--muted)', opacity: 0.75 }}
          >
            {currentStep.example}
          </div>
        </div>

        {/* Photo slot */}
        {currentSlot ? (
          <div className="relative w-full aspect-4/3 rounded-xl overflow-hidden">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={currentSlot.previewUrl}
              alt={currentStep.label}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-linear-to-t from-black/60 via-transparent to-transparent" />
            <div
              className="absolute top-3 left-3 text-xs font-semibold px-2.5 py-1 rounded-full flex items-center gap-1"
              style={{ background: 'rgba(74,222,128,0.15)', color: '#4ade80', border: '1px solid rgba(74,222,128,0.35)' }}
            >
              ✓ Accepted
            </div>
            <button
              onClick={handleRetake}
              className="absolute bottom-3 right-3 text-xs font-semibold px-3 py-1.5 rounded-full transition-opacity"
              style={{ background: 'rgba(0,0,0,0.65)', color: '#fff', backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)' }}
            >
              ↺ Retake
            </button>
          </div>
        ) : (
          <div
            className="w-full aspect-4/3 rounded-xl border-2 border-dashed flex flex-col items-center justify-center gap-5"
            style={{ borderColor: checking ? 'var(--accent)' : 'var(--border)' }}
          >
            {checking ? (
              <div className="flex flex-col items-center gap-3">
                <div
                  className="w-9 h-9 rounded-full border-[3px] border-t-transparent animate-spin"
                  style={{ borderColor: 'var(--accent)', borderTopColor: 'transparent' }}
                />
                <p className="text-xs font-medium" style={{ color: 'var(--muted)' }}>
                  Checking quality…
                </p>
              </div>
            ) : (
              <>
                <span className="text-5xl opacity-20 select-none">📷</span>
                <div className="flex flex-col sm:flex-row gap-2 w-full px-5">
                  <button
                    onClick={() => cameraRef.current?.click()}
                    className="flex-1 text-sm font-semibold px-4 py-2.5 rounded-full transition-opacity active:opacity-80"
                    style={{ background: 'var(--accent)', color: '#fff' }}
                  >
                    Use Camera
                  </button>
                  <button
                    onClick={() => fileRef.current?.click()}
                    className="flex-1 text-sm font-semibold px-4 py-2.5 rounded-full border transition-colors"
                    style={{ borderColor: 'var(--border)', color: 'var(--foreground)', background: 'var(--surface-raised)' }}
                  >
                    Choose Photo
                  </button>
                </div>
              </>
            )}
          </div>
        )}

        {/* Error */}
        {error && (
          <div
            className="flex items-start gap-2.5 text-sm px-4 py-3 rounded-xl"
            style={{ background: 'rgba(239,68,68,0.08)', color: '#f87171', border: '1px solid rgba(239,68,68,0.25)' }}
          >
            <span className="shrink-0 mt-px">⚠</span>
            <span className="leading-relaxed">{error}</span>
          </div>
        )}
      </div>

      {/* Navigation */}
      <div className="flex gap-3">
        {step > 0 && (
          <button
            onClick={() => { setStep((s) => s - 1); setError(null); }}
            className="text-sm font-semibold px-5 py-2.5 rounded-full border transition-colors"
            style={{ borderColor: 'var(--border)', color: 'var(--foreground)', background: 'var(--surface)' }}
          >
            ← Back
          </button>
        )}

        {!isLast ? (
          <button
            onClick={() => { setStep((s) => s + 1); setError(null); }}
            disabled={!canProceed}
            className="flex-1 text-sm font-semibold px-4 py-2.5 rounded-full transition-all"
            style={{
              background: canProceed ? 'var(--accent)' : 'var(--surface-raised)',
              color: canProceed ? '#fff' : 'var(--muted)',
              cursor: canProceed ? 'pointer' : 'not-allowed',
            }}
          >
            Next → {STEPS[step + 1].label}
          </button>
        ) : (
          <button
            onClick={handleFinish}
            disabled={!canProceed || busy}
            className="flex-1 text-sm font-semibold px-4 py-2.5 rounded-full transition-all"
            style={{
              background: canProceed && !busy ? 'var(--accent)' : 'var(--surface-raised)',
              color: canProceed && !busy ? '#fff' : 'var(--muted)',
              cursor: canProceed && !busy ? 'pointer' : 'not-allowed',
            }}
          >
            {phase === 'verifying' ? (
              <span className="flex items-center justify-center gap-2">
                <span
                  className="inline-block w-4 h-4 rounded-full border-2 border-t-transparent animate-spin"
                  style={{ borderColor: 'var(--muted)', borderTopColor: 'transparent' }}
                />
                Verifying identity…
              </span>
            ) : phase === 'saving' ? (
              <span className="flex items-center justify-center gap-2">
                <span
                  className="inline-block w-4 h-4 rounded-full border-2 border-t-transparent animate-spin"
                  style={{ borderColor: 'var(--muted)', borderTopColor: 'transparent' }}
                />
                Saving…
              </span>
            ) : (
              'Finish & Grade →'
            )}
          </button>
        )}
      </div>

      {/* Thumbnail strip */}
      <div
        className="rounded-2xl p-4 border flex items-center gap-3"
        style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}
      >
        <p className="text-xs font-medium shrink-0" style={{ color: 'var(--muted)' }}>
          All shots:
        </p>
        <div className="flex gap-2">
          {STEPS.map((s, i) => {
            const slot = slots[i];
            const isCurrent = i === step;
            return (
              <div
                key={s.id}
                className="w-14 h-14 rounded-xl overflow-hidden shrink-0 transition-all"
                style={{
                  border: `2px solid ${isCurrent ? 'var(--accent)' : slot ? '#4ade80' : 'var(--border)'}`,
                  background: 'var(--surface-raised)',
                  boxShadow: isCurrent ? '0 0 0 3px rgba(249,115,22,0.2)' : 'none',
                }}
              >
                {slot ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={slot.previewUrl} alt={s.label} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-xl opacity-40">
                    {s.icon}
                  </div>
                )}
              </div>
            );
          })}
        </div>
        <p className="text-xs ml-auto shrink-0" style={{ color: 'var(--muted)' }}>
          {slots.filter(Boolean).length}/{STEPS.length}
        </p>
      </div>

      {/* Verification status banner (needs_review warning) */}
      {phase === 'verifying' && (
        <div
          className="rounded-xl px-4 py-3 text-xs text-center"
          style={{ background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--muted)' }}
        >
          🔍 Checking that these photos match your order — takes a few seconds
        </div>
      )}

      {/* Hidden inputs */}
      <input
        ref={cameraRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={handleFile}
      />
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFile}
      />
    </div>
  );
}
