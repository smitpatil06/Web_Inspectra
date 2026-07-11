interface Props {
  score: number;
  label: string;
  subtitle?: string;
  size?: number;
}

export default function ScoreGauge({ score, label, subtitle, size = 100 }: Props) {
  const clamped = Math.max(0, Math.min(100, score));
  const radius = size * 0.38;
  const stroke = size * 0.08;
  const circumference = 2 * Math.PI * radius;
  const arc = circumference * 0.75; // 270° arc
  const offset = arc - (clamped / 100) * arc;
  const cx = size / 2;
  const cy = size / 2;
  const startAngle = 135;
  const endAngle = 405;

  const color =
    clamped >= 85 ? "#34d399" :
    clamped >= 65 ? "#22d3ee" :
    clamped >= 45 ? "#fbbf24" :
    clamped >= 25 ? "#fb923c" :
    "#f87171";

  const trackColor = "rgba(255,255,255,0.05)";

  // Arc path for the gauge track
  const polarToCartesian = (angle: number) => {
    const rad = ((angle - 90) * Math.PI) / 180;
    return { x: cx + radius * Math.cos(rad), y: cy + radius * Math.sin(rad) };
  };
  const s = polarToCartesian(startAngle);
  const e = polarToCartesian(endAngle - 0.01);
  const arcPath = `M ${s.x} ${s.y} A ${radius} ${radius} 0 1 1 ${e.x} ${e.y}`;

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} style={{ transform: "rotate(0deg)" }}>
          {/* Track */}
          <path d={arcPath} fill="none" stroke={trackColor} strokeWidth={stroke} strokeLinecap="round" />
          {/* Value arc */}
          <path
            d={arcPath}
            fill="none"
            stroke={color}
            strokeWidth={stroke}
            strokeLinecap="round"
            strokeDasharray={arc}
            strokeDashoffset={offset}
            style={{
              transition: "stroke-dashoffset 1s cubic-bezier(0.16,1,0.3,1), stroke 0.5s ease",
              filter: `drop-shadow(0 0 6px ${color}80)`,
            }}
          />
          {/* Center score */}
          <text
            x={cx}
            y={cy - size * 0.02}
            textAnchor="middle"
            dominantBaseline="middle"
            fill={color}
            fontFamily="JetBrains Mono, monospace"
            fontWeight="700"
            fontSize={size * 0.22}
          >
            {clamped}
          </text>
        </svg>
      </div>
      <div className="text-center">
        <p className="text-xs font-semibold text-slate-300 uppercase tracking-widest">{label}</p>
        {subtitle && <p className="text-[10px] text-slate-500 mt-0.5 font-mono">{subtitle}</p>}
      </div>
    </div>
  );
}
