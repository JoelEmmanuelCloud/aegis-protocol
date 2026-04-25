import { RadialBarChart, RadialBar, PolarAngleAxis } from 'recharts';

function scoreColor(score: number): string {
  if (score >= 80) return 'var(--color-aegis-green)';
  if (score >= 50) return 'var(--color-aegis-amber)';
  return 'var(--color-aegis-red)';
}

export default function ReputationScore({ score }: { score: number }) {
  const color = scoreColor(score);
  const data = [{ value: score, fill: color }];

  return (
    <div className="relative w-40 h-40">
      <RadialBarChart
        width={160}
        height={160}
        cx={80}
        cy={80}
        innerRadius={52}
        outerRadius={72}
        barSize={14}
        data={data}
        startAngle={90}
        endAngle={-270}
      >
        <PolarAngleAxis type="number" domain={[0, 100]} angleAxisId={0} tick={false} />
        <RadialBar
          dataKey="value"
          cornerRadius={8}
          angleAxisId={0}
          background={{ fill: 'var(--color-aegis-border-solid)' }}
        />
      </RadialBarChart>
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center">
        <div style={{ fontSize: 30, fontWeight: 700, color, lineHeight: 1 }}>{score}</div>
        <div className="text-[11px] text-aegis-muted mt-0.5">/ 100</div>
      </div>
    </div>
  );
}
