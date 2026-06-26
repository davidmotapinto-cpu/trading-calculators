// Pure SVG path helpers — no React, no DOM. Kept separate from ProfitChart so
// the curve-fitting/zone-splitting logic is independently testable.

// Catmull-Rom-to-cubic-Bezier smoothing through a polyline. Produces the
// curved (not straight-segment) look of a real charting library.
export function smoothPath(points) {
  if (points.length < 2) return "";
  if (points.length === 2) return `M ${points[0].x} ${points[0].y} L ${points[1].x} ${points[1].y}`;

  let d = `M ${points[0].x} ${points[0].y}`;
  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[i - 1] || points[i];
    const p1 = points[i];
    const p2 = points[i + 1];
    const p3 = points[i + 2] || p2;
    const cp1x = p1.x + (p2.x - p0.x) / 6;
    const cp1y = p1.y + (p2.y - p0.y) / 6;
    const cp2x = p2.x - (p3.x - p1.x) / 6;
    const cp2y = p2.y - (p3.y - p1.y) / 6;
    d += ` C ${cp1x.toFixed(2)} ${cp1y.toFixed(2)}, ${cp2x.toFixed(2)} ${cp2y.toFixed(2)}, ${p2.x.toFixed(2)} ${p2.y.toFixed(2)}`;
  }
  return d;
}

// Splits a profit/loss curve into contiguous above/below-zero runs, inserting
// an interpolated zero-crossing point at each sign change, so each run can be
// filled as its own green/red zone instead of one curve that ignores sign.
export function splitZones(points) {
  const zones = [];
  let current = [];
  let sign = null;

  for (let i = 0; i < points.length; i++) {
    const p = points[i];
    const pSign = p.value >= 0 ? 1 : -1;
    if (sign === null) sign = pSign;

    if (pSign !== sign) {
      const prev = points[i - 1];
      const t = prev.value / (prev.value - p.value);
      const crossX = prev.x + (p.x - prev.x) * t;
      const crossY = prev.y + (p.y - prev.y) * t;
      const crossPoint = { x: crossX, y: crossY, value: 0 };
      current.push(crossPoint);
      zones.push({ sign, points: current });
      current = [crossPoint];
      sign = pSign;
    }
    current.push(p);
  }
  if (current.length) zones.push({ sign, points: current });
  return zones;
}

export function areaPath(zonePoints, baselineY) {
  const curve = smoothPath(zonePoints);
  const first = zonePoints[0];
  const last = zonePoints[zonePoints.length - 1];
  return `${curve} L ${last.x.toFixed(2)} ${baselineY} L ${first.x.toFixed(2)} ${baselineY} Z`;
}
