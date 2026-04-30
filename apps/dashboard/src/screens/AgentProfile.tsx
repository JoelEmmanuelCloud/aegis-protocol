import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useReadContracts } from 'wagmi';
import { useAccount } from 'wagmi';
import { namehash } from 'viem';
import { useAgent } from '../hooks/useAgent';
import { useMyAgents } from '../hooks/useMyAgents';
import { useDemoMode } from '../context/DemoContext';
import {
  fetchAgentSummary,
  fetchAgentReputation,
  fetchRecentAgents,
  type RecentAgent,
} from '../lib/orchestratorApi';
import { demoAgentSummary, demoAgentReputation } from '../lib/demoData';

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
        borderBottom: '1px solid var(--app-border)',
        gap: 12,
      }}
    >
      <span
        style={{
          fontSize: 12,
          color: isEnsip25 ? 'var(--app-accent-light)' : 'var(--app-text-muted)',
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
  const { isDemoMode } = useDemoMode();
  const { address } = useAccount();
  const [label, setLabel] = useState<string | null>(isDemoMode ? 'trading-bot' : null);
  const [input, setInput] = useState('');
  const [inputTouched, setInputTouched] = useState(false);
  const [searchAttempted, setSearchAttempted] = useState(false);

  const { data: myAgents = [] } = useMyAgents();

  const { data: recentAgents = [] } = useQuery<RecentAgent[]>({
    queryKey: ['recentAgents'],
    queryFn: () => fetchRecentAgents(20),
    staleTime: 60_000,
    enabled: !isDemoMode,
  });

  const selectAgent = (ensName: string) => {
    const lbl = ensName.replace(/\.aegis\.eth$/, '');
    setLabel(lbl);
    setInput(ensName);
  };

  const inputError = !input.trim() ? 'Enter an agent label or ENS name to look up' : '';
  const showInputError = (inputTouched || searchAttempted) && !!inputError;

  const ensName = label ? `${label}.aegis.eth` : null;
  const { data: agent, isLoading, isError } = useAgent(label);

  const { data: liveSummary } = useQuery({
    queryKey: ['agentSummary', isDemoMode ? 'demo' : ensName],
    queryFn: isDemoMode
      ? () => Promise.resolve(demoAgentSummary)
      : () => fetchAgentSummary(ensName!),
    enabled: isDemoMode ? true : !!ensName,
    staleTime: isDemoMode ? Infinity : 0,
    refetchInterval: isDemoMode ? false : 5000,
  });

  const { data: liveReputation } = useQuery({
    queryKey: ['agentReputation', isDemoMode ? 'demo' : ensName],
    queryFn: isDemoMode
      ? () => Promise.resolve(demoAgentReputation)
      : () => fetchAgentReputation(ensName!),
    enabled: isDemoMode ? true : !!ensName,
    staleTime: isDemoMode ? Infinity : 0,
    refetchInterval: isDemoMode ? false : 5000,
  });

  const { data: ensData } = useReadContracts({
    contracts: ENS_TEXT_KEYS.map((key) => ({
      address: resolverAddress,
      abi: PUBLIC_RESOLVER_ABI,
      functionName: 'text' as const,
      args: [namehash(ensName ?? ''), key] as [`0x${string}`, string],
      chainId: 16602,
    })),
    query: { enabled: !!ensName && !!resolverAddress },
  });

  const ensRecords: Record<string, string> = ENS_TEXT_KEYS.reduce(
    (acc, key, i) => {
      const val = ensData?.[i]?.result;
      if (typeof val === 'string') acc[key] = val;
      return acc;
    },
    {} as Record<string, string>
  );

  if (liveSummary && liveSummary.totalDecisions > 0) {
    ensRecords['aegis.totalDecisions'] = String(liveSummary.totalDecisions);
  }

  if (liveReputation) {
    ensRecords['aegis.reputation'] = String(liveReputation.score);
    ensRecords['aegis.lastVerdict'] = liveReputation.lastVerdict;
    ensRecords['aegis.flaggedCount'] = String(liveReputation.flaggedCount);
  }

  const score = liveReputation?.score ?? parseInt(ensRecords['aegis.reputation'] ?? '100', 10);

  const handleSearch = () => {
    setSearchAttempted(true);
    setInputTouched(true);
    const cleaned = input.replace(/\.aegis\.eth$/, '').trim();
    if (!cleaned) return;
    setLabel(cleaned);
  };

  const agentCardStyle = (active: boolean): React.CSSProperties => ({
    padding: '12px 16px',
    background: active ? 'var(--app-accent-dim)' : 'var(--app-elevated)',
    border: `1px solid ${active ? 'rgba(212,148,26,0.3)' : 'var(--app-border)'}`,
    borderRadius: 10,
    cursor: 'pointer',
    display: 'flex',
    flexDirection: 'column',
    gap: 4,
    transition: 'all 0.15s',
  });

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

      {address && myAgents.length > 0 && (
        <div>
          <div
            style={{ fontSize: 12, fontWeight: 600, color: 'var(--app-text-2)', marginBottom: 10 }}
          >
            My Agents
          </div>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
              gap: 10,
            }}
          >
            {myAgents.map((a) => (
              <div
                key={a.tokenId}
                style={agentCardStyle(label === a.ensName.replace(/\.aegis\.eth$/, ''))}
                onClick={() => selectAgent(a.ensName)}
              >
                <div
                  style={{
                    fontSize: 13,
                    fontWeight: 600,
                    color: 'var(--app-text)',
                    fontFamily: 'monospace',
                  }}
                >
                  {a.ensName}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ fontSize: 11, color: 'var(--app-text-muted)' }}>
                    Token #{a.tokenId}
                  </span>
                  <span
                    style={{
                      fontSize: 10,
                      fontWeight: 600,
                      color: a.active ? 'var(--app-green)' : 'var(--app-red)',
                      background: a.active ? 'var(--app-green-dim)' : 'var(--app-red-dim)',
                      padding: '1px 6px',
                      borderRadius: 3,
                    }}
                  >
                    {a.active ? 'Active' : 'Inactive'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {!isDemoMode && recentAgents.length > 0 && (
        <div>
          <div
            style={{ fontSize: 12, fontWeight: 600, color: 'var(--app-text-2)', marginBottom: 10 }}
          >
            {address ? 'All Registered Agents' : 'Registered Agents'}
          </div>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
              gap: 10,
            }}
          >
            {recentAgents.map((a) => {
              const lbl = a.ensName.replace(/\.aegis\.eth$/, '');
              return (
                <div
                  key={a.tokenId}
                  style={agentCardStyle(label === lbl)}
                  onClick={() => selectAgent(a.ensName)}
                >
                  <div
                    style={{
                      fontSize: 13,
                      fontWeight: 600,
                      color: 'var(--app-text)',
                      fontFamily: 'monospace',
                    }}
                  >
                    {a.ensName}
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--app-text-muted)' }}>
                    Token #{a.tokenId}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        <div style={{ display: 'flex', gap: 8 }}>
          <input
            className="app-input"
            style={{
              flex: 1,
              borderColor: showInputError ? 'var(--app-red)' : undefined,
            }}
            placeholder="trading-bot or trading-bot.aegis.eth"
            value={input}
            onChange={(e) => {
              setInput(e.target.value);
              setSearchAttempted(false);
            }}
            onBlur={() => setInputTouched(true)}
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
        {showInputError && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            <svg
              width="12"
              height="12"
              viewBox="0 0 24 24"
              fill="none"
              stroke="var(--app-red)"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              style={{ flexShrink: 0 }}
            >
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
            <span style={{ fontSize: 11, color: 'var(--app-red)' }}>{inputError}</span>
          </div>
        )}
        {isError && label && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            <svg
              width="12"
              height="12"
              viewBox="0 0 24 24"
              fill="none"
              stroke="var(--app-red)"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              style={{ flexShrink: 0 }}
            >
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
            <span style={{ fontSize: 11, color: 'var(--app-red)' }}>
              No agent found for &ldquo;{label}.aegis.eth&rdquo; — check the label and try again
            </span>
          </div>
        )}
      </div>

      {isLoading && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {[1, 2].map((i) => (
            <div key={i} className="skeleton" style={{ height: 80, borderRadius: 12 }} />
          ))}
        </div>
      )}

      {agent && (
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
              <ScoreRing score={score} />
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 4 }}>
                  {agent.ensName ?? ensName}
                </div>
                <div style={{ fontSize: 12, color: 'var(--app-text-muted)' }}>
                  Token #{agent.tokenId ?? '—'}
                </div>
              </div>
              <span className={agent.active ? 'badge-cleared' : 'badge-flagged'}>
                {agent.active ? 'Active' : 'Suspended'}
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
                <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--app-accent-light)' }}>
                  {agent.userPercent ?? '—'}%
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
                    width: `${agent.userPercent ?? 0}%`,
                    background: 'var(--app-accent)',
                    borderRadius: 2,
                  }}
                />
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ fontSize: 12, color: 'var(--app-text-muted)' }}>Builder</span>
                <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--app-text)' }}>
                  {agent.builderPercent ?? '—'}%
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
              <Row label="Builder" value={agent.builderAddress} />
              <Row label="Storage Root" value={agent.storageRoot || '—'} />
              <Row
                label="Registered"
                value={
                  agent.mintedAt ? new Date(agent.mintedAt * 1000).toLocaleDateString() : undefined
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
                    color: 'var(--app-accent-light)',
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

      {!agent && !isLoading && (
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
