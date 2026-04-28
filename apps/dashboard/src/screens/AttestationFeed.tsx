import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAttestations } from '../hooks/useAttestations';

type Attestation = {
  agentId: string;
  rootHash: string;
  verdict: string;
  timestamp: number;
  action?: Record<string, unknown>;
  reasoning?: string;
};

function VerdictBadge({ verdict }: { verdict: string }) {
  if (verdict === 'CLEARED') return <span className="badge-cleared">Cleared</span>;
  if (verdict === 'FLAGGED') return <span className="badge-flagged">Flagged</span>;
  return <span className="badge-pending">Pending</span>;
}

function summarizeAction(action?: Record<string, unknown>): string {
  if (!action) return '';
  const { type, ...rest } = action as { type?: unknown; [k: string]: unknown };
  if (typeof type === 'string') {
    const parts = Object.entries(rest)
      .slice(0, 3)
      .map(([k, v]) => `${k}=${typeof v === 'object' ? JSON.stringify(v) : String(v)}`);
    return parts.length ? `${type}: ${parts.join(', ')}` : type;
  }
  const str = JSON.stringify(action);
  return str.length > 100 ? str.slice(0, 97) + '…' : str;
}

export default function AttestationFeed() {
  const navigate = useNavigate();
  const { data: live, isLoading } = useAttestations();
  const [filter, setFilter] = useState<string>('ALL');

  const raw = (live?.items ?? []) as Attestation[];
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
                color: filter === v ? 'var(--app-accent-light)' : 'var(--app-text-muted)',
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
        {isLoading ? (
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
            {items.map((a, i) => {
              const actionText = summarizeAction(a.action);
              return (
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
                      marginBottom: actionText || a.reasoning ? 10 : 8,
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div
                        style={{
                          width: 32,
                          height: 32,
                          borderRadius: 8,
                          background: 'var(--accent-dim)',
                          border: '1px solid rgba(212,148,26,0.2)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: 11,
                          fontWeight: 700,
                          color: 'var(--app-accent-light)',
                          flexShrink: 0,
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
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <VerdictBadge verdict={a.verdict} />
                      <button
                        onClick={() =>
                          navigate(
                            `/app/disputes?rootHash=${encodeURIComponent(a.rootHash)}&agentId=${encodeURIComponent(a.agentId)}`
                          )
                        }
                        style={{
                          padding: '4px 10px',
                          borderRadius: 5,
                          fontSize: 11,
                          fontWeight: 600,
                          cursor: 'pointer',
                          border: '1px solid rgba(239,68,68,0.35)',
                          background: 'var(--app-red-dim)',
                          color: 'var(--app-red)',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        File Dispute
                      </button>
                    </div>
                  </div>

                  {actionText && (
                    <div
                      style={{
                        fontSize: 13,
                        color: 'var(--app-text)',
                        marginBottom: a.reasoning ? 6 : 8,
                        fontWeight: 500,
                      }}
                    >
                      {actionText}
                    </div>
                  )}

                  {a.reasoning && (
                    <div
                      style={{
                        fontSize: 12,
                        color: 'var(--app-text-muted)',
                        marginBottom: 8,
                        lineHeight: 1.5,
                        overflow: 'hidden',
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                      }}
                    >
                      {a.reasoning}
                    </div>
                  )}

                  <div
                    style={{
                      fontSize: 11,
                      color: 'var(--app-text-muted)',
                      fontFamily: 'monospace',
                      background: 'var(--app-elevated)',
                      padding: '6px 10px',
                      borderRadius: 6,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {a.rootHash}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
