import { useNavigate, useLocation, NavLink } from 'react-router-dom';
import { useAccount, useDisconnect } from 'wagmi';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import AegisLogo from './AegisLogo';
import ThemeToggle from './ThemeToggle';

const NAV = [
  {
    path: '/app',
    label: 'Overview',
    icon: (
      <svg
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <rect x="3" y="3" width="7" height="7" />
        <rect x="14" y="3" width="7" height="7" />
        <rect x="14" y="14" width="7" height="7" />
        <rect x="3" y="14" width="7" height="7" />
      </svg>
    ),
  },
  {
    path: '/app/register',
    label: 'Register Agent',
    icon: (
      <svg
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <circle cx="12" cy="12" r="10" />
        <line x1="12" y1="8" x2="12" y2="16" />
        <line x1="8" y1="12" x2="16" y2="12" />
      </svg>
    ),
  },
  {
    path: '/app/attestations',
    label: 'Attestations',
    icon: (
      <svg
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
        <polyline points="14 2 14 8 20 8" />
        <line x1="16" y1="13" x2="8" y2="13" />
        <line x1="16" y1="17" x2="8" y2="17" />
        <polyline points="10 9 9 9 8 9" />
      </svg>
    ),
  },
  {
    path: '/app/timeline',
    label: 'Timeline',
    icon: (
      <svg
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <line x1="8" y1="6" x2="21" y2="6" />
        <line x1="8" y1="12" x2="21" y2="12" />
        <line x1="8" y1="18" x2="21" y2="18" />
        <line x1="3" y1="6" x2="3.01" y2="6" />
        <line x1="3" y1="12" x2="3.01" y2="12" />
        <line x1="3" y1="18" x2="3.01" y2="18" />
      </svg>
    ),
  },
  {
    path: '/app/disputes',
    label: 'Disputes',
    icon: (
      <svg
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
        <line x1="12" y1="9" x2="12" y2="13" />
        <line x1="12" y1="17" x2="12.01" y2="17" />
      </svg>
    ),
  },
  {
    path: '/app/agents',
    label: 'Agent Profile',
    icon: (
      <svg
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" />
        <circle cx="12" cy="7" r="4" />
      </svg>
    ),
  },
  {
    path: '/app/audit',
    label: 'KeeperHub',
    icon: (
      <svg
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
      </svg>
    ),
  },
];

export default function AppShell({ children }: { children: React.ReactNode }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { address } = useAccount();
  const { disconnect } = useDisconnect();

  const short = address ? `${address.slice(0, 6)}…${address.slice(-4)}` : '';

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden' }}>
      <aside
        style={{
          width: 220,
          flexShrink: 0,
          background: 'var(--app-surface)',
          borderRight: '1px solid var(--app-border)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            height: 64,
            borderBottom: '1px solid var(--app-border)',
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            padding: '0 20px',
            flexShrink: 0,
            cursor: 'pointer',
          }}
          onClick={() => navigate('/')}
        >
          <AegisLogo variant="gold" size={30} showWordmark wordmarkColor="var(--app-text)" />
        </div>

        <nav style={{ flex: 1, padding: '12px 10px', overflowY: 'auto' }}>
          {NAV.map((item) => {
            const active =
              item.path === '/app'
                ? location.pathname === '/app'
                : location.pathname.startsWith(item.path);
            return (
              <NavLink
                key={item.path}
                to={item.path}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  padding: '9px 12px',
                  borderRadius: 8,
                  marginBottom: 2,
                  fontSize: 13,
                  fontWeight: active ? 600 : 400,
                  color: active ? 'var(--app-text)' : 'var(--app-text-2)',
                  background: active ? 'var(--app-accent-dim)' : 'transparent',
                  border: active ? '1px solid rgba(212,148,26,0.25)' : '1px solid transparent',
                  textDecoration: 'none',
                  transition: 'all 0.1s',
                }}
              >
                <span
                  style={{ color: active ? 'var(--app-accent-light)' : 'var(--app-text-muted)', flexShrink: 0 }}
                >
                  {item.icon}
                </span>
                {item.label}
              </NavLink>
            );
          })}
        </nav>

        <div
          style={{
            padding: '12px 10px',
            borderTop: '1px solid var(--app-border)',
            flexShrink: 0,
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              padding: '10px 12px',
              background: 'var(--app-elevated)',
              borderRadius: 8,
              border: '1px solid var(--app-border)',
            }}
          >
            <div
              style={{
                width: 28,
                height: 28,
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #d4941a 0%, #b8780e 100%)',
                flexShrink: 0,
              }}
            />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div
                style={{
                  fontSize: 12,
                  fontWeight: 600,
                  color: 'var(--app-text)',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                {short}
              </div>
              <div style={{ fontSize: 10, color: 'var(--app-text-muted)' }}>0G Galileo</div>
            </div>
            <button
              onClick={() => disconnect()}
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                color: 'var(--app-text-muted)',
                padding: 2,
                flexShrink: 0,
              }}
              title="Disconnect"
            >
              <svg
                width="13"
                height="13"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4" />
                <polyline points="16 17 21 12 16 7" />
                <line x1="21" y1="12" x2="9" y2="12" />
              </svg>
            </button>
          </div>
        </div>
      </aside>

      <div
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          minWidth: 0,
        }}
      >
        <header
          style={{
            height: 64,
            borderBottom: '1px solid var(--app-border)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '0 28px',
            flexShrink: 0,
            background: 'var(--app-surface)',
          }}
        >
          <div>
            <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--app-text)' }}>
              {NAV.find((n) =>
                n.path === '/app'
                  ? location.pathname === '/app'
                  : location.pathname.startsWith(n.path)
              )?.label ?? 'Dashboard'}
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <ThemeToggle />
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                fontSize: 12,
                color: 'var(--app-green)',
                background: 'var(--app-green-dim)',
                border: '1px solid rgba(34,197,94,0.2)',
                borderRadius: 6,
                padding: '5px 10px',
                fontWeight: 600,
              }}
            >
              <span className="app-pulse-dot" />4 Nodes Live
            </div>
            <ConnectButton chainStatus="none" showBalance={false} accountStatus="address" />
          </div>
        </header>

        <main style={{ flex: 1, overflowY: 'auto', padding: '28px', background: 'var(--app-bg)' }}>
          {children}
        </main>
      </div>
    </div>
  );
}
