import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAccount, useConnect } from 'wagmi';
import { injected } from 'wagmi/connectors';

function MeshVisual() {
  const nodes = [
    { x: 280, y: 80, label: 'Witness', port: ':9002', color: '#7c3aed' },
    { x: 460, y: 180, label: 'Verifier', port: ':9012', color: '#2563eb' },
    { x: 360, y: 300, label: 'Propagator', port: ':9022', color: '#059669' },
    { x: 170, y: 220, label: 'Memory', port: ':9032', color: '#d97706' },
    { x: 310, y: 190, label: '0G Storage', port: '', color: '#9ca3af' },
  ];
  const edges = [
    [0, 4],
    [1, 4],
    [2, 4],
    [3, 4],
    [0, 1],
    [1, 2],
    [2, 3],
    [3, 0],
  ];

  return (
    <svg
      viewBox="0 0 520 380"
      style={{ width: '100%', maxWidth: 520, opacity: 0.9 }}
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <filter id="glow">
          <feGaussianBlur stdDeviation="3" result="coloredBlur" />
          <feMerge>
            <feMergeNode in="coloredBlur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
        <radialGradient id="bgGrad" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#ede9fe" stopOpacity="0.5" />
          <stop offset="100%" stopColor="#f7f7f5" stopOpacity="0" />
        </radialGradient>
      </defs>

      <ellipse cx="310" cy="190" rx="200" ry="160" fill="url(#bgGrad)" />

      {edges.map(([a, b], i) => (
        <line
          key={i}
          x1={nodes[a].x}
          y1={nodes[a].y}
          x2={nodes[b].x}
          y2={nodes[b].y}
          stroke="#d4d4d0"
          strokeWidth="1"
          strokeDasharray="4 4"
        />
      ))}

      {nodes.map((n, i) => (
        <g key={i}>
          <circle
            cx={n.x}
            cy={n.y}
            r={i === 4 ? 18 : 22}
            fill="white"
            stroke={n.color}
            strokeWidth="1.5"
            filter="url(#glow)"
          />
          <circle cx={n.x} cy={n.y} r={i === 4 ? 6 : 7} fill={n.color} opacity="0.8" />
          <text
            x={n.x}
            y={n.y + (i === 4 ? 32 : 36)}
            textAnchor="middle"
            fontSize="10"
            fontFamily="Inter, sans-serif"
            fontWeight="600"
            fill="#4a4a46"
          >
            {n.label}
          </text>
          {n.port && (
            <text
              x={n.x}
              y={n.y + 48}
              textAnchor="middle"
              fontSize="9"
              fontFamily="monospace"
              fill="#9a9a96"
            >
              {n.port}
            </text>
          )}
        </g>
      ))}

      <g>
        <rect
          x="10"
          y="310"
          width="160"
          height="52"
          rx="8"
          fill="white"
          stroke="#e2e2de"
          strokeWidth="1"
        />
        <circle cx="30" cy="324" r="5" fill="#22c55e" />
        <text
          x="42"
          y="328"
          fontSize="9"
          fontWeight="600"
          fill="#4a4a46"
          fontFamily="Inter, sans-serif"
        >
          trading-bot.aegis.eth
        </text>
        <text x="20" y="344" fontSize="8" fill="#9a9a96" fontFamily="monospace">
          rootHash: 0xabc123...
        </text>
        <rect x="20" y="350" width="40" height="6" rx="3" fill="#ede9fe" />
        <text
          x="24"
          y="356"
          fontSize="7"
          fill="#7c3aed"
          fontWeight="700"
          fontFamily="Inter, sans-serif"
        >
          CLEARED
        </text>
      </g>

      <g>
        <rect
          x="348"
          y="8"
          width="148"
          height="52"
          rx="8"
          fill="white"
          stroke="#e2e2de"
          strokeWidth="1"
        />
        <text
          x="358"
          y="24"
          fontSize="9"
          fontWeight="600"
          fill="#4a4a46"
          fontFamily="Inter, sans-serif"
        >
          AegisCourt.sol
        </text>
        <text x="358" y="38" fontSize="8" fill="#9a9a96" fontFamily="monospace">
          0x3De273...
        </text>
        <text x="358" y="52" fontSize="8" fill="#9a9a96" fontFamily="monospace">
          0G Galileo :16602
        </text>
      </g>
    </svg>
  );
}

export default function Landing() {
  const navigate = useNavigate();
  const { isConnected } = useAccount();
  const { connect } = useConnect();
  const [connecting, setConnecting] = useState(false);

  useEffect(() => {
    if (isConnected) navigate('/app');
  }, [isConnected, navigate]);

  const handleConnect = () => {
    setConnecting(true);
    connect({ connector: injected() }, { onSettled: () => setConnecting(false) });
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        background: '#f7f7f5',
        color: '#0a0a08',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <nav
        style={{
          height: 60,
          borderBottom: '1px solid #e2e2de',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 48px',
          background: 'rgba(247,247,245,0.9)',
          backdropFilter: 'blur(8px)',
          position: 'sticky',
          top: 0,
          zIndex: 50,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div
            style={{
              width: 24,
              height: 24,
              background: '#0a0a08',
              borderRadius: 5,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
              <path
                d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"
                stroke="white"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
          <span style={{ fontWeight: 700, fontSize: 14, letterSpacing: '-0.02em' }}>
            aegis protocol
          </span>
        </div>

        <div style={{ display: 'flex', gap: 32 }}>
          {['About', 'Developers', 'The Protocol', 'Docs'].map((item) => (
            <a
              key={item}
              href="#"
              style={{ fontSize: 13, color: '#4a4a46', fontWeight: 400, transition: 'color 0.1s' }}
              onMouseEnter={(e) => ((e.target as HTMLElement).style.color = '#0a0a08')}
              onMouseLeave={(e) => ((e.target as HTMLElement).style.color = '#4a4a46')}
            >
              {item}
            </a>
          ))}
        </div>

        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <a
            href="https://github.com/JoelEmmanuelCloud/aegis-protocol"
            target="_blank"
            rel="noopener noreferrer"
            style={{ fontSize: 13, color: '#4a4a46', padding: '6px 14px' }}
          >
            GitHub
          </a>
          <button
            onClick={handleConnect}
            style={{
              padding: '7px 18px',
              background: '#0a0a08',
              color: '#f7f7f5',
              border: 'none',
              borderRadius: 6,
              fontSize: 13,
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'opacity 0.15s',
            }}
            onMouseEnter={(e) => ((e.target as HTMLElement).style.opacity = '0.8')}
            onMouseLeave={(e) => ((e.target as HTMLElement).style.opacity = '1')}
          >
            {connecting ? 'Connecting…' : 'Launch App'}
          </button>
        </div>
      </nav>

      <section
        style={{
          flex: 1,
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: 0,
          maxWidth: 1200,
          margin: '0 auto',
          padding: '80px 48px 60px',
          width: '100%',
          alignItems: 'center',
          position: 'relative',
        }}
      >
        <div
          className="landing-dots"
          style={{
            position: 'absolute',
            inset: 0,
            opacity: 0.5,
            maskImage: 'radial-gradient(ellipse 70% 80% at 30% 50%, black 30%, transparent 80%)',
            pointerEvents: 'none',
          }}
        />

        <div style={{ position: 'relative' }}>
          <div className="animate-in" style={{ marginBottom: 24 }}>
            <span
              style={{
                display: 'inline-block',
                fontSize: 10,
                fontWeight: 600,
                letterSpacing: '0.12em',
                textTransform: 'uppercase',
                color: '#9a9a96',
                border: '1px solid #e2e2de',
                padding: '5px 12px',
                borderRadius: 4,
              }}
            >
              [ WITNESS ANYTHING · ENFORCE EVERYTHING ]
            </span>
          </div>

          <h1
            className="animate-in-1"
            style={{
              fontSize: 54,
              fontWeight: 800,
              letterSpacing: '-0.04em',
              lineHeight: 1.05,
              marginBottom: 28,
              color: '#0a0a08',
            }}
          >
            Introducing the
            <br />
            AI agent
            <br />
            accountability layer
          </h1>

          <p
            className="animate-in-2"
            style={{
              fontSize: 15,
              color: '#4a4a46',
              lineHeight: 1.75,
              maxWidth: 400,
              marginBottom: 36,
            }}
          >
            From KYC to brand loyalty, unlock insights you can act on without holding any data. Any
            agent. Any framework. One call.
          </p>

          <div
            className="animate-in-3"
            style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: 48 }}
          >
            <button
              onClick={handleConnect}
              style={{
                padding: '10px 22px',
                background: '#0a0a08',
                color: '#f7f7f5',
                border: 'none',
                borderRadius: 6,
                fontSize: 14,
                fontWeight: 600,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 8,
              }}
            >
              {connecting ? 'Connecting…' : 'View More'}
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <line x1="5" y1="12" x2="19" y2="12" />
                <polyline points="12 5 19 12 12 19" />
              </svg>
            </button>
            <button
              onClick={handleConnect}
              style={{
                padding: '10px 22px',
                background: 'transparent',
                color: '#0a0a08',
                border: '1px solid #c8c8c4',
                borderRadius: 6,
                fontSize: 14,
                fontWeight: 500,
                cursor: 'pointer',
              }}
            >
              Connect Wallet
            </button>
          </div>

          <div style={{ borderTop: '1px solid #e2e2de', paddingTop: 28 }}>
            <div
              style={{
                fontSize: 11,
                color: '#9a9a96',
                marginBottom: 16,
                letterSpacing: '0.04em',
                textTransform: 'uppercase',
              }}
            >
              Built on
            </div>
            <div style={{ display: 'flex', gap: 20, alignItems: 'center' }}>
              {[
                { name: '0G', desc: 'Storage + Compute' },
                { name: 'Gensyn', desc: 'AXL Mesh' },
                { name: 'ENS', desc: 'Identity' },
                { name: 'KeeperHub', desc: 'Enforcement' },
              ].map((s) => (
                <div key={s.name} style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: '#0a0a08' }}>{s.name}</div>
                  <div style={{ fontSize: 10, color: '#9a9a96' }}>{s.desc}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            paddingLeft: 40,
          }}
        >
          <MeshVisual />
        </div>
      </section>

      <section
        style={{
          borderTop: '1px solid #e2e2de',
          padding: '64px 48px',
          maxWidth: 1200,
          margin: '0 auto',
          width: '100%',
        }}
      >
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: 1,
            border: '1px solid #e2e2de',
            borderRadius: 12,
            overflow: 'hidden',
          }}
        >
          {[
            {
              num: '01',
              title: 'Witness',
              desc: 'Agent submits a decision via AXL. Committed to 0G Storage. Root hash returned as a permanent receipt.',
              tag: '0G Storage',
            },
            {
              num: '02',
              title: 'Verify',
              desc: 'Disputed decisions are replayed via 0G Compute TEE with the same model and inputs. CLEARED or FLAGGED.',
              tag: '0G Compute',
            },
            {
              num: '03',
              title: 'Enforce',
              desc: 'Verdict recorded onchain in AegisCourt.sol. KeeperHub executes the remedy. ENS reputation updates instantly.',
              tag: 'KeeperHub',
            },
          ].map((step, i) => (
            <div
              key={step.num}
              style={{
                padding: '36px 32px',
                background: 'white',
                borderRight: i < 2 ? '1px solid #e2e2de' : 'none',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: 20,
                }}
              >
                <span
                  style={{
                    fontSize: 11,
                    fontWeight: 700,
                    color: '#c8c8c4',
                    letterSpacing: '0.06em',
                  }}
                >
                  {step.num}
                </span>
                <span
                  style={{
                    fontSize: 9,
                    color: '#9a9a96',
                    border: '1px solid #e2e2de',
                    padding: '3px 8px',
                    borderRadius: 3,
                    letterSpacing: '0.06em',
                    textTransform: 'uppercase',
                    fontWeight: 600,
                  }}
                >
                  {step.tag}
                </span>
              </div>
              <div
                style={{
                  fontSize: 18,
                  fontWeight: 700,
                  letterSpacing: '-0.02em',
                  marginBottom: 12,
                  color: '#0a0a08',
                }}
              >
                {step.title}
              </div>
              <div style={{ fontSize: 13, color: '#4a4a46', lineHeight: 1.7 }}>{step.desc}</div>
            </div>
          ))}
        </div>
      </section>

      <section
        style={{
          padding: '64px 48px',
          maxWidth: 1200,
          margin: '0 auto',
          width: '100%',
          borderTop: '1px solid #e2e2de',
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: 64,
          alignItems: 'center',
        }}
      >
        <div>
          <div
            style={{
              fontSize: 11,
              color: '#9a9a96',
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
              marginBottom: 16,
              fontWeight: 600,
            }}
          >
            Builder Integration
          </div>
          <h2
            style={{
              fontSize: 32,
              fontWeight: 800,
              letterSpacing: '-0.03em',
              marginBottom: 16,
              lineHeight: 1.1,
            }}
          >
            One call.
            <br />
            Full accountability.
          </h2>
          <p style={{ fontSize: 14, color: '#4a4a46', lineHeight: 1.75, marginBottom: 28 }}>
            Add a single AXL fetch after every agent decision. Storage, verification, court,
            reputation score, and ENS update — handled automatically.
          </p>
          <div style={{ display: 'flex', gap: 10 }}>
            <button
              onClick={handleConnect}
              style={{
                padding: '10px 22px',
                background: '#0a0a08',
                color: 'white',
                border: 'none',
                borderRadius: 6,
                fontSize: 13,
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              Register Your Agent
            </button>
            <a
              href="https://github.com/JoelEmmanuelCloud/aegis-protocol"
              target="_blank"
              rel="noopener noreferrer"
              style={{
                padding: '10px 22px',
                background: 'transparent',
                color: '#0a0a08',
                border: '1px solid #c8c8c4',
                borderRadius: 6,
                fontSize: 13,
                fontWeight: 500,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
              }}
            >
              View Docs
            </a>
          </div>
        </div>

        <div style={{ background: '#0a0a08', borderRadius: 12, overflow: 'hidden' }}>
          <div
            style={{
              padding: '12px 16px',
              borderBottom: '1px solid #1e1e2a',
              display: 'flex',
              gap: 6,
            }}
          >
            <div style={{ width: 10, height: 10, background: '#ef4444', borderRadius: '50%' }} />
            <div style={{ width: 10, height: 10, background: '#eab308', borderRadius: '50%' }} />
            <div style={{ width: 10, height: 10, background: '#22c55e', borderRadius: '50%' }} />
          </div>
          <pre
            style={{
              padding: '20px',
              fontSize: 11.5,
              lineHeight: 1.8,
              color: '#a78bfa',
              overflowX: 'auto',
              fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
            }}
          >{`await fetch("http://localhost:9002/send", {
  method: "POST",
  headers: {
    "X-Destination-Peer-Id":
      AEGIS_WITNESS_PEER_ID
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
// { rootHash: "0xabc...", status: "COMMITTED" }`}</pre>
        </div>
      </section>

      <footer
        style={{
          background: '#0a0a08',
          color: '#9a9a96',
          padding: '32px 48px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginTop: 'auto',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div
            style={{
              width: 20,
              height: 20,
              background: '#f7f7f5',
              borderRadius: 4,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none">
              <path
                d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"
                stroke="#0a0a08"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
          <span style={{ fontSize: 13, fontWeight: 600, color: '#f7f7f5' }}>Aegis Protocol</span>
          <span style={{ fontSize: 12, color: '#4a4a46' }}>Open Agents</span>
        </div>
        <div style={{ fontSize: 11, fontFamily: 'monospace', color: '#4a4a46' }}>
          AegisCourt: 0x3De27365b376D43422314899dA0E18042f0F734a
        </div>
        <div style={{ display: 'flex', gap: 24, fontSize: 12 }}>
          <a
            href="https://github.com/JoelEmmanuelCloud/aegis-protocol"
            target="_blank"
            rel="noopener noreferrer"
            style={{ color: '#9a9a96' }}
          >
            GitHub
          </a>
          <span style={{ color: '#4a4a46' }}>0G Galileo Testnet</span>
        </div>
      </footer>
    </div>
  );
}
