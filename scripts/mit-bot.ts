import 'dotenv/config';
import fetch from 'node-fetch';
import OpenAI from 'openai';

const AGENT_ID = 'mit-bot.aegis.eth';
const WITNESS_AXL_URL = `http://127.0.0.1:${process.env.AXL_WITNESS_PORT ?? 9002}`;
const WITNESS_PEER_ID = process.env.AXL_WITNESS_PEER_ID ?? '';
const ORCHESTRATOR_URL = `http://localhost:${process.env.PORT ?? 3000}`;

const DECISION_INTERVAL_MS = 15_000;
const MAX_DECISIONS = 5;

interface MarketSnapshot {
  pair: string;
  price: number;
  balance: number;
  priceChange24h: number;
  volume24h: number;
  gasPrice: number;
}

interface AgentDecision {
  action: Record<string, unknown>;
  reasoning: string;
}

function sampleMarket(): MarketSnapshot {
  const pairs = ['OG/USDC', 'OG/ETH', 'ETH/USDC'];
  const pair = pairs[Math.floor(Math.random() * pairs.length)];
  return {
    pair,
    price: 0.8 + Math.random() * 1.4,
    balance: 0.3 + Math.random() * 4.7,
    priceChange24h: (Math.random() - 0.5) * 20,
    volume24h: 50000 + Math.random() * 450000,
    gasPrice: 10 + Math.random() * 40,
  };
}

function ruleBasedDecision(market: MarketSnapshot): AgentDecision {
  const { pair, price, balance, priceChange24h, volume24h, gasPrice } = market;

  if (balance < 0.5) {
    return {
      action: { type: 'hold', reason: 'insufficient_balance', pair },
      reasoning: `Balance ${balance.toFixed(2)} OG is below the 0.5 minimum threshold. Holding position to avoid dust transactions. Gas price ${gasPrice.toFixed(0)} gwei.`,
    };
  }

  if (priceChange24h < -10) {
    return {
      action: { type: 'buy', pair, amount: (balance * 0.2).toFixed(2), strategy: 'dip_buy' },
      reasoning: `${pair} is down ${Math.abs(priceChange24h).toFixed(1)}% in 24h. Applying dip-buying strategy with 20% of balance (${(balance * 0.2).toFixed(2)} OG). Volume ${(volume24h / 1000).toFixed(0)}K confirms liquidity.`,
    };
  }

  if (priceChange24h > 8 && volume24h > 200000) {
    return {
      action: { type: 'sell', pair, amount: (balance * 0.15).toFixed(2), strategy: 'momentum_exit' },
      reasoning: `${pair} up ${priceChange24h.toFixed(1)}% on high volume (${(volume24h / 1000).toFixed(0)}K). Taking 15% profit (${(balance * 0.15).toFixed(2)} OG) via momentum-exit strategy. Price at ${price.toFixed(3)}.`,
    };
  }

  const amount = (balance * 0.1).toFixed(2);
  return {
    action: { type: 'swap', from: pair.split('/')[1], to: pair.split('/')[0], amount, pair },
    reasoning: `${pair} at ${price.toFixed(3)} with balanced momentum (${priceChange24h > 0 ? '+' : ''}${priceChange24h.toFixed(1)}%). Executing standard 10% rebalance (${amount} units). Volume ${(volume24h / 1000).toFixed(0)}K, gas ${gasPrice.toFixed(0)} gwei.`,
  };
}

async function llmDecision(market: MarketSnapshot): Promise<AgentDecision | null> {
  const baseURL = process.env.ZG_COMPUTE_BASE_URL;
  const apiKey = process.env.ZG_COMPUTE_API_KEY;
  const model = process.env.ZG_COMPUTE_MODEL ?? 'qwen/qwen-2.5-7b-instruct';

  if (!baseURL || !apiKey) return null;

  try {
    const client = new OpenAI({ baseURL, apiKey });
    const prompt = `You are a DeFi trading agent. Given this market snapshot, decide what action to take. Respond with JSON only.

Market: ${JSON.stringify(market)}

Respond with exactly this JSON shape:
{"action":{"type":"buy|sell|swap|hold","pair":"${market.pair}","amount":"<number>"},"reasoning":"<1-2 sentences explaining the decision>"}`;

    const response = await client.chat.completions.create({
      model,
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 150,
    });

    const text = response.choices[0]?.message?.content ?? '';
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return null;

    return JSON.parse(jsonMatch[0]) as AgentDecision;
  } catch {
    return null;
  }
}

async function sendAttestation(decision: AgentDecision, market: MarketSnapshot): Promise<void> {
  const payload = {
    type: 'ATTEST_DECISION',
    agentId: AGENT_ID,
    inputs: {
      pair: market.pair,
      price: market.price,
      balance: market.balance,
      priceChange24h: market.priceChange24h,
      volume24h: market.volume24h,
      gasPrice: market.gasPrice,
    },
    reasoning: decision.reasoning,
    action: decision.action,
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

  if (!res.ok) throw new Error(`AXL send failed: ${res.status}`);
}

async function sendViaOrchestrator(decision: AgentDecision, market: MarketSnapshot): Promise<string> {
  const res = await fetch(`${ORCHESTRATOR_URL}/attestations`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      agentId: AGENT_ID,
      inputs: {
        pair: market.pair,
        price: market.price,
        balance: market.balance,
        priceChange24h: market.priceChange24h,
        volume24h: market.volume24h,
        gasPrice: market.gasPrice,
      },
      reasoning: decision.reasoning,
      action: decision.action,
      timestamp: Date.now(),
    }),
  });

  if (!res.ok) throw new Error(`Orchestrator error: ${res.status}`);
  const body = (await res.json()) as { rootHash: string };
  return body.rootHash;
}

async function checkWitness(): Promise<boolean> {
  try {
    const res = await fetch(`http://localhost:${parseInt(process.env.AXL_WITNESS_PORT ?? '9002') + 1000}/health`);
    return res.ok;
  } catch {
    return false;
  }
}

async function run(): Promise<void> {
  process.stdout.write(`\n=== mit-bot.aegis.eth — Aegis-accountable trading agent ===\n`);
  process.stdout.write(`Orchestrator : ${ORCHESTRATOR_URL}\n`);
  process.stdout.write(`Witness AXL  : ${WITNESS_AXL_URL}\n`);
  process.stdout.write(`Peer ID      : ${WITNESS_PEER_ID.slice(0, 16)}...\n\n`);

  const witnessUp = await checkWitness();
  if (!witnessUp) {
    process.stderr.write('Witness node is not running. Start all services first.\n');
    process.exit(1);
  }

  for (let i = 1; i <= MAX_DECISIONS; i++) {
    const market = sampleMarket();
    process.stdout.write(`[Decision ${i}/${MAX_DECISIONS}] Market: ${market.pair} @ ${market.price.toFixed(3)} (${market.priceChange24h > 0 ? '+' : ''}${market.priceChange24h.toFixed(1)}% 24h)\n`);

    const llm = await llmDecision(market);
    const decision = llm ?? ruleBasedDecision(market);
    const source = llm ? '0G Compute TEE' : 'rule-based engine';

    process.stdout.write(`  Decision    : ${JSON.stringify(decision.action)} [${source}]\n`);
    process.stdout.write(`  Reasoning   : ${decision.reasoning.slice(0, 100)}...\n`);

    let rootHash = '';
    try {
      await sendAttestation(decision, market);
      process.stdout.write(`  AXL send    : delivered to witness mesh\n`);
    } catch {
      process.stdout.write(`  AXL send    : failed, using orchestrator fallback\n`);
    }

    try {
      rootHash = await sendViaOrchestrator(decision, market);
      process.stdout.write(`  rootHash    : ${rootHash}\n`);
    } catch (err) {
      process.stdout.write(`  Orchestrator: ${String(err).slice(0, 60)}\n`);
    }

    process.stdout.write('\n');

    if (i < MAX_DECISIONS) {
      await new Promise((resolve) => setTimeout(resolve, DECISION_INTERVAL_MS));
    }
  }

  process.stdout.write('=== Bot completed. Check dashboard: http://localhost:4000/app/attestations ===\n');
  process.stdout.write(`=== Agent profile: http://localhost:4000/app/agents (search: mit-bot) ===\n\n`);
}

run().catch((err) => {
  process.stderr.write(`Bot crashed: ${String(err)}\n`);
  process.exit(1);
});
