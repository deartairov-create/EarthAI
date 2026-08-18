export function mulberry32(seed: number) {
  return function () {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
export function clamp(v: number, min = 0, max = 100) { return Math.max(min, Math.min(max, v)); }
export function pick<T>(items: T[], r: () => number) { return items[Math.floor(r() * items.length)]!; }
export function uid(prefix: string, n: number) { return `${prefix}-${n.toString(36)}`; }
