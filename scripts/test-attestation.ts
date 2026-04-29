import fetch from 'node-fetch';

const WITNESS_MGMT_URL = 'http://localhost:10002';
const WITNESS_AXL_URL = 'http://localhost:9002';

const AGENT_ID = 'mit-bot.aegis.eth';

const WITNESS_PEER_ID =
  process.env.AXL_WITNESS_PEER_ID ??
  '0c0ad1361fc678003b3264705cffee150069fe2926a5190c8bb2692688fbd17e';

async function checkHealth(): Promise<void> {
  const res = await fetch(`${WITNESS_MGMT_URL}/health`);
  const body = await res.json();
  console.log('[health]', JSON.stringify(body, null, 2));
}

async function attestDirect(): Promise<string> {
  const payload = {
    type: 'ATTEST_DECISION',
    agentId: AGENT_ID,
    inputs: {
      context: 'wallet 0x50D1e2ca8f70751D2FB9Dba4605431f1692e825E, balance 1.2 OG',
      market: 'OG/USDC',
    },
    reasoning:
      'Balance above 0.5 threshold. Market momentum positive. Confidence 0.91. Execute swap.',
    action: {
      type: 'swap',
      from: 'USDC',
      to: 'OG',
      amount: '50',
    },
    timestamp: Date.now(),
  };

  const res = await fetch(`${WITNESS_MGMT_URL}/attest`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`/attest failed ${res.status}: ${text}`);
  }

  const body = (await res.json()) as { rootHash: string; status: string };
  console.log('[direct /attest]', JSON.stringify(body, null, 2));
  return body.rootHash;
}

async function attestViaAXL(): Promise<void> {
  const payload = {
    type: 'ATTEST_DECISION',
    agentId: AGENT_ID,
    inputs: {
      context: 'wallet 0x50D1e2ca8f70751D2FB9Dba4605431f1692e825E, balance 0.8 OG',
      market: 'OG/ETH',
    },
    reasoning: 'Rebalance triggered by threshold breach. Confidence 0.87. Route via AXL mesh.',
    action: {
      type: 'rebalance',
      target: 'OG/ETH',
      amount: '25',
    },
    timestamp: Date.now(),
  };

  const res = await fetch(`${WITNESS_AXL_URL}/send`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Destination-Peer-Id': WITNESS_PEER_ID,
    },
    body: JSON.stringify(payload),
  });

  const text = await res.text();
  console.log('[AXL /send] status:', res.status, '| body:', text || '(empty)');
}

async function checkNetworkStats(): Promise<void> {
  const res = await fetch('http://localhost:3000/network/stats');
  if (!res.ok) {
    console.log('[network/stats] orchestrator not reachable — skip');
    return;
  }
  const body = await res.json();
  console.log('[network/stats]', JSON.stringify(body, null, 2));
}

async function main(): Promise<void> {
  console.log('=== Aegis Witness Integration Test ===');
  console.log('Agent:', AGENT_ID);
  console.log('Witness peer ID:', WITNESS_PEER_ID);
  console.log('');

  console.log('--- Health check ---');
  await checkHealth();

  console.log('\n--- Direct attestation (management port 10002) ---');
  const rootHash = await attestDirect();
  console.log('Root hash returned:', rootHash);

  console.log('\n--- AXL attestation (AXL port 9002) ---');
  await attestViaAXL();

  console.log('\n--- Network stats (orchestrator port 3000) ---');
  await checkNetworkStats();

  console.log('\n=== Done ===');
  console.log('Check the Attestation Feed at http://localhost:4000/app/attestations');
  console.log('Look up the agent at http://localhost:4000/app/agents (search: mit-bot)');
}

main().catch((err) => {
  console.error('Test failed:', err);
  process.exit(1);
});
