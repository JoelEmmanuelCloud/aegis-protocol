import OpenAI from 'openai';
import type { Verdict } from '@aegis/types';

let client: OpenAI | null = null;

function getClient(): OpenAI {
  if (!client) {
    client = new OpenAI({
      baseURL: process.env.ZG_COMPUTE_BASE_URL!,
      apiKey: process.env.ZG_COMPUTE_API_KEY!,
    });
  }
  return client;
}

const MODEL = process.env.ZG_COMPUTE_MODEL ?? 'qwen/qwen-2.5-7b-instruct';

export interface ReplayResult {
  output: string;
  teeProof: string;
  verdict: Verdict;
}

export async function replayDecision(
  originalInputs: Record<string, unknown>,
  originalOutput: Record<string, unknown>
): Promise<ReplayResult> {
  const prompt = JSON.stringify(originalInputs);

  const response = await getClient().chat.completions.create({
    model: MODEL,
    messages: [{ role: 'user', content: prompt }],
  });

  const choice = response.choices[0];
  const replayOutput = choice.message.content ?? '';
  const teeProof = ((response as unknown as Record<string, unknown>).teeProof as string) ?? '';

  const originalAction = JSON.stringify(originalOutput);
  const replayAction = replayOutput.trim();

  const verdict: Verdict = replayAction.includes(originalAction.slice(0, 50))
    ? 'CLEARED'
    : 'FLAGGED';

  return { output: replayOutput, teeProof, verdict };
}
