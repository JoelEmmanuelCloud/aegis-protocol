import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAccount, useConnect } from 'wagmi';
import { injected } from 'wagmi/connectors';
import AegisLogo from '../components/AegisLogo';
import ThemeToggle from '../components/ThemeToggle';
import { useTheme } from '../context/ThemeContext';

function AnimatedMesh() {
  const nodes = [
    { x: 260, y: 85, label: 'Witness', sub: ':9002', color: '#7c3aed', r: 20 },
    { x: 440, y: 170, label: 'Verifier', sub: ':9012', color: '#2563eb', r: 20 },
    { x: 350, y: 295, label: 'Propagator', sub: ':9022', color: '#059669', r: 20 },
    { x: 150, y: 210, label: 'Memory', sub: ':9032', color: '#d97706', r: 20 },
    { x: 295, y: 190, label: '0G', sub: 'Storage', color: '#d4941a', r: 14 },
  ];
  const edges = [
    [0, 4], [1, 4], [2, 4], [3, 4],
    [0, 1], [1, 2], [2, 3], [3, 0],
  ];

  return (
    <svg
      viewBox="0 0 500 390"
      style={{ width: '100%', maxWidth: 480 }}
      xmlns="http://www.w3.org/2000/svg"
      className="hero-visual"
    >
      <defs>
        <radialGradient id="bg" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#ede9fe" stopOpacity="0.5" />
          <stop offset="100%" stopColor="transparent" stopOpacity="0" />
        </radialGradient>
        <filter id="glow" x="-30%" y="-30%" width="160%" height="160%">
          <feGaussianBlur stdDeviation="4" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      <ellipse cx="295" cy="190" rx="210" ry="165" fill="url(#bg)" />

      {edges.map(([a, b], i) => (
        <line
          key={i}
          x1={nodes[a].x}
          y1={nodes[a].y}
          x2={nodes[b].x}
          y2={nodes[b].y}
          stroke={i < 4 ? nodes[a].color : 'var(--border-dark)'}
          strokeWidth={i < 4 ? '1.5' : '1'}
          strokeOpacity={i < 4 ? '0.35' : '0.6'}
          className="mesh-edge"
          style={{ animationDelay: `${i * 0.3}s` }}
        />
      ))}

      {nodes.map((n, i) => (
        <g
          key={i}
          className="mesh-node"
          style={{ transformOrigin: `${n.x}px ${n.y}px`, animationDelay: `${i * 0.4}s` }}
        >
          <circle cx={n.x} cy={n.y} r={n.r + 8} fill={n.color} opacity="0.07" />
          <circle
            cx={n.x}
            cy={n.y}
            r={n.r}
            fill="var(--bg-surface)"
            stroke={n.color}
            strokeWidth="1.5"
            filter="url(#glow)"
          />
          <circle cx={n.x} cy={n.y} r={n.r === 14 ? 5 : 7} fill={n.color} opacity="0.9" />
          <text
            x={n.x}
            y={n.y + n.r + 16}
            textAnchor="middle"
            fontSize="11"
            fontWeight="700"
            fontFamily="Inter, sans-serif"
            fill="var(--text-primary)"
          >
            {n.label}
          </text>
          <text
            x={n.x}
            y={n.y + n.r + 30}
            textAnchor="middle"
            fontSize="10"
            fontFamily="'JetBrains Mono', monospace"
            fill="var(--text-muted)"
          >
            {n.sub}
          </text>
        </g>
      ))}

      <g className="float-card" style={{ animationDelay: '0.5s' }}>
        <rect x="6" y="308" width="180" height="64" rx="8" fill="var(--bg-surface)" stroke="var(--border)" strokeWidth="1" />
        <circle cx="24" cy="324" r="6" fill="#22c55e" />
        <circle cx="24" cy="324" r="10" fill="#22c55e" opacity="0.15" />
        <text x="40" y="329" fontSize="11" fontWeight="700" fill="var(--text-primary)" fontFamily="Inter, sans-serif">
          trading-bot.aegis.eth
        </text>
        <text x="14" y="346" fontSize="10" fill="var(--text-muted)" fontFamily="monospace">
          0xabc123…d4f9
        </text>
        <rect x="14" y="354" width="56" height="13" rx="3" fill="#dcfce7" />
        <text x="18" y="364" fontSize="9.5" fill="#16a34a" fontWeight="700" fontFamily="Inter, sans-serif">
          CLEARED
        </text>
        <text x="76" y="364" fontSize="9.5" fill="var(--text-muted)" fontFamily="Inter, sans-serif">
          2s ago
        </text>
      </g>

      <g className="float-card" style={{ animationDelay: '1.2s' }}>
        <rect x="326" y="4" width="166" height="62" rx="8" fill="var(--bg-surface)" stroke="var(--border)" strokeWidth="1" />
        <text x="340" y="22" fontSize="11" fontWeight="700" fill="var(--text-primary)" fontFamily="Inter, sans-serif">
          AegisCourt.sol
        </text>
        <text x="340" y="38" fontSize="10" fill="var(--text-muted)" fontFamily="monospace">
          0x3De27365…F734a
        </text>
        <text x="340" y="54" fontSize="10" fill="var(--text-muted)" fontFamily="Inter, sans-serif">
          0G Galileo · chainId 16602
        </text>
      </g>
    </svg>
  );
}

function LiveCounter({ label, end }: { label: string; end: number }) {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLDivElement>(null);
  const animated = useRef(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !animated.current) {
          animated.current = true;
          const duration = 1400;
          const step = 16;
          const increment = (end / duration) * step;
          let current = 0;
          const timer = setInterval(() => {
            current = Math.min(current + increment, end);
            setCount(Math.floor(current));
            if (current >= end) clearInterval(timer);
          }, step);
        }
      },
      { threshold: 0.4 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [end]);

  return (
    <div ref={ref} style={{ textAlign: 'center' }}>
      <div
        style={{
          fontSize: 38,
          fontWeight: 800,
          letterSpacing: '-0.04em',
          color: '#d4941a',
          lineHeight: 1,
          marginBottom: 8,
        }}
      >
        {count.toLocaleString()}
      </div>
      <div
        style={{
          fontSize: 13,
          color: 'var(--text-muted)',
          textTransform: 'uppercase',
          letterSpacing: '0.06em',
          fontWeight: 600,
        }}
      >
        {label}
      </div>
    </div>
  );
}

export default function Landing() {
  const navigate = useNavigate();
  const { isConnected } = useAccount();
  const { connect } = useConnect();
  const { theme } = useTheme();
  const [connecting, setConnecting] = useState(false);
  const [copied, setCopied] = useState(false);

  const codeSnippet = `await fetch("http://localhost:9002/send", {
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
})`;

  const handleCopy = () => {
    navigator.clipboard.writeText(codeSnippet).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

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
        background: 'var(--bg-base)',
        color: 'var(--text-primary)',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <nav
        className="landing-nav"
        style={{
          height: 76,
          borderBottom: '1px solid var(--border)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 48px',
          background: 'var(--nav-bg)',
          backdropFilter: 'blur(10px)',
          position: 'sticky',
          top: 0,
          zIndex: 50,
        }}
      >
        <a href="#about" style={{ display: 'flex', alignItems: 'center', textDecoration: 'none' }}>
          <AegisLogo variant={theme === 'dark' ? 'light' : 'dark'} size={40} showWordmark wordmarkColor="var(--text-primary)" />
        </a>

        <div className="landing-nav-links" style={{ display: 'flex', gap: 32 }}>
          {[{ label: 'Builder', href: '#builder' }, { label: 'How it works', href: '#how' }].map((item) => (
            <a key={item.label} href={item.href} className="nav-link" style={{ fontSize: 14 }}>
              {item.label}
            </a>
          ))}
        </div>

        <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
          <ThemeToggle />
          <a
            href="https://github.com/JoelEmmanuelCloud/aegis-protocol"
            target="_blank"
            rel="noopener noreferrer"
            className="cta-primary"
            style={{ fontSize: 14, padding: '8px 18px', textDecoration: 'none' }}
          >
            GitHub
          </a>
        </div>
      </nav>

      <section
        id="about"
        className="landing-section"
        style={{ padding: '80px 48px 60px', maxWidth: 1200, margin: '0 auto', width: '100%', position: 'relative' }}
      >
        <div
          className="landing-dots"
          style={{
            position: 'absolute',
            inset: 0,
            opacity: 0.45,
            maskImage: 'radial-gradient(ellipse 65% 85% at 25% 50%, black 20%, transparent 75%)',
            pointerEvents: 'none',
          }}
        />

        <div className="landing-hero">
          <div style={{ position: 'relative' }}>
            <div className="animate-in" style={{ marginBottom: 24 }}>
              <span
                style={{
                  display: 'inline-block',
                  fontSize: 12,
                  fontWeight: 600,
                  letterSpacing: '0.1em',
                  textTransform: 'uppercase',
                  color: '#d4941a',
                  border: '1px solid rgba(212,148,26,0.4)',
                  padding: '6px 14px',
                  borderRadius: 4,
                }}
              >
                [ verify anything · enforce everything ]
              </span>
            </div>

            <h1
              className="animate-in-1 hero-headline"
              style={{
                fontSize: 58,
                fontWeight: 800,
                letterSpacing: '-0.045em',
                lineHeight: 1.02,
                marginBottom: 24,
                color: 'var(--text-primary)',
              }}
            >
              Prove every
              <br />
              <span
                style={{
                  background: 'linear-gradient(105deg, var(--text-primary) 0%, #d4941a 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                }}
              >
                AI decision.
              </span>
            </h1>

            <p
              className="animate-in-2"
              style={{
                fontSize: 16,
                color: 'var(--text-secondary)',
                lineHeight: 1.8,
                maxWidth: 400,
                marginBottom: 36,
              }}
            >
              Aegis is the accountability layer for AI agents — any agent can prove what it decided,
              why it decided it, and face consequences if it was wrong.
            </p>

            <div
              className="animate-in-3"
              style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 52, flexWrap: 'wrap' }}
            >
              <button onClick={handleConnect} className="cta-primary">
                {connecting ? 'Connecting…' : 'Register Your Agent'}
                <svg
                  className="cta-arrow"
                  width="15"
                  height="15"
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
                onClick={() => window.open('https://github.com/JoelEmmanuelCloud/aegis-protocol', '_blank')}
                className="cta-secondary"
              >
                View Docs
              </button>
            </div>

            <div className="animate-in-4" style={{ borderTop: '1px solid var(--border)', paddingTop: 28 }}>
              <div
                style={{
                  fontSize: 12,
                  color: 'var(--text-muted)',
                  marginBottom: 16,
                  letterSpacing: '0.08em',
                  textTransform: 'uppercase',
                  fontWeight: 600,
                }}
              >
                Built on
              </div>
              <div style={{ display: 'flex', gap: 28, alignItems: 'center', flexWrap: 'wrap' }}>
                {[
                  { name: '0G', desc: 'Storage + Compute' },
                  { name: 'Gensyn', desc: 'AXL Mesh' },
                  { name: 'ENS', desc: 'Identity' },
                  { name: 'KeeperHub', desc: 'Enforcement' },
                ].map((s) => (
                  <div key={s.name} style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                    <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)' }}>{s.name}</div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{s.desc}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', paddingLeft: 32 }}>
            <AnimatedMesh />
          </div>
        </div>
      </section>

      <section style={{ padding: '0 48px 72px', maxWidth: 1200, margin: '0 auto', width: '100%' }}>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: 1,
            background: 'var(--border)',
            border: '1px solid var(--border)',
            borderRadius: 12,
            overflow: 'hidden',
          }}
        >
          {[
            { label: 'Total Attestations', end: 12847 },
            { label: 'Active Agents', end: 284 },
            { label: 'Verdicts Issued', end: 391 },
          ].map((stat) => (
            <div key={stat.label} style={{ background: 'var(--bg-base)', padding: '36px' }}>
              <LiveCounter label={stat.label} end={stat.end} />
            </div>
          ))}
        </div>
      </section>

      <section
        id="how"
        className="landing-section"
        style={{
          borderTop: '1px solid var(--border)',
          padding: '72px 48px',
          maxWidth: 1200,
          margin: '0 auto',
          width: '100%',
        }}
      >
        <div
          style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 40 }}
        >
          <div>
            <div
              style={{
                fontSize: 12,
                fontWeight: 600,
                letterSpacing: '0.1em',
                textTransform: 'uppercase',
                color: 'var(--text-muted)',
                marginBottom: 10,
              }}
            >
              How It Works
            </div>
            <h2 style={{ fontSize: 30, fontWeight: 800, letterSpacing: '-0.03em' }}>
              Witness. Verify. Enforce.
            </h2>
          </div>
          <button onClick={handleConnect} className="cta-secondary">
            Start Building
          </button>
        </div>

        <div
          className="landing-steps"
          style={{ border: '1px solid var(--border)', borderRadius: 12, overflow: 'hidden' }}
        >
          {[
            {
              num: '01',
              title: 'Witness',
              desc: 'Agent submits a decision via AXL. Committed to 0G Storage permanently. Root hash returned as a cryptographic receipt.',
              tag: '0G Storage',
              color: '#7c3aed',
            },
            {
              num: '02',
              title: 'Verify',
              desc: 'Disputed decisions are replayed via 0G Compute TEE. Same model, same inputs. CLEARED or FLAGGED with a cryptographic proof.',
              tag: '0G Compute',
              color: '#2563eb',
            },
            {
              num: '03',
              title: 'Enforce',
              desc: 'Verdict recorded onchain in AegisCourt.sol. KeeperHub executes the remedy automatically. ENS reputation updates instantly.',
              tag: 'KeeperHub',
              color: '#059669',
            },
          ].map((step, i) => (
            <div
              key={step.num}
              style={{
                padding: '36px 32px',
                background: 'var(--bg-surface)',
                borderRight: i < 2 ? '1px solid var(--border)' : 'none',
                transition: 'background 0.15s',
              }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = 'var(--bg-hover)'; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = 'var(--bg-surface)'; }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                <span style={{ fontSize: 13, fontWeight: 800, color: '#d4941a', letterSpacing: '0.04em' }}>
                  {step.num}
                </span>
                <span
                  style={{
                    fontSize: 11,
                    color: step.color,
                    border: `1px solid ${step.color}40`,
                    background: `${step.color}0d`,
                    padding: '4px 10px',
                    borderRadius: 4,
                    letterSpacing: '0.05em',
                    textTransform: 'uppercase',
                    fontWeight: 600,
                  }}
                >
                  {step.tag}
                </span>
              </div>
              <div
                style={{ fontSize: 20, fontWeight: 700, letterSpacing: '-0.02em', marginBottom: 14, color: 'var(--text-primary)' }}
              >
                {step.title}
              </div>
              <div style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.75 }}>{step.desc}</div>
            </div>
          ))}
        </div>
      </section>

      <section
        id="builder"
        className="landing-section landing-integration"
        style={{
          padding: '72px 48px',
          maxWidth: 1200,
          margin: '0 auto',
          width: '100%',
          borderTop: '1px solid var(--border)',
        }}
      >
        <div>
          <div
            style={{
              fontSize: 12,
              color: 'var(--text-muted)',
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
              marginBottom: 16,
              fontWeight: 600,
            }}
          >
            Builder Integration
          </div>
          <h2 style={{ fontSize: 34, fontWeight: 800, letterSpacing: '-0.03em', marginBottom: 18, lineHeight: 1.1 }}>
            One call.
            <br />
            Full accountability.
          </h2>
          <p
            style={{ fontSize: 15, color: 'var(--text-secondary)', lineHeight: 1.8, marginBottom: 28, maxWidth: 420 }}
          >
            Add a single AXL fetch after every agent decision. Storage, verification, court,
            reputation score, and ENS update — all handled automatically by Aegis.
          </p>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <button onClick={handleConnect} className="cta-primary">
              Register Your Agent
            </button>
            <a
              href="https://github.com/JoelEmmanuelCloud/aegis-protocol"
              target="_blank"
              rel="noopener noreferrer"
            >
              <button className="cta-secondary">View Docs</button>
            </a>
          </div>
        </div>

        <div style={{ background: '#0c0c10', borderRadius: 12, overflow: 'hidden', border: '1px solid #1e1e28' }}>
          <div
            style={{
              padding: '12px 16px',
              borderBottom: '1px solid #1e1e28',
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
            <span style={{ fontSize: 12, color: '#4a4a60', fontFamily: 'monospace' }}>
              agent-integration.ts
            </span>
            <button
              onClick={handleCopy}
              style={{
                background: 'none',
                border: '1px solid #2a2a38',
                borderRadius: 5,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 5,
                padding: '3px 10px',
                fontSize: 11,
                fontFamily: 'inherit',
                color: copied ? '#22c55e' : '#6a6a80',
                transition: 'color 0.15s, border-color 0.15s',
              }}
            >
              {copied ? (
                <>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                  Copied
                </>
              ) : (
                <>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                    <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" />
                  </svg>
                  Copy
                </>
              )}
            </button>
          </div>
          <pre
            style={{
              padding: '22px',
              fontSize: 12.5,
              lineHeight: 1.85,
              color: '#e8b84b',
              overflowX: 'auto',
              fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
              margin: 0,
            }}
          >{codeSnippet}</pre>
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
          flexWrap: 'wrap',
          gap: 16,
          marginTop: 'auto',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <AegisLogo variant="gold" size={36} showWordmark wordmarkColor="#f7f7f5" />
          <span
            style={{
              fontSize: 12,
              color: '#4a4a48',
              border: '1px solid #2a2a28',
              padding: '3px 10px',
              borderRadius: 4,
            }}
          >
            ETHConf 2026
          </span>
        </div>
        <div style={{ fontSize: 12, fontFamily: 'monospace', color: '#4a4a48' }}>
          AegisCourt: 0x3De27365b376D43422314899dA0E18042f0F734a
        </div>
        <div style={{ display: 'flex', gap: 24, fontSize: 13 }}>
          <a
            href="https://github.com/JoelEmmanuelCloud/aegis-protocol"
            target="_blank"
            rel="noopener noreferrer"
            style={{ color: '#9a9a96', transition: 'color 0.15s' }}
            onMouseEnter={(e) => ((e.target as HTMLElement).style.color = '#f7f7f5')}
            onMouseLeave={(e) => ((e.target as HTMLElement).style.color = '#9a9a96')}
          >
            GitHub
          </a>
          <span style={{ color: '#4a4a48' }}>0G Galileo · chainId 16602</span>
        </div>
      </footer>
    </div>
  );
}
