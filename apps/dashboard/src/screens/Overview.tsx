import { useNetworkStats } from '../hooks/useNetworkStats';
import { useAttestations } from '../hooks/useAttestations';
import { useDemoMode } from '../hooks/useDemoMode';
import { demoStats, demoAttestations } from '../lib/demoData';

function StatCard({ label, value, sub, color = 'var(--accent)' }: { label: string; value: string | number; sub?: string; color?: string }) {
  return (
    <div className="card" style={{ padding: '24px' }}>
      <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 12 }}>{label}</div>
      <div style={{ fontSize: 36, fontWeight: 800, letterSpacing: '-0.03em', color, lineHeight: 1, marginBottom: 6 }}>{value}</div>
      {sub && <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{sub}</div>}
    </div>
  );
}

function VerdictBadge({ verdict }: { verdict: string }) {
  if (verdict === 'CLEARED') return <span className="badge-cleared">Cleared</span>;
  if (verdict === 'FLAGGED') return <span className="badge-flagged">Flagged</span>;
  return <span className="badge-pending">Pending</span>;
}

export default function Overview() {
  const { enabled: demo } = useDemoMode();
  const { data: stats } = useNetworkStats();
  const { data: attestations } = useAttestations();

  const s = demo ? demoStats : stats;
  const feed = (demo ? demoAttestations : (attestations ?? [])) as Array<{ agentId: string; rootHash: string; verdict: string; timestamp: number }>;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div>
        <h1 style={{ fontSize: 20, fontWeight: 700, letterSpacing: '-0.01em', marginBottom: 4 }}>Network Overview</h1>
        <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>Live accountability metrics across the Aegis mesh</p>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
        <StatCard label="Total Attestations" value={(s?.totalAttestations ?? 0).toLocaleString()} sub="decisions recorded" />
        <StatCard label="Active Agents" value={s?.activeAgents ?? 0} sub="registered iNFTs" color="var(--green)" />
        <StatCard label="Disputes Filed" value={s?.disputes ?? 0} sub="court cases opened" color="var(--red)" />
      </div>
      <div className="card">
        <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ fontWeight: 600, fontSize: 14 }}>Recent Attestations</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--green)' }}><span className="pulse-dot" />Live</div>
        </div>
        {feed.length === 0 ? (
          <div style={{ padding: '48px 20px', textAlign: 'center', color: 'var(--text-muted)', fontSize: 13 }}>No attestations yet. Agents appear here as they submit decisions.</div>
        ) : (
          <div>{feed.slice(0, 8).map((a, i) => (
            <div key={i} style={{ padding: '14px 20px', borderBottom: i < Math.min(feed.length, 8) - 1 ? '1px solid var(--border)' : 'none', display: 'flex', alignItems: 'center', gap: 16 }}>
              <div style={{ width: 32, height: 32, borderRadius: 8, background: 'var(--accent-dim)', border: '1px solid rgba(124,58,237,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: 11, fontWeight: 700, color: '#a78bfa' }}>{a.agentId?.[0]?.toUpperCase() ?? 'A'}</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 2 }}>{a.agentId}</div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{a.rootHash}</div>
              </div>
              <VerdictBadge verdict={a.verdict} />
              <div style={{ fontSize: 11, color: 'var(--text-muted)', flexShrink: 0 }}>{new Date(a.timestamp).toLocaleTimeString()}</div>
            </div>
          ))}</div>
        )}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <div className="card" style={{ padding: '20px' }}>
          <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 16 }}>AXL Node Status</div>
          {['Witness :9002', 'Verifier :9012', 'Propagator :9022', 'Memory :9032'].map((node, i) => (
            <div key={node} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 0', borderBottom: i < 3 ? '1px solid var(--border)' : 'none' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}><span className="pulse-dot" /><span style={{ fontSize: 13 }}>{node}</span></div>
              <span style={{ fontSize: 11, color: 'var(--green)', fontWeight: 600 }}>Online</span>
            </div>
          ))}
        </div>
        <div className="card" style={{ padding: '20px' }}>
          <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 16 }}>Deployed Contracts</div>
          {[{ label: 'AegisCourt.sol', addr: '0x3De27365…0F734a' }, { label: 'AgentRegistry.sol', addr: '0x65cB34BC…a22bbc' }].map(({ label, addr }, i) => (
            <div key={label} style={{ padding: '10px 0', borderBottom: i === 0 ? '1px solid var(--border)' : 'none' }}>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 4 }}>{label}</div>
              <div style={{ fontSize: 12, fontFamily: 'monospace', color: 'var(--text-secondary)' }}>{addr}</div>
            </div>
          ))}
          <div style={{ marginTop: 16 }}><a href="https://chainscan-galileo.0g.ai" target="_blank" rel="noopener noreferrer" style={{ fontSize: 12, color: 'var(--accent)' }}>View on 0G Explorer</a></div>
        </div>
      </div>
    </div>
  );
}
