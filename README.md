# Aegis Protocol

The accountability layer for AI agents. Any agent can prove what it decided, why it decided it, and face consequences if it was wrong.

## What It Does

Aegis sits beside any AI agent framework as a witness, verifier, and court:

1. **Witness** — agent submits a decision via AXL. Witness uploads it to 0G Storage, returns a root hash receipt.
2. **Verifier** — when disputed, replays the decision via 0G Compute TEE. Produces a cryptographic verdict (CLEARED or FLAGGED).
3. **Court** — AegisCourt.sol records the verdict onchain. KeeperHub fires the remedy transaction automatically.
4. **ENS Identity** — every agent gets a subname (`trading-bot.aegis.eth`). Live reputation is stored as ENS text records — queryable by any app without touching our backend.

## Architecture

```
External Agent
     │  POST /send  (AXL)
     ▼
Witness Node (9002) ──────────────────────────────── 0G Storage
     │  AXL send → PROPAGATE_ATTESTATION
     ▼
Propagator Node (9022) ──────────────────────────── mesh broadcast
     │  AXL send → PROPAGATE_ATTESTATION
     ▼
Memory Node (9032) ───────────────────────────────── 0G KV + ENS text records

Dispute filed
     │  AXL send → VERIFY_DECISION
     ▼
Verifier Node (9012) ─────────────────────────────── 0G Compute TEE
     │  verdict → AegisCourt.sol
     ▼
KeeperHub Workflow ───────────────────────────────── onchain remedy
```

Four AXL nodes with four distinct ed25519 keys communicate over the Yggdrasil mesh using the Gensyn AXL binary. No central coordinator.

## Quick Start

```bash
# 1. Copy environment variables
cp .env.example .env
# Fill in: ZG_PRIVATE_KEY, ZG_COMPUTE_API_KEY, ENS_PRIVATE_KEY, KEEPERHUB_API_KEY

# 2. Install dependencies
npm install

# 3. Start all 4 nodes + orchestrator
docker-compose up
```

**Local (without Docker):**

```bash
# Start each node in a separate terminal
npx ts-node apps/witness-node/src/index.ts
npx ts-node apps/verifier-node/src/index.ts
npx ts-node apps/propagator-node/src/index.ts
npx ts-node apps/memory-node/src/index.ts
npx ts-node -r tsconfig-paths/register apps/orchestrator/src/main.ts
```

## AXL Node Peer IDs

| Node       | Port | Peer ID                                                            |
| ---------- | ---- | ------------------------------------------------------------------ |
| Witness    | 9002 | `23fb5c412a421117459c2160906f26ccf260cc38cb9e3407fc159ab79e5752b1` |
| Verifier   | 9012 | `7c60360ef2c5e4d236d56c413db50054bbc3dcfecb190968d0324a1a40a7f0f1` |
| Propagator | 9022 | `946df8c688343d09d1600388a08582b4fa6cf8b30a01d493851428f03e78bc6f` |
| Memory     | 9032 | `87a69f086122c7232d9dbca90797d5d47836c2c83869cf4a93f5148b962aa6c4` |

## Agent Integration

Add one call to your agent after every decision:

```typescript
await fetch('http://localhost:9002/send', {
  method: 'POST',
  headers: {
    'X-Destination-Peer-Id': '23fb5c412a421117459c2160906f26ccf260cc38cb9e3407fc159ab79e5752b1',
  },
  body: JSON.stringify({
    type: 'ATTEST_DECISION',
    agentId: 'trading-bot.aegis.eth',
    inputs: { context: 'wallet 0x1234, balance 0.3 ETH' },
    reasoning: 'Balance below 0.5 threshold. Confidence 0.94. Swap.',
    action: { type: 'swap', amount: '100 USDC', to: 'ETH' },
    timestamp: Date.now(),
  }),
});
// Response: { "rootHash": "0xabc123...", "status": "COMMITTED" }
```

## Orchestrator API

```
POST /agents              — mint iNFT, auto-issue ENS subname
GET  /agents/label/:label — look up agent by ENS subdomain
GET  /agents/owner/:addr  — list all iNFTs for a wallet
POST /attestations        — route attestation to witness node
POST /disputes            — file dispute, trigger verifier, record verdict, fire KeeperHub
GET  /disputes/:rootHash  — read dispute from AegisCourt.sol
GET  /network/stats       — read global stats from 0G KV
```

## Contracts (0G Testnet)

| Contract          | Address                                             |
| ----------------- | --------------------------------------------------- |
| AegisCourt.sol    | `AEGIS_COURT_ADDRESS` (set in .env after deploy)    |
| AgentRegistry.sol | `AGENT_REGISTRY_ADDRESS` (set in .env after deploy) |

Deploy:

```bash
cd contracts && npx hardhat run scripts/deploy.ts --network zero-g-testnet
```

## ENS Integration

Every agent receives a subname via ENS Name Wrapper on iNFT mint:

```
aegis.eth                      ← Aegis root
trading-bot.aegis.eth          ← auto-issued on mint
```

Text records updated after every attestation:

```
aegis.reputation      = "87"
aegis.totalDecisions  = "1247"
aegis.lastVerdict     = "CLEARED"
aegis.storageIndex    = "0xROOTHASH..."
aegis.flaggedCount    = "2"
```

ENSIP-25 records link name to AgentRegistry.sol:

```
agent.registry = "0xAGENT_REGISTRY_ADDRESS"
agent.id       = "0xTOKEN_ID_HEX"
```

## Sponsor Tracks

- **0G** — 0G Storage (KV + file), 0G Compute TEE replay, iNFT via AgentRegistry.sol
- **Gensyn** — 4 separate AXL nodes, 4 distinct ed25519 keys, Yggdrasil mesh, autoresearch broadcast pattern
- **ENS** — ENSIP-25, Name Wrapper subnames, text record reputation oracle
- **KeeperHub** — `aegis.execute_remedy` workflow, triggered on FLAGGED verdict, full audit trail

## Repository Structure

```
apps/
  orchestrator/       NestJS API gateway
  witness-node/       AXL 9002 — attestation intake
  verifier-node/      AXL 9012 — 0G Compute TEE replay
  propagator-node/    AXL 9022 — mesh broadcast
  memory-node/        AXL 9032 — 0G KV + ENS updates
packages/
  0g-client/          0G Storage SDK wrapper
  0g-compute/         0G Compute OpenAI-compat wrapper
  axl-client/         AXL HTTP helpers
  ens-client/         ENS subname + text record + ENSIP-25
  keeper-client/      KeeperHub workflow tools
  types/              Shared TypeScript interfaces
contracts/
  AegisCourt.sol      Dispute + verdict storage
  AgentRegistry.sol   ERC-7857 iNFT + ENS Name Wrapper
axl-configs/          AXL node configs + ed25519 keys
bin/                  Gensyn AXL binary
```
