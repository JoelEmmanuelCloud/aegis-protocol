import { useState } from 'react';
import { useDispute } from '../hooks/useDispute';
import { useDisputeStatus } from '../hooks/useDisputeStatus';

export default function DisputeUI() {
  const [rootHash, setRootHash] = useState('');
  const [agentId, setAgentId] = useState('');
  const [reason, setReason] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const { mutate: fileDispute, isPending, isSuccess, error } = useDispute();
  const { data: status } = useDisputeStatus(submitted ? rootHash : undefined);

  const handleSubmit = () => {
    if (!rootHash || !agentId || !reason) return;
    fileDispute({ rootHash, agentId, reason }, { onSuccess: () => setSubmitted(true) });
  };

  const verdictColor =
    status?.verdict === 'CLEARED'
      ? 'var(--green)'
      : status?.verdict === 'FLAGGED'
        ? 'var(--red)'
        : 'var(--yellow)';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div>
        <h1 style={{ fontSize: 20, fontWeight: 700, letterSpacing: '-0.01em', marginBottom: 4 }}>
          File Dispute
        </h1>
        <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>
          Challenge an agent decision. The Verifier replays it via 0G Compute TEE.
        </p>
      </div>

      {isSuccess && status && (
        <div
          style={{
            padding: '20px',
            background:
              status.verdict === 'CLEARED'
                ? 'var(--green-dim)'
                : status.verdict === 'FLAGGED'
                  ? 'var(--red-dim)'
                  : 'var(--yellow-dim)',
            border: `1px solid ${verdictColor}40`,
            borderRadius: 10,
          }}
        >
          <div style={{ fontWeight: 700, fontSize: 16, color: verdictColor, marginBottom: 8 }}>
            Verdict: {status.verdict}
          </div>
          {status.teeProof && (
            <div
              style={{
                fontSize: 11,
                fontFamily: 'monospace',
                color: 'var(--text-muted)',
                wordBreak: 'break-all',
              }}
            >
              TEE Proof: {status.teeProof.slice(0, 80)}…
            </div>
          )}
        </div>
      )}

      <div
        className="card"
        style={{
          padding: '24px',
          display: 'flex',
          flexDirection: 'column',
          gap: 18,
          maxWidth: 560,
        }}
      >
        <div>
          <label
            style={{
              fontSize: 12,
              fontWeight: 600,
              color: 'var(--text-secondary)',
              display: 'block',
              marginBottom: 8,
            }}
          >
            Root Hash
          </label>
          <input
            className="input"
            style={{ fontFamily: 'monospace' }}
            placeholder="0xabc123..."
            value={rootHash}
            onChange={(e) => setRootHash(e.target.value)}
          />
        </div>

        <div>
          <label
            style={{
              fontSize: 12,
              fontWeight: 600,
              color: 'var(--text-secondary)',
              display: 'block',
              marginBottom: 8,
            }}
          >
            Agent ENS Name
          </label>
          <input
            className="input"
            placeholder="trading-bot.aegis.eth"
            value={agentId}
            onChange={(e) => setAgentId(e.target.value)}
          />
        </div>

        <div>
          <label
            style={{
              fontSize: 12,
              fontWeight: 600,
              color: 'var(--text-secondary)',
              display: 'block',
              marginBottom: 8,
            }}
          >
            Reason
          </label>
          <textarea
            className="input"
            placeholder="Describe the disputed action and why it was incorrect..."
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            rows={4}
            style={{ resize: 'vertical' }}
          />
        </div>

        {error && (
          <div
            style={{
              padding: '12px 16px',
              background: 'var(--red-dim)',
              border: '1px solid rgba(239,68,68,0.2)',
              borderRadius: 8,
              fontSize: 12,
              color: 'var(--red)',
            }}
          >
            {String(error).slice(0, 160)}
          </div>
        )}

        <button
          className="btn-primary"
          onClick={handleSubmit}
          disabled={!rootHash || !agentId || !reason || isPending}
          style={{
            width: '100%',
            padding: '12px',
            opacity: !rootHash || !agentId || !reason || isPending ? 0.5 : 1,
            cursor: isPending ? 'not-allowed' : 'pointer',
          }}
        >
          {isPending ? 'Submitting to AegisCourt…' : 'File Dispute'}
        </button>
      </div>
    </div>
  );
}
