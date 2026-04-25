import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { useNetworkStats } from '../hooks/useNetworkStats';
import { useDemoMode } from '../hooks/useDemoMode';
import { demoNetworkStats, demoChartData, demoAttestationEntries } from '../lib/demoData';
import AttestationCard from '../components/AttestationCard';

interface StatCardProps {
  label: string;
  value: number | string;
  sub?: string;
  accentClass?: string;
}

function StatCard({ label, value, sub, accentClass = 'text-aegis-purple-light' }: StatCardProps) {
  return (
    <div className="bg-aegis-card border border-aegis-border rounded-xl px-6 py-5">
      <div className="text-[13px] text-aegis-muted mb-2">{label}</div>
      <div className={`text-[32px] font-bold leading-none ${accentClass}`}>{value}</div>
      {sub && <div className="text-xs text-aegis-dim mt-1.5">{sub}</div>}
    </div>
  );
}

export default function Overview() {
  const { enabled: demo } = useDemoMode();
  const { data: liveStats } = useNetworkStats();
  const stats = demo ? demoNetworkStats : liveStats;
  const chartData = demo ? demoChartData : [];

  return (
    <div className="flex flex-col gap-6 h-full">
      <div>
        <div className="text-xl font-bold mb-1">Dashboard</div>
        <div className="text-[13px] text-aegis-muted">Aegis Protocol — AI agent accountability layer</div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <StatCard
          label="Total Attestations"
          value={stats?.totalAttestations ?? '—'}
          sub="decisions recorded on 0G Storage"
          accentClass="text-aegis-purple-light"
        />
        <StatCard
          label="Active Agents"
          value={stats?.activeAgents ?? '—'}
          sub="registered via AgentRegistry"
          accentClass="text-aegis-green"
        />
        <StatCard
          label="Disputes Filed"
          value={stats?.disputes ?? '—'}
          sub="verified by TEE replay"
          accentClass="text-aegis-amber"
        />
      </div>

      <div className="grid grid-cols-[1fr_340px] gap-4 flex-1 min-h-0">
        <div className="bg-aegis-card border border-aegis-border rounded-xl p-6 flex flex-col gap-4 min-h-0">
          <div>
            <div className="text-[15px] font-semibold">Decision Activity</div>
            <div className="text-xs text-aegis-muted">Last 7 days</div>
          </div>

          {chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-aegis-border-solid)" />
                <XAxis
                  dataKey="date"
                  tick={{ fill: 'var(--color-aegis-muted)', fontSize: 12 }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fill: 'var(--color-aegis-muted)', fontSize: 12 }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip
                  contentStyle={{
                    background: 'var(--color-aegis-card)',
                    border: '1px solid var(--color-aegis-border)',
                    borderRadius: 8,
                    color: 'var(--color-aegis-text)',
                    fontSize: 13,
                  }}
                />
                <Legend wrapperStyle={{ fontSize: 12, color: 'var(--color-aegis-muted)' }} />
                <Line
                  type="monotone"
                  dataKey="cleared"
                  stroke="var(--color-aegis-green)"
                  strokeWidth={2}
                  dot={false}
                  name="Cleared"
                />
                <Line
                  type="monotone"
                  dataKey="flagged"
                  stroke="var(--color-aegis-red)"
                  strokeWidth={2}
                  dot={false}
                  name="Flagged"
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex-1 flex items-center justify-center text-aegis-dim text-[13px] border border-dashed border-aegis-border-solid rounded-lg">
              Enable Demo Mode or submit attestations to see activity
            </div>
          )}
        </div>

        <div className="bg-aegis-card border border-aegis-border rounded-xl overflow-hidden flex flex-col min-h-0">
          <div className="px-4 py-3 border-b border-aegis-border">
            <div className="text-[15px] font-semibold">Recent Attestations</div>
          </div>
          <div className="flex-1 overflow-y-auto">
            {demo ? (
              demoAttestationEntries.slice(0, 6).map((entry) => (
                <AttestationCard key={entry.rootHash} entry={entry} agentId="demo-alpha.aegis.eth" />
              ))
            ) : (
              <div className="p-6 text-aegis-dim text-[13px] text-center">
                Search for an agent in Attestations to see live feed
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
