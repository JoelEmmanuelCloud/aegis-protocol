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

export default function Layout({ children }: { children: ReactNode }) {
  const { address } = useAccount();
  const [open, setOpen] = useState(true);
  const displayName = address ? `${address.slice(0, 6)}…${address.slice(-4)}` : null;

  return (
    <div style={{ display: 'flex', height: '100dvh', width: '100vw', overflow: 'hidden' }}>
      <aside
        style={{
          width: open ? 220 : 52,
          flexShrink: 0,
          background: 'var(--app-surface)',
          borderRight: '1px solid var(--app-border)',
          display: 'flex',
          flexDirection: 'column',
          padding: '20px 0',
          overflow: 'hidden',
          transition: 'width 0.2s ease',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: open ? 'space-between' : 'center',
            padding: open ? '0 10px 24px 16px' : '0 0 24px 0',
            minHeight: 40,
          }}
        >
          {open && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, overflow: 'hidden' }}>
              <div
                style={{
                  width: 30,
                  height: 30,
                  borderRadius: 7,
                  background: 'var(--app-accent)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 14,
                  fontWeight: 700,
                  color: '#0a0a08',
                  flexShrink: 0,
                }}
              >
                A
              </div>
              <span
                style={{
                  fontSize: 16,
                  fontWeight: 700,
                  color: 'var(--app-text)',
                  whiteSpace: 'nowrap',
                }}
              >
                Aegis
              </span>
            </div>
          )}

          <button
            onClick={() => setOpen((v) => !v)}
            style={{
              width: 28,
              height: 28,
              borderRadius: 6,
              border: '1px solid var(--app-border)',
              background: 'var(--app-elevated)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              flexShrink: 0,
              color: 'var(--app-text)',
              fontSize: 13,
              lineHeight: 1,
              userSelect: 'none',
            }}
            title={open ? 'Collapse sidebar' : 'Expand sidebar'}
          >
            {open ? '‹' : '›'}
          </button>
        </div>

        <nav
          style={{ flex: 1, padding: '0 6px', display: 'flex', flexDirection: 'column', gap: 2 }}
        >
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
              <span style={{ fontSize: 16, width: 18, textAlign: 'center', flexShrink: 0 }}>
                {item.icon}
              </span>
              {open && <span style={{ whiteSpace: 'nowrap' }}>{item.label}</span>}
            </NavLink>
          ))}
        </nav>
      </aside>

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <header
          style={{
            height: 64,
            flexShrink: 0,
            borderBottom: '1px solid var(--app-border)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '0 28px',
            background: 'var(--app-surface)',
          }}
        >
          <div>
            <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--app-text)' }}>
              {displayName ? `Hello, ${displayName}` : 'Hello'}
            </div>
            <div style={{ fontSize: 12, color: 'var(--app-text-muted)' }}>
              Monitor and manage your AI agents
            </div>
          </div>
          <ConnectButton chainStatus="icon" showBalance={false} />
        </header>

        <main style={{ flex: 1, overflowY: 'auto', padding: 28, background: 'var(--app-bg)' }}>
          {children}
        </main>
      </div>
    </div>
  );
}
