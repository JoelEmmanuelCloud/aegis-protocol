export default function OwnershipSlider({
  userPercent,
  onChange,
}: {
  userPercent: number;
  onChange: (v: number) => void;
}) {
  return (
    <div className="flex flex-col gap-2">
      <div className="flex justify-between text-[13px]">
        <span className="text-aegis-purple-light">User: {userPercent}%</span>
        <span className="text-aegis-muted">Builder: {100 - userPercent}%</span>
      </div>
      <input
        type="range"
        min={0}
        max={100}
        value={userPercent}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full cursor-pointer"
        style={{ accentColor: 'var(--color-aegis-purple)' }}
      />
      <div
        className="h-1 rounded-sm"
        style={{
          background: `linear-gradient(to right, var(--color-aegis-purple) ${userPercent}%, var(--color-aegis-border-solid) ${userPercent}%)`,
        }}
      />
    </div>
  );
}
