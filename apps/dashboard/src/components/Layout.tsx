import { type ReactNode } from 'react';
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
  const displayName = address ? `${address.slice(0, 6)}…${address.slice(-4)}` : null;

  return (
    <div className="flex h-dvh w-screen overflow-hidden">
      <aside className="w-[220px] shrink-0 bg-aegis-sidebar border-r border-aegis-border flex flex-col py-6">
        <div className="px-5 pb-7">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-aegis-purple flex items-center justify-center text-base font-bold text-white">
              A
            </div>
            <span className="text-[17px] font-bold text-aegis-text">Aegis</span>
          </div>
        </div>

        <nav className="flex-1 px-3 flex flex-col gap-0.5">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === '/'}
              className={({ isActive }) =>
                `flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-all duration-150 ${
                  isActive
                    ? 'font-semibold text-aegis-text bg-aegis-purple-dim'
                    : 'font-normal text-aegis-muted hover:text-aegis-text'
                }`
              }
            >
              <span className="text-base w-[18px] text-center">{item.icon}</span>
              {item.label}
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
