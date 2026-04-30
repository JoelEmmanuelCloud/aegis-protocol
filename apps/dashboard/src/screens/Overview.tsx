import { useAccount } from 'wagmi';
import { useNetworkStats } from '../hooks/useNetworkStats';
import { useAttestations } from '../hooks/useAttestations';
import { useMyAgents } from '../hooks/useMyAgents';

const REGISTRY_ADDRESS = import.meta.env.VITE_AGENT_REGISTRY_ADDRESS as string | undefined;
const COURT_ADDRESS = import.meta.env.VITE_AEGIS_COURT_ADDRESS as string | undefined;
const EXPLORER_URL =
  (import.meta.env.VITE_0G_EXPLORER_URL as string | undefined) ?? 'https://chainscan-galileo.0g.ai';

function truncate(addr: string): string {
  return `${addr.slice(0, 10)}…${addr.slice(-6)}`;
}

function StatCard({
  label,
  value,
  sub,
  color = 'var(--app-accent)',
}: {
  label: string;
  value: string | number;
  sub?: string;
  color?: string;
}) {
  return (
    <div className="app-card" style={{ padding: '24px' }}>
      <div
        style={{
          fontSize: 11,
          color: 'var(--app-text-muted)',
          textTransform: 'uppercase',
          letterSpacing: '0.06em',
          marginBottom: 12,
        }}
      >
        {label}
      </div>
      <div
        style={{
          fontSize: 36,
          fontWeight: 800,
          letterSpacing: '-0.03em',
          color,
          lineHeight: 1,
          marginBottom: 6,
        }}
      >
        {value}
      </div>
      {sub && <div style={{ fontSize: 12, color: 'var(--app-text-muted)' }}>{sub}</div>}
    </div>
  );
}

function VerdictBadge({ verdict }: { verdict: string }) {
  if (verdict === 'CLEARED') return <span className="badge-cleared">Cleared</span>;
  if (verdict === 'FLAGGED') return <span className="badge-flagged">Flagged</span>;
  return <span className="badge-pending">Pending</span>;
}

export default function Overview() {
  const { address } = useAccount();
  const { data: stats } = useNetworkStats();
  const { data: attestations } = useAttestations();
  const { data: myAgents } = useMyAgents();

  const feed = (attestations?.items ?? []) as Array<{
    agentId: string;
    rootHash: string;
    verdict: string;
    timestamp: number;
  }>;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div>
        <h1 style={{ fontSize: 20, fontWeight: 700, letterSpacing: '-0.01em', marginBottom: 4 }}>
          Network Overview
        </h1>
        <p style={{ fontSize: 13, color: 'var(--app-text-muted)' }}>
          Live accountability metrics across the Aegis mesh
        </p>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
        <StatCard
          label="Total Attestations"
          value={(stats?.totalAttestations ?? 0).toLocaleString()}
          sub="decisions recorded"
        />
        <StatCard
          label="Active Agents"
          value={stats?.activeAgents ?? 0}
          sub="registered iNFTs"
          color="var(--green)"
        />
        <StatCard
          label="Disputes Filed"
          value={stats?.disputes ?? 0}
          sub="court cases opened"
          color="var(--red)"
        />
      </div>
      <div className="app-card">
        <div
          style={{
            padding: '16px 20px',
            borderBottom: '1px solid var(--app-border)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ fontWeight: 600, fontSize: 14 }}>Recent Attestations</div>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              fontSize: 12,
              color: 'var(--app-green)',
            }}
          >
            <span className="app-pulse-dot" />
            Live
          </div>
        </div>
        {feed.length === 0 ? (
          <div
            style={{
              padding: '48px 20px',
              textAlign: 'center',
              color: 'var(--app-text-muted)',
              fontSize: 13,
            }}
          >
            No attestations yet. Agents appear here as they submit decisions.
          </div>
        ) : (
          <div>
            {feed.slice(0, 8).map((a, i) => (
              <div
                key={i}
                style={{
                  padding: '14px 20px',
                  borderBottom:
                    i < Math.min(feed.length, 8) - 1 ? '1px solid var(--app-border)' : 'none',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 16,
                }}
              >
                <div
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: 8,
                    background: 'var(--accent-dim)',
                    border: '1px solid rgba(212,148,26,0.2)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                    fontSize: 11,
                    fontWeight: 700,
                    color: 'var(--app-accent-light)',
                  }}
                >
                  {a.agentId?.[0]?.toUpperCase() ?? 'A'}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div
                    style={{
                      fontSize: 13,
                      fontWeight: 600,
                      color: 'var(--app-text)',
                      marginBottom: 2,
                    }}
                  >
                    {a.agentId}
                  </div>
                  <div
                    style={{
                      fontSize: 11,
                      color: 'var(--app-text-muted)',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {a.rootHash}
                  </div>
                </div>
                <VerdictBadge verdict={a.verdict} />
                <div style={{ fontSize: 11, color: 'var(--app-text-muted)', flexShrink: 0 }}>
                  {new Date(a.timestamp).toLocaleTimeString()}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <div className="app-card" style={{ padding: '20px' }}>
          <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 16 }}>AXL Node Status</div>
          {['Witness :9002', 'Verifier :9012', 'Propagator :9022', 'Memory :9032'].map(
            (node, i) => (
              <div
                key={node}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '10px 0',
                  borderBottom: i < 3 ? '1px solid var(--app-border)' : 'none',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span className="app-pulse-dot" />
                  <span style={{ fontSize: 13 }}>{node}</span>
                </div>
                <span style={{ fontSize: 11, color: 'var(--app-green)', fontWeight: 600 }}>
                  Online
                </span>
              </div>
            )
          )}
        </div>
        <div className="app-card" style={{ padding: '20px' }}>
          <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 16 }}>Deployed Contracts</div>
          {[
            { label: 'AegisCourt.sol', addr: COURT_ADDRESS },
            { label: 'AgentRegistry.sol', addr: REGISTRY_ADDRESS },
          ].map(({ label, addr }, i) => (
            <div
              key={label}
              style={{
                padding: '10px 0',
                borderBottom: i === 0 ? '1px solid var(--app-border)' : 'none',
              }}
            >
              <div style={{ fontSize: 11, color: 'var(--app-text-muted)', marginBottom: 4 }}>
                {label}
              </div>
              <div style={{ fontSize: 12, fontFamily: 'monospace', color: 'var(--app-text-2)' }}>
                {addr ? truncate(addr) : '—'}
              </div>
            </div>
          ))}
          <div style={{ marginTop: 16 }}>
            <a
              href={EXPLORER_URL}
              target="_blank"
              rel="noopener noreferrer"
              style={{ fontSize: 12, color: 'var(--app-accent)' }}
            >
              View on 0G Explorer
            </a>
          </div>
        </div>
      </div>

      {address && (
        <div className="app-card" style={{ padding: '20px' }}>
          <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 16 }}>My Agents</div>
          {!myAgents || myAgents.length === 0 ? (
            <div style={{ fontSize: 13, color: 'var(--app-text-muted)', padding: '12px 0' }}>
              No agents registered to this wallet yet.
            </div>
          ) : (
            myAgents.map((agent, i) => (
              <div
                key={agent.tokenId}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 16,
                  padding: '12px 0',
                  borderBottom: i < myAgents.length - 1 ? '1px solid var(--app-border)' : 'none',
                }}
              >
                <div
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: 8,
                    background: 'var(--accent-dim)',
                    border: '1px solid rgba(212,148,26,0.2)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                    fontSize: 12,
                    fontWeight: 700,
                    color: 'var(--app-accent-light)',
                  }}
                >
                  {agent.ensName?.[0]?.toUpperCase() ?? 'A'}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div
                    style={{
                      fontSize: 13,
                      fontWeight: 600,
                      color: 'var(--app-text)',
                      marginBottom: 2,
                    }}
                  >
                    {agent.ensName}
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--app-text-muted)' }}>
                    Token #{agent.tokenId} · {agent.userPercent}% user / {agent.builderPercent}%
                    builder
                  </div>
                </div>
                <span className={agent.active ? 'badge-cleared' : 'badge-flagged'}>
                  {agent.active ? 'Active' : 'Suspended'}
                </span>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
