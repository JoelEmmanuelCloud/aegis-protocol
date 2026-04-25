import type { AgentHistoryEntry } from '@aegis/types';
import VerdictBadge from './VerdictBadge';
import TxHashLink from './TxHashLink';

interface Props {
  entry: AgentHistoryEntry;
  agentId?: string;
}

export default function AttestationCard({ entry, agentId }: Props) {
  const time = new Date(entry.timestamp).toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <div className="px-4 py-3 border-b border-aegis-border flex items-center justify-between gap-3">
      <div className="flex flex-col gap-1 min-w-0">
        {agentId && (
          <div className="text-[13px] font-semibold text-aegis-purple-light truncate">{agentId}</div>
        )}
        <TxHashLink hash={entry.rootHash} />
      </div>
      <div className="flex flex-col items-end gap-1 shrink-0">
        <VerdictBadge verdict={entry.verdict} />
        <div className="text-[11px] text-aegis-dim">{time}</div>
      </div>
    </div>
  );
}
