# Aegis Protocol — Judge Testing Guide

**ETHGlobal · Open Agents Track**
**Sponsor tracks:** 0G · Gensyn AXL · ENS · KeeperHub

---

## What Is Aegis?

Every AI agent framework solves _how agents decide_. None solve _what happens after_.

Aegis is the accountability layer that sits beside any AI agent. When a bot acts, Aegis:

1. **Witnesses** the decision — commits it to 0G Storage, returns an unforgeable root hash
2. **Verifies** it when disputed — replays the decision in a 0G Compute TEE
3. **Enforces** the verdict — AegisCourt.sol records it on-chain; KeeperHub executes the remedy automatically
4. **Publishes** the reputation — stored as ENS text records on `*.aegis.eth`, readable by any app via EIP-3668 CCIP-read

One line of code is all a bot needs:

```typescript
await fetch('http://witness:9002/send', {
  headers: { 'X-Destination-Peer-Id': WITNESS_PEER_ID },
  body: JSON.stringify({ type: 'ATTEST_DECISION', agentId, inputs, reasoning, action, timestamp }),
});
```

---

## Live Demo

**Dashboard:** https://app.aegisprotocol.uk

**Orchestrator API:** https://api.aegisprotocol.uk

No installation needed. Open the dashboard in your browser. MetaMask works — the dashboard is served over HTTPS.

To explore without a wallet, click **Try Demo** on the landing page or **Browse public feed** on the connect screen. Every screen is fully functional in read-only mode.

---

## Add 0G Testnet to MetaMask (30 seconds)

| Field        | Value                             |
| ------------ | --------------------------------- |
| Network Name | 0G Testnet                        |
| RPC URL      | `https://evmrpc-testnet.0g.ai`    |
| Chain ID     | `16602`                           |
| Currency     | `OG`                              |
| Explorer     | `https://chainscan-galileo.0g.ai` |

Get free testnet OG: [faucet.0g.ai](https://faucet.0g.ai)

---

## Test the Full Flow (2 minutes)

Run one script. It hits the live hosted backend, submits two decisions, files both disputes, and prints the results — no local backend required.

```bash
git clone https://github.com/JoelEmmanuelCloud/aegis-protocol.git
cd aegis-protocol
npm install
npx ts-node scripts/judge-demo.ts
```

Expected output:

```
Step 1 — Submit a normal trading decision (will be CLEARED)
  rootHash  : 0xa7c425c8...
  Verdict   : CLEARED
  On-chain  : https://chainscan-galileo.0g.ai/tx/0xc4a700...

Step 2 — Submit a high-risk prohibited action (will be FLAGGED)
  rootHash  : 0x2af2fc22...
  Verdict   : FLAGGED

Step 3 — Check live reputation
  Score         : 91 / 100
  Flagged count : 1
  Cleared count : 1

Step 4 — KeeperHub audit trail
  Run 808658bf... — completed (verdict: FLAGGED)
    [OK] aegis.fetch_verdict
    [OK] aegis.notify_agent_owner
    [OK] aegis.execute_remedy_tx     ← fired because FLAGGED
    [OK] aegis.update_ens_reputation
    [OK] aegis.update_reputation

  Run c168b344... — completed (verdict: CLEARED)
    [OK] aegis.fetch_verdict
    [OK] aegis.notify_agent_owner
    [--] aegis.execute_remedy_tx     ← skipped because CLEARED
    [OK] aegis.update_ens_reputation
    [OK] aegis.update_reputation
```

Then open **https://app.aegisprotocol.uk** and navigate to:

- `/app/attestations` — both decisions with action text and reasoning
- `/app/disputes` → History tab — CLEARED card with explorer link, FLAGGED card with explorer link
- `/app/agents` → search `judge-bot` — live reputation score (91/100)
- `/app/audit` — KeeperHub steps showing `execute_remedy_tx` completed vs skipped

### Optional — register your own agent via the dashboard

Go to **Register** (`/app/register`), connect MetaMask on 0G testnet, type a label, set the accountability split, and click **Mint iNFT**. Your agent gets a `.aegis.eth` subname and ENSIP-25 records automatically.

---

## Verify On-Chain

Every dispute produces two verifiable transactions on the 0G chain:

| TX              | What it does                              |
| --------------- | ----------------------------------------- |
| `submitDispute` | Registers the dispute on `AegisCourt.sol` |
| `recordVerdict` | Records CLEARED or FLAGGED permanently    |

View all dispute transactions on the AegisCourt contract:
**https://chainscan-galileo.0g.ai/address/0xA35Ec64578EF4C85a88fE19A81a4303a784B9dd6?tab=transaction**

The "Verify on-chain" link on each dispute card in the dashboard goes directly to the verdict transaction.

---

## Sponsor Track Evidence

### 0G — Storage + Compute + KV + Chain

| Feature            | How to verify                                                                                           |
| ------------------ | ------------------------------------------------------------------------------------------------------- |
| 0G Storage upload  | Root hash `0x...` returned on attestation — computed from actual 0G merkle tree before upload completes |
| 0G Compute TEE     | Verifier node calls `qwen/qwen-2.5-7b-instruct` via `https://compute-network-6.integratenetwork.work`   |
| 0G KV              | `aegis:{agentId}:reputation` written after each attestation                                             |
| 0G Chain contracts | AegisCourt, AgentRegistry, AegisNameRegistry all on chainId 16602                                       |

```bash
# Check 0G chain contract activity
curl https://evmrpc-testnet.0g.ai \
  -d '{"jsonrpc":"2.0","method":"eth_getCode","params":["0xA35Ec64578EF4C85a88fE19A81a4303a784B9dd6","latest"],"id":1}'
```

### Gensyn AXL — Four Distinct Nodes

```bash
# Four real peer IDs — all connected and messaging
curl http://164.92.165.231:9022/topology
```

| Node       | Port | Peer ID               |
| ---------- | ---- | --------------------- |
| Propagator | 9022 | `f2f2af19af8f20bf...` |
| Witness    | 9002 | `0c0ad1361fc678...`   |
| Verifier   | 9012 | `3d702e5b9658f7...`   |
| Memory     | 9032 | `6bc1bcd7f66d4e...`   |

Each node has its own ed25519 key in `axl-configs/*.pem`. Messages flow Witness → Propagator → Memory via real AXL peer-to-peer encrypted transport. This is the Gensyn autoresearch broadcast pattern applied to accountability signals.

```bash
# Witness health
curl http://164.92.165.231:10002/health
# Verifier health
curl http://164.92.165.231:10012/health
# Propagator health
curl http://164.92.165.231:10022/health
# Memory health
curl http://164.92.165.231:10032/health
```

### ENS — ENSIP-25 + EIP-3668 CCIP-read + Live Reputation Oracle

Every agent gets a `.aegis.eth` subname. Reputation is stored as text records in `AegisNameRegistry.sol` on 0G testnet and readable from Ethereum via CCIP-read — no bridge, no manual sync.

```bash
# Read live reputation text records directly from 0G
curl http://164.92.165.231:8080/health
```

The CCIP gateway at port 8080 handles EIP-3668 `OffchainLookup` resolution requests from Ethereum ENS clients. When any ENS-aware app resolves `mit-bot.aegis.eth`, the gateway queries `AegisNameRegistry.sol` on 0G and returns the live accountability score.

ENSIP-25 records written at agent registration:

- `agent.registry = 0xC1476f6Dfc8C3f6593B21FDab8DA156e9Be274B1` (AgentRegistry.sol)
- `agent.id = 1` (iNFT token ID)

### KeeperHub — Automated Remedy Workflow

The `aegis.execute_remedy` workflow runs automatically after every verdict. View the full audit trail at `/app/audit`.

The workflow integrates with the KeeperHub MCP API shape (`triggerWorkflow`, `getAuditTrail`). The builder feedback documenting our integration experience is in `docs/FEEDBACK.md`.

---

## Contracts

| Contract              | Chain                       | Address                                      |
| --------------------- | --------------------------- | -------------------------------------------- |
| AegisCourt.sol        | 0G testnet (16602)          | `0xA35Ec64578EF4C85a88fE19A81a4303a784B9dd6` |
| AgentRegistry.sol     | 0G testnet (16602)          | `0xC1476f6Dfc8C3f6593B21FDab8DA156e9Be274B1` |
| AegisNameRegistry.sol | 0G testnet (16602)          | `0xC8e1B8763be717Daee9b41CFD68F723f6bA06aC4` |
| AegisCCIPResolver.sol | Ethereum Sepolia (11155111) | `0xa2B6B632130Ac772c91fb15b0bbAB75b58E976fC` |

---

## Architecture (30 seconds)

```
Your Bot
  │  one fetch call
  ▼
Witness :9002 ──→ 0G Storage (real merkle rootHash)
  │  AXL P2P mesh (Gensyn)
  ▼
Propagator :9022 ──→ broadcast to peers
  │
  ▼
Memory :9032 ──→ 0G KV + ENS text records (AegisNameRegistry)

Dispute filed
  │
  ▼
Verifier :9012 ──→ 0G Compute TEE replay
  │  verdict
  ▼
AegisCourt.sol ──→ on-chain permanent record
  │  VerdictEmitted event
  ▼
KeeperHub ──→ execute_remedy workflow (automatic)
```

**The key insight:** Any agent framework integrates Aegis with one fetch call. Storage, verification, court, reputation, ENS identity — all handled automatically. Aegis does not touch the agent's decision logic. It only records what happened and enforces consequences.
