import { useKeeperAudit } from '../hooks/useKeeperAudit';

type Run = {
  runId: string;
  status: string;
  txHash?: string;
  gasUsed?: number;
  retryCount: number;
  createdAt: number;
  completedAt?: number;
};

export default function KeeperAuditTrail() {
  const { data: live, isLoading } = useKeeperAudit(
    import.meta.env.VITE_KEEPERHUB_WORKFLOW_ID ?? ''
  );
  const runs = (live ?? []) as Run[];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div>
        <h1 style={{ fontSize: 20, fontWeight: 700, letterSpacing: '-0.01em', marginBottom: 4 }}>
          KeeperHub Audit Trail
        </h1>
        <p style={{ fontSize: 13, color: 'var(--app-text-muted)' }}>
          Automated remedy execution log for{' '}
          <code style={{ fontSize: 12, color: 'var(--app-accent-light)' }}>
            aegis.execute_remedy
          </code>
        </p>
      </div>

      <div className="app-card">
        {isLoading ? (
          <div style={{ padding: '32px', display: 'flex', flexDirection: 'column', gap: 8 }}>
            {[1, 2, 3].map((i) => (
              <div key={i} className="skeleton" style={{ height: 56, borderRadius: 8 }} />
            ))}
          </div>
        ) : runs.length === 0 ? (
          <div
            style={{
              padding: '48px',
              textAlign: 'center',
              color: 'var(--app-text-muted)',
              fontSize: 13,
            }}
          >
            No remedy runs yet. Runs appear when a FLAGGED verdict fires the workflow.
          </div>
        ) : (
          <div>
            {runs.map((r, i) => (
              <div
                key={r.runId}
                style={{
                  padding: '16px 20px',
                  borderBottom: i < runs.length - 1 ? '1px solid var(--app-border)' : 'none',
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginBottom: 10,
                  }}
                >
                  <div
                    style={{
                      fontFamily: 'monospace',
                      fontSize: 12,
                      color: 'var(--app-text-2)',
                    }}
                  >
                    {r.runId}
                  </div>
                  <span
                    className={
                      r.status === 'completed'
                        ? 'badge-cleared'
                        : r.status === 'failed'
                          ? 'badge-flagged'
                          : 'badge-pending'
                    }
                  >
                    {r.status}
                  </span>
                </div>
                <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap' }}>
                  {r.txHash && (
                    <div style={{ fontSize: 11 }}>
                      <span style={{ color: 'var(--app-text-muted)' }}>Tx: </span>
                      <a
                        href={`https://chainscan-galileo.0g.ai/tx/${r.txHash}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{ fontFamily: 'monospace', color: 'var(--app-accent)' }}
                      >
                        {r.txHash.slice(0, 14)}…
                      </a>
                    </div>
                  )}
                  {r.gasUsed != null && (
                    <div style={{ fontSize: 11 }}>
                      <span style={{ color: 'var(--app-text-muted)' }}>Gas: </span>
                      <span style={{ color: 'var(--app-text)' }}>{r.gasUsed.toLocaleString()}</span>
                    </div>
                  )}
                  <div style={{ fontSize: 11 }}>
                    <span style={{ color: 'var(--app-text-muted)' }}>Retries: </span>
                    <span style={{ color: 'var(--app-text)' }}>{r.retryCount}</span>
                  </div>
                  {r.completedAt && (
                    <div style={{ fontSize: 11, color: 'var(--app-text-muted)' }}>
                      {new Date(r.completedAt).toLocaleString()}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
