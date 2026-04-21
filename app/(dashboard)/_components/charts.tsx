/* ---------- Donut ---------- */

type DonutDatum = { key: string; label: string; value: number; color?: string };

const DONUT_PALETTE = [
  "rgb(var(--chart-1))",
  "rgb(var(--chart-2))",
  "rgb(var(--chart-3))",
  "rgb(var(--chart-4))",
  "rgb(var(--chart-5))",
  "rgb(var(--chart-6))",
  "rgb(var(--chart-7))",
];

export function Donut({
  data,
  size = 220,
  thickness = 18,
  centerLabel,
  centerValue,
}: {
  data: DonutDatum[];
  size?: number;
  thickness?: number;
  centerLabel?: string;
  centerValue?: string;
}) {
  const total = data.reduce((s, d) => s + d.value, 0) || 1;
  const radius = size / 2 - thickness / 2;
  const circumference = 2 * Math.PI * radius;
  const cx = size / 2;
  const cy = size / 2;

  let offset = 0;
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="block">
      <circle
        cx={cx}
        cy={cy}
        r={radius}
        fill="none"
        stroke="rgb(var(--chart-primary) / 0.2)"
        strokeWidth={thickness}
      />
      {data.map((d, i) => {
        if (d.value === 0) return null;
        const frac = d.value / total;
        const dash = frac * circumference;
        const el = (
          <circle
            key={d.key}
            cx={cx}
            cy={cy}
            r={radius}
            fill="none"
            stroke={d.color ?? DONUT_PALETTE[i % DONUT_PALETTE.length]}
            strokeWidth={thickness}
            strokeDasharray={`${dash} ${circumference - dash}`}
            strokeDashoffset={-offset}
            transform={`rotate(-90 ${cx} ${cy})`}
            strokeLinecap="butt"
          />
        );
        offset += dash;
        return el;
      })}
      {centerValue ? (
        <g>
          <text
            x={cx}
            y={cy - 6}
            textAnchor="middle"
            className="fill-ink"
            style={{
              font: "300 28px 'Fraunces', Georgia, serif",
              letterSpacing: "-0.02em",
            }}
          >
            {centerValue}
          </text>
          {centerLabel ? (
            <text
              x={cx}
              y={cy + 14}
              textAnchor="middle"
              className="fill-ink-3"
              style={{
                font: "500 10px 'Inter', sans-serif",
                letterSpacing: "0.14em",
                textTransform: "uppercase",
              }}
            >
              {centerLabel}
            </text>
          ) : null}
        </g>
      ) : null}
    </svg>
  );
}

/* ---------- Horizontal Bars ---------- */

export function BarList({
  rows,
  format = (n) => n.toLocaleString(),
  color = "rgb(var(--chart-primary))",
  rightLabel,
}: {
  rows: { key: string; label: string; sub?: string; value: number }[];
  format?: (n: number) => string;
  color?: string;
  rightLabel?: (n: number) => string;
}) {
  const max = Math.max(1, ...rows.map((r) => r.value));
  return (
    <div className="space-y-4">
      {rows.map((r) => {
        const w = (r.value / max) * 100;
        return (
          <div key={r.key} className="group">
            <div className="flex items-baseline justify-between gap-4">
              <div className="min-w-0">
                <p className="text-[13px] text-ink truncate">{r.label}</p>
                {r.sub ? (
                  <p className="text-[11px] uppercase tracking-wide-2 text-ink-4 mt-0.5">
                    {r.sub}
                  </p>
                ) : null}
              </div>
              <p className="numeric text-[15px] text-ink">
                {rightLabel ? rightLabel(r.value) : format(r.value)}
              </p>
            </div>
            <div className="mt-2 h-[3px] bg-hair rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all"
                style={{ width: `${w}%`, backgroundColor: color }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}

/* ---------- Journey Ribbon ---------- */

type JourneyStep = {
  stage: string;
  label: string;
  count: number;
  kind?: "ACTIVE" | "WON" | "LOST";
};

export function JourneyRibbon({
  steps,
  totalHint,
}: {
  steps: JourneyStep[];
  totalHint?: number;
}) {
  const total = (totalHint ?? steps.reduce((s, x) => s + x.count, 0)) || 1;
  return (
    <div className="relative">
      <div className="absolute top-[34px] left-0 right-0 h-px bg-hair-2" aria-hidden />
      <div
        className="grid gap-0"
        style={{ gridTemplateColumns: `repeat(${steps.length}, minmax(0, 1fr))` }}
      >
        {steps.map((s, i) => {
          const pct = Math.round((s.count / total) * 100);
          const isLost = s.kind === "LOST";
          return (
            <div key={s.stage} className="flex flex-col items-center text-center px-2">
              <p className="text-[10px] uppercase tracking-wide-3 text-ink-3 h-4">
                {s.label}
              </p>
              <div className="mt-3 relative z-10">
                <div
                  className={`h-[18px] w-[18px] rounded-full border-2 transition-colors ${
                    isLost
                      ? "bg-paper border-danger/40"
                      : s.count > 0
                      ? "bg-ink border-ink"
                      : "bg-paper border-hair-3"
                  }`}
                />
              </div>
              <p className="mt-5 font-display text-[28px] leading-none tracking-tight-3 font-light">
                {s.count}
              </p>
              <p className="mt-1 text-[11px] numeric text-ink-3">{pct}%</p>
              {i < steps.length - 1 ? (
                <span className="sr-only">leads to</span>
              ) : null}
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ---------- Sparkline ---------- */

export function Sparkline({
  values,
  width = 120,
  height = 32,
  color = "rgb(var(--chart-primary))",
}: {
  values: number[];
  width?: number;
  height?: number;
  color?: string;
}) {
  if (values.length === 0) return null;
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;
  const step = values.length > 1 ? width / (values.length - 1) : 0;
  const points = values
    .map((v, i) => {
      const x = i * step;
      const y = height - ((v - min) / range) * height;
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");

  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} className="block">
      <polyline
        fill="none"
        stroke={color}
        strokeWidth="1.25"
        strokeLinecap="round"
        strokeLinejoin="round"
        points={points}
      />
    </svg>
  );
}

/* ---------- Vertical bar chart ---------- */

export function BarsChart({
  data,
  height = 180,
  format = (n) => n.toLocaleString(),
  color = "rgb(var(--chart-primary))",
}: {
  data: { key: string; label: string; value: number }[];
  height?: number;
  format?: (n: number) => string;
  color?: string;
}) {
  const max = Math.max(1, ...data.map((d) => d.value));
  return (
    <div className="flex items-end gap-3" style={{ height }}>
      {data.map((d) => {
        const h = (d.value / max) * (height - 36);
        return (
          <div key={d.key} className="flex-1 flex flex-col items-center gap-2 min-w-0">
            <p className="numeric text-[11px] text-ink-3">{format(d.value)}</p>
            <div
              className="w-full rounded-t-md transition-all"
              style={{
                height: Math.max(h, 2),
                background: color,
              }}
            />
            <p className="text-[10px] uppercase tracking-wide-2 text-ink-3 truncate w-full text-center">
              {d.label}
            </p>
          </div>
        );
      })}
    </div>
  );
}
