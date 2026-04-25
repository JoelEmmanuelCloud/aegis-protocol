import { useState } from 'react';
import { useAttestations } from '../hooks/useAttestations';
import { useDemoMode } from '../hooks/useDemoMode';
import AgentSearch from '../components/AgentSearch';
import VerdictBadge from '../components/VerdictBadge';
import TxHashLink from '../components/TxHashLink';

export default function DecisionTimeline() {
  const [agentId, setAgentId] = useState<string | null>(null);
  const [cursor, setCursor] = useState<string | undefined>(undefined);
  const { enabled: demo } = useDemoMode();

  const { data, isLoading } = useAttestations(agentId, cursor, 20);
  const entries = data?.items ?? [];

  return (
    <div className="flex flex-col gap-6">
      <div>
        <div className="text-xl font-bold mb-1">Decision Timeline</div>
        <div className="text-[13px] text-aegis-muted">
          Paginated history of all attested decisions
        </div>
      </div>

      {!demo && (
        <AgentSearch
          onSearch={(id) => {
            setAgentId(id);
            setCursor(undefined);
          }}
        />
      )}

      <div className="bg-aegis-card border border-aegis-border rounded-xl overflow-hidden">
        <table className="w-full border-collapse">
          <thead>
            <tr>
              <th className="px-4 py-2.5 text-left text-xs text-aegis-muted font-semibold border-b border-aegis-border bg-black/20">
                Root Hash
              </th>
              <th className="px-4 py-2.5 text-left text-xs text-aegis-muted font-semibold border-b border-aegis-border bg-black/20">
                Verdict
              </th>
              <th className="px-4 py-2.5 text-left text-xs text-aegis-muted font-semibold border-b border-aegis-border bg-black/20">
                Timestamp
              </th>
            </tr>
          </thead>
          <tbody>
            {isLoading && (
              <tr>
                <td
                  colSpan={3}
                  className="px-4 py-3 text-[13px] border-b border-aegis-border text-center text-aegis-dim"
                >
                  Loading…
                </td>
              </tr>
            )}
            {!isLoading && entries.length === 0 && (
              <tr>
                <td
                  colSpan={3}
                  className="px-4 py-10 text-[13px] border-b border-aegis-border text-center text-aegis-dim"
                >
                  {agentId || demo
                    ? 'No decisions found'
                    : 'Select an agent to view their decision timeline'}
                </td>
              </tr>
            )}
            {entries.map((entry) => (
              <tr key={entry.rootHash} className="transition-colors duration-100">
                <td className="px-4 py-3 text-[13px] border-b border-aegis-border align-middle">
                  <TxHashLink hash={entry.rootHash} />
                </td>
                <td className="px-4 py-3 text-[13px] border-b border-aegis-border align-middle">
                  <VerdictBadge verdict={entry.verdict} />
                </td>
                <td className="px-4 py-3 text-[13px] border-b border-aegis-border align-middle text-aegis-muted">
                  {new Date(entry.timestamp).toLocaleString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {(data?.nextCursor || cursor) && (
        <div className="flex gap-2">
          {cursor && (
            <button
              onClick={() => setCursor(undefined)}
              className="px-4 py-2 bg-aegis-card border border-aegis-border rounded-lg text-aegis-text text-[13px] cursor-pointer"
            >
              Previous
            </button>
          )}
          {data?.nextCursor && (
            <button
              onClick={() => setCursor(data.nextCursor ?? undefined)}
              className="px-4 py-2 bg-aegis-purple border-0 rounded-lg text-white text-[13px] font-semibold cursor-pointer"
            >
              Load More
            </button>
          )}
        </div>
      )}
    </div>
  );
}
