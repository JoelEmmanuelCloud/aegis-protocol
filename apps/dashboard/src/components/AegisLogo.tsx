interface AegisLogoProps {
  variant?: 'dark' | 'light' | 'purple' | 'gold';
  size?: number;
  showWordmark?: boolean;
  wordmarkColor?: string;
}

export default function AegisLogo({
  variant = 'dark',
  size = 40,
  showWordmark = false,
  wordmarkColor,
}: AegisLogoProps) {
  const fills = {
    dark: {
      bg: '#0a0a08',
      mark: '#ffffff',
      accent: 'rgba(255,255,255,0.15)',
      node: '#ffffff',
      line: 'rgba(255,255,255,0.5)',
    },
    light: {
      bg: '#ffffff',
      mark: '#0a0a08',
      accent: 'rgba(10,10,8,0.08)',
      node: '#0a0a08',
      line: 'rgba(10,10,8,0.35)',
    },
    purple: {
      bg: '#7c3aed',
      mark: '#ffffff',
      accent: 'rgba(255,255,255,0.18)',
      node: '#ffffff',
      line: 'rgba(255,255,255,0.55)',
    },
    gold: {
      bg: '#d4941a',
      mark: '#0a0a08',
      accent: 'rgba(10,10,8,0.10)',
      node: '#0a0a08',
      line: 'rgba(10,10,8,0.38)',
    },
  };

  const c = fills[variant];
  const wc = wordmarkColor ?? c.mark;
  const iconSize = size;

  return (
    <div style={{ display: 'inline-flex', alignItems: 'center', gap: Math.round(iconSize * 0.3) }}>
      <svg
        width={iconSize}
        height={Math.round(iconSize * 1.15)}
        viewBox="0 0 48 55"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M24 2L44 11.5V31C44 42.5 35.5 51.5 24 53.5C12.5 51.5 4 42.5 4 31V11.5L24 2Z"
          fill={c.bg}
        />

        <path
          d="M24 6L41 14.5V30.5C41 40.5 33.5 48.5 24 50.5C14.5 48.5 7 40.5 7 30.5V14.5L24 6Z"
          fill="none"
          stroke={c.accent}
          strokeWidth="1"
        />

        <line
          x1="24"
          y1="15"
          x2="16"
          y2="34"
          stroke={c.line}
          strokeWidth="1.25"
          strokeLinecap="round"
        />
        <line
          x1="24"
          y1="15"
          x2="32"
          y2="34"
          stroke={c.line}
          strokeWidth="1.25"
          strokeLinecap="round"
        />
        <line
          x1="16"
          y1="34"
          x2="32"
          y2="34"
          stroke={c.line}
          strokeWidth="1.25"
          strokeLinecap="round"
        />

        <circle cx="24" cy="15" r="3.5" fill={c.node} />
        <circle cx="16" cy="34" r="3.5" fill={c.node} />
        <circle cx="32" cy="34" r="3.5" fill={c.node} />

        <circle cx="24" cy="15" r="6" fill={c.mark} fillOpacity="0.12" />
        <circle cx="16" cy="34" r="6" fill={c.mark} fillOpacity="0.12" />
        <circle cx="32" cy="34" r="6" fill={c.mark} fillOpacity="0.12" />
      </svg>

      {showWordmark && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 0, lineHeight: 1 }}>
          <span
            style={{
              fontWeight: 800,
              fontSize: Math.round(iconSize * 0.42),
              letterSpacing: '-0.035em',
              color: wc,
              lineHeight: 1.1,
            }}
          >
            aegis
          </span>
          <span
            style={{
              fontWeight: 600,
              fontSize: Math.round(iconSize * 0.31),
              letterSpacing: '0.07em',
              textTransform: 'uppercase',
              color: wc,
              opacity: 0.8,
              lineHeight: 1.2,
            }}
          >
            protocol
          </span>
        </div>
      )}
    </div>
  );
}
