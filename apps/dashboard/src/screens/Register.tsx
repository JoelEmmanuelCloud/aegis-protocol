import { useState } from 'react';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { useAccount, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import OwnershipSlider from '../components/OwnershipSlider';

const AGENT_REGISTRY_ABI = [
  {
    name: 'mint',
    type: 'function' as const,
    stateMutability: 'nonpayable' as const,
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

const registryAddress = import.meta.env.VITE_AGENT_REGISTRY_ADDRESS as `0x${string}`;

const inputCls =
  'w-full px-3.5 py-2.5 bg-aegis-base border border-aegis-border-solid rounded-lg text-aegis-text text-sm outline-none';

const labelCls = 'text-[13px] text-aegis-muted mb-1.5 block';

export default function Register() {
  const { address, isConnected } = useAccount();
  const [label, setLabel] = useState('');
  const [builderAddress, setBuilderAddress] = useState('');
  const [userPercent, setUserPercent] = useState(60);

  const { writeContract, data: txHash, isPending, error } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash: txHash });

  const ensPreview = label.trim() ? `${label.trim().toLowerCase()}.aegis.eth` : null;
  const builderAddr = (builderAddress.trim() || address) as `0x${string}` | undefined;
  const canMint =
    isConnected &&
    !!label.trim() &&
    !!address &&
    !!builderAddr &&
    !!registryAddress &&
    !isPending &&
    !isConfirming;

  const handleMint = () => {
    if (!address || !builderAddr || !label.trim() || !registryAddress) return;
    writeContract({
      address: registryAddress,
      abi: AGENT_REGISTRY_ABI,
      functionName: 'mint',
      args: [address, builderAddr, label.trim().toLowerCase(), userPercent, 100 - userPercent],
      chainId: 16602,
    });
  };

  return (
    <div className="flex flex-col gap-6">
      <div>
        <div className="text-xl font-bold mb-1">Register Agent</div>
        <div className="text-[13px] text-aegis-muted">
          Mint an iNFT (ERC-7857) and issue an aegis.eth ENS subname for your AI agent
        </div>
      </div>

      <div className="grid grid-cols-[1fr_320px] gap-4 items-start">
        <div className="flex flex-col gap-4">
          <div className="bg-aegis-card border border-aegis-border rounded-xl px-6 py-5">
            <div className="text-sm font-semibold mb-4">Wallet</div>
            <ConnectButton />
          </div>

          {isConnected && (
            <div className="bg-aegis-card border border-aegis-border rounded-xl px-6 py-5">
              <div className="text-sm font-semibold mb-5">Agent Details</div>
              <div className="flex flex-col gap-4">
                <div>
                  <label className={labelCls}>ENS Label</label>
                  <input
                    className={inputCls}
                    value={label}
                    onChange={(e) => setLabel(e.target.value.replace(/[^a-z0-9-]/g, ''))}
                    placeholder="trading-bot"
                    maxLength={32}
                  />
                  {ensPreview && (
                    <div className="text-xs text-aegis-purple-light mt-1">ENS: {ensPreview}</div>
                  )}
                </div>

                <div>
                  <label className={labelCls}>Builder Address</label>
                  <input
                    className={inputCls}
                    value={builderAddress}
                    onChange={(e) => setBuilderAddress(e.target.value)}
                    placeholder={address ?? '0x…'}
                  />
                  <div className="text-xs text-aegis-dim mt-1">Leave empty to use your connected wallet</div>
                </div>

                <div>
                  <label className={labelCls}>Accountability Split</label>
                  <OwnershipSlider userPercent={userPercent} onChange={setUserPercent} />
                </div>

                {error && (
                  <div className="text-aegis-red text-[13px] bg-aegis-red-dim px-3.5 py-2.5 rounded-lg">
                    {error.message}
                  </div>
                )}

                {isSuccess && txHash && (
                  <div className="text-aegis-green text-[13px] bg-aegis-green-dim px-3.5 py-2.5 rounded-lg">
                    Agent minted successfully. Tx: {txHash.slice(0, 10)}…
                  </div>
                )}

                <button
                  onClick={handleMint}
                  disabled={!canMint}
                  className={`py-3 border-0 rounded-lg text-sm font-semibold transition-colors ${
                    canMint
                      ? 'bg-aegis-purple text-white cursor-pointer'
                      : 'bg-aegis-card-hover text-aegis-dim cursor-default'
                  }`}
                >
                  {isPending ? 'Awaiting wallet…' : isConfirming ? 'Confirming…' : 'Mint iNFT'}
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="flex flex-col gap-4">
          <div className="bg-aegis-card border border-aegis-border rounded-xl px-6 py-5">
            <div className="text-sm font-semibold mb-4">Preview</div>
            <div className="flex flex-col gap-3">
              {[
                ['ENS Name', ensPreview ?? '—'],
                ['Owner', address ? `${address.slice(0, 8)}…` : '—'],
                ['Builder', builderAddr ? `${builderAddr.slice(0, 8)}…` : '—'],
                ['User Split', `${userPercent}%`],
                ['Builder Split', `${100 - userPercent}%`],
                ['Chain', '0G Galileo Testnet (16602)'],
              ].map(([k, v]) => (
                <div
                  key={k}
                  className="flex justify-between text-[13px] pb-2.5 border-b border-aegis-border"
                >
                  <span className="text-aegis-muted">{k}</span>
                  <span className="text-aegis-text font-mono">{v}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-aegis-purple-dim border border-[rgba(124,58,237,0.3)] rounded-xl px-6 py-5">
            <div className="text-[13px] text-aegis-purple-light leading-relaxed">
              Minting creates an ERC-7857 iNFT on 0G Galileo Testnet, issues an aegis.eth ENS subname via
              NameWrapper, and sets initial reputation text records on the Public Resolver.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
