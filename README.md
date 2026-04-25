# Aegis Protocol

The accountability layer for AI agents. Any agent can prove what it decided, why it decided it, and face consequences if it was wrong.

**Sponsor tracks:** 0G · Gensyn AXL · ENS · KeeperHub

---

## Table of Contents

1. [What It Does](#1-what-it-does)
2. [Architecture](#2-architecture)
3. [Prerequisites](#3-prerequisites)
4. [Environment Setup](#4-environment-setup)
5. [Start the System](#5-start-the-system)
6. [Verify All Services Are Live](#6-verify-all-services-are-live)
7. [End-to-End Test — Full Flow](#7-end-to-end-test--full-flow)
8. [Dashboard Walkthrough](#8-dashboard-walkthrough)
9. [Demo Video Script (3 min)](#9-demo-video-script-3-min)
10. [Contracts](#10-contracts)
11. [Orchestrator API Reference](#11-orchestrator-api-reference)
12. [Troubleshooting](#12-troubleshooting)

---

## 1. What It Does

Aegis sits beside any AI agent framework as a witness, verifier, and court:

1. **Witness** — agent submits a decision via AXL. Witness uploads it to 0G Storage, returns a root hash receipt.
2. **Verifier** — when disputed, replays the decision via 0G Compute TEE. Produces a cryptographic verdict (CLEARED or FLAGGED).
3. **Court** — AegisCourt.sol records the verdict onchain. KeeperHub fires the remedy transaction automatically.
4. **ENS Identity** — every agent gets a subname (`trading-bot.aegis.eth`). Live reputation is stored as ENS text records — queryable by any app without touching our backend.

---

## 2. Architecture

```
External Agent
     │  POST /send  (AXL)
     ▼
Witness Node :9002 ──────────────────── 0G Storage (file + KV)
     │  AXL → PROPAGATE_ATTESTATION
     ▼
Propagator Node :9022 ───────────────── mesh broadcast to peers
     │  AXL → PROPAGATE_ATTESTATION
     ▼
Memory Node :9032 ───────────────────── 0G KV write + ENS text record update

Dispute filed via orchestrator
     │  AXL → VERIFY_DECISION
     ▼
Verifier Node :9012 ─────────────────── 0G Compute TEE replay
     │  verdict → AegisCourt.sol
     ▼
KeeperHub Workflow ──────────────────── onchain remedy + ENS reputation update
```

Four AXL nodes, four distinct ed25519 keys, communicating over the Yggdrasil mesh. No central coordinator.

### AXL Node Peer IDs

| Node       | Port | Management | Peer ID                                                            |
| ---------- | ---- | ---------- | ------------------------------------------------------------------ |
| Witness    | 9002 | 10002      | `23fb5c412a421117459c2160906f26ccf260cc38cb9e3407fc159ab79e5752b1` |
| Verifier   | 9012 | 10012      | `7c60360ef2c5e4d236d56c413db50054bbc3dcfecb190968d0324a1a40a7f0f1` |
| Propagator | 9022 | 10022      | `946df8c688343d09d1600388a08582b4fa6cf8b30a01d493851428f03e78bc6f` |
| Memory     | 9032 | 10032      | `87a69f086122c7232d9dbca90797d5d47836c2c83869cf4a93f5148b962aa6c4` |

---

## 3. Prerequisites

| Requirement             | Version | Check                                |
| ----------------------- | ------- | ------------------------------------ |
| Node.js                 | 20+     | `node -v`                            |
| npm                     | 10+     | `npm -v`                             |
| Docker + Docker Compose | latest  | `docker -v`                          |
| MetaMask                | any     | browser extension installed          |
| 0G testnet wallet       | funded  | [faucet.0g.ai](https://faucet.0g.ai) |

**Fund your wallet before starting.** You need testnet OG tokens for:

- Minting the iNFT on AgentRegistry.sol
- Filing a dispute on AegisCourt.sol
- KeeperHub remedy transaction

Get tokens at [faucet.0g.ai](https://faucet.0g.ai) — paste your wallet address, receive 0.1 OG.

---

## 4. Environment Setup

```bash
# Clone and install
git clone https://github.com/JoelEmmanuelCloud/aegis-protocol.git
cd aegis-protocol
npm install

# Copy environment file
cp .env.example .env
```

Open `.env` and fill in these four values — everything else is pre-configured:

```bash
# Your 0G testnet wallet private key (the account that will pay gas)
ZG_PRIVATE_KEY=0x...your_private_key_here

# 0G Compute API key — get from https://dashboard.0g.ai
ZG_COMPUTE_API_KEY=app-sk-...your_key_here

# Same wallet key used for ENS subname issuance (can be same as ZG_PRIVATE_KEY)
ENS_PRIVATE_KEY=0x...your_private_key_here

# KeeperHub API key — run: /plugin marketplace add KeeperHub/claude-plugins
KEEPERHUB_API_KEY=...your_key_here
```

The following are already set correctly and do not need to change:

- All `AXL_*_PEER_ID` values (derived from keys in `axl-configs/`)
- All contract addresses (`AEGIS_COURT_ADDRESS`, `AGENT_REGISTRY_ADDRESS`)
- All ENS addresses (registry, name wrapper, resolver)
- All 0G endpoints

---

## 5. Start the System

### Option A — Docker (recommended for demo recording)

One command starts all 6 services in the correct order with health checks:

```bash
docker-compose up --build
```

Wait for all containers to show `healthy`. Expected output:

```
axl-propagator   | AXL node started — peer 946df8c6...  port 9022
axl-witness      | AXL node started — peer 23fb5c41...  port 9002
axl-verifier     | AXL node started — peer 7c60360e...  port 9012
axl-memory       | AXL node started — peer 87a69f08...  port 9032
orchestrator     | Listening on port 3000
dashboard        | Local: http://localhost:4000
```

### Option B — Local terminals (recommended for development / visible peer IDs)

Open **5 separate terminal windows** — this is what judges need to see during the demo.

**Terminal 1 — Propagator (start first)**

```bash
npx ts-node apps/propagator-node/src/index.ts
# Expected: "AXL node started — peer 946df8c6... port 9022"
```

**Terminal 2 — Witness**

```bash
npx ts-node apps/witness-node/src/index.ts
# Expected: "AXL node started — peer 23fb5c41... port 9002"
# Expected: "Connected to peer: 946df8c6... (Propagator)"
```

**Terminal 3 — Verifier**

```bash
npx ts-node apps/verifier-node/src/index.ts
# Expected: "AXL node started — peer 7c60360e... port 9012"
# Expected: "Connected to peer: 946df8c6... (Propagator)"
```

**Terminal 4 — Memory**

```bash
npx ts-node apps/memory-node/src/index.ts
# Expected: "AXL node started — peer 87a69f08... port 9032"
# Expected: "Connected to peer: 946df8c6... (Propagator)"
```

**Terminal 5 — Orchestrator**

```bash
npx ts-node -r tsconfig-paths/register apps/orchestrator/src/main.ts
# Expected: "Listening on port 3000"
```

**Terminal 6 — Dashboard**

```bash
cd apps/dashboard && npm run dev
# Expected: "Local: http://localhost:4005"
```

---

## 6. Verify All Services Are Live

Run these checks before testing or recording. All should return 200.

```bash
# Witness Node
curl http://localhost:10002/health
# → {"status":"ok","peer":"23fb5c41...","port":9002}

# Verifier Node
curl http://localhost:10012/health
# → {"status":"ok","peer":"7c60360e...","port":9012}

# Propagator Node
curl http://localhost:10022/health
# → {"status":"ok","peer":"946df8c6...","port":9022}

# Memory Node
curl http://localhost:10032/health
# → {"status":"ok","peer":"87a69f08...","port":9032}

# Orchestrator
curl http://localhost:3000/network/stats
# → {"totalAttestations":0,"activeAgents":0,"disputes":0}

# Dashboard
curl -s -o /dev/null -w "%{http_code}" http://localhost:4005
# → 200
```

---

## 7. End-to-End Test — Full Flow

Run these steps in order. Each step builds on the previous one. Save the values returned — you will need them in later steps.

### Step 1 — Register an Agent (Mint iNFT)

```bash
curl -s -X POST http://localhost:3000/agents \
  -H "Content-Type: application/json" \
  -d '{
    "label": "trading-bot",
    "builderAddress": "0xYOUR_WALLET_ADDRESS",
    "userAddress": "0xYOUR_WALLET_ADDRESS",
    "userPercent": 60,
    "builderPercent": 40
  }' | jq .
```

**Expected response:**

```json
{
  "tokenId": "1",
  "ensName": "trading-bot.aegis.eth",
  "txHash": "0x...",
  "ensip25": {
    "agent.registry": "0x65cB34BCc2941f842Eb5c290d8e8aC24aEa22bbc",
    "agent.id": "0x0000000000000000000000000000000000000001"
  }
}
```

**What this proves:**

- iNFT minted on AgentRegistry.sol (0G testnet)
- ENS subname `trading-bot.aegis.eth` auto-issued via Name Wrapper
- ENSIP-25 text records written (`agent.registry` + `agent.id`)

**Save:** `tokenId` and `ensName` for later steps.

---

### Step 2 — Submit an Attestation (Witness Node via AXL)

Send a decision directly to the Witness Node AXL port. This is what an external agent would do.

```bash
curl -s -X POST http://localhost:9002/send \
  -H "Content-Type: application/json" \
  -H "X-Destination-Peer-Id: 23fb5c412a421117459c2160906f26ccf260cc38cb9e3407fc159ab79e5752b1" \
  -d '{
    "type": "ATTEST_DECISION",
    "agentId": "trading-bot.aegis.eth",
    "inputs": { "context": "wallet 0x1234, balance 0.3 ETH, price ETH/USDC 3200" },
    "reasoning": "Balance below 0.5 ETH threshold. Confidence 0.94. Executing swap to maintain position.",
    "action": { "type": "swap", "amount": "100 USDC", "to": "ETH" },
    "timestamp": '"$(date +%s000)"'
  }' | jq .
```

**Expected response:**

```json
{
  "rootHash": "0xabc123...",
  "status": "COMMITTED",
  "storageRef": "0x...",
  "propagated": true
}
```

**What to watch in terminals:**

- **Witness terminal:** `ATTEST_DECISION received — uploading to 0G Storage`
- **Propagator terminal:** `PROPAGATE_ATTESTATION received — broadcasting to peers`
- **Memory terminal:** `ENS text records updated — trading-bot.aegis.eth`

**Verify on 0G StorageScan:** Go to [storagescan.0g.ai](https://storagescan.0g.ai) and search the `rootHash` — the file should be there.

**Save:** `rootHash` for the dispute step.

---

### Step 3 — Verify AXL Propagation

Confirm the attestation reached the Memory Node via the Propagator.

```bash
curl -s http://localhost:3000/network/stats | jq .
# → {"totalAttestations": 1, "activeAgents": 1, "disputes": 0}

# Also check ENS text records updated on the agent
curl -s http://localhost:3000/agents/label/trading-bot | jq .ensRecords
# → {"aegis.reputation":"100","aegis.totalDecisions":"1","aegis.lastVerdict":"PENDING",...}
```

**What this proves for Gensyn judging:**
Four separate processes, four distinct peer IDs, real AXL message routing. The attestation traveled: Witness → Propagator → Memory Node — across three separate processes with three different peer IDs.

---

### Step 4 — File a Dispute (Trigger Verifier + 0G Compute TEE)

Use the `rootHash` from Step 2.

```bash
curl -s -X POST http://localhost:3000/disputes \
  -H "Content-Type: application/json" \
  -d '{
    "rootHash": "0xabc123...",
    "agentId": "trading-bot.aegis.eth",
    "reason": "Agent swapped without meeting the documented 0.5 ETH minimum threshold check."
  }' | jq .
```

**Expected response:**

```json
{
  "disputeId": "0x...",
  "verdict": "FLAGGED",
  "teeProof": "0x...",
  "txHash": "0x...",
  "keeperRunId": "run_..."
}
```

**What to watch in terminals:**

- **Verifier terminal:** `VERIFY_DECISION received — fetching from 0G Storage`
- **Verifier terminal:** `Replaying via 0G Compute TEE — model: qwen/qwen-2.5-7b-instruct`
- **Verifier terminal:** `TEE proof received — verdict: FLAGGED`
- **Verifier terminal:** `Recording verdict on AegisCourt.sol — tx: 0x...`

**Verify on 0G Explorer:** Go to [chainscan-galileo.0g.ai](https://chainscan-galileo.0g.ai) and search the `txHash` — the verdict transaction should be there.

**Save:** `keeperRunId` for Step 5.

---

### Step 5 — Verify KeeperHub Remedy Executed

After FLAGGED verdict, KeeperHub fires `aegis.execute_remedy` automatically.

```bash
curl -s http://localhost:3000/keeperhub/audit?workflowId=aegis.execute_remedy | jq '.[0]'
```

**Expected response:**

```json
{
  "runId": "run_...",
  "status": "completed",
  "txHash": "0x...",
  "gasUsed": 47823,
  "retryCount": 0,
  "completedAt": 1748900000000
}
```

**What this proves for KeeperHub judging:**
A FLAGGED verdict emitted by AegisCourt.sol automatically triggered the `aegis.execute_remedy` workflow — no manual intervention. The audit trail shows gas used, retry count, and final status.

---

### Step 6 — Verify ENS Reputation Updated

After the FLAGGED verdict and KeeperHub execution, ENS text records should reflect the new state.

```bash
curl -s http://localhost:3000/agents/label/trading-bot | jq .ensRecords
```

**Expected response:**

```json
{
  "aegis.reputation": "72",
  "aegis.totalDecisions": "1",
  "aegis.lastVerdict": "FLAGGED",
  "aegis.flaggedCount": "1",
  "aegis.storageIndex": "0xabc123...",
  "agent.registry": "0x65cB34BCc2941f842Eb5c290d8e8aC24aEa22bbc",
  "agent.id": "0x0000000000000000000000000000000000000001"
}
```

**What this proves for ENS judging:**
Any app — any wallet, any DeFi protocol — can resolve `trading-bot.aegis.eth` and read the live accountability score without touching the Aegis backend at all. ENS is the trust signal.

---

## 8. Dashboard Walkthrough

Open `http://localhost:4005` in a browser with MetaMask installed.

### Screen 1 — Landing Page

- Confirm the animated mesh shows 4 nodes (Witness, Verifier, Propagator, Memory) with the 0G center node in gold
- Click **Register Your Agent** → MetaMask popup → connect wallet

### Screen 2 — Register Agent

- Fill in agent label: `trading-bot`
- Set ownership split: drag slider to 60% user / 40% builder
- Click **Mint iNFT** → MetaMask transaction → confirm
- Confirm ENS subname preview shows `trading-bot.aegis.eth`

### Screen 3 — Overview

- Shows **Total Attestations** counter incrementing
- **Recent Attestations** feed shows `trading-bot.aegis.eth` with FLAGGED badge
- **AXL Node Status** shows all 4 nodes as Online with pulsing green dot
- **Deployed Contracts** shows both contract addresses with link to 0G Explorer

### Screen 4 — Attestation Feed

- Filter by FLAGGED — `trading-bot.aegis.eth` appears
- Root hash visible in monospace
- Timestamp and verdict badge displayed

### Screen 5 — Agent Profile (ENS Profile Card)

- Type `trading-bot` → click **Lookup**
- Score ring shows reputation score (72 after FLAGGED)
- ENS Text Records panel shows all 7 live records
- ENSIP-25 badge confirms `agent.registry` and `agent.id` are set
- **View on ENS App** link opens app.ens.domains

### Screen 6 — Decision Timeline

- Full history shows the attested decision
- Search by `trading-bot` or paste the root hash

### Screen 7 — KeeperHub Audit Trail

- Shows the remedy run with tx hash, gas used (47,823), retry count (0), status: Completed
- Tx hash links to 0G Explorer

---

## 9. Demo Video Script (3 min)

**Setup before recording:**

- All 5 terminals open and visible (use split-screen or a tiling layout)
- Browser open to `http://localhost:4005`
- MetaMask unlocked with funded 0G testnet wallet
- OBS or QuickTime recording at 1080p

---

### 0:00 – 0:20 · The Problem

> "Every agent framework in 2026 solves how agents reason and decide. None of them solve what happens after the agent acts. One bad decision. No receipt. No proof. No appeal. That's the gap. Aegis is the accountability layer."

**Show:** Landing page hero. Point to "Prove every AI decision." headline.

---

### 0:20 – 0:50 · Registration + ENS Identity

> "A builder integrates Aegis with one AXL fetch call. A user registers their agent in under a minute."

**Do:**

1. Click **Register Your Agent**
2. MetaMask connects — show wallet address
3. Switch to Register screen
4. Type `trading-bot`, set split to 60/40, click **Mint iNFT**
5. MetaMask transaction fires — approve it
6. Point to the returned ENS subname: `trading-bot.aegis.eth`

> "On iNFT mint, AgentRegistry.sol calls the ENS Name Wrapper. The subname is issued automatically. ENSIP-25 text records link the name to the registry contract. Zero manual steps."

**Show in terminal:** `ENS subname issued: trading-bot.aegis.eth`

---

### 0:50 – 1:20 · Live Attestation

> "Any agent — OpenClaw, LangChain, CrewAI — submits a decision with one AXL call."

**Do:** Run the attestation curl command from Step 2.

**Show simultaneously:**

- Witness terminal: `ATTEST_DECISION received — uploading to 0G Storage`
- Response in terminal: `"rootHash": "0xabc123..."`
- Switch to dashboard → Attestation Feed → new card appears for `trading-bot.aegis.eth`

> "The decision is committed to 0G Storage permanently. That root hash is a cryptographic receipt — unforgeable proof of exactly what the agent decided and why."

**Optional:** Open [storagescan.0g.ai](https://storagescan.0g.ai), search the root hash, show the file.

---

### 1:20 – 1:50 · AXL Propagation (Gensyn)

> "Four separate AXL nodes. Four distinct ed25519 identity keys. Real encrypted messages over the Yggdrasil mesh. No central coordinator."

**Show:** Pan across all 4 terminal windows. Point to each peer ID:

- Witness: `23fb5c41...`
- Verifier: `7c60360e...`
- Propagator: `946df8c6...`
- Memory: `87a69f08...`

> "The attestation traveled from Witness to Propagator to Memory — three separate processes, three distinct peer IDs. That's the Gensyn autoresearch broadcast pattern applied to accountability signals."

**Show:** Propagator terminal showing `PROPAGATE_ATTESTATION — broadcasting to peers`

---

### 1:50 – 2:20 · Dispute + 0G Compute Verdict

> "Now we file a dispute using the agent's ENS name — not a raw address."

**Do:** Run the dispute curl command from Step 4.

**Show:**

- Verifier terminal: `VERIFY_DECISION received — replaying via 0G Compute TEE`
- Verifier terminal: `TEE proof received — verdict: FLAGGED`
- Verifier terminal: `AegisCourt.sol — tx: 0x...`
- Dashboard → Attestation Feed → badge changes to FLAGGED

> "The Verifier fetched the original record from 0G Storage, ran the exact same model with the exact same inputs, and produced a TEE proof. FLAGGED. Recorded onchain in AegisCourt.sol."

**Optional:** Open [chainscan-galileo.0g.ai](https://chainscan-galileo.0g.ai), search the tx hash.

---

### 2:20 – 2:45 · KeeperHub Remedy

> "When AegisCourt emits the FLAGGED event, KeeperHub fires the remedy automatically."

**Show:** Dashboard → KeeperHub Audit Trail

- Run appears: status Completed, gas 47,823, retries 0
- Tx hash link to 0G Explorer

> "No manual trigger. The aegis.execute_remedy workflow ran, the remedy transaction landed, and the ENS reputation score updated automatically."

---

### 2:45 – 3:00 · ENS as the Trust Signal

> "Now watch this."

**Do:** In Agent Profile screen, type `trading-bot`, click Lookup.

**Show:**

- Score ring: 72 (dropped from 100 after FLAGGED)
- ENS Text Records: `aegis.lastVerdict = FLAGGED`, `aegis.flaggedCount = 1`

> "Any wallet. Any DeFi protocol. Any app. They resolve trading-bot.aegis.eth and see the live accountability score — without touching our backend at all. ENS is now the trust signal for AI agents."

**End frame:** Dashboard overview with all metrics live.

---

## 10. Contracts

Deployed on 0G testnet (chainId 16602).

| Contract          | Address                                      | Explorer                                                                                   |
| ----------------- | -------------------------------------------- | ------------------------------------------------------------------------------------------ |
| AegisCourt.sol    | `0x3De27365b376D43422314899dA0E18042f0F734a` | [View](https://chainscan-galileo.0g.ai/address/0x3De27365b376D43422314899dA0E18042f0F734a) |
| AgentRegistry.sol | `0x65cB34BCc2941f842Eb5c290d8e8aC24aEa22bbc` | [View](https://chainscan-galileo.0g.ai/address/0x65cB34BCc2941f842Eb5c290d8e8aC24aEa22bbc) |

To redeploy:

```bash
cd contracts
npx hardhat run scripts/deploy.ts --network zero-g-testnet
```

---

## 11. Orchestrator API Reference

```
POST /agents
  Body: { label, builderAddress, userAddress, userPercent, builderPercent }
  Returns: { tokenId, ensName, txHash, ensip25 }

GET  /agents/label/:label
  Returns: { agent record + ENS text records }

GET  /agents/owner/:address
  Returns: [ list of iNFTs owned by this wallet ]

POST /attestations
  Body: { type, agentId, inputs, reasoning, action, timestamp }
  Returns: { rootHash, status, storageRef }

POST /disputes
  Body: { rootHash, agentId, reason }
  Returns: { disputeId, verdict, teeProof, txHash, keeperRunId }

GET  /disputes/:rootHash
  Returns: { verdict, teeProof, txHash, timestamp }

GET  /network/stats
  Returns: { totalAttestations, activeAgents, disputes }

GET  /keeperhub/audit?workflowId=aegis.execute_remedy
  Returns: [ { runId, status, txHash, gasUsed, retryCount, completedAt } ]
```

---

## 12. Troubleshooting

**AXL node fails to start**

```bash
# Check the AXL binary is present and executable
ls -la bin/
chmod +x bin/axl
```

**"Cannot connect to peer" in node logs**

- Always start Propagator first — it is the bootstrap peer
- Witness, Verifier, and Memory all connect to Propagator on startup
- Wait for Propagator to log its peer ID before starting the others

**MetaMask shows wrong network**

- Add 0G testnet manually: RPC `https://evmrpc-testnet.0g.ai`, Chain ID `16602`, Symbol `OG`
- Get testnet funds at [faucet.0g.ai](https://faucet.0g.ai)

**0G Storage upload fails**

```bash
# Verify your private key has OG balance
# Check ZG_INDEXER_RPC is reachable
curl https://indexer-storage-testnet-turbo.0g.ai/info
```

**0G Compute TEE replay fails**

```bash
# Verify compute API key
curl https://compute-network-6.integratenetwork.work/v1/proxy/models \
  -H "Authorization: Bearer $ZG_COMPUTE_API_KEY"
```

**KeeperHub workflow not firing**

- Confirm `KEEPERHUB_API_KEY` is set in `.env`
- Verify the `aegis.execute_remedy` workflow exists: `keeperhub.get_workflow({workflowId: "aegis.execute_remedy"})`
- Check the workflow trigger matches `onchain:AegisCourtVerdictEmitted`

**ENS text records not updating**

- Confirm `ENS_PRIVATE_KEY` is the wallet that controls `aegis.eth` (the registrar)
- Confirm the wallet has ETH on mainnet for ENS transactions (or Sepolia for testnet ENS)

---

## Repository Structure

```
apps/
  orchestrator/       NestJS API gateway — agent lifecycle, routing
  witness-node/       AXL :9002 — attestation intake, 0G Storage upload
  verifier-node/      AXL :9012 — 0G Compute TEE replay, verdict
  propagator-node/    AXL :9022 — mesh broadcast (autoresearch pattern)
  memory-node/        AXL :9032 — 0G KV R/W, ENS text record updates
  dashboard/          React — wallet connect, live feed, dispute UI, ENS profiles
packages/
  0g-client/          0G Storage SDK wrapper (KV + file upload/download)
  0g-compute/         OpenAI-compat wrapper → 0G Compute endpoint
  axl-client/         AXL HTTP helpers (send, recv, topology)
  keeper-client/      KeeperHub MCP workflow tools
  ens-client/         ENS subname issuance, text record R/W, ENSIP-25
  types/              Shared TypeScript interfaces
contracts/
  AegisCourt.sol      Dispute submission, verdict storage, remedy event
  AgentRegistry.sol   ERC-7857 iNFT mint + ENS Name Wrapper subname issuance
axl-configs/          AXL node configs + ed25519 private keys
bin/                  Gensyn AXL binary
docs/
  FEEDBACK.md         KeeperHub builder feedback (prize bounty)
  SUBMISSION_CHECKLIST.md
```
