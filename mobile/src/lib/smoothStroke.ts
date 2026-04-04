/**
 * Lightweight smoothing for jittery touch / proxy “hand” traces.
 * Replace with learned predictor when you ship on-device hand tracking.
 */
export function smoothStroke(
  points: { x: number; y: number }[],
  window = 3
): { x: number; y: number }[] {
  if (points.length < window) return points;
  const out: { x: number; y: number }[] = [];
  for (let i = 0; i < points.length; i++) {
    const a = Math.max(0, i - Math.floor(window / 2));
    const b = Math.min(points.length, a + window);
    let sx = 0;
    let sy = 0;
    let n = 0;
    for (let j = a; j < b; j++) {
      sx += points[j].x;
      sy += points[j].y;
      n++;
    }
    out.push({ x: sx / n, y: sy / n });
  }
  return out;
}
