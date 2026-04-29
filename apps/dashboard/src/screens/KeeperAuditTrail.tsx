import { useKeeperAudit } from '../hooks/useKeeperAudit';

type StepRecord = { action: string; status: 'completed' | 'skipped' | 'failed'; completedAt: number };

type Run = {
  runId: string;
  workflowId: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  txHash?: string;
  gasUsed?: number;
  retryCount: number;
  createdAt: number;
  completedAt?: number;
  payload?: { rootHash: string; agentId: string; verdict: string };
  steps?: StepRecord[];
};

const ZG_EXPLORER = 'https://chainscan-galileo.0g.ai';

const STEP_LABELS: Record<string, string> = {
  'aegis.fetch_verdict': 'Fetch verdict from AegisCourt',
  'aegis.notify_agent_owner': 'Notify agent owner',
  'aegis.execute_remedy_tx': 'Execute remedy on-chain',
  'aegis.update_ens_reputation': 'Update ENS reputation record',
  'aegis.update_reputation': 'Update reputation store',
};

function StepRow({ step }: { step: StepRecord }) {
  const color =
    step.status === 'completed'
      ? 'var(--app-green)'
      : step.status === 'skipped'
        ? 'var(--app-text-muted)'
        : 'var(--app-red)';
  const mark = step.status === 'completed' ? '✓' : step.status === 'skipped' ? '–' : '✗';
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        padding: '5px 0',
      }}
    >
      <span style={{ fontSize: 12, color, fontWeight: 700, width: 14, textAlign: 'center', flexShrink: 0 }}>
        {mark}
      </span>
      <span style={{ fontSize: 12, color: step.status === 'skipped' ? 'var(--app-text-muted)' : 'var(--app-text-2)', flex: 1 }}>
        {STEP_LABELS[step.action] ?? step.action}
      </span>
      <span
        style={{
          fontSize: 10,
          fontWeight: 600,
          color,
          textTransform: 'uppercase',
          background: `${color}18`,
          padding: '1px 6px',
          borderRadius: 3,
        }}
      >
        {step.status}
      </span>
    </div>
  );
}

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
          <code style={{ fontSize: 12, color: 'var(--app-accent-light)' }}>aegis.execute_remedy</code>
        </p>
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: 10,
        }}
      >
        {[
          { label: 'Automated Execution', desc: 'Triggered automatically on every verdict — no manual intervention required' },
          { label: 'On-chain Remedy', desc: 'execute_remedy_tx fires a contract call when verdict is FLAGGED; skipped for CLEARED' },
          { label: 'Fully Auditable', desc: 'Every run, step outcome, and agent are logged here and verifiable on AegisCourt' },
        ].map(({ label, desc }) => (
          <div
            key={label}
            style={{
              padding: '12px 14px',
              background: 'var(--app-elevated)',
              borderRadius: 10,
              border: '1px solid var(--app-border)',
              display: 'flex',
              flexDirection: 'column',
              gap: 4,
            }}
          >
            <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--app-text)' }}>
              {label}
            </div>
            <div style={{ fontSize: 11, color: 'var(--app-text-muted)', lineHeight: 1.5 }}>{desc}</div>
          </div>
        ))}
      </div>

      <div className="app-card">
        {isLoading ? (
          <div style={{ padding: '32px', display: 'flex', flexDirection: 'column', gap: 8 }}>
            {[1, 2, 3].map((i) => (
              <div key={i} className="skeleton" style={{ height: 56, borderRadius: 8 }} />
            ))}
          </div>
        ) : runs.length === 0 ? (
          <div style={{ padding: '48px', textAlign: 'center', color: 'var(--app-text-muted)', fontSize: 13 }}>
            No remedy runs yet. File a dispute to trigger the workflow.
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
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    <span style={{ fontFamily: 'monospace', fontSize: 11, color: 'var(--app-text-muted)' }}>
                      {r.runId}
                    </span>
                    {r.payload && (
                      <span style={{ fontSize: 11, color: 'var(--app-text-2)', fontFamily: 'monospace' }}>
                        {r.payload.agentId} — verdict:{' '}
                        <span
                          style={{
                            color:
                              r.payload.verdict === 'CLEARED'
                                ? 'var(--app-green)'
                                : r.payload.verdict === 'FLAGGED'
                                  ? 'var(--app-red)'
                                  : 'var(--app-yellow)',
                            fontWeight: 700,
                          }}
                        >
                          {r.payload.verdict}
                        </span>
                      </span>
                    )}
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

                {r.steps && r.steps.length > 0 && (
                  <div
                    style={{
                      background: 'var(--app-elevated)',
                      borderRadius: 8,
                      padding: '8px 12px',
                      marginBottom: 10,
                    }}
                  >
                    {r.steps.map((s) => (
                      <StepRow key={s.action} step={s} />
                    ))}
                  </div>
                )}

                <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap', alignItems: 'center' }}>
                  <div style={{ fontSize: 11 }}>
                    <span style={{ color: 'var(--app-text-muted)' }}>Retries: </span>
                    <span style={{ color: 'var(--app-text)' }}>{r.retryCount}</span>
                  </div>
                  {r.completedAt && (
                    <div style={{ fontSize: 11, color: 'var(--app-text-muted)' }}>
                      {new Date(r.completedAt).toLocaleString()}
                    </div>
                  )}
                  {r.txHash ? (
                    <a
                      href={`${ZG_EXPLORER}/tx/${r.txHash}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ fontSize: 11, color: 'var(--app-accent)', fontFamily: 'monospace', textDecoration: 'none' }}
                    >
                      {r.txHash.slice(0, 14)}… ↗
                    </a>
                  ) : (
                    <span style={{ fontSize: 11, color: 'var(--app-text-muted)' }}>
                      No on-chain tx — verdict was not FLAGGED
                    </span>
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
