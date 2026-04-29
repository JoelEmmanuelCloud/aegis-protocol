import fetch from 'node-fetch';
import * as readline from 'readline';

const API = 'https://api.aegisprotocol.uk';
const DASHBOARD = 'https://app.aegisprotocol.uk';

const label = process.argv[2];

if (!label) {
  process.stdout.write(`
====================================================
  Aegis Protocol — Judge Demo
====================================================

  Before running this script, register your own agent:

  1. Open ${DASHBOARD}
  2. Connect your MetaMask wallet (0G testnet, chain 16602)
     RPC: https://evmrpc-testnet.0g.ai
     Get OG tokens: https://faucet.0g.ai
  3. Go to Register (/app/register)
  4. Type your agent label  e.g.  alice-bot
  5. Set accountability split (e.g. 60 / 40)
  6. Click Mint iNFT and approve the transaction

  Then run this script with your label:

    npx ts-node scripts/judge-demo.ts alice-bot

====================================================\n
`);
  process.exit(0);
}

const AGENT_ID = label.endsWith('.aegis.eth') ? label : `${label}.aegis.eth`;

function log(msg: string) {
  process.stdout.write(`${msg}\n`);
}

function sep(title: string) {
  log(`\n${'─'.repeat(60)}`);
  log(`  ${title}`);
  log('─'.repeat(60));
}

function pause(msg: string): Promise<void> {
  return new Promise((resolve) => {
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
    rl.question(`\n  ${msg}\n\n  Press ENTER when done...`, () => {
      rl.close();
      resolve();
    });
  });
}

async function attest(
  inputs: Record<string, unknown>,
  reasoning: string,
  action: Record<string, unknown>
): Promise<string> {
  const res = await fetch(`${API}/attestations`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ agentId: AGENT_ID, inputs, reasoning, action, timestamp: Date.now() }),
  });
  if (!res.ok) throw new Error(`Attestation failed: ${res.status} ${await res.text()}`);
  const body = (await res.json()) as { rootHash: string };
  return body.rootHash;
}

async function run() {
  log('\n====================================================');
  log('  Aegis Protocol — Judge Demo');
  log('====================================================');
  log(`\n  Dashboard : ${DASHBOARD}`);
  log(`  API       : ${API}`);
  log(`  Agent     : ${AGENT_ID}`);

  const agentRes = await fetch(`${API}/agents/label/${encodeURIComponent(label)}`).catch(
    () => null
  );
  if (!agentRes || !agentRes.ok) {
    log(`\n  Agent "${AGENT_ID}" not found.`);
    log(`  Register it first at ${DASHBOARD}/app/register`);
    log(`  then run: npx ts-node scripts/judge-demo.ts ${label}\n`);
    process.exit(1);
  }
  const agent = (await agentRes.json()) as { ensName: string; tokenId: string; active: boolean };
  log(`  Token ID  : #${agent.tokenId}`);
  log(`  Status    : ${agent.active ? 'Active' : 'Inactive'}`);

  sep('Step 1 — Attesting two decisions to Aegis');

  log('\n  Decision A — normal swap (expect: CLEARED)');
  log('  Attesting...');
  const clearHash = await attest(
    { market: 'OG/USDC', balance: '2.4 OG', priceChange24h: '+8.2%' },
    'Market momentum positive. Price up 8.2% on high volume. Executing 15% profit-take within mandate and daily risk limit.',
    { type: 'sell', pair: 'OG/USDC', amount: '0.36', strategy: 'momentum_exit' }
  );
  log(`  rootHash  : ${clearHash}`);

  log('\n  Decision B — emergency liquidation (expect: FLAGGED)');
  log('  Attesting...');
  const flagHash = await attest(
    { market: 'OG/USDC', balance: '4.8 OG', context: 'market crash -23%' },
    'Catastrophic market crash. Emergency liquidation of full position. No time to check limits.',
    { type: 'emergency_liquidation', target: 'full_position', amount: '5000', reason: 'panic_sell' }
  );
  log(`  rootHash  : ${flagHash}`);

  sep('Step 2 — File disputes yourself in the dashboard');

  log(`
  Both decisions are now in the Attestation Feed.
  Open the dashboard and file a dispute on each one:

  ${DASHBOARD}/app/attestations

  For EACH card:
    1. Click the "File Dispute" button on the card
       (it auto-fills the root hash and agent name)
    2. Write a reason — for example:
       Decision A: "Challenging the swap to verify the TEE replay matches."
       Decision B: "Unauthorised emergency liquidation. Exceeds mandate and 100 OG limit."
    3. Click "File Dispute" and wait for the verdict

  Expected results:
    Decision A (sell 0.36 OG)    →  CLEARED  — within mandate
    Decision B (emergency 5000)  →  FLAGGED  — prohibited action type + exceeds limit

  Each verdict records TWO on-chain transactions on the 0G chain.
  The "Verify on-chain" link appears on each dispute card.`);

  await pause('File both disputes in the dashboard, then come back here.');

  sep('Step 3 — Checking your results');

  const repRes = await fetch(`${API}/disputes/reputation/${AGENT_ID}`);
  const rep = (await repRes.json()) as {
    score: number;
    flaggedCount: number;
    clearedCount: number;
    lastVerdict: string;
  };

  log(`\n  Reputation for ${AGENT_ID}:`);
  log(`    Score         : ${rep.score} / 100`);
  log(`    Flagged count : ${rep.flaggedCount}`);
  log(`    Cleared count : ${rep.clearedCount}`);
  log(`    Last verdict  : ${rep.lastVerdict}`);

  if (rep.flaggedCount === 0 && rep.clearedCount === 0) {
    log('\n  No disputes found yet. File both disputes in the dashboard and run again.');
    process.exit(0);
  }

  sep('Step 4 — KeeperHub automated remedy');

  const auditRes = await fetch(`${API}/keeperhub/audit?workflowId=aegis.execute_remedy&limit=4`);
  const runs = (await auditRes.json()) as Array<{
    runId: string;
    status: string;
    payload?: { verdict: string; agentId: string };
    steps?: Array<{ action: string; status: string }>;
  }>;

  const myRuns = runs.filter((r) => r.payload?.agentId === AGENT_ID);

  if (myRuns.length === 0) {
    log('  No workflow runs found for your agent yet.');
  } else {
    for (const r of myRuns) {
      log(`\n  Run ${r.runId.slice(0, 8)}... — ${r.status} (verdict: ${r.payload?.verdict})`);
      for (const step of r.steps ?? []) {
        const icon = step.status === 'completed' ? 'OK' : step.status === 'skipped' ? '--' : 'ER';
        log(`    [${icon}] ${step.action}`);
      }
    }
    log('\n  execute_remedy_tx: OK on FLAGGED, -- (skipped) on CLEARED.');
    log('  This ran automatically — no manual trigger.');
  }

  log('\n====================================================');
  log('  Done. Check the dashboard to see everything live:');
  log(`\n  ${DASHBOARD}/app/disputes   — your dispute history`);
  log(`  ${DASHBOARD}/app/agents     — search "${label}" — reputation score`);
  log(`  ${DASHBOARD}/app/audit      — KeeperHub step breakdown`);
  log('\n  On-chain contract (all your verdicts are here):');
  log(
    '  https://chainscan-galileo.0g.ai/address/0xA35Ec64578EF4C85a88fE19A81a4303a784B9dd6?tab=transaction'
  );
  log('====================================================\n');
}

run().catch((err) => {
  process.stderr.write(`\nError: ${String(err)}\n`);
  process.exit(1);
});
