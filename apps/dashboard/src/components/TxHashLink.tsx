export default function TxHashLink({ hash }: { hash: string }) {
  const explorer = import.meta.env.VITE_0G_EXPLORER_URL ?? 'https://chainscan-galileo.0g.ai';
  const truncated = hash.length > 12 ? `${hash.slice(0, 8)}…${hash.slice(-6)}` : hash;

  return (
    <a
      href={`${explorer}/tx/${hash}`}
      target="_blank"
      rel="noopener noreferrer"
      className="text-aegis-purple-light text-xs font-mono"
    >
      {truncated}
    </a>
  );
}
