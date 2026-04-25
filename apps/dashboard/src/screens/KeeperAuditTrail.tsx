import { useKeeperAudit } from '../hooks/useKeeperAudit';
import { useDemoMode } from '../hooks/useDemoMode';
import TxHashLink from '../components/TxHashLink';

const workflowId = import.meta.env.VITE_KEEPERHUB_WORKFLOW_ID ?? null;

const statusCls: Record<string, string> = {
  completed: 'bg-aegis-green-dim text-aegis-green',
  failed: 'bg-aegis-red-dim text-aegis-red',
  running: 'bg-aegis-purple-dim text-aegis-purple-light',
  pending: 'bg-[rgba(107,114,128,0.12)] text-aegis-muted',
};

export default function KeeperAuditTrail() {
  const { enabled: demo } = useDemoMode();
  const { data: runs, isLoading } = useKeeperAudit(demo ? 'wf_aegis_remedy' : workflowId, 20);

  const displayRuns = runs ?? [];

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-end justify-between">
        <div>
          <div className="text-xl font-bold mb-1">Keeper Audit Trail</div>
          <div className="text-[13px] text-aegis-muted">
            KeeperHub workflow runs for automated onchain remedy execution
          </div>
        </div>
        {workflowId && <div className="text-xs text-aegis-dim font-mono">{workflowId}</div>}
      </div>

      {!workflowId && !demo && (
        <div className="bg-aegis-amber-dim border border-[rgba(245,158,11,0.25)] rounded-xl px-4 py-3 text-[13px] text-aegis-amber">
          Set <code className="font-mono">VITE_KEEPERHUB_WORKFLOW_ID</code> in your .env to see live
          audit data, or enable Demo Mode.
        </div>
      )}

      <div className="bg-aegis-card border border-aegis-border rounded-xl overflow-hidden">
        <table className="w-full border-collapse">
          <thead>
            <tr>
              {['Run ID', 'Status', 'Created', 'Completed', 'Tx Hash', 'Gas Used', 'Retries'].map(
                (h, i) => (
                  <th
                    key={h}
                    className={`px-4 py-2.5 text-xs text-aegis-muted font-semibold border-b border-aegis-border bg-black/20 ${
                      i === 5 ? 'text-right' : i === 6 ? 'text-center' : 'text-left'
                    }`}
                  >
                    {h}
                  </th>
                )
              )}
            </tr>
          </thead>
          <tbody>
            {isLoading && (
              <tr>
                <td
                  colSpan={7}
                  className="px-4 py-3 text-[13px] border-b border-aegis-border text-center text-aegis-dim"
                >
                  Loading…
                </td>
              </tr>
            )}
            {!isLoading && displayRuns.length === 0 && (
              <tr>
                <td
                  colSpan={7}
                  className="px-4 py-10 text-[13px] border-b border-aegis-border text-center text-aegis-dim"
                >
                  No workflow runs found
                </td>
              </tr>
            )}
            {displayRuns.map((run) => {
              const sc = statusCls[run.status] ?? statusCls.pending;
              return (
                <tr key={run.runId}>
                  <td className="px-4 py-3 text-[13px] border-b border-aegis-border align-middle font-mono text-aegis-muted">
                    {run.runId}
                  </td>
                  <td className="px-4 py-3 text-[13px] border-b border-aegis-border align-middle">
                    <span
                      className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold ${sc}`}
                    >
                      {run.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-[13px] border-b border-aegis-border align-middle text-aegis-muted">
                    {new Date(run.createdAt).toLocaleString()}
                  </td>
                  <td className="px-4 py-3 text-[13px] border-b border-aegis-border align-middle text-aegis-muted">
                    {run.completedAt ? new Date(run.completedAt).toLocaleString() : '—'}
                  </td>
                  <td className="px-4 py-3 text-[13px] border-b border-aegis-border align-middle">
                    {run.txHash ? (
                      <TxHashLink hash={run.txHash} />
                    ) : (
                      <span className="text-aegis-dim">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-[13px] border-b border-aegis-border align-middle text-right text-aegis-muted">
                    {run.gasUsed ? run.gasUsed.toLocaleString() : '—'}
                  </td>
                  <td
                    className={`px-4 py-3 text-[13px] border-b border-aegis-border align-middle text-center ${
                      run.retryCount > 0 ? 'text-aegis-amber' : 'text-aegis-dim'
                    }`}
                  >
                    {run.retryCount}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
