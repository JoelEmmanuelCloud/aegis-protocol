import { useState } from 'react';

export default function AgentSearch({ onSearch }: { onSearch: (ensName: string) => void }) {
  const [value, setValue] = useState('');

  const normalised = value.trim();
  const preview = normalised && !normalised.includes('.') ? `${normalised}.aegis.eth` : normalised;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (preview) onSearch(preview);
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-1.5">
      <div className="flex gap-2">
        <input
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="Enter ENS label or full name (e.g. trading-bot)"
          className="flex-1 px-3.5 py-2.5 bg-aegis-base border border-aegis-border-solid rounded-lg text-aegis-text text-sm outline-none"
        />
        <button
          type="submit"
          disabled={!preview}
          className={`px-5 py-2.5 rounded-lg text-sm font-semibold border-0 transition-colors ${
            preview
              ? 'bg-aegis-purple text-white cursor-pointer'
              : 'bg-aegis-card text-aegis-dim cursor-default'
          }`}
        >
          Search
        </button>
      </div>
      {normalised && !normalised.includes('.') && (
        <div className="text-xs text-aegis-muted">
          Searching: <span className="text-aegis-purple-light">{preview}</span>
        </div>
      )}
    </form>
  );
}
