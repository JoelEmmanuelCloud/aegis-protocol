import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { useAccount } from 'wagmi';
import { registerAgent } from '../lib/orchestratorApi';
import { useDemoMode } from '../context/DemoContext';

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
  const { isDemoMode } = useDemoMode();
  const [label, setLabel] = useState('');
  const [builder, setBuilder] = useState('');
  const [userPct, setUserPct] = useState(60);
  const [touched, setTouched] = useState({ label: false, builder: false });
  const [submitAttempted, setSubmitAttempted] = useState(false);

  const { mutate, isPending, isSuccess, error, data, reset } = useMutation({
    mutationFn: (vars: {
      agentOwner: string;
      builderAddress: string;
      label: string;
      userPercent: number;
      builderPercent: number;
    }) =>
      isDemoMode
        ? Promise.resolve({
            tokenId: String(Math.floor(Math.random() * 900) + 43),
            ensName: `${vars.label}.aegis.eth`,
            txHash: '0x' + Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join(''),
          })
        : registerAgent(vars),
  });

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
    if (!isDemoMode && !address) return;
    if (!formValid) return;
    reset();
    mutate({
      agentOwner: address ?? '0x0000000000000000000000000000000000000000',
      builderAddress: builder || (address ?? '0x0000000000000000000000000000000000000000'),
      label,
      userPercent: userPct,
      builderPercent: 100 - userPct,
    });
  };

  const errorMessage = error
    ? (() => {
        const msg = String(error instanceof Error ? error.message : error);
        if (msg.includes('503')) return 'Registry not configured on the orchestrator — contact the protocol admin.';
        if (msg.includes('EnsNameTaken') || msg.includes('a8791367') || msg.includes('already')) return 'This label is already registered — choose a different name.';
        if (msg.includes('InvalidSplit') || msg.includes('bcd55b0f')) return 'Invalid accountability split — percentages must total 100.';
        return msg.slice(0, 200);
      })()
    : null;

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

      {!isDemoMode && !address && (
        <div
          style={{
            padding: '14px 16px',
            background: 'var(--app-elevated)',
            border: '1px solid var(--app-border)',
            borderRadius: 8,
            fontSize: 13,
            color: 'var(--app-text-muted)',
          }}
        >
          Connect your wallet to register an agent.
        </div>
      )}

      {isSuccess && data && (
        <div
          style={{
            padding: '16px 20px',
            background: 'var(--app-green-dim)',
            border: '1px solid rgba(34,197,94,0.2)',
            borderRadius: 10,
          }}
        >
          <div style={{ fontWeight: 600, color: 'var(--app-green)', marginBottom: 8 }}>
            Agent registered
          </div>
          <div style={{ fontSize: 12, color: 'var(--app-text-2)', fontFamily: 'monospace', marginBottom: 4 }}>
            {data.ensName} · Token #{data.tokenId}
          </div>
          <div
            style={{
              fontSize: 11,
              color: 'var(--app-text-muted)',
              fontFamily: 'monospace',
              wordBreak: 'break-all',
            }}
          >
            tx: {data.txHash}
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

        {errorMessage && (
          <div
            style={{
              padding: '14px 16px',
              background: 'var(--app-red-dim)',
              border: '1px solid rgba(239,68,68,0.25)',
              borderRadius: 8,
            }}
          >
            <div style={{ fontWeight: 600, fontSize: 13, color: 'var(--app-red)', marginBottom: 4 }}>
              Registration failed
            </div>
            <div style={{ fontSize: 12, color: 'var(--app-red)', opacity: 0.85, lineHeight: 1.6 }}>
              {errorMessage}
            </div>
          </div>
        )}

        <button
          className="app-btn-primary"
          onClick={handleMint}
          disabled={isPending || (!isDemoMode && !address)}
          style={{
            width: '100%',
            padding: '12px',
            opacity: isPending || (!isDemoMode && !address) ? 0.5 : 1,
            cursor: isPending || (!isDemoMode && !address) ? 'not-allowed' : 'pointer',
          }}
        >
          {isPending ? 'Registering…' : error ? 'Try Again' : 'Mint iNFT'}
        </button>
      </div>
    </div>
  );
}
