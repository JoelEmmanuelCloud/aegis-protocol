import { useState } from 'react';
import { useDispute } from '../hooks/useDispute';
import { useDisputeStatus } from '../hooks/useDisputeStatus';
import { useDemoMode } from '../hooks/useDemoMode';
import { demoDisputes } from '../lib/demoData';
import VerdictBadge from '../components/VerdictBadge';

const inputCls =
  'w-full px-3.5 py-2.5 bg-aegis-base border border-aegis-border-solid rounded-lg text-aegis-text text-sm outline-none';

const labelCls = 'text-[13px] text-aegis-muted mb-1.5 block';

export default function DisputeUI() {
  const { enabled: demo } = useDemoMode();
  const [agentId, setAgentId] = useState('');
  const [rootHash, setRootHash] = useState('');
  const [reason, setReason] = useState('');
  const [filedRootHash, setFiledRootHash] = useState<string | null>(null);

  const { mutate: file, isPending, error, data: result } = useDispute();
  const { data: status } = useDisputeStatus(
    filedRootHash ?? (demo ? demoDisputes[0].rootHash : null)
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!agentId || !rootHash || !reason) return;
    file({ rootHash, agentId, reason }, { onSuccess: () => setFiledRootHash(rootHash) });
  };

  const canSubmit = !isPending && !demo && !!agentId && !!rootHash && !!reason;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <div className="text-xl font-bold mb-1">File a Dispute</div>
        <div className="text-[13px] text-aegis-muted">
          Challenge a decision. The verifier replays it via 0G Compute TEE.
        </div>
      </div>

      <div className="grid grid-cols-[1fr_340px] gap-4 items-start">
        <div className="bg-aegis-card border border-aegis-border rounded-xl px-6 py-5">
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div>
              <label className={labelCls}>Agent ID (ENS name)</label>
              <input
                className={inputCls}
                value={agentId}
                onChange={(e) => setAgentId(e.target.value)}
                placeholder="trading-bot.aegis.eth"
                disabled={demo}
              />
            </div>
            <div>
              <label className={labelCls}>Root Hash</label>
              <input
                className={inputCls}
                value={rootHash}
                onChange={(e) => setRootHash(e.target.value)}
                placeholder="0x..."
                disabled={demo}
              />
            </div>
            <div>
              <label className={labelCls}>Reason</label>
              <textarea
                className={`${inputCls} h-24 resize-y`}
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Describe why this decision should be disputed…"
                disabled={demo}
              />
            </div>

            {error && (
              <div className="text-aegis-red text-[13px] bg-aegis-red-dim px-3.5 py-2.5 rounded-lg">
                {error.message}
              </div>
            )}

            {result && (
              <div className="text-aegis-green text-[13px] bg-aegis-green-dim px-3.5 py-2.5 rounded-lg">
                Dispute filed — verdict: <strong>{result.verdict}</strong>
              </div>
            )}

            <button
              type="submit"
              disabled={!canSubmit}
              className={`py-3 border-0 rounded-lg text-sm font-semibold transition-colors ${
                canSubmit
                  ? 'bg-aegis-purple text-white cursor-pointer'
                  : 'bg-aegis-card-hover text-aegis-dim cursor-default'
              }`}
            >
              {isPending ? 'Submitting…' : demo ? 'Demo Mode — disabled' : 'File Dispute'}
            </button>
          </form>
        </div>

        <div className="bg-aegis-card border border-aegis-border rounded-xl px-6 py-5">
          <div className="text-sm font-semibold mb-4">Dispute Status</div>
          {status ? (
            <div className="flex flex-col gap-2.5">
              <div className="flex justify-between items-center">
                <span className="text-[13px] text-aegis-muted">Verdict</span>
                <VerdictBadge verdict={status.verdict ?? 'PENDING'} />
              </div>
              {[
                ['Agent', status.agentId],
                ['Filed by', `${status.disputedBy.slice(0, 8)}…`],
                ['Reason', status.reason],
                ['Filed', new Date(status.timestamp).toLocaleString()],
              ].map(([k, v]) => (
                <div
                  key={k}
                  className="flex justify-between text-[13px] border-b border-aegis-border pb-2"
                >
                  <span className="text-aegis-muted">{k}</span>
                  <span className="text-aegis-text max-w-[160px] truncate">{v}</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-aegis-dim text-[13px] text-center py-6">
              {demo ? 'Loading demo dispute…' : 'File a dispute to track its status here'}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
