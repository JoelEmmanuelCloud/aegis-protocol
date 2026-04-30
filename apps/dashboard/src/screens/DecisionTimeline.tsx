import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAttestations } from '../hooks/useAttestations';

type Entry = {
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
  return <span className="badge-pending">Attested</span>;
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

export default function DecisionTimeline() {
  const navigate = useNavigate();
  const { data: live } = useAttestations();
  const [search, setSearch] = useState('');

  const all = (live?.items ?? []) as Entry[];
  const items = search
    ? all.filter(
        (a) =>
          a.agentId.toLowerCase().includes(search.toLowerCase()) ||
          a.rootHash.toLowerCase().includes(search.toLowerCase()) ||
          (a.reasoning ?? '').toLowerCase().includes(search.toLowerCase()) ||
          summarizeAction(a.action).toLowerCase().includes(search.toLowerCase())
      )
    : all;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 700, letterSpacing: '-0.01em', marginBottom: 4 }}>
            Decision Timeline
          </h1>
          <p style={{ fontSize: 13, color: 'var(--app-text-muted)' }}>
            Full history of every attested decision on the mesh
          </p>
        </div>
        <input
          className="app-input"
          style={{ width: 240 }}
          placeholder="Search agent, hash, or decision…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 0, position: 'relative' }}>
        <div
          style={{
            position: 'absolute',
            left: 15,
            top: 0,
            bottom: 0,
            width: 1,
            background: 'var(--app-border)',
            zIndex: 0,
          }}
        />
        {items.length === 0 ? (
          <div
            className="app-card"
            style={{
              padding: '48px',
              textAlign: 'center',
              color: 'var(--app-text-muted)',
              fontSize: 13,
            }}
          >
            {search ? 'No results match your search' : 'No decisions recorded yet'}
          </div>
        ) : (
          items.map((a, i) => {
            const actionText = summarizeAction(a.action);
            return (
              <div
                key={i}
                style={{
                  display: 'flex',
                  gap: 16,
                  marginBottom: 12,
                  position: 'relative',
                  zIndex: 1,
                }}
              >
                <div
                  style={{
                    width: 30,
                    height: 30,
                    borderRadius: '50%',
                    background:
                      a.verdict === 'CLEARED'
                        ? 'var(--app-green-dim)'
                        : a.verdict === 'FLAGGED'
                          ? 'var(--app-red-dim)'
                          : 'var(--app-yellow-dim)',
                    border: `2px solid ${a.verdict === 'CLEARED' ? 'var(--app-green)' : a.verdict === 'FLAGGED' ? 'var(--app-red)' : 'var(--app-yellow)'}`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                    marginTop: 10,
                  }}
                >
                  <div
                    style={{
                      width: 8,
                      height: 8,
                      borderRadius: '50%',
                      background:
                        a.verdict === 'CLEARED'
                          ? 'var(--app-green)'
                          : a.verdict === 'FLAGGED'
                            ? 'var(--app-red)'
                            : 'var(--app-yellow)',
                    }}
                  />
                </div>
                <div className="app-card" style={{ flex: 1, padding: '14px 18px' }}>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      justifyContent: 'space-between',
                      marginBottom: 8,
                      gap: 12,
                    }}
                  >
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 2 }}>
                        {a.agentId}
                      </div>
                      {actionText && (
                        <div
                          style={{
                            fontSize: 13,
                            color: 'var(--app-text)',
                            fontWeight: 500,
                            marginBottom: a.reasoning ? 4 : 0,
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
                    </div>
                    <div
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'flex-end',
                        gap: 6,
                        flexShrink: 0,
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <VerdictBadge verdict={a.verdict} />
                        <span style={{ fontSize: 11, color: 'var(--app-text-muted)' }}>
                          {new Date(a.timestamp).toLocaleString()}
                        </span>
                      </div>
                      <button
                        onClick={() =>
                          navigate(
                            `/app/disputes?rootHash=${encodeURIComponent(a.rootHash)}&agentId=${encodeURIComponent(a.agentId)}`
                          )
                        }
                        style={{
                          padding: '3px 9px',
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
                  <div
                    style={{
                      fontSize: 11,
                      fontFamily: 'monospace',
                      color: 'var(--app-text-muted)',
                      background: 'var(--app-elevated)',
                      padding: '6px 10px',
                      borderRadius: 5,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {a.rootHash}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
