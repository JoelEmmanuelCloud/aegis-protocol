import { useState } from 'react';
import { useAccount, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';

const REGISTRY_ABI = [
  {
    name: 'mint',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'agentOwner', type: 'address' },
      { name: 'builderAddress', type: 'address' },
      { name: 'label', type: 'string' },
      { name: 'userPercent', type: 'uint8' },
      { name: 'builderPercent', type: 'uint8' },
    ],
    outputs: [{ name: 'tokenId', type: 'uint256' }],
  },
] as const;

const REGISTRY = (import.meta.env.VITE_AGENT_REGISTRY_ADDRESS ?? '0x0') as `0x${string}`;

function isValidEthAddress(val: string): boolean {
  return /^0x[0-9a-fA-F]{40}$/.test(val);
}

function FieldError({ msg }: { msg: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginTop: 5 }}>
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="var(--app-red)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
        <circle cx="12" cy="12" r="10" />
        <line x1="12" y1="8" x2="12" y2="12" />
        <line x1="12" y1="16" x2="12.01" y2="16" />
      </svg>
      <span style={{ fontSize: 11, color: 'var(--app-red)' }}>{msg}</span>
    </div>
  );
}

export default function Register() {
  const { address } = useAccount();
  const [label, setLabel] = useState('');
  const [builder, setBuilder] = useState('');
  const [userPct, setUserPct] = useState(60);
  const [touched, setTouched] = useState({ label: false, builder: false });
  const [submitAttempted, setSubmitAttempted] = useState(false);
  const { writeContract, data: txHash, isPending, error } = useWriteContract();
  const { isSuccess, isLoading: confirming } = useWaitForTransactionReceipt({ hash: txHash });

  const labelError = (() => {
    if (!label.trim()) return 'Agent label is required';
    if (label.length < 3) return 'Label must be at least 3 characters';
    if (!/^[a-z0-9-]+$/.test(label)) return 'Only lowercase letters, numbers, and hyphens';
    if (label.startsWith('-') || label.endsWith('-')) return 'Label cannot start or end with a hyphen';
    return '';
  })();

  const builderError = (() => {
    if (!builder.trim()) return '';
    if (!isValidEthAddress(builder)) return 'Must be a valid Ethereum address (0x + 40 hex chars)';
    return '';
  })();

  const showLabelError = (touched.label || submitAttempted) && !!labelError;
  const showBuilderError = (touched.builder || submitAttempted) && !!builderError;
  const formValid = !labelError && !builderError;

  const touch = (field: keyof typeof touched) =>
    setTouched((prev) => ({ ...prev, [field]: true }));

  const handleMint = () => {
    setSubmitAttempted(true);
    setTouched({ label: true, builder: true });
    if (!address || !formValid) return;
    writeContract({
      address: REGISTRY,
      abi: REGISTRY_ABI,
      functionName: 'mint',
      args: [address, (builder as `0x${string}`) || address, label, userPct, 100 - userPct],
    });
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24, maxWidth: 560 }}>
      <div>
        <h1 style={{ fontSize: 20, fontWeight: 700, letterSpacing: '-0.01em', marginBottom: 4 }}>
          Register Agent
        </h1>
        <p style={{ fontSize: 13, color: 'var(--app-text-muted)' }}>
          Mint an iNFT and auto-issue an ENS subname under aegis.eth
        </p>
      </div>

      {isSuccess && (
        <div
          style={{
            padding: '16px 20px',
            background: 'var(--app-green-dim)',
            border: '1px solid rgba(34,197,94,0.2)',
            borderRadius: 10,
          }}
        >
          <div style={{ fontWeight: 600, color: 'var(--app-green)', marginBottom: 4 }}>
            Agent registered
          </div>
          <div style={{ fontSize: 12, color: 'var(--app-text-2)', fontFamily: 'monospace' }}>
            {label}.aegis.eth issued
          </div>
        </div>
      )}

      <div
        className="app-card"
        style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: 20 }}
      >
        <div>
          <label
            style={{
              fontSize: 12,
              fontWeight: 600,
              color: 'var(--app-text-2)',
              display: 'block',
              marginBottom: 8,
            }}
          >
            ENS Label <span style={{ color: 'var(--app-red)', marginLeft: 2 }}>*</span>
          </label>
          <div style={{ display: 'flex', alignItems: 'center', gap: 0 }}>
            <input
              className="app-input"
              style={{
                borderRadius: '8px 0 0 8px',
                borderRight: 'none',
                borderColor: showLabelError ? 'var(--app-red)' : undefined,
              }}
              placeholder="trading-bot"
              value={label}
              onChange={(e) => setLabel(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
              onBlur={() => touch('label')}
            />
            <div
              style={{
                padding: '0 14px',
                background: 'var(--app-elevated)',
                border: `1px solid ${showLabelError ? 'var(--app-red)' : 'var(--border-bright)'}`,
                borderRadius: '0 8px 8px 0',
                fontSize: 13,
                color: 'var(--app-text-muted)',
                whiteSpace: 'nowrap',
                flexShrink: 0,
                alignSelf: 'stretch',
                display: 'flex',
                alignItems: 'center',
              }}
            >
              .aegis.eth
            </div>
          </div>
          {showLabelError
            ? <FieldError msg={labelError} />
            : <div style={{ fontSize: 11, color: 'var(--app-text-muted)', marginTop: 6 }}>Lowercase letters, numbers, and hyphens only</div>
          }
        </div>

        <div>
          <label
            style={{
              fontSize: 12,
              fontWeight: 600,
              color: 'var(--app-text-2)',
              display: 'block',
              marginBottom: 8,
            }}
          >
            Builder Address{' '}
            <span style={{ color: 'var(--app-text-muted)', fontWeight: 400 }}>(optional)</span>
          </label>
          <input
            className="app-input"
            style={{ borderColor: showBuilderError ? 'var(--app-red)' : undefined }}
            placeholder={address ?? '0x...'}
            value={builder}
            onChange={(e) => setBuilder(e.target.value)}
            onBlur={() => touch('builder')}
          />
          {showBuilderError
            ? <FieldError msg={builderError} />
            : <div style={{ fontSize: 11, color: 'var(--app-text-muted)', marginTop: 6 }}>Leave blank to use your connected wallet</div>
          }
        </div>

        <div>
          <label
            style={{
              fontSize: 12,
              fontWeight: 600,
              color: 'var(--app-text-2)',
              display: 'block',
              marginBottom: 12,
            }}
          >
            Accountability Split
          </label>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
            <span style={{ fontSize: 13, color: 'var(--app-text)' }}>
              User <strong style={{ color: 'var(--app-accent-light)' }}>{userPct}%</strong>
            </span>
            <span style={{ fontSize: 13, color: 'var(--app-text)' }}>
              Builder <strong>{100 - userPct}%</strong>
            </span>
          </div>
          <input
            type="range"
            min={0}
            max={100}
            value={userPct}
            onChange={(e) => setUserPct(Number(e.target.value))}
            style={{ width: '100%', accentColor: 'var(--app-accent)', cursor: 'pointer' }}
          />
          <div style={{ fontSize: 11, color: 'var(--app-text-muted)', marginTop: 6 }}>
            Encoded permanently in the iNFT contract at mint time
          </div>
        </div>

        <div
          style={{
            padding: '14px 16px',
            background: 'var(--app-elevated)',
            borderRadius: 8,
            border: '1px solid var(--app-border)',
          }}
        >
          <div style={{ fontSize: 11, color: 'var(--app-text-muted)', marginBottom: 8 }}>
            Preview
          </div>
          <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--app-text)' }}>
            {label || 'your-agent'}.aegis.eth
          </div>
          <div style={{ fontSize: 12, color: 'var(--app-text-muted)', marginTop: 4 }}>
            Owner: {address?.slice(0, 10)}…
          </div>
        </div>

        {error && (
          <div
            style={{
              padding: '12px 16px',
              background: 'var(--app-red-dim)',
              border: '1px solid rgba(239,68,68,0.2)',
              borderRadius: 8,
              fontSize: 12,
              color: 'var(--app-red)',
            }}
          >
            {error.message.slice(0, 160)}
          </div>
        )}

        <button
          className="app-btn-primary"
          onClick={handleMint}
          disabled={isPending || confirming}
          style={{
            width: '100%',
            padding: '12px',
            opacity: isPending || confirming ? 0.5 : 1,
            cursor: isPending || confirming ? 'not-allowed' : 'pointer',
          }}
        >
          {isPending ? 'Confirm in wallet…' : confirming ? 'Confirming on-chain…' : 'Mint iNFT'}
        </button>
      </div>
    </div>
  );
}
