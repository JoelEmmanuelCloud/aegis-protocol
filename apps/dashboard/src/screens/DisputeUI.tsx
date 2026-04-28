import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAccount } from 'wagmi';
import { useDispute } from '../hooks/useDispute';
import { useDisputeStatus } from '../hooks/useDisputeStatus';
import { useDemoMode } from '../context/DemoContext';

function FieldError({ msg }: { msg: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginTop: 5 }}>
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
      <span style={{ fontSize: 11, color: 'var(--app-red)' }}>{msg}</span>
    </div>
  );
}

export default function DisputeUI() {
  const [searchParams] = useSearchParams();
  const { address } = useAccount();
  const { isDemoMode } = useDemoMode();
  const canSubmit = isDemoMode || !!address;
  const [rootHash, setRootHash] = useState('');
  const [agentId, setAgentId] = useState('');
  const [reason, setReason] = useState('');

  useEffect(() => {
    const hash = searchParams.get('rootHash');
    const agent = searchParams.get('agentId');
    if (hash) setRootHash(hash);
    if (agent) setAgentId(agent);
  }, []);
  const [submitted, setSubmitted] = useState(false);
  const [touched, setTouched] = useState({ rootHash: false, agentId: false, reason: false });
  const [submitAttempted, setSubmitAttempted] = useState(false);
  const { mutate: fileDispute, isPending, isSuccess, error } = useDispute();
  const { data: status } = useDisputeStatus(submitted ? rootHash : undefined);

  const rootHashError = (() => {
    if (!rootHash.trim()) return 'Root hash is required';
    if (!/^0x[0-9a-fA-F]+$/.test(rootHash.trim())) return 'Must be a hex string starting with 0x';
    if (rootHash.trim().length < 10) return 'Root hash is too short';
    return '';
  })();

  const agentIdError = (() => {
    if (!agentId.trim()) return 'Agent ENS name is required';
    const cleaned = agentId.trim().replace(/\.aegis\.eth$/, '');
    if (!/^[a-z0-9-]+$/.test(cleaned))
      return 'Must be a valid .aegis.eth name (e.g. trading-bot.aegis.eth)';
    return '';
  })();

  const reasonError = (() => {
    if (!reason.trim()) return 'Reason is required';
    if (reason.trim().length < 20)
      return `Too short — add more detail (${reason.trim().length}/20 chars)`;
    return '';
  })();

  const touch = (field: keyof typeof touched) => setTouched((prev) => ({ ...prev, [field]: true }));

  const show = (field: keyof typeof touched) => touched[field] || submitAttempted;

  const verdictColor =
    status?.verdict === 'CLEARED'
      ? 'var(--app-green)'
      : status?.verdict === 'FLAGGED'
        ? 'var(--app-red)'
        : 'var(--app-yellow)';

  const handleSubmit = () => {
    setSubmitAttempted(true);
    setTouched({ rootHash: true, agentId: true, reason: true });
    if (!canSubmit) return;
    if (rootHashError || agentIdError || reasonError) return;
    const normalizedAgentId = agentId.trim().endsWith('.aegis.eth')
      ? agentId.trim()
      : `${agentId.trim()}.aegis.eth`;
    fileDispute(
      { rootHash: rootHash.trim(), agentId: normalizedAgentId, reason: reason.trim() },
      { onSuccess: () => setSubmitted(true) }
    );
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div>
        <h1 style={{ fontSize: 20, fontWeight: 700, letterSpacing: '-0.01em', marginBottom: 4 }}>
          File Dispute
        </h1>
        <p style={{ fontSize: 13, color: 'var(--app-text-muted)' }}>
          Challenge an agent decision. The Verifier replays it via 0G Compute TEE.
        </p>
      </div>

      {isSuccess && status && (
        <div
          style={{
            padding: '20px',
            background:
              status.verdict === 'CLEARED'
                ? 'var(--app-green-dim)'
                : status.verdict === 'FLAGGED'
                  ? 'var(--app-red-dim)'
                  : 'var(--app-yellow-dim)',
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
                color: 'var(--app-text-muted)',
                wordBreak: 'break-all',
              }}
            >
              TEE Proof: {status.teeProof.slice(0, 80)}…
            </div>
          )}
        </div>
      )}

      <div
        className="app-card"
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
              color: 'var(--app-text-2)',
              display: 'block',
              marginBottom: 8,
            }}
          >
            Root Hash <span style={{ color: 'var(--app-red)', marginLeft: 2 }}>*</span>
          </label>
          <input
            className="app-input"
            style={{
              fontFamily: 'monospace',
              borderColor: show('rootHash') && rootHashError ? 'var(--app-red)' : undefined,
            }}
            placeholder="0xabc123..."
            value={rootHash}
            onChange={(e) => setRootHash(e.target.value)}
            onBlur={() => touch('rootHash')}
          />
          {show('rootHash') && rootHashError ? (
            <FieldError msg={rootHashError} />
          ) : (
            <div style={{ fontSize: 11, color: 'var(--app-text-muted)', marginTop: 6 }}>
              The root hash from the attestation card
            </div>
          )}
        </div>

        <div>
          <label
            style={{
              fontSize: 12,
              fontWeight: 600,
              color: 'var(--app-text-2)',
              display: 'block',
              marginBottom: 8,
            }}
          >
            Agent ENS Name <span style={{ color: 'var(--app-red)', marginLeft: 2 }}>*</span>
          </label>
          <input
            className="app-input"
            style={{ borderColor: show('agentId') && agentIdError ? 'var(--app-red)' : undefined }}
            placeholder="trading-bot.aegis.eth"
            value={agentId}
            onChange={(e) => setAgentId(e.target.value)}
            onBlur={() => touch('agentId')}
          />
          {show('agentId') && agentIdError ? (
            <FieldError msg={agentIdError} />
          ) : (
            <div style={{ fontSize: 11, color: 'var(--app-text-muted)', marginTop: 6 }}>
              Enter the label or full ENS name
            </div>
          )}
        </div>

        <div>
          <label
            style={{
              fontSize: 12,
              fontWeight: 600,
              color: 'var(--app-text-2)',
              display: 'block',
              marginBottom: 8,
            }}
          >
            Reason <span style={{ color: 'var(--app-red)', marginLeft: 2 }}>*</span>
          </label>
          <textarea
            className="app-input"
            style={{
              resize: 'vertical',
              borderColor: show('reason') && reasonError ? 'var(--app-red)' : undefined,
            }}
            placeholder="Describe the disputed action and why it was incorrect..."
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            onBlur={() => touch('reason')}
            rows={4}
          />
          {show('reason') && reasonError ? (
            <FieldError msg={reasonError} />
          ) : (
            <div style={{ fontSize: 11, color: 'var(--app-text-muted)', marginTop: 6 }}>
              Minimum 20 characters
              {reason.trim().length > 0 && reason.trim().length < 20 && (
                <span style={{ color: 'var(--app-accent-light)', marginLeft: 6 }}>
                  {reason.trim().length}/20
                </span>
              )}
            </div>
          )}
        </div>

        {error && (
          <div
            style={{
              padding: '12px 16px',
              background: 'var(--app-red-dim)',
              border: '1px solid rgba(239,68,68,0.2)',
              borderRadius: 8,
              fontSize: 12,
              color: 'var(--app-red)',
            }}
          >
            {String(error).slice(0, 160)}
          </div>
        )}

        {!canSubmit && (
          <div
            style={{
              padding: '14px 16px',
              background: 'var(--app-elevated)',
              border: '1px solid var(--app-border)',
              borderRadius: 8,
              fontSize: 13,
              color: 'var(--app-text-muted)',
            }}
          >
            Connect your wallet to file a dispute.
          </div>
        )}

        <button
          className="app-btn-primary"
          onClick={handleSubmit}
          disabled={isPending || !canSubmit}
          style={{
            width: '100%',
            padding: '12px',
            opacity: isPending || !canSubmit ? 0.5 : 1,
            cursor: isPending || !canSubmit ? 'not-allowed' : 'pointer',
          }}
        >
          {isPending ? 'Submitting to AegisCourt…' : 'File Dispute'}
        </button>
      </div>
    </div>
  );
}
