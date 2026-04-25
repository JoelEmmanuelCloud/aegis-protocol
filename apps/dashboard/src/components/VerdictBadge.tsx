import type { Verdict } from '@aegis/types';

const config: Record<Verdict, { className: string; label: string }> = {
  CLEARED: { className: 'bg-aegis-green-dim text-aegis-green', label: 'Cleared' },
  FLAGGED: { className: 'bg-aegis-red-dim text-aegis-red', label: 'Flagged' },
  PENDING: { className: 'bg-[rgba(107,114,128,0.15)] text-aegis-muted', label: 'Pending' },
};

export default function VerdictBadge({ verdict }: { verdict: Verdict }) {
  const { className, label } = config[verdict];
  return (
    <span
      className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold tracking-wide ${className}`}
    >
      {label}
    </span>
  );
}
