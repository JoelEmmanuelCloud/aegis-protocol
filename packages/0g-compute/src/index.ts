import type { Verdict } from '@aegis/types';

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

  const res = await fetch(`${process.env.ZG_COMPUTE_BASE_URL}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${process.env.ZG_COMPUTE_API_KEY}`,
    },
    body: JSON.stringify({
      model: MODEL,
      messages: [{ role: 'user', content: prompt }],
      verify_tee: true,
    }),
  });

  if (!res.ok) {
    throw new Error(`0G Compute error: ${res.status} ${await res.text()}`);
  }

  const data = (await res.json()) as {
    choices: Array<{ message: { content: string | null } }>;
    id: string;
    x_0g_trace?: { provider?: string; tee_verified?: boolean };
  };

  const replayOutput = data.choices[0]?.message.content ?? '';
  const chatId = res.headers.get('zg-res-key') ?? res.headers.get('ZG-Res-Key') ?? data.id ?? '';

  const originalAction = JSON.stringify(originalOutput);
  const verdict: Verdict = replayOutput.trim().includes(originalAction.slice(0, 50))
    ? 'CLEARED'
    : 'FLAGGED';

  return { output: replayOutput, teeProof: chatId, verdict };
}
