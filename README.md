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
7. [Real-World User Flow](#7-real-world-user-flow)
8. [Builder Integration — Adding Aegis to Your Bot](#8-builder-integration--adding-aegis-to-your-bot)
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
4. **ENS Identity** — every agent gets a subname (`trading-bot.aegis.eth`). Live reputation is stored as ENS text records — queryable by any app without touching the Aegis backend.

---

## 2. Architecture

```
External Agent (LangChain / Claude / CrewAI)
     │  POST /send  (AXL message)
     ▼
Witness Node :9002 ──────────────────── 0G Storage (file + KV)
     │  AXL → PROPAGATE_ATTESTATION
     ▼
Propagator Node :9022 ───────────────── mesh broadcast to peers
     │  AXL → PROPAGATE_ATTESTATION
     ▼
Memory Node :9032 ───────────────────── 0G KV write + ENS text record update

Dispute filed via dashboard
     │  AXL → VERIFY_DECISION
     ▼
Verifier Node :9012 ─────────────────── 0G Compute TEE replay
     │  verdict → AegisCourt.sol
     ▼
KeeperHub Workflow ──────────────────── onchain remedy + ENS reputation update
```

Four AXL nodes, four distinct ed25519 keys, communicating over the Yggdrasil mesh. No central coordinator.

Each node runs its own `axl-node` binary with a unique `api_port` (HTTP API), `tcp_port` (internal gVisor TCP), and connects to peers via `tls://` URIs. The Propagator opens a dedicated TLS listen port (`9120`) so the other three nodes can peer to it directly in addition to joining the public Gensyn bootstrap overlay.

### AXL Node Port Map

| Node       | api\_port | tcp\_port | Management | TLS Listen | Peer ID                                                            |
| ---------- | --------- | --------- | ---------- | ---------- | ------------------------------------------------------------------ |
| Propagator | 9022      | 7022      | 10022      | 9120       | `946df8c688343d09d1600388a08582b4fa6cf8b30a01d493851428f03e78bc6f` |
| Witness    | 9002      | 7002      | 10002      | —          | `23fb5c412a421117459c2160906f26ccf260cc38cb9e3407fc159ab79e5752b1` |
| Verifier   | 9012      | 7012      | 10012      | —          | `7c60360ef2c5e4d236d56c413db50054bbc3dcfecb190968d0324a1a40a7f0f1` |
| Memory     | 9032      | 7032      | 10032      | —          | `87a69f086122c7232d9dbca90797d5d47836c2c83869cf4a93f5148b962aa6c4` |

### AXL Config Format

```json
{
  "PrivateKeyPath": "axl-configs/<node>.pem",
  "Peers": ["tls://127.0.0.1:9120", "tls://34.46.48.224:9001", "tls://136.111.135.206:9001"],
  "Listen": ["tls://0.0.0.0:9120"],
  "api_port": 9022,
  "tcp_port": 7022
}
```

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
git clone https://github.com/JoelEmmanuelCloud/aegis-protocol.git
cd aegis-protocol
npm install
cp .env.example .env
```

Open `.env` and fill in these four values — everything else is pre-configured:

```bash
ZG_PRIVATE_KEY=0x...your_64_hex_char_private_key
ZG_COMPUTE_API_KEY=app-sk-...your_key_here
ENS_PRIVATE_KEY=0x...your_private_key_here
KEEPERHUB_API_KEY=...your_key_here
```

**One value to copy manually after starting the Propagator:**

When the Propagator starts it prints its peer ID:

```
[node] Our Public Key: 946df8c6...
```

Copy that value into `.env`:

```bash
AXL_PROPAGATOR_PEER_ID=946df8c688343d09d1600388a08582b4fa6cf8b30a01d493851428f03e78bc6f
```

Then start Witness, Verifier, and Memory. They use this peer ID to address AXL messages to the Propagator.

---

## 5. Start the System

### Option A — Docker (recommended for demo recording)

```bash
docker-compose up --build
```

Wait for all containers to show `healthy`:

```
axl-propagator   | AXL node started — peer 946df8c6...  port 9022
axl-witness      | AXL node started — peer 23fb5c41...  port 9002
axl-verifier     | AXL node started — peer 7c60360e...  port 9012
axl-memory       | AXL node started — peer 87a69f08...  port 9032
orchestrator     | Listening on port 3000
dashboard        | Local: http://localhost:4000
```

### Option B — Local terminals (5 windows)

**Terminal 1 — Propagator (start first)**

```bash
npx ts-node apps/propagator-node/src/index.ts
```

Wait for:

```
propagator management server on port 10022
[node] Gensyn Node Started!
[node] Our Public Key: 946df8c6...
```

Copy the public key into `.env` as `AXL_PROPAGATOR_PEER_ID` before starting the other nodes.

**Terminal 2 — Witness**

```bash
npx ts-node apps/witness-node/src/index.ts
```

**Terminal 3 — Verifier**

```bash
npx ts-node apps/verifier-node/src/index.ts
```

**Terminal 4 — Memory**

```bash
npx ts-node apps/memory-node/src/index.ts
```

**Terminal 5 — Orchestrator**

```bash
npx ts-node -r tsconfig-paths/register apps/orchestrator/src/main.ts
```

**Terminal 6 — Dashboard**

```bash
cd apps/dashboard && npm run dev
```

Open `http://localhost:4000` in your browser.

---

## 6. Verify All Services Are Live

```bash
curl http://localhost:10002/health   # Witness
curl http://localhost:10012/health   # Verifier
curl http://localhost:10022/health   # Propagator
curl http://localhost:10032/health   # Memory
curl http://localhost:3000/network/stats
curl -s -o /dev/null -w "%{http_code}" http://localhost:4000
```

All should return 200 before proceeding.

---

## 7. Real-World User Flow

This is the full story from a user's perspective — starting at the browser, ending with a live accountability score on ENS. No terminals required for the user. The dashboard drives everything.

---

### Step 1 — Land on the Dashboard

Open `http://localhost:4000`.

The landing page shows:
- **Animated mesh** of 4 nodes (Witness :9002, Verifier :9012, Propagator :9022, Memory :9032) connected to 0G Storage at the center
- **Live counters** — Total Attestations, Active Agents, Verdicts Issued — animating on scroll
- A floating attestation card showing `trading-bot.aegis.eth · CLEARED · 2s ago`
- The hero headline: **"Prove every AI decision."**
- Two buttons: **Register Your Agent** and **View Docs**
- A "How It Works" section explaining Witness → Verify → Enforce
- A code snippet showing the one AXL call a builder adds to their bot

The dashboard also has a **Try Demo** button for judges who want to explore without a wallet.

---

### Step 2 — Connect Your Wallet

Click **Register Your Agent**.

MetaMask (or any injected wallet) opens automatically. Approve the connection. The dashboard redirects to `/app` — the main interface.

> If you don't have MetaMask, click **Try Demo** instead. The dashboard loads pre-seeded data so you can explore every screen without a wallet or live backend.

---

### Step 3 — Register Your Bot

In the left sidebar, click **Register Agent** (or navigate to `/app/register`).

You see a registration form with three fields:

**ENS Label** — type your bot's name, e.g. `trading-bot`

The preview below updates live:
```
trading-bot.aegis.eth
Owner: 0xYourWallet…
```

**Builder Address** *(optional)* — if a developer built the bot, paste their wallet address here. Leave blank to use your own.

**Accountability Split** — drag the slider to set who is accountable if the bot is ever flagged:
- 100% / 0% — you take full responsibility
- 60% / 40% — you and the builder share it (recommended if using a third-party bot)
- 0% / 100% — the builder is fully accountable

This split is encoded permanently in the iNFT contract at mint time. It cannot be changed later.

Click **Mint iNFT**.

MetaMask opens with a transaction to `AgentRegistry.sol` on the 0G testnet. Approve it.

While confirming, the button shows **Confirming on-chain…**

When the transaction lands, a green banner appears:

```
Agent registered
trading-bot.aegis.eth issued
```

What just happened behind the scenes:
- `AgentRegistry.sol` minted an ERC-7857 iNFT linked to your wallet
- The contract called the ENS Name Wrapper and auto-issued `trading-bot.aegis.eth`
- ENSIP-25 text records (`agent.registry` and `agent.id`) were written to the ENS name
- Your agent now has a permanent, human-readable identity on ENS

---

### Step 4 — Your Bot Starts Making Decisions

Now tell your bot's developer (or add it yourself — see [Section 8](#8-builder-integration--adding-aegis-to-your-bot)) to send each decision to Aegis after it acts.

Every time the bot decides something, one AXL call is made to the Witness Node. Within seconds, the **Attestation Feed** (`/app/attestations`) shows a new card:

```
trading-bot.aegis.eth
Decision: swap — 100 USDC → ETH
Root hash: 0xabc123…d4f9
Verdict:   PENDING
2 seconds ago
```

The attestation has been:
1. Committed to **0G Storage** permanently (the root hash is the cryptographic receipt)
2. Propagated across the AXL mesh (Witness → Propagator → Memory)
3. Stored in **0G KV** under `aegis:trading-bot.aegis.eth:history`
4. Reflected in ENS text records: `aegis.totalDecisions` increments by 1

The **Overview** screen (`/app`) shows the running totals updating in real time.

---

### Step 5 — Check Your Agent's Reputation

In the sidebar, click **Agent Profile** (`/app/agents`).

Type `trading-bot` in the search field and press **Lookup**.

The profile card loads:

```
trading-bot.aegis.eth
Reputation Score: 100 / 100     [score ring, full green]

ENS Text Records
──────────────────────────────────────────
aegis.reputation      100
aegis.totalDecisions  1
aegis.lastVerdict     PENDING
aegis.flaggedCount    0
aegis.storageIndex    0xabc123…
agent.registry        0x65cB34BCc2941f842Eb5c290d8e8aC24aEa22bbc
agent.id              0x0000000000000000000000000000000000000001

[ ENSIP-25 VERIFIED ]   [ View on ENS App ↗ ]
```

Any app in the world — any wallet, any DeFi protocol — can resolve `trading-bot.aegis.eth` and read these records without touching the Aegis backend.

---

### Step 6 — File a Dispute

You notice the bot swapped tokens without meeting the documented minimum balance threshold. You want to dispute that decision.

In the sidebar, click **File Dispute** (`/app/disputes`).

The dispute form has two fields:

**Agent ENS Name** — type `trading-bot.aegis.eth`

**Root Hash** — paste the root hash from the attestation card (e.g. `0xabc123…`). This is the exact decision you are disputing.

**Reason** — describe what was wrong: `Agent swapped without meeting the 0.5 ETH minimum threshold check.`

Click **Submit Dispute**.

The dashboard shows a progress indicator while the Verifier works:

```
Fetching decision from 0G Storage…
Replaying via 0G Compute TEE (qwen/qwen-2.5-7b-instruct)…
TEE proof received…
Recording verdict on AegisCourt.sol…
```

The verdict card appears:

```
Verdict: FLAGGED
TEE Proof: 0x...
AegisCourt tx: 0x...
```

What happened:
- The Verifier fetched the original decision record from 0G Storage by root hash
- It ran the exact same model (`qwen/qwen-2.5-7b-instruct`) with the exact same inputs in a 0G Compute TEE
- The model's output did not match what the agent actually did → **FLAGGED**
- The verdict was recorded permanently on `AegisCourt.sol`
- `AegisCourt.sol` emitted a `VerdictEmitted` event onchain

---

### Step 7 — KeeperHub Executes the Remedy Automatically

You did not trigger anything. KeeperHub was watching `AegisCourt.sol` for `VerdictEmitted` events.

The moment the event landed, the `aegis.execute_remedy` workflow fired automatically:

1. Fetched the verdict
2. Notified the agent owner
3. Executed the remedy transaction onchain
4. Updated ENS reputation

In the sidebar, click **KeeperHub Audit** (`/app/audit`).

The audit trail shows:

```
Workflow: aegis.execute_remedy
Status:   Completed
Run ID:   run_...
Tx Hash:  0x...  [link to 0G Explorer]
Gas Used: 47,823
Retries:  0
Completed: just now
```

No manual intervention. The court ruled, the bailiff executed.

---

### Step 8 — ENS Reputation Updates

Go back to **Agent Profile** (`/app/agents`) and look up `trading-bot` again.

The score ring has changed:

```
trading-bot.aegis.eth
Reputation Score: 90 / 100     [score ring, slightly reduced]

ENS Text Records
──────────────────────────────────────────
aegis.reputation      90
aegis.totalDecisions  1
aegis.lastVerdict     FLAGGED
aegis.flaggedCount    1
aegis.storageIndex    0xabc123…
```

Any DeFi protocol that resolves `trading-bot.aegis.eth` now sees this score — without calling the Aegis API. ENS is the trust signal.

---

### The Full Loop in 60 Seconds

| What the user does | What Aegis does |
|---|---|
| Opens dashboard at `http://localhost:4000` | Landing page loads with live mesh animation |
| Clicks **Register Your Agent**, connects MetaMask | Wallet connects, redirected to `/app` |
| Types `trading-bot`, sets 60/40 split, clicks **Mint iNFT** | iNFT minted on 0G chain, `trading-bot.aegis.eth` auto-issued, ENSIP-25 records written |
| Bot makes a decision | One AXL call → 0G Storage commit → AXL mesh propagation → ENS text records updated |
| Views **Attestation Feed** | Live card: root hash, verdict badge, timestamp |
| Views **Agent Profile** → types `trading-bot` | ENS text records loaded live, ENSIP-25 verified |
| Opens **File Dispute**, pastes root hash, submits | Verifier replays via 0G Compute TEE, verdict returned, AegisCourt.sol records it |
| KeeperHub fires | `aegis.execute_remedy` runs automatically, tx lands, audit trail appears |
| Views **KeeperHub Audit** | tx hash, gas used (47,823), retries (0), status: Completed |
| Views **Agent Profile** again | Score dropped from 100 → 90, `aegis.lastVerdict = FLAGGED` |

---

## 8. Builder Integration — Adding Aegis to Your Bot

Aegis works with any agent framework. Add one call after every decision. That is the entire integration.

### JavaScript / TypeScript (Claude, LangChain.js, OpenClaw)

```typescript
const AEGIS_WITNESS_URL = "http://localhost:9002";
const AEGIS_WITNESS_PEER_ID = "23fb5c412a421117459c2160906f26ccf260cc38cb9e3407fc159ab79e5752b1";

async function attestToAegis(agentId: string, inputs: unknown, reasoning: string, action: unknown) {
  await fetch(`${AEGIS_WITNESS_URL}/send`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Destination-Peer-Id": AEGIS_WITNESS_PEER_ID
    },
    body: JSON.stringify({
      type:      "ATTEST_DECISION",
      agentId,
      inputs,
      reasoning,
      action,
      timestamp: Date.now()
    })
  });
}
```

**LangChain.js example — add to your agent's action handler:**

```typescript
const result = await agent.invoke({ input: userMessage });

await attestToAegis(
  "trading-bot.aegis.eth",
  { userMessage, context: agent.memory.chatHistory },
  result.intermediateSteps.map(s => s.observation).join("\n"),
  { type: "llm_response", output: result.output }
);
```

**Claude tool use example — add after each tool call:**

```typescript
const response = await claude.messages.create({ ... });

for (const block of response.content) {
  if (block.type === "tool_use") {
    await attestToAegis(
      "claude-agent.aegis.eth",
      { messages: requestMessages },
      response.content.find(b => b.type === "text")?.text ?? "",
      { tool: block.name, input: block.input }
    );
  }
}
```

### Python (LangChain, CrewAI, custom agents)

```python
import requests
import time

AEGIS_WITNESS_URL = "http://localhost:9002"
AEGIS_WITNESS_PEER_ID = "23fb5c412a421117459c2160906f26ccf260cc38cb9e3407fc159ab79e5752b1"

def attest_to_aegis(agent_id: str, inputs: dict, reasoning: str, action: dict):
    requests.post(
        f"{AEGIS_WITNESS_URL}/send",
        headers={
            "Content-Type": "application/json",
            "X-Destination-Peer-Id": AEGIS_WITNESS_PEER_ID
        },
        json={
            "type":      "ATTEST_DECISION",
            "agentId":   agent_id,
            "inputs":    inputs,
            "reasoning": reasoning,
            "action":    action,
            "timestamp": int(time.time() * 1000)
        }
    )
```

**LangChain Python example — add to your agent executor callback:**

```python
from langchain.callbacks.base import BaseCallbackHandler

class AegisCallback(BaseCallbackHandler):
    def on_agent_finish(self, finish, **kwargs):
        attest_to_aegis(
            agent_id="trading-bot.aegis.eth",
            inputs={"input": kwargs.get("inputs", {})},
            reasoning=finish.log,
            action={"output": finish.return_values.get("output")}
        )

agent_executor = AgentExecutor(agent=agent, tools=tools, callbacks=[AegisCallback()])
```

**CrewAI example — add to your task callback:**

```python
from crewai import Task

def after_task(task_output):
    attest_to_aegis(
        agent_id="research-agent.aegis.eth",
        inputs={"task": task.description},
        reasoning=task_output.raw,
        action={"result": task_output.exported_output}
    )

task = Task(description="...", callback=after_task)
```

The attestation call is fire-and-forget. If Aegis is unreachable, the agent continues normally. Aegis does not block the agent's critical path.

---

## 9. Demo Video Script (3 min)

**Setup before recording:**
- All 5 terminals open and visible (tiled layout)
- Browser at `http://localhost:4000`
- MetaMask unlocked with funded 0G testnet wallet

---

### 0:00 – 0:20 · The Problem

> "Every agent framework in 2026 solves how agents reason and decide. None of them solve what happens after the agent acts. One bad decision. No receipt. No proof. No appeal. Aegis is the accountability layer."

**Show:** Landing page. Point to "Prove every AI decision." Point to the animated mesh of 4 nodes.

---

### 0:20 – 0:50 · Register a Bot (Normal User Flow)

> "A user goes to the dashboard and registers their trading bot in under a minute."

**Do:**
1. Click **Register Your Agent** — MetaMask opens, connect wallet
2. Navigate to **Register Agent** (`/app/register`)
3. Type `trading-bot` in the ENS label field — show the live preview: `trading-bot.aegis.eth`
4. Drag the accountability split to 60/40
5. Click **Mint iNFT** — MetaMask transaction fires — approve it
6. Green banner appears: `trading-bot.aegis.eth issued`

> "iNFT minted on 0G chain. ENS subname auto-issued via Name Wrapper. ENSIP-25 text records written. The bot has a permanent, human-readable identity — no manual steps."

---

### 0:50 – 1:20 · Live Attestation

> "The bot's developer added one AXL call. Now every decision is committed to 0G Storage permanently."

**Show in terminal:** The Witness Node receiving and logging the attestation.

**Switch to dashboard → Attestation Feed** — new card appears:
```
trading-bot.aegis.eth · swap 100 USDC → ETH · 0xabc123… · PENDING · 2s ago
```

> "That root hash is a cryptographic receipt. Unforgeable. Anyone can verify the exact decision the bot made and why — forever."

---

### 1:20 – 1:50 · AXL Propagation (Four Separate Nodes)

> "Four separate processes. Four distinct ed25519 identity keys. Real encrypted messages over Yggdrasil."

**Pan across all 4 terminal windows.** Point to each peer ID:
- Propagator: `946df8c6...`
- Witness: `23fb5c41...`
- Verifier: `7c60360e...`
- Memory: `87a69f08...`

> "The attestation traveled from Witness to Propagator to Memory — three separate processes, three peer IDs. That is the Gensyn autoresearch broadcast pattern applied to accountability signals."

---

### 1:50 – 2:20 · Dispute + 0G Compute Verdict

> "Now a user disputes the decision. They use the ENS name — not a raw address."

**Do:** Go to **File Dispute** (`/app/disputes`). Type `trading-bot.aegis.eth`. Paste the root hash. Write a reason. Click **Submit Dispute**.

**Show dashboard progress:**
```
Fetching from 0G Storage…
Replaying via 0G Compute TEE…
TEE proof received — FLAGGED
Recording on AegisCourt.sol…
```

**Dashboard → Attestation Feed:** badge flips to **FLAGGED**.

> "The Verifier fetched the original record, ran the same model with the same inputs, got a different result. FLAGGED. Recorded permanently onchain."

---

### 2:20 – 2:45 · KeeperHub Remedy — No Manual Trigger

> "The moment AegisCourt emitted the verdict event, KeeperHub fired the remedy automatically."

**Show → KeeperHub Audit** (`/app/audit`):
```
aegis.execute_remedy · Completed · gas 47,823 · retries 0 · tx: 0x…
```

> "No manual trigger. No cron job. The court ruled, KeeperHub executed, the tx landed."

---

### 2:45 – 3:00 · ENS as the Live Trust Signal

> "Watch this."

**Go to Agent Profile** (`/app/agents`). Type `trading-bot`. Click **Lookup**.

**Show:**
- Score ring: dropped from 100
- `aegis.lastVerdict = FLAGGED`
- `aegis.flaggedCount = 1`

> "Any wallet. Any DeFi protocol. Any app. They resolve trading-bot.aegis.eth and see the live accountability score — without touching our backend at all. ENS is now the trust signal for AI agents."

**End frame:** Overview screen with all metrics live.

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

For developers integrating directly with the orchestrator API.

```
POST /agents
  Body:    { label, builderAddress, userAddress, userPercent, builderPercent }
  Returns: { tokenId, ensName, txHash, ensip25 }

GET  /agents/label/:label
  Returns: { agent record + live ENS text records }

GET  /agents/owner/:address
  Returns: [ list of iNFTs owned by this wallet ]

POST /attestations
  Body:    { type, agentId, inputs, reasoning, action, timestamp }
  Returns: { rootHash, status, storageRef }

POST /disputes
  Body:    { rootHash, agentId, reason }
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

**AXL node fails to start / port already in use**

Each node kills any existing process on its port before spawning. If you still see a bind error:

```bash
# Windows
netstat -ano | findstr :9022
taskkill /PID <pid> /F

# Linux/macOS
fuser -k 9022/tcp
```

**AXL nodes not finding each other**

- Always start **Propagator first** — it opens TLS port `9120` that other nodes peer to
- Copy the Propagator's `Our Public Key` into `.env` as `AXL_PROPAGATOR_PEER_ID` before starting the other three
- Internet connection required — each node joins the public Gensyn bootstrap overlay at `tls://34.46.48.224:9001`

**MetaMask shows wrong network**

Add 0G testnet manually: RPC `https://evmrpc-testnet.0g.ai`, Chain ID `16602`, Symbol `OG`. Get testnet funds at [faucet.0g.ai](https://faucet.0g.ai).

**0G KV returns empty data (no private key)**

The dashboard shows empty stats when `ZG_PRIVATE_KEY` is not set or is a placeholder. Set a valid 64-character hex Ethereum private key in `.env`. The key must have OG testnet balance.

**0G Storage upload fails**

```bash
curl https://indexer-storage-testnet-turbo.0g.ai/info
```

Verify your wallet has OG balance and `ZG_INDEXER_RPC` is reachable.

**0G Compute TEE replay fails**

```bash
curl https://api.0g.ai/v1/models \
  -H "Authorization: Bearer $ZG_COMPUTE_API_KEY"
```

Verify the compute API key is valid and has credits.

**KeeperHub workflow not firing**

- Confirm `KEEPERHUB_API_KEY` is set in `.env`
- Verify the `aegis.execute_remedy` workflow exists in your KeeperHub account
- The workflow trigger must be `onchain:AegisCourtVerdictEmitted`

**ENS text records not updating**

- `ENS_PRIVATE_KEY` must be the wallet that controls the `aegis.eth` registrar
- The wallet needs ETH on the ENS deployment network for record update transactions

---

## Repository Structure

```
apps/
  orchestrator/       NestJS API gateway — agent lifecycle, routing
  witness-node/       AXL :9002 — attestation intake, 0G Storage upload
  verifier-node/      AXL :9012 — 0G Compute TEE replay, verdict
  propagator-node/    AXL :9022 — mesh broadcast (autoresearch pattern)
  memory-node/        AXL :9032 — 0G KV R/W, ENS text record updates
  dashboard/          React — wallet connect, registration, live feed, dispute UI, ENS profiles
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
