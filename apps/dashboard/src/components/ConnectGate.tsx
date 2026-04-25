import { useConnect } from 'wagmi';
import { injected } from 'wagmi/connectors';
import { useState } from 'react';

export default function ConnectGate() {
  const { connect } = useConnect();
  const [connecting, setConnecting] = useState(false);

  const handleConnect = async () => {
    setConnecting(true);
    try {
      connect({ connector: injected() });
    } finally {
      setConnecting(false);
    }
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        background: 'var(--app-bg)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 24,
        padding: 24,
      }}
    >
      <div
        style={{
          width: 56,
          height: 56,
          background: 'var(--app-accent)',
          borderRadius: 14,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 0 40px var(--accent-glow)',
        }}
      >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
          <path
            d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"
            stroke="white"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>

      <div style={{ textAlign: 'center', maxWidth: 360 }}>
        <h1 style={{ fontSize: 24, fontWeight: 700, letterSpacing: '-0.02em', marginBottom: 10 }}>
          Connect your wallet
        </h1>
        <p style={{ fontSize: 14, color: 'var(--app-text-2)', lineHeight: 1.7 }}>
          Connect your wallet to access the Aegis dashboard, register agents, and monitor
          accountability records.
        </p>
      </div>

      <button
        className="app-btn-primary"
        style={{ padding: '12px 32px', fontSize: 15 }}
        onClick={handleConnect}
      >
        {connecting ? 'Connecting…' : 'Connect Wallet'}
      </button>

      <a href="/" style={{ fontSize: 13, color: 'var(--text-muted)' }}>
        Back to home
      </a>
    </div>
  );
}
