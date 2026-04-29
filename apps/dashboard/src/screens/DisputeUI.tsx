import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAccount } from 'wagmi';
import { useQuery } from '@tanstack/react-query';
import { useDispute } from '../hooks/useDispute';
import { useDisputeStatus } from '../hooks/useDisputeStatus';
import { useDemoMode } from '../context/DemoContext';
import { fetchDisputeList } from '../lib/orchestratorApi';
import type { DisputeRecord } from '@aegis/types';

type Tab = 'file' | 'history';

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

  const [tab, setTab] = useState<Tab>('file');
  const [rootHash, setRootHash] = useState('');
  const [agentId, setAgentId] = useState('');
  const [reason, setReason] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [touched, setTouched] = useState({ rootHash: false, agentId: false, reason: false });
  const [submitAttempted, setSubmitAttempted] = useState(false);

  useEffect(() => {
    const hash = searchParams.get('rootHash');
    const agent = searchParams.get('agentId');
    if (hash) setRootHash(hash);
    if (agent) setAgentId(agent);
  }, []);

  const { mutate: fileDispute, isPending, isSuccess, error } = useDispute();
  const { data: status } = useDisputeStatus(submitted ? rootHash : undefined);
  const { data: disputeList = [] } = useQuery<DisputeRecord[]>({
    queryKey: ['disputeList'],
    queryFn: fetchDisputeList,
    refetchInterval: 5000,
  });

  const rootHashError = (() => {
    if (!rootHash.trim()) return 'Root hash is required';
    if (!/^(0x)?[0-9a-fA-F]{8,}$/.test(rootHash.trim())) return 'Must be a valid hex hash';
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
      {
        onSuccess: () => {
          setSubmitted(true);
          setTab('history');
        },
      }
    );
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div>
        <h1 style={{ fontSize: 20, fontWeight: 700, letterSpacing: '-0.01em', marginBottom: 4 }}>
          Disputes
        </h1>
        <p style={{ fontSize: 13, color: 'var(--app-text-muted)' }}>
          Challenge an agent decision. The Verifier replays it via 0G Compute TEE.
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
          { icon: '⬡', label: 'On-chain Enforcement', desc: 'Disputes submitted to AegisCourt.sol on 0G — immutable, permissionless' },
          { icon: '🔒', label: 'TEE Verification', desc: 'Verifier node replays decisions inside 0G Compute trusted execution environment' },
          { icon: '🪪', label: 'ENS Identity', desc: 'Every agent has a verified .aegis.eth on-chain identity that cannot be impersonated' },
        ].map(({ icon, label, desc }) => (
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
            <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--app-text)', display: 'flex', alignItems: 'center', gap: 6 }}>
              <span>{icon}</span>{label}
            </div>
            <div style={{ fontSize: 11, color: 'var(--app-text-muted)', lineHeight: 1.5 }}>{desc}</div>
          </div>
        ))}
      </div>

      <div
        style={{
          display: 'flex',
          gap: 2,
          background: 'var(--app-elevated)',
          borderRadius: 10,
          padding: 4,
          width: 'fit-content',
        }}
      >
        {(['file', 'history'] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            style={{
              padding: '7px 20px',
              borderRadius: 7,
              border: 'none',
              cursor: 'pointer',
              fontSize: 13,
              fontWeight: 600,
              transition: 'background 0.15s, color 0.15s, box-shadow 0.15s',
              background: tab === t ? 'var(--app-accent)' : 'transparent',
              color: tab === t ? '#fff' : 'var(--app-text-muted)',
              boxShadow: tab === t ? '0 1px 6px rgba(99,102,241,0.35)' : 'none',
            }}
          >
            {t === 'file' ? 'File Dispute' : `History${disputeList.length > 0 ? ` (${disputeList.length})` : ''}`}
          </button>
        ))}
      </div>

      {tab === 'file' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
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
      )}

      {tab === 'history' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {disputeList.length === 0 ? (
            <div
              className="app-card"
              style={{
                padding: '64px',
                textAlign: 'center',
                color: 'var(--app-text-muted)',
                fontSize: 13,
              }}
            >
              No disputes filed yet
            </div>
          ) : (
            disputeList.map((d) => {
              const vcolor =
                d.verdict === 'CLEARED'
                  ? 'var(--app-green)'
                  : d.verdict === 'FLAGGED'
                    ? 'var(--app-red)'
                    : 'var(--app-yellow)';
              return (
                <div
                  key={d.rootHash + (d.timestamp ?? 0)}
                  className="app-card"
                  style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 10 }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: 12, fontFamily: 'monospace', color: 'var(--app-text-muted)' }}>
                      {d.rootHash.slice(0, 16)}…
                    </span>
                    <span
                      style={{
                        fontSize: 11,
                        fontWeight: 700,
                        color: vcolor,
                        textTransform: 'uppercase',
                        background: `${vcolor}18`,
                        padding: '2px 8px',
                        borderRadius: 4,
                      }}
                    >
                      {d.verdict}
                    </span>
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--app-text-2)', fontFamily: 'monospace' }}>
                    {d.agentId}
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--app-text)' }}>{d.reason}</div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 6 }}>
                    <span style={{ fontSize: 11, color: 'var(--app-text-muted)' }}>
                      {new Date((d.timestamp as number) ?? 0).toLocaleString()}
                    </span>
                    {(d as DisputeRecord & { explorerUrl?: string; submitTxHash?: string; recordTxHash?: string }).explorerUrl ? (
                      <a
                        href={(d as DisputeRecord & { explorerUrl?: string }).explorerUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                          fontSize: 11,
                          color: 'var(--app-accent)',
                          fontFamily: 'monospace',
                          display: 'flex',
                          alignItems: 'center',
                          gap: 4,
                          textDecoration: 'none',
                        }}
                      >
                        ⬡ Verify on-chain
                      </a>
                    ) : (
                      <span style={{ fontSize: 11, color: 'var(--app-text-muted)' }}>
                        Pending on-chain confirmation
                      </span>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}
