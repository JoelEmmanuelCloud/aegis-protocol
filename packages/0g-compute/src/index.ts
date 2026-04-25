import OpenAI from 'openai';
import type { Verdict } from '@aegis/types';

const client = new OpenAI({
  baseURL: process.env.ZG_COMPUTE_BASE_URL!,
  apiKey: process.env.ZG_COMPUTE_API_KEY!,
});

const MODEL = process.env.ZG_COMPUTE_MODEL ?? 'qwen3.6-plus';

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

  const response = await client.chat.completions.create({
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
