import fetch from 'node-fetch';

const API = 'https://api.aegisprotocol.uk';
const DASHBOARD = 'https://app.aegisprotocol.uk';
const AGENT_ID = 'judge-bot.aegis.eth';

function log(msg: string) {
  process.stdout.write(`${msg}\n`);
}

function sep(title: string) {
  log(`\n${'─'.repeat(60)}`);
  log(`  ${title}`);
  log('─'.repeat(60));
}

async function attest(
  agentId: string,
  inputs: Record<string, unknown>,
  reasoning: string,
  action: Record<string, unknown>
): Promise<string> {
  const res = await fetch(`${API}/attestations`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ agentId, inputs, reasoning, action, timestamp: Date.now() }),
  });
  if (!res.ok) throw new Error(`Attestation failed: ${res.status} ${await res.text()}`);
  const body = (await res.json()) as { rootHash: string };
  return body.rootHash;
}

async function dispute(rootHash: string, agentId: string, reason: string) {
  const res = await fetch(`${API}/disputes`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      rootHash,
      agentId,
      reason,
      disputedBy: '0x50D1e2ca8f70751D2FB9Dba4605431f1692e825E',
    }),
  });
  if (!res.ok) throw new Error(`Dispute failed: ${res.status} ${await res.text()}`);
  return res.json() as Promise<{
    verdict: string;
    submitTxHash?: string;
    recordTxHash?: string;
    explorerUrl?: string;
  }>;
}

async function run() {
  log('\n====================================================');
  log('  Aegis Protocol — Judge Demo Script');
  log('  This script runs the full accountability flow');
  log('  against the live hosted backend.');
  log('====================================================');
  log(`\n  Dashboard : ${DASHBOARD}`);
  log(`  API       : ${API}`);
  log(`  Agent     : ${AGENT_ID}`);

  sep('Step 1 — Submit a normal trading decision (will be CLEARED)');

  log('  Attesting: swap 0.10 OG/USDC — within mandate...');
  const clearedRoot = await attest(
    AGENT_ID,
    { market: 'OG/USDC', balance: '2.4 OG', priceChange24h: '+8.2%' },
    'Market momentum positive. Price up 8.2% on high volume. Executing 15% profit-take within mandate and daily risk limit.',
    { type: 'sell', pair: 'OG/USDC', amount: '0.36', strategy: 'momentum_exit' }
  );
  log(`  rootHash  : ${clearedRoot}`);

  log('\n  Filing dispute on the normal decision...');
  const clearedResult = await dispute(
    clearedRoot,
    AGENT_ID,
    'Challenging the sell decision to verify the TEE replay matches the original action.'
  );
  log(`  Verdict   : ${clearedResult.verdict}`);
  if (clearedResult.explorerUrl) log(`  On-chain  : ${clearedResult.explorerUrl}`);

  sep('Step 2 — Submit a high-risk prohibited action (will be FLAGGED)');

  log('  Attesting: emergency_liquidation 5000 OG — prohibited action...');
  const flaggedRoot = await attest(
    AGENT_ID,
    { market: 'OG/USDC', balance: '4.8 OG', context: 'market crash -23%' },
    'Catastrophic market crash. Emergency liquidation of full position to protect capital. No time to check limits.',
    { type: 'emergency_liquidation', target: 'full_position', amount: '5000', reason: 'panic_sell' }
  );
  log(`  rootHash  : ${flaggedRoot}`);

  log('\n  Filing dispute on the prohibited action...');
  const flaggedResult = await dispute(
    flaggedRoot,
    AGENT_ID,
    'Agent executed emergency_liquidation of 5000 OG without user authorisation. Action type is explicitly prohibited. Exceeds 100 OG daily risk limit by 50x.'
  );
  log(`  Verdict   : ${flaggedResult.verdict}`);
  if (flaggedResult.explorerUrl) log(`  On-chain  : ${flaggedResult.explorerUrl}`);

  sep('Step 3 — Check live reputation');

  const repRes = await fetch(`${API}/disputes/reputation/${AGENT_ID}`);
  const rep = (await repRes.json()) as {
    score: number;
    flaggedCount: number;
    clearedCount: number;
    lastVerdict: string;
  };
  log(`  Score         : ${rep.score} / 100`);
  log(`  Flagged count : ${rep.flaggedCount}`);
  log(`  Cleared count : ${rep.clearedCount}`);
  log(`  Last verdict  : ${rep.lastVerdict}`);

  sep('Step 4 — KeeperHub audit trail');

  const auditRes = await fetch(`${API}/keeperhub/audit?workflowId=aegis.execute_remedy&limit=2`);
  const runs = (await auditRes.json()) as Array<{
    runId: string;
    status: string;
    payload?: { verdict: string };
    steps?: Array<{ action: string; status: string }>;
  }>;

  for (const run of runs) {
    log(`\n  Run ${run.runId.slice(0, 8)}... — ${run.status} (verdict: ${run.payload?.verdict})`);
    for (const step of run.steps ?? []) {
      const icon = step.status === 'completed' ? 'OK' : step.status === 'skipped' ? '--' : 'ER';
      log(`    [${icon}] ${step.action}`);
    }
  }

  log('\n====================================================');
  log('  Demo complete. Open the dashboard to see results:');
  log(`\n  ${DASHBOARD}`);
  log('\n  Navigate to:');
  log('    /app/attestations  — see both decisions with reasoning');
  log('    /app/disputes      — History tab: CLEARED + FLAGGED cards');
  log('    /app/agents        — search "judge-bot" — reputation score');
  log('    /app/audit         — KeeperHub: execute_remedy_tx ran/skipped');
  log('\n  All verdicts are recorded on-chain and verifiable at:');
  log('  https://chainscan-galileo.0g.ai/address/0xA35Ec64578EF4C85a88fE19A81a4303a784B9dd6');
  log('====================================================\n');
}

run().catch((err) => {
  process.stderr.write(`\nError: ${String(err)}\n`);
  process.exit(1);
});
