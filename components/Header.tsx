import Link from 'next/link';
import { getTrustRecord, isTrustedSeller } from '@/lib/trust';
import { getGreenRecord } from '@/lib/green';

export default function Header() {
  const trust   = getTrustRecord('user-current');
  const green   = getGreenRecord('user-current');
  const trusted = isTrustedSeller(trust.score);

  return (
    <header
      className="w-full border-b sticky top-0 z-50"
      style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}
    >
      <div className="max-w-5xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2">
          <span className="text-lg font-bold tracking-tight" style={{ color: 'var(--foreground)' }}>
            the
          </span>
          <span className="text-lg font-bold tracking-tight" style={{ color: 'var(--accent)' }}>
            bridge
          </span>
          <span
            className="text-xs font-medium px-1.5 py-0.5 rounded ml-1"
            style={{ background: 'var(--surface-raised)', color: 'var(--muted)' }}
          >
            beta
          </span>
        </Link>

        {/* Nav */}
        <nav className="flex items-center gap-2 sm:gap-3">
          <span className="text-sm font-medium hidden sm:block" style={{ color: 'var(--muted)' }}>
            Arjun V.
          </span>

          {/* Green credits pill */}
          <Link
            href="/dashboard"
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold transition-colors"
            style={{
              background: 'rgba(74,222,128,0.10)',
              color: '#4ade80',
              border: '1px solid rgba(74,222,128,0.25)',
            }}
            title="Green Credits — view dashboard"
          >
            🌱 {green.totalCredits}
          </Link>

          {/* Trust score pill */}
          <Link
            href="/dashboard"
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold transition-colors"
            style={{
              background: trusted ? 'rgba(249,115,22,0.12)' : 'var(--surface-raised)',
              color:      trusted ? 'var(--accent)'          : 'var(--muted)',
              border:     `1px solid ${trusted ? 'rgba(249,115,22,0.3)' : 'var(--border)'}`,
            }}
            title="Trust Score — view dashboard"
          >
            🛡 {trust.score}
          </Link>

          {/* Avatar */}
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold shrink-0"
            style={{ background: 'var(--accent)', color: '#fff' }}
          >
            A
          </div>
        </nav>
      </div>
    </header>
  );
}
