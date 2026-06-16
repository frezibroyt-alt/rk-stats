"use client";
// Lightweight SVG area chart — no charting library needed.
export default function TrophyChart({ points = [], height = 160 }) {
  if (!points.length) return <div className="empty">No history yet.</div>;
  const W = 600, H = height, pad = 8;
  const xs = points.map((p) => p.t);
  const ys = points.map((p) => p.v);
  const minX = Math.min(...xs), maxX = Math.max(...xs);
  const minY = Math.min(...ys), maxY = Math.max(...ys);
  const spanX = maxX - minX || 1, spanY = maxY - minY || 1;
  const X = (t) => pad + ((t - minX) / spanX) * (W - pad * 2);
  const Y = (v) => H - pad - ((v - minY) / spanY) * (H - pad * 2);

  const line = points.map((p, i) => `${i ? "L" : "M"}${X(p.t).toFixed(1)},${Y(p.v).toFixed(1)}`).join(" ");
  const area = `${line} L${X(maxX).toFixed(1)},${H - pad} L${X(minX).toFixed(1)},${H - pad} Z`;

  return (
    <div className="chart-wrap">
      <svg viewBox={`0 0 ${W} ${H}`} width="100%" height={H} preserveAspectRatio="none" role="img" aria-label="Trophy history">
        <defs>
          <linearGradient id="tg" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#ff8a1e" stopOpacity="0.45" />
            <stop offset="100%" stopColor="#ff8a1e" stopOpacity="0" />
          </linearGradient>
        </defs>
        <path d={area} fill="url(#tg)" />
        <path d={line} fill="none" stroke="#ffd21e" strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" />
      </svg>
      <div className="row" style={{ justifyContent: "space-between", marginTop: 6 }}>
        <span className="muted" style={{ fontSize: 12 }}>{maxY.toLocaleString()} max</span>
        <span className="muted" style={{ fontSize: 12 }}>{minY.toLocaleString()} min</span>
      </div>
    </div>
  );
}
