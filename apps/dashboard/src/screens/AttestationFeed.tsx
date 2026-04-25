import { useState } from 'react';
import { useAttestations } from '../hooks/useAttestations';
import { useDemoMode } from '../hooks/useDemoMode';
import { demoAttestations } from '../lib/demoData';

type Attestation = { agentId: string; rootHash: string; verdict: string; timestamp: number };

function VerdictBadge({ verdict }: { verdict: string }) {
  if (verdict === 'CLEARED') return <span className="badge-cleared">Cleared</span>;
  if (verdict === 'FLAGGED') return <span className="badge-flagged">Flagged</span>;
  return <span className="badge-pending">Pending</span>;
}

export default function AttestationFeed() {
  const { enabled: demo } = useDemoMode();
  const { data: live, isLoading } = useAttestations();
  const [filter, setFilter] = useState<string>('ALL');

  const raw = (demo ? demoAttestations : (live ?? [])) as Attestation[];
  const items = filter === 'ALL' ? raw : raw.filter((a) => a.verdict === filter);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 700, letterSpacing: '-0.01em', marginBottom: 4 }}>
            Attestation Feed
          </h1>
          <p style={{ fontSize: 13, color: 'var(--app-text-muted)' }}>
            Real-time decision records committed to 0G Storage
          </p>
        </div>
        <div style={{ display: 'flex', gap: 6 }}>
          {['ALL', 'PENDING', 'CLEARED', 'FLAGGED'].map((v) => (
            <button
              key={v}
              onClick={() => setFilter(v)}
              style={{
                padding: '6px 14px',
                borderRadius: 6,
                fontSize: 12,
                fontWeight: 600,
                cursor: 'pointer',
                border: '1px solid',
                borderColor: filter === v ? 'var(--app-accent)' : 'var(--app-border)',
                background: filter === v ? 'var(--accent-dim)' : 'transparent',
                color: filter === v ? '#a78bfa' : 'var(--app-text-muted)',
              }}
            >
              {v}
            </button>
          ))}
        </div>
      </div>

      <div className="app-card">
        <div
          style={{
            padding: '14px 20px',
            borderBottom: '1px solid var(--app-border)',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            fontSize: 12,
            color: 'var(--app-green)',
          }}
        >
          <span className="app-pulse-dot" /> Live stream from Witness Node
        </div>
        {isLoading && !demo ? (
          <div style={{ padding: '48px', textAlign: 'center' }}>
            <div className="skeleton" style={{ height: 16, width: 200, margin: '0 auto 12px' }} />
            <div className="skeleton" style={{ height: 12, width: 140, margin: '0 auto' }} />
          </div>
        ) : items.length === 0 ? (
          <div
            style={{
              padding: '48px',
              textAlign: 'center',
              color: 'var(--app-text-muted)',
              fontSize: 13,
            }}
          >
            No attestations match this filter
          </div>
        ) : (
          <div>
            {items.map((a, i) => (
              <div
                key={i}
                style={{
                  padding: '16px 20px',
                  borderBottom: i < items.length - 1 ? '1px solid var(--app-border)' : 'none',
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginBottom: 8,
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div
                      style={{
                        width: 32,
                        height: 32,
                        borderRadius: 8,
                        background: 'var(--accent-dim)',
                        border: '1px solid rgba(124,58,237,0.2)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: 11,
                        fontWeight: 700,
                        color: '#a78bfa',
                      }}
                    >
                      {a.agentId?.[0]?.toUpperCase() ?? 'A'}
                    </div>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--app-text)' }}>
                        {a.agentId}
                      </div>
                      <div style={{ fontSize: 11, color: 'var(--app-text-muted)' }}>
                        {new Date(a.timestamp).toLocaleString()}
                      </div>
                    </div>
                  </div>
                  <VerdictBadge verdict={a.verdict} />
                </div>
                <div
                  style={{
                    fontSize: 11,
                    color: 'var(--app-text-muted)',
                    fontFamily: 'monospace',
                    background: 'var(--app-elevated)',
                    padding: '8px 12px',
                    borderRadius: 6,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  rootHash: {a.rootHash}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
