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

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div>
        <h1 style={{ fontSize: 20, fontWeight: 700, letterSpacing: '-0.01em', marginBottom: 4 }}>File Dispute</h1>
        <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>Challenge an agent decision. The verifier replays it via 0G Compute TEE.</p>
      </div>

      {isSuccess && status && (
        <div style={{ padding: '20px', background: status.verdict === 'CLEARED' ? 'var(--green-dim)' : status.verdict === 'FLAGGED' ? 'var(--red-dim)' : 'var(--yellow-dim)', border: `1px solid ${status.verdict === 'CLEARED' ? 'rgba(34,197,94,0.2)' : status.verdict === 'FLAGGED' ? 'rgba(239,68,68,0.2)' : 'rgba(234,179,8,0.2)'}`, borderRadius: 10 }}>
          <div style={{ fontWeight: 700, fontSize: 16, color: status.verdict === 'CLEARED' ? 'var(--green)' : status.verdict === 'FLAGGED' ? 'var(--red)' : 'var(--yellow)', marginBottom: 8 }}>Verdict: {status.verdict}</div>
          {status.teeProof && <div style={{ fontSize: 11, fontFamily: 'monospace', color: 'var(--text-muted)', wordBreak: 'break-all' }}>TEE Proof: {status.teeProof.slice(0, 80)}…</div>}
        </div>
      )}

      <div className="card" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: 18 }}>
        <div>
          <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: 8 }}>Root Hash</label>
          <input className="input" style={{ fontFamily: 'monospace' }} placeholder="0xabc123..." value={rootHash} onChange={(e) => setRootHash(e.target.value)} />
        </div>
        <div>
          <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: 8 }}>Agent ENS Name</label>
          <input className="input" placeholder="trading-bot.aegis.eth" value={agentId} onChange={(e) => setAgentId(e.target.value)} />
        </div>
        <div>
          <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)'
