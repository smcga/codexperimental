import { describe, expect, it } from 'vitest';
import {
  dropTime,
  effectWindows,
  getActiveTextIndex,
  lineEnds,
  lineStarts,
  textLines
} from '../src/timeline';

describe('timeline', () => {
  it('returns correct active text index', () => {
    for (let i = 0; i < textLines.length; i += 1) {
      const midpoint = (lineStarts[i] + lineEnds[i]) / 2;
      expect(getActiveTextIndex(midpoint)).toBe(i);
    }
  });

  it('drop time follows line 6 appearance within 2 seconds', () => {
    const lineSixStart = lineStarts[5];
    expect(dropTime).toBeGreaterThan(lineSixStart);
    expect(dropTime - lineSixStart).toBeLessThanOrEqual(2);
  });

  it('does not overlap heavy effects excessively', () => {
    const heavyEffects = new Set(['plasma', 'tunnel']);
    const end = Math.max(...effectWindows.map((effect) => effect.end));
    for (let t = 0; t <= end; t += 0.25) {
      const active = effectWindows.filter(
        (effect) => t >= effect.start && t <= effect.end && heavyEffects.has(effect.name)
      );
      expect(active.length).toBeLessThanOrEqual(1);
    }
  });
});
