import { useState } from 'react';
import { useAccount } from 'wagmi';
import { useDemoMode } from '../context/DemoContext';
import { registerAgent } from '../lib/orchestratorApi';

function FieldError({ msg }: { msg: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginTop: 5 }}>
      <svg
        width="12"
        height="12"
        viewBox="0 0 24 24"
        fill="none"
        stroke="var(--app-red)"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        style={{ flexShrink: 0 }}
      >
        <circle cx="12" cy="12" r="10" />
        <line x1="12" y1="8" x2="12" y2="12" />
        <line x1="12" y1="16" x2="12.01" y2="16" />
      </svg>
      <span style={{ fontSize: 11, color: 'var(--app-red)' }}>{msg}</span>
    </div>
  );
}

function isValidEthAddress(val: string): boolean {
  return /^0x[0-9a-fA-F]{40}$/.test(val);
}

export default function Register() {
  const { address } = useAccount();
  const { isDemoMode } = useDemoMode();
  const [label, setLabel] = useState('');
  const [builder, setBuilder] = useState('');
  const [userPct, setUserPct] = useState(60);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [touched, setTouched] = useState({ label: false, builder: false });
  const [submitAttempted, setSubmitAttempted] = useState(false);

  const [isRegistering, setIsRegistering] = useState(false);
  const [regError, setRegError] = useState<string | null>(null);
  const [regResult, setRegResult] = useState<{
    tokenId: string;
    ensName: string;
    txHash: string;
  } | null>(null);

  const labelError = (() => {
    if (!label.trim()) return 'Agent label is required';
    if (label.length < 3) return 'Label must be at least 3 characters';
    if (!/^[a-z0-9-]+$/.test(label)) return 'Only lowercase letters, numbers, and hyphens';
    if (label.startsWith('-') || label.endsWith('-'))
      return 'Label cannot start or end with a hyphen';
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

  const touch = (field: keyof typeof touched) => setTouched((prev) => ({ ...prev, [field]: true }));

  const handleMint = async () => {
    setSubmitAttempted(true);
    setTouched({ label: true, builder: true });
    if (!isDemoMode && !address) return;
    if (!formValid) return;
    setRegError(null);
    setRegResult(null);

    if (isDemoMode) {
      setRegResult({
        tokenId: String(Math.floor(Math.random() * 900) + 43),
        ensName: `${label}.aegis.eth`,
        txHash:
          '0x' +
          Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join(''),
      });
      return;
    }

    const builderAddr = builder || address!;
    setIsRegistering(true);
    try {
      const result = await registerAgent({
        agentOwner: address!,
        builderAddress: builderAddr,
        label,
        userPercent: userPct,
        builderPercent: 100 - userPct,
      });
      setRegResult(result);
    } catch (err) {
      const msg = String(err instanceof Error ? err.message : err);
      if (msg.includes('already registered') || msg.includes('EnsNameTaken') || msg.includes('409'))
        setRegError('That label is already registered — choose a different name.');
      else if (msg.includes('percentages') || msg.includes('InvalidSplit') || msg.includes('400'))
        setRegError('Invalid accountability split — percentages must total 100.');
      else if (msg.includes('503') || msg.includes('unavailable') || msg.includes('AGENT_REGISTRY'))
        setRegError('Registry contract not configured — contact support.');
      else setRegError(msg.slice(0, 200));
    } finally {
      setIsRegistering(false);
    }
  };

  const succeeded = !!regResult;
  const resultEnsName = regResult?.ensName ?? `${label}.aegis.eth`;
  const resultTokenId = regResult?.tokenId ?? '';
  const resultTxHash = regResult?.txHash ?? '';

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

      {succeeded && (
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
          <div
            style={{
              fontSize: 12,
              color: 'var(--app-text-2)',
              fontFamily: 'monospace',
              marginBottom: 4,
            }}
          >
            {resultEnsName} · Token #{resultTokenId}
          </div>
          {resultTxHash && (
            <a
              href={`https://chainscan-galileo.0g.ai/tx/${resultTxHash}`}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                fontSize: 11,
                color: 'var(--app-accent)',
                fontFamily: 'monospace',
                wordBreak: 'break-all',
                textDecoration: 'none',
              }}
            >
              View tx on-chain ↗
            </a>
          )}
        </div>
      )}

      {isRegistering && (
        <div
          style={{
            padding: '14px 16px',
            background: 'var(--app-elevated)',
            border: '1px solid var(--app-border)',
            borderRadius: 8,
            fontSize: 13,
            color: 'var(--app-text-2)',
          }}
        >
          Registering agent on-chain...
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
          {showLabelError ? (
            <FieldError msg={labelError} />
          ) : (
            <div style={{ fontSize: 11, color: 'var(--app-text-muted)', marginTop: 6 }}>
              Lowercase letters, numbers, and hyphens only
            </div>
          )}
        </div>

        <button
          type="button"
          onClick={() => setShowAdvanced((v) => !v)}
          style={{
            background: 'none',
            border: 'none',
            padding: 0,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            fontSize: 12,
            color: 'var(--app-text-muted)',
            width: 'fit-content',
          }}
        >
          <svg
            width="12"
            height="12"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            style={{
              transform: showAdvanced ? 'rotate(90deg)' : 'none',
              transition: 'transform 0.15s',
            }}
          >
            <polyline points="9 18 15 12 9 6" />
          </svg>
          Advanced
        </button>

        {showAdvanced && (
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
            {showBuilderError ? (
              <FieldError msg={builderError} />
            ) : (
              <div style={{ fontSize: 11, color: 'var(--app-text-muted)', marginTop: 6 }}>
                Defaults to your connected wallet. Set a different address if the builder is a
                separate entity.
              </div>
            )}
          </div>
        )}

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

        {regError && (
          <div
            style={{
              padding: '14px 16px',
              background: 'var(--app-red-dim)',
              border: '1px solid rgba(239,68,68,0.25)',
              borderRadius: 8,
            }}
          >
            <div
              style={{ fontWeight: 600, fontSize: 13, color: 'var(--app-red)', marginBottom: 4 }}
            >
              Registration failed
            </div>
            <div style={{ fontSize: 12, color: 'var(--app-red)', opacity: 0.85, lineHeight: 1.6 }}>
              {regError}
            </div>
          </div>
        )}

        <button
          className="app-btn-primary"
          onClick={handleMint}
          disabled={isRegistering || (!isDemoMode && !address)}
          style={{
            width: '100%',
            padding: '12px',
            opacity: isRegistering || (!isDemoMode && !address) ? 0.5 : 1,
            cursor: isRegistering || (!isDemoMode && !address) ? 'not-allowed' : 'pointer',
          }}
        >
          {isRegistering ? 'Registering…' : regError ? 'Try Again' : 'Mint iNFT'}
        </button>
      </div>
    </div>
  );
}
