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
        className="shrink-0 bg-aegis-sidebar border-r border-aegis-border flex flex-col py-6 overflow-hidden"
        style={{ width: open ? 220 : 52, transition: 'width 0.2s ease' }}
      >
        <div
          className="pb-7 flex items-center"
          style={{ padding: open ? '0 12px 28px 20px' : '0 0 28px 0', justifyContent: open ? 'space-between' : 'center' }}
        >
          {open && (
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-aegis-purple flex items-center justify-center text-base font-bold text-white shrink-0">
                A
              </div>
              <span className="text-[17px] font-bold text-aegis-text whitespace-nowrap">Aegis</span>
            </div>
          )}
          <button
            onClick={() => setOpen((v) => !v)}
            className="w-7 h-7 rounded-md flex items-center justify-center text-aegis-muted hover:text-aegis-text hover:bg-aegis-purple-dim transition-colors shrink-0"
          >
            <ChevronIcon open={open} />
          </button>
        </div>

        <nav className="flex-1 px-1.5 flex flex-col gap-0.5">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === '/'}
              title={!open ? item.label : undefined}
              className={({ isActive }) =>
                `flex items-center gap-2.5 py-2 rounded-lg text-sm transition-all duration-150 ${
                  open ? 'px-3' : 'justify-center px-0'
                } ${
                  isActive
                    ? 'font-semibold text-aegis-text bg-aegis-purple-dim'
                    : 'font-normal text-aegis-muted hover:text-aegis-text'
                }`
              }
            >
              <span className="text-base w-[18px] text-center shrink-0">{item.icon}</span>
              {open && <span className="whitespace-nowrap">{item.label}</span>}
            </NavLink>
          ))}
        </nav>
      </aside>

      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="h-16 shrink-0 border-b border-aegis-border flex items-center justify-between px-7 bg-aegis-sidebar">
          <div>
            <div className="text-base font-semibold text-aegis-text">
              {displayName ? `Hello, ${displayName}` : 'Hello'}
            </div>
            <div className="text-xs text-aegis-muted">Monitor and manage your AI agents</div>
          </div>
          <ConnectButton chainStatus="icon" showBalance={false} />
        </header>

        <main className="flex-1 overflow-y-auto p-7 bg-aegis-base">{children}</main>
      </div>
    </div>
  );
}
