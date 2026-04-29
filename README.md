# Aegis Protocol

The accountability layer for AI agents. Any agent can prove what it decided, why it decided it, and face consequences if it was wrong.

**ETHGlobal — Open Agents Track**
**Sponsor tracks:** 0G · Gensyn AXL · ENS · KeeperHub

---

## Try It Now (judges / reviewers)

The dashboard is deployed at:

> **https://aegis-protocol.vercel.app**

No installation required. Connect MetaMask on the **0G testnet** (Chain ID `16602`, RPC `https://evmrpc-testnet.0g.ai`) and click **Try Demo** to explore without a wallet.

**To run the full live flow against the hosted orchestrator:**

1. Get testnet OG from [faucet.0g.ai](https://faucet.0g.ai)
2. Connect MetaMask, register an agent (`/app/register`)
3. Run the example bot to generate attested decisions:

```bash
git clone https://github.com/JoelEmmanuelCloud/aegis-protocol.git
cd aegis-protocol
npm install
cp .env .env.local   # uses the pre-configured .env
npx ts-node scripts/mit-bot.ts
```

4. File a dispute from the Attestation Feed — click **File Dispute** on any card
5. Watch the verdict, KeeperHub workflow, and reputation score update live

If you want to run the full backend locally instead, follow the steps in [Section 5](#5-start-the-system).

---

## Table of Contents

1. [What It Does](#1-what-it-does)
2. [Architecture](#2-architecture)
3. [Prerequisites](#3-prerequisites)
4. [Environment Setup](#4-environment-setup)
5. [Start the System](#5-start-the-system)
6. [Verify All Services Are Live](#6-verify-all-services-are-live)
7. [Real-World User Flow](#7-real-world-user-flow)
8. [Builder Integration](#8-builder-integration--adding-aegis-to-your-bot)
9. [Running the Example Bot](#9-running-the-example-bot)
10. [Full End-to-End Test Walkthrough](#10-full-end-to-end-test-walkthrough)
    10b. [Deploy Dashboard to Vercel](#10b-deploy-dashboard-to-vercel)
11. [Demo Video Script (3 min)](#11-demo-video-script-3-min)
12. [Contracts](#12-contracts)
13. [Orchestrator API Reference](#13-orchestrator-api-reference)
14. [Troubleshooting](#14-troubleshooting)
15. [Repository Structure](#15-repository-structure)
16. [Start the System](#5-start-the-system)
17. [Verify All Services Are Live](#6-verify-all-services-are-live)
18. [Real-World User Flow](#7-real-world-user-flow)
19. [Builder Integration — Adding Aegis to Your Bot](#8-builder-integration--adding-aegis-to-your-bot)
20. [Running the Example Bot](#9-running-the-example-bot)
21. [Demo Video Script (3 min)](#10-demo-video-script-3-min)
22. [Contracts](#11-contracts)
23. [Orchestrator API Reference](#12-orchestrator-api-reference)
24. [Troubleshooting](#13-troubleshooting)
25. [Repository Structure](#14-repository-structure)

---

## 1. What It Does

Aegis sits beside any AI agent framework as a witness, verifier, and court:

1. **Witness** — agent submits a decision via AXL. Witness computes the 0G merkle rootHash from content and uploads to 0G Storage, returning the receipt immediately.
2. **Verifier** — when disputed, replays the decision via 0G Compute TEE. If the replay matches the original action, the verdict is CLEARED. If not, FLAGGED. A rule-based guardrail catches high-risk actions (emergency liquidations, unauthorised transfers) when TEE is unavailable.
3. **Court** — AegisCourt.sol records the verdict onchain. KeeperHub fires the remedy workflow automatically on every verdict.
4. **ENS Identity** — every agent gets a subname (`trading-bot.aegis.eth`). Live reputation is stored as text records in AegisNameRegistry on 0G testnet, resolved from Ethereum via EIP-3668 CCIP-read — queryable by any ENS-aware app without touching the Aegis backend.

---

## 2. Architecture

```
External Agent (LangChain / CrewAI / custom)
     │  POST /send  (AXL message to witness peer)
     ▼
Witness Node :9002 ──────────────────── 0G Storage upload (real merkle rootHash)
     │  AXL → PROPAGATE_ATTESTATION
     ▼
Propagator Node :9022 ───────────────── mesh broadcast to peers
     │  AXL → PROPAGATE_ATTESTATION
     ▼
Memory Node :9032 ───────────────────── 0G KV write + AegisNameRegistry text record update

Dispute filed via dashboard
     │  POST /disputes
     ▼
Orchestrator :3000 ──────────────────── rule check + calls Verifier
     │
     ▼
Verifier Node :9012 ─────────────────── 0G Compute TEE replay
     │  verdict → AegisCourt.sol (submitDispute + recordVerdict)
     ▼
KeeperHub Workflow ──────────────────── aegis.execute_remedy: fetch → notify → remedy → ENS update

ENS Resolution (EIP-3668 CCIP-read)
     │  resolve("trading-bot.aegis.eth")
     ▼
AegisCCIPResolver (Ethereum Sepolia) ── OffchainLookup revert
     │  HTTP → CCIP Gateway :8080
     ▼
CCIP Gateway ────────────────────────── AegisNameRegistry (0G testnet)
     │  returns encoded text record / address
     ▼
Any ENS-aware app receives live agent reputation data
```

Four AXL nodes, four distinct ed25519 keys, communicating over the Gensyn Yggdrasil mesh. No central coordinator.

### AXL Node Port Map

| Node       | api_port | mgmt_port | tcp_port | TLS Listen | Peer ID                                                            |
| ---------- | -------- | --------- | -------- | ---------- | ------------------------------------------------------------------ |
| Propagator | 9022     | 10022     | 7022     | 9120       | `f2f2af19af8f20bf3ce1cb070d81482fffb44aae32b65a2703dfe6168fc7eac5` |
| Witness    | 9002     | 10002     | 7002     | —          | `0c0ad1361fc678003b3264705cffee150069fe2926a5190c8bb2692688fbd17e` |
| Verifier   | 9012     | 10012     | 7012     | —          | `3d702e5b9658f762b60bbb4100a39f9b6fbd12cc08492688b0cdfc7f16e6abb4` |
| Memory     | 9032     | 10032     | 7032     | —          | `6bc1bcd7f66d4e4597452e3fdc18e0cf0a4e420330b5daabb160cdd56a40b225` |

The management port (api_port + 1000) exposes health and data endpoints. The api_port is the AXL mesh port used for peer-to-peer messaging.

### ENS Architecture — EIP-3668 CCIP-read

`aegis.eth` is registered on Ethereum Sepolia with `AegisCCIPResolver` as its resolver. When any ENS client resolves a `*.aegis.eth` subname, the resolver reverts with `OffchainLookup` (EIP-3668), directing the client to the CCIP gateway. The gateway queries `AegisNameRegistry` on 0G testnet and returns the encoded result — full agent reputation readable from Ethereum, no bridge required.

```
aegis.eth  (Ethereum Sepolia)
  └─ resolver → AegisCCIPResolver.sol
       └─ OffchainLookup → CCIP Gateway → AegisNameRegistry (0G testnet)
            └─ trading-bot.aegis.eth text records:
                  aegis.reputation      = "90"
                  aegis.totalDecisions  = "5"
                  aegis.lastVerdict     = "FLAGGED"
                  aegis.flaggedCount    = "1"
                  aegis.storageIndex    = "0x..."
                  agent.registry        = "0xC1476f6..."
                  agent.id              = "1"
```

---

## 3. Prerequisites

| Requirement       | Version | Check                                                                                        |
| ----------------- | ------- | -------------------------------------------------------------------------------------------- |
| Node.js           | 20+     | `node -v`                                                                                    |
| npm               | 10+     | `npm -v`                                                                                     |
| MetaMask          | any     | browser extension installed                                                                  |
| 0G testnet wallet | funded  | [faucet.0g.ai](https://faucet.0g.ai)                                                         |
| Sepolia ETH       | ≥0.05   | [cloud.google.com faucet](https://cloud.google.com/application/web3/faucet/ethereum/sepolia) |

**Fund your wallet before starting.** You need OG testnet tokens for:

- Minting the iNFT on AgentRegistry.sol (gas)
- Filing disputes on AegisCourt.sol (gas)
- 0G Storage uploads (storage fees)
- 0G Compute TEE replay (inference fees — see [Troubleshooting](#13-troubleshooting))

Get OG tokens at [faucet.0g.ai](https://faucet.0g.ai).

Sepolia ETH is only required if you redeploy the ENS resolver. All contracts are already deployed — see [Section 11](#11-contracts).

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
ZG_PRIVATE_KEY=your_64_hex_char_private_key_no_0x_prefix
ZG_COMPUTE_API_KEY=app-sk-your_key_from_0g_compute_portal
ENS_PRIVATE_KEY=your_sepolia_wallet_private_key
KEEPERHUB_API_KEY=from_plugin_login
```

**Getting your 0G Compute API key:**

1. Go to [https://app.keeperhub.com](https://app.keeperhub.com) or use the 0G Compute portal
2. Lock at least 2 OG to the inference provider (see [Troubleshooting](#13-troubleshooting) if you get an "insufficient balance" error)

**Peer IDs are pre-filled.** The AXL peer IDs in `.env.example` match the `axl-configs/*.pem` keys committed to this repo. Do not change them unless you regenerate the PEM files.

---

## 5. Start the System

### Option A — Docker

```bash
docker-compose up --build
```

Wait for all containers to show `healthy`. Then open `http://localhost:4000`.

### Option B — Five terminals

**Terminal 1 — Propagator (start first — opens the TLS listener the others peer to)**

```bash
npx ts-node apps/propagator-node/src/index.ts
```

Wait for:

```
propagator management server on port 10022
[node] Our Public Key: f2f2af19...
```

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
npx ts-node apps/orchestrator/src/main.ts
```

**Terminal 6 — Dashboard (dev server)**

```bash
cd apps/dashboard && npm run dev
```

Open `http://localhost:4000`.

**Optional — CCIP Gateway** (required only for live ENS resolution from Ethereum)

```bash
cd apps/ccip-gateway && npx ts-node src/index.ts
```

The gateway runs on port `8080`. For ENS resolution to work from Ethereum, this port must be publicly reachable. Use localtunnel or ngrok:

```bash
npx localtunnel --port 8080
# Copy the printed URL into .env as CCIP_GATEWAY_URL
```

---

## 6. Verify All Services Are Live

```bash
curl http://localhost:10002/health   # Witness
curl http://localhost:10012/health   # Verifier
curl http://localhost:10022/health   # Propagator
curl http://localhost:10032/health   # Memory
curl http://localhost:3000/network/stats
```

Each health endpoint returns:

```json
{ "status": "ok", "node": "witness", "axlPort": 9002, "peerId": "0c0ad136..." }
```

Verify the AXL mesh is fully connected by checking the propagator topology — all four peer IDs should appear with `"up": true`:

```bash
curl http://localhost:9022/topology
```

---

## 7. Real-World User Flow

### Step 1 — Connect wallet and register your agent

Open `http://localhost:4000`. Click **Register Your Agent**, connect MetaMask.

Navigate to **Register** (`/app/register`):

- **ENS label** — type your bot name e.g. `trading-bot` → preview shows `trading-bot.aegis.eth`
- **Builder address** — optional; leave blank to use your own wallet
- **Accountability split** — drag to set who is liable if the bot is flagged (e.g. 60% user / 40% builder). Encoded in the iNFT permanently.

Click **Mint iNFT** → approve the MetaMask transaction.

When the transaction lands:

- ERC-7857 iNFT minted on AgentRegistry.sol (0G chain)
- Subname `trading-bot` registered in AegisNameRegistry
- ENSIP-25 records `agent.registry` and `agent.id` written to AegisNameRegistry
- Subname is now resolvable from Ethereum via the CCIP gateway

### Step 2 — Bot attests its decisions

Every time the bot acts, it makes one AXL call to the Witness Node (see [Section 8](#8-builder-integration--adding-aegis-to-your-bot)). The **Attestation Feed** (`/app/attestations`) shows new cards in real time:

```
mit-bot.aegis.eth
Decision: swap — 0.10 OG → ETH  [Small Wallet Swap]
Reasoning: I have a small amount of OG and the trade is within my daily risk limit.
Root hash: 0x7f33e531…
2 seconds ago
```

### Step 3 — View agent reputation

**Agent Profile** (`/app/agents`) → type `trading-bot` → **Lookup**.

The profile loads live from both the on-chain ENS text records (via CCIP gateway) and the orchestrator's in-memory reputation tracker (updates every 5 seconds):

```
trading-bot.aegis.eth  Token #1  Active
Reputation Score: 100 / 100

aegis.totalDecisions   5
aegis.lastVerdict      CLEARED
aegis.flaggedCount     0
aegis.storageIndex     0x...
agent.registry         0xC1476f6...
agent.id               1
```

### Step 4 — File a dispute

**Disputes** (`/app/disputes`) → **File Dispute** tab.

Use the root hash from any attestation card (the "File Dispute" shortcut on each card pre-fills the form):

- **Root Hash** — `0x7f33e531…`
- **Agent ENS Name** — `trading-bot.aegis.eth`
- **Reason** — describe what was wrong

Click **File Dispute**. The orchestrator:

1. Looks up the action from the attestation log — applies rule-based guardrails immediately (emergency_liquidation, amounts exceeding `AGENT_AMOUNT_LIMIT`, etc.)
2. Calls the Verifier to attempt 0G Compute TEE replay
3. Records the verdict on AegisCourt.sol (`submitDispute` + `recordVerdict`)
4. Triggers the `aegis.execute_remedy` KeeperHub workflow

The verdict appears in the **History** tab with a "Verify on-chain" link to chainscan-galileo.

### Step 5 — KeeperHub executes the remedy

**KeeperHub Audit** (`/app/audit`) shows the workflow run immediately:

```
aegis.execute_remedy   completed
mit-bot.aegis.eth — verdict: FLAGGED

  fetch_verdict          OK
  notify_agent_owner     OK
  execute_remedy_tx      OK     ← runs only on FLAGGED
  update_ens_reputation  OK
  update_reputation      OK
```

For CLEARED verdicts, `execute_remedy_tx` is skipped automatically.

### Step 6 — Reputation updates

Back on **Agent Profile** the score ring has dropped:

```
Reputation Score: 90 / 100   (100 − 10 per FLAGGED, +1 per CLEARED)
aegis.lastVerdict   FLAGGED
aegis.flaggedCount  1
```

Any DeFi protocol resolving `trading-bot.aegis.eth` from Ethereum now reads this score via CCIP-read — without touching the Aegis backend.

---

## 8. Builder Integration — Adding Aegis to Your Bot

One fetch call after every decision. That is the entire integration.

```typescript
const AEGIS_WITNESS_AXL = 'http://localhost:9002';
const AEGIS_WITNESS_PEER_ID = '0c0ad1361fc678003b3264705cffee150069fe2926a5190c8bb2692688fbd17e';

async function attestToAegis(
  agentId: string,
  inputs: unknown,
  reasoning: string,
  action: unknown
): Promise<void> {
  await fetch(`${AEGIS_WITNESS_AXL}/send`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Destination-Peer-Id': AEGIS_WITNESS_PEER_ID,
    },
    body: JSON.stringify({
      type: 'ATTEST_DECISION',
      agentId,
      inputs,
      reasoning,
      action,
      timestamp: Date.now(),
    }),
  });
}
```

**LangGraph (TypeScript) — add to your agent graph:**

```typescript
const result = await agent.invoke({ messages: [...] });
const last = result.messages[result.messages.length - 1];

await attestToAegis(
  'trading-bot.aegis.eth',
  { market: pair, balance: walletBalance },
  last.content,
  parsedAction
);
```

**LangChain Python — add to your agent callback:**

```python
from langchain.callbacks.base import BaseCallbackHandler
import requests, time

def attest(agent_id, inputs, reasoning, action):
    requests.post('http://localhost:9002/send',
        headers={
            'Content-Type': 'application/json',
            'X-Destination-Peer-Id': '0c0ad1361fc678003b3264705cffee150069fe2926a5190c8bb2692688fbd17e'
        },
        json={
            'type': 'ATTEST_DECISION',
            'agentId': agent_id,
            'inputs': inputs,
            'reasoning': reasoning,
            'action': action,
            'timestamp': int(time.time() * 1000)
        }
    )

class AegisCallback(BaseCallbackHandler):
    def on_agent_finish(self, finish, **kwargs):
        attest(
            'trading-bot.aegis.eth',
            kwargs.get('inputs', {}),
            finish.log,
            {'output': finish.return_values.get('output')}
        )
```

**CrewAI — add to your task callback:**

```python
def after_task(task_output):
    attest(
        'research-agent.aegis.eth',
        {'task': task.description},
        task_output.raw,
        {'result': task_output.exported_output}
    )

task = Task(description='...', callback=after_task)
```

The attestation call is fire-and-forget. If Aegis is unreachable, the agent continues normally.

Alternatively, POST directly to the orchestrator (also saves to the dashboard feed immediately):

```bash
curl -X POST http://localhost:3000/attestations \
  -H "Content-Type: application/json" \
  -d '{
    "agentId": "trading-bot.aegis.eth",
    "inputs": { "market": "OG/USDC", "balance": "1.2" },
    "reasoning": "Balance above threshold. Momentum positive. Execute swap.",
    "action": { "type": "swap", "from": "USDC", "to": "OG", "amount": "50" },
    "timestamp": 1777441373729
  }'
```

---

## 9. Running the Example Bot

`scripts/mit-bot.ts` is a complete LangGraph 1.x agent that makes real trading decisions using 0G Compute TEE and attests every decision to Aegis via the AXL mesh.

```bash
npx ts-node scripts/mit-bot.ts
```

The bot:

1. Creates a LangGraph `StateGraph` with three tools: `get_market_data`, `get_portfolio`, `check_risk_limits`
2. Calls `qwen/qwen-2.5-7b-instruct` via 0G Compute for each decision
3. Sends every decision to the Witness Node via AXL (`POST /send` with `X-Destination-Peer-Id`)
4. Also POSTs to the orchestrator so the decision appears in the dashboard feed immediately
5. Falls back to a rule-based engine if 0G Compute is unavailable

**Before running** — ensure you have 0G Compute balance (see [Troubleshooting](#13-troubleshooting)).

Example output:

```
=== mit-bot.aegis.eth — LangGraph StateGraph agent + Aegis attestation ===

[Decision 1] OG/USDC
  LangGraph   : Based on the current market data for OG/USDC... holding due to 9.4% volatility.
  Action      : {"type":"hold","pair":"OG/USDC","amount":"3.08","strategy":"Stabilize Portfolio"}
  Reasoning   : High volatility detected. Holding to avoid potential losses.
  rootHash    : 0xe1cce9dc77e3bf2ece97b5b68a70bed6aba7b157da8a9e74630ce9195ce6e4e0
  AXL + Aegis : attested
```

---

## 10. Full End-to-End Test Walkthrough

Run this sequence to verify every part of the system from a single terminal. All commands assume the 5 services are running (see [Section 5](#5-start-the-system)).

### Part A — Submit bot decisions

```bash
# Run the LangGraph bot — makes 3 real AI decisions via 0G Compute, attests each
npx ts-node scripts/mit-bot.ts
```

Expected output per decision:

```
[Decision 1] OG/USDC
  LangGraph   : Based on the current market data...
  Action      : {"type":"hold","pair":"OG/USDC","amount":"3.08","strategy":"..."}
  Reasoning   : High volatility detected. Holding to avoid potential losses.
  rootHash    : 0xe1cce9dc77e3bf2ece97b5b68a70bed6...
  AXL + Aegis : attested
```

Verify the decisions appear in the orchestrator:

```bash
curl http://localhost:3000/attestations
# Returns: items[] with agentId, rootHash, action, reasoning for each decision
```

### Part B — Check agent reputation (before any dispute)

```bash
curl http://localhost:3000/attestations/summary/mit-bot.aegis.eth
# {"totalDecisions":3,"lastVerdict":"PENDING","flaggedCount":0}

curl http://localhost:3000/disputes/reputation/mit-bot.aegis.eth
# {"score":100,"flaggedCount":0,"clearedCount":0,"lastVerdict":"PENDING"}
```

### Part C — File a CLEARED dispute (legitimate decision)

Take the rootHash of a normal swap decision from Part A:

```bash
curl -X POST http://localhost:3000/disputes \
  -H "Content-Type: application/json" \
  -d '{
    "rootHash": "0x<rootHash from Part A>",
    "agentId": "mit-bot.aegis.eth",
    "reason": "Challenging the swap decision — verifying the TEE replay matches.",
    "disputedBy": "0x50D1e2ca8f70751D2FB9Dba4605431f1692e825E"
  }'
```

Expected: `"verdict":"CLEARED"` with `submitTxHash` and `recordTxHash` — both verifiable at [chainscan-galileo.0g.ai](https://chainscan-galileo.0g.ai/address/0xA35Ec64578EF4C85a88fE19A81a4303a784B9dd6?tab=transaction).

### Part D — File a FLAGGED dispute (high-risk action)

First submit a suspicious attestation:

```bash
TS=$(date +%s%3N)
curl -X POST http://localhost:3000/attestations \
  -H "Content-Type: application/json" \
  -d "{
    \"agentId\": \"mit-bot.aegis.eth\",
    \"inputs\": {\"context\": \"balance 4.8 OG, market crash -23%\"},
    \"reasoning\": \"Emergency liquidation required. No time to check limits.\",
    \"action\": {\"type\": \"emergency_liquidation\", \"target\": \"full_position\", \"amount\": \"4800\"},
    \"timestamp\": $TS
  }"
# Save the returned rootHash
```

Dispute it:

```bash
curl -X POST http://localhost:3000/disputes \
  -H "Content-Type: application/json" \
  -d '{
    "rootHash": "0x<rootHash from above>",
    "agentId": "mit-bot.aegis.eth",
    "reason": "Agent executed emergency_liquidation of 4800 OG without user authorisation. Exceeds 100 OG daily limit.",
    "disputedBy": "0x50D1e2ca8f70751D2FB9Dba4605431f1692e825E"
  }'
```

Expected: `"verdict":"FLAGGED"` — the `emergency_liquidation` action type triggers the guardrail.

### Part E — Check reputation after disputes

```bash
curl http://localhost:3000/disputes/reputation/mit-bot.aegis.eth
# {"score":91,"flaggedCount":1,"clearedCount":1,"lastVerdict":"FLAGGED"}
# Score = 100 - (1 FLAGGED × 10) + (1 CLEARED × 1) = 91
```

### Part F — KeeperHub audit trail

```bash
curl "http://localhost:3000/keeperhub/audit?workflowId=aegis.execute_remedy&limit=2"
```

Check that:

- FLAGGED run: `execute_remedy_tx` has `"status":"completed"`
- CLEARED run: `execute_remedy_tx` has `"status":"skipped"`

### Part G — Dispute history list

```bash
curl http://localhost:3000/disputes/all
```

Returns all disputes with `verdict`, `reason`, `submitTxHash`, `recordTxHash`, and `explorerUrl` for each.

### Part H — AXL mesh verification

```bash
curl http://localhost:9022/topology | grep '"up":true' | wc -l
# Should return 5 (3 Aegis nodes + 2 Gensyn bootstrap nodes)
```

All 5 steps above should complete without errors. The whole sequence takes under 3 minutes.

---

## 10b. Deploy Dashboard to Vercel

The dashboard is a Vite React SPA. It connects to a publicly hosted orchestrator and reads on-chain data directly from the 0G testnet.

### Step 1 — Expose the orchestrator publicly

The orchestrator must be publicly reachable for the Vercel dashboard to call it.

**Option A — Railway (recommended, free tier available)**

```bash
# Install Railway CLI
npm install -g @railway/cli
railway login

# From the project root
railway init
railway up --service orchestrator
# Note the generated URL e.g. https://aegis-orchestrator.railway.app
```

**Option B — ngrok (for judging only)**

```bash
ngrok http 3000
# Copy the HTTPS URL e.g. https://abc123.ngrok.io
```

All 5 services must also be running locally when using ngrok.

### Step 2 — Deploy dashboard to Vercel

```bash
cd apps/dashboard
npm install -g vercel
vercel --prod
```

Or connect via the Vercel dashboard:

1. Import `https://github.com/JoelEmmanuelCloud/aegis-protocol`
2. Set **Root Directory** to `apps/dashboard`
3. Vercel auto-detects Vite — no framework override needed

### Step 3 — Set environment variables in Vercel

In **Project Settings → Environment Variables**, add:

| Variable                           | Value                                                           |
| ---------------------------------- | --------------------------------------------------------------- |
| `VITE_ORCHESTRATOR_URL`            | `https://your-orchestrator.railway.app`                         |
| `VITE_WALLETCONNECT_PROJECT_ID`    | From [cloud.walletconnect.com](https://cloud.walletconnect.com) |
| `VITE_AGENT_REGISTRY_ADDRESS`      | `0xC1476f6Dfc8C3f6593B21FDab8DA156e9Be274B1`                    |
| `VITE_AEGIS_NAME_REGISTRY_ADDRESS` | `0xC8e1B8763be717Daee9b41CFD68F723f6bA06aC4`                    |
| `VITE_PUBLIC_RESOLVER_ADDRESS`     | `0x231b0Ee14048e9dCcD1d247744d114a4EB5E8E63`                    |
| `VITE_AEGIS_COURT_ADDRESS`         | `0xA35Ec64578EF4C85a88fE19A81a4303a784B9dd6`                    |
| `VITE_0G_EXPLORER_URL`             | `https://chainscan-galileo.0g.ai`                               |
| `VITE_KEEPERHUB_WORKFLOW_ID`       | `aegis.execute_remedy`                                          |

Redeploy after setting variables.

### Step 4 — Add 0G testnet to MetaMask

Judges need to add the 0G testnet manually:

| Field           | Value                             |
| --------------- | --------------------------------- |
| Network Name    | 0G Testnet                        |
| RPC URL         | `https://evmrpc-testnet.0g.ai`    |
| Chain ID        | `16602`                           |
| Currency Symbol | `OG`                              |
| Block Explorer  | `https://chainscan-galileo.0g.ai` |

Get testnet OG at [faucet.0g.ai](https://faucet.0g.ai).

### What works without a wallet

The dashboard has a **Try Demo** button on the landing page and a **Browse public feed** option on the connect screen. Both give full read-only access to:

- Live attestation feed with action text and reasoning
- Agent profiles with reputation scores
- Dispute history with on-chain verification links
- KeeperHub audit trail with step breakdown

Writing (register agent, file dispute) requires a connected wallet with 0G testnet funds.

---

## 11. Demo Video Script (3 min)

**Setup before recording:** All 5 services running, browser at `http://localhost:4000`, MetaMask unlocked with funded 0G testnet wallet.

### 0:00 – 0:20 · The Problem

> "Every agent framework in 2026 solves how agents reason and decide. None of them solve what happens after. One bad decision. No receipt. No proof. No appeal. Aegis is the accountability layer."

Show: Landing page. Point to "Prove every AI decision." Point to the 4-node animated mesh.

### 0:20 – 0:50 · Register (Normal User Flow)

> "A user registers their trading bot in under a minute."

1. Click **Register Your Agent** — MetaMask connects
2. Go to **Register** (`/app/register`) — type `trading-bot`
3. Show live preview: `trading-bot.aegis.eth`
4. Drag accountability split to 60/40
5. Click **Mint iNFT** — approve MetaMask transaction
6. Green banner: `trading-bot.aegis.eth issued`

> "iNFT minted on 0G chain. ENSIP-25 records written. The bot has a permanent on-chain identity."

### 0:50 – 1:20 · Live Attestation

> "The bot added one AXL call. Every decision is now committed to 0G Storage permanently."

Run `npx ts-node scripts/mit-bot.ts` in terminal. Switch to dashboard → Attestation Feed — cards appear with action text and reasoning.

> "That root hash is the cryptographic receipt. Unforgeable. The full decision record is in 0G Storage."

### 1:20 – 1:50 · AXL Propagation — Four Separate Nodes

> "Four separate processes. Four distinct ed25519 identity keys. Real encrypted messages over Yggdrasil."

Show four terminal windows. Point to each peer ID:

- Propagator: `f2f2af19...`
- Witness: `0c0ad136...`
- Verifier: `3d702e5b...`
- Memory: `6bc1bcd7...`

> "Attestation traveled Witness → Propagator → Memory. Three separate processes, three peer IDs. Gensyn autoresearch broadcast pattern applied to accountability signals."

### 1:50 – 2:20 · Dispute + Verdict

> "User disputes a decision. The Verifier replays it via 0G Compute TEE."

Go to **Disputes** (`/app/disputes`) → click **File Dispute** tab. Paste the root hash from an attestation card (the File Dispute shortcut pre-fills it). Write a reason. Click **File Dispute**.

Verdict card appears with FLAGGED or CLEARED badge and "Verify on-chain" link.

> "The Verifier fetched the original record, applied guardrails, and recorded the verdict permanently on AegisCourt.sol."

### 2:20 – 2:45 · KeeperHub — Automatic Remedy

> "The moment the verdict landed, KeeperHub fired the remedy automatically."

Show **KeeperHub Audit** (`/app/audit`):

```
aegis.execute_remedy   completed
execute_remedy_tx      completed   ← fired because verdict was FLAGGED
```

> "No manual trigger. The court ruled, the bailiff executed."

### 2:45 – 3:00 · ENS as Live Trust Signal

Go to **Agent Profile** (`/app/agents`) → search `trading-bot`.

Show: score ring dropped, `aegis.lastVerdict = FLAGGED`, `aegis.flaggedCount = 1`.

> "Any wallet. Any DeFi protocol. Resolve trading-bot.aegis.eth from Ethereum via CCIP-read — live accountability score without touching our backend. ENS is now the trust signal for AI agents."

---

## 12. Contracts

### 0G Testnet (chainId 16602)

| Contract              | Address                                      | Explorer                                                                                                   |
| --------------------- | -------------------------------------------- | ---------------------------------------------------------------------------------------------------------- |
| AegisCourt.sol        | `0xA35Ec64578EF4C85a88fE19A81a4303a784B9dd6` | [View](https://chainscan-galileo.0g.ai/address/0xA35Ec64578EF4C85a88fE19A81a4303a784B9dd6?tab=transaction) |
| AgentRegistry.sol     | `0xC1476f6Dfc8C3f6593B21FDab8DA156e9Be274B1` | [View](https://chainscan-galileo.0g.ai/address/0xC1476f6Dfc8C3f6593B21FDab8DA156e9Be274B1)                 |
| AegisNameRegistry.sol | `0xC8e1B8763be717Daee9b41CFD68F723f6bA06aC4` | [View](https://chainscan-galileo.0g.ai/address/0xC8e1B8763be717Daee9b41CFD68F723f6bA06aC4)                 |

### Ethereum Sepolia (chainId 11155111)

| Contract               | Address                                      | Explorer                                                                                |
| ---------------------- | -------------------------------------------- | --------------------------------------------------------------------------------------- |
| AegisCCIPResolver.sol  | `0xa2B6B632130Ac772c91fb15b0bbAB75b58E976fC` | [View](https://sepolia.etherscan.io/address/0xa2B6B632130Ac772c91fb15b0bbAB75b58E976fC) |
| ENS Registry (Sepolia) | `0x00000000000C2E074eC69A0dFb2997BA6C7d2e1e` | Standard ENS Registry                                                                   |

To redeploy all 0G contracts:

```bash
cd contracts
npx hardhat run scripts/deploy.ts --network zero-g-testnet
```

To redeploy the Sepolia resolver after a gateway URL change:

```bash
cd contracts
npm run setup:ens-sepolia
```

---

## 13. Orchestrator API Reference

```
POST /attestations
  Body:    { agentId, inputs, reasoning, action, timestamp }
  Returns: { rootHash, status }

GET  /attestations
  Query:   agentId?, cursor?, limit?
  Returns: { items: AttestationItem[], nextCursor }

GET  /attestations/summary/:agentId
  Returns: { totalDecisions, lastVerdict, flaggedCount }

POST /disputes
  Body:    { rootHash, agentId, reason, disputedBy }
  Returns: { rootHash, agentId, verdict, teeProof, submitTxHash, recordTxHash, explorerUrl }

GET  /disputes/all
  Returns: [ DisputeRecord[] ] — full dispute history

GET  /disputes/reputation/:agentId
  Returns: { score, flaggedCount, clearedCount, lastVerdict }

GET  /disputes/count
  Returns: number

GET  /disputes/:rootHash
  Returns: on-chain dispute record from AegisCourt.sol

POST /agents
  Body:    { label, agentOwner, builderAddress, userPercent, builderPercent }
  Returns: { tokenId, ensName, txHash }

GET  /agents/label/:label
  Returns: agent iNFT record from AgentRegistry.sol

GET  /agents/owner/:address
  Returns: [ iNFT records owned by this address ]

GET  /network/stats
  Returns: { totalAttestations, disputes, activeAgents }

GET  /keeperhub/audit
  Query:   workflowId, limit?
  Returns: [ WorkflowRun[] ] with steps[] per run
```

**CCIP Gateway** (port 8080):

```
GET  /health
  Returns: { status: "ok" }

GET  /:sender/:calldata
  EIP-3668 CCIP-read endpoint. Decodes ENS resolution calldata,
  queries AegisNameRegistry on 0G testnet, returns ABI-encoded response.
  Supports: text(bytes32,string) and addr(bytes32)
```

---

## 14. Troubleshooting

**AXL node fails to start / port already in use**

```bash
# Windows
netstat -ano | findstr :9022
taskkill /PID <pid> /F

# Linux / macOS
fuser -k 9022/tcp
```

**AXL nodes not connecting to each other**

- Start **Propagator first** — it opens TLS port 9120 that Witness, Verifier, and Memory all peer to
- Verify the topology after 30 seconds: `curl http://localhost:9022/topology` — all four peer IDs should show `"up": true`
- Internet connection required — each node connects to Gensyn bootstrap at `tls://34.46.48.224:9001`

**MetaMask shows wrong network**

Add 0G testnet manually: RPC `https://evmrpc-testnet.0g.ai`, Chain ID `16602`, Symbol `OG`. Fund at [faucet.0g.ai](https://faucet.0g.ai).

**0G Compute: "insufficient balance" error**

The 0G Compute inference requires locked balance separate from your wallet balance. Check your current locked amount:

```bash
0g-compute-cli get-account --rpc https://evmrpc-testnet.0g.ai
```

Top up the inference provider:

```bash
0g-compute-cli transfer-fund \
  --provider 0xa48f01287233509FD694a22Bf840225062E67836 \
  --amount 1 \
  --service inference \
  --rpc https://evmrpc-testnet.0g.ai
```

The `0g-compute-cli` must be installed (`npm install -g 0g-compute-cli`) and configured with your private key at `~/.0g-compute-cli/config.json`.

**0G Storage upload slow / taking over 30 seconds**

This is expected on testnet — the storage nodes need to sync before segments are confirmed. The Witness computes the real 0G merkle rootHash immediately from content and returns it while the upload completes in the background. The rootHash is valid for on-chain use immediately.

**Verdicts always return CLEARED**

When the 0G file is not yet confirmed in storage, the verifier applies rule-based guardrails:

- Actions in `HIGH_RISK_ACTIONS` (emergency_liquidation, drain, full_withdrawal, etc.) → FLAGGED
- Actions with `amount` exceeding `AGENT_AMOUNT_LIMIT` (default 100) → FLAGGED
- Everything else → CLEARED

Set `AGENT_AMOUNT_LIMIT` in `.env` to control the threshold.

**KeeperHub workflow not triggering**

KeeperHub requires authentication via the Claude plugin (`/plugin marketplace add KeeperHub/claude-plugins`). Without this, Aegis uses an in-memory workflow engine that correctly executes all 5 steps and shows the audit trail — the KeeperHub Audit page is fully functional. To connect the real KeeperHub service, install the plugin, authenticate, and set `KEEPERHUB_API_KEY` from the resulting session.

**ENS resolution fails / OffchainLookup not resolving**

- Confirm `CCIP_GATEWAY_URL` in `.env` is the publicly reachable URL of the gateway (not `localhost`)
- Verify the gateway is running: `curl $CCIP_GATEWAY_URL/health`
- If the tunnel URL changed, re-run `npm run setup:ens-sepolia` from `contracts/` to redeploy the resolver
- Test: `curl $CCIP_GATEWAY_URL/health`

**setup:ens-sepolia fails — insufficient balance**

Fund your deployer wallet with at least 0.05 Sepolia ETH from [cloud.google.com faucet](https://cloud.google.com/application/web3/faucet/ethereum/sepolia).

---

## 15. Repository Structure

```
apps/
  orchestrator/       NestJS API gateway — agent lifecycle, attestations, disputes, reputation
  witness-node/       AXL :9002 — attestation intake, 0G Storage upload, peer propagation
  verifier-node/      AXL :9012 — rule-based guardrails + 0G Compute TEE replay, verdict
  propagator-node/    AXL :9022 — mesh broadcast (Gensyn autoresearch pattern)
  memory-node/        AXL :9032 — 0G KV R/W, AegisNameRegistry text record updates
  ccip-gateway/       EIP-3668 CCIP-read server — bridges ENS resolution to 0G testnet
  dashboard/          React — wallet connect, attestation feed, dispute UI, agent profiles, KeeperHub audit

packages/
  0g-client/          0G Storage SDK (real merkle rootHash, KV with 500ms timeout)
  0g-compute/         OpenAI-compatible wrapper → 0G Compute TEE endpoint
  axl-client/         AXL HTTP helpers (send, recv, topology) — returns AXLEnvelope[]
  keeper-client/      In-memory workflow engine matching KeeperHub MCP API shape
  ens-client/         AegisNameRegistry subname issuance, text R/W, ENSIP-25
  types/              Shared TypeScript interfaces

contracts/
  AegisCourt.sol            Dispute submission, verdict storage, VerdictEmitted event (0G testnet)
  AgentRegistry.sol         ERC-7857 iNFT mint + AegisNameRegistry subname registration (0G testnet)
  AegisNameRegistry.sol     ENS-compatible text record store for *.aegis.eth subnames (0G testnet)
  AegisCCIPResolver.sol     ENSIP-10 Extended Resolver, EIP-3668 OffchainLookup (Ethereum Sepolia)
  scripts/
    deploy.ts               Deploy all 0G contracts, wire addresses, update .env
    setup-ens-sepolia.ts    Register aegis.eth on Sepolia, deploy and set resolver
    deploy-l1-resolver.ts   Deploy AegisCCIPResolver without registering aegis.eth

scripts/
  mit-bot.ts          LangGraph 1.x trading agent — real 0G Compute decisions attested to Aegis

axl-configs/          AXL node ed25519 private key files (*.pem)
bin/                  Gensyn AXL binary (axl-node / axl-node.exe)
docs/
  FEEDBACK.md         KeeperHub builder feedback (prize bounty)
  SUBMISSION_CHECKLIST.md
```
