'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

type BuyerMini = { id: string; name: string; city: string };

type Props = {
  role: string;
  buyers: BuyerMini[];
  activeBuyerId?: string;
};

function setCookie(name: string, value: string) {
  document.cookie = `${name}=${encodeURIComponent(value)}; path=/; max-age=86400; SameSite=Lax`;
}

function deleteCookie(name: string) {
  document.cookie = `${name}=; path=/; max-age=0`;
}

export default function RoleSwitcher({ role, buyers, activeBuyerId }: Props) {
  const [open, setOpen] = useState(false);
  const router = useRouter();

  function switchToBuyer(buyerId: string) {
    setCookie('bridge-role', 'buyer');
    setCookie('bridge-buyer-id', buyerId);
    setOpen(false);
    router.push('/shop');
    router.refresh();
  }

  function switchToSeller() {
    deleteCookie('bridge-role');
    deleteCookie('bridge-buyer-id');
    router.push('/');
    router.refresh();
  }

  if (role === 'buyer') {
    return (
      <button
        onClick={switchToSeller}
        className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold transition-colors"
        style={{
          background: 'var(--surface-raised)',
          color: 'var(--muted)',
          border: '1px solid var(--border)',
        }}
      >
        ← Sell
      </button>
    );
  }

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold transition-colors"
        style={{
          background: open ? 'rgba(249,115,22,0.15)' : 'var(--surface-raised)',
          color: open ? 'var(--accent)' : 'var(--muted)',
          border: `1px solid ${open ? 'rgba(249,115,22,0.4)' : 'var(--border)'}`,
        }}
        aria-expanded={open}
        aria-haspopup="listbox"
      >
        Browse
        <span style={{ fontSize: '0.6rem' }}>{open ? '▲' : '▼'}</span>
      </button>

      {open && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-40"
            onClick={() => setOpen(false)}
          />
          {/* Dropdown */}
          <div
            className="absolute right-0 top-full mt-1 rounded-xl overflow-hidden z-50 w-52 py-1"
            style={{
              background: 'var(--surface-raised)',
              border: '1px solid var(--border)',
              boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
            }}
            role="listbox"
          >
            <p
              className="px-3 py-2 text-xs font-semibold uppercase tracking-widest"
              style={{ color: 'var(--muted)' }}
            >
              Browse as buyer
            </p>
            {buyers.map((b) => {
              const isActive = b.id === activeBuyerId;
              return (
                <button
                  key={b.id}
                  role="option"
                  aria-selected={isActive}
                  onClick={() => switchToBuyer(b.id)}
                  className="w-full text-left px-3 py-2 text-sm transition-colors"
                  style={{
                    background: isActive ? 'rgba(249,115,22,0.12)' : 'transparent',
                    color: isActive ? 'var(--accent)' : 'var(--foreground)',
                  }}
                  onMouseEnter={(e) => {
                    if (!isActive) (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.05)';
                  }}
                  onMouseLeave={(e) => {
                    if (!isActive) (e.currentTarget as HTMLButtonElement).style.background = 'transparent';
                  }}
                >
                  <span className="font-medium">{b.name}</span>
                  <span className="text-xs ml-1" style={{ color: 'var(--muted)' }}>
                    · {b.city}
                  </span>
                </button>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
