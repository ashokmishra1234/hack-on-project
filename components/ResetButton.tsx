'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function ResetButton() {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleReset() {
    if (!confirm('Reset all demo data? This clears photos, assessments, trust score, and green credits.')) return;
    setLoading(true);
    try {
      await fetch('/api/demo/reset', { method: 'POST' });
      router.push('/');
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      onClick={handleReset}
      disabled={loading}
      className="text-sm font-semibold px-5 py-2.5 rounded-full border transition-colors"
      style={{
        borderColor: 'rgba(248,113,113,0.4)',
        color: loading ? 'var(--muted)' : '#f87171',
        background: loading ? 'var(--surface-raised)' : 'rgba(248,113,113,0.06)',
        cursor: loading ? 'not-allowed' : 'pointer',
      }}
    >
      {loading ? 'Resetting…' : '↺ Reset demo'}
    </button>
  );
}
