import { useState, type ReactNode } from 'react';
import { NavLink } from 'react-router-dom';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { useAccount } from 'wagmi';

const navItems = [
  { path: '/', label: 'Dashboard', icon: '⬡' },
  { path: '/agents', label: 'Agents', icon: '◎' },
  { path: '/attestations', label: 'Attestations', icon: '◷' },
  { path: '/timeline', label: 'Timeline', icon: '≡' },
  { path: '/disputes', label: 'Disputes', icon: '⚑' },
  { path: '/audit', label: 'Keeper Audit', icon: '◉' },
  { path: '/register', label: 'Register', icon: '⊕' },
];

function ChevronIcon({ open }: { open: boolean }) {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      style={{ transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}
    >
      <polyline points="15 18 9 12 15 6" />
    </svg>
  );
}

export default function Layout({ children }: { children: ReactNode }) {
  const { address } = useAccount();
  const [open, setOpen] = useState(true);
  const displayName = address ? `${address.slice(0, 6)}…${address.slice(-4)}` : null;

  return (
    <div className="flex h-dvh w-screen overflow-hidden">
      <aside
        style={{
          width: open ? 220 : 52,
          transition: 'width 0.2s ease',
          flexShrink: 0,
          background: 'var(--app-surface)',
          borderRight: '1px solid var(--app-border)',
          display: 'flex',
          flexDirection: 'column',
          padding: '24px 0',
          overflow: 'hidden',
        }}
      >
        <div
          className="pb-7 flex items-center"
          style={{ padding: open ? '0 12px 28px 20px' : '0 0 28px 0', justifyContent: open ? 'space-between' : 'center' }}
        >
          {open && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 32, height: 32, borderRadius: 8, background: 'var(--app-accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 15, fontWeight: 700, color: '#0a0a08', flexShrink: 0 }}>
                A
              </div>
              <span style={{ fontSize: 17, fontWeight: 700, color: 'var(--app-text)', whiteSpace: 'nowrap' }}>Aegis</span>
            </div>
          )}
          <button
            onClick={() => setOpen((v) => !v)}
            style={{
              width: 28,
              height: 28,
              borderRadius: 6,
              border: 'none',
              background: 'transparent',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--app-text-muted)',
              cursor: 'pointer',
              flexShrink: 0,
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLButtonElement).style.color = 'var(--app-text)';
              (e.currentTarget as HTMLButtonElement).style.background = 'var(--app-elevated)';
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLButtonElement).style.color = 'var(--app-text-muted)';
              (e.currentTarget as HTMLButtonElement).style.background = 'transparent';
            }}
          >
            <ChevronIcon open={open} />
          </button>
        </div>

        <nav style={{ flex: 1, padding: '0 6px', display: 'flex', flexDirection: 'column', gap: 2 }}>
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === '/'}
              title={!open ? item.label : undefined}
              style={({ isActive }) => ({
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                padding: open ? '8px 12px' : '8px 0',
                justifyContent: open ? 'flex-start' : 'center',
                borderRadius: 8,
                fontSize: 14,
                fontWeight: isActive ? 600 : 400,
                color: isActive ? 'var(--app-text)' : 'var(--app-text-muted)',
                background: isActive ? 'var(--app-elevated)' : 'transparent',
                transition: 'color 0.15s, background 0.15s',
                textDecoration: 'none',
              })}
            >
              <span style={{ fontSize: 16, width: 18, textAlign: 'center', flexShrink: 0 }}>{item.icon}</span>
              {open && <span style={{ whiteSpace: 'nowrap' }}>{item.label}</span>}
            </NavLink>
          ))}
        </nav>
      </aside>

      <div className="flex-1 flex flex-col overflow-hidden">
        <header style={{ height: 64, flexShrink: 0, borderBottom: '1px solid var(--app-border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 28px', background: 'var(--app-surface)' }}>
          <div>
            <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--app-text)' }}>
              {displayName ? `Hello, ${displayName}` : 'Hello'}
            </div>
            <div style={{ fontSize: 12, color: 'var(--app-text-muted)' }}>Monitor and manage your AI agents</div>
          </div>
          <ConnectButton chainStatus="icon" showBalance={false} />
        </header>

        <main style={{ flex: 1, overflowY: 'auto', padding: 28, background: 'var(--app-bg)' }}>{children}</main>
      </div>
    </div>
  );
}
