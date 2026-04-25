import { useState } from 'react';
import { useReadContracts } from 'wagmi';
import { namehash } from 'viem';
import { useAgent } from '../hooks/useAgent';
import { useDemoMode } from '../hooks/useDemoMode';
import { demoAgents, demoReputation, demoEnsRecords } from '../lib/demoData';

const PUBLIC_RESOLVER_ABI = [
  {
    name: 'text',
    type: 'function' as const,
    stateMutability: 'view' as const,
    inputs: [
      { name: 'node', type: 'bytes32' },
      { name: 'key', type: 'string' },
    ],
    outputs: [{ type: 'string' }],
  },
] as const;

const ENS_TEXT_KEYS = [
  'aegis.reputation',
  'aegis.totalDecisions',
  'aegis.lastVerdict',
  'aegis.flaggedCount',
  'aegis.storageIndex',
  'agent.registry',
  'agent.id',
];

const resolverAddress = import.meta.env.VITE_PUBLIC_RESOLVER_ADDRESS as `0x${string}`;

function ScoreRing({ score }: { score: number }) {
  const r = 40;
  const circ = 2 * Math.PI * r;
  const dash = (score / 100) * circ;
  const color =
    score >= 70 ? 'var(--app-green)' : score >= 40 ? 'var(--app-yellow)' : 'var(--app-red)';
  return (
    <div style={{ position: 'relative', width: 100, height: 100 }}>
      <svg width="100" height="100" viewBox="0 0 100 100">
        <circle cx="50" cy="50" r={r} fill="none" stroke="var(--border)" strokeWidth="8" />
        <circle
          cx="50"
          cy="50"
          r={r}
          fill="none"
          stroke={color}
          strokeWidth="8"
          strokeDasharray={`${dash} ${circ - dash}`}
          strokeDashoffset={circ * 0.25}
          strokeLinecap="round"
          style={{ transition: 'stroke-dasharray 0.6s ease' }}
        />
      </svg>
      <div
        style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <div style={{ fontSize: 22, fontWeight: 800, color, lineHeight: 1 }}>{score}</div>
        <div
          style={{
            fontSize: 9,
            color: 'var(--app-text-muted)',
            letterSpacing: '0.06em',
            textTransform: 'uppercase',
          }}
        >
          score
        </div>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value?: string }) {
  const isEnsip25 = label.startsWith('agent.');
  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '10px 0',
        borderBottom: '1px solid var(--border)',
        gap: 12,
      }}
    >
      <span
        style={{
          fontSize: 12,
          color: isEnsip25 ? '#a78bfa' : 'var(--app-text-muted)',
          fontFamily: 'monospace',
          flexShrink: 0,
        }}
      >
        {label}
      </span>
      <span
        style={{
          fontSize: 12,
          color: 'var(--app-text-2)',
          fontFamily: 'monospace',
          textAlign: 'right',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
        }}
      >
        {value ?? '—'}
      </span>
    </div>
  );
}

export default function AgentProfile() {
  const [label, setLabel] = useState<string | null>(null);
  const [input, setInput] = useState('');
  const { enabled: demo } = useDemoMode();

  const ensName = label ?? (demo ? demoAgents[0].ensName : null);
  const agentLabel = ensName ? ensName.replace('.aegis.eth', '') : null;

  const { data: agent, isLoading } = useAgent(agentLabel);
  const displayAgent = demo ? demoAgents[0] : agent;

  const { data: ensData } = useReadContracts({
    contracts: ENS_TEXT_KEYS.map((key) => ({
      address: resolverAddress,
      abi: PUBLIC_RESOLVER_ABI,
      functionName: 'text' as const,
      args: [namehash(ensName ?? ''), key] as [`0x${string}`, string],
      chainId: 16602,
    })),
    query: { enabled: !demo && !!ensName && !!resolverAddress },
  });

  const ensRecords: Record<string, string> = demo
    ? demoEnsRecords
    : ENS_TEXT_KEYS.reduce(
        (acc, key, i) => {
          const val = ensData?.[i]?.result;
          if (typeof val === 'string') acc[key] = val;
          return acc;
        },
        {} as Record<string, string>
      );

  const score = parseInt(ensRecords['aegis.reputation'] ?? '0', 10);

  const handleSearch = () => {
    const cleaned = input.replace('.aegis.eth', '').trim();
    if (cleaned) setLabel(cleaned);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div>
        <h1 style={{ fontSize: 20, fontWeight: 700, letterSpacing: '-0.01em', marginBottom: 4 }}>
          Agent Profile
        </h1>
        <p style={{ fontSize: 13, color: 'var(--app-text-muted)' }}>
          ENS identity and live reputation for any registered agent
        </p>
      </div>

      <div style={{ display: 'flex', gap: 8 }}>
        <input
          className="app-input"
          style={{ flex: 1 }}
          placeholder="trading-bot or trading-bot.aegis.eth"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
        />
        <button
          className="app-btn-primary"
          onClick={handleSearch}
          style={{ flexShrink: 0, padding: '10px 20px' }}
        >
          Lookup
        </button>
      </div>

      {isLoading && !demo && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {[1, 2].map((i) => (
            <div key={i} className="skeleton" style={{ height: 80, borderRadius: 12 }} />
          ))}
        </div>
      )}

      {(displayAgent || demo) && (
        <div style={{ display: 'grid', gridTemplateColumns: '260px 1fr', gap: 16 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div
              className="app-card"
              style={{
                padding: '24px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 16,
              }}
            >
              <ScoreRing score={demo ? demoReputation.score : score} />
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 4 }}>
                  {displayAgent?.ensName ?? ensName}
                </div>
                <div style={{ fontSize: 12, color: 'var(--app-text-muted)' }}>
                  Token #{displayAgent?.tokenId ?? '—'}
                </div>
              </div>
              <span className={displayAgent?.active ? 'badge-cleared' : 'badge-flagged'}>
                {displayAgent?.active ? 'Active' : 'Suspended'}
              </span>
            </div>

            <div className="app-card" style={{ padding: '18px' }}>
              <div
                style={{
                  fontSize: 12,
                  fontWeight: 600,
                  color: 'var(--app-text-2)',
                  marginBottom: 12,
                }}
              >
                Accountability Split
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                <span style={{ fontSize: 12, color: 'var(--app-text-muted)' }}>User</span>
                <span style={{ fontSize: 14, fontWeight: 700, color: '#a78bfa' }}>
                  {displayAgent?.userPercent ?? '—'}%
                </span>
              </div>
              <div
                style={{
                  height: 4,
                  background: 'var(--app-elevated)',
                  borderRadius: 2,
                  overflow: 'hidden',
                  marginBottom: 6,
                }}
              >
                <div
                  style={{
                    height: '100%',
                    width: `${displayAgent?.userPercent ?? 0}%`,
                    background: 'var(--app-accent)',
                    borderRadius: 2,
                  }}
                />
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ fontSize: 12, color: 'var(--app-text-muted)' }}>Builder</span>
                <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--app-text)' }}>
                  {displayAgent?.builderPercent ?? '—'}%
                </span>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div className="app-card" style={{ padding: '18px' }}>
              <div
                style={{
                  fontSize: 12,
                  fontWeight: 600,
                  color: 'var(--app-text-2)',
                  marginBottom: 4,
                }}
              >
                Agent Record
              </div>
              <Row label="Builder" value={displayAgent?.builderAddress} />
              <Row label="Storage Root" value={displayAgent?.storageRoot || '—'} />
              <Row
                label="Registered"
                value={
                  displayAgent?.mintedAt
                    ? new Date(displayAgent.mintedAt * 1000).toLocaleDateString()
                    : undefined
                }
              />
            </div>

            <div className="app-card" style={{ padding: '18px' }}>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: 4,
                }}
              >
                <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--app-text-2)' }}>
                  ENS Text Records
                </div>
                <span
                  style={{
                    fontSize: 10,
                    fontWeight: 600,
                    letterSpacing: '0.06em',
                    textTransform: 'uppercase',
                    color: '#a78bfa',
                    background: 'var(--accent-dim)',
                    padding: '2px 8px',
                    borderRadius: 4,
                  }}
                >
                  ENSIP-25
                </span>
              </div>
              {ENS_TEXT_KEYS.map((key) => (
                <Row key={key} label={key} value={ensRecords[key]} />
              ))}
              <div style={{ paddingTop: 10 }}>
                <a
                  href={`https://app.ens.domains/${ensName ?? ''}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ fontSize: 12, color: 'var(--app-accent)' }}
                >
                  View on ENS App
                </a>
              </div>
            </div>
          </div>
        </div>
      )}

      {!displayAgent && !isLoading && !demo && (
        <div
          className="app-card"
          style={{
            padding: '64px',
            textAlign: 'center',
            color: 'var(--app-text-muted)',
            fontSize: 13,
          }}
        >
          Enter an agent label or .aegis.eth name to view their live accountability profile
        </div>
      )}
    </div>
  );
}
