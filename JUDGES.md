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

One line of code is all a bot needs to integrate:

```typescript
await fetch('http://witness:9002/send', {
  headers: { 'X-Destination-Peer-Id': WITNESS_PEER_ID },
  body: JSON.stringify({ type: 'ATTEST_DECISION', agentId, inputs, reasoning, action, timestamp }),
});
```

---

## Live Links

|                         | URL                                                                                                |
| ----------------------- | -------------------------------------------------------------------------------------------------- |
| **Dashboard**           | **https://app.aegisprotocol.uk**                                                                   |
| **API**                 | https://api.aegisprotocol.uk                                                                       |
| **AegisCourt contract** | https://chainscan-galileo.0g.ai/address/0xA35Ec64578EF4C85a88fE19A81a4303a784B9dd6?tab=transaction |

No installation required to browse. Click **Try Demo** on the landing page or **Browse public feed** on the connect screen for full read-only access without a wallet.

---

## Full Test Walkthrough

This flow takes about 5 minutes and makes you a real participant — your agent is minted on-chain, your disputes produce real transactions, your reputation updates live.

### Step 1 — Add 0G Testnet to MetaMask

In MetaMask → Add a network manually:

| Field          | Value                             |
| -------------- | --------------------------------- |
| Network Name   | 0G Testnet                        |
| RPC URL        | `https://evmrpc-testnet.0g.ai`    |
| Chain ID       | `16602`                           |
| Currency       | `OG`                              |
| Block Explorer | `https://chainscan-galileo.0g.ai` |

Get free testnet OG at [faucet.0g.ai](https://faucet.0g.ai) — paste your wallet address and receive tokens instantly.

---

### Step 2 — Register your own agent

Open **https://app.aegisprotocol.uk/app/register**

1. Click **Connect Wallet** — MetaMask opens on the 0G testnet
2. Type a label for your agent — e.g. `alice-bot`
   - Preview shows: `alice-bot.aegis.eth`
3. Set the accountability split — e.g. 60% user / 40% builder
   - This is encoded permanently in the iNFT contract at mint time
4. Click **Mint iNFT** and approve the MetaMask transaction

When the transaction lands you'll see:

```
Agent registered
alice-bot.aegis.eth issued
```

What just happened on-chain:

- ERC-7857 iNFT minted on `AgentRegistry.sol` (0G chain)
- Subname `alice-bot` registered in `AegisNameRegistry.sol`
- ENSIP-25 records written: `agent.registry` and `agent.id`
- Subname is now resolvable from Ethereum via EIP-3668 CCIP-read

---

### Step 3 — Run the demo script

Clone the repo and run with your agent label:

```bash
git clone https://github.com/JoelEmmanuelCloud/aegis-protocol.git
cd aegis-protocol
npm install
npx ts-node scripts/judge-demo.ts alice-bot
```

Replace `alice-bot` with the label you registered in Step 2.

The script will:

- Verify your agent exists on-chain
- Submit **Decision A** — a normal swap (will be CLEARED)
- Submit **Decision B** — a prohibited emergency liquidation (will be FLAGGED)
- Then **pause and hand control to you**

---

### Step 4 — File the disputes yourself in the dashboard

The script pauses and tells you to go to the Attestation Feed:

**https://app.aegisprotocol.uk/app/attestations**

You will see two new cards — one for each decision the script just submitted.

**For each card:**

1. Click the **"File Dispute"** button — it auto-fills the root hash and agent name
2. Write a reason:
   - Decision A (swap): `"Challenging the swap to verify the TEE replay matches."`
   - Decision B (emergency): `"Unauthorised emergency liquidation. Exceeds mandate and 100 OG daily limit."`
3. Click **File Dispute**

A **live progress tracker** appears immediately, walking through each stage of the dispute:

```
Processing dispute...

  ● Submitting to AegisCourt          ← lights up first
  ● Applying risk guardrails
  ● Verifier replaying via 0G Compute TEE
  ● Recording verdict on-chain
  ● Triggering KeeperHub workflow

  [████████████████████░░░░░] 80%
```

Each step lights up in sequence as the backend processes it. When complete, the tracker is replaced by the verdict card.

**Expected results:**

| Decision | Action                        | Expected Verdict | Why                                                        |
| -------- | ----------------------------- | ---------------- | ---------------------------------------------------------- |
| A        | sell 0.36 OG/USDC             | **CLEARED**      | Normal swap within mandate and risk limits                 |
| B        | emergency_liquidation 5000 OG | **FLAGGED**      | Prohibited action type + exceeds 100 OG daily limit by 50× |

After each verdict, a **"Verify on-chain"** link appears on the dispute card. Click it — it goes directly to your `recordVerdict` transaction on `chainscan-galileo.0g.ai`.

---

### Step 5 — Press ENTER in the terminal

The script resumes and shows:

```
Step 3 — Checking your results

  Reputation for alice-bot.aegis.eth:
    Score         : 91 / 100
    Flagged count : 1
    Cleared count : 1
    Last verdict  : FLAGGED

Step 4 — KeeperHub automated remedy

  Run a1b2c3d4... — completed (verdict: FLAGGED)
    [OK] aegis.fetch_verdict
    [OK] aegis.notify_agent_owner
    [OK] aegis.execute_remedy_tx      ← fired automatically on FLAGGED
    [OK] aegis.update_ens_reputation
    [OK] aegis.update_reputation

  Run e5f6a7b8... — completed (verdict: CLEARED)
    [OK] aegis.fetch_verdict
    [OK] aegis.notify_agent_owner
    [--] aegis.execute_remedy_tx      ← skipped — no consequence for CLEARED
    [OK] aegis.update_ens_reputation
    [OK] aegis.update_reputation
```

**Score formula:** 100 − (flagged × 10) + (cleared × 1) = **91**

---

### Step 6 — Explore the dashboard

| Page                              | What to look for                                                                           |
| --------------------------------- | ------------------------------------------------------------------------------------------ |
| `/app/attestations`               | Both decision cards with action text, reasoning, and root hash                             |
| `/app/disputes` → History tab     | CLEARED card with green badge + on-chain link; FLAGGED card with red badge + on-chain link |
| `/app/agents` → search your label | Reputation score ring at 91, flaggedCount: 1, lastVerdict: FLAGGED                         |
| `/app/audit`                      | KeeperHub run breakdown — `execute_remedy_tx` completed on FLAGGED, skipped on CLEARED     |

---

## Verify On-Chain

Every dispute you filed produced two real transactions on the 0G chain:

| TX              | What it does                               |
| --------------- | ------------------------------------------ |
| `submitDispute` | Registers your dispute on `AegisCourt.sol` |
| `recordVerdict` | Records CLEARED or FLAGGED permanently     |

All transactions are visible on the AegisCourt contract:
**https://chainscan-galileo.0g.ai/address/0xA35Ec64578EF4C85a88fE19A81a4303a784B9dd6?tab=transaction**

---

## Sponsor Track Evidence

### 0G — Storage + Compute + KV + Chain

| Feature        | How to verify                                                                                                |
| -------------- | ------------------------------------------------------------------------------------------------------------ |
| 0G Storage     | Root hash `0x...` returned instantly — computed from the real 0G merkle tree; upload completes in background |
| 0G Compute TEE | Verifier replays decisions via `qwen/qwen-2.5-7b-instruct` at `compute-network-6.integratenetwork.work`      |
| 0G KV          | `aegis:{agentId}:reputation` written after each attestation                                                  |
| 0G Chain       | AegisCourt, AgentRegistry, AegisNameRegistry all deployed on chainId 16602                                   |

### Gensyn AXL — Four Distinct Nodes

Four separate processes, four distinct ed25519 identity keys, real encrypted P2P messages over Yggdrasil.

```bash
curl http://164.92.165.231:9022/topology
```

| Node       | Port | Peer ID               |
| ---------- | ---- | --------------------- |
| Propagator | 9022 | `f2f2af19af8f20bf...` |
| Witness    | 9002 | `0c0ad1361fc678...`   |
| Verifier   | 9012 | `3d702e5b9658f7...`   |
| Memory     | 9032 | `6bc1bcd7f66d4e...`   |

Health checks:

```bash
curl http://164.92.165.231:10002/health   # witness
curl http://164.92.165.231:10012/health   # verifier
curl http://164.92.165.231:10022/health   # propagator
curl http://164.92.165.231:10032/health   # memory
```

### ENS — ENSIP-25 + EIP-3668 CCIP-read + Live Reputation Oracle

When you registered your agent in Step 2, ENSIP-25 records were written to `AegisNameRegistry.sol` on the 0G chain:

- `agent.registry = 0xC1476f6Dfc8C3f6593B21FDab8DA156e9Be274B1`
- `agent.id = 1`

Any ENS-aware app can resolve `alice-bot.aegis.eth` from Ethereum via the CCIP gateway and receive the live reputation score — without touching the Aegis backend. The reputation travels with the name.

### KeeperHub — Automated Remedy Workflow

The `aegis.execute_remedy` workflow triggered automatically after each verdict — no manual trigger. Steps, outcomes, and agent identity are logged in the audit trail at `/app/audit`. Builder feedback documenting our KeeperHub integration experience is in `docs/FEEDBACK.md`.

---

## Contracts

| Contract              | Chain                       | Address                                      |
| --------------------- | --------------------------- | -------------------------------------------- |
| AegisCourt.sol        | 0G testnet (16602)          | `0xA35Ec64578EF4C85a88fE19A81a4303a784B9dd6` |
| AgentRegistry.sol     | 0G testnet (16602)          | `0xC1476f6Dfc8C3f6593B21FDab8DA156e9Be274B1` |
| AegisNameRegistry.sol | 0G testnet (16602)          | `0xC8e1B8763be717Daee9b41CFD68F723f6bA06aC4` |
| AegisCCIPResolver.sol | Ethereum Sepolia (11155111) | `0xa2B6B632130Ac772c91fb15b0bbAB75b58E976fC` |

---

## Architecture

```
Your Bot (any framework)
  │  one fetch call  →  AXL Witness Node :9002
  ▼
Witness  ──→  0G Storage (real merkle rootHash returned immediately)
  │  AXL P2P mesh (Gensyn)
  ▼
Propagator :9022  ──→  broadcasts to all peers
  │
  ▼
Memory :9032  ──→  0G KV write + AegisNameRegistry text record update

Judge files dispute via dashboard
  │
  ▼
Orchestrator :3000  ──→  rule check + calls Verifier
  │
  ▼
Verifier :9012  ──→  0G Compute TEE replay (qwen/qwen-2.5-7b-instruct)
  │  verdict  →  AegisCourt.sol (submitDispute + recordVerdict)
  ▼
KeeperHub  ──→  aegis.execute_remedy fires automatically
  ├─ fetch_verdict
  ├─ notify_agent_owner
  ├─ execute_remedy_tx  (only if FLAGGED)
  ├─ update_ens_reputation
  └─ update_reputation

Any ENS-aware app
  │  resolve("alice-bot.aegis.eth")
  ▼
AegisCCIPResolver (Ethereum Sepolia)  ──→  OffchainLookup
  │  CCIP gateway :8080
  ▼
AegisNameRegistry (0G testnet)  ──→  live reputation score returned
```

Any agent, any framework, one call. Aegis records what happened and enforces consequences automatically.
