// Layer 2 will implement photo capture and AI grading here.
// For now this is a placeholder so navigation doesn't 404.

export default async function CapturePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return (
    <div className="flex flex-col items-center justify-center gap-6 py-24 text-center">
      <div
        className="w-20 h-20 rounded-2xl flex items-center justify-center text-4xl"
        style={{ background: 'var(--surface-raised)' }}
      >
        📷
      </div>
      <div className="flex flex-col gap-2">
        <h1 className="text-xl font-bold" style={{ color: 'var(--foreground)' }}>
          Capture — coming soon
        </h1>
        <p className="text-sm max-w-xs" style={{ color: 'var(--muted)' }}>
          Item <span className="font-mono" style={{ color: 'var(--accent)' }}>{id}</span>
          {' '}· Photo upload and AI grading will be wired up in Layer 2.
        </p>
      </div>
      <a
        href="/"
        className="text-sm font-semibold px-5 py-2.5 rounded-full transition-colors"
        style={{ background: 'var(--surface)', color: 'var(--foreground)', border: '1px solid var(--border)' }}
      >
        ← Back to My Items
      </a>
    </div>
  );
}
