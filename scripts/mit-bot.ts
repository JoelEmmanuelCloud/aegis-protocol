import 'dotenv/config';
import fetch from 'node-fetch';
import { ChatOpenAI } from '@langchain/openai';
import { tool } from '@langchain/core/tools';
import { HumanMessage } from '@langchain/core/messages';
import { StateGraph, MessagesAnnotation, END, START } from '@langchain/langgraph';
import { ToolNode } from '@langchain/langgraph/prebuilt';
import { z } from 'zod';

const AGENT_ID = 'mit-bot.aegis.eth';
const WITNESS_AXL_URL = `http://127.0.0.1:${process.env.AXL_WITNESS_PORT ?? 9002}`;
const WITNESS_PEER_ID = process.env.AXL_WITNESS_PEER_ID ?? '';
const ORCHESTRATOR_URL = `http://localhost:${process.env.PORT ?? 3000}`;
const AMOUNT_LIMIT = parseFloat(process.env.AGENT_AMOUNT_LIMIT ?? '100');

const llm = new ChatOpenAI({
  model: process.env.ZG_COMPUTE_MODEL ?? 'qwen/qwen-2.5-7b-instruct',
  apiKey: process.env.ZG_COMPUTE_API_KEY ?? 'placeholder',
  configuration: {
    baseURL: process.env.ZG_COMPUTE_BASE_URL,
    defaultHeaders: { Authorization: `Bearer ${process.env.ZG_COMPUTE_API_KEY}` },
  },
  temperature: 0.3,
  maxTokens: 250,
});

const getMarketData = tool(
  async ({ pair }: { pair: string }) => {
    const price = 0.8 + Math.random() * 1.4;
    const change = (Math.random() - 0.5) * 20;
    const volume = 50000 + Math.random() * 450000;
    const balance = 0.5 + Math.random() * 4.5;
    return JSON.stringify({
      pair,
      price: price.toFixed(3),
      priceChange24h: change.toFixed(2),
      volume24h: Math.round(volume),
      walletBalance: balance.toFixed(2),
    });
  },
  {
    name: 'get_market_data',
    description: 'Get current market price, 24h change, volume, and wallet balance for a trading pair.',
    schema: z.object({ pair: z.string().describe('Trading pair e.g. OG/USDC') }),
  }
);

const getPortfolio = tool(
  async () =>
    JSON.stringify({
      OG: (Math.random() * 5).toFixed(2),
      USDC: (Math.random() * 500).toFixed(2),
      ETH: (Math.random() * 0.5).toFixed(4),
    }),
  {
    name: 'get_portfolio',
    description: 'Get current portfolio balances across all held assets.',
    schema: z.object({}),
  }
);

const checkRiskLimits = tool(
  async ({ amount }: { action: string; amount: number }) => {
    const allowed = amount <= AMOUNT_LIMIT;
    return JSON.stringify({
      allowed,
      limit: AMOUNT_LIMIT,
      reason: allowed ? 'within_daily_limit' : `exceeds_daily_limit_of_${AMOUNT_LIMIT}`,
    });
  },
  {
    name: 'check_risk_limits',
    description: 'Check whether a proposed action and amount is within the agent risk parameters.',
    schema: z.object({
      action: z.string().describe('Action type: buy, sell, swap, hold'),
      amount: z.number().describe('Amount in base units'),
    }),
  }
);

const tools = [getMarketData, getPortfolio, checkRiskLimits];
const toolNode = new ToolNode(tools);
const llmWithTools = llm.bindTools(tools);

function shouldContinue({ messages }: typeof MessagesAnnotation.State) {
  const last = messages[messages.length - 1];
  if ('tool_calls' in last && Array.isArray((last as { tool_calls: unknown[] }).tool_calls) && (last as { tool_calls: unknown[] }).tool_calls.length > 0) {
    return 'tools';
  }
  return END;
}

async function callModel({ messages }: typeof MessagesAnnotation.State) {
  const response = await llmWithTools.invoke(messages);
  return { messages: [response] };
}

function buildAgent() {
  const graph = new StateGraph(MessagesAnnotation)
    .addNode('agent', callModel)
    .addNode('tools', toolNode)
    .addEdge(START, 'agent')
    .addConditionalEdges('agent', shouldContinue)
    .addEdge('tools', 'agent');
  return graph.compile();
}

async function attestToAegis(
  action: Record<string, unknown>,
  reasoning: string,
  inputs: Record<string, unknown>
): Promise<string> {
  const payload = { agentId: AGENT_ID, inputs, reasoning, action, timestamp: Date.now() };

  fetch(`${WITNESS_AXL_URL}/send`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-Destination-Peer-Id': WITNESS_PEER_ID },
    body: JSON.stringify({ type: 'ATTEST_DECISION', ...payload }),
  }).catch(() => {});

  const res = await fetch(`${ORCHESTRATOR_URL}/attestations`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const body = (await res.json()) as { rootHash: string };
  return body.rootHash;
}

function ruleFallback(pair: string): { action: Record<string, unknown>; reasoning: string; inputs: Record<string, unknown> } {
  const price = 0.8 + Math.random() * 1.4;
  const change = (Math.random() - 0.5) * 20;
  const balance = 0.5 + Math.random() * 4.5;
  const inputs = { pair, price, priceChange24h: change, walletBalance: balance };

  if (change < -10) {
    return {
      action: { type: 'buy', pair, amount: (balance * 0.2).toFixed(2), strategy: 'dip_buy' },
      reasoning: `${pair} down ${Math.abs(change).toFixed(1)}% — dip-buying 20% of balance (${(balance * 0.2).toFixed(2)} OG).`,
      inputs,
    };
  }
  if (change > 8) {
    return {
      action: { type: 'sell', pair, amount: (balance * 0.15).toFixed(2), strategy: 'momentum_exit' },
      reasoning: `${pair} up ${change.toFixed(1)}% on momentum — taking 15% profit (${(balance * 0.15).toFixed(2)} OG).`,
      inputs,
    };
  }
  return {
    action: { type: 'swap', pair, amount: (balance * 0.1).toFixed(2), strategy: 'rebalance' },
    reasoning: `${pair} neutral at ${price.toFixed(3)} — standard 10% rebalance (${(balance * 0.1).toFixed(2)} OG).`,
    inputs,
  };
}

async function runDecision(agent: ReturnType<typeof buildAgent>, pair: string, index: number): Promise<void> {
  process.stdout.write(`\n[Decision ${index}] ${pair}\n`);

  let action: Record<string, unknown> = { type: 'hold', pair };
  let reasoning = '';
  let inputs: Record<string, unknown> = { pair };

  try {
    const result = await agent.invoke({
      messages: [
        new HumanMessage(
          `You are mit-bot, a DeFi trading agent on 0G Chain. ` +
          `Use your tools: check the ${pair} market, get your portfolio, verify risk limits, then decide ONE action. ` +
          `End your final answer with this JSON on its own line: ` +
          `{"action":{"type":"<buy|sell|swap|hold>","pair":"${pair}","amount":"<number>","strategy":"<name>"},"reasoning":"<2 sentences>"}`
        ),
      ],
    });

    const last = result.messages[result.messages.length - 1];
    const text = typeof last.content === 'string' ? last.content : JSON.stringify(last.content);
    process.stdout.write(`  LangGraph   : ${text.slice(0, 120)}${text.length > 120 ? '...' : ''}\n`);

    const jsonMatch = text.match(/\{[\s\S]*"action"[\s\S]*"reasoning"[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]) as { action: Record<string, unknown>; reasoning: string };
      action = parsed.action;
      reasoning = parsed.reasoning;
      inputs = { pair, source: 'langgraph_stategraph' };
    }
  } catch (err) {
    process.stdout.write(`  LLM error   : ${String(err).slice(0, 80)}\n`);
    process.stdout.write(`  Fallback    : rule-based engine\n`);
    const fb = ruleFallback(pair);
    action = fb.action;
    reasoning = fb.reasoning;
    inputs = fb.inputs;
  }

  process.stdout.write(`  Action      : ${JSON.stringify(action)}\n`);
  process.stdout.write(`  Reasoning   : ${reasoning.slice(0, 110)}\n`);

  const rootHash = await attestToAegis(action, reasoning, inputs);
  process.stdout.write(`  rootHash    : ${rootHash}\n`);
  process.stdout.write(`  AXL + Aegis : attested\n`);
}

async function run(): Promise<void> {
  process.stdout.write('\n=== mit-bot.aegis.eth — LangGraph StateGraph agent + Aegis attestation ===\n');
  process.stdout.write(`Framework   : LangGraph 1.x (StateGraph + ToolNode — non-deprecated)\n`);
  process.stdout.write(`LLM         : ${process.env.ZG_COMPUTE_MODEL ?? 'qwen/qwen-2.5-7b-instruct'} via 0G Compute\n`);
  process.stdout.write(`Tools       : get_market_data · get_portfolio · check_risk_limits\n`);
  process.stdout.write(`Witness     : ${WITNESS_AXL_URL} → peer ${WITNESS_PEER_ID.slice(0, 16)}...\n`);

  const agent = buildAgent();
  const pairs = ['OG/USDC', 'OG/ETH', 'ETH/USDC'];

  for (let i = 0; i < pairs.length; i++) {
    await runDecision(agent, pairs[i], i + 1);
  }

  process.stdout.write('\n=== All decisions attested to Aegis ===\n');
  process.stdout.write('Dashboard  : http://localhost:4000/app/attestations\n');
  process.stdout.write('Agent      : http://localhost:4000/app/agents → search mit-bot\n\n');
}

run().catch((err) => {
  process.stderr.write(`Fatal: ${String(err)}\n`);
  process.exit(1);
});
