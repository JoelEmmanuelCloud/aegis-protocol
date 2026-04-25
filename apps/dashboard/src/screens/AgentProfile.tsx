import { useState } from 'react';
import { useReadContracts } from 'wagmi';
import { namehash } from 'viem';
import { useAgent } from '../hooks/useAgent';
import { useDemoMode } from '../hooks/useDemoMode';
import { demoAgents, demoReputation, demoEnsRecords } from '../lib/demoData';
import AgentSearch from '../components/AgentSearch';
import ReputationScore from '../components/ReputationScore';

const PUBLIC_RESOLVER_ABI = [
  {
    name: 'text',
    type: 'function' as const,
    stateMutability: 'view' as const,
    inputs: [
      { name: 'node', type: 'bytes32' },
      { name: 'key', type: 'string' },
    ],
    outputs: [{ type: 'string' }],
  },
] as const;

const ENS_TEXT_KEYS = [
  'aegis.reputation',
  'aegis.totalDecisions',
  'aegis.lastVerdict',
  'aegis.flaggedCount',
  'aegis.storageIndex',
  'agent.registry',
  'agent.id',
];

const resolverAddress = import.meta.env.VITE_PUBLIC_RESOLVER_ADDRESS as `0x${string}`;

function Row({ label, value }: { label: string; value?: string }) {
  return (
    <div className="flex justify-between items-center py-2.5 border-b border-aegis-border gap-4">
      <span className="text-[13px] text-aegis-muted shrink-0">{label}</span>
      <span className="text-[13px] text-aegis-text font-mono truncate">{value ?? '—'}</span>
    </div>
  );
}

export default function AgentProfile() {
  const [label, setLabel] = useState<string | null>(null);
  const { enabled: demo } = useDemoMode();

  const ensName = label ?? (demo ? demoAgents[0].ensName : null);
  const agentLabel = ensName ? ensName.replace('.aegis.eth', '') : null;

  const { data: agent, isLoading: agentLoading } = useAgent(agentLabel);
  const displayAgent = demo ? demoAgents[0] : agent;

  const { data: ensData } = useReadContracts({
    contracts: ENS_TEXT_KEYS.map((key) => ({
      address: resolverAddress,
      abi: PUBLIC_RESOLVER_ABI,
      functionName: 'text' as const,
      args: [namehash(ensName ?? ''), key] as [`0x${string}`, string],
      chainId: 16602,
    })),
    query: { enabled: !demo && !!ensName && !!resolverAddress },
  });

  const ensRecords: Record<string, string> = demo
    ? demoEnsRecords
    : ENS_TEXT_KEYS.reduce(
        (acc, key, i) => {
          const val = ensData?.[i]?.result;
          if (typeof val === 'string') acc[key] = val;
          return acc;
        },
        {} as Record<string, string>,
      );

  const score = parseInt(ensRecords['aegis.reputation'] ?? '0', 10);

  const handleSearch = (name: string) => {
    setLabel(name.replace('.aegis.eth', ''));
  };

  return (
    <div className="flex flex-col gap-6">
      <div>
        <div className="text-xl font-bold mb-1">Agent Profile</div>
        <div className="text-[13px] text-aegis-muted">ENS identity and reputation for any registered agent</div>
      </div>

      <AgentSearch onSearch={handleSearch} />

      {agentLoading && !demo && (
        <div className="text-aegis-muted text-[13px]">Loading…</div>
      )}

      {(displayAgent || demo) && (
        <div className="grid grid-cols-[280px_1fr] gap-4">
          <div className="flex flex-col gap-4">
            <div className="bg-aegis-card border border-aegis-border rounded-xl px-6 py-5 flex flex-col items-center gap-3">
              <ReputationScore score={demo ? demoReputation.score : score} />
              <div className="text-center">
                <div className="font-semibold text-sm">{displayAgent?.ensName ?? ensName}</div>
                <div className="text-xs text-aegis-muted mt-0.5">Token #{displayAgent?.tokenId ?? '—'}</div>
              </div>
              <span
                className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                  displayAgent?.active
                    ? 'bg-aegis-green-dim text-aegis-green'
                    : 'bg-aegis-red-dim text-aegis-red'
                }`}
              >
                {displayAgent?.active ? 'Active' : 'Suspended'}
              </span>
            </div>

            <div className="bg-aegis-card border border-aegis-border rounded-xl px-6 py-5">
              <div className="text-[13px] font-semibold mb-3">Split</div>
              <div className="flex justify-between text-[13px] mb-1.5">
                <span className="text-aegis-muted">User</span>
                <span className="text-aegis-purple-light font-semibold">{displayAgent?.userPercent ?? '—'}%</span>
              </div>
              <div className="flex justify-between text-[13px]">
                <span className="text-aegis-muted">Builder</span>
                <span className="text-aegis-text font-semibold">{displayAgent?.builderPercent ?? '—'}%</span>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-4">
            <div className="bg-aegis-card border border-aegis-border rounded-xl px-6 py-5">
              <div className="text-[13px] font-semibold mb-1">Agent Record</div>
              <Row label="Builder" value={displayAgent?.builderAddress} />
              <Row label="Storage Root" value={displayAgent?.storageRoot} />
              <Row
                label="Registered"
                value={
                  displayAgent?.mintedAt
                    ? new Date(displayAgent.mintedAt).toLocaleDateString()
                    : undefined
                }
              />
            </div>

            <div className="bg-aegis-card border border-aegis-border rounded-xl px-6 py-5">
              <div className="text-[13px] font-semibold mb-1">ENS Text Records</div>
              {ENS_TEXT_KEYS.map((key) => (
                <Row key={key} label={key} value={ensRecords[key]} />
              ))}
            </div>
          </div>
        </div>
      )}

      {!displayAgent && !agentLoading && !demo && (
        <div className="bg-aegis-card border border-aegis-border rounded-xl p-12 text-center text-aegis-dim text-[13px]">
          Search for an agent label or full ENS name to view their profile
        </div>
      )}
    </div>
  );
}
