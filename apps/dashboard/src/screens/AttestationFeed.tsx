import { useState } from 'react';
import { useAttestations } from '../hooks/useAttestations';
import { useDemoMode } from '../hooks/useDemoMode';
import AgentSearch from '../components/AgentSearch';
import AttestationCard from '../components/AttestationCard';

export default function AttestationFeed() {
  const [agentId, setAgentId] = useState<string | null>(null);
  const { enabled: demo } = useDemoMode();

  const { data, isLoading, isFetching } = useAttestations(agentId);
  const entries = data?.items ?? [];

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-start justify-between">
        <div>
          <div className="text-xl font-bold mb-1">Attestation Feed</div>
          <div className="text-[13px] text-aegis-muted">
            Live decision stream — refreshes every 5 seconds
          </div>
        </div>
        {isFetching && !isLoading && <div className="text-xs text-aegis-dim pt-1">Refreshing…</div>}
      </div>

      {!demo && <AgentSearch onSearch={setAgentId} />}

      <div className="bg-aegis-card border border-aegis-border rounded-xl overflow-hidden">
        <div className="px-4 py-3.5 border-b border-aegis-border flex items-center justify-between">
          <div className="text-sm font-semibold">
            {demo ? 'demo-alpha.aegis.eth' : (agentId ?? 'No agent selected')}
          </div>
          <div
            className={`w-2 h-2 rounded-full ${agentId || demo ? 'bg-aegis-green' : 'bg-aegis-dim'}`}
          />
        </div>

        {isLoading && <div className="p-8 text-center text-aegis-dim text-[13px]">Loading…</div>}

        {!isLoading && entries.length === 0 && (
          <div className="p-12 text-center text-aegis-dim text-[13px]">
            {demo || agentId
              ? 'No attestations found'
              : 'Select an agent to see their live attestation feed'}
          </div>
        )}

        {entries.map((entry) => (
          <AttestationCard
            key={entry.rootHash}
            entry={entry}
            agentId={demo ? 'demo-alpha.aegis.eth' : (agentId ?? undefined)}
          />
        ))}
      </div>
    </div>
  );
}
