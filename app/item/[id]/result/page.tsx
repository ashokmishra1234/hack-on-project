// Placeholder for Layer 2: AI grading, pricing, and route recommendation.

import { getItem } from '@/lib/store';
import { notFound } from 'next/navigation';
import Link from 'next/link';

export default async function ResultPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const item = getItem(id);
  if (!item) notFound();

  return (
    <div className="flex flex-col items-center gap-8 py-16 max-w-sm mx-auto text-center">

      {/* Success mark */}
      <div className="flex flex-col items-center gap-4">
        <div
          className="w-20 h-20 rounded-2xl flex items-center justify-center text-4xl"
          style={{ background: 'var(--surface)' }}
        >
          ✅
        </div>
        <div className="flex flex-col gap-1.5">
          <h1 className="text-xl font-bold" style={{ color: 'var(--foreground)' }}>
            Photos saved!
          </h1>
          <p className="text-sm leading-relaxed" style={{ color: 'var(--muted)' }}>
            {item.photos.length} photo{item.photos.length !== 1 ? 's' : ''} captured for{' '}
            <span style={{ color: 'var(--foreground)', fontWeight: 600 }}>
              {item.title}
            </span>
            .
          </p>
        </div>
      </div>

      {/* Next-layer teaser */}
      <div
        className="w-full rounded-2xl p-5 border flex flex-col gap-2 text-left"
        style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}
      >
        <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: 'var(--accent)' }}>
          Coming in Layer 2
        </p>
        <ul className="flex flex-col gap-1.5">
          {['AI condition grading (Claude Vision)', 'Resale price estimate in INR', 'Route recommendation (ship · refurbish · donate)'].map((t) => (
            <li key={t} className="text-sm flex items-center gap-2" style={{ color: 'var(--muted)' }}>
              <span style={{ color: 'var(--border)' }}>—</span> {t}
            </li>
          ))}
        </ul>
      </div>

      <Link
        href="/"
        className="text-sm font-semibold px-6 py-2.5 rounded-full transition-opacity active:opacity-80"
        style={{ background: 'var(--accent)', color: '#fff' }}
      >
        ← Back to My Items
      </Link>
    </div>
  );
}
