import Link from 'next/link';

export default function Header() {
  return (
    <header
      className="w-full border-b sticky top-0 z-50"
      style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}
    >
      <div className="max-w-5xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 group">
          <span
            className="text-lg font-bold tracking-tight"
            style={{ color: 'var(--foreground)' }}
          >
            the
          </span>
          <span
            className="text-lg font-bold tracking-tight transition-colors"
            style={{ color: 'var(--accent)' }}
          >
            bridge
          </span>
          <span
            className="text-xs font-medium px-1.5 py-0.5 rounded ml-1"
            style={{ background: 'var(--surface-raised)', color: 'var(--muted)' }}
          >
            beta
          </span>
        </Link>

        <nav className="flex items-center gap-4">
          <span
            className="text-sm font-medium"
            style={{ color: 'var(--muted)' }}
          >
            Arjun V.
          </span>
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold"
            style={{ background: 'var(--accent)', color: '#fff' }}
          >
            A
          </div>
        </nav>
      </div>
    </header>
  );
}
