import { useState } from 'react';
import { useAttestations } from '../hooks/useAttestations';

type Entry = { agentId: string; rootHash: string; verdict: string; timestamp: number };

function VerdictBadge({ verdict }: { verdict: string }) {
  if (verdict === 'CLEARED') return <span className="badge-cleared">Cleared</span>;
  if (verdict === 'FLAGGED') return <span className="badge-flagged">Flagged</span>;
  return <span className="badge-pending">Pending</span>;
}

export default function DecisionTimeline() {
  const { data: live } = useAttestations();
  const [search, setSearch] = useState('');

  const all = (live ?? []) as Entry[];
  const items = search
    ? all.filter(
        (a) =>
          a.agentId.toLowerCase().includes(search.toLowerCase()) ||
          a.rootHash.toLowerCase().includes(search.toLowerCase())
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
          placeholder="Search agent or hash…"
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
          items.map((a, i) => (
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
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginBottom: 8,
                  }}
                >
                  <div style={{ fontWeight: 600, fontSize: 13 }}>{a.agentId}</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <VerdictBadge verdict={a.verdict} />
                    <span style={{ fontSize: 11, color: 'var(--app-text-muted)' }}>
                      {new Date(a.timestamp).toLocaleString()}
                    </span>
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
          ))
        )}
      </div>
    </div>
  );
}
