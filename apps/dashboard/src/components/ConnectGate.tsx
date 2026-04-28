import { useConnect } from 'wagmi';
import { injected } from 'wagmi/connectors';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AegisLogo from './AegisLogo';
import { useDemoMode } from '../context/DemoContext';

export default function ConnectGate() {
  const { connect } = useConnect();
  const { enableDemo, enableBrowse } = useDemoMode();
  const navigate = useNavigate();
  const [connecting, setConnecting] = useState(false);

  const handleConnect = async () => {
    setConnecting(true);
    try {
      connect({ connector: injected() });
    } finally {
      setConnecting(false);
    }
  };

  const handleDemo = () => {
    enableDemo();
    navigate('/app');
  };

  const handleBrowse = () => {
    enableBrowse();
    navigate('/app/attestations');
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
      <div style={{ filter: 'drop-shadow(0 0 24px rgba(124,58,237,0.4))' }}>
        <AegisLogo variant="purple" size={52} />
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

      <button
        onClick={handleDemo}
        style={{
          background: 'none',
          border: '1px solid var(--app-border)',
          borderRadius: 8,
          padding: '10px 28px',
          fontSize: 14,
          color: 'var(--app-text-muted)',
          cursor: 'pointer',
          transition: 'border-color 0.15s, color 0.15s',
        }}
        onMouseEnter={(e) => {
          (e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(212,148,26,0.5)';
          (e.currentTarget as HTMLButtonElement).style.color = 'var(--app-accent-light)';
        }}
        onMouseLeave={(e) => {
          (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--app-border)';
          (e.currentTarget as HTMLButtonElement).style.color = 'var(--app-text-muted)';
        }}
      >
        Try Demo
      </button>

      <button
        onClick={handleBrowse}
        style={{
          background: 'none',
          border: 'none',
          padding: 0,
          fontSize: 13,
          color: 'var(--app-text-muted)',
          cursor: 'pointer',
          textDecoration: 'underline',
          textUnderlineOffset: 3,
        }}
      >
        Browse public feed without connecting
      </button>

      <a href="/" style={{ fontSize: 13, color: 'var(--app-text-muted)' }}>
        Back to home
      </a>
    </div>
  );
}
