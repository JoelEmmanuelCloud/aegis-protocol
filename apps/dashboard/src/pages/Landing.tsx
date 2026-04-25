import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAccount, useConnect } from 'wagmi';
import { injected } from 'wagmi/connectors';

const INTEGRATION_SNIPPET = `await fetch("http://localhost:9002/send", {
  method: "POST",
  headers: {
    "X-Destination-Peer-Id": AEGIS_WITNESS_PEER_ID
  },
  body: JSON.stringify({
    type:      "ATTEST_DECISION",
    agentId:   "trading-bot.aegis.eth",
    inputs:    agent.lastInputs,
    reasoning: agent.lastReasoning,
    action:    agent.lastAction,
    timestamp: Date.now()
  })
})
// Returns: { rootHash: "0xabc...", status: "COMMITTED" }`;

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div
      style={{
        background: 'var(--bg-surface)',
        border: '1px solid var(--border)',
        borderRadius: 12,
        padding: '24px 28px',
        textAlign: 'center',
      }}
    >
      <div
        style={{
          fontSize: 32,
          fontWeight: 700,
          letterSpacing: '-0.02em',
          color: 'var(--text-primary)',
          lineHeight: 1,
          marginBottom: 8,
        }}
      >
        {value}
      </div>
      <div style={{ fontSize: 12, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
        {label}
      </div>
    </div>
  );
}

function Step({
  number,
  title,
  description,
  tag,
}: {
  number: string;
  title: string;
  description: string;
  tag: string;
}) {
  return (
    <div
      style={{
        background: 'var(--bg-surface)',
        border: '1px solid var(--border)',
        borderRadius: 12,
        padding: '28px 24px',
        display: 'flex',
        flexDirection: 'column',
        gap: 12,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div
          style={{
            width: 32,
            height: 32,
            background: 'var(--accent-dim)',
            border: '1px solid var(--accent)',
            borderRadius: 8,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 13,
            fontWeight: 700,
            color: '#a78bfa',
          }}
        >
          {number}
        </div>
        <span
          style={{
            fontSize: 10,
            fontWeight: 600,
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            color: 'var(--text-muted)',
            background: 'var(--bg-elevated)',
            border: '1px solid var(--border)',
            padding: '3px 8px',
            borderRadius: 4,
          }}
        >
          {tag}
        </span>
      </div>
      <div style={{ fontSize: 16, fontWeight: 600, color: 'var(--text-primary)' }}>{title}</div>
      <div style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6 }}>{description}</div>
    </div>
  );
}

function SponsorBadge({ name, track, color }: { name: string; track: string; color: string }) {
  return (
    <div
      style={{
        background: 'var(--bg-surface)',
        border: `1px solid ${color}30`,
        borderRadius: 10,
        padding: '16px 20px',
        display: 'flex',
        flexDirection: 'column',
        gap: 6,
      }}
    >
      <div style={{ fontSize: 15, fontWeight: 700, color }}>{name}</div>
      <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{track}</div>
    </div>
  );
}

export default function Landing() {
  const navigate = useNavigate();
  const { isConnected } = useAccount();
  const { connect } = useConnect();
  const [connecting, setConnecting] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (isConnected) navigate('/app');
  }, [isConnected, navigate]);

  const handleConnect = async () => {
    setConnecting(true);
    try {
      connect({ connector: injected() });
    } finally {
      setConnecting(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(INTEGRATION_SNIPPET);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-base)' }}>
      <nav
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 50,
          borderBottom: '1px solid var(--border)',
          background: 'rgba(7, 7, 15, 0.85)',
          backdropFilter: 'blur(12px)',
          padding: '0 40px',
          height: 64,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div
            style={{
              width: 28,
              height: 28,
              background: 'var(--accent)',
              borderRadius: 6,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
              <path
                d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"
                stroke="white"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
          <span style={{ fontWeight: 700, fontSize: 16, letterSpacing: '-0.01em' }}>Aegis Protocol</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <a
            href="https://github.com/JoelEmmanuelCloud/aegis-protocol"
            target="_blank"
            rel="noopener noreferrer"
            style={{ fontSize: 13, color: 'var(--text-secondary)' }}
          >
            GitHub
          </a>
          <button className="btn-primary" style={{ padding: '8px 18px', fontSize: 13 }} onClick={handleConnect}>
            {connecting ? 'Connecting…' : 'Launch App'}
          </button>
        </div>
      </nav>

      <section
        style={{
          position: 'relative',
          overflow: 'hidden',
          padding: '100px 40px 80px',
          textAlign: 'center',
        }}
      >
        <div
          className="hero-grid"
          style={{
            position: 'absolute',
            inset: 0,
            opacity: 0.3,
            maskImage: 'radial-gradient(ellipse 80% 60% at 50% 0%, black 40%, transparent 100%)',
          }}
        />
        <div
          style={{
            position: 'absolute',
            top: '20%',
            left: '50%',
            transform: 'translateX(-50%)',
            width: 600,
            height: 300,
            background: 'radial-gradient(ellipse, rgba(124,58,237,0.15) 0%, transparent 70%)',
            pointerEvents: 'none',
          }}
        />

        <div style={{ position: 'relative', maxWidth: 680, margin: '0 auto' }}>
          <div
            className="animate-in"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              padding: '5px 14px',
              background: 'var(--accent-dim)',
              border: '1px solid rgba(124,58,237,0.3)',
              borderRadius: 999,
              fontSize: 12,
              fontWeight: 600,
              color: '#a78bfa',
              letterSpacing: '0.04em',
              marginBottom: 24,
            }}
          >
            <span className="pulse-dot" />
            Live on 0G Galileo Testnet
          </div>

          <h1
            className="animate-in-delay-1"
            style={{
              fontSize: 56,
              fontWeight: 800,
              letterSpacing: '-0.03em',
              lineHeight: 1.1,
              marginBottom: 20,
            }}
          >
            The Accountability Layer
            <br />
            <span className="gradient-text">for AI Agents</span>
          </h1>

          <p
            className="animate-in-delay-2"
            style={{
              fontSize: 18,
              color: 'var(--text-secondary)',
              lineHeight: 1.7,
              marginBottom: 36,
              maxWidth: 520,
              margin: '0 auto 36px',
            }}
          >
            Any agent can prove what it decided, why it decided it, and face consequences if it was wrong.
            One AXL call. Permanent record. Automatic enforcement.
          </p>

          <div
            className="animate-in-delay-3"
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12 }}
          >
            <button className="btn-primary" style={{ padding: '12px 28px', fontSize: 15 }} onClick={handleConnect}>
              {connecting ? 'Connecting…' : 'Connect Wallet'}
            </button>
            <a
              href="https://github.com/JoelEmmanuelCloud/aegis-protocol"
              target="_blank"
              rel="noopener noreferrer"
            >
              <button className="btn-secondary" style={{ padding: '12px 28px', fontSize: 15 }}>
                View Docs
              </button>
            </a>
          </div>
        </div>
      </section>

      <section style={{ padding: '0 40px 80px', maxWidth: 900, margin: '0 auto' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
          <StatCard label="Total Attestations" value="—" />
          <StatCard label="Active Agents" value="—" />
          <StatCard label="Disputes Resolved" value="—" />
        </div>
      </section>

      <section
        style={{
          padding: '80px 40px',
          borderTop: '1px solid var(--border)',
          maxWidth: 960,
          margin: '0 auto',
        }}
      >
        <div style={{ textAlign: 'center', marginBottom: 48 }}>
          <div
            style={{
              fontSize: 11,
              fontWeight: 600,
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
              color: 'var(--accent)',
              marginBottom: 12,
            }}
          >
            How It Works
          </div>
          <h2 style={{ fontSize: 32, fontWeight: 700, letterSpacing: '-0.02em' }}>
            Witness. Verify. Enforce.
          </h2>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
          <Step
            number="01"
            title="Witness"
            description="Agent submits a decision via AXL. The Witness Node uploads it to 0G Storage and returns a cryptographic root hash receipt."
            tag="0G Storage"
          />
          <Step
            number="02"
            title="Verify"
            description="When disputed, the Verifier replays the decision via 0G Compute TEE. Same inputs, same model — CLEARED or FLAGGED with a cryptographic proof."
            tag="0G Compute"
          />
          <Step
            number="03"
            title="Enforce"
            description="AegisCourt.sol records the verdict onchain. KeeperHub fires the remedy transaction automatically. ENS reputation updates instantly."
            tag="KeeperHub"
          />
        </div>
      </section>

      <section
        style={{
          padding: '80px 40px',
          borderTop: '1px solid var(--border)',
          maxWidth: 960,
          margin: '0 auto',
        }}
      >
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 48, alignItems: 'center' }}>
          <div>
            <div
              style={{
                fontSize: 11,
                fontWeight: 600,
                letterSpacing: '0.1em',
                textTransform: 'uppercase',
                color: 'var(--accent)',
                marginBottom: 12,
              }}
            >
              Builder Integration
            </div>
            <h2 style={{ fontSize: 28, fontWeight: 700, letterSpacing: '-0.02em', marginBottom: 16 }}>
              One call. Every decision tracked.
            </h2>
            <p style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.7, marginBottom: 24 }}>
              Add one AXL fetch after every agent decision. Storage, verification, court, reputation score,
              and ENS update — all handled automatically by Aegis.
            </p>
            <div style={{ display: 'flex', gap: 12 }}>
              <button className="btn-primary" style={{ padding: '10px 20px', fontSize: 13 }} onClick={handleConnect}>
                Register Your Agent
              </button>
            </div>
          </div>

          <div
            style={{
              background: 'var(--bg-surface)',
              border: '1px solid var(--border)',
              borderRadius: 12,
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                padding: '12px 16px',
                borderBottom: '1px solid var(--border)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <div style={{ display: 'flex', gap: 6 }}>
                <div style={{ width: 10, height: 10, background: '#ef4444', borderRadius: '50%' }} />
                <div style={{ width: 10, height: 10, background: '#eab308', borderRadius: '50%' }} />
                <div style={{ width: 10, height: 10, background: '#22c55e', borderRadius: '50%' }} />
              </div>
              <button
                onClick={handleCopy}
                style={{
                  fontSize: 11,
                  color: copied ? 'var(--green)' : 'var(--text-muted)',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  fontWeight: 600,
                }}
              >
                {copied ? 'Copied!' : 'Copy'}
              </button>
            </div>
            <pre
              style={{
                padding: '20px',
                fontSize: 11.5,
                lineHeight: 1.7,
                color: '#c4b5fd',
                overflowX: 'auto',
                whiteSpace: 'pre',
                fontFamily: "'JetBrains Mono', 'Fira Code', 'Cascadia Code', monospace",
              }}
            >
              {INTEGRATION_SNIPPET}
            </pre>
          </div>
        </div>
      </section>

      <section
        style={{
          padding: '80px 40px',
          borderTop: '1px solid var(--border)',
          maxWidth: 960,
          margin: '0 auto',
        }}
      >
        <div style={{ textAlign: 'center', marginBottom: 36 }}>
          <div
            style={{
              fontSize: 11,
              fontWeight: 600,
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
              color: 'var(--text-muted)',
              marginBottom: 12,
            }}
          >
            Built on
          </div>
          <h2 style={{ fontSize: 24, fontWeight: 700, letterSpacing: '-0.02em' }}>
            Industry-leading infrastructure
          </h2>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
          <SponsorBadge name="0G" track="Storage + Compute TEE" color="#3b82f6" />
          <SponsorBadge name="Gensyn" track="AXL P2P Mesh" color="#8b5cf6" />
          <SponsorBadge name="ENS" track="Agent Identity" color="#6366f1" />
          <SponsorBadge name="KeeperHub" track="Automated Enforcement" color="#10b981" />
        </div>
      </section>

      <section
        style={{
          padding: '80px 40px',
          textAlign: 'center',
          borderTop: '1px solid var(--border)',
        }}
      >
        <h2 style={{ fontSize: 36, fontWeight: 800, letterSpacing: '-0.02em', marginBottom: 16 }}>
          Make your agent <span className="gradient-text">accountable</span>
        </h2>
        <p style={{ fontSize: 16, color: 'var(--text-secondary)', marginBottom: 32 }}>
          Connect your wallet and register your first agent in under two minutes.
        </p>
        <button className="btn-primary" style={{ padding: '14px 36px', fontSize: 16 }} onClick={handleConnect}>
          {connecting ? 'Connecting…' : 'Get Started'}
        </button>
      </section>

      <footer
        style={{
          borderTop: '1px solid var(--border)',
          padding: '24px 40px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div
            style={{
              width: 20,
              height: 20,
              background: 'var(--accent)',
              borderRadius: 4,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none">
              <path
                d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"
                stroke="white"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
          <span style={{ fontSize: 13, fontWeight: 600 }}>Aegis Protocol</span>
          <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>ETHConf 2026</span>
        </div>
        <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
          AegisCourt: 0x3De27365b376D43422314899dA0E18042f0F734a
        </div>
      </footer>
    </div>
  );
}
